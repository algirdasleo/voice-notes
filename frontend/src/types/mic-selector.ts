export type RecordingState = "idle" | "loading" | "recording" | "recorded" | "playing"

export interface MicSelectorDemoProps {
  onRecordingComplete?: (audioBlob: Blob) => void
  disabled?: boolean
}
