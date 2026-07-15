import type { Activity, AthleteProfile } from "@/lib/engine/types";
import type { AnalysisSnapshot } from "@/lib/engine";
import { analyzePacing } from "@/lib/engine/pacing";
import { formatDuration, formatPace, RISK_LABELS, WORKOUT_LABELS } from "@/lib/format";
import { getCoachModel, type ChatTurn } from "./provider";

/**
 * The AI coach. Every answer is grounded in the athlete's real data: we
 * compute the full analysis snapshot with the deterministic engine and hand
 * it to the model as context, so responses are specific, never generic.
 */

function describeActivity(a: Activity): string {
  const pacing = analyzePacing(a);
  return [
    `${a.date.slice(0, 10)} · ${WORKOUT_LABELS[a.type]} · ${a.distanceKm.toFixed(1)} km`,
    `en ${formatDuration(a.durationSec)} (${formatPace(a.avgPaceSecKm)}/km)`,
    a.avgHr ? `FC ${a.avgHr}` : null,
    `split ${pacing.strategy} (${pacing.fadePct > 0 ? "+" : ""}${pacing.fadePct}%)`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function buildCoachContext(
  activities: Activity[],
  profile: AthleteProfile,
  analysis: AnalysisSnapshot,
): string {
  const recent = activities.slice(-30);
  const { scores, predictions, injuryRisk, monthly, errors, insights } = analysis;

  return `## Perfil del atleta
Nombre: ${profile.name} · FC máx: ${profile.maxHr} · FC reposo: ${profile.restHr}

## Estado actual (calculado por el motor de análisis)
Fitness ${scores.fitness}/100 · Recuperación ${scores.recovery}/100 · Resistencia ${scores.endurance}/100 · Velocidad ${scores.speed}/100 · Consistencia ${scores.consistency}/100 · Race readiness ${scores.raceReadiness}/100
VDOT/VO2max estimado: ${predictions.vo2maxEstimate} · Ritmo umbral: ${formatPace(predictions.thresholdPaceSecKm)}/km
Predicciones: ${predictions.races.map((r) => `${r.label} ${formatDuration(r.seconds)}`).join(" · ")}
Riesgo de lesión: ${RISK_LABELS[injuryRisk.level]} (ACWR ${injuryRisk.acwr}) — ${injuryRisk.reasons.join(" ")}

## Últimos 30 días
${monthly.totalKm} km en ${monthly.runs} sesiones, ritmo medio ${formatPace(monthly.avgPaceSecKm)}/km.
Distribución: ${Object.entries(monthly.byType)
    .filter(([, n]) => n > 0)
    .map(([t, n]) => `${n} ${WORKOUT_LABELS[t].toLowerCase()}`)
    .join(", ")}.
Conclusiones del motor: ${monthly.conclusions.join(" ")}

## Errores detectados
${errors.length > 0 ? errors.map((e) => `- [${e.severity}] ${e.title}: ${e.detail}`).join("\n") : "- Ninguno relevante."}

## Insights
${insights.map((i) => `- ${i.text} ${i.detail ?? ""}`).join("\n")}

## Últimas sesiones (más reciente al final)
${recent.map(describeActivity).join("\n")}`;
}

const SYSTEM_PROMPT = `Eres el entrenador personal de running de PaceAI: un entrenador de nivel olímpico que analiza datos con rigor fisiológico y habla claro.

Reglas:
- Responde SIEMPRE en español y SIEMPRE apoyándote en los datos del contexto (sesiones, ritmos, FC, cargas). Nada de consejos genéricos: cita números concretos del atleta.
- Escribe como un entrenador profesional: directo, cercano, sin tecnicismos innecesarios, pero explicando el porqué fisiológico.
- Si el atleta pregunta algo que los datos no cubren, dilo honestamente y explica qué dato haría falta.
- Ante señales de riesgo de lesión o sobreentrenamiento, prioriza la prudencia.
- Formato: párrafos cortos; listas solo cuando aporten claridad.`;

export async function askCoach(
  question: string,
  history: ChatTurn[],
  activities: Activity[],
  profile: AthleteProfile,
  analysis: AnalysisSnapshot,
): Promise<ReadableStream<Uint8Array> | string> {
  const context = buildCoachContext(activities, profile, analysis);
  const model = await getCoachModel();
  const turns: ChatTurn[] = [
    ...history,
    { role: "user", content: `${question}\n\n<datos_del_atleta>\n${context}\n</datos_del_atleta>` },
  ];
  if (model) {
    return model.stream(SYSTEM_PROMPT, turns);
  }
  return fallbackAnswer(question, analysis);
}

/**
 * Deterministic answer used when no LLM key is configured — still grounded
 * in the athlete's data so the product remains useful out of the box.
 */
function fallbackAnswer(question: string, analysis: AnalysisSnapshot): string {
  const { scores, predictions, injuryRisk, monthly, errors, insights } = analysis;
  const q = question.toLowerCase();

  if (q.includes("peor") || q.includes("mal") || q.includes("dolor") || q.includes("piernas")) {
    return (
      `Mirando tu carga reciente: recuperación ${scores.recovery}/100 y riesgo ${RISK_LABELS[injuryRisk.level].toLowerCase()} (ACWR ${injuryRisk.acwr}). ` +
      `${injuryRisk.reasons[0]} ` +
      `Cuando la carga aguda supera lo que tu cuerpo asimila, las piernas se notan pesadas y los ritmos habituales cuestan más. ` +
      `Recomendación: 1–2 días suaves o de descanso y vuelve a probar sensaciones.\n\n` +
      `💡 Configura una clave de IA (ANTHROPIC_API_KEY) para respuestas conversacionales completas.`
    );
  }
  if (q.includes("45") || q.includes("objetivo") || q.includes("10k") || q.includes("10 k")) {
    const p10k = predictions.races.find((r) => r.label === "10K")!;
    return (
      `Tu predicción actual en 10K es ${formatDuration(p10k.seconds)} (${formatPace(p10k.paceSecKm)}/km), con un VDOT de ${predictions.vdot}. ` +
      `Usa la pantalla Objetivos para ver probabilidad, fecha estimada y simulaciones de mejora concretas.\n\n` +
      `💡 Configura una clave de IA para un plan personalizado conversacional.`
    );
  }
  if (q.includes("media") || q.includes("marat")) {
    const half = predictions.races.find((r) => r.label === "Media maratón")!;
    const ready = scores.endurance >= 55 && monthly.totalKm >= 120;
    return (
      `Predicción actual en media maratón: ${formatDuration(half.seconds)}. ` +
      (ready
        ? `Con ${monthly.totalKm} km este mes y resistencia ${scores.endurance}/100, estás en condiciones de afrontarla si tu tirada larga supera ya los 16 km.`
        : `Con ${monthly.totalKm} km este mes y resistencia ${scores.endurance}/100, te falta base: construye 8–10 semanas más antes de competirla.`) +
      `\n\n💡 Configura una clave de IA para respuestas conversacionales completas.`
    );
  }
  const lines = [
    `Resumen de tu estado: fitness ${scores.fitness}/100, recuperación ${scores.recovery}/100, riesgo de lesión ${RISK_LABELS[injuryRisk.level].toLowerCase()}.`,
    monthly.conclusions[0],
    errors[0] ? `Atención: ${errors[0].title.toLowerCase()} — ${errors[0].detail}` : null,
    insights[0] ? `Insight: ${insights[0].text}` : null,
    `\n💡 Configura ANTHROPIC_API_KEY (o OPENAI/GEMINI) para chat conversacional completo.`,
  ].filter(Boolean);
  return lines.join("\n\n");
}

/** LLM-written narrative for a single activity (falls back to the rule-based report). */
export async function generateNarrativeReport(
  reportContext: string,
): Promise<string | null> {
  const model = await getCoachModel();
  if (!model) return null;
  return model.complete(
    SYSTEM_PROMPT +
      "\nEscribe un informe profesional del entrenamiento indicado: qué significa, qué se hizo bien, qué errores hubo, qué mejora fisiológica produce y qué hacer mañana.",
    [{ role: "user", content: reportContext }],
  );
}
