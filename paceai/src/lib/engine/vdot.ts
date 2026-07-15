import type { Activity, Predictions, RacePrediction } from "./types";

/**
 * Jack Daniels' VDOT model.
 *
 * vo2(v)  — oxygen cost of running at v m/min
 * pct(t)  — fraction of VO2max sustainable for t minutes
 * A race performance (distance, time) therefore implies
 * VDOT = vo2(d/t) / pct(t).
 */
function vo2AtVelocity(vMetersPerMin: number): number {
  return -4.6 + 0.182258 * vMetersPerMin + 0.000104 * vMetersPerMin ** 2;
}

function pctVo2Max(tMinutes: number): number {
  return (
    0.8 + 0.1894393 * Math.exp(-0.012778 * tMinutes) + 0.2989558 * Math.exp(-0.1932605 * tMinutes)
  );
}

export function vdotFromPerformance(distanceKm: number, seconds: number): number {
  const t = seconds / 60;
  const v = (distanceKm * 1000) / t;
  return vo2AtVelocity(v) / pctVo2Max(t);
}

/** Solve race time for a distance given a VDOT, via bisection on time. */
export function predictTime(distanceKm: number, vdot: number): number {
  let lo = distanceKm * 2 * 60; // absurdly fast: 2 min/km
  let hi = distanceKm * 12 * 60; // very slow: 12 min/km
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const impliedVdot = vdotFromPerformance(distanceKm, mid);
    // Slower time ⇒ lower implied VDOT
    if (impliedVdot > vdot) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Pick the athlete's best recent performances (last 90 days) and derive the
 * effective VDOT. Interval/tempo/race efforts weight the estimate; easy runs
 * are ignored because they don't reflect capacity.
 */
export function estimateVdot(activities: Activity[]): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const candidates = activities.filter(
    (a) =>
      new Date(a.date) >= cutoff &&
      a.distanceKm >= 3 &&
      (a.type === "race" || a.type === "tempo" || a.type === "intervals" || a.type === "long"),
  );
  if (candidates.length === 0) {
    const recent = activities.slice(-10);
    if (recent.length === 0) return 35;
    // Only easy running available: assume easy pace ≈ 72% of race intensity.
    const best = Math.min(...recent.map((a) => a.avgPaceSecKm));
    return vdotFromPerformance(10, best * 10 * 0.86);
  }
  const vdots = candidates.map((a) => {
    const raw = vdotFromPerformance(a.distanceKm, a.durationSec);
    // Training efforts are sub-maximal; races are taken at face value.
    const correction = a.type === "race" ? 1 : a.type === "intervals" ? 1.04 : 1.02;
    return raw * correction;
  });
  vdots.sort((a, b) => b - a);
  const top = vdots.slice(0, Math.max(1, Math.floor(vdots.length * 0.25)));
  return top.reduce((s, v) => s + v, 0) / top.length;
}

/** Threshold ("umbral") pace ≈ pace sustainable for ~60 minutes. */
export function thresholdPace(vdot: number): number {
  const sec = predictTime(15, vdot); // ~60 min effort for recreational runners
  const pace = sec / 15;
  // Refine: find distance completed in exactly 60 min, then its pace.
  let lo = 5;
  let hi = 25;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (predictTime(mid, vdot) > 3600) hi = mid;
    else lo = mid;
  }
  const dist60 = (lo + hi) / 2;
  return Math.round((3600 / dist60 + pace) / 2);
}

const RACE_DISTANCES: { km: number; label: string }[] = [
  { km: 5, label: "5K" },
  { km: 10, label: "10K" },
  { km: 21.0975, label: "Media maratón" },
  { km: 42.195, label: "Maratón" },
];

export function buildPredictions(activities: Activity[]): Predictions {
  const vdot = estimateVdot(activities);
  const races: RacePrediction[] = RACE_DISTANCES.map(({ km, label }) => {
    const seconds = predictTime(km, vdot);
    return { distanceKm: km, label, seconds, paceSecKm: seconds / km };
  });
  return {
    vdot: Math.round(vdot * 10) / 10,
    vo2maxEstimate: Math.round(vdot * 10) / 10,
    thresholdPaceSecKm: thresholdPace(vdot),
    races,
  };
}
