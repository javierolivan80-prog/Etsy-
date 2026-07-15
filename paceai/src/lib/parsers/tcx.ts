import { XMLParser } from "fast-xml-parser";
import type { Activity, Split } from "@/lib/engine/types";
import { classifyWorkout } from "./classify";

interface TcxTrackpoint {
  Time?: string;
  DistanceMeters?: number;
  AltitudeMeters?: number;
  HeartRateBpm?: { Value: number };
  Cadence?: number;
}

/** Parse a TCX (Garmin Training Center) file into a PaceAI Activity. */
export function parseTcx(xml: string, fileName: string): Activity {
  const parser = new XMLParser({ ignoreAttributes: false });
  const doc = parser.parse(xml);
  const act = doc?.TrainingCenterDatabase?.Activities?.Activity;
  const activity = Array.isArray(act) ? act[0] : act;
  if (!activity) throw new Error("El archivo TCX no contiene actividades.");

  const laps = Array.isArray(activity.Lap) ? activity.Lap : [activity.Lap];
  const trackpoints: TcxTrackpoint[] = laps.flatMap((lap: { Track?: { Trackpoint: TcxTrackpoint | TcxTrackpoint[] } }) => {
    const tp = lap?.Track?.Trackpoint;
    return tp ? (Array.isArray(tp) ? tp : [tp]) : [];
  });
  if (trackpoints.length < 2) throw new Error("El TCX no contiene puntos de track suficientes.");

  const startTime = new Date(trackpoints[0].Time ?? activity["@_StartTime"] ?? Date.now());
  const endTime = new Date(trackpoints[trackpoints.length - 1].Time ?? Date.now());
  const durationSec = Math.max(
    1,
    laps.reduce((s: number, l: { TotalTimeSeconds?: number }) => s + (Number(l?.TotalTimeSeconds) || 0), 0) ||
      (endTime.getTime() - startTime.getTime()) / 1000,
  );
  const distanceKm =
    laps.reduce((s: number, l: { DistanceMeters?: number }) => s + (Number(l?.DistanceMeters) || 0), 0) / 1000 ||
    (trackpoints[trackpoints.length - 1].DistanceMeters ?? 0) / 1000;

  // Build per-km splits from cumulative distance.
  const splits: Split[] = [];
  let prevTime = startTime.getTime();
  let prevDist = 0;
  let hrSum = 0;
  let hrN = 0;
  const hrAll: number[] = [];
  for (const tp of trackpoints) {
    const hr = tp.HeartRateBpm?.Value;
    if (hr) {
      hrSum += Number(hr);
      hrN++;
      hrAll.push(Number(hr));
    }
    const dKm = (tp.DistanceMeters ?? 0) / 1000;
    const kmMark = splits.length + 1;
    if (dKm >= kmMark) {
      const t = new Date(tp.Time ?? 0).getTime();
      splits.push({
        km: kmMark,
        distanceKm: Math.round((dKm - prevDist) * 100) / 100,
        seconds: Math.max(1, Math.round((t - prevTime) / 1000)),
        avgHr: hrN > 0 ? Math.round(hrSum / hrN) : undefined,
      });
      prevTime = t;
      prevDist = dKm;
      hrSum = 0;
      hrN = 0;
    }
  }
  if (distanceKm - prevDist > 0.05) {
    splits.push({
      km: splits.length + 1,
      distanceKm: Math.round((distanceKm - prevDist) * 100) / 100,
      seconds: Math.max(1, Math.round((endTime.getTime() - prevTime) / 1000)),
      avgHr: hrN > 0 ? Math.round(hrSum / hrN) : undefined,
    });
  }

  const avgPaceSecKm = durationSec / Math.max(0.01, distanceKm);
  return {
    id: `tcx-${startTime.getTime()}`,
    date: startTime.toISOString(),
    name: fileName.replace(/\.tcx$/i, ""),
    sport: "running",
    type: classifyWorkout(distanceKm, avgPaceSecKm, splits),
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationSec: Math.round(durationSec),
    avgPaceSecKm,
    avgHr: hrAll.length > 0 ? Math.round(hrAll.reduce((s, x) => s + x, 0) / hrAll.length) : undefined,
    maxHr: hrAll.length > 0 ? Math.max(...hrAll) : undefined,
    calories: laps.reduce((s: number, l: { Calories?: number }) => s + (Number(l?.Calories) || 0), 0) || undefined,
    splits,
    source: "tcx",
  };
}
