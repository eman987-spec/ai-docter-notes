import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useMediNote, type Patient } from "@/lib/medinote";
import { saveRecording } from "@/lib/recording-store";

export type ConsultationPhase = "idle" | "recording";

const CONSENTS_KEY = "medinote.consents";
type WakeLockSentinelLike = { release: () => Promise<void> };

function pickMimeType(): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return undefined;
}

function readConsents(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CONSENTS_KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function saveConsent(patientId: string, consentAt: string): void {
  try {
    const consents = readConsents();
    consents[patientId] = consentAt;
    window.localStorage.setItem(CONSENTS_KEY, JSON.stringify(consents));
  } catch (error) {
    console.error("Could not save the consent timestamp", error);
  }
}

type Ctx = {
  phase: ConsultationPhase;
  patient: Patient | null;
  elapsed: number;
  micError: string | null;
  consentAt: string | null;
  start: (patient: Patient) => Promise<boolean>;
  end: () => void;
  clearMicError: () => void;
};

const C = createContext<Ctx | null>(null);

export function ConsultationProvider({ children }: { children: ReactNode }) {
  const { transcribeRecording } = useMediNote();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<ConsultationPhase>("idle");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [consentAt, setConsentAt] = useState<string | null>(null);

  const phaseRef = useRef<ConsultationPhase>("idle");
  const patientRef = useRef<Patient | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const endedRef = useRef(false);
  const startingRef = useRef(false);
  const endRef = useRef<() => void>(() => undefined);

  const setPhaseBoth = (next: ConsultationPhase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const requestWakeLock = useCallback(async () => {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
      };
      wakeLockRef.current = (await nav.wakeLock?.request("screen")) ?? null;
    } catch {
      // Wake lock is a best-effort safeguard against the screen sleeping.
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    const wakeLock = wakeLockRef.current;
    wakeLockRef.current = null;
    if (wakeLock) {
      void wakeLock
        .release()
        .catch((error) => console.error("Could not release screen wake lock", error));
    }
  }, []);

  const teardownAudio = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    streamRef.current = null;
    releaseWakeLock();
  }, [releaseWakeLock]);

  const saveAndTranscribeRecording = useCallback(
    async (target: Patient, blob: Blob) => {
      try {
        await saveRecording(target.id, blob);
      } catch (error) {
        console.error("Could not store the recording for playback", error);
        toast.error("The recording could not be saved in this browser.", {
          action: {
            label: "Retry save",
            onClick: () => void saveAndTranscribeRecording(target, blob),
          },
          duration: 8000,
        });
        return;
      }

      await navigate({ to: "/patients/$id", params: { id: target.id } });
      if (await transcribeRecording(target.id)) {
        await navigate({ to: "/patients/$id/note", params: { id: target.id } });
      }
    },
    [navigate, transcribeRecording],
  );

  const end = useCallback(() => {
    if (endedRef.current || phaseRef.current === "idle") return;
    endedRef.current = true;
    const target = patientRef.current;
    const recorder = recorderRef.current;

    const finalize = () => {
      teardownAudio();
      recorderRef.current = null;
      const mimeType = recorder?.mimeType || "audio/webm";
      const blob = chunksRef.current.length
        ? new Blob(chunksRef.current, { type: mimeType })
        : null;
      chunksRef.current = [];
      setPhaseBoth("idle");
      setPatient(null);
      patientRef.current = null;
      setConsentAt(null);
      setElapsed(0);
      if (!target) return;
      if (!blob || blob.size === 0) {
        toast.info("No audio was captured, so no recording was saved.");
        return;
      }
      void saveAndTranscribeRecording(target, blob);
    };

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = finalize;
      try {
        recorder.stop();
      } catch (error) {
        console.error("Could not stop the consultation recorder", error);
        finalize();
      }
    } else {
      finalize();
    }
  }, [teardownAudio, saveAndTranscribeRecording]);
  endRef.current = end;

  const start = useCallback(
    async (next: Patient) => {
      if (phaseRef.current !== "idle" || startingRef.current) return false;
      startingRef.current = true;
      endedRef.current = false;
      setMicError(null);
      try {
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
          throw new Error("This browser does not support microphone recording.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mimeType = pickMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.onerror = (event) => {
          console.error("Consultation recorder encountered an error", event);
          toast.error("Recording encountered an error. Saving captured audio.");
          endRef.current();
        };

        const stamp = new Date().toISOString();
        patientRef.current = next;
        setPatient(next);
        saveConsent(next.id, stamp);
        setConsentAt(stamp);
        startedAtRef.current = Date.now();
        setElapsed(0);
        recorder.start(1000);
        setPhaseBoth("recording");
        timerRef.current = setInterval(() => {
          setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
        }, 1000);
        stream.getAudioTracks().forEach((track) => {
          track.onended = () => {
            if (endedRef.current) return;
            toast.error("The microphone disconnected. Saving the audio captured so far.");
            endRef.current();
          };
        });
        startingRef.current = false;
        void requestWakeLock();
        return true;
      } catch (error) {
        startingRef.current = false;
        console.error("Could not start the consultation", error);
        const denied =
          error instanceof DOMException &&
          (error.name === "NotAllowedError" || error.name === "SecurityError");
        setMicError(
          denied
            ? "Microphone access was blocked. Allow microphone access for this site in your browser, then try again."
            : error instanceof Error
              ? error.message
              : "We could not start the microphone. Check that it is connected and try again.",
        );
        teardownAudio();
        recorderRef.current = null;
        chunksRef.current = [];
        patientRef.current = null;
        setPatient(null);
        setConsentAt(null);
        setPhaseBoth("idle");
        endedRef.current = false;
        return false;
      }
    },
    [requestWakeLock, teardownAudio],
  );

  const clearMicError = useCallback(() => setMicError(null), []);

  useEffect(() => {
    if (phase === "idle") return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && phaseRef.current !== "idle") {
        void requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [requestWakeLock]);

  useEffect(
    () => () => {
      if (phaseRef.current !== "idle") endRef.current();
      else teardownAudio();
    },
    [teardownAudio],
  );

  return (
    <C.Provider
      value={{
        phase,
        patient,
        elapsed,
        micError,
        consentAt,
        start,
        end,
        clearMicError,
      }}
    >
      {children}
    </C.Provider>
  );
}

export function useConsultation() {
  const context = useContext(C);
  if (!context) throw new Error("ConsultationProvider missing");
  return context;
}
