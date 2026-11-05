import { useState } from "react";
import { Mic, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConsultation } from "@/lib/consultation";
import type { Patient } from "@/lib/medinote";
import { PrimaryButton, SecondaryButton } from "@/components/medinote/ui";

export function StartConsultationButton({
  patient,
  className,
  label = "Start Consultation",
  iconOnly = false,
}: {
  patient: Patient;
  className?: string;
  label?: string;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [consented, setConsented] = useState(false);
  const { phase, start, micError, clearMicError } = useConsultation();
  const busy = phase !== "idle";
  const canStart = consented;

  const confirm = async () => {
    const ok = await start(patient);
    if (ok) {
      setOpen(false);
      setConsented(false);
    }
    // On failure the dialog stays open and shows the mic error.
  };

  return (
    <>
      <PrimaryButton
        type="button"
        className={className}
        disabled={busy}
        aria-label={label}
        onClick={() => {
          clearMicError();
          setConsented(false);
          setOpen(true);
        }}
      >
        <Mic className="h-4 w-4" />
        <span className={iconOnly ? "hidden sm:inline" : undefined}>{label}</span>
      </PrimaryButton>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) clearMicError();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start consultation</DialogTitle>
            <DialogDescription>
              The consultation will be recorded from your device&apos;s microphone until you stop
              it. Place the device between you and the patient so both voices are captured clearly.
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-primary"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
            />
            <span className="font-medium">The patient has given consent to audio recording</span>
          </label>
          {micError && (
            <p role="alert" className="text-sm text-destructive">
              {micError}
            </p>
          )}
          <DialogFooter>
            <SecondaryButton type="button" onClick={() => setOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              type="button"
              disabled={!canStart}
              onClick={() => void confirm()}
              className="bg-none bg-primary hover:bg-primary hover:brightness-95 disabled:bg-none disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:brightness-100"
            >
              Start recording
            </PrimaryButton>
          </DialogFooter>
          {!canStart && (
            <p className="text-right text-xs text-muted-foreground">
              Confirm the items above to start recording.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ConsultationBanner() {
  const { phase, patient, elapsed, end } = useConsultation();
  if (phase === "idle" || !patient) return null;
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const time = `${minutes}:${String(seconds).padStart(2, "0")}`;
  return (
    <div
      role="status"
      aria-label="Consultation in progress"
      className="sticky top-16 z-20 rounded-[18px] border bg-card/95 p-4 shadow-lift backdrop-blur"
    >
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-tight">Recording ON</p>
          <p className="truncate text-xs text-muted-foreground">
            {patient.name} · Recording continuously
          </p>
        </div>
        <p className="tnum ml-auto text-lg font-bold">{time}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={end}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground shadow-soft transition hover:brightness-95"
          >
            <Square className="h-3.5 w-3.5" />
            Stop recording
          </button>
        </div>
      </div>
    </div>
  );
}
