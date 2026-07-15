import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bot } from "lucide-react";
import { getActivity, getAnalysis } from "@/lib/data";
import { buildActivityReport } from "@/lib/engine";
import { generateNarrativeReport } from "@/lib/ai/coach";
import { hasAiProvider } from "@/lib/ai/provider";
import { buildCoachContext } from "@/lib/ai/coach";
import { formatDuration, formatKm, formatPace, WORKOUT_LABELS } from "@/lib/format";
import { Badge, WORKOUT_TONES } from "@/components/ui/badge";
import { Card, Stat } from "@/components/ui/card";
import { SplitsChart } from "@/components/charts/splits-chart";

export const metadata: Metadata = { title: "Análisis del entrenamiento" };

export default async function ActivityPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const activity = await getActivity(decodeURIComponent(id));
  if (!activity) notFound();

  const { activities, profile, analysis } = await getAnalysis();
  const report = buildActivityReport(activity, activities, profile);

  // Optional LLM narrative on top of the deterministic report.
  let narrative: string | null = null;
  if (hasAiProvider()) {
    try {
      narrative = await generateNarrativeReport(
        `Entrenamiento a analizar:\n${report.headline}\n${report.paragraphs.join("\n")}\n\nContexto del atleta:\n${buildCoachContext(activities, profile, analysis)}`,
      );
    } catch {
      narrative = null; // fall back silently to the engine report
    }
  }

  const stats: { label: string; value: string }[] = [
    { label: "Distancia", value: formatKm(activity.distanceKm, 2) },
    { label: "Tiempo", value: formatDuration(activity.durationSec) },
    { label: "Ritmo medio", value: `${formatPace(activity.avgPaceSecKm)}/km` },
    ...(activity.avgHr ? [{ label: "FC media", value: `${activity.avgHr} ppm` }] : []),
    ...(activity.maxHr ? [{ label: "FC máx", value: `${activity.maxHr} ppm` }] : []),
    ...(activity.elevationGainM ? [{ label: "Desnivel +", value: `${activity.elevationGainM} m` }] : []),
    ...(activity.cadenceSpm ? [{ label: "Cadencia", value: `${activity.cadenceSpm} spm` }] : []),
    ...(activity.strideLenM ? [{ label: "Zancada", value: `${activity.strideLenM} m` }] : []),
    ...(activity.powerW ? [{ label: "Potencia", value: `${activity.powerW} W` }] : []),
    ...(activity.calories ? [{ label: "Calorías", value: `${activity.calories} kcal` }] : []),
  ];

  return (
    <div className="space-y-4">
      <Link href="/activities" className="fade-up inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft size={15} /> Actividades
      </Link>

      <header className="fade-up flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{activity.name}</h1>
        <Badge tone={WORKOUT_TONES[activity.type]}>{WORKOUT_LABELS[activity.type]}</Badge>
        <span className="text-sm text-ink-3">
          {new Date(activity.date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </span>
      </header>

      <div className="fade-up grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="!p-4">
            <Stat label={s.label} value={s.value} />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="fade-up lg:col-span-3" title="Ritmo por kilómetro" subtitle="Los km en naranja son más lentos que tu media de la sesión">
          <SplitsChart splits={activity.splits} avgPace={activity.avgPaceSecKm} />
        </Card>

        <Card className="fade-up lg:col-span-2" title="Parciales">
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-ink-3">
                <tr>
                  <th className="pb-2 font-medium">Km</th>
                  <th className="pb-2 font-medium">Ritmo</th>
                  <th className="pb-2 font-medium">FC</th>
                </tr>
              </thead>
              <tbody className="tnum divide-y divide-[var(--border)] text-ink-2">
                {activity.splits.map((s) => (
                  <tr key={s.km}>
                    <td className="py-1.5">{s.km}</td>
                    <td className="py-1.5">{formatPace(s.seconds / s.distanceKm)}/km</td>
                    <td className="py-1.5">{s.avgHr ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="fade-up" title="Informe del entrenador" subtitle={narrative ? "Generado por IA sobre tu histórico completo" : "Motor de análisis PaceAI"}>
        <div className="flex gap-4">
          <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-accent sm:grid">
            <Bot size={19} />
          </span>
          <div className="space-y-3 text-sm leading-relaxed text-ink-2">
            {narrative ? (
              narrative.split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <>
                {report.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <p>
                  <span className="font-medium text-ink">Efecto del entrenamiento: </span>
                  {report.effect}
                </p>
                <p>
                  <span className="font-medium text-ink">Qué hacer ahora: </span>
                  {report.advice}
                </p>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
