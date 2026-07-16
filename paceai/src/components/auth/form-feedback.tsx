"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { FormState } from "@/lib/auth/actions";

/** Submit button with pending state. */
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

/** Inline error / success message for form actions. */
export function FormFeedback({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p role="alert" className="flex items-start gap-2 rounded-lg bg-[color-mix(in_srgb,var(--status-critical)_12%,transparent)] px-3 py-2.5 text-xs leading-relaxed text-critical">
        <XCircle size={14} className="mt-0.5 shrink-0" /> {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-lg bg-[color-mix(in_srgb,var(--status-good)_12%,transparent)] px-3 py-2.5 text-xs leading-relaxed text-good">
        <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> {state.success}
      </p>
    );
  }
  return null;
}
