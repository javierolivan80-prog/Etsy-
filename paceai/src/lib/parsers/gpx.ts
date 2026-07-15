import { XMLParser } from "fast-xml-parser";
import type { Activity, Split } from "@/lib/engine/types";
import { classifyWorkout } from "./classify";

interface TrkPt {
  "@_lat": string;
  "@_lon": string;
  ele?: number;
  time?: string;
  extensions?: {
    "gpxtpx:TrackPointExtension"?: { "gpxtpx:hr"?: number; "gpxtpx:cad"?: number };
  };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Parse a GPX file into a PaceAI Activity with per-km splits. */
export function parseGpx(xml: string, fileName: string): Activity {
  const parser = new XMLParser({ ignoreAttributes: false });
  const doc = parser.parse(xml);
  const trk = doc?.gpx?.trk;
  if (!trk) throw new Error("El archivo GPX no contiene ninguna pista (trk).");

  const segs = Array.isArray(trk.trkseg) ? trk.trkseg : [trk.trkseg];
  const points: TrkPt[] = segs.flatMap((s: { trkpt: TrkPt | TrkPt[] }) =>
    Array.isArray(s.trkpt) ? s.trkpt : [s.trkpt],
  );
  if (points.length < 2) throw new Error("La pista GPX tiene menos de dos puntos.");

  let distanceKm = 0;
  let elevationGain = 0;
  const splits: Split[] = [];
  let splitStartDist = 0;
  let splitStartTime = new Date(points[0].time ?? 0).getTime();
  let splitHrSum = 0;
  let splitHrN = 0;
  let splitElev = 0;
  const hrAll: number[] = [];

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const q = points[i - 1];
    distanceKm += haversineKm(
      parseFloat(q["@_lat"]),
      parseFloat(q["@_lon"]),
      parseFloat(p["@_lat"]),
      parseFloat(p["@_lon"]),
    );
    const dEle = (p.ele ?? 0) - (q.ele ?? 0);
    if (dEle > 0) {
      elevationGain += dEle;
      splitElev += dEle;
    }
    const hr = p.extensions?.["gpxtpx:TrackPointExtension"]?.["gpxtpx:hr"];
    if (hr) {
      splitHrSum += Number(hr);
      splitHrN++;
      hrAll.push(Number(hr));
    }
    const kmMark = splits.length + 1;
    if (distanceKm >= kmMark || i === points.length - 1) {
      const t = new Date(p.time ?? 0).getTime();
      const seconds = Math.max(1, (t - splitStartTime) / 1000);
      splits.push({
        km: kmMark,
        distanceKm: Math.round((distanceKm - splitStartDist) * 100) / 100,
        seconds: Math.round(seconds),
        avgHr: splitHrN > 0 ? Math.round(splitHrSum / splitHrN) : undefined,
        elevationGainM: Math.round(splitElev),
      });
      splitStartDist = distanceKm;
      splitStartTime = t;
      splitHrSum = 0;
      splitHrN = 0;
      splitElev = 0;
    }
  }

  const startTime = new Date(points[0].time ?? Date.now());
  const endTime = new Date(points[points.length - 1].time ?? Date.now());
  const durationSec = Math.max(1, (endTime.getTime() - startTime.getTime()) / 1000);
  const avgHr = hrAll.length > 0 ? Math.round(hrAll.reduce((s, x) => s + x, 0) / hrAll.length) : undefined;

  const base = {
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationSec: Math.round(durationSec),
    avgPaceSecKm: durationSec / Math.max(0.01, distanceKm),
    splits,
  };

  return {
    id: `gpx-${startTime.getTime()}`,
    date: startTime.toISOString(),
    name: trk.name || fileName.replace(/\.gpx$/i, ""),
    sport: "running",
    type: classifyWorkout(base.distanceKm, base.avgPaceSecKm, splits),
    ...base,
    avgHr,
    maxHr: hrAll.length > 0 ? Math.max(...hrAll) : undefined,
    elevationGainM: Math.round(elevationGain),
    source: "gpx",
  };
}
