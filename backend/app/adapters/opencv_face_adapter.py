from dataclasses import dataclass
from threading import Lock
from typing import cast

import cv2
import numpy as np
from numpy.typing import NDArray

from app.core.errors import ErrorCode, FaceProcessingError

MINIMUM_SECONDARY_FACE_AREA_RATIO = 0.35


@dataclass(frozen=True, slots=True)
class FaceQualityMetrics:
    detection_confidence: float
    relative_area: float
    minimum_dimension_pixels: float
    sharpness: float
    mean_luminance: float


@dataclass(frozen=True, slots=True)
class FaceComparison:
    cosine_similarity: float
    selfie_face_count: int
    document_face_count: int
    selfie_quality: FaceQualityMetrics
    document_quality: FaceQualityMetrics


@dataclass(frozen=True, slots=True)
class DetectedFaceCandidate:
    image: NDArray[np.uint8]
    face: NDArray[np.float32]
    face_count: int


class OpenCvFaceAdapter:
    def __init__(
        self,
        detection_model_path: str,
        recognition_model_path: str,
        detection_score_threshold: float,
        document_detection_score_threshold: float,
    ) -> None:
        self._detector = cv2.FaceDetectorYN.create(
            detection_model_path,
            "",
            (320, 320),
            detection_score_threshold,
            0.3,
            5000,
        )
        self._recognizer = cv2.FaceRecognizerSF.create(recognition_model_path, "")
        self._selfie_detection_threshold = detection_score_threshold
        self._document_detection_threshold = document_detection_score_threshold
        self._inference_lock = Lock()

    def compare(
        self,
        selfie_image: NDArray[np.uint8],
        document_image: NDArray[np.uint8],
    ) -> FaceComparison:
        try:
            with self._inference_lock:
                selfie_candidate = self._find_selfie_face(selfie_image)
                document_candidate = self._find_document_face(document_image)

                selfie_feature = self._extract_feature(
                    selfie_candidate.image, selfie_candidate.face
                )
                document_feature = self._extract_feature(
                    document_candidate.image, document_candidate.face
                )
                cosine_similarity = self._recognizer.match(
                    selfie_feature,
                    document_feature,
                    cv2.FaceRecognizerSF_FR_COSINE,
                )

            return FaceComparison(
                cosine_similarity=float(cosine_similarity),
                selfie_face_count=selfie_candidate.face_count,
                document_face_count=document_candidate.face_count,
                selfie_quality=self._measure_face_quality(
                    selfie_candidate.image, selfie_candidate.face
                ),
                document_quality=self._measure_face_quality(
                    document_candidate.image, document_candidate.face
                ),
            )
        except FaceProcessingError:
            raise
        except cv2.error as error:
            raise FaceProcessingError(
                ErrorCode.FACE_COMPARISON_FAILED,
                "The face comparison model could not process the images.",
            ) from error

    def _find_selfie_face(self, image: NDArray[np.uint8]) -> DetectedFaceCandidate:
        detected_faces = self._detect_faces(image, self._selfie_detection_threshold)
        significant_faces = self._select_significant_selfie_faces(detected_faces)
        self._require_exactly_one_face(significant_faces, "selfie")
        return DetectedFaceCandidate(
            image=image,
            face=significant_faces[0],
            face_count=len(significant_faces),
        )

    def _find_document_face(self, image: NDArray[np.uint8]) -> DetectedFaceCandidate:
        candidates: list[DetectedFaceCandidate] = []

        for image_variant in self._create_document_variants(image):
            detected_faces = self._detect_faces(
                image_variant, self._document_detection_threshold
            )
            if len(detected_faces) == 0:
                continue

            primary_face = max(
                detected_faces,
                key=lambda face: self._document_face_priority(face, image_variant),
            )
            candidates.append(
                DetectedFaceCandidate(
                    image=image_variant,
                    face=primary_face,
                    face_count=len(detected_faces),
                )
            )

        if not candidates:
            raise FaceProcessingError(
                ErrorCode.FACE_NOT_FOUND,
                "No face was detected in the document image.",
                field="document",
            )

        return max(
            candidates,
            key=lambda candidate: self._document_face_priority(
                candidate.face, candidate.image
            ),
        )

    def _detect_faces(
        self,
        image: NDArray[np.uint8],
        score_threshold: float,
    ) -> NDArray[np.float32]:
        height, width = image.shape[:2]
        self._detector.setInputSize((width, height))
        self._detector.setScoreThreshold(score_threshold)
        detected_faces_result: object | None = self._detector.detect(image)[1]

        if detected_faces_result is None:
            return np.empty((0, 15), dtype=np.float32)

        return cast(NDArray[np.float32], detected_faces_result)

    def _extract_feature(
        self,
        image: NDArray[np.uint8],
        face: NDArray[np.float32],
    ) -> NDArray[np.float32]:
        aligned_face = self._recognizer.alignCrop(image, face)
        return cast(NDArray[np.float32], self._recognizer.feature(aligned_face).copy())

    @staticmethod
    def _measure_face_quality(
        image: NDArray[np.uint8], face: NDArray[np.float32]
    ) -> FaceQualityMetrics:
        image_height, image_width = image.shape[:2]
        x = max(0, int(face[0]))
        y = max(0, int(face[1]))
        width = max(1, int(face[2]))
        height = max(1, int(face[3]))
        right = min(image_width, x + width)
        bottom = min(image_height, y + height)
        face_crop = image[y:bottom, x:right]

        if face_crop.size == 0:
            sharpness = 0.0
            mean_luminance = 0.0
        else:
            grayscale_face = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
            sharpness = float(cv2.Laplacian(grayscale_face, cv2.CV_64F).var())
            mean_luminance = float(np.mean(grayscale_face))

        relative_area = float(width * height) / float(image_width * image_height)
        return FaceQualityMetrics(
            detection_confidence=float(face[14]),
            relative_area=relative_area,
            minimum_dimension_pixels=float(min(width, height)),
            sharpness=sharpness,
            mean_luminance=mean_luminance,
        )

    @staticmethod
    def _create_document_variants(
        image: NDArray[np.uint8],
    ) -> tuple[NDArray[np.uint8], ...]:
        enhanced_image = OpenCvFaceAdapter._enhance_document_contrast(image)
        return cast(
            tuple[NDArray[np.uint8], ...],
            (
                image,
                enhanced_image,
                cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE),
                cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE),
                cv2.rotate(image, cv2.ROTATE_180),
                cv2.rotate(enhanced_image, cv2.ROTATE_90_CLOCKWISE),
                cv2.rotate(enhanced_image, cv2.ROTATE_90_COUNTERCLOCKWISE),
                cv2.rotate(enhanced_image, cv2.ROTATE_180),
            ),
        )

    @staticmethod
    def _enhance_document_contrast(image: NDArray[np.uint8]) -> NDArray[np.uint8]:
        lab_image = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        lightness, channel_a, channel_b = cv2.split(lab_image)
        enhanced_lightness = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(
            lightness
        )
        enhanced_lab_image = cv2.merge((enhanced_lightness, channel_a, channel_b))
        return cast(
            NDArray[np.uint8],
            cv2.cvtColor(enhanced_lab_image, cv2.COLOR_LAB2BGR),
        )

    @staticmethod
    def _document_face_priority(
        face: NDArray[np.float32], image: NDArray[np.uint8]
    ) -> float:
        image_height, image_width = image.shape[:2]
        relative_area = float(face[2] * face[3]) / float(image_width * image_height)
        detection_confidence = float(face[14])
        return float(detection_confidence * max(relative_area, 1e-9) ** 0.5)

    @staticmethod
    def _select_significant_selfie_faces(
        faces: NDArray[np.float32],
    ) -> NDArray[np.float32]:
        if len(faces) <= 1:
            return faces

        face_areas = faces[:, 2] * faces[:, 3]
        largest_face_area = float(np.max(face_areas))
        minimum_significant_area = largest_face_area * MINIMUM_SECONDARY_FACE_AREA_RATIO
        significant_face_indexes = np.flatnonzero(
            face_areas >= minimum_significant_area
        )
        return faces[significant_face_indexes]

    @staticmethod
    def _require_exactly_one_face(faces: NDArray[np.float32], field_name: str) -> None:
        face_count = len(faces)

        if face_count == 0:
            raise FaceProcessingError(
                ErrorCode.FACE_NOT_FOUND,
                f"No face was detected in the {field_name} image.",
                field=field_name,
            )

        if face_count > 1:
            raise FaceProcessingError(
                ErrorCode.MULTIPLE_FACES_FOUND,
                f"More than one face was detected in the {field_name} image.",
                field=field_name,
            )
