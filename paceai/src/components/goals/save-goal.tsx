"use client";

import { useActionState } from "react";
import { BookmarkPlus, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { saveGoalAction, type FormState } from "@/lib/auth/actions";
import { FormFeedback } from "@/components/auth/form-feedback";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-elevated px-4 text-sm text-ink transition-colors hover:bg-hover disabled:opacity-60"
    >
      {pending ? <Loader2 size={15} className="animate-spin" /> : <BookmarkPlus size={15} />}
      Guardar como mi objetivo
    </button>
  );
}

/** Persists the currently analyzed goal so the dashboard tracks it. */
export function SaveGoal({
  distanceKm,
  targetSeconds,
}: {
  distanceKm: number;
  targetSeconds: number;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveGoalAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="distanceKm" value={distanceKm} />
      <input type="hidden" name="targetSeconds" value={targetSeconds} />
      <SaveButton />
      <FormFeedback state={state} />
    </form>
  );
}
