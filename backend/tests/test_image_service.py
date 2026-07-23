import cv2
import numpy as np
import pytest
from app.core.errors import ErrorCode, ImageValidationError
from app.services.image_service import ImageService, ImageValidationLimits


@pytest.fixture
def image_service() -> ImageService:
    return ImageService(
        ImageValidationLimits(maximum_size_bytes=1024, maximum_pixels=100)
    )


def create_jpeg(width: int = 5, height: int = 5) -> bytes:
    image = np.zeros((height, width, 3), dtype=np.uint8)
    success, encoded_image = cv2.imencode(".jpg", image)
    assert success
    return encoded_image.tobytes()


def test_decodes_supported_image(image_service: ImageService) -> None:
    decoded_image = image_service.decode(create_jpeg(), "image/jpeg", "selfie")

    assert decoded_image.shape == (5, 5, 3)


def test_rejects_unsupported_media_type(image_service: ImageService) -> None:
    with pytest.raises(ImageValidationError) as captured_error:
        image_service.decode(create_jpeg(), "application/pdf", "document")

    assert captured_error.value.code == ErrorCode.UNSUPPORTED_IMAGE_TYPE
    assert captured_error.value.field == "document"


def test_rejects_empty_image(image_service: ImageService) -> None:
    with pytest.raises(ImageValidationError) as captured_error:
        image_service.decode(b"", "image/jpeg", "selfie")

    assert captured_error.value.code == ErrorCode.INVALID_IMAGE
    assert captured_error.value.field == "selfie"


def test_rejects_image_exceeding_maximum_size(
    image_service: ImageService,
) -> None:
    with pytest.raises(ImageValidationError) as captured_error:
        image_service.decode(b"x" * 1025, "image/jpeg", "document")

    assert captured_error.value.code == ErrorCode.IMAGE_TOO_LARGE
    assert captured_error.value.field == "document"


def test_rejects_content_that_is_not_an_image(image_service: ImageService) -> None:
    with pytest.raises(ImageValidationError) as captured_error:
        image_service.decode(b"not-an-image", "image/jpeg", "document")

    assert captured_error.value.code == ErrorCode.INVALID_IMAGE
    assert captured_error.value.field == "document"


def test_rejects_excessive_dimensions(image_service: ImageService) -> None:
    with pytest.raises(ImageValidationError) as captured_error:
        image_service.decode(create_jpeg(width=11, height=10), "image/jpeg", "document")

    assert captured_error.value.code == ErrorCode.INVALID_IMAGE
    assert captured_error.value.field == "document"


def test_downscales_large_valid_image_for_processing() -> None:
    image_service = ImageService(
        ImageValidationLimits(
            maximum_size_bytes=2048,
            maximum_pixels=200,
            maximum_processing_pixels=50,
        )
    )

    decoded_image = image_service.decode(
        create_jpeg(width=10, height=10), "image/jpeg", "document"
    )

    assert decoded_image.shape == (7, 7, 3)
    assert decoded_image.shape[0] * decoded_image.shape[1] <= 50
