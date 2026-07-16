import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage(props: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await props.searchParams;
  return (
    <AuthShell
      title="Entrar"
      subtitle="Tu entrenador te está esperando."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-accent hover:underline">
            Regístrate gratis
          </Link>
        </>
      }
    >
      <LoginForm next={sp.next} initialError={sp.error} />
    </AuthShell>
  );
}
