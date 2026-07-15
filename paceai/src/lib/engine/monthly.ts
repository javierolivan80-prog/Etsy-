import type { Activity, MonthlySummary, WorkoutType } from "./types";
import { formatPace } from "@/lib/format";
import { estimateVdot } from "./vdot";

/** Aggregate + interpret the trailing 30 days vs the 30 days before. */
export function monthlySummary(activities: Activity[]): MonthlySummary {
  const now = new Date();
  const from = new Date(now.getTime() - 30 * 864e5);
  const prevFrom = new Date(now.getTime() - 60 * 864e5);

  const inWindow = (a: Activity, f: Date, t: Date) => {
    const d = new Date(a.date);
    return d >= f && d < t;
  };
  const month = activities.filter((a) => inWindow(a, from, now));
  const prev = activities.filter((a) => inWindow(a, prevFrom, from));

  const totalKm = month.reduce((s, a) => s + a.distanceKm, 0);
  const totalSec = month.reduce((s, a) => s + a.durationSec, 0);
  const prevKm = prev.reduce((s, a) => s + a.distanceKm, 0);
  const avgPaceSecKm = totalKm > 0 ? totalSec / totalKm : 0;

  const byType = { easy: 0, long: 0, tempo: 0, intervals: 0, recovery: 0, race: 0 } as Record<
    WorkoutType,
    number
  >;
  for (const a of month) byType[a.type]++;

  const conclusions: string[] = [];
  if (prevKm > 0) {
    const deltaPct = ((totalKm - prevKm) / prevKm) * 100;
    if (deltaPct > 8) conclusions.push(`Tu volumen aumenta: +${Math.round(deltaPct)}% respecto al mes anterior.`);
    else if (deltaPct < -8) conclusions.push(`Tu volumen ha bajado un ${Math.abs(Math.round(deltaPct))}% respecto al mes anterior.`);
    else conclusions.push("Tu volumen se mantiene estable respecto al mes anterior.");
  }

  const vdotNow = month.length >= 3 ? estimateVdot(month) : null;
  const vdotPrev = prev.length >= 3 ? estimateVdot(prev) : null;
  if (vdotNow && vdotPrev) {
    const d = vdotNow - vdotPrev;
    if (d > 0.4) conclusions.push(`Tu velocidad mejora: el ritmo equivalente ha bajado (~+${d.toFixed(1)} puntos VDOT).`);
    else if (d < -0.4) conclusions.push("Tu velocidad ha retrocedido ligeramente este mes.");
    else conclusions.push("Tu velocidad no mejora al mismo ritmo que tu volumen.");
  }

  const quality = byType.intervals + byType.tempo;
  if (month.length > 6 && quality < 3) {
    conclusions.push("Necesitas más entrenamiento de calidad: menos de una sesión intensa por semana.");
  } else if (quality >= 4) {
    conclusions.push("Buena dosis de trabajo de calidad este mes.");
  }
  if (byType.long === 0 && month.length > 4) {
    conclusions.push("No hay rodajes largos este mes: tu resistencia de fondo se resentirá.");
  }
  if (conclusions.length === 0) {
    conclusions.push("Todavía hay pocos datos este mes para sacar conclusiones sólidas.");
  }
  if (avgPaceSecKm > 0) {
    conclusions.push(`Ritmo medio del mes: ${formatPace(avgPaceSecKm)}/km en ${month.length} sesiones.`);
  }

  return {
    from: from.toISOString(),
    to: now.toISOString(),
    totalKm: Math.round(totalKm * 10) / 10,
    totalSec,
    avgPaceSecKm,
    runs: month.length,
    byType,
    elevationGainM: Math.round(month.reduce((s, a) => s + (a.elevationGainM ?? 0), 0)),
    conclusions,
  };
}
