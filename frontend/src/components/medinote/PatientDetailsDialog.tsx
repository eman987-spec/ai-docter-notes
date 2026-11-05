import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import type { Patient } from "@/lib/medinote";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PrimaryButton, SecondaryButton } from "@/components/medinote/ui";

export type PatientDetails = Omit<Patient, "id" | "initials" | "status">;

const emptyDetails: PatientDetails = {
  name: "",
  ageOrDob: "",
  gender: "",
  reason: "",
  phone: "",
  blood: "",
  allergies: "",
  history: "",
  bp: "",
  pulse: "",
  temp: "",
  weight: "",
};

export function PatientDetailsDialog({
  trigger,
  patient,
  onSave,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: ReactNode;
  patient?: Patient;
  onSave: (details: PatientDetails) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [details, setDetails] = useState<PatientDetails>(patient ?? emptyDetails);
  const [errors, setErrors] = useState<{
    name: string | undefined;
    ageOrDob: string | undefined;
    gender: string | undefined;
  }>({ name: undefined, ageOrDob: undefined, gender: undefined });
  const id = useId();

  useEffect(() => {
    if (open) {
      setDetails(patient ?? emptyDetails);
      setErrors({ name: undefined, ageOrDob: undefined, gender: undefined });
    }
  }, [open, patient]);

  const update = (field: keyof PatientDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
    if (field === "name" || field === "ageOrDob" || field === "gender") {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = {
      name: details.name.trim() ? undefined : "Full name is required.",
      ageOrDob: details.ageOrDob.trim() ? undefined : "Age or date of birth is required.",
      gender: details.gender ? undefined : "Gender is required.",
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    onSave({ ...details, name: details.name.trim(), ageOrDob: details.ageOrDob.trim() });
    setOpen(false);
  };

  const fieldClass =
    "mt-1.5 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary";
  const labelClass = "text-sm font-medium";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger != null && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enter patient details</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${id}-name`} className={labelClass}>
                Full name <span aria-hidden="true">*</span>
              </label>
              <input
                id={`${id}-name`}
                required
                autoComplete="name"
                value={details.name}
                onChange={(event) => update("name", event.target.value)}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? `${id}-name-error` : undefined}
                className={fieldClass}
              />
              {errors.name && (
                <p id={`${id}-name-error`} role="alert" className="mt-1 text-sm text-destructive">
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor={`${id}-age`} className={labelClass}>
                Age or date of birth <span aria-hidden="true">*</span>
              </label>
              <input
                id={`${id}-age`}
                required
                value={details.ageOrDob}
                onChange={(event) => update("ageOrDob", event.target.value)}
                aria-invalid={Boolean(errors.ageOrDob)}
                aria-describedby={errors.ageOrDob ? `${id}-age-error` : undefined}
                className={fieldClass}
              />
              {errors.ageOrDob && (
                <p id={`${id}-age-error`} role="alert" className="mt-1 text-sm text-destructive">
                  {errors.ageOrDob}
                </p>
              )}
            </div>
            <div>
              <label htmlFor={`${id}-gender`} className={labelClass}>
                Gender <span aria-hidden="true">*</span>
              </label>
              <select
                id={`${id}-gender`}
                required
                value={details.gender}
                onChange={(event) => update("gender", event.target.value)}
                aria-invalid={Boolean(errors.gender)}
                aria-describedby={errors.gender ? `${id}-gender-error` : undefined}
                className={fieldClass}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && (
                <p id={`${id}-gender-error`} role="alert" className="mt-1 text-sm text-destructive">
                  {errors.gender}
                </p>
              )}
            </div>
            <div>
              <label htmlFor={`${id}-phone`} className={labelClass}>
                Phone number
              </label>
              <input
                id={`${id}-phone`}
                type="tel"
                autoComplete="tel"
                value={details.phone}
                onChange={(event) => update("phone", event.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor={`${id}-blood`} className={labelClass}>
                Blood group
              </label>
              <select
                id={`${id}-blood`}
                value={details.blood}
                onChange={(event) => update("blood", event.target.value)}
                className={fieldClass}
              >
                <option value="">Select blood group</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-allergies`} className={labelClass}>
                Allergies
              </label>
              <input
                id={`${id}-allergies`}
                value={details.allergies}
                onChange={(event) => update("allergies", event.target.value)}
                placeholder="None known"
                className={fieldClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`${id}-history`} className={labelClass}>
                Past medical history
              </label>
              <textarea
                id={`${id}-history`}
                rows={3}
                value={details.history}
                onChange={(event) => update("history", event.target.value)}
                className="mt-1.5 w-full rounded-xl border bg-background p-3 text-sm outline-none transition focus:border-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`${id}-reason`} className={labelClass}>
                Reason for today's visit
              </label>
              <input
                id={`${id}-reason`}
                value={details.reason}
                onChange={(event) => update("reason", event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold">
              Vitals <span className="font-normal text-muted-foreground">(optional)</span>
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["bp", "Blood pressure"],
                  ["pulse", "Pulse"],
                  ["temp", "Temperature"],
                  ["weight", "Weight"],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label htmlFor={`${id}-${field}`} className={labelClass}>
                    {label}
                  </label>
                  <input
                    id={`${id}-${field}`}
                    value={details[field]}
                    onChange={(event) => update(field, event.target.value)}
                    className={fieldClass}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
            <SecondaryButton type="button" onClick={() => setOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">Save patient</PrimaryButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
