import os
from dataclasses import dataclass


def get_allowed_origins() -> tuple[str, ...]:
    configured_origins = os.getenv(
        "ALLOWED_ORIGINS",
        os.getenv("ALLOWED_ORIGIN", "http://localhost:5173"),
    )
    return tuple(
        origin.strip() for origin in configured_origins.split(",") if origin.strip()
    )


@dataclass(frozen=True, slots=True)
class Settings:
    application_name: str = "Identity Verification API"
    application_version: str = "0.1.0"
    allowed_origins: tuple[str, ...] = get_allowed_origins()
    maximum_image_size_bytes: int = int(
        os.getenv("MAXIMUM_IMAGE_SIZE_BYTES", str(10 * 1024 * 1024))
    )
    maximum_image_pixels: int = int(os.getenv("MAXIMUM_IMAGE_PIXELS", "20000000"))
    maximum_processing_image_pixels: int = int(
        os.getenv("MAXIMUM_PROCESSING_IMAGE_PIXELS", "2000000")
    )
    face_match_threshold: float = float(os.getenv("FACE_MATCH_THRESHOLD", "0.363"))
    minimum_conclusive_face_confidence: float = float(
        os.getenv("MINIMUM_CONCLUSIVE_FACE_CONFIDENCE", "0.65")
    )
    minimum_selfie_face_relative_area: float = float(
        os.getenv("MINIMUM_SELFIE_FACE_RELATIVE_AREA", "0.035")
    )
    minimum_document_face_relative_area: float = float(
        os.getenv("MINIMUM_DOCUMENT_FACE_RELATIVE_AREA", "0.003")
    )
    minimum_selfie_face_dimension_pixels: float = float(
        os.getenv("MINIMUM_SELFIE_FACE_DIMENSION_PIXELS", "100")
    )
    minimum_document_face_dimension_pixels: float = float(
        os.getenv("MINIMUM_DOCUMENT_FACE_DIMENSION_PIXELS", "80")
    )
    minimum_face_sharpness: float = float(os.getenv("MINIMUM_FACE_SHARPNESS", "25"))
    minimum_face_luminance: float = float(os.getenv("MINIMUM_FACE_LUMINANCE", "45"))
    maximum_face_luminance: float = float(os.getenv("MAXIMUM_FACE_LUMINANCE", "215"))
    face_detection_score_threshold: float = float(
        os.getenv("FACE_DETECTION_SCORE_THRESHOLD", "0.75")
    )
    document_face_detection_score_threshold: float = float(
        os.getenv("DOCUMENT_FACE_DETECTION_SCORE_THRESHOLD", "0.5")
    )
    face_detection_model_path: str = os.getenv(
        "FACE_DETECTION_MODEL_PATH", "/app/models/face_detection_yunet.onnx"
    )
    face_recognition_model_path: str = os.getenv(
        "FACE_RECOGNITION_MODEL_PATH", "/app/models/face_recognition_sface.onnx"
    )


settings = Settings()
