import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  async function login(formData: FormData) {
    "use server";
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="card w-full max-w-sm p-8">
        <Link href="/" className="mb-6 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 17l5-10 4 7 3-4 6 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-semibold tracking-tight">
            Pace<span className="text-accent">AI</span>
          </span>
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">Entrar</h1>
        <p className="mb-6 mt-1 text-sm text-ink-2">
          Modo demo: cualquier email funciona.
        </p>
        <form action={login} className="space-y-3">
          <input
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            className="h-11 w-full rounded-xl border border-line bg-elevated px-4 text-sm outline-none transition-colors focus:border-[var(--accent)]"
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            className="h-11 w-full rounded-xl border border-line bg-elevated px-4 text-sm outline-none transition-colors focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="h-11 w-full rounded-xl bg-accent text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Entrar
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-ink-3">
          ¿Solo quieres mirar?{" "}
          <Link href="/dashboard" className="text-accent hover:underline">
            Explora la demo
          </Link>
        </p>
      </div>
    </div>
  );
}
