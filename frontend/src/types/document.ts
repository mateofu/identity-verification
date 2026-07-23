export type DocumentImageError = 'unsupported-type' | 'file-too-large' | 'invalid-image'

export type DocumentCameraStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'capturing'
  | 'denied'
  | 'unavailable'
  | 'error'

export interface SelectedDocumentImage {
  file: File
  previewUrl: string
}
