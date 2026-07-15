import type { Activity, DetectedError } from "./types";
import { analyzePacing } from "./pacing";
import { assessInjuryRisk } from "./injury";

/**
 * Cross-history error detection: recurring habits that limit progress or
 * raise injury risk. Each rule inspects the last ~60 days.
 */
export function detectErrors(activities: Activity[]): DetectedError[] {
  const recent = activities.filter((a) => new Date(a.date) > new Date(Date.now() - 60 * 864e5));
  const errors: DetectedError[] = [];
  if (recent.length < 4) return errors;

  const pct = (n: number) => Math.round((n / recent.length) * 100);

  // 1. Always starting too fast
  const positive = recent.filter((a) => a.distanceKm >= 5 && analyzePacing(a).strategy === "positive");
  const longEnough = recent.filter((a) => a.distanceKm >= 5);
  if (longEnough.length >= 4 && positive.length / longEnough.length > 0.55) {
    errors.push({
      id: "fast-start",
      severity: "warning",
      title: "Sales demasiado rápido",
      detail: `En el ${Math.round((positive.length / longEnough.length) * 100)}% de tus carreras de más de 5 km, la segunda mitad es claramente más lenta que la primera. Sal 10–15 s/km más lento y termina progresando: correrás el mismo tiempo con menos coste.`,
    });
  }

  // 2. No easy runs / everything too hard
  const easy = recent.filter((a) => a.type === "easy" || a.type === "recovery");
  if (pct(easy.length) < 50) {
    errors.push({
      id: "no-easy",
      severity: "critical",
      title: "Entrenas demasiado fuerte",
      detail: `Solo el ${pct(easy.length)}% de tus sesiones son suaves. Los corredores que mejoran hacen ~80% de su volumen a baja intensidad. Ahora mismo acumulas fatiga sin construir base aeróbica.`,
    });
  }

  // 3. No quality work
  const quality = recent.filter((a) => a.type === "intervals" || a.type === "tempo");
  if (quality.length === 0) {
    errors.push({
      id: "no-quality",
      severity: "warning",
      title: "Mucho volumen, poca intensidad",
      detail:
        "No hay ni series ni tempos en los últimos 60 días. Tu resistencia crece pero tu velocidad está estancada: añade una sesión de calidad semanal.",
    });
  } else if (quality.length < recent.length * 0.1 && recent.length > 10) {
    errors.push({
      id: "little-speed",
      severity: "info",
      title: "Poca velocidad",
      detail: `Solo ${quality.length} sesiones de calidad en 60 días. Con una serie o tempo semanal tu ritmo umbral bajaría de forma medible en 6–8 semanas.`,
    });
  }

  // 4. No long runs
  if (!recent.some((a) => a.type === "long")) {
    errors.push({
      id: "no-long",
      severity: "warning",
      title: "Faltan rodajes largos",
      detail:
        "Sin un rodaje largo semanal tu resistencia aeróbica no progresa. Añade una salida de 75–120 minutos a ritmo cómodo.",
    });
  }

  // 5. Skipping training (gaps)
  const dates = recent.map((a) => new Date(a.date).getTime()).sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 1; i < dates.length; i++) maxGap = Math.max(maxGap, (dates[i] - dates[i - 1]) / 864e5);
  if (maxGap >= 7) {
    errors.push({
      id: "gaps",
      severity: "info",
      title: "Saltas entrenamientos",
      detail: `Tu mayor parón reciente fue de ${Math.round(maxGap)} días. La constancia importa más que cualquier sesión concreta: tres salidas cortas ganan a una heroica.`,
    });
  }

  // 6. Injury risk from load
  const risk = assessInjuryRisk(activities);
  if (risk.level === "high") {
    errors.push({
      id: "injury-risk",
      severity: "critical",
      title: "Riesgo de lesión alto",
      detail: risk.reasons.join(" "),
    });
  } else if (risk.level === "medium") {
    errors.push({
      id: "injury-risk",
      severity: "warning",
      title: "Riesgo de lesión moderado",
      detail: risk.reasons.join(" "),
    });
  }

  // 7. Not recovering (consecutive hard days)
  const sorted = [...recent].sort((a, b) => a.date.localeCompare(b.date));
  let hardStreak = 0;
  let worstStreak = 0;
  for (const a of sorted) {
    if (a.type === "intervals" || a.type === "tempo" || a.type === "race") hardStreak++;
    else hardStreak = 0;
    worstStreak = Math.max(worstStreak, hardStreak);
  }
  if (worstStreak >= 3) {
    errors.push({
      id: "no-recovery",
      severity: "warning",
      title: "No recuperas entre sesiones duras",
      detail: `Has llegado a encadenar ${worstStreak} sesiones intensas seguidas. La adaptación ocurre durante la recuperación: alterna siempre duro/suave.`,
    });
  }

  return errors;
}
