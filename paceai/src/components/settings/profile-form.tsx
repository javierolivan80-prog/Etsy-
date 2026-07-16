"use client";

import { useActionState } from "react";
import { updateProfileAction, type FormState } from "@/lib/auth/actions";
import { FormFeedback, SubmitButton } from "@/components/auth/form-feedback";
import { FieldLabel, inputClass } from "@/components/auth/auth-shell";

export function ProfileForm({
  initial,
}: {
  initial: { name: string; maxHr: number; restHr: number; weightKg: number | null };
}) {
  const [state, action] = useActionState<FormState, FormData>(updateProfileAction, {});

  return (
    <form action={action} className="grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <FieldLabel>Nombre</FieldLabel>
        <input name="name" defaultValue={initial.name} required maxLength={80} className={inputClass} />
      </label>
      <label className="block">
        <FieldLabel>FC máxima (ppm)</FieldLabel>
        <input name="maxHr" type="number" min={120} max={230} required defaultValue={initial.maxHr} className={`tnum ${inputClass}`} />
      </label>
      <label className="block">
        <FieldLabel>FC en reposo (ppm)</FieldLabel>
        <input name="restHr" type="number" min={25} max={110} required defaultValue={initial.restHr} className={`tnum ${inputClass}`} />
      </label>
      <label className="block">
        <FieldLabel>Peso (kg, opcional)</FieldLabel>
        <input name="weightKg" type="number" step="0.1" min={25} max={250} defaultValue={initial.weightKg ?? ""} className={`tnum ${inputClass}`} />
      </label>
      <div className="sm:col-span-2 space-y-3">
        <FormFeedback state={state} />
        <SubmitButton>Guardar cambios</SubmitButton>
      </div>
    </form>
  );
}
