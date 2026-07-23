export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'capturing'
  | 'poor-quality'
  | 'denied'
  | 'unavailable'
  | 'error'

export interface CapturedPhoto {
  file: File
  previewUrl: string
}
