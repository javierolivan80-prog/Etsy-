import type { Metadata } from "next";
import { AlertTriangle, Lightbulb, Sparkles, TrendingUp } from "lucide-react";
import { getAnalysis } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Insights" };

const KIND_META = {
  improvement: { icon: TrendingUp, tone: "good" as const, label: "Mejora" },
  pattern: { icon: Lightbulb, tone: "accent" as const, label: "Patrón" },
  warning: { icon: AlertTriangle, tone: "warning" as const, label: "Atención" },
  potential: { icon: Sparkles, tone: "serious" as const, label: "Potencial" },
};

export default async function InsightsPage() {
  const { analysis } = await getAnalysis();
  const { insights, errors, monthly } = analysis;

  return (
    <div className="space-y-6">
      <header className="fade-up">
        <h1 className="text-xl font-semibold tracking-tight">Insights</h1>
        <p className="mt-1 text-sm text-ink-2">
          Lo que tus datos dicen de ti y no se ve en ningún gráfico.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {insights.map((insight, i) => {
          const meta = KIND_META[insight.kind];
          const Icon = meta.icon;
          return (
            <Card key={insight.id} className="fade-up card-hover" >
              <div className="flex items-start gap-3" style={{ animationDelay: `${i * 50}ms` }}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-accent">
                  <Icon size={18} />
                </span>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>
                  <p className="text-sm font-medium leading-snug">{insight.text}</p>
                  {insight.detail && (
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{insight.detail}</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {insights.length === 0 && (
          <Card className="fade-up md:col-span-2">
            <p className="text-sm text-ink-2">
              Aún no hay suficientes datos para extraer patrones. Importa más entrenamientos y vuelve pronto.
            </p>
          </Card>
        )}
      </div>

      <section className="fade-up">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-3">
          Errores detectados en tu entrenamiento
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {errors.map((e) => (
            <Card key={e.id} className="card-hover">
              <div className="mb-1.5 flex items-center gap-2">
                <Badge tone={e.severity === "critical" ? "critical" : e.severity === "warning" ? "warning" : "neutral"}>
                  <AlertTriangle size={11} />
                  {e.severity === "critical" ? "Crítico" : e.severity === "warning" ? "Aviso" : "Nota"}
                </Badge>
                <h3 className="text-sm font-medium">{e.title}</h3>
              </div>
              <p className="text-xs leading-relaxed text-ink-2">{e.detail}</p>
            </Card>
          ))}
          {errors.length === 0 && (
            <Card className="md:col-span-2">
              <p className="text-sm text-ink-2">✅ Ningún error relevante: tu entrenamiento está bien estructurado.</p>
            </Card>
          )}
        </div>
      </section>

      <Card className="fade-up" title="Análisis del mes" subtitle="Los últimos 30 días interpretados">
        <ul className="space-y-2.5 text-sm leading-relaxed text-ink-2">
          {monthly.conclusions.map((c) => (
            <li key={c} className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {c}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
