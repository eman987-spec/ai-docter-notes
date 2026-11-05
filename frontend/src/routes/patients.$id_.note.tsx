import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { draftNote, useMediNote, type NoteDraft } from "@/lib/medinote";
import {
  createRecordingUrl,
  getRecording,
  revokeRecordingUrl,
} from "@/lib/recording-store";
import { Card, Chip, Page, PrimaryButton } from "@/components/medinote/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/patients/$id_/note")({
  head: () => ({
    meta: [
      { title: "Visit note · MediNote" },
      { name: "description", content: "Transcript and AI-drafted clinical note for this visit." },
      { property: "og:title", content: "Visit note · MediNote" },
      {
        property: "og:description",
        content: "Transcript and AI-drafted clinical note for this visit.",
      },
    ],
  }),
  component: VisitNote,
});

const bars = Array.from(
  { length: 60 },
  (_, i) => 20 + Math.abs(Math.sin(i * 0.55) * 55 + Math.sin(i * 1.7) * 25),
);

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
  return `${Math.floor(safe / 60)}:${Math.floor(safe % 60)
    .toString()
    .padStart(2, "0")}`;
}

function VisitNote() {
  const { id } = Route.useParams();
  const { patients, notes, saveNote, transcriptions } = useMediNote();
  const p = patients.find((x) => x.id === id);
  const transcription = transcriptions[id];
  const [note, setNote] = useState<NoteDraft>(notes[id] ?? draftNote);

  // Recording playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLButtonElement | null>(null);
  const draggingRef = useRef(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);

  const hasRecording = recordingUrl !== null;
  const totalDuration =
    mediaDuration > 0 ? mediaDuration : (transcription?.duration ?? 0);
  const progress = totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;
  const activeSegmentId = transcription?.segments.find(
    (s) => currentTime >= s.start && currentTime < s.end,
  )?.id;
  const hasTranscript = !!transcription;
  const hasSegments = (transcription?.segments.length ?? 0) > 0;
  const lines =
    transcription?.segments.map((segment) => ({
      id: segment.id,
      start: segment.start,
      speaker: "Speaker",
      t: formatTime(segment.start),
      text: segment.text,
    })) ?? [];
  const detectedLanguage = transcription
    ? (new Intl.DisplayNames(["en"], { type: "language" }).of(transcription.language) ??
      transcription.language)
    : null;

  // Load the stored recording once per patient and release its URL on leave.
  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    void getRecording(id)
      .then((blob) => {
        if (!alive || !blob) return;
        objectUrl = createRecordingUrl(blob);
        setRecordingUrl(objectUrl);
      })
      .catch((error) => console.error("Could not load recording", error));
    return () => {
      alive = false;
      if (objectUrl) revokeRecordingUrl(objectUrl);
      else setRecordingUrl((current) => (revokeRecordingUrl(current), null));
    };
  }, [id]);

  // While playing, keep the active transcript line gently in view.
  useEffect(() => {
    if (playing && activeSegmentId !== undefined) {
      activeLineRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeSegmentId, playing]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !recordingUrl) return;
    if (playing) {
      audio.pause();
      return;
    }
    if (totalDuration > 0 && currentTime >= totalDuration - 0.05) {
      audio.currentTime = 0;
      setCurrentTime(0);
    }
    void audio.play().catch((error) => console.error("Playback failed", error));
  };

  const seekTo = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !recordingUrl || totalDuration <= 0) return;
    const clamped = Math.min(Math.max(seconds, 0), totalDuration);
    audio.currentTime = clamped;
    setCurrentTime(clamped);
    if (audio.paused) void audio.play().catch((error) => console.error("Playback failed", error));
  };

  const seekFromPointer = (clientX: number) => {
    const el = waveformRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    seekTo(ratio * totalDuration);
  };

  const handleWaveformKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 5;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      seekTo(currentTime - step);
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      seekTo(currentTime + step);
    } else if (event.key === "Home") {
      event.preventDefault();
      seekTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      seekTo(totalDuration);
    }
  };

  if (!p) {
    return (
      <Page>
        <p className="text-muted-foreground">Patient not found.</p>
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All patients
        </Link>
      </Page>
    );
  }

  return (
    <Page>
      <Link
        to="/patients/$id"
        params={{ id }}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {p.name}
      </Link>
      <div>
        <h1 className="text-[28px] font-bold tracking-tight sm:text-[32px]">Visit note</h1>
        <p className="mt-1 text-muted-foreground">
          Draft from the recording. Edit any section, then save.
        </p>
      </div>

      <Card className="flex items-center gap-5">
        <button
          type="button"
          aria-label={playing ? "Pause recording" : "Play recording"}
          disabled={!hasRecording}
          onClick={togglePlay}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>
        <div
          ref={waveformRef}
          role="slider"
          tabIndex={hasRecording ? 0 : -1}
          aria-label="Recording position"
          aria-valuemin={0}
          aria-valuemax={Math.max(1, Math.round(totalDuration))}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(totalDuration)}`}
          onPointerDown={(e) => {
            if (!hasRecording) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            draggingRef.current = true;
            seekFromPointer(e.clientX);
          }}
          onPointerMove={(e) => {
            if (draggingRef.current) seekFromPointer(e.clientX);
          }}
          onPointerUp={() => {
            draggingRef.current = false;
          }}
          onPointerCancel={() => {
            draggingRef.current = false;
          }}
          onKeyDown={handleWaveformKeyDown}
          className={cn(
            "flex h-12 min-w-0 flex-1 items-center gap-[3px] overflow-hidden",
            hasRecording ? "cursor-pointer touch-none" : "cursor-not-allowed",
          )}
        >
          {bars.map((h, i) => {
            const filled = hasRecording && (i + 0.5) / bars.length <= progress;
            return (
              <span
                key={i}
                className={cn(
                  "w-1 shrink-0 rounded-full transition-colors",
                  filled ? "bg-primary" : "bg-muted",
                )}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
        {hasRecording ? (
          <span className="tnum shrink-0 text-sm font-medium text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">Recording not available</span>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Transcript</h2>
            {detectedLanguage && (
              <span className="rounded-full bg-primary-tint px-2.5 py-1 text-xs font-medium text-primary">
                Detected: {detectedLanguage}
              </span>
            )}
          </div>
          <div className="max-h-[640px] space-y-4 overflow-y-auto pr-1">
            {!hasTranscript ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No transcript available for this visit.
              </p>
            ) : !hasSegments ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No speech was detected in this file.
              </p>
            ) : (
              lines.map((l, i) => {
                const isActive = l.id === activeSegmentId;
                return (
                  <button
                    key={l.id}
                    type="button"
                    ref={isActive ? activeLineRef : undefined}
                    onClick={() => seekTo(l.start)}
                    className={cn(
                      "flex w-full flex-col items-start rounded-2xl px-1 py-1 text-left transition-colors",
                      isActive ? "bg-primary-tint" : "hover:bg-muted/60",
                    )}
                  >
                    <span className="tnum mb-1 text-xs text-muted-foreground">
                      [{i + 1}] {l.speaker} · {l.t}
                    </span>
                    <p
                      className={cn(
                        "max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed",
                        isActive ? "bg-primary-tint" : "bg-muted",
                      )}
                    >
                      {l.text}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <div className="space-y-4">
          {(Object.keys(note) as (keyof NoteDraft)[]).map((k, i) => (
            <Card key={k} delay={0.05 * i} className="p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <label htmlFor={`sec-${k}`} className="font-bold">
                  {k}
                </label>
                {!note[k].trim() && <Chip tone="warning">Empty</Chip>}
              </div>
              <textarea
                id={`sec-${k}`}
                value={note[k]}
                onChange={(e) => setNote({ ...note, [k]: e.target.value })}
                rows={k === "History" ? 4 : 2}
                placeholder={`Add ${k.toLowerCase()} findings`}
                className="w-full resize-y rounded-xl border bg-background p-3 text-sm leading-relaxed outline-none transition focus:border-primary"
              />
            </Card>
          ))}
          <div className="flex flex-wrap gap-3">
            <PrimaryButton
              onClick={() => {
                saveNote(id, note);
                toast.success("Note saved");
              }}
            >
              Save note
            </PrimaryButton>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">AI note generation coming soon.</p>
        </div>
      </div>

      {/* Hidden media element: plays audio files and the audio track of video files. */}
      <audio
        ref={audioRef}
        src={recordingUrl ?? undefined}
        preload="metadata"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const duration = e.currentTarget.duration;
          if (Number.isFinite(duration) && duration > 0) setMediaDuration(duration);
        }}
      />
    </Page>
  );
}
