import type { Metadata } from "next";
import { getAnalysis } from "@/lib/data";
import { formatDuration, formatKm, formatPace } from "@/lib/format";
import { Card, Stat } from "@/components/ui/card";
import { VolumeChart } from "@/components/charts/volume-chart";
import { PaceTrendChart, type PacePoint } from "@/components/charts/pace-trend-chart";
import { ZonesChart, type ZoneDatum } from "@/components/charts/zones-chart";

export const metadata: Metadata = { title: "Estadísticas" };

export default async function StatsPage() {
  const { activities, profile, analysis } = await getAnalysis();
  const { weekly, monthly } = analysis;

  const totalKm = activities.reduce((s, a) => s + a.distanceKm, 0);
  const totalSec = activities.reduce((s, a) => s + a.durationSec, 0);
  const totalElev = activities.reduce((s, a) => s + (a.elevationGainM ?? 0), 0);
  const avgCadence = Math.round(
    activities.filter((a) => a.cadenceSpm).reduce((s, a) => s + (a.cadenceSpm ?? 0), 0) /
      Math.max(1, activities.filter((a) => a.cadenceSpm).length),
  );
  const avgStride =
    Math.round(
      (activities.filter((a) => a.strideLenM).reduce((s, a) => s + (a.strideLenM ?? 0), 0) /
        Math.max(1, activities.filter((a) => a.strideLenM).length)) * 100,
    ) / 100;
  const avgPower = Math.round(
    activities.filter((a) => a.powerW).reduce((s, a) => s + (a.powerW ?? 0), 0) /
      Math.max(1, activities.filter((a) => a.powerW).length),
  );
  const totalCal = activities.reduce((s, a) => s + (a.calories ?? 0), 0);
  const withHr = activities.filter((a) => a.avgHr);
  const avgHr = Math.round(withHr.reduce((s, a) => s + (a.avgHr ?? 0), 0) / Math.max(1, withHr.length));

  // Pace trend: non-interval sessions, with 5-session rolling mean.
  const paceable = activities.filter((a) => a.type !== "intervals" && a.type !== "recovery");
  const pacePoints: PacePoint[] = paceable.map((a, i) => {
    const window = paceable.slice(Math.max(0, i - 4), i + 1);
    return {
      t: new Date(a.date).getTime(),
      pace: Math.round(a.avgPaceSecKm),
      trend: Math.round(window.reduce((s, x) => s + x.avgPaceSecKm, 0) / window.length),
      name: `${a.name} · ${a.date.slice(0, 10)}`,
    };
  });

  // Time in HR zones across full history (zones from % max HR).
  const zoneBounds = [0.6, 0.7, 0.8, 0.9, 1.01].map((f) => Math.round(profile.maxHr * f));
  const zones: ZoneDatum[] = [
    { zone: "Z1", minutes: 0, range: `< ${zoneBounds[0]} ppm` },
    { zone: "Z2", minutes: 0, range: `${zoneBounds[0]}–${zoneBounds[1]} ppm` },
    { zone: "Z3", minutes: 0, range: `${zoneBounds[1]}–${zoneBounds[2]} ppm` },
    { zone: "Z4", minutes: 0, range: `${zoneBounds[2]}–${zoneBounds[3]} ppm` },
    { zone: "Z5", minutes: 0, range: `> ${zoneBounds[3]} ppm` },
  ];
  for (const a of activities) {
    for (const s of a.splits) {
      if (!s.avgHr) continue;
      const idx = zoneBounds.findIndex((b) => s.avgHr! < b);
      zones[idx === -1 ? 4 : idx].minutes += s.seconds / 60;
    }
  }
  for (const z of zones) z.minutes = Math.round(z.minutes);

  return (
    <div className="space-y-4">
      <header className="fade-up">
        <h1 className="text-xl font-semibold tracking-tight">Estadísticas</h1>
        <p className="mt-1 text-sm text-ink-2">Todo tu historial, medido y en contexto.</p>
      </header>

      <div className="fade-up grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="!p-4"><Stat label="Kilómetros" value={formatKm(totalKm, 0)} accent /></Card>
        <Card className="!p-4"><Stat label="Tiempo" value={formatDuration(totalSec)} /></Card>
        <Card className="!p-4"><Stat label="Desnivel +" value={`${totalElev.toLocaleString("es-ES")} m`} /></Card>
        <Card className="!p-4"><Stat label="FC media" value={`${avgHr} ppm`} /></Card>
        <Card className="!p-4"><Stat label="Cadencia" value={`${avgCadence} spm`} /></Card>
        <Card className="!p-4"><Stat label="Zancada" value={`${avgStride} m`} /></Card>
        <Card className="!p-4"><Stat label="Potencia" value={`${avgPower} W`} /></Card>
        <Card className="!p-4"><Stat label="Calorías" value={`${Math.round(totalCal / 1000)}k kcal`} /></Card>
        <Card className="!p-4"><Stat label="Sesiones" value={String(activities.length)} /></Card>
        <Card className="!p-4"><Stat label="Ritmo 30 días" value={`${formatPace(monthly.avgPaceSecKm)}/km`} /></Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="fade-up" title="Evolución del ritmo" subtitle="Rodajes y tempos: más arriba es más rápido">
          <PaceTrendChart data={pacePoints} />
        </Card>
        <Card className="fade-up" title="Tiempo en zonas de FC" subtitle={`Sobre FC máx. de ${profile.maxHr} ppm`}>
          <ZonesChart data={zones} />
        </Card>
      </div>

      <Card className="fade-up" title="Volumen semanal" subtitle="Últimas 12 semanas">
        <VolumeChart data={weekly} />
      </Card>
    </div>
  );
}
