import type { ReactNode } from "react";

type Tone = "neutral" | "good" | "warning" | "serious" | "critical" | "accent";

const TONES: Record<Tone, string> = {
  neutral: "bg-hover text-ink-2",
  good: "bg-[color-mix(in_srgb,var(--status-good)_15%,transparent)] text-good",
  warning: "bg-[color-mix(in_srgb,var(--status-warning)_15%,transparent)] text-warning",
  serious: "bg-[color-mix(in_srgb,var(--status-serious)_15%,transparent)] text-serious",
  critical: "bg-[color-mix(in_srgb,var(--status-critical)_15%,transparent)] text-critical",
  accent: "bg-[var(--accent-soft)] text-accent-strong",
};

/** Status is never color-alone: pass an icon or emoji with the label. */
export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export const WORKOUT_TONES: Record<string, Tone> = {
  easy: "good",
  recovery: "neutral",
  long: "accent",
  tempo: "warning",
  intervals: "serious",
  race: "critical",
};
