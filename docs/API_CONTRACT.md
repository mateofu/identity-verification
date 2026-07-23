# API contract

## Create verification

`POST /api/v1/verifications`

Content type: `multipart/form-data`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `selfie` | Image file | Yes | Frame captured from the live camera. |
| `document` | Image file | Yes | Uploaded or captured identity document. |

Supported formats will initially be JPEG, PNG and WebP. The default maximum size is 10 MiB per image.

### Successful response

```json
{
  "matched": true,
  "decision": "match",
  "similarity_percentage": 87.4,
    "threshold_percentage": 36.3,
  "detected_faces": {
    "selfie": 1,
    "document": 1
  },
  "quality": {
    "selfie_detection_confidence": 92.1,
    "document_detection_confidence": 78.4,
    "warnings": []
  }
}
```

`decision` can be `match`, `no_match` or `inconclusive`. Any weak face-detection quality makes the result inconclusive, even when the similarity reaches the match threshold. This prevents low-quality evidence from confirming or rejecting an identity.

Quality warnings can report low detector confidence, a face that is too small, insufficient sharpness or poor exposure for either the selfie or document portrait. These warnings describe recognition suitability, not document authenticity.

### Error response

```json
{
  "code": "FACE_NOT_FOUND",
  "message": "No face was detected in the document image."
}
```

Stable error codes:

- `INVALID_IMAGE`
- `IMAGE_TOO_LARGE`
- `UNSUPPORTED_IMAGE_TYPE`
- `FACE_NOT_FOUND`
- `MULTIPLE_FACES_FOUND`
- `FACE_COMPARISON_FAILED`

The endpoint validates decoded image content, processes both images in memory and returns controlled domain errors.
