"use client";

import { useActionState } from "react";
import { forgotPasswordAction, type FormState } from "@/lib/auth/actions";
import { FormFeedback, SubmitButton } from "./form-feedback";
import { FieldLabel, inputClass } from "./auth-shell";

export function ForgotForm() {
  const [state, action] = useActionState<FormState, FormData>(forgotPasswordAction, {});
  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <FieldLabel>Email de tu cuenta</FieldLabel>
        <input name="email" type="email" required autoComplete="email" placeholder="tu@email.com" className={inputClass} />
      </label>
      <FormFeedback state={state} />
      <SubmitButton>Enviar enlace de recuperación</SubmitButton>
    </form>
  );
}
