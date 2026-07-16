"use client";

import { useActionState } from "react";
import { resetPasswordAction, type FormState } from "@/lib/auth/actions";
import { FormFeedback, SubmitButton } from "./form-feedback";
import { FieldLabel, inputClass } from "./auth-shell";

export function ResetForm() {
  const [state, action] = useActionState<FormState, FormData>(resetPasswordAction, {});
  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <FieldLabel>Nueva contraseña</FieldLabel>
        <input name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={inputClass} />
      </label>
      <label className="block">
        <FieldLabel>Repite la contraseña</FieldLabel>
        <input name="confirm" type="password" required minLength={8} maxLength={72} autoComplete="new-password" className={inputClass} />
      </label>
      <FormFeedback state={state} />
      <SubmitButton>Guardar contraseña</SubmitButton>
    </form>
  );
}
