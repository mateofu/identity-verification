from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings
from app.core.errors import DomainError, ErrorCode
from app.core.security import SecurityHeadersMiddleware

app = FastAPI(
    title=settings.application_name,
    version=settings.application_version,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)

app.include_router(api_router, prefix="/api")


@app.exception_handler(DomainError)
async def handle_domain_error(_: Request, error: DomainError) -> JSONResponse:
    status_by_code = {
        ErrorCode.IMAGE_TOO_LARGE: 413,
        ErrorCode.UNSUPPORTED_IMAGE_TYPE: 415,
        ErrorCode.INVALID_IMAGE: 422,
        ErrorCode.FACE_NOT_FOUND: 422,
        ErrorCode.MULTIPLE_FACES_FOUND: 422,
        ErrorCode.FACE_COMPARISON_FAILED: 500,
    }
    return JSONResponse(
        status_code=status_by_code.get(error.code, 400),
        content={
            "code": error.code.value,
            "message": error.message,
            "field": error.field,
        },
    )
