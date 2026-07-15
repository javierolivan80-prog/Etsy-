import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Brain, LineChart, ShieldAlert, Target } from "lucide-react";
import { Hero } from "@/components/landing/hero";

export const metadata: Metadata = {
  title: "PaceAI — Tu entrenador de running con IA, disponible 24 horas",
};

const FEATURES = [
  {
    icon: Brain,
    title: "Interpreta, no muestra",
    text: "Cada entrenamiento recibe un informe de entrenador: qué significa, qué hiciste mal y qué mejora produce en tu cuerpo.",
  },
  {
    icon: Target,
    title: "Predice tus marcas",
    text: "5K, 10K, media y maratón. Y si te marcas un objetivo, te dice la probabilidad, la fecha estimada y qué cambiar para adelantarla.",
  },
  {
    icon: ShieldAlert,
    title: "Detecta errores y lesiones",
    text: "Sales demasiado rápido. No recuperas. Demasiado volumen, poca intensidad. PaceAI vigila tu carga y te avisa antes de romperte.",
  },
  {
    icon: LineChart,
    title: "Un plan para cada carrera",
    text: "Plan de ritmos kilómetro a kilómetro basado en tu forma real, con la estrategia explicada como lo haría un entrenador olímpico.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 17l5-10 4 7 3-4 6 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-semibold tracking-tight">
            Pace<span className="text-accent">AI</span>
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm text-ink-2 transition-colors hover:text-ink">
            Entrar
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Probar la demo
          </Link>
        </nav>
      </header>

      <Hero />

      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-6 pb-24 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card card-hover p-6">
            <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-accent">
              <Icon size={20} strokeWidth={1.9} />
            </span>
            <h3 className="mb-1.5 font-medium">{title}</h3>
            <p className="text-sm leading-relaxed text-ink-2">{text}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-6 py-20 text-center">
          <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
            No es un diario. No es un tracker.
            <br />
            <span className="text-ink-2">Es un entrenador que analiza absolutamente todo.</span>
          </h2>
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Ver mi análisis
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-xs text-ink-3">
        Project PaceAI · Análisis inteligente de rendimiento para corredores
      </footer>
    </div>
  );
}
