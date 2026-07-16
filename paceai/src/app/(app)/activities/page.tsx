import type { Metadata } from "next";
import Link from "next/link";
import { getAnalysis } from "@/lib/data";
import { analyzePacing } from "@/lib/engine";
import { formatDuration, formatKm, formatPace, WORKOUT_LABELS } from "@/lib/format";
import { Badge, WORKOUT_TONES } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Actividades" };

const STRATEGY_LABEL: Record<string, { label: string; tone: "good" | "neutral" | "serious" | "warning" }> = {
  negative: { label: "▼ Split negativo", tone: "good" },
  even: { label: "▬ Ritmo estable", tone: "neutral" },
  positive: { label: "▲ Se desinfló", tone: "serious" },
  erratic: { label: "≈ Variable", tone: "warning" },
};

export default async function ActivitiesPage() {
  const { activities } = await getAnalysis();
  const sorted = [...activities].reverse();

  if (sorted.length === 0) {
    return (
      <div className="space-y-4">
        <header className="fade-up">
          <h1 className="text-xl font-semibold tracking-tight">Actividades</h1>
        </header>
        <EmptyState />
      </div>
    );
  }

  // Group by month for scannability.
  const groups = new Map<string, typeof sorted>();
  for (const a of sorted) {
    const key = new Date(a.date).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }

  return (
    <div className="space-y-6">
      <header className="fade-up">
        <h1 className="text-xl font-semibold tracking-tight">Actividades</h1>
        <p className="mt-1 text-sm text-ink-2">
          {sorted.length} entrenamientos analizados. Cada uno tiene su informe completo.
        </p>
      </header>

      {[...groups.entries()].map(([month, acts]) => (
        <section key={month} className="fade-up">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-3">{month}</h2>
          <Card className="!p-0">
            <ul className="divide-y divide-[var(--border)]">
              {acts.map((a) => {
                const pacing = analyzePacing(a);
                const strat = STRATEGY_LABEL[pacing.strategy];
                return (
                  <li key={a.id}>
                    <Link
                      href={`/activities/${a.id}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors hover:bg-hover"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{a.name}</p>
                        <p className="text-xs text-ink-3">
                          {new Date(a.date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                      <Badge tone={WORKOUT_TONES[a.type]}>{WORKOUT_LABELS[a.type]}</Badge>
                      <Badge tone={strat.tone}>{strat.label}</Badge>
                      <span className="tnum w-20 text-right text-sm text-ink-2">{formatKm(a.distanceKm)}</span>
                      <span className="tnum w-16 text-right text-sm text-ink-2">{formatDuration(a.durationSec)}</span>
                      <span className="tnum w-20 text-right text-sm font-medium">{formatPace(a.avgPaceSecKm)}/km</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  );
}
