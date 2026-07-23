from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from starlette.concurrency import run_in_threadpool

from app.api.dependencies import get_verification_service
from app.core.config import settings
from app.core.errors import ErrorCode, ImageValidationError
from app.schemas.verification import ErrorResponse, VerificationResponse
from app.services.verification_service import VerificationService

router = APIRouter(prefix="/v1/verifications", tags=["verification"])


async def read_upload_with_limit(upload: UploadFile, field_name: str) -> bytes:
    content = await upload.read(settings.maximum_image_size_bytes + 1)
    if len(content) > settings.maximum_image_size_bytes:
        raise ImageValidationError(
            ErrorCode.IMAGE_TOO_LARGE,
            f"{field_name} exceeds the maximum allowed size.",
            field=field_name,
        )
    return content


@router.post(
    "",
    response_model=VerificationResponse,
    responses={
        400: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        415: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def create_verification(
    selfie: Annotated[UploadFile, File(description="Live selfie image")],
    document: Annotated[UploadFile, File(description="Identity document image")],
    verification_service: Annotated[
        VerificationService, Depends(get_verification_service)
    ],
) -> VerificationResponse:
    try:
        selfie_content = await read_upload_with_limit(selfie, "selfie")
        document_content = await read_upload_with_limit(document, "document")
        return await run_in_threadpool(
            verification_service.verify,
            selfie_content,
            selfie.content_type,
            document_content,
            document.content_type,
        )
    finally:
        await selfie.close()
        await document.close()
