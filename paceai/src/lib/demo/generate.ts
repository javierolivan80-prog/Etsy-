import type { Activity, AthleteProfile, Split, WorkoutType } from "@/lib/engine/types";

/**
 * Deterministic demo athlete: ~6 months of realistic training with gradual
 * improvement, so every screen has meaningful data before the user connects
 * a real source. Seeded PRNG keeps server and client renders identical.
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEMO_PROFILE: AthleteProfile = {
  name: "Atleta demo",
  maxHr: 188,
  restHr: 52,
  weightKg: 72,
};

interface WeekPlan {
  day: number; // 0..6 offset within the week
  type: WorkoutType;
  km: number;
}

// Base weekly template (progressively scaled).
const TEMPLATE: WeekPlan[] = [
  { day: 1, type: "easy", km: 7 },
  { day: 2, type: "intervals", km: 8.5 },
  { day: 4, type: "easy", km: 8 },
  { day: 5, type: "tempo", km: 9 },
  { day: 6, type: "long", km: 15 },
];

function buildSplits(
  rng: () => number,
  distanceKm: number,
  basePace: number,
  type: WorkoutType,
  avgHr: number,
): { splits: Split[]; durationSec: number } {
  const nFull = Math.floor(distanceKm);
  const partial = distanceKm - nFull;
  const splits: Split[] = [];
  let total = 0;

  for (let i = 1; i <= nFull + (partial > 0.05 ? 1 : 0); i++) {
    const dist = i <= nFull ? 1 : partial;
    let pace = basePace;
    const progress = i / distanceKm;

    if (type === "intervals") {
      // Alternate hard/float kilometres.
      pace = i % 2 === 0 ? basePace * 0.82 : basePace * 1.16;
    } else if (type === "tempo") {
      // Warm-up km, then steady-hard.
      pace = i === 1 ? basePace * 1.15 : basePace * 0.93;
    } else if (type === "long") {
      // Tendency to fade late (a habit the analyzer should catch).
      pace = basePace * (1 + Math.max(0, progress - 0.6) * 0.14);
    } else {
      // Easy runs: opens slightly fast, drifts back.
      pace = basePace * (0.97 + progress * 0.05);
    }
    pace *= 1 + (rng() - 0.5) * 0.035; // noise
    const seconds = Math.round(pace * dist);
    total += seconds;
    splits.push({
      km: i,
      distanceKm: Math.round(dist * 100) / 100,
      seconds,
      avgHr: Math.round(avgHr * (0.93 + progress * 0.1) + (rng() - 0.5) * 6),
      elevationGainM: Math.round(rng() * 12),
    });
  }
  return { splits, durationSec: total };
}

export function generateDemoActivities(): Activity[] {
  const rng = mulberry32(20260715);
  const activities: Activity[] = [];
  const weeks = 26;
  const now = new Date();
  now.setHours(8, 30, 0, 0);

  for (let w = weeks; w >= 1; w--) {
    const fitness = 1 - ((weeks - w) / weeks) * 0.08; // paces improve ~8% over 6 months
    const volumeScale = 0.75 + ((weeks - w) / weeks) * 0.45; // volume grows ~45%
    const isRecoveryWeek = w % 4 === 0;

    for (const plan of TEMPLATE) {
      // Occasionally skip a session (real life).
      if (rng() < (isRecoveryWeek ? 0.28 : 0.1)) continue;

      const date = new Date(now);
      date.setDate(date.getDate() - w * 7 + plan.day);
      if (date > now) continue;

      let type = plan.type;
      if (isRecoveryWeek && (type === "intervals" || type === "tempo")) type = "easy";

      const km =
        plan.km * volumeScale * (isRecoveryWeek ? 0.75 : 1) * (0.92 + rng() * 0.16);

      // Base easy pace ~5:35/km improving to ~5:08; scaled per type.
      const easyPace = 335 * fitness;
      const typePace: Record<WorkoutType, number> = {
        easy: easyPace,
        recovery: easyPace * 1.12,
        long: easyPace * 1.04,
        tempo: easyPace * 0.88,
        intervals: easyPace * 0.92,
        race: easyPace * 0.8,
      };
      const typeHr: Record<WorkoutType, number> = {
        easy: 142,
        recovery: 128,
        long: 148,
        tempo: 165,
        intervals: 168,
        race: 175,
      };

      const distanceKm = Math.round(km * 100) / 100;
      const { splits, durationSec } = buildSplits(rng, distanceKm, typePace[type], type, typeHr[type]);
      const avgHr = Math.round(
        splits.reduce((s, x) => s + (x.avgHr ?? 0) * x.distanceKm, 0) / distanceKm,
      );
      const names: Record<WorkoutType, string> = {
        easy: "Rodaje suave",
        recovery: "Trote de recuperación",
        long: "Tirada larga",
        tempo: "Tempo run",
        intervals: "Series de 1000 m",
        race: "Competición",
      };

      activities.push({
        id: `demo-${date.toISOString().slice(0, 10)}-${type}`,
        date: date.toISOString(),
        name: names[type],
        sport: "running",
        type,
        distanceKm,
        durationSec,
        avgPaceSecKm: durationSec / distanceKm,
        avgHr,
        maxHr: Math.min(DEMO_PROFILE.maxHr, avgHr + 18 + Math.round(rng() * 8)),
        elevationGainM: splits.reduce((s, x) => s + (x.elevationGainM ?? 0), 0),
        cadenceSpm: Math.round(170 + rng() * 8),
        strideLenM: Math.round((1000 / (durationSec / distanceKm) / ((170 + rng() * 8) / 60)) * 100) / 100,
        powerW: Math.round(230 + rng() * 40),
        calories: Math.round(distanceKm * 62),
        splits,
        source: "demo",
      });
    }
  }

  // One recent 10K race for realistic predictions.
  const raceDate = new Date(now);
  raceDate.setDate(raceDate.getDate() - 18);
  const racePace = 296; // 4:56/km ≈ 49:20
  const { splits, durationSec } = buildSplits(rng, 10, racePace, "race", 175);
  activities.push({
    id: `demo-${raceDate.toISOString().slice(0, 10)}-race`,
    date: raceDate.toISOString(),
    name: "10K popular",
    sport: "running",
    type: "race",
    distanceKm: 10,
    durationSec,
    avgPaceSecKm: durationSec / 10,
    avgHr: 176,
    maxHr: 187,
    elevationGainM: 45,
    cadenceSpm: 178,
    strideLenM: 1.14,
    powerW: 285,
    calories: 620,
    splits,
    source: "demo",
  });

  return activities.sort((a, b) => a.date.localeCompare(b.date));
}
