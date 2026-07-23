# Third-party notices

## OpenCV

OpenCV is distributed under the Apache License 2.0.

- Project: https://opencv.org/
- License: https://github.com/opencv/opencv/blob/4.x/LICENSE

## YuNet face detection model

The YuNet files provided by the OpenCV Model Zoo are distributed under the MIT License.

- Source: https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet
- Model: `face_detection_yunet_2023mar.onnx`
- SHA-256: `8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4`

## SFace face recognition model

The SFace files provided by the OpenCV Model Zoo are distributed under the Apache License 2.0.

- Source: https://github.com/opencv/opencv_zoo/tree/main/models/face_recognition_sface
- Model: `face_recognition_sface_2021dec.onnx`
- SHA-256: `0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79`

The model files are downloaded during the Docker build and accepted only when their checksums match these pinned values.
