import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FileText } from "lucide-react";
import { useMediNote } from "@/lib/medinote";
import { Avatar, Card, Chip, Page } from "@/components/medinote/ui";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Notes · MediNote" },
      { name: "description", content: "All saved clinical notes." },
      { property: "og:title", content: "Notes · MediNote" },
      { property: "og:description", content: "All saved clinical notes." },
    ],
  }),
  component: Notes,
});

function Notes() {
  const { patients, notes } = useMediNote();
  const saved = patients.filter((p) => notes[p.id]);
  return (
    <Page>
      <h1 className="text-[28px] font-bold tracking-tight sm:text-[32px]">Notes</h1>
      <Card>
        {saved.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted"><FileText className="h-5 w-5" /></div>
            No notes yet. Upload a recording from a patient's Overview tab.
          </div>
        ) : (
          <ul className="-mx-3 space-y-1">
            {saved.map((p) => (
              <li key={p.id}>
                <Link to="/patients/$id/note" params={{ id: p.id }} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-muted">
                  <Avatar initials={p.initials} />
                  <div className="min-w-0"><p className="truncate font-semibold">{p.name}</p><p className="truncate text-sm text-muted-foreground">Visit note · Today</p></div>
                  <div className="flex items-center gap-2"><Chip tone="success">Saved</Chip><ChevronRight className="h-4 w-4 text-muted-foreground" /></div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}
