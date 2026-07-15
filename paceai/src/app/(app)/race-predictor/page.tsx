import type { Metadata } from "next";
import { getAnalysis } from "@/lib/data";
import { buildRacePlan } from "@/lib/engine";
import { formatDuration, formatPace } from "@/lib/format";
import { Card, Stat } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Race Predictor" };

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

export default async function RacePredictorPage(props: {
  searchParams: Promise<{ dist?: string; time?: string }>;
}) {
  const sp = await props.searchParams;
  const { activities, analysis } = await getAnalysis();

  const distanceKm = parseFloat(sp.dist ?? "10") || 10;
  const defaultTarget = analysis.predictions.races.find((r) => Math.abs(r.distanceKm - distanceKm) < 0.01)?.seconds ?? 45 * 60;
  const targetSeconds = parseTime(sp.time ?? "") ?? Math.round(defaultTarget);
  const plan = buildRacePlan(activities, distanceKm, targetSeconds);
  const distLabel = DISTANCES.find((d) => Math.abs(d.km - distanceKm) < 0.01)?.label ?? `${distanceKm} km`;

  return (
    <div className="space-y-4">
      <header className="fade-up">
        <h1 className="text-xl font-semibold tracking-tight">Race Predictor</h1>
        <p className="mt-1 text-sm text-ink-2">
          Tu plan de ritmos kilómetro a kilómetro, calculado sobre tu forma real.
        </p>
      </header>

      <Card className="fade-up" title="Configura tu carrera">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-xs text-ink-2">
            Carrera
            <select
              name="dist"
              defaultValue={String(distanceKm)}
              className="h-10 rounded-lg border border-line bg-elevated px-3 text-sm text-ink outline-none focus:border-[var(--accent)]"
            >
              {DISTANCES.map((d) => (
                <option key={d.km} value={d.km}>{d.label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-ink-2">
            Objetivo
            <input
              name="time"
              defaultValue={formatDuration(targetSeconds)}
              className="tnum h-10 w-32 rounded-lg border border-line bg-elevated px-3 text-sm text-ink outline-none focus:border-[var(--accent)]"
            />
          </label>
          <button
            type="submit"
            className="h-10 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Generar plan
          </button>
        </form>
      </Card>

      <div className="fade-up grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <Stat label="Carrera" value={distLabel} sub={`Objetivo ${formatDuration(targetSeconds)}`} accent />
        </Card>
        <Card>
          <Stat label="Ritmo objetivo medio" value={`${formatPace(targetSeconds / distanceKm)}/km`} />
        </Card>
        <Card className="flex items-center justify-between">
          <Stat label="Veredicto" value={plan.feasible ? "Alcanzable" : "Ambicioso"} />
          <Badge tone={plan.feasible ? "good" : "warning"}>
            {plan.feasible ? "✓ A tu alcance" : "⚠ Por encima de tu forma"}
          </Badge>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="fade-up lg:col-span-3" title="Plan kilómetro a kilómetro">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-ink-3">
                <tr>
                  <th className="pb-2 pr-4 font-medium">Km</th>
                  <th className="pb-2 pr-4 font-medium">Ritmo</th>
                  <th className="pb-2 pr-4 font-medium">Acumulado</th>
                  <th className="pb-2 font-medium">Indicación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {plan.kms.map((k) => (
                  <tr key={k.km} className="transition-colors hover:bg-hover">
                    <td className="tnum py-2 pr-4">{k.km}</td>
                    <td className="tnum py-2 pr-4 font-medium">{formatPace(k.paceSecKm)}</td>
                    <td className="tnum py-2 pr-4 text-ink-2">{formatDuration(k.cumulativeSec)}</td>
                    <td className="py-2 text-xs text-ink-2">{k.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="fade-up lg:col-span-2" title="Por qué este plan">
          <p className="text-sm leading-relaxed text-ink-2">{plan.strategy}</p>
          <div className="mt-4 rounded-xl bg-hover p-4 text-xs leading-relaxed text-ink-2">
            <p className="mb-1 font-medium text-ink">Referencias de tu forma actual</p>
            <p>VDOT {analysis.predictions.vdot} · Umbral {formatPace(analysis.predictions.thresholdPaceSecKm)}/km</p>
            <p className="mt-1">
              Predicciones: {analysis.predictions.races.map((r) => `${r.label} ${formatDuration(r.seconds)}`).join(" · ")}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
