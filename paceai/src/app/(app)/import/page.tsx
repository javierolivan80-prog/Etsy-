import type { Metadata } from "next";
import { UploadPanel } from "@/components/import/upload-panel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Importar entrenamientos" };

const CONNECTORS = [
  { name: "Strava", status: "próximamente" },
  { name: "Garmin Connect", status: "próximamente" },
  { name: "Apple Health", status: "próximamente" },
  { name: "Coros", status: "próximamente" },
  { name: "Polar", status: "próximamente" },
  { name: "Suunto", status: "próximamente" },
];

export default function ImportPage() {
  return (
    <div className="space-y-4">
      <header className="fade-up">
        <h1 className="text-xl font-semibold tracking-tight">Importar entrenamientos</h1>
        <p className="mt-1 text-sm text-ink-2">
          PaceAI no almacena tus entrenamientos sin más: cada archivo se analiza al momento.
        </p>
      </header>

      <Card className="fade-up" title="Subir archivo" subtitle="GPX y TCX se analizan al instante; FIT llegará en breve">
        <UploadPanel />
      </Card>

      <Card className="fade-up" title="Conectar plataformas" subtitle="Sincronización automática con tu reloj o app">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CONNECTORS.map((c) => (
            <div key={c.name} className="flex items-center justify-between rounded-xl border border-line bg-elevated px-4 py-3">
              <span className="text-sm font-medium">{c.name}</span>
              <Badge tone="neutral">{c.status}</Badge>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-3">
          Las integraciones OAuth (Strava, Garmin…) están definidas en el esquema de datos (modelo{" "}
          <code className="rounded bg-hover px-1 py-0.5">Connection</code>) y se activarán con las credenciales de cada
          plataforma. Mientras tanto, exporta tus actividades como GPX/TCX — todas las plataformas lo permiten.
        </p>
      </Card>
    </div>
  );
}
