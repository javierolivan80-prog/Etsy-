import type { Activity, AthleteProfile, LoadPoint } from "./types";

/**
 * Banister TRIMP for one activity: minutes × HRr × 0.64·e^(1.92·HRr),
 * where HRr is the heart-rate reserve fraction. Falls back to a
 * pace/duration heuristic when no HR data is available.
 */
export function trimp(activity: Activity, profile: AthleteProfile): number {
  const minutes = activity.durationSec / 60;
  if (activity.avgHr && profile.maxHr > profile.restHr) {
    const hrr = Math.min(
      1,
      Math.max(0, (activity.avgHr - profile.restHr) / (profile.maxHr - profile.restHr)),
    );
    return minutes * hrr * 0.64 * Math.exp(1.92 * hrr);
  }
  // No HR: approximate intensity from workout type.
  const factor = { recovery: 0.5, easy: 0.65, long: 0.75, tempo: 1.0, intervals: 1.1, race: 1.2 }[
    activity.type
  ];
  return minutes * factor;
}

const CTL_TC = 42; // days — chronic (fitness)
const ATL_TC = 7; // days — acute (fatigue)

/**
 * Daily fitness–fatigue series over the full activity history.
 * CTL/ATL are exponentially weighted moving averages of daily TRIMP.
 */
export function loadSeries(activities: Activity[], profile: AthleteProfile): LoadPoint[] {
  if (activities.length === 0) return [];
  const byDay = new Map<string, number>();
  for (const a of activities) {
    const day = a.date.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + trimp(a, profile));
  }
  const sortedDays = [...byDay.keys()].sort();
  const start = new Date(sortedDays[0]);
  const end = new Date(); // today, so TSB reflects current rest
  const points: LoadPoint[] = [];
  let ctl = 0;
  let atl = 0;
  const kCtl = 1 - Math.exp(-1 / CTL_TC);
  const kAtl = 1 - Math.exp(-1 / ATL_TC);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.toISOString().slice(0, 10);
    const load = byDay.get(day) ?? 0;
    ctl = ctl + kCtl * (load - ctl);
    atl = atl + kAtl * (load - atl);
    points.push({ date: day, load, ctl, atl, tsb: ctl - atl });
  }
  return points;
}

/** Total km in the trailing `days` days ending at `ref` (default: now). */
export function kmInWindow(activities: Activity[], days: number, ref = new Date()): number {
  const from = new Date(ref);
  from.setDate(from.getDate() - days);
  return activities
    .filter((a) => new Date(a.date) >= from && new Date(a.date) <= ref)
    .reduce((sum, a) => sum + a.distanceKm, 0);
}

/** Weekly km totals (ISO weeks approximated as 7-day buckets back from today). */
export function weeklyKm(activities: Activity[], weeks: number): { label: string; km: number; date: string }[] {
  const out: { label: string; km: number; date: string }[] = [];
  const now = new Date();
  for (let w = weeks - 1; w >= 0; w--) {
    const end = new Date(now);
    end.setDate(end.getDate() - w * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    const km = activities
      .filter((a) => {
        const d = new Date(a.date);
        return d > start && d <= end;
      })
      .reduce((s, a) => s + a.distanceKm, 0);
    out.push({
      label: end.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      km: Math.round(km * 10) / 10,
      date: end.toISOString().slice(0, 10),
    });
  }
  return out;
}
