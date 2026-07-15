"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDuration } from "@/lib/format";
import { TooltipShell, TooltipRow } from "./chart-tooltip";

export interface ZoneDatum {
  zone: string;
  minutes: number;
  range: string;
}

/** Time in HR zones — single sequential hue (one measure, ordered categories). */
export function ZonesChart({ data }: { data: ZoneDatum[] }) {
  // Ordinal ramp of the sequential blue (dark-mode safe steps).
  const ramp = ["#86b6ef", "#5598e7", "#3987e5", "#2a78d6", "#1c5cab"];
  const withFill = data.map((d, i) => ({ ...d, fill: ramp[Math.min(i, ramp.length - 1)] }));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={withFill} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }} barCategoryGap="26%">
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 60)}h`} />
          <YAxis type="category" dataKey="zone" tickLine={false} axisLine={false} width={36} />
          <Tooltip
            cursor={{ fill: "var(--bg-hover)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as ZoneDatum & { fill: string };
              return (
                <TooltipShell>
                  <p className="mb-1 font-medium">{d.zone} · {d.range}</p>
                  <TooltipRow color={d.fill} label="Tiempo" value={formatDuration(d.minutes * 60)} />
                </TooltipShell>
              );
            }}
          />
          <Bar dataKey="minutes" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={800}>
            {withFill.map((d, i) => (
              <Cell key={i} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
