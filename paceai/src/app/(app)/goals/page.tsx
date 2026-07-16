import type { Metadata } from "next";
import { getAnalysis } from "@/lib/data";
import { analyzeGoal } from "@/lib/engine";
import { formatDuration, formatMonthYear, formatPace } from "@/lib/format";
import { Card, Stat } from "@/components/ui/card";
import { SaveGoal } from "@/components/goals/save-goal";

export const metadata: Metadata = { title: "Objetivos" };

const DISTANCES = [
  { km: 5, label: "5K" },
  { km: 10, label: "10K" },
  { km: 21.0975, label: "Media maratón" },
  { km: 42.195, label: "Maratón" },
];

function parseTime(input: string): number | null {
  const parts = input.split(":").map((p) => parseInt(p, 10));
  if (parts.some((p) => isNaN(p))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

export default async function GoalsPage(props: {
  searchParams: Promise<{ dist?: string; time?: string }>;
}) {
  const sp = await props.searchParams;
  const distanceKm = parseFloat(sp.dist ?? "10") || 10;
  const targetSeconds = parseTime(sp.time ?? "") ?? 45 * 60;

  const { activities, analysis } = await getAnalysis();
  const goal = analyzeGoal(activities, distanceKm, targetSeconds);
  const distLabel = DISTANCES.find((d) => Math.abs(d.km - distanceKm) < 0.01)?.label ?? `${distanceKm} km`;

  return (
    <div className="space-y-4">
      <header className="fade-up">
        <h1 className="text-xl font-semibold tracking-tight">Objetivos</h1>
        <p className="mt-1 text-sm text-ink-2">
          Dinos qué quieres conseguir y te diremos cuándo — y cómo adelantarlo.
        </p>
      </header>

      <Card className="fade-up" title="Quiero hacer…">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-xs text-ink-2">
            Distancia
            <select
              name="dist"
              defaultValue={String(distanceKm)}
              className="h-10 rounded-lg border border-line bg-elevated px-3 text-sm text-ink outline-none focus:border-[var(--accent)]"
            >
              {DISTANCES.map((d) => (
                <option key={d.km} value={d.km}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-ink-2">
            Tiempo objetivo (mm:ss o h:mm:ss)
            <input
              name="time"
              defaultValue={formatDuration(targetSeconds)}
              placeholder="45:00"
              className="tnum h-10 w-32 rounded-lg border border-line bg-elevated px-3 text-sm text-ink outline-none focus:border-[var(--accent)]"
            />
          </label>
          <button
            type="submit"
            className="h-10 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Analizar objetivo
          </button>
        </form>
        <div className="mt-3 border-t border-line pt-3">
          <SaveGoal distanceKm={distanceKm} targetSeconds={targetSeconds} />
        </div>
      </Card>

      <div className="fade-up grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <Stat label="Probabilidad actual" value={`${goal.probabilityPct}%`} accent
            sub={`${distLabel} en ${formatDuration(targetSeconds)} (${formatPace(targetSeconds / distanceKm)}/km)`} />
        </Card>
        <Card>
          <Stat label="Fecha estimada" value={formatMonthYear(goal.estimatedDate)}
            sub="Manteniendo tu progresión actual" />
        </Card>
        <Card>
          <Stat label="Tu predicción hoy" value={formatDuration(goal.currentPrediction)}
            sub={`${formatPace(goal.currentPrediction / distanceKm)}/km · VDOT ${analysis.predictions.vdot}`} />
        </Card>
      </div>

      <Card className="fade-up" title="Simulaciones" subtitle="Qué pasaría si cambias tu entrenamiento">
        {goal.simulations.length === 0 ? (
          <p className="text-sm text-ink-2">
            🎉 Este objetivo ya está a tu alcance con tu forma actual. Ve a Race Predictor para preparar el plan de ritmos.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {goal.simulations.map((s) => (
              <li key={s.scenario} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="text-ink-2">{s.scenario}</span>
                <span className="flex items-center gap-4">
                  <span className="tnum text-ink-3">{s.probabilityPct}% hoy</span>
                  <span className="tnum font-medium text-accent">{formatMonthYear(s.estimatedDate)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
