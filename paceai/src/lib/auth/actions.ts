"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth + profile server actions. All input is validated server-side with
 * Zod (the forms also validate client-side via HTML constraints). Every
 * action returns a `FormState` consumed by useActionState for clear
 * error/success feedback.
 */

export interface FormState {
  error?: string;
  success?: string;
}

const emailSchema = z.string().trim().toLowerCase().email("Introduce un email válido.");
const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña no puede superar 72 caracteres.");

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
}

/** Translate common Supabase auth errors into clear Spanish messages. */
function friendlyAuthError(message: string): string {
  const map: [RegExp, string][] = [
    [/invalid login credentials/i, "Email o contraseña incorrectos."],
    [/email not confirmed/i, "Tu email aún no está verificado. Revisa tu bandeja de entrada."],
    [/user already registered/i, "Ya existe una cuenta con este email. Inicia sesión."],
    [/rate limit/i, "Demasiados intentos. Espera un minuto y vuelve a probar."],
    [/should be at least/i, "La contraseña no cumple los requisitos mínimos."],
  ];
  for (const [re, msg] of map) if (re.test(message)) return msg;
  return `No se pudo completar la operación: ${message}`;
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1, "Introduce tu contraseña.") })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: friendlyAuthError(error.message) };

  revalidatePath("/", "layout");
  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/") ? next : "/dashboard");
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Dinos tu nombre.").max(80),
      email: emailSchema,
      password: passwordSchema,
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { name: parsed.data.name },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });
  if (error) return { error: friendlyAuthError(error.message) };

  // If email confirmation is disabled in the project, a session exists already.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }
  return {
    success:
      "Cuenta creada. Te hemos enviado un email de verificación: ábrelo para activar tu cuenta.",
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email: emailSchema }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const origin = await siteOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: friendlyAuthError(error.message) };
  return {
    success: "Si existe una cuenta con ese email, recibirás un enlace para restablecer la contraseña.",
  };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ password: passwordSchema, confirm: z.string() })
    .refine((d) => d.password === d.confirm, {
      message: "Las contraseñas no coinciden.",
      path: ["confirm"],
    })
    .safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "El enlace de recuperación ha caducado. Solicita uno nuevo." };
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: friendlyAuthError(error.message) };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      name: z.string().trim().min(1, "El nombre no puede estar vacío.").max(80),
      maxHr: z.coerce.number().int().min(120, "FC máxima fuera de rango.").max(230, "FC máxima fuera de rango."),
      restHr: z.coerce.number().int().min(25, "FC de reposo fuera de rango.").max(110, "FC de reposo fuera de rango."),
      weightKg: z
        .union([z.literal(""), z.coerce.number().min(25).max(250)])
        .transform((v) => (v === "" ? null : v)),
    })
    .refine((d) => d.restHr < d.maxHr, { message: "La FC de reposo debe ser menor que la máxima." })
    .safeParse({
      name: formData.get("name"),
      maxHr: formData.get("maxHr"),
      restHr: formData.get("restHr"),
      weightKg: formData.get("weightKg") ?? "",
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión caducada. Vuelve a iniciar sesión." };

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    name: parsed.data.name,
    max_hr: parsed.data.maxHr,
    rest_hr: parsed.data.restHr,
    weight_kg: parsed.data.weightKg,
  });
  if (error) return { error: `No se pudo guardar el perfil: ${error.message}` };

  revalidatePath("/", "layout");
  return { success: "Perfil actualizado. El análisis usará tus nuevas zonas de FC." };
}

export async function saveGoalAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      distanceKm: z.coerce.number().positive().max(500),
      targetSeconds: z.coerce.number().int().positive().max(24 * 3600),
    })
    .safeParse({
      distanceKm: formData.get("distanceKm"),
      targetSeconds: formData.get("targetSeconds"),
    });
  if (!parsed.success) return { error: "Objetivo inválido. Revisa distancia y tiempo." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión caducada. Vuelve a iniciar sesión." };

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    distance_km: parsed.data.distanceKm,
    target_seconds: parsed.data.targetSeconds,
  });
  if (error) return { error: `No se pudo guardar el objetivo: ${error.message}` };

  revalidatePath("/dashboard");
  revalidatePath("/goals");
  return { success: "Objetivo guardado: el dashboard lo seguirá a partir de ahora." };
}
