import type { Activity, InjuryRisk } from "./types";
import { kmInWindow } from "./training-load";

/**
 * Injury-risk model built on the acute:chronic workload ratio (ACWR):
 * acute = last 7 days of km, chronic = 28-day weekly average.
 * The 0.8–1.3 band is the training sweet spot; >1.5 is the danger zone.
 * Weekly volume jumps and missing recovery days add to the score.
 */
export function assessInjuryRisk(activities: Activity[]): InjuryRisk {
  const acute = kmInWindow(activities, 7);
  const chronicWeekly = kmInWindow(activities, 28) / 4;
  const acwr = chronicWeekly > 0 ? acute / chronicWeekly : 0;

  const prevWeekEnd = new Date();
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
  const prevWeek = kmInWindow(activities, 7, prevWeekEnd);
  const weeklyIncreasePct = prevWeek > 0 ? ((acute - prevWeek) / prevWeek) * 100 : 0;

  // Days without running in the last 7
  const days = new Set(
    activities
      .filter((a) => new Date(a.date) > new Date(Date.now() - 7 * 864e5))
      .map((a) => a.date.slice(0, 10)),
  );
  const restDays = 7 - days.size;

  const reasons: string[] = [];
  let score = 0;

  if (acwr > 1.5) {
    score += 3;
    reasons.push(
      `Tu carga aguda es un ${Math.round((acwr - 1) * 100)}% superior a tu carga crónica (ACWR ${acwr.toFixed(2)}). Estás por encima de la zona segura.`,
    );
  } else if (acwr > 1.3) {
    score += 2;
    reasons.push(`ACWR de ${acwr.toFixed(2)}: la carga sube más rápido de lo que tu cuerpo asimila.`);
  } else if (acwr > 0 && acwr < 0.8) {
    reasons.push(`ACWR de ${acwr.toFixed(2)}: vienes de una fase de descarga; recupera volumen de forma gradual.`);
  } else if (acwr > 0) {
    reasons.push(`ACWR de ${acwr.toFixed(2)}: la relación entre carga aguda y crónica está en la zona óptima (0,8–1,3).`);
  }

  if (weeklyIncreasePct > 30) {
    score += 2;
    reasons.push(
      `Has aumentado el volumen semanal un ${Math.round(weeklyIncreasePct)}%. Los incrementos superiores al 10–15% multiplican el riesgo de lesión.`,
    );
  } else if (weeklyIncreasePct > 15) {
    score += 1;
    reasons.push(`Incremento semanal del ${Math.round(weeklyIncreasePct)}%: ligeramente por encima del 10–15% recomendado.`);
  }

  if (restDays === 0 && days.size === 7) {
    score += 1;
    reasons.push("Llevas 7 días seguidos corriendo sin descanso completo.");
  }

  const level = score >= 3 ? "high" : score >= 1 ? "medium" : "low";
  if (reasons.length === 0) {
    reasons.push("Carga estable, incrementos graduales y descanso suficiente.");
  }
  return { level, acwr: Math.round(acwr * 100) / 100, weeklyIncreasePct: Math.round(weeklyIncreasePct), reasons };
}
