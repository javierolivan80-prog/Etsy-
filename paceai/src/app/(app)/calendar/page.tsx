import type { Metadata } from "next";
import Link from "next/link";
import { getAnalysis } from "@/lib/data";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Calendario" };

const VERDICT_META: Record<
  string,
  { label: string; icon: string; className: string }
> = {
  excellent: { label: "Excelente", icon: "★", className: "bg-[color-mix(in_srgb,var(--status-good)_18%,transparent)] text-good" },
  normal: { label: "Normal", icon: "●", className: "bg-[var(--accent-soft)] text-accent-strong" },
  "too-intense": { label: "Demasiado intenso", icon: "▲", className: "bg-[color-mix(in_srgb,var(--status-serious)_18%,transparent)] text-serious" },
  recovery: { label: "Recuperación", icon: "◐", className: "bg-hover text-ink-2" },
  rest: { label: "Descanso", icon: "·", className: "text-ink-3" },
};

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

export default async function CalendarPage() {
  const { analysis } = await getAnalysis();
  const days = analysis.calendar; // oldest → newest, 35 days

  // Align the grid to start on Monday.
  const firstDay = new Date(days[0].date);
  const lead = (firstDay.getDay() + 6) % 7;

  return (
    <div className="space-y-4">
      <header className="fade-up">
        <h1 className="text-xl font-semibold tracking-tight">Calendario</h1>
        <p className="mt-1 text-sm text-ink-2">
          No solo cuándo corriste: cómo de bien estuvo cada día.
        </p>
      </header>

      <Card className="fade-up">
        <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs text-ink-3">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: lead }).map((_, i) => (
            <div key={`lead-${i}`} />
          ))}
          {days.map((day) => {
            const meta = VERDICT_META[day.verdict];
            const date = new Date(day.date);
            const content = (
              <div
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border border-transparent text-center transition-colors ${meta.className} ${day.activityIds.length > 0 ? "hover:border-[var(--border-strong)]" : ""}`}
                title={`${meta.label}${day.km > 0 ? ` · ${day.km} km` : ""}`}
              >
                <span className="text-[10px] opacity-70">{date.getDate()}</span>
                <span className="text-sm leading-none">{meta.icon}</span>
                {day.km > 0 && <span className="tnum text-[10px]">{day.km}k</span>}
              </div>
            );
            return day.activityIds.length > 0 ? (
              <Link key={day.date} href={`/activities/${day.activityIds[0]}`}>
                {content}
              </Link>
            ) : (
              <div key={day.date}>{content}</div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-4 text-xs text-ink-2">
          {Object.entries(VERDICT_META).map(([k, m]) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className={`grid h-5 w-5 place-items-center rounded-md ${m.className}`}>{m.icon}</span>
              {m.label}
            </span>
          ))}
        </div>
      </Card>

      <Card className="fade-up" title="Cómo leerlo">
        <p className="text-sm leading-relaxed text-ink-2">
          <span className="font-medium text-ink">★ Excelente</span> marca sesiones de calidad o tiradas largas bien
          ejecutadas. <span className="font-medium text-ink">▲ Demasiado intenso</span> aparece cuando la carga del día
          supera lo que tu forma actual asimila o cuando una tirada larga se te fue de ritmo — dos o tres seguidos son
          la antesala de una lesión. Los días de <span className="font-medium text-ink">◐ recuperación</span> valen
          tanto como los duros: ahí es donde tu cuerpo construye la mejora.
        </p>
      </Card>
    </div>
  );
}
