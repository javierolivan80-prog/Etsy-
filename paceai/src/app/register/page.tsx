import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Regístrate y empieza a entrenar con cabeza: tus datos quedan guardados en tu cuenta, accesibles desde cualquier dispositivo."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
