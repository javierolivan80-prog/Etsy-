"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  CalendarDays,
  BarChart3,
  Lightbulb,
  Target,
  Flag,
  MessageCircle,
  Trophy,
  Upload,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activities", label: "Actividades", icon: Activity },
  { href: "/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/stats", label: "Estadísticas", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/goals", label: "Objetivos", icon: Target },
  { href: "/race-predictor", label: "Race Predictor", icon: Flag },
  { href: "/chat", label: "Entrenador IA", icon: MessageCircle },
  { href: "/achievements", label: "Logros", icon: Trophy },
  { href: "/import", label: "Importar", icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 z-20 flex h-auto w-full shrink-0 flex-row items-center gap-1 overflow-x-auto border-b border-line bg-elevated/80 px-3 py-2 backdrop-blur-lg md:h-screen md:w-60 md:flex-col md:items-stretch md:overflow-visible md:border-b-0 md:border-r md:px-4 md:py-6">
      <Link href="/" className="mb-0 mr-2 flex items-center gap-2 md:mb-8 md:mr-0">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 17l5-10 4 7 3-4 6 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="text-sm font-semibold tracking-tight">
          Pace<span className="text-accent">AI</span>
        </span>
      </Link>

      <nav className="flex flex-row gap-1 md:flex-col">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                active
                  ? "bg-[var(--accent-soft)] font-medium text-accent-strong"
                  : "text-ink-2 hover:bg-hover hover:text-ink"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto md:mt-auto md:ml-0">
        <ThemeToggle />
      </div>
    </aside>
  );
}
