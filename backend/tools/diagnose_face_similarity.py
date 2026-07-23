import argparse

import cv2
import numpy as np
from app.adapters.opencv_face_adapter import OpenCvFaceAdapter


def apply_clahe(image: np.ndarray, clip_limit: float) -> np.ndarray:
    lab_image = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    lightness, channel_a, channel_b = cv2.split(lab_image)
    enhanced_lightness = cv2.createCLAHE(
        clipLimit=clip_limit, tileGridSize=(8, 8)
    ).apply(lightness)
    return cv2.cvtColor(
        cv2.merge((enhanced_lightness, channel_a, channel_b)),
        cv2.COLOR_LAB2BGR,
    )


def apply_gamma(image: np.ndarray, gamma: float) -> np.ndarray:
    lookup_table = np.array(
        [min(255, ((value / 255.0) ** gamma) * 255) for value in range(256)],
        dtype=np.uint8,
    )
    return cv2.LUT(image, lookup_table)


def apply_sharpening(image: np.ndarray) -> np.ndarray:
    blurred_image = cv2.GaussianBlur(image, (0, 0), 1.2)
    return cv2.addWeighted(image, 1.5, blurred_image, -0.5, 0)


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("selfie_path")
    parser.add_argument("document_path")
    return parser.parse_args()


def main() -> None:
    arguments = parse_arguments()
    selfie_image = cv2.imread(arguments.selfie_path)
    document_image = cv2.imread(arguments.document_path)
    if selfie_image is None or document_image is None:
        raise ValueError("Both input paths must contain readable images.")

    adapter = OpenCvFaceAdapter(
        "/app/models/face_detection_yunet.onnx",
        "/app/models/face_recognition_sface.onnx",
        0.75,
        0.5,
    )
    selfie_candidate = adapter._find_selfie_face(selfie_image)
    document_candidate = adapter._find_document_face(document_image)

    selfie_variants = {
        "original": selfie_image,
        "brightened": apply_gamma(selfie_image, 0.7),
        "clahe": apply_clahe(selfie_image, 1.5),
    }
    document_variants = {
        "original": document_candidate.image,
        "clahe_mild": apply_clahe(document_candidate.image, 1.2),
        "clahe_strong": apply_clahe(document_candidate.image, 2.0),
        "denoised": cv2.bilateralFilter(document_candidate.image, 7, 35, 35),
        "sharpened": apply_sharpening(document_candidate.image),
    }

    selfie_features = {
        name: adapter._extract_feature(image, selfie_candidate.face)
        for name, image in selfie_variants.items()
    }
    document_features = {
        name: adapter._extract_feature(image, document_candidate.face)
        for name, image in document_variants.items()
    }

    for selfie_name, selfie_feature in selfie_features.items():
        for document_name, document_feature in document_features.items():
            similarity = adapter._recognizer.match(
                selfie_feature,
                document_feature,
                cv2.FaceRecognizerSF_FR_COSINE,
            )
            print(selfie_name, document_name, round(float(similarity), 6))


if __name__ == "__main__":
    main()
