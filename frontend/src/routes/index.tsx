import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  FileText,
  Mic,
} from "lucide-react";
import { useMediNote } from "@/lib/medinote";
import { Avatar, Card, CountUp, Page, PrimaryButton, StatusChip } from "@/components/medinote/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · MediNote" },
      {
        name: "description",
        content: "Today's appointments, recordings and AI-drafted clinical notes at a glance.",
      },
      { property: "og:title", content: "Dashboard · MediNote" },
      {
        property: "og:description",
        content: "Today's appointments, recordings and AI-drafted clinical notes at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { patients } = useMediNote();
  const navigate = useNavigate();
  const [date, setDate] = useState("");
  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour <= 11
      ? "Good morning"
      : hour >= 12 && hour <= 16
        ? "Good afternoon"
        : hour >= 17 && hour <= 20
          ? "Good evening"
          : "Good night";
  useEffect(
    () =>
      setDate(
        new Date().toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      ),
    [],
  );
  const stats = [
    { label: "Today's appointments", value: patients.length, icon: CalendarDays },
    {
      label: "Recordings to upload",
      value: patients.filter((p) => p.status === "Recording needed").length,
      icon: Mic,
    },
    {
      label: "Notes to review",
      value: patients.filter((p) => p.status === "Note in review").length,
      icon: FileText,
    },
    {
      label: "Notes saved",
      value: patients.filter((p) => p.status === "Note saved" || p.status === "Note signed").length,
      icon: CheckCircle2,
    },
  ];
  return (
    <Page>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[18px] bg-gradient-hero p-7 text-on-hero shadow-lift sm:p-9"
      >
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-on-hero/10 blur-3xl" />
        <p className="text-sm font-medium opacity-75">{date}</p>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight sm:text-[30px]">
          {greeting}, Dr. Farhan
        </h1>
        <p className="mt-2 text-sm opacity-85">Here is your overview for today.</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Card
            key={s.label}
            delay={0.05 * (i + 1)}
            className="relative overflow-hidden transition hover:-translate-y-1 hover:shadow-lift"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-tint text-primary">
              <s.icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{s.label}</p>
            <p
              className={cn(
                "tnum mt-1 text-[30px] font-bold leading-none tracking-tight",
                s.value === 0 && "text-muted-foreground",
              )}
            >
              <CountUp value={s.value} />
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card delay={0.25}>
          <h2 className="mb-4 text-lg font-bold">Today's appointments</h2>
          {patients.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-tint text-primary">
                <CalendarPlus className="h-6 w-6" />
              </div>
              <p className="font-semibold">No appointments yet</p>
              <p className="text-sm text-muted-foreground">
                Add a patient from the button at the top to get started.
              </p>
            </div>
          ) : (
            <ul className="-mx-3 space-y-1">
              {patients.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/patients/$id"
                    params={{ id: p.id }}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-3 transition hover:-translate-y-0.5 hover:bg-muted"
                  >
                    <Avatar initials={p.initials} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {p.reason || "Reason not provided"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline-flex">
                        <StatusChip status={p.status} />
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card delay={0.3} className="flex flex-col">
          <h2 className="mb-4 text-lg font-bold">Quick upload</h2>
          {patients.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40 p-8 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
                <Mic className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Add a patient to enable recording uploads.
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-primary-tint/50 p-8 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft">
                <Mic className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Pick a patient, then add the visit recording.
              </p>
              <PrimaryButton
                type="button"
                className="mt-5"
                onClick={() => void navigate({ to: "/patients" })}
              >
                Choose patient
              </PrimaryButton>
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
