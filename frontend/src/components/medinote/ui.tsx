import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/medinote";

const chipStyles: Record<Status, string> = {
  "Recording needed": "bg-destructive-tint text-destructive",
  "Note in review": "bg-warning-tint text-warning",
  "Note signed": "bg-success-tint text-success",
  "Note saved": "bg-success-tint text-success",
  Scheduled: "bg-primary-tint text-primary",
};
export function StatusChip({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", chipStyles[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function Chip({ tone, children }: { tone: "warning" | "success"; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", tone === "warning" ? "bg-warning-tint text-warning" : "bg-success-tint text-success")}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />{children}
    </span>
  );
}

export function Avatar({ initials, size = "md" }: { initials: string; size?: "md" | "lg" }) {
  return (
    <div className={cn("grid shrink-0 place-items-center rounded-full bg-primary-tint font-semibold text-accent-foreground", size === "lg" ? "h-16 w-16 text-xl" : "h-10 w-10 text-sm")}>
      {initials}
    </div>
  );
}

export function Card({ className, children, delay = 0 }: { className?: string; children: ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }}
      className={cn("rounded-[18px] border bg-card p-6 shadow-soft", className)}
    >
      {children}
    </motion.section>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mx-auto w-full max-w-6xl space-y-6">
      {children}
    </motion.div>
  );
}

export function CountUp({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const [n, setN] = useState(0);
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.9, ease: "easeOut", onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [value, mv]);
  return <span className="tnum">{n}</span>;
}

export function PrimaryButton({ className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={cn("inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-60", className)} />;
}
export function SecondaryButton({ className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={cn("inline-flex items-center justify-center gap-2 rounded-xl border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted", className)} />;
}

export function useFirstLoad(ms = 450) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), ms); return () => clearTimeout(t); }, [ms]);
  return loading;
}
export function SkeletonRows({ n = 5 }: { n?: number }) {
  return <div className="space-y-3">{Array.from({ length: n }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />)}</div>;
}
