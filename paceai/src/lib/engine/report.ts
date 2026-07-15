import type { Activity, ActivityReport, AthleteProfile } from "./types";
import { analyzePacing } from "./pacing";
import { estimateVdot, thresholdPace } from "./vdot";
import { formatDuration, formatPace, WORKOUT_LABELS } from "@/lib/format";

/**
 * Rule-based coach report for a single activity, written like a coach would.
 * Serves as the deterministic fallback and as grounding material for the
 * LLM-generated version (src/lib/ai).
 */
export function buildActivityReport(
  activity: Activity,
  history: Activity[],
  profile: AthleteProfile,
): ActivityReport {
  const pacing = analyzePacing(activity);
  const vdot = estimateVdot(history);
  const threshold = thresholdPace(vdot);
  const paragraphs: string[] = [];

  const headline = `${WORKOUT_LABELS[activity.type]} · ${activity.distanceKm.toFixed(1)} km en ${formatDuration(activity.durationSec)} (${formatPace(activity.avgPaceSecKm)}/km)`;

  // Opening: what happened.
  paragraphs.push(
    `Hiciste ${activity.distanceKm.toFixed(1)} km a un ritmo medio de ${formatPace(activity.avgPaceSecKm)}/km` +
      (activity.avgHr ? `, con una frecuencia cardíaca media de ${activity.avgHr} ppm.` : "."),
  );

  // Pacing interpretation.
  if (pacing.strategy === "positive") {
    let p = `Los primeros kilómetros fueron demasiado rápidos: la primera mitad la corriste a ${formatPace(pacing.firstHalfPace)}/km y la segunda a ${formatPace(pacing.secondHalfPace)}/km, una caída del ${pacing.fadePct.toFixed(1)}%.`;
    if (pacing.fadeStartKm) {
      p += ` La pérdida de ritmo sostenida empieza en el km ${pacing.fadeStartKm}.`;
    }
    if (activity.avgHr && profile.maxHr) {
      const hrPct = Math.round((activity.avgHr / profile.maxHr) * 100);
      if (hrPct > 88) {
        p += ` Tu frecuencia cardíaca (${hrPct}% de tu máxima) indica que corriste por encima de tu umbral demasiado pronto.`;
      }
    }
    if (pacing.timeLostSec > 10) {
      p += ` Si hubieras salido unos 10 segundos más lento por kilómetro, probablemente habrías terminado ${pacing.timeLostSec} segundos antes.`;
    }
    paragraphs.push(p);
  } else if (pacing.strategy === "negative") {
    paragraphs.push(
      `Ejecución excelente: split negativo (${formatPace(pacing.firstHalfPace)} → ${formatPace(pacing.secondHalfPace)}/km). Terminar más rápido de lo que empiezas es la marca de un corredor que se conoce.`,
    );
  } else if (pacing.strategy === "even" && activity.type !== "intervals") {
    paragraphs.push(
      `Ritmo muy estable de principio a fin (variabilidad del ${pacing.variabilityPct}%). Esa regularidad es exactamente lo que buscamos en este tipo de sesión.`,
    );
  } else if (activity.type === "intervals") {
    paragraphs.push(
      `Sesión fraccionada: tu kilómetro más rápido fue el ${pacing.fastestKm?.km} (${formatPace(pacing.fastestKm?.pace ?? 0)}/km). La variabilidad alta aquí es intencionada y correcta.`,
    );
  }

  // Relative intensity vs threshold.
  const rel = activity.avgPaceSecKm / threshold;
  let effect: string;
  if (activity.type === "intervals") {
    effect =
      "Este entrenamiento mejora principalmente tu VO2max y tu velocidad. Es la sesión que más eleva tu techo aeróbico.";
  } else if (rel < 1.03 && activity.distanceKm >= 5) {
    effect =
      "Corriste en torno a tu umbral: este entrenamiento mejora tu capacidad de sostener ritmos exigentes (resistencia al lactato).";
  } else if (activity.type === "long") {
    effect =
      "Este entrenamiento mejora principalmente tu resistencia aeróbica y la economía de carrera. No mejora demasiado tu velocidad, y no debe hacerlo.";
  } else if (rel > 1.18) {
    effect =
      "Sesión de baja intensidad: construye base aeróbica y acelera la recuperación. Su valor está en permitirte absorber las sesiones duras.";
  } else {
    effect =
      "Intensidad media: aporta volumen aeróbico útil, aunque vigila que tus días suaves sean realmente suaves.";
  }

  // Advice.
  let advice: string;
  if (pacing.strategy === "positive" && activity.type !== "intervals") {
    advice = `Mañana: rodaje suave de 30–40 minutos por debajo de ${formatPace(threshold * 1.25)}/km. Y en tu próxima sesión similar, márcate el primer kilómetro como el más lento del día.`;
  } else if (activity.type === "intervals" || activity.type === "tempo") {
    advice = "Mañana toca recuperación: trote muy suave o descanso. La adaptación de hoy se consolida descansando.";
  } else if (activity.type === "long") {
    advice = "Hidrátate bien y duerme: el rodaje largo vacía depósitos. Mañana, si corres, que sea corto y cómodo.";
  } else {
    advice = `Buen día de base. Tu ritmo umbral estimado está en ${formatPace(threshold)}/km: úsalo como referencia para tu próxima sesión de calidad.`;
  }

  return {
    activityId: activity.id,
    headline,
    paragraphs,
    pacing: {
      strategy: pacing.strategy,
      fadePct: pacing.fadePct,
      firstHalfPace: pacing.firstHalfPace,
      secondHalfPace: pacing.secondHalfPace,
      timeLostSec: pacing.timeLostSec,
    },
    effect,
    advice,
  };
}
