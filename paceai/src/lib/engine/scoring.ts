import type { Activity, AthleteProfile, LoadPoint, Scores } from "./types";
import { analyzePacing } from "./pacing";
import { estimateVdot } from "./vdot";
import { kmInWindow, weeklyKm } from "./training-load";

const clamp = (x: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(x)));

/**
 * 0–100 scores shown across the product. Each score maps a physiological or
 * behavioural signal onto a scale where ~50 is a committed recreational
 * runner and 90+ is highly trained.
 */
export function computeScores(
  activities: Activity[],
  load: LoadPoint[],
  profile: AthleteProfile,
): Scores {
  const last = load[load.length - 1];
  const recent = activities.filter((a) => new Date(a.date) > new Date(Date.now() - 90 * 864e5));

  // Fitness: CTL of ~15 ≈ beginner, ~100 ≈ elite amateur.
  const fitness = clamp((last?.ctl ?? 0) * 1.1);

  // Recovery: TSB of −30 = deeply fatigued, +15 = fully fresh.
  const tsb = last?.tsb ?? 0;
  const recovery = clamp(((tsb + 30) / 45) * 100);

  // Endurance: longest recent run + weekly volume.
  const longest = Math.max(0, ...recent.map((a) => a.distanceKm));
  const weekly = kmInWindow(activities, 28) / 4;
  const endurance = clamp(longest * 2.2 + weekly * 0.9);

  // Speed: VDOT mapped so 30 → 25 pts, 70 → 95 pts.
  const vdot = estimateVdot(activities);
  const speed = clamp((vdot - 16) * 1.75);

  // Consistency: sessions/week and low weekly-volume variance.
  const weeks = weeklyKm(activities, 8).map((w) => w.km);
  const mean = weeks.reduce((s, x) => s + x, 0) / Math.max(1, weeks.length);
  const sd = Math.sqrt(weeks.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, weeks.length));
  const cv = mean > 0 ? sd / mean : 1;
  const runsPerWeek = recent.length / 13;
  const consistency = clamp(runsPerWeek * 14 + (1 - Math.min(1, cv)) * 45);

  // Efficiency: pace achieved per heartbeat vs expectation (running economy proxy).
  const withHr = recent.filter((a) => a.avgHr && a.type !== "intervals");
  let efficiency = 50;
  if (withHr.length > 3) {
    const eff =
      withHr.reduce((s, a) => {
        const speedMs = (a.distanceKm * 1000) / a.durationSec;
        const hrFrac = (a.avgHr! - profile.restHr) / (profile.maxHr - profile.restHr);
        return s + speedMs / Math.max(0.3, hrFrac);
      }, 0) / withHr.length;
    // eff ~3.0 poor → ~6.5 excellent
    efficiency = clamp(((eff - 2.5) / 4) * 100);
  }

  // Running IQ: adherence to polarized distribution (~80% low intensity),
  // sensible pacing, and inclusion of quality + long sessions.
  const lowIntensity = recent.filter((a) => a.type === "easy" || a.type === "recovery" || a.type === "long").length;
  const pctLow = recent.length > 0 ? lowIntensity / recent.length : 0;
  const distributionScore = 100 - Math.abs(pctLow - 0.8) * 220;
  const positiveSplits = recent.filter((a) => analyzePacing(a).strategy === "positive").length;
  const pacingScore = recent.length > 0 ? 100 - (positiveSplits / recent.length) * 90 : 50;
  const hasQuality = recent.some((a) => a.type === "intervals" || a.type === "tempo") ? 100 : 40;
  const hasLong = recent.some((a) => a.type === "long") ? 100 : 40;
  const runningIQ = clamp(distributionScore * 0.35 + pacingScore * 0.3 + hasQuality * 0.2 + hasLong * 0.15);

  // Race readiness: fitness × freshness × recent quality work.
  const freshness = clamp(100 - Math.abs(tsb - 5) * 4);
  const qualityDensity = recent.filter(
    (a) => (a.type === "intervals" || a.type === "tempo") && new Date(a.date) > new Date(Date.now() - 21 * 864e5),
  ).length;
  const raceReadiness = clamp(fitness * 0.45 + freshness * 0.3 + Math.min(100, qualityDensity * 25) * 0.25);

  return { fitness, recovery, endurance, speed, consistency, raceReadiness, efficiency, runningIQ };
}
