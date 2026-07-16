/**
 * Domain types for the PaceAI analysis engine.
 *
 * Every module in `src/lib/engine` is a pure function over these types so the
 * engine can run identically against database rows or freshly
 * parsed GPX/TCX/FIT files — and later against cycling/swimming activities
 * (see `sport`).
 */

export type Sport = "running" | "cycling" | "swimming" | "trail";

export type WorkoutType =
  | "easy" // rodaje suave
  | "long" // rodaje largo
  | "tempo" // tempo / umbral
  | "intervals" // series
  | "recovery" // recuperación
  | "race"; // competición

export interface Split {
  /** 1-based kilometre index */
  km: number;
  /** Distance of this split in km (last split may be partial) */
  distanceKm: number;
  /** Elapsed seconds for the split */
  seconds: number;
  avgHr?: number;
  elevationGainM?: number;
}

export interface Activity {
  id: string;
  date: string; // ISO 8601
  name: string;
  sport: Sport;
  type: WorkoutType;
  distanceKm: number;
  durationSec: number;
  /** Average pace in seconds per km */
  avgPaceSecKm: number;
  avgHr?: number;
  maxHr?: number;
  elevationGainM?: number;
  cadenceSpm?: number;
  strideLenM?: number;
  powerW?: number;
  calories?: number;
  splits: Split[];
  source: "gpx" | "tcx" | "fit" | "strava" | "garmin" | "manual" | "photo";
}

export interface AthleteProfile {
  name: string;
  maxHr: number;
  restHr: number;
  weightKg?: number;
}

/** Fitness–fatigue (impulse-response) model sample for one day. */
export interface LoadPoint {
  date: string;
  /** Daily training load (TRIMP) */
  load: number;
  /** Chronic training load — 42-day EWMA (fitness) */
  ctl: number;
  /** Acute training load — 7-day EWMA (fatigue) */
  atl: number;
  /** Training stress balance — ctl − atl (form) */
  tsb: number;
}

export interface Scores {
  fitness: number;
  recovery: number;
  endurance: number;
  speed: number;
  consistency: number;
  raceReadiness: number;
  efficiency: number;
  runningIQ: number;
}

export type RiskLevel = "low" | "medium" | "high";

export interface InjuryRisk {
  level: RiskLevel;
  /** Acute:chronic workload ratio (sweet spot 0.8–1.3) */
  acwr: number;
  weeklyIncreasePct: number;
  reasons: string[];
}

export interface RacePrediction {
  distanceKm: number;
  label: string;
  seconds: number;
  paceSecKm: number;
}

export interface Predictions {
  vdot: number;
  vo2maxEstimate: number;
  thresholdPaceSecKm: number;
  races: RacePrediction[];
}

export interface GoalSimulation {
  scenario: string;
  probabilityPct: number;
  estimatedDate: string; // ISO
}

export interface GoalAnalysis {
  distanceKm: number;
  targetSeconds: number;
  currentPrediction: number;
  probabilityPct: number;
  estimatedDate: string; // ISO
  simulations: GoalSimulation[];
}

export interface Insight {
  id: string;
  kind: "improvement" | "pattern" | "warning" | "potential";
  text: string;
  detail?: string;
}

export interface DetectedError {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
}

export interface RacePlanKm {
  km: number;
  paceSecKm: number;
  cumulativeSec: number;
  note?: string;
}

export interface RacePlan {
  distanceKm: number;
  targetSeconds: number;
  feasible: boolean;
  kms: RacePlanKm[];
  strategy: string;
}

export interface MonthlySummary {
  from: string;
  to: string;
  totalKm: number;
  totalSec: number;
  avgPaceSecKm: number;
  runs: number;
  byType: Record<WorkoutType, number>;
  elevationGainM: number;
  conclusions: string[];
}

export interface ActivityReport {
  activityId: string;
  headline: string;
  paragraphs: string[];
  pacing: {
    strategy: "negative" | "even" | "positive" | "erratic";
    fadePct: number;
    firstHalfPace: number;
    secondHalfPace: number;
    timeLostSec: number;
  };
  effect: string;
  advice: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progressPct: number;
}

export interface DayVerdict {
  date: string;
  verdict: "excellent" | "normal" | "too-intense" | "recovery" | "rest";
  activityIds: string[];
  km: number;
}
