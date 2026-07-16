"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type FormState } from "@/lib/auth/actions";
import { FormFeedback, SubmitButton } from "./form-feedback";
import { FieldLabel, inputClass } from "./auth-shell";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signInAction, {
    error: initialError,
  });

  return (
    <form action={action} className="space-y-3">
      {next && <input type="hidden" name="next" value={next} />}
      <label className="block">
        <FieldLabel>Email</FieldLabel>
        <input name="email" type="email" required autoComplete="email" placeholder="tu@email.com" className={inputClass} />
      </label>
      <label className="block">
        <FieldLabel>Contraseña</FieldLabel>
        <input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" className={inputClass} />
      </label>
      <FormFeedback state={state} />
      <SubmitButton>Entrar</SubmitButton>
      <p className="text-center text-xs">
        <Link href="/forgot-password" className="text-ink-3 hover:text-ink">
          ¿Has olvidado tu contraseña?
        </Link>
      </p>
    </form>
  );
}
