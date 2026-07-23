from enum import StrEnum


class ErrorCode(StrEnum):
    INVALID_IMAGE = "INVALID_IMAGE"
    IMAGE_TOO_LARGE = "IMAGE_TOO_LARGE"
    UNSUPPORTED_IMAGE_TYPE = "UNSUPPORTED_IMAGE_TYPE"
    FACE_NOT_FOUND = "FACE_NOT_FOUND"
    MULTIPLE_FACES_FOUND = "MULTIPLE_FACES_FOUND"
    FACE_COMPARISON_FAILED = "FACE_COMPARISON_FAILED"


class DomainError(Exception):
    def __init__(self, code: ErrorCode, message: str, field: str | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.field = field


class ImageValidationError(DomainError):
    pass


class FaceProcessingError(DomainError):
    pass
