import type { Metadata } from "next";
import { getAnalysis } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Logros" };

export default async function AchievementsPage() {
  const { analysis } = await getAnalysis();
  const achievements = analysis.achievements;
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-4">
      <header className="fade-up">
        <h1 className="text-xl font-semibold tracking-tight">Logros</h1>
        <p className="mt-1 text-sm text-ink-2">
          {unlocked} de {achievements.length} desbloqueados.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a, i) => (
          <Card
            key={a.id}
            className={`fade-up card-hover ${a.unlocked ? "" : "opacity-70"}`}
          >
            <div style={{ animationDelay: `${i * 40}ms` }}>
              <div className="mb-3 flex items-center justify-between">
                <span className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${a.unlocked ? "bg-[var(--accent-soft)]" : "bg-hover grayscale"}`}>
                  {a.icon}
                </span>
                {a.unlocked ? (
                  <Badge tone="good">✓ Conseguido</Badge>
                ) : (
                  <Badge tone="neutral">{a.progressPct}%</Badge>
                )}
              </div>
              <h3 className="text-sm font-medium">{a.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-2">{a.description}</p>
              {a.unlocked && a.unlockedAt && (
                <p className="mt-2 text-xs text-ink-3">Desbloqueado el {formatDate(a.unlockedAt)}</p>
              )}
              {!a.unlocked && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-hover">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${a.progressPct}%` }}
                  />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
