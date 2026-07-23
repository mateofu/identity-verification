from dataclasses import dataclass
from typing import Protocol

import numpy as np
from numpy.typing import NDArray

from app.adapters.opencv_face_adapter import FaceComparison, FaceQualityMetrics
from app.schemas.verification import (
    FaceDetectionSummary,
    FaceQualitySummary,
    VerificationDecision,
    VerificationResponse,
)
from app.services.image_service import ImageService


class FaceComparator(Protocol):
    def compare(
        self,
        selfie_image: NDArray[np.uint8],
        document_image: NDArray[np.uint8],
    ) -> FaceComparison: ...


@dataclass(frozen=True, slots=True)
class FaceQualityThresholds:
    minimum_detection_confidence: float
    minimum_selfie_relative_area: float
    minimum_document_relative_area: float
    minimum_selfie_dimension_pixels: float
    minimum_document_dimension_pixels: float
    minimum_sharpness: float
    minimum_luminance: float
    maximum_luminance: float


class VerificationService:
    def __init__(
        self,
        image_service: ImageService,
        face_adapter: FaceComparator,
        match_threshold: float,
        quality_thresholds: FaceQualityThresholds,
    ) -> None:
        self._image_service = image_service
        self._face_adapter = face_adapter
        self._match_threshold = match_threshold
        self._quality_thresholds = quality_thresholds

    def verify(
        self,
        selfie_content: bytes,
        selfie_media_type: str | None,
        document_content: bytes,
        document_media_type: str | None,
    ) -> VerificationResponse:
        selfie_image = self._image_service.decode(
            selfie_content, selfie_media_type, "selfie"
        )
        document_image = self._image_service.decode(
            document_content, document_media_type, "document"
        )
        comparison = self._face_adapter.compare(selfie_image, document_image)

        normalized_similarity = min(max(comparison.cosine_similarity, 0.0), 1.0)
        quality_warnings = self._get_quality_warnings(comparison)
        decision = self._get_decision(comparison, quality_warnings)

        return VerificationResponse(
            matched=decision == VerificationDecision.MATCH,
            decision=decision,
            similarity_percentage=round(normalized_similarity * 100, 2),
            threshold_percentage=round(self._match_threshold * 100, 2),
            detected_faces=FaceDetectionSummary(
                selfie=comparison.selfie_face_count,
                document=comparison.document_face_count,
            ),
            quality=FaceQualitySummary(
                selfie_detection_confidence=round(
                    comparison.selfie_quality.detection_confidence * 100, 2
                ),
                document_detection_confidence=round(
                    comparison.document_quality.detection_confidence * 100, 2
                ),
                warnings=quality_warnings,
            ),
        )

    def _get_quality_warnings(self, comparison: FaceComparison) -> list[str]:
        return [
            *self._evaluate_face_quality(comparison.selfie_quality, "SELFIE"),
            *self._evaluate_face_quality(comparison.document_quality, "DOCUMENT"),
        ]

    def _evaluate_face_quality(
        self, metrics: FaceQualityMetrics, field_name: str
    ) -> list[str]:
        warnings: list[str] = []
        thresholds = self._quality_thresholds
        minimum_relative_area = (
            thresholds.minimum_selfie_relative_area
            if field_name == "SELFIE"
            else thresholds.minimum_document_relative_area
        )
        minimum_dimension = (
            thresholds.minimum_selfie_dimension_pixels
            if field_name == "SELFIE"
            else thresholds.minimum_document_dimension_pixels
        )

        if metrics.detection_confidence < thresholds.minimum_detection_confidence:
            warnings.append(f"LOW_{field_name}_FACE_CONFIDENCE")
        if (
            metrics.relative_area < minimum_relative_area
            or metrics.minimum_dimension_pixels < minimum_dimension
        ):
            warnings.append(f"{field_name}_FACE_TOO_SMALL")
        if metrics.sharpness < thresholds.minimum_sharpness:
            warnings.append(f"LOW_{field_name}_FACE_SHARPNESS")
        if not (
            thresholds.minimum_luminance
            <= metrics.mean_luminance
            <= thresholds.maximum_luminance
        ):
            warnings.append(f"POOR_{field_name}_FACE_EXPOSURE")

        return warnings

    def _get_decision(
        self, comparison: FaceComparison, quality_warnings: list[str]
    ) -> VerificationDecision:
        if quality_warnings:
            return VerificationDecision.INCONCLUSIVE
        if comparison.cosine_similarity >= self._match_threshold:
            return VerificationDecision.MATCH
        return VerificationDecision.NO_MATCH
