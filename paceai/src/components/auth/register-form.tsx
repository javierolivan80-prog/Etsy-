"use client";

import { useActionState } from "react";
import { signUpAction, type FormState } from "@/lib/auth/actions";
import { FormFeedback, SubmitButton } from "./form-feedback";
import { FieldLabel, inputClass } from "./auth-shell";

export function RegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(signUpAction, {});

  return (
    <form action={action} className="space-y-3">
      <label className="block">
        <FieldLabel>Nombre</FieldLabel>
        <input name="name" type="text" required minLength={2} maxLength={80} autoComplete="name" placeholder="Tu nombre" className={inputClass} />
      </label>
      <label className="block">
        <FieldLabel>Email</FieldLabel>
        <input name="email" type="email" required autoComplete="email" placeholder="tu@email.com" className={inputClass} />
      </label>
      <label className="block">
        <FieldLabel>Contraseña</FieldLabel>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          className={inputClass}
        />
      </label>
      <FormFeedback state={state} />
      <SubmitButton>Crear cuenta</SubmitButton>
    </form>
  );
}
