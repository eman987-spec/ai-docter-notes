import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SearchX, Users } from "lucide-react";
import { useMediNote } from "@/lib/medinote";
import { Avatar, Card, Page, StatusChip } from "@/components/medinote/ui";

export const Route = createFileRoute("/patients/")({
  head: () => ({
    meta: [
      { title: "Patients · MediNote" },
      { name: "description", content: "Browse and search your patient list." },
      { property: "og:title", content: "Patients · MediNote" },
      { property: "og:description", content: "Browse and search your patient list." },
    ],
  }),
  component: Patients,
});

function Patients() {
  const { patients, search } = useMediNote();
  const navigate = useNavigate();
  const list = patients.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()));
  const open = (id: string) => void navigate({ to: "/patients/$id", params: { id } });
  return (
    <Page>
      <h1 className="text-[28px] font-bold tracking-tight sm:text-[30px]">Patients</h1>
      <Card className="overflow-x-auto p-0">
        {patients.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-14 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-tint text-primary">
              <Users className="h-6 w-6" />
            </div>
            <p className="font-semibold">No patients yet</p>
            <p className="text-sm text-muted-foreground">Patients you add will appear here.</p>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-14 text-center text-muted-foreground">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-muted">
              <SearchX className="h-6 w-6" />
            </div>
            <p className="font-semibold text-foreground">No patient found</p>
            <p className="text-sm">Check the spelling and try again.</p>
          </div>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                {["Patient", "Age / date of birth", "Phone", "Blood group", "Status"].map((h) => (
                  <th key={h} className="px-6 py-4 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr
                  key={p.id}
                  tabIndex={0}
                  role="link"
                  onClick={() => open(p.id)}
                  onKeyDown={(e) => e.key === "Enter" && open(p.id)}
                  className="cursor-pointer border-b transition last:border-0 hover:bg-muted"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar initials={p.initials} />
                      <span className="font-semibold">{p.name}</span>
                    </div>
                  </td>
                  <td className={`tnum px-6 py-4 ${p.ageOrDob ? "" : "text-muted-foreground"}`}>
                    {p.ageOrDob || "Not provided"}
                  </td>
                  <td className="tnum px-6 py-4 text-muted-foreground">
                    {p.phone || "Not provided"}
                  </td>
                  <td className={`px-6 py-4 ${p.blood ? "" : "text-muted-foreground"}`}>
                    {p.blood || "Not provided"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusChip status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </Page>
  );
}
