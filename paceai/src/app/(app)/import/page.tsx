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

      <Card className="fade-up" title="Subir archivo" subtitle="GPX, TCX y FIT se analizan al instante; una foto de tu entrenamiento la lee la IA">
        <UploadPanel />
        <p className="mt-3 text-xs leading-relaxed text-ink-3">
          ¿Solo tienes una captura de Strava, Garmin o tu reloj? Súbela y la IA extrae distancia, tiempo,
          ritmo y pulsaciones. Recuerda: una foto no contiene tu GPS, así que el análisis de una imagen es
          más básico que el de un archivo GPX/TCX/FIT. La lectura de fotos requiere configurar una clave de IA
          (<code>ANTHROPIC_API_KEY</code>).
        </p>
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
          Las integraciones OAuth (Strava, Garmin…) se activarán con las credenciales de cada plataforma.
          Mientras tanto, exporta tus actividades como GPX/TCX — todas las plataformas lo permiten — y súbelas
          arriba: quedan guardadas permanentemente en tu cuenta.
        </p>
      </Card>
    </div>
  );
}
