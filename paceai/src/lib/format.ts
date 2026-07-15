/** Formatting helpers shared by server and client components. */

/** 305 → "5:05" (min:sec per km) */
export function formatPace(secPerKm: number): string {
  if (!isFinite(secPerKm) || secPerKm <= 0) return "–";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s === 60 ? 0 : s).padStart(2, "0")}`;
}

/** 2712 → "45:12" | 7343 → "2:02:23" */
export function formatDuration(totalSec: number): string {
  const sec = Math.round(totalSec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatKm(km: number, decimals = 1): string {
  return `${km.toLocaleString("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} km`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

export const WORKOUT_LABELS: Record<string, string> = {
  easy: "Rodaje suave",
  long: "Rodaje largo",
  tempo: "Tempo",
  intervals: "Series",
  recovery: "Recuperación",
  race: "Competición",
};

export const RISK_LABELS: Record<string, string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
};
