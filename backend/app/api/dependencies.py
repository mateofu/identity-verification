from functools import lru_cache

from app.adapters.opencv_face_adapter import OpenCvFaceAdapter
from app.core.config import settings
from app.services.image_service import ImageService, ImageValidationLimits
from app.services.verification_service import FaceQualityThresholds, VerificationService


@lru_cache(maxsize=1)
def get_verification_service() -> VerificationService:
    image_service = ImageService(
        ImageValidationLimits(
            maximum_size_bytes=settings.maximum_image_size_bytes,
            maximum_pixels=settings.maximum_image_pixels,
        )
    )
    face_adapter = OpenCvFaceAdapter(
        detection_model_path=settings.face_detection_model_path,
        recognition_model_path=settings.face_recognition_model_path,
        detection_score_threshold=settings.face_detection_score_threshold,
        document_detection_score_threshold=(
            settings.document_face_detection_score_threshold
        ),
    )
    return VerificationService(
        image_service=image_service,
        face_adapter=face_adapter,
        match_threshold=settings.face_match_threshold,
        quality_thresholds=FaceQualityThresholds(
            minimum_detection_confidence=settings.minimum_conclusive_face_confidence,
            minimum_selfie_relative_area=settings.minimum_selfie_face_relative_area,
            minimum_document_relative_area=settings.minimum_document_face_relative_area,
            minimum_selfie_dimension_pixels=(
                settings.minimum_selfie_face_dimension_pixels
            ),
            minimum_document_dimension_pixels=(
                settings.minimum_document_face_dimension_pixels
            ),
            minimum_sharpness=settings.minimum_face_sharpness,
            minimum_luminance=settings.minimum_face_luminance,
            maximum_luminance=settings.maximum_face_luminance,
        ),
    )
