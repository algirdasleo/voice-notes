"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Pause, Play, Trash2, Send } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LiveWaveform } from "@/components/ui/live-waveform"
import { MicSelector } from "@/components/ui/mic-selector"
import { Separator } from "@/components/ui/separator"
import { type RecordingState, type MicSelectorDemoProps } from "@/types/mic-selector"

export function MicSelectorDemo({ onRecordingComplete, disabled = false }: MicSelectorDemoProps) {
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [isMuted, setIsMuted] = useState(false)
  const [state, setState] = useState<RecordingState>("idle")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  const stopStreamTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setActiveStream(null)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      setState("loading")

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true,
      })
      streamRef.current = stream
      setActiveStream(stream)

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        stopStreamTracks()
        setState("recorded")
      }

      mediaRecorder.start()
      setState("recording")
    } catch (error) {
      console.error("Error starting recording:", error)
      stopStreamTracks()
      setState("idle")
    }
  }, [selectedDevice, stopStreamTracks])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }, [state])

  const playRecording = useCallback(() => {
    if (!audioBlob) return

    const audio = new Audio(URL.createObjectURL(audioBlob))
    audioElementRef.current = audio

    audio.onended = () => {
      setState("recorded")
    }

    audio.play()
    setState("playing")
  }, [audioBlob])

  const pausePlayback = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      setState("recorded")
    }
  }, [])

  const restart = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current = null
    }
    setAudioBlob(null)
    audioChunksRef.current = []
    setState("idle")
  }, [])

  // Stop recording when muted
  useEffect(() => {
    if (isMuted && state === "recording") {
      stopRecording()
    }
  }, [isMuted, state, stopRecording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
      }
      // Directly stop stream tracks to ensure mic is released immediately
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause()
      }
    }
  }, [])

  const showWaveform = state === "recording" && !isMuted
  const showProcessing = state === "loading" || state === "playing"
  const showRecorded = state === "recorded"

  return (
    <div className="flex w-full items-center justify-center py-3">
      <Card className="m-0 w-full max-w-2xl border p-0 shadow-lg">
        <div className="flex w-full items-center justify-between gap-2 p-2">
          <div className="h-8 flex-1 flex items-center gap-2">
            <div className="h-8 flex-1">
              <div
                className={cn(
                  "flex h-full items-center gap-2 rounded-md py-1",
                  "bg-foreground/5 text-foreground/70"
                )}
              >
                <div className="h-full min-w-0 flex-1">
                  <div className="relative flex h-full w-full shrink-0 items-center justify-center overflow-hidden rounded-sm">
                    <LiveWaveform
                      key={state}
                      active={showWaveform}
                      processing={showProcessing}
                      stream={activeStream}
                      deviceId={selectedDevice}
                      barWidth={3}
                      barGap={1}
                      barRadius={4}
                      fadeEdges={false}
                      sensitivity={1.8}
                      smoothingTimeConstant={0.85}
                      height={20}
                      historySize={300}
                      mode="scrolling"
                      className={cn(
                        "h-full w-full transition-opacity duration-300",
                        state === "idle" && "opacity-0"
                      )}
                    />
                    {state === "idle" && (
                      <button
                        onClick={startRecording}
                        disabled={isMuted}
                        className="absolute inset-0 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-sm cursor-pointer"
                      >
                        <span className="text-foreground/50 text-xs font-medium">
                          Start Recording
                        </span>
                      </button>
                    )}
                    {showRecorded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-foreground/50 text-xs font-medium">
                          Ready to Play
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0">
            <MicSelector
              value={selectedDevice}
              onValueChange={setSelectedDevice}
              muted={isMuted}
              onMutedChange={setIsMuted}
              disabled={state === "recording" || state === "loading"}
            />
            <Separator orientation="vertical" className="mx-1 -my-2.5" />
            <div className="flex">
              {(state === "loading" || state === "recording") && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={stopRecording}
                  disabled={state === "loading"}
                  aria-label="Stop recording"
                >
                  <Pause className="size-5" />
                </Button>
              )}
              {showRecorded && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={playRecording}
                  aria-label="Play recording"
                >
                  <Play className="size-5" />
                </Button>
              )}
              {state === "playing" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={pausePlayback}
                  aria-label="Pause playback"
                >
                  <Pause className="size-5" />
                </Button>
              )}
              <Separator orientation="vertical" className="mx-1 -my-2.5" />
              <Button
                variant="ghost"
                size="icon"
                onClick={restart}
                disabled={state === "idle" || state === "loading" || state === "recording"}
                aria-label="Delete recording"
              >
                <Trash2 className="size-5" />
              </Button>
              {audioBlob && (state === "recorded" || state === "playing") && (
                <>
                  <Separator orientation="vertical" className="mx-1 -my-2.5" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (audioBlob && onRecordingComplete) {
                        onRecordingComplete(audioBlob)
                        restart()
                      }
                    }}
                    disabled={disabled}
                    aria-label="Send recording"
                  >
                    <Send className="size-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
