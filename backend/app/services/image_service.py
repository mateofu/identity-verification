from dataclasses import dataclass
from typing import cast

import cv2
import numpy as np
from numpy.typing import NDArray

from app.core.errors import ErrorCode, ImageValidationError

SUPPORTED_IMAGE_MEDIA_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})


@dataclass(frozen=True, slots=True)
class ImageValidationLimits:
    maximum_size_bytes: int
    maximum_pixels: int


class ImageService:
    def __init__(self, limits: ImageValidationLimits) -> None:
        self._limits = limits

    def decode(
        self, content: bytes, media_type: str | None, field_name: str
    ) -> NDArray[np.uint8]:
        if media_type not in SUPPORTED_IMAGE_MEDIA_TYPES:
            raise ImageValidationError(
                ErrorCode.UNSUPPORTED_IMAGE_TYPE,
                f"{field_name} must be a JPEG, PNG or WebP image.",
                field=field_name,
            )

        if not content:
            raise ImageValidationError(
                ErrorCode.INVALID_IMAGE,
                f"{field_name} is empty.",
                field=field_name,
            )

        if len(content) > self._limits.maximum_size_bytes:
            raise ImageValidationError(
                ErrorCode.IMAGE_TOO_LARGE,
                f"{field_name} exceeds the maximum allowed size.",
                field=field_name,
            )

        encoded_image = np.frombuffer(content, dtype=np.uint8)
        decoded_image = cv2.imdecode(encoded_image, cv2.IMREAD_COLOR)

        if decoded_image is None or decoded_image.size == 0:
            raise ImageValidationError(
                ErrorCode.INVALID_IMAGE,
                f"{field_name} does not contain a valid image.",
                field=field_name,
            )

        height, width = decoded_image.shape[:2]
        if height * width > self._limits.maximum_pixels:
            raise ImageValidationError(
                ErrorCode.INVALID_IMAGE,
                f"{field_name} dimensions exceed the allowed limit.",
                field=field_name,
            )

        return cast(NDArray[np.uint8], decoded_image)
