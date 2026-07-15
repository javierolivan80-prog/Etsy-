import type { Activity, AthleteProfile, DayVerdict } from "./types";
import { analyzePacing } from "./pacing";
import { trimp } from "./training-load";

/**
 * Interpreted calendar: each day gets a coach verdict instead of a bare dot.
 */
export function dayVerdicts(
  activities: Activity[],
  profile: AthleteProfile,
  days = 35,
): DayVerdict[] {
  const out: DayVerdict[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const day = d.toISOString().slice(0, 10);
    const acts = activities.filter((a) => a.date.slice(0, 10) === day);

    if (acts.length === 0) {
      out.push({ date: day, verdict: "rest", activityIds: [], km: 0 });
      continue;
    }
    const km = acts.reduce((s, a) => s + a.distanceKm, 0);
    const load = acts.reduce((s, a) => s + trimp(a, profile), 0);
    const isRecovery = acts.every((a) => a.type === "recovery");
    const anyPositiveLong = acts.some(
      (a) => a.distanceKm >= 8 && analyzePacing(a).strategy === "positive",
    );
    const quality = acts.some((a) => a.type === "intervals" || a.type === "tempo" || a.type === "race");

    let verdict: DayVerdict["verdict"];
    if (isRecovery) verdict = "recovery";
    else if (load > 160 || (quality && km > 16)) verdict = "too-intense";
    else if (quality || (acts.some((a) => a.type === "long") && !anyPositiveLong)) verdict = "excellent";
    else if (anyPositiveLong) verdict = "too-intense";
    else verdict = "normal";

    out.push({ date: day, verdict, activityIds: acts.map((a) => a.id), km: Math.round(km * 10) / 10 });
  }
  return out;
}
