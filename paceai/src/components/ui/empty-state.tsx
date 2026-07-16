import Link from "next/link";
import { Upload } from "lucide-react";

/** Friendly first-run state: guides the user to import their first workout. */
export function EmptyState({
  title = "Aún no hay entrenamientos",
  text = "Importa tu primer archivo GPX o TCX y el motor de análisis se pondrá a trabajar: informe de la sesión, predicciones y estado de forma.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="card fade-up flex flex-col items-center gap-4 px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-accent">
        <Upload size={22} />
      </span>
      <div>
        <h2 className="font-medium">{title}</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-ink-2">{text}</p>
      </div>
      <Link
        href="/import"
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Importar mi primer entrenamiento
      </Link>
    </div>
  );
}
