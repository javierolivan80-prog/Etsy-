import Link from "next/link";
import type { ReactNode } from "react";

/** Shared card layout for all auth screens. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="card w-full max-w-sm p-8 fade-up">
        <Link href="/" className="mb-6 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 17l5-10 4 7 3-4 6 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="font-semibold tracking-tight">
            Pace<span className="text-accent">AI</span>
          </span>
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-2">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-4 text-center text-xs text-ink-3">{footer}</div>}
      </div>
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-xs text-ink-2">{children}</span>;
}

export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-elevated px-4 text-sm outline-none transition-colors focus:border-[var(--accent)]";
