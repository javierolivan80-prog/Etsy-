import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Nueva contraseña"
      subtitle="Elige una contraseña nueva para tu cuenta."
    >
      <ResetForm />
    </AuthShell>
  );
}
