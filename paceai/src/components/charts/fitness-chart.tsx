"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";
import type { LoadPoint } from "@/lib/engine/types";
import { TooltipShell, TooltipRow } from "./chart-tooltip";

const S1 = "var(--series-1)"; // fitness (CTL)
const S6 = "var(--series-6)"; // fatiga (ATL)
const S5 = "var(--series-5)"; // forma (TSB)

/**
 * Fitness / fatigue / form over time (impulse-response model).
 * One y-axis; three series with direct legend above the plot.
 */
export function FitnessChart({ data }: { data: LoadPoint[] }) {
  const shown = data.slice(-120).map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
    ctl: Math.round(p.ctl * 10) / 10,
    atl: Math.round(p.atl * 10) / 10,
    tsb: Math.round(p.tsb * 10) / 10,
  }));

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: S1 }} /> Fitness (CTL)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: S6 }} /> Fatiga (ATL)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ background: S5 }} /> Forma (TSB)
        </span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={shown} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="0" />
            <XAxis dataKey="label" tickLine={false} minTickGap={48} />
            <YAxis tickLine={false} axisLine={false} width={46} />
            <Tooltip
              cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TooltipShell>
                    <p className="mb-1 font-medium">{label}</p>
                    <TooltipRow color={S1} label="Fitness" value={String(payload.find((p) => p.dataKey === "ctl")?.value ?? "")} />
                    <TooltipRow color={S6} label="Fatiga" value={String(payload.find((p) => p.dataKey === "atl")?.value ?? "")} />
                    <TooltipRow color={S5} label="Forma" value={String(payload.find((p) => p.dataKey === "tsb")?.value ?? "")} />
                  </TooltipShell>
                ) : null
              }
            />
            <defs>
              <linearGradient id="ctlFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={S1} stopOpacity={0.22} />
                <stop offset="100%" stopColor={S1} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="ctl" stroke={S1} strokeWidth={2} fill="url(#ctlFill)" isAnimationActive animationDuration={900} />
            <Line type="monotone" dataKey="atl" stroke={S6} strokeWidth={2} dot={false} isAnimationActive animationDuration={900} />
            <Line type="monotone" dataKey="tsb" stroke={S5} strokeWidth={2} dot={false} isAnimationActive animationDuration={900} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Small sparkline variant of CTL for stat tiles. */
export function FitnessSpark({ data }: { data: LoadPoint[] }) {
  const shown = data.slice(-60);
  return (
    <div className="h-10 w-28">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={shown} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={S1} stopOpacity={0.3} />
              <stop offset="100%" stopColor={S1} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="ctl" stroke={S1} strokeWidth={1.5} fill="url(#sparkFill)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
