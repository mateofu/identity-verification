import cv2
import numpy as np
from app.adapters.opencv_face_adapter import FaceComparison, FaceQualityMetrics
from app.services.image_service import ImageService, ImageValidationLimits
from app.services.verification_service import FaceQualityThresholds, VerificationService


class StubFaceAdapter:
    def __init__(
        self,
        cosine_similarity: float,
        detection_confidence: float,
        document_quality: FaceQualityMetrics | None = None,
    ) -> None:
        self._cosine_similarity = cosine_similarity
        self._detection_confidence = detection_confidence
        self._document_quality = document_quality

    def compare(
        self, _selfie_image: np.ndarray, _document_image: np.ndarray
    ) -> FaceComparison:
        default_quality = FaceQualityMetrics(
            detection_confidence=self._detection_confidence,
            relative_area=0.1,
            minimum_dimension_pixels=200,
            sharpness=100,
            mean_luminance=120,
        )
        return FaceComparison(
            cosine_similarity=self._cosine_similarity,
            selfie_face_count=1,
            document_face_count=1,
            selfie_quality=default_quality,
            document_quality=self._document_quality or default_quality,
        )


def create_jpeg() -> bytes:
    image = np.zeros((10, 10, 3), dtype=np.uint8)
    success, encoded_image = cv2.imencode(".jpg", image)
    assert success
    return encoded_image.tobytes()


def create_service(
    cosine_similarity: float,
    detection_confidence: float = 0.9,
    document_quality: FaceQualityMetrics | None = None,
) -> VerificationService:
    return VerificationService(
        image_service=ImageService(
            ImageValidationLimits(maximum_size_bytes=2048, maximum_pixels=1000)
        ),
        face_adapter=StubFaceAdapter(
            cosine_similarity, detection_confidence, document_quality
        ),
        match_threshold=0.363,
        quality_thresholds=FaceQualityThresholds(
            minimum_detection_confidence=0.65,
            minimum_selfie_relative_area=0.035,
            minimum_document_relative_area=0.003,
            minimum_selfie_dimension_pixels=100,
            minimum_document_dimension_pixels=80,
            minimum_sharpness=25,
            minimum_luminance=45,
            maximum_luminance=215,
        ),
    )


def test_matches_when_similarity_reaches_threshold() -> None:
    result = create_service(0.7).verify(
        create_jpeg(), "image/jpeg", create_jpeg(), "image/jpeg"
    )

    assert result.matched is True
    assert result.decision == "match"
    assert result.similarity_percentage == 70.0
    assert result.threshold_percentage == 36.3


def test_does_not_match_below_threshold() -> None:
    result = create_service(0.2).verify(
        create_jpeg(), "image/jpeg", create_jpeg(), "image/jpeg"
    )

    assert result.matched is False
    assert result.decision == "no_match"
    assert result.similarity_percentage == 20.0


def test_returns_inconclusive_when_non_match_has_low_face_quality() -> None:
    result = create_service(0.2, detection_confidence=0.52).verify(
        create_jpeg(), "image/jpeg", create_jpeg(), "image/jpeg"
    )

    assert result.matched is False
    assert result.decision == "inconclusive"
    assert result.quality.warnings == [
        "LOW_SELFIE_FACE_CONFIDENCE",
        "LOW_DOCUMENT_FACE_CONFIDENCE",
    ]


def test_returns_inconclusive_when_similarity_matches_but_face_quality_is_low() -> None:
    result = create_service(0.7, detection_confidence=0.52).verify(
        create_jpeg(), "image/jpeg", create_jpeg(), "image/jpeg"
    )

    assert result.matched is False
    assert result.decision == "inconclusive"


def test_returns_inconclusive_when_document_face_is_too_small() -> None:
    small_document_face = FaceQualityMetrics(
        detection_confidence=0.9,
        relative_area=0.002,
        minimum_dimension_pixels=55,
        sharpness=100,
        mean_luminance=120,
    )

    result = create_service(0.0, document_quality=small_document_face).verify(
        create_jpeg(), "image/jpeg", create_jpeg(), "image/jpeg"
    )

    assert result.decision == "inconclusive"
    assert result.quality.warnings == ["DOCUMENT_FACE_TOO_SMALL"]


def test_reports_document_sharpness_and_exposure_problems() -> None:
    poor_document_face = FaceQualityMetrics(
        detection_confidence=0.9,
        relative_area=0.01,
        minimum_dimension_pixels=120,
        sharpness=10,
        mean_luminance=230,
    )

    result = create_service(0.0, document_quality=poor_document_face).verify(
        create_jpeg(), "image/jpeg", create_jpeg(), "image/jpeg"
    )

    assert result.decision == "inconclusive"
    assert result.quality.warnings == [
        "LOW_DOCUMENT_FACE_SHARPNESS",
        "POOR_DOCUMENT_FACE_EXPOSURE",
    ]
