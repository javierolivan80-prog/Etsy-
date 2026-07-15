import type { Activity, GoalAnalysis, GoalSimulation } from "./types";
import { estimateVdot, predictTime, vdotFromPerformance } from "./vdot";
import { kmInWindow } from "./training-load";

/**
 * Historical VDOT trend: fit a linear regression over per-month VDOT
 * estimates to measure current improvement rate (VDOT points / month).
 */
export function vdotTrendPerMonth(activities: Activity[]): number {
  const byMonth = new Map<string, Activity[]>();
  for (const a of activities) {
    const key = a.date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(a);
  }
  const months = [...byMonth.keys()].sort();
  if (months.length < 3) return 0.35; // sensible default for a consistent runner
  const points = months.map((m, i) => ({ x: i, y: estimateVdot(byMonth.get(m)!) }));
  const n = points.length;
  const sx = points.reduce((s, p) => s + p.x, 0);
  const sy = points.reduce((s, p) => s + p.y, 0);
  const sxy = points.reduce((s, p) => s + p.x * p.y, 0);
  const sxx = points.reduce((s, p) => s + p.x * p.x, 0);
  const slope = (n * sxy - sx * sy) / Math.max(1e-9, n * sxx - sx * sx);
  return Math.max(-0.5, Math.min(1.2, slope));
}

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Analyze a target ("10K in 45:00"): probability today, estimated date at
 * the current improvement rate, and what-if simulations.
 */
export function analyzeGoal(
  activities: Activity[],
  distanceKm: number,
  targetSeconds: number,
): GoalAnalysis {
  const vdot = estimateVdot(activities);
  const currentPrediction = predictTime(distanceKm, vdot);
  const requiredVdot = vdotFromPerformance(distanceKm, targetSeconds);
  const gap = requiredVdot - vdot; // VDOT points still missing

  // Probability of achieving it *today*: logistic on the relative gap.
  const probabilityPct = Math.round(logistic(-gap * 1.1 + 0.4) * 100);

  const baseRate = Math.max(0.05, vdotTrendPerMonth(activities));
  const monthsNeeded = gap <= 0 ? 0 : gap / baseRate;

  const estimate = (months: number) => {
    const d = new Date();
    d.setDate(d.getDate() + Math.round(Math.min(48, months) * 30.4));
    return d.toISOString();
  };

  const simulations: GoalSimulation[] = [];
  if (gap > 0) {
    // +15% weekly volume ⇒ ~35% faster VDOT growth (aerobic base).
    const volMonths = gap / (baseRate * 1.35);
    simulations.push({
      scenario: "Si aumentas tu volumen semanal un 15%",
      probabilityPct: Math.round(logistic(-(gap * 0.8) * 1.1 + 0.4) * 100),
      estimatedDate: estimate(volMonths),
    });
    // Extra interval session ⇒ ~55% faster growth toward race-specific speed.
    const intMonths = gap / (baseRate * 1.55);
    simulations.push({
      scenario: "Si añades una sesión de series semanal",
      probabilityPct: Math.round(logistic(-(gap * 0.7) * 1.1 + 0.4) * 100),
      estimatedDate: estimate(intMonths),
    });
    // Both.
    const bothMonths = gap / (baseRate * 1.9);
    simulations.push({
      scenario: "Si combinas ambas cosas",
      probabilityPct: Math.round(logistic(-(gap * 0.55) * 1.1 + 0.4) * 100),
      estimatedDate: estimate(bothMonths),
    });
  }

  const weekly = kmInWindow(activities, 28) / 4;
  if (gap > 6 && weekly < 25) {
    simulations.push({
      scenario: "Nota: con menos de 25 km/semana este objetivo exigirá construir mucha más base",
      probabilityPct,
      estimatedDate: estimate(monthsNeeded * 1.3),
    });
  }

  return {
    distanceKm,
    targetSeconds,
    currentPrediction,
    probabilityPct,
    estimatedDate: estimate(monthsNeeded),
    simulations,
  };
}
