from enum import StrEnum

from pydantic import BaseModel, Field

from app.core.errors import ErrorCode


class FaceDetectionSummary(BaseModel):
    selfie: int = Field(ge=0)
    document: int = Field(ge=0)


class VerificationDecision(StrEnum):
    MATCH = "match"
    NO_MATCH = "no_match"
    INCONCLUSIVE = "inconclusive"


class FaceQualitySummary(BaseModel):
    selfie_detection_confidence: float = Field(ge=0, le=100)
    document_detection_confidence: float = Field(ge=0, le=100)
    warnings: list[str]


class VerificationResponse(BaseModel):
    matched: bool
    decision: VerificationDecision
    similarity_percentage: float = Field(ge=0, le=100)
    threshold_percentage: float = Field(ge=0, le=100)
    detected_faces: FaceDetectionSummary
    quality: FaceQualitySummary


class ErrorResponse(BaseModel):
    code: ErrorCode
    message: str
    field: str | None = None
