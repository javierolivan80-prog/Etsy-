import type { Activity, RacePlan, RacePlanKm } from "./types";
import { estimateVdot, predictTime } from "./vdot";

/**
 * Km-by-km race plan. Strategy: slight negative split —
 * open ~2% slower than goal pace, settle at goal pace through the middle,
 * close the final quarter progressively faster. This protects glycogen and
 * avoids the above-threshold opening that causes late-race fade.
 */
export function buildRacePlan(
  activities: Activity[],
  distanceKm: number,
  targetSeconds: number,
): RacePlan {
  const vdot = estimateVdot(activities);
  const feasibleTime = predictTime(distanceKm, vdot);
  const feasible = targetSeconds >= feasibleTime * 0.97;

  const goalPace = targetSeconds / distanceKm;
  const nKm = Math.ceil(distanceKm);
  const kms: RacePlanKm[] = [];

  // Pace multipliers per phase.
  const openKms = Math.max(1, Math.round(nKm * 0.15));
  const closeKms = Math.max(1, Math.round(nKm * 0.25));

  const rawPaces: number[] = [];
  for (let i = 1; i <= nKm; i++) {
    let mult: number;
    if (i <= openKms) {
      mult = 1.02 - (i - 1) * (0.02 / openKms); // ease in from +2%
    } else if (i > nKm - closeKms) {
      const j = i - (nKm - closeKms); // 1..closeKms
      mult = 1 - (j / closeKms) * 0.025; // wind up to −2.5%
    } else {
      mult = 1.0;
    }
    rawPaces.push(goalPace * mult);
  }
  // Normalize so the plan sums exactly to the target time.
  const lastKmDist = distanceKm - (nKm - 1);
  const total = rawPaces.reduce((s, p, i) => s + p * (i === nKm - 1 ? lastKmDist : 1), 0);
  const k = targetSeconds / total;

  let cumulative = 0;
  for (let i = 1; i <= nKm; i++) {
    const pace = rawPaces[i - 1] * k;
    const dist = i === nKm ? lastKmDist : 1;
    cumulative += pace * dist;
    let note: string | undefined;
    if (i === 1) note = "Controlado: que te adelanten";
    else if (i === openKms + 1) note = "Asentado en ritmo objetivo";
    else if (i === nKm - closeKms + 1) note = "Empieza a apretar";
    else if (i === nKm) note = "Todo lo que quede";
    kms.push({ km: i, paceSecKm: Math.round(pace), cumulativeSec: Math.round(cumulative), note });
  }

  const strategy = feasible
    ? `Plan en split negativo: los primeros ${openKms} km ligeramente por debajo del ritmo objetivo para preservar glucógeno y no superar tu umbral pronto; parte central estable; últimos ${closeKms} km en progresión. Tu predicción actual (${Math.round(feasibleTime / 60)} min) hace este objetivo alcanzable si ejecutas el plan con disciplina.`
    : `Este objetivo está por delante de tu forma actual (predicción: ${Math.round(feasibleTime / 60)} min). El plan sigue una progresión conservadora, pero considera ajustar el objetivo o darle unas semanas más de entrenamiento específico.`;

  return { distanceKm, targetSeconds, feasible, kms, strategy };
}
