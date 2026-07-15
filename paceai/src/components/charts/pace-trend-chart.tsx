"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPace } from "@/lib/format";
import { TooltipShell, TooltipRow } from "./chart-tooltip";

const S1 = "var(--series-1)";
const S3 = "var(--series-3)";

export interface PacePoint {
  t: number; // epoch ms
  pace: number; // sec/km — individual session
  trend?: number; // rolling average
  name: string;
}

/** Pace over time: session dots + rolling trend line. Y axis inverted (faster = up). */
export function PaceTrendChart({ data }: { data: PacePoint[] }) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: S3 }} /> Sesiones
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: S1 }} /> Tendencia (media 5 sesiones)
        </span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(t) => new Date(t).toLocaleDateString("es-ES", { month: "short" })}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              reversed
              domain={["dataMin - 10", "dataMax + 10"]}
              tickFormatter={(v) => formatPace(v)}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip
              cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as PacePoint;
                return (
                  <TooltipShell>
                    <p className="mb-1 font-medium">{p.name}</p>
                    <TooltipRow color={S3} label="Ritmo" value={`${formatPace(p.pace)}/km`} />
                    {p.trend && <TooltipRow color={S1} label="Tendencia" value={`${formatPace(p.trend)}/km`} />}
                  </TooltipShell>
                );
              }}
            />
            <Scatter dataKey="pace" fill={S3} shape={(props: unknown) => {
              const { cx, cy } = props as { cx?: number; cy?: number };
              return <circle cx={cx} cy={cy} r={3.5} fill={S3} stroke="var(--bg-card)" strokeWidth={1} />;
            }} />
            <Line type="monotone" dataKey="trend" stroke={S1} strokeWidth={2} dot={false} connectNulls isAnimationActive animationDuration={900} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
