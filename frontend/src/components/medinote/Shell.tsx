import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, FileText, LayoutDashboard, Moon, Search, Stethoscope, Sun, UserPlus, Users } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useMediNote } from "@/lib/medinote";
import { ConsultationBanner } from "@/components/medinote/Consultation";
import { cn } from "@/lib/utils";
import { PatientDetailsDialog } from "@/components/medinote/PatientDetailsDialog";
import { PrimaryButton } from "@/components/medinote/ui";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/notes", label: "Notes", icon: FileText },
] as const;

function useActive() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  return (
    <button aria-label="Toggle theme" onClick={() => setDark((d) => !d)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-card text-muted-foreground transition hover:text-foreground">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function AddPatientButton() {
  const [open, setOpen] = useState(false);
  const { addPatient } = useMediNote();
  const navigate = useNavigate();
  return (
    <>
      <PrimaryButton
        type="button"
        aria-label="Add patient"
        onClick={() => setOpen(true)}
        className="h-10 rounded-[10px] px-[18px] shadow-soft hover:-translate-y-px hover:brightness-95 hover:shadow-lift"
      >
        <UserPlus className="h-4 w-4" />
        <span className="hidden sm:inline">Add patient</span>
      </PrimaryButton>
      <PatientDetailsDialog
        open={open}
        onOpenChange={setOpen}
        onSave={(details) => {
          const patient = addPatient(details);
          void navigate({ to: "/patients/$id", params: { id: patient.id } });
        }}
      />
    </>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const isActive = useActive();
  const { search, setSearch } = useMediNote();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen w-full">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-sidebar p-5 text-sidebar-foreground min-[900px]:flex">
        <div className="mb-10 flex items-center gap-2.5 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-accent"><Stethoscope className="h-5 w-5" /></div>
          <span className="text-lg font-bold tracking-tight">MediNote</span>
        </div>
        <nav className="space-y-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", isActive(n.to) ? "bg-sidebar-accent" : "opacity-75 hover:bg-sidebar-accent hover:opacity-100")}>
              <n.icon className="h-4 w-4" />{n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent p-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-sidebar-accent text-sm font-semibold">DF</div>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">Dr. Farhan</p><p className="truncate text-xs opacity-70">General Practice</p></div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col min-[900px]:pl-60">
        <header className="glass sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3 sm:px-8">
          <label className="relative min-w-0 flex-1 sm:max-w-md">
            <span className="sr-only">Search patients by name</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => navigate({ to: "/patients" })}
              placeholder="Search patients by name"
              className="h-10 w-full rounded-[10px] border bg-card pl-10 pr-3 text-sm outline-none transition focus:border-primary"
            />
          </label>
          <div className="ml-auto flex items-center gap-2">
            <AddPatientButton />
            <ThemeToggle />
            <button aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-xl border bg-card text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-primary" />
            </button>
            <div className="hidden h-10 w-10 place-items-center rounded-full bg-primary-tint text-sm font-semibold text-accent-foreground sm:grid">DF</div>
          </div>
        </header>
        <main className="flex-1 px-4 pb-28 pt-6 sm:px-8 sm:pt-8 min-[900px]:pb-10">
          <ConsultationBanner />
          {children}
        </main>
      </div>

      <nav className="glass fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t min-[900px]:hidden">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} className={cn("flex flex-col items-center gap-1 py-3 text-xs font-medium", isActive(n.to) ? "text-primary" : "text-muted-foreground")}>
            <n.icon className="h-5 w-5" />{n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
