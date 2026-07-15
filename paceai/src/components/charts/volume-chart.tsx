"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TooltipShell, TooltipRow } from "./chart-tooltip";

const S1 = "var(--series-1)";

/** Weekly volume bars — thin marks, rounded data-ends, 2px gaps. */
export function VolumeChart({ data }: { data: { label: string; km: number }[] }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} minTickGap={20} />
          <YAxis tickLine={false} axisLine={false} width={46} unit=" km" allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "var(--bg-hover)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <TooltipShell>
                  <p className="mb-1 font-medium">Semana del {label}</p>
                  <TooltipRow color={S1} label="Volumen" value={`${payload[0].value} km`} />
                </TooltipShell>
              ) : null
            }
          />
          <Bar
            dataKey="km"
            fill={S1}
            radius={[4, 4, 0, 0]}
            isAnimationActive
            animationDuration={800}
            activeBar={<Rectangle fill="var(--series-1)" stroke="var(--bg-card)" strokeWidth={2} radius={4} />}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
