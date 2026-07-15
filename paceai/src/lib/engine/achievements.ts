import type { Achievement, Activity } from "./types";

const clampPct = (x: number) => Math.max(0, Math.min(100, Math.round(x)));

export function computeAchievements(activities: Activity[]): Achievement[] {
  const totalKm = activities.reduce((s, a) => s + a.distanceKm, 0);
  const firstAt = (pred: (a: Activity) => boolean) =>
    activities.find(pred)?.date;

  const first10k = firstAt((a) => a.distanceKm >= 10);
  const firstHalf = firstAt((a) => a.distanceKm >= 21);
  const kmAt = (target: number) => {
    let acc = 0;
    for (const a of activities) {
      acc += a.distanceKm;
      if (acc >= target) return a.date;
    }
    return undefined;
  };

  // Best monthly improvement (km month-over-month).
  const byMonth = new Map<string, number>();
  for (const a of activities) {
    const key = a.date.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + a.distanceKm);
  }
  const months = [...byMonth.entries()].sort();
  let bestJump = 0;
  for (let i = 1; i < months.length; i++) {
    bestJump = Math.max(bestJump, months[i][1] - months[i - 1][1]);
  }

  // Longest weekly streak (weeks with ≥3 runs).
  const byWeek = new Map<string, number>();
  for (const a of activities) {
    const d = new Date(a.date);
    const week = `${d.getFullYear()}-${Math.floor((Number(d) - Number(new Date(d.getFullYear(), 0, 1))) / (7 * 864e5))}`;
    byWeek.set(week, (byWeek.get(week) ?? 0) + 1);
  }
  const consistentWeeks = [...byWeek.values()].filter((n) => n >= 3).length;

  return [
    {
      id: "first-10k",
      title: "Primer 10K",
      description: "Completa una salida de 10 km o más.",
      icon: "🎯",
      unlocked: !!first10k,
      unlockedAt: first10k,
      progressPct: first10k ? 100 : clampPct((Math.max(0, ...activities.map((a) => a.distanceKm)) / 10) * 100),
    },
    {
      id: "first-half",
      title: "Primera media maratón",
      description: "Completa 21,1 km en una sola salida.",
      icon: "🏅",
      unlocked: !!firstHalf,
      unlockedAt: firstHalf,
      progressPct: firstHalf ? 100 : clampPct((Math.max(0, ...activities.map((a) => a.distanceKm)) / 21.1) * 100),
    },
    {
      id: "km-100",
      title: "100 km acumulados",
      description: "Suma 100 km de historial.",
      icon: "💯",
      unlocked: totalKm >= 100,
      unlockedAt: kmAt(100),
      progressPct: clampPct((totalKm / 100) * 100),
    },
    {
      id: "km-500",
      title: "500 km acumulados",
      description: "Suma 500 km de historial.",
      icon: "🚀",
      unlocked: totalKm >= 500,
      unlockedAt: kmAt(500),
      progressPct: clampPct((totalKm / 500) * 100),
    },
    {
      id: "km-1000",
      title: "1000 km acumulados",
      description: "Suma 1000 km de historial.",
      icon: "🏆",
      unlocked: totalKm >= 1000,
      unlockedAt: kmAt(1000),
      progressPct: clampPct((totalKm / 1000) * 100),
    },
    {
      id: "best-month",
      title: "Mayor mejora mensual",
      description: "Aumenta tu volumen mensual en más de 30 km.",
      icon: "📈",
      unlocked: bestJump >= 30,
      progressPct: clampPct((bestJump / 30) * 100),
    },
    {
      id: "consistency",
      title: "Mayor constancia",
      description: "Acumula 12 semanas con 3 o más salidas.",
      icon: "🔥",
      unlocked: consistentWeeks >= 12,
      progressPct: clampPct((consistentWeeks / 12) * 100),
    },
  ];
}
