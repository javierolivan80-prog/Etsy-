import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BatteryCharging, Flame, HeartPulse, Sparkles } from "lucide-react";
import { getAnalysis } from "@/lib/data";
import { analyzeGoal } from "@/lib/engine";
import { formatDuration, formatKm, formatMonthYear, formatPace, RISK_LABELS, WORKOUT_LABELS } from "@/lib/format";
import { Card, Stat } from "@/components/ui/card";
import { Badge, WORKOUT_TONES } from "@/components/ui/badge";
import { ScoreRing } from "@/components/ui/score-ring";
import { FitnessChart } from "@/components/charts/fitness-chart";
import { VolumeChart } from "@/components/charts/volume-chart";

export const metadata: Metadata = { title: "Dashboard" };

const FATIGUE_LABEL = (recovery: number) =>
  recovery >= 70 ? "Baja" : recovery >= 45 ? "Media" : "Alta";

export default async function DashboardPage() {
  const { activities, analysis } = await getAnalysis();
  const { scores, predictions, injuryRisk, monthly, errors, insights, weekly, load } = analysis;

  // Sample goal until the user defines one: 10K in 45:00.
  const goal = analyzeGoal(activities, 10, 45 * 60);
  const recent = [...activities].reverse().slice(0, 5);
  const topError = errors[0];
  const topInsight = insights[0];

  const riskTone = injuryRisk.level === "low" ? "good" : injuryRisk.level === "medium" ? "warning" : "critical";

  return (
    <div className="space-y-4">
      <header className="fade-up flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Estado de forma</h1>
          <p className="mt-1 text-sm text-ink-2">
            Análisis actualizado con tus últimos {monthly.runs} entrenamientos.
          </p>
        </div>
        <Badge tone={riskTone}>
          <AlertTriangle size={12} /> Riesgo de lesión: {RISK_LABELS[injuryRisk.level]}
        </Badge>
      </header>

      {/* Top stat tiles */}
      <div className="fade-up grid grid-cols-2 gap-4 lg:grid-cols-4" style={{ animationDelay: "60ms" }}>
        <Card className="flex items-center justify-between">
          <Stat label="Fitness Score" value={`${scores.fitness}/100`} sub="Carga crónica (CTL)" accent />
          <Flame className="text-accent" size={22} strokeWidth={1.8} />
        </Card>
        <Card className="flex items-center justify-between">
          <Stat label="Fatiga" value={FATIGUE_LABEL(scores.recovery)} sub={`TSB ${Math.round(load[load.length - 1]?.tsb ?? 0)}`} />
          <HeartPulse className="text-ink-3" size={22} strokeWidth={1.8} />
        </Card>
        <Card className="flex items-center justify-between">
          <Stat label="Recuperación" value={`${scores.recovery}%`} sub="Frescura para entrenar" />
          <BatteryCharging className="text-ink-3" size={22} strokeWidth={1.8} />
        </Card>
        <Card className="flex items-center justify-between">
          <Stat
            label="Objetivo · 10K en 45:00"
            value={`${goal.probabilityPct}%`}
            sub={`Fecha estimada: ${formatMonthYear(goal.estimatedDate)}`}
          />
        </Card>
      </div>

      {/* Fitness curve + weekly volume */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card
          className="fade-up lg:col-span-3"
          title="Fitness, fatiga y forma"
          subtitle="Modelo impulso-respuesta sobre toda tu carga de entrenamiento"
        >
          <FitnessChart data={load} />
        </Card>
        <Card className="fade-up lg:col-span-2" title="Volumen semanal" subtitle="Últimas 12 semanas">
          <VolumeChart data={weekly} />
        </Card>
      </div>

      {/* Coach verdicts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="fade-up" title="Lo que diría tu entrenador hoy">
          <ul className="space-y-3 text-sm leading-relaxed text-ink-2">
            {monthly.conclusions.slice(0, 3).map((c) => (
              <li key={c} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {c}
              </li>
            ))}
            {topError && (
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-serious" />
                <span>
                  <span className="font-medium text-ink">{topError.title}.</span> {topError.detail}
                </span>
              </li>
            )}
          </ul>
          <Link href="/chat" className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
            Preguntar al entrenador <ArrowRight size={14} />
          </Link>
        </Card>

        <Card className="fade-up" title="Predicciones actuales" subtitle={`VO2max estimado: ${predictions.vo2maxEstimate} · Umbral: ${formatPace(predictions.thresholdPaceSecKm)}/km`}>
          <div className="grid grid-cols-2 gap-3">
            {predictions.races.map((r) => (
              <div key={r.label} className="rounded-xl bg-hover px-4 py-3">
                <p className="text-xs text-ink-3">{r.label}</p>
                <p className="tnum mt-0.5 text-lg font-semibold">{formatDuration(r.seconds)}</p>
                <p className="text-xs text-ink-2">{formatPace(r.paceSecKm)}/km</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Scores + insight + recent */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="fade-up lg:col-span-3" title="Puntuaciones" subtitle="Ocho dimensiones de tu rendimiento, de 0 a 100">
          <div className="grid grid-cols-4 gap-y-6 pt-2">
            <ScoreRing value={scores.fitness} label="Fitness" size={84} />
            <ScoreRing value={scores.recovery} label="Recovery" size={84} />
            <ScoreRing value={scores.endurance} label="Endurance" size={84} />
            <ScoreRing value={scores.speed} label="Speed" size={84} />
            <ScoreRing value={scores.consistency} label="Consistency" size={84} />
            <ScoreRing value={scores.raceReadiness} label="Race Ready" size={84} />
            <ScoreRing value={scores.efficiency} label="Efficiency" size={84} />
            <ScoreRing value={scores.runningIQ} label="Running IQ" size={84} />
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {topInsight && (
            <Card className="fade-up">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-accent">
                  <Sparkles size={17} />
                </span>
                <div>
                  <p className="text-sm font-medium">{topInsight.text}</p>
                  {topInsight.detail && <p className="mt-1 text-xs leading-relaxed text-ink-2">{topInsight.detail}</p>}
                  <Link href="/insights" className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline">
                    Ver todos los insights <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </Card>
          )}

          <Card className="fade-up" title="Últimas sesiones">
            <ul className="divide-y divide-[var(--border)]">
              {recent.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/activities/${a.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:text-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{a.name}</p>
                      <p className="text-xs text-ink-3">
                        {new Date(a.date).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge tone={WORKOUT_TONES[a.type]}>{WORKOUT_LABELS[a.type]}</Badge>
                      <span className="tnum text-ink-2">{formatKm(a.distanceKm)}</span>
                      <span className="tnum text-ink-2">{formatPace(a.avgPaceSecKm)}/km</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
