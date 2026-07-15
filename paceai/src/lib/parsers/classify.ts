import type { Split, WorkoutType } from "@/lib/engine/types";

/**
 * Heuristic workout classification for imported files (no user labels):
 * split variability identifies interval work, distance identifies long runs
 * and relative pace separates tempo from easy running.
 */
export function classifyWorkout(
  distanceKm: number,
  avgPaceSecKm: number,
  splits: Split[],
): WorkoutType {
  const paces = splits.filter((s) => s.distanceKm >= 0.4).map((s) => s.seconds / s.distanceKm);
  if (paces.length >= 4) {
    const mean = paces.reduce((s, x) => s + x, 0) / paces.length;
    const sd = Math.sqrt(paces.reduce((s, x) => s + (x - mean) ** 2, 0) / paces.length);
    if (sd / mean > 0.09) return "intervals";
  }
  if (distanceKm >= 15) return "long";
  // Without the athlete's threshold we use absolute bands as a first pass;
  // the analysis engine refines interpretation against personal VDOT later.
  if (avgPaceSecKm < 285 && distanceKm >= 5) return "tempo";
  if (avgPaceSecKm > 390) return "recovery";
  return "easy";
}
