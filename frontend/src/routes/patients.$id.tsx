import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Gauge,
  HeartPulse,
  Loader2,
  Scale,
  Thermometer,
  UploadCloud,
} from "lucide-react";
import { useRef, useState } from "react";
import { useMediNote } from "@/lib/medinote";
import { hasRecording, saveRecording } from "@/lib/recording-store";
import { StartConsultationButton } from "@/components/medinote/Consultation";
import {
  Avatar,
  Card,
  Chip,
  Page,
  PrimaryButton,
  SecondaryButton,
  StatusChip,
} from "@/components/medinote/ui";
import { cn } from "@/lib/utils";
import { PatientDetailsDialog } from "@/components/medinote/PatientDetailsDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/patients/$id")({
  head: () => ({
    meta: [
      { title: "Patient · MediNote" },
      { name: "description", content: "Patient profile, vitals, visits and notes." },
    ],
  }),
  component: Profile,
});

const tabs = ["Overview", "Visits", "Notes"] as const;
function Profile() {
  const { id } = Route.useParams();
  const { patients, notes, updatePatient, deletePatient } = useMediNote();
  const navigate = useNavigate();
  const p = patients.find((x) => x.id === id);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
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
  const vitals = [
    { label: "Blood pressure", value: p.bp, icon: Gauge },
    { label: "Pulse", value: p.pulse, icon: HeartPulse },
    { label: "Temperature", value: p.temp, icon: Thermometer },
    { label: "Weight", value: p.weight, icon: Scale },
  ];
  return (
    <Page>
      <Link
        to="/patients"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All patients
      </Link>
      <Card>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar initials={p.initials} size="lg" />
            <div className="min-w-0">
              <h1 className="truncate text-[26px] font-bold tracking-tight sm:text-[30px]">
                {p.name}
              </h1>
              <p className="tnum text-sm text-muted-foreground">
                {p.ageOrDob || "Not provided"} · {p.gender || "Not provided"} ·{" "}
                {p.phone || "Not provided"}
              </p>
              <div className="mt-2">
                <StatusChip status={p.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <PatientDetailsDialog
                  patient={p}
                  onSave={(details) => updatePatient(p.id, details)}
                  trigger={<SecondaryButton type="button">Edit details</SecondaryButton>}
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <SecondaryButton type="button" className="text-destructive">
                      Delete patient
                    </SecondaryButton>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete patient?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove {p.name} and their saved patient data from this
                        browser.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          deletePatient(p.id);
                          void navigate({ to: "/patients" });
                        }}
                      >
                        Delete patient
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 lg:ml-auto">
            {vitals.map((v) => (
              <div key={v.label} className="rounded-xl border bg-background p-4">
                <v.icon className="h-4 w-4 text-primary" />
                <p
                  className={`tnum mt-3 text-lg font-bold ${v.value ? "" : "text-muted-foreground"}`}
                >
                  {v.value || "Not provided"}
                </p>
                <p className="text-xs text-muted-foreground">{v.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div role="tablist" className="flex gap-6 border-b">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "relative pb-3 text-sm font-semibold transition",
              tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
            {tab === t && (
              <motion.span
                layoutId="tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary"
              />
            )}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Card>
            <h2 className="mb-4 text-lg font-bold">Patient details</h2>
            <dl className="divide-y text-sm">
              {[
                ["Age or date of birth", p.ageOrDob],
                ["Gender", p.gender],
                ["Phone", p.phone],
                ["Blood group", p.blood],
                ["Allergies", p.allergies],
                ["Past history", p.history],
                ["Reason for today's visit", p.reason],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className={`text-right font-medium ${value ? "" : "text-muted-foreground"}`}>
                    {value || "Not provided"}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
          <div className="space-y-6">
            <Card>
              <h2 className="mb-2 text-lg font-bold">Ambient consultation</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Record the conversation between doctor and patient using the device microphone.
              </p>
              <StartConsultationButton patient={p} className="w-full" />
            </Card>
            <TranscriptionStatus patientId={p.id} />
            <Uploader id={p.id} />
          </div>
        </div>
      )}

      {tab === "Visits" && (
        <Card>
          <ol className="relative space-y-6 border-l-2 border-border pl-6">
            <li className="relative">
              <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-card bg-primary" />
              <p className="text-sm text-muted-foreground">Today's visit</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <p className={p.reason ? "font-semibold" : "font-semibold text-muted-foreground"}>
                  {p.reason || "Not provided"}
                </p>
                <StatusChip status={p.status} />
              </div>
            </li>
          </ol>
        </Card>
      )}

      {tab === "Notes" && (
        <Card>
          {notes[p.id] ? (
            <Link
              to="/patients/$id/note"
              params={{ id: p.id }}
              className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-muted"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-tint text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Visit note</p>
                <p className="text-sm text-muted-foreground">
                  Today · {p.reason || "Reason not provided"}
                </p>
              </div>
              <Chip tone="success">Saved</Chip>
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
                <FileText className="h-5 w-5" />
              </div>
              No notes yet. Upload a recording from the Overview tab.
            </div>
          )}
        </Card>
      )}
    </Page>
  );
}

function Uploader({ id }: { id: string }) {
  const navigate = useNavigate();
  const { transcribeRecording, transcriptionStates } = useMediNote();
  const input = useRef<HTMLInputElement>(null);
  const replacementConfirmed = useRef(false);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  // errorMsg: null = no error, string = show error
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const transcriptionState = transcriptionStates[id];

  const ALLOWED_TYPES = new Set([
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/m4a",
    "audio/aac",
    "audio/flac",
    "audio/ogg",
    "audio/opus",
    "audio/webm",
    "video/webm",
    "video/mp4",
    "video/quicktime",
    "video/x-matroska",
  ]);
  const ALLOWED_EXTS = new Set([
    "mp3",
    "wav",
    "m4a",
    "aac",
    "flac",
    "ogg",
    "opus",
    "webm",
    "mp4",
    "mov",
    "mkv",
  ]);

  const isValidFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    return ALLOWED_TYPES.has(f.type) || ALLOWED_EXTS.has(ext);
  };

  const start = async (selected: File) => {
    if (!isValidFile(selected)) {
      setFile(selected);
      setErrorMsg(
        `"${selected.name}" is not a supported audio or video file. Please choose an mp3, wav, m4a, mp4, webm or similar file.`,
      );
      return;
    }
    if (!replacementConfirmed.current) {
      try {
        const existingRecording = await hasRecording(id);
        if (
          existingRecording &&
          !window.confirm("A recording already exists for this patient. Replace it with this file?")
        ) {
          return;
        }
        replacementConfirmed.current = true;
      } catch (error) {
        console.error("Could not check for an existing recording", error);
        setFile(selected);
        setErrorMsg(
          "Could not check for an existing recording, so this file was not saved. Please try again.",
        );
        return;
      }
    }
    setFile(selected);
    setErrorMsg(null);
    try {
      // Keep the real recording for playback on the note screen (survives refresh).
      await saveRecording(id, selected);
    } catch (error) {
      console.error("Could not store the recording for playback", error);
      setErrorMsg("This recording could not be saved in this browser. Please try again.");
      return;
    }
    if (await transcribeRecording(id)) {
      await navigate({ to: "/patients/$id/note", params: { id } });
    }
  };
  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">Upload visit recording</h2>
      {!file ? (
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDrag(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const droppedFile = e.dataTransfer.files.item(0);
            if (droppedFile) void start(droppedFile);
          }}
          className={cn(
            "flex flex-col items-center rounded-2xl border-2 border-dashed p-10 text-center transition",
            drag ? "border-primary bg-primary-tint" : "border-primary/40 bg-primary-tint/40",
          )}
        >
          <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="mt-4 font-semibold">Drag and drop the recording here</p>
          <p className="mt-1 text-sm text-muted-foreground">mp3, wav, m4a, mp4 or webm</p>
          <input
            ref={input}
            type="file"
            accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus,.webm,.mp4,.mov,.mkv"
            className="sr-only"
            aria-label="Choose audio or video file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void start(f);
            }}
          />
          <PrimaryButton className="mt-5" onClick={() => input.current?.click()}>
            Choose file
          </PrimaryButton>
        </div>
      ) : errorMsg !== null ? (
        <div className="space-y-4">
          <p className="truncate text-sm text-muted-foreground">{file?.name}</p>
          <p role="alert" className="text-sm text-destructive">
            {errorMsg}
          </p>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={() => file && void start(file)}>Try again</PrimaryButton>
            <SecondaryButton
              onClick={() => {
                setFile(null);
                setErrorMsg(null);
                replacementConfirmed.current = false;
              }}
            >
              Choose another file
            </SecondaryButton>
          </div>
        </div>
      ) : transcriptionState?.status === "error" ? (
        <div className="space-y-4">
          <p className="truncate text-sm text-muted-foreground">{file.name}</p>
          <SecondaryButton
            onClick={() => {
              setFile(null);
              setErrorMsg(null);
              replacementConfirmed.current = false;
            }}
          >
            Choose another file
          </SecondaryButton>
        </div>
      ) : (
        <p className="truncate text-sm text-muted-foreground">{file.name}</p>
      )}
    </Card>
  );
}

function TranscriptionStatus({ patientId }: { patientId: string }) {
  const { transcriptionStates, transcribeRecording } = useMediNote();
  const navigate = useNavigate();
  const state = transcriptionStates[patientId];
  if (!state) return null;

  return (
    <Card>
      {state.status === "transcribing" ? (
        <div className="flex items-center gap-3" role="status">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="font-medium">Transcribing...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
          <PrimaryButton
            onClick={() => {
              void transcribeRecording(patientId).then((success) => {
                if (success) {
                  return navigate({ to: "/patients/$id/note", params: { id: patientId } });
                }
              });
            }}
          >
            Try again
          </PrimaryButton>
        </div>
      )}
    </Card>
  );
}
