import type { ReactNode } from "react";

/** Shared tooltip shell: elevated surface, hairline border, text in ink tokens. */
export function TooltipShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border-strong)",
        color: "var(--text-primary)",
      }}
    >
      {children}
    </div>
  );
}

export function TooltipRow({
  color,
  label,
  value,
}: {
  color?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {color && <span className="h-2 w-2 rounded-full" style={{ background: color }} />}
      <span className="text-ink-2">{label}</span>
      <span className="tnum ml-auto pl-3 font-medium">{value}</span>
    </div>
  );
}
