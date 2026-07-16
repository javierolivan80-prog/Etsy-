import type { Activity, Split } from "@/lib/engine/types";
import type { ExtractedActivity } from "@/lib/ai/vision";
import { classifyWorkout } from "./classify";

/**
 * Build an Activity from a screenshot's summary numbers.
 *
 * A photo carries no per-point GPS, so there are no real splits. We synthesise
 * even kilometre splits from the average pace: enough for the fitness/scoring
 * engine to work, though pacing analysis on these is necessarily flat (the
 * caller/UI makes clear this activity came from an image).
 */
export function buildActivityFromPhoto(data: ExtractedActivity): Activity {
  const { distanceKm, durationSec } = data;
  const avgPaceSecKm = durationSec / Math.max(0.01, distanceKm);

  const splits: Split[] = [];
  const fullKm = Math.floor(distanceKm);
  const elevPerKm = data.elevationGainM ? data.elevationGainM / distanceKm : 0;
  for (let km = 1; km <= fullKm; km++) {
    splits.push({
      km,
      distanceKm: 1,
      seconds: Math.round(avgPaceSecKm),
      avgHr: data.avgHr,
      elevationGainM: elevPerKm ? Math.round(elevPerKm) : undefined,
    });
  }
  const remainder = Math.round((distanceKm - fullKm) * 100) / 100;
  if (remainder >= 0.01) {
    splits.push({
      km: fullKm + 1,
      distanceKm: remainder,
      seconds: Math.round(avgPaceSecKm * remainder),
      avgHr: data.avgHr,
      elevationGainM: elevPerKm ? Math.round(elevPerKm * remainder) : undefined,
    });
  }

  const date = data.dateISO ?? new Date().toISOString();

  return {
    id: `photo-${new Date(date).getTime()}-${Math.round(distanceKm * 100)}`,
    date,
    name: data.name || "Entrenamiento (importado de foto)",
    sport: "running",
    type: classifyWorkout(distanceKm, avgPaceSecKm, splits),
    distanceKm,
    durationSec,
    avgPaceSecKm,
    splits,
    avgHr: data.avgHr,
    maxHr: data.maxHr,
    elevationGainM: data.elevationGainM,
    source: "photo",
  };
}
