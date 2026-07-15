import type { Activity } from "./types";

export interface PacingAnalysis {
  strategy: "negative" | "even" | "positive" | "erratic";
  /** % slower the second half was vs the first (negative = faster) */
  fadePct: number;
  firstHalfPace: number;
  secondHalfPace: number;
  fastestKm: { km: number; pace: number } | null;
  slowestKm: { km: number; pace: number } | null;
  /** Coefficient of variation of split paces (%) */
  variabilityPct: number;
  /** Km index where sustained fade begins, if any */
  fadeStartKm: number | null;
  /** Estimated seconds lost to going out too fast (0 if paced well) */
  timeLostSec: number;
}

/** Per-split pace in sec/km, ignoring partial splits under 400 m. */
function splitPaces(a: Activity): { km: number; pace: number }[] {
  return a.splits
    .filter((s) => s.distanceKm >= 0.4)
    .map((s) => ({ km: s.km, pace: s.seconds / s.distanceKm }));
}

export function analyzePacing(a: Activity): PacingAnalysis {
  const paces = splitPaces(a);
  if (paces.length < 2) {
    return {
      strategy: "even",
      fadePct: 0,
      firstHalfPace: a.avgPaceSecKm,
      secondHalfPace: a.avgPaceSecKm,
      fastestKm: null,
      slowestKm: null,
      variabilityPct: 0,
      fadeStartKm: null,
      timeLostSec: 0,
    };
  }
  const half = Math.floor(paces.length / 2);
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const firstHalfPace = avg(paces.slice(0, half).map((p) => p.pace));
  const secondHalfPace = avg(paces.slice(half).map((p) => p.pace));
  const fadePct = ((secondHalfPace - firstHalfPace) / firstHalfPace) * 100;

  const mean = avg(paces.map((p) => p.pace));
  const sd = Math.sqrt(avg(paces.map((p) => (p.pace - mean) ** 2)));
  const variabilityPct = (sd / mean) * 100;

  const sorted = [...paces].sort((x, y) => x.pace - y.pace);
  const fastestKm = sorted[0];
  const slowestKm = sorted[sorted.length - 1];

  // Sustained fade: first km after which every remaining km is ≥3% slower
  // than the average of the opening third.
  const openPace = avg(paces.slice(0, Math.max(2, Math.floor(paces.length / 3))).map((p) => p.pace));
  let fadeStartKm: number | null = null;
  for (let i = Math.floor(paces.length / 3); i < paces.length; i++) {
    const rest = paces.slice(i);
    if (rest.length >= 2 && rest.every((p) => p.pace > openPace * 1.03)) {
      fadeStartKm = paces[i].km;
      break;
    }
  }

  // Interval sessions are *supposed* to be variable.
  const isStructured = a.type === "intervals";
  let strategy: PacingAnalysis["strategy"];
  if (isStructured || variabilityPct > 9) strategy = "erratic";
  else if (fadePct < -1.5) strategy = "negative";
  else if (fadePct > 2.5) strategy = "positive";
  else strategy = "even";

  // Cost of a positive split: empirically ~0.4 s extra lost per km per 1% fade.
  const timeLostSec =
    strategy === "positive" ? Math.round(Math.max(0, fadePct - 1) * a.distanceKm * 0.9) : 0;

  return {
    strategy,
    fadePct: Math.round(fadePct * 10) / 10,
    firstHalfPace,
    secondHalfPace,
    fastestKm,
    slowestKm,
    variabilityPct: Math.round(variabilityPct * 10) / 10,
    fadeStartKm,
    timeLostSec,
  };
}
