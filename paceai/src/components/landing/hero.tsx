"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export function Hero() {
  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-20 pt-16 text-center sm:pt-24"
    >
      <motion.span
        variants={item}
        className="mb-6 rounded-full border border-line bg-elevated px-3 py-1 text-xs text-ink-2"
      >
        Project PaceAI · El analista inteligente para corredores
      </motion.span>
      <motion.h1
        variants={item}
        className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl"
      >
        Tus entrenamientos ya tienen datos.
        <br />
        <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--series-7)] bg-clip-text text-transparent">
          Ahora tienen entrenador.
        </span>
      </motion.h1>
      <motion.p variants={item} className="mt-6 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
        Strava te enseña un gráfico. PaceAI te dice qué significa, qué error cometiste en el km 7,
        cuándo bajarás de 45 minutos en 10K y qué debes hacer mañana.
      </motion.p>
      <motion.div variants={item} className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Analizar mis entrenamientos
        </Link>
        <Link
          href="/chat"
          className="rounded-lg border border-line bg-elevated px-6 py-3 text-sm text-ink transition-colors hover:bg-hover"
        >
          Hablar con el entrenador
        </Link>
      </motion.div>

      <motion.div variants={item} className="mt-16 w-full max-w-3xl">
        <div className="card p-6 text-left shadow-2xl shadow-black/20">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-3">
            Informe del entrenamiento de hoy
          </p>
          <p className="text-sm leading-relaxed text-ink-2">
            Hoy hiciste <span className="font-medium text-ink">12 km a 5:03/km</span>. Sin embargo, los
            primeros 4 km fueron demasiado rápidos: tu frecuencia cardíaca indica que corriste por
            encima de tu umbral demasiado pronto.{" "}
            <span className="font-medium text-ink">
              Si hubieras salido 10 segundos más lento por kilómetro, habrías terminado 48 segundos antes.
            </span>{" "}
            Este entrenamiento mejora tu resistencia aeróbica; no mejora demasiado tu velocidad.
          </p>
        </div>
      </motion.div>
    </motion.section>
  );
}
