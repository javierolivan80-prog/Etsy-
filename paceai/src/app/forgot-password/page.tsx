import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para restablecerla."
      footer={
        <Link href="/login" className="text-accent hover:underline">
          Volver a entrar
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
