/**
 * PaceAI analysis engine — pure, deterministic, framework-free.
 * Import individual modules or use `analyzeAll` for the full snapshot.
 */
export * from "./types";
export * from "./training-load";
export * from "./vdot";
export * from "./pacing";
export * from "./injury";
export * from "./scoring";
export * from "./errors";
export * from "./goals";
export * from "./race-plan";
export * from "./monthly";
export * from "./report";
export * from "./insights";
export * from "./achievements";
export * from "./calendar";

import type { Activity, AthleteProfile } from "./types";
import { loadSeries, weeklyKm } from "./training-load";
import { buildPredictions } from "./vdot";
import { assessInjuryRisk } from "./injury";
import { computeScores } from "./scoring";
import { detectErrors } from "./errors";
import { monthlySummary } from "./monthly";
import { generateInsights } from "./insights";
import { computeAchievements } from "./achievements";
import { dayVerdicts } from "./calendar";

/** One-call snapshot used by the dashboard and the AI coach context. */
export function analyzeAll(activities: Activity[], profile: AthleteProfile) {
  const sorted = [...activities].sort((a, b) => a.date.localeCompare(b.date));
  const load = loadSeries(sorted, profile);
  return {
    load,
    weekly: weeklyKm(sorted, 12),
    predictions: buildPredictions(sorted),
    injuryRisk: assessInjuryRisk(sorted),
    scores: computeScores(sorted, load, profile),
    errors: detectErrors(sorted),
    monthly: monthlySummary(sorted),
    insights: generateInsights(sorted),
    achievements: computeAchievements(sorted),
    calendar: dayVerdicts(sorted, profile),
  };
}

export type AnalysisSnapshot = ReturnType<typeof analyzeAll>;
