"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Dark is the default; the choice persists in localStorage and is applied
 * before paint by the inline script in the root layout. The current theme is
 * read from <html data-theme> via a tiny external store, so server render
 * (always "dark") and client stay consistent.
 */
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function isLight() {
  return document.documentElement.dataset.theme === "light";
}

export function ThemeToggle() {
  const light = useSyncExternalStore(subscribe, isLight, () => false);

  const toggle = () => {
    document.documentElement.dataset.theme = light ? "dark" : "light";
    try {
      localStorage.setItem("paceai-theme", light ? "dark" : "light");
    } catch {}
    listeners.forEach((cb) => cb());
  };

  return (
    <button
      onClick={toggle}
      aria-label={light ? "Activar modo oscuro" : "Activar modo claro"}
      className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-hover hover:text-ink"
    >
      {light ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
