from collections.abc import Iterator

import pytest
from app.api.dependencies import get_verification_service
from app.core.errors import ErrorCode, ImageValidationError
from app.main import app
from app.schemas.verification import (
    FaceDetectionSummary,
    FaceQualitySummary,
    VerificationDecision,
    VerificationResponse,
)
from fastapi.testclient import TestClient


class StubVerificationService:
    def verify(
        self,
        selfie_content: bytes,
        selfie_media_type: str | None,
        document_content: bytes,
        document_media_type: str | None,
    ) -> VerificationResponse:
        assert selfie_content == b"selfie-content"
        assert selfie_media_type == "image/jpeg"
        assert document_content == b"document-content"
        assert document_media_type == "image/png"
        return VerificationResponse(
            matched=True,
            decision=VerificationDecision.MATCH,
            similarity_percentage=53.39,
            threshold_percentage=36.3,
            detected_faces=FaceDetectionSummary(selfie=1, document=1),
            quality=FaceQualitySummary(
                selfie_detection_confidence=92.1,
                document_detection_confidence=78.4,
                warnings=[],
            ),
        )


class RejectingVerificationService:
    def verify(
        self,
        _selfie_content: bytes,
        _selfie_media_type: str | None,
        _document_content: bytes,
        _document_media_type: str | None,
    ) -> VerificationResponse:
        raise ImageValidationError(
            ErrorCode.UNSUPPORTED_IMAGE_TYPE,
            "document must be a JPEG, PNG or WebP image.",
            field="document",
        )


@pytest.fixture
def client() -> Iterator[TestClient]:
    app.dependency_overrides[get_verification_service] = StubVerificationService
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_health_endpoint_is_public(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["cache-control"] == "no-store"


def test_create_verification_returns_public_contract(client: TestClient) -> None:
    response = client.post(
        "/api/v1/verifications",
        files={
            "selfie": ("selfie.jpg", b"selfie-content", "image/jpeg"),
            "document": ("document.png", b"document-content", "image/png"),
        },
    )

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.json() == {
        "matched": True,
        "decision": "match",
        "similarity_percentage": 53.39,
        "threshold_percentage": 36.3,
        "detected_faces": {"selfie": 1, "document": 1},
        "quality": {
            "selfie_detection_confidence": 92.1,
            "document_detection_confidence": 78.4,
            "warnings": [],
        },
    }


def test_domain_error_returns_public_error_contract(client: TestClient) -> None:
    app.dependency_overrides[get_verification_service] = RejectingVerificationService

    response = client.post(
        "/api/v1/verifications",
        files={
            "selfie": ("selfie.jpg", b"selfie-content", "image/jpeg"),
            "document": ("document.pdf", b"document-content", "application/pdf"),
        },
    )

    assert response.status_code == 415
    assert response.json() == {
        "code": "UNSUPPORTED_IMAGE_TYPE",
        "message": "document must be a JPEG, PNG or WebP image.",
        "field": "document",
    }
