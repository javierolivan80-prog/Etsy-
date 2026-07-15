"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Split } from "@/lib/engine/types";
import { formatPace } from "@/lib/format";
import { TooltipShell, TooltipRow } from "./chart-tooltip";

const S1 = "var(--series-1)";
const S6 = "var(--series-6)";

/**
 * Per-km splits. Bars encode pace (shorter = faster, y inverted visually by
 * charting seconds/km); kilometres slower than the session average by >4%
 * are highlighted with the warm series color + direct label, so the fade is
 * visible at a glance and not by color alone.
 */
export function SplitsChart({ splits, avgPace }: { splits: Split[]; avgPace: number }) {
  const data = splits
    .filter((s) => s.distanceKm >= 0.3)
    .map((s) => {
      const pace = s.seconds / s.distanceKm;
      return {
        km: `${s.km}`,
        pace: Math.round(pace),
        slow: pace > avgPace * 1.04,
        hr: s.avgHr,
      };
    });
  const min = Math.min(...data.map((d) => d.pace));
  const max = Math.max(...data.map((d) => d.pace));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 4, left: -6, bottom: 0 }} barCategoryGap="24%">
          <CartesianGrid vertical={false} />
          <XAxis dataKey="km" tickLine={false} label={{ value: "km", position: "insideBottomRight", offset: -2, fill: "var(--text-muted)", fontSize: 11 }} />
          <YAxis
            reversed
            domain={[Math.max(0, min - 15), max + 10]}
            tickFormatter={(v) => formatPace(v)}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip
            cursor={{ fill: "var(--bg-hover)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as { pace: number; hr?: number; slow: boolean };
              return (
                <TooltipShell>
                  <p className="mb-1 font-medium">Kilómetro {label}</p>
                  <TooltipRow color={d.slow ? S6 : S1} label="Ritmo" value={`${formatPace(d.pace)}/km`} />
                  {d.hr && <TooltipRow label="FC media" value={`${d.hr} ppm`} />}
                  {d.slow && <p className="mt-1 text-[11px] text-serious">▲ Más lento que tu media</p>}
                </TooltipShell>
              );
            }}
          />
          <Bar dataKey="pace" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={700}
            activeBar={<Rectangle stroke="var(--bg-card)" strokeWidth={2} radius={4} />}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.slow ? S6 : S1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
