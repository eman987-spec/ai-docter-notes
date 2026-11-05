import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { deleteRecording, getRecording } from "@/lib/recording-store";

export type Status =
  "Recording needed" | "Note in review" | "Note signed" | "Note saved" | "Scheduled";

export type Patient = {
  id: string;
  name: string;
  initials: string;
  ageOrDob: string;
  gender: string;
  reason: string;
  status: Status;
  phone: string;
  blood: string;
  allergies: string;
  history: string;
  bp: string;
  pulse: string;
  temp: string;
  weight: string;
};

const PATIENTS_STORAGE_KEY = "medinote.patients";
const TRANSCRIPTIONS_STORAGE_KEY = "medinote.transcriptions";
const patientStatuses = new Set<string>([
  "Recording needed",
  "Note in review",
  "Note signed",
  "Note saved",
  "Scheduled",
]);

export type NoteDraft = { History: string; Examination: string; Assessment: string; Plan: string };
export type TranscriptionSegment = { id: number; start: number; end: number; text: string };
export type TranscriptionResult = {
  language: string;
  language_probability: number;
  duration: number;
  segments: TranscriptionSegment[];
};
export type TranscriptionState = { status: "transcribing" } | { status: "error"; message: string };
export const draftNote: NoteDraft = {
  History: "",
  Examination: "",
  Assessment: "",
  Plan: "",
};

function isStoredPatient(value: unknown): value is Patient {
  if (typeof value !== "object" || value === null) return false;
  const patient = value as Record<string, unknown>;
  const stringFields = [
    "id",
    "name",
    "initials",
    "ageOrDob",
    "gender",
    "reason",
    "phone",
    "blood",
    "allergies",
    "history",
    "bp",
    "pulse",
    "temp",
    "weight",
  ];
  return (
    stringFields.every((field) => typeof patient[field] === "string") &&
    typeof patient["status"] === "string" &&
    patientStatuses.has(patient["status"])
  );
}

function readStoredPatients(): Patient[] {
  try {
    const value = window.localStorage.getItem(PATIENTS_STORAGE_KEY);
    if (!value) return [];
    const patients: unknown = JSON.parse(value);
    if (!Array.isArray(patients) || !patients.every(isStoredPatient)) {
      throw new Error("Stored patient data is invalid");
    }
    return patients;
  } catch (error) {
    console.error("Could not read patients from localStorage", error);
    return [];
  }
}

type Ctx = {
  patients: Patient[];
  notes: Record<string, NoteDraft>;
  search: string;
  setSearch: (s: string) => void;
  addPatient: (patient: Omit<Patient, "id" | "initials" | "status">) => Patient;
  updatePatient: (id: string, patient: Omit<Patient, "id" | "initials" | "status">) => void;
  deletePatient: (id: string) => void;
  saveNote: (id: string, n: NoteDraft) => void;
  transcriptions: Record<string, TranscriptionResult>;
  setTranscription: (id: string, result: TranscriptionResult) => void;
  transcriptionStates: Record<string, TranscriptionState>;
  transcribeRecording: (id: string) => Promise<boolean>;
};
const C = createContext<Ctx | null>(null);

const API_URL = import.meta.env["VITE_API_URL"] || "http://localhost:8000";
const TRANSCRIPTION_ERROR =
  "The saved recording could not be transcribed. Check your connection and try again.";

function makeInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch (error) {
    console.error(`Could not read ${key} from localStorage`, error);
    return fallback;
  }
}

export function MediNoteProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoaded, setPatientsLoaded] = useState(false);
  const [notes, setNotes] = useState<Record<string, NoteDraft>>({});
  const [transcriptions, setTranscriptions] = useState<Record<string, TranscriptionResult>>(() =>
    readStored<Record<string, TranscriptionResult>>(TRANSCRIPTIONS_STORAGE_KEY, {}),
  );
  const [transcriptionStates, setTranscriptionStates] = useState<
    Record<string, TranscriptionState>
  >({});
  const [search, setSearch] = useState("");
  useEffect(() => {
    setPatients(readStoredPatients());
    setPatientsLoaded(true);
  }, []);
  useEffect(() => {
    if (!patientsLoaded) return;
    try {
      window.localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patients));
    } catch (error) {
      console.error("Could not save patients to localStorage", error);
    }
  }, [patients, patientsLoaded]);
  useEffect(() => {
    try {
      window.localStorage.setItem(TRANSCRIPTIONS_STORAGE_KEY, JSON.stringify(transcriptions));
    } catch (error) {
      console.error("Could not save transcriptions to localStorage", error);
    }
  }, [transcriptions]);
  const addPatient = (details: Omit<Patient, "id" | "initials" | "status">) => {
    const patient: Patient = {
      ...details,
      id:
        globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      initials: makeInitials(details.name),
      status: "Recording needed",
    };
    setPatients((current) => [patient, ...current]);
    return patient;
  };
  const updatePatient = (id: string, details: Omit<Patient, "id" | "initials" | "status">) => {
    setPatients((current) =>
      current.map((patient) =>
        patient.id === id
          ? {
              ...patient,
              ...details,
              initials: makeInitials(details.name),
            }
          : patient,
      ),
    );
  };
  const deletePatient = (id: string) => {
    setPatients((current) => current.filter((patient) => patient.id !== id));
    void deleteRecording(id).catch((error) =>
      console.error("Could not delete stored recording", error),
    );
    setNotes((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setTranscriptions((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };
  const saveNote = (id: string, n: NoteDraft) => {
    setNotes((p) => ({ ...p, [id]: n }));
    setPatients((p) => p.map((x) => (x.id === id ? { ...x, status: "Note saved" } : x)));
  };
  const setTranscription = (id: string, result: TranscriptionResult) => {
    setTranscriptions((current) => ({ ...current, [id]: result }));
  };
  const transcribeRecording = async (id: string): Promise<boolean> => {
    setTranscriptionStates((current) => ({ ...current, [id]: { status: "transcribing" } }));
    try {
      const recording = await getRecording(id);
      if (!recording) throw new Error("No saved recording is available");

      const form = new FormData();
      const extension = recording.type.includes("mp4") ? "m4a" : "webm";
      form.append("file", recording, `recording-${id}.${extension}`);
      const response = await fetch(`${API_URL.replace(/\/$/, "")}/transcribe`, {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        let detail = `Server error ${response.status}.`;
        try {
          const body = (await response.json()) as { detail?: string };
          if (body.detail) detail = body.detail;
        } catch {
          // Keep the HTTP status as the error when the response is not JSON.
        }
        throw new Error(detail);
      }

      const result = (await response.json()) as TranscriptionResult;
      setTranscription(id, result);
      setPatients((current) =>
        current.map((patient) =>
          patient.id === id ? { ...patient, status: "Note in review" } : patient,
        ),
      );
      setTranscriptionStates((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      return true;
    } catch (error) {
      console.error("Transcription request failed for backend URL:", API_URL, error);
      setTranscriptionStates((current) => ({
        ...current,
        [id]: { status: "error", message: TRANSCRIPTION_ERROR },
      }));
      return false;
    }
  };
  return (
    <C.Provider
      value={{
        patients,
        notes,
        search,
        setSearch,
        addPatient,
        updatePatient,
        deletePatient,
        saveNote,
        transcriptions,
        setTranscription,
        transcriptionStates,
        transcribeRecording,
      }}
    >
      {children}
    </C.Provider>
  );
}

export function useMediNote() {
  const context = useContext(C);
  if (!context) throw new Error("MediNoteProvider missing");
  return context;
}
