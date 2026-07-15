import type { Activity, Insight } from "./types";
import { analyzePacing } from "./pacing";
import { estimateVdot } from "./vdot";

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Data-mined observations across the athlete's history. */
export function generateInsights(activities: Activity[]): Insight[] {
  const insights: Insight[] = [];
  const recent = activities.filter((a) => new Date(a.date) > new Date(Date.now() - 90 * 864e5));
  if (recent.length < 5) return insights;

  // 1. Month-over-month improvement.
  const thisMonth = recent.filter((a) => new Date(a.date) > new Date(Date.now() - 30 * 864e5));
  const prevMonth = recent.filter((a) => {
    const d = new Date(a.date);
    return d <= new Date(Date.now() - 30 * 864e5) && d > new Date(Date.now() - 60 * 864e5);
  });
  if (thisMonth.length >= 3 && prevMonth.length >= 3) {
    const vNow = estimateVdot(thisMonth);
    const vPrev = estimateVdot(prevMonth);
    const pct = ((vNow - vPrev) / vPrev) * 100;
    if (pct > 0.8) {
      insights.push({
        id: "improvement",
        kind: "improvement",
        text: `Has mejorado un ${pct.toFixed(1)}% este mes.`,
        detail: "Tu VDOT estimado sube respecto al mes pasado: el entrenamiento está funcionando.",
      });
    } else if (pct < -0.8) {
      insights.push({
        id: "regression",
        kind: "warning",
        text: `Tu forma ha caído un ${Math.abs(pct).toFixed(1)}% este mes.`,
        detail: "Puede ser fatiga acumulada o falta de intensidad. Revisa tu carga reciente.",
      });
    }
  }

  // 2. Long-run consistency.
  const longs = recent.filter((a) => a.type === "long");
  if (longs.length >= 3) {
    const paces = longs.map((a) => analyzePacing(a).variabilityPct);
    const older = paces.slice(0, Math.floor(paces.length / 2));
    const newer = paces.slice(Math.floor(paces.length / 2));
    const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    if (avg(newer) < avg(older) - 0.5) {
      insights.push({
        id: "long-consistency",
        kind: "improvement",
        text: "Tus rodajes largos son cada vez más constantes.",
        detail: `Variabilidad de ritmo: ${avg(older).toFixed(1)}% → ${avg(newer).toFixed(1)}%. Control creciente del esfuerzo.`,
      });
    }
  }

  // 3. Km where pace collapses.
  const fades = recent
    .map((a) => analyzePacing(a).fadeStartKm)
    .filter((k): k is number => k !== null);
  if (fades.length >= 3) {
    const counts = new Map<number, number>();
    for (const k of fades) counts.set(k, (counts.get(k) ?? 0) + 1);
    const [km, n] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (n >= 2) {
      insights.push({
        id: "fade-km",
        kind: "pattern",
        text: `Pierdes demasiado ritmo después del kilómetro ${km}.`,
        detail: `Ha ocurrido en ${n} sesiones recientes. Suele indicar salida rápida o falta de resistencia específica.`,
      });
    }
  }

  // 4. Best weekday.
  const byDay = new Map<number, number[]>();
  for (const a of recent.filter((x) => x.type !== "recovery")) {
    const d = new Date(a.date).getDay();
    if (!byDay.has(d)) byDay.set(d, []);
    // Normalize pace by distance (longer runs are naturally slower).
    byDay.get(d)!.push(a.avgPaceSecKm / (1 + Math.log10(Math.max(1, a.distanceKm)) * 0.08));
  }
  const dayAverages = [...byDay.entries()]
    .filter(([, v]) => v.length >= 3)
    .map(([d, v]) => ({ d, pace: v.reduce((s, x) => s + x, 0) / v.length }));
  if (dayAverages.length >= 3) {
    dayAverages.sort((a, b) => a.pace - b.pace);
    const best = dayAverages[0];
    const worst = dayAverages[dayAverages.length - 1];
    if ((worst.pace - best.pace) / worst.pace > 0.02) {
      insights.push({
        id: "best-day",
        kind: "pattern",
        text: `Los ${DAY_NAMES[best.d]} siempre rindes mejor.`,
        detail: `Tu ritmo normalizado es un ${(((worst.pace - best.pace) / worst.pace) * 100).toFixed(0)}% más rápido que tu peor día. Programa ahí tus sesiones clave.`,
      });
    }
  }

  // 5. Effect of rest days.
  const sorted = [...recent].sort((a, b) => a.date.localeCompare(b.date));
  const rested: number[] = [];
  const tired: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].type === "recovery" || sorted[i].type === "easy") continue;
    const gapDays = (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / 864e5;
    const norm = sorted[i].avgPaceSecKm / (1 + Math.log10(Math.max(1, sorted[i].distanceKm)) * 0.08);
    if (gapDays >= 2) rested.push(norm);
    else tired.push(norm);
  }
  if (rested.length >= 3 && tired.length >= 3) {
    const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    const gain = ((avg(tired) - avg(rested)) / avg(tired)) * 100;
    if (gain > 1.5) {
      insights.push({
        id: "rest-effect",
        kind: "pattern",
        text: `Cuando descansas dos días corres un ${gain.toFixed(0)}% más rápido.`,
        detail: "Tu cuerpo responde bien a la supercompensación: no temas al descanso.",
      });
    }
  }

  // 6. Untapped potential.
  const quality = recent.filter((a) => a.type === "intervals" || a.type === "tempo").length;
  const volume = recent.reduce((s, a) => s + a.distanceKm, 0);
  if (volume > 250 && quality / Math.max(1, recent.length) < 0.12) {
    insights.push({
      id: "potential",
      kind: "potential",
      text: "No estás aprovechando tu potencial.",
      detail:
        "Tienes una base aeróbica sólida pero casi sin trabajo de velocidad. Con 6–8 semanas de series bajarías marcas de forma clara.",
    });
  }

  return insights;
}
