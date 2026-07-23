from typing import Any, cast

import numpy as np
import pytest
from app.adapters.opencv_face_adapter import OpenCvFaceAdapter


class StubRecognizer:
    def alignCrop(self, _image: np.ndarray, _face: np.ndarray) -> np.ndarray:
        return np.zeros((112, 112, 3), dtype=np.uint8)

    def feature(self, _aligned_face: np.ndarray) -> np.ndarray:
        return np.ones((1, 128), dtype=np.float32)


def create_face(width: float, height: float, confidence: float) -> np.ndarray:
    face = np.zeros(15, dtype=np.float32)
    face[2] = width
    face[3] = height
    face[14] = confidence
    return face


def create_faces(*faces: np.ndarray) -> np.ndarray:
    return np.stack(faces).astype(np.float32)


def test_creates_contrast_and_rotation_variants() -> None:
    image = np.zeros((100, 160, 3), dtype=np.uint8)

    variants = OpenCvFaceAdapter._create_document_variants(image)

    assert len(variants) == 8
    assert variants[0].shape == (100, 160, 3)
    assert variants[2].shape == (160, 100, 3)


def test_prioritizes_main_portrait_over_small_secondary_face() -> None:
    image = np.zeros((1000, 1600, 3), dtype=np.uint8)
    main_portrait = create_face(width=300, height=400, confidence=0.8)
    small_portrait = create_face(width=70, height=90, confidence=0.95)

    main_priority = OpenCvFaceAdapter._document_face_priority(main_portrait, image)
    small_priority = OpenCvFaceAdapter._document_face_priority(small_portrait, image)

    assert main_priority > small_priority


def test_extracts_independent_numpy_feature() -> None:
    adapter = OpenCvFaceAdapter.__new__(OpenCvFaceAdapter)
    cast(Any, adapter)._recognizer = StubRecognizer()

    feature = adapter._extract_feature(
        np.zeros((200, 200, 3), dtype=np.uint8),
        np.zeros(15, dtype=np.float32),
    )

    assert isinstance(feature, np.ndarray)
    assert feature.shape == (1, 128)


def test_ignores_small_secondary_selfie_detection() -> None:
    faces = create_faces(
        create_face(width=300, height=400, confidence=0.95),
        create_face(width=40, height=50, confidence=0.8),
    )

    significant_faces = OpenCvFaceAdapter._select_significant_selfie_faces(faces)

    assert len(significant_faces) == 1
    assert significant_faces[0, 2] == 300


def test_keeps_multiple_faces_when_both_are_significant() -> None:
    faces = create_faces(
        create_face(width=300, height=400, confidence=0.95),
        create_face(width=220, height=300, confidence=0.9),
    )

    significant_faces = OpenCvFaceAdapter._select_significant_selfie_faces(faces)

    assert len(significant_faces) == 2


def test_measures_face_size_sharpness_and_exposure() -> None:
    image = np.zeros((200, 400, 3), dtype=np.uint8)
    image[50:150, 100:220] = 120
    face = create_face(width=120, height=100, confidence=0.9)
    face[0] = 100
    face[1] = 50

    quality = OpenCvFaceAdapter._measure_face_quality(image, face)

    assert quality.detection_confidence == pytest.approx(0.9)
    assert quality.relative_area == pytest.approx(0.15)
    assert quality.minimum_dimension_pixels == 100
    assert quality.mean_luminance == pytest.approx(120)
