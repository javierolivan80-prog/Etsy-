import type { Metadata } from "next";
import { getProfile } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";

export const metadata: Metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div className="space-y-4">
      <header className="fade-up">
        <h1 className="text-xl font-semibold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-ink-2">
          Tus zonas de frecuencia cardíaca calibran todo el análisis: carga, zonas y riesgo de lesión.
        </p>
      </header>

      <Card className="fade-up" title="Perfil de atleta">
        <ProfileForm
          initial={{
            name: profile.name,
            maxHr: profile.maxHr,
            restHr: profile.restHr,
            weightKg: profile.weightKg ?? null,
          }}
        />
      </Card>

      <Card className="fade-up" title="Consejo">
        <p className="text-sm leading-relaxed text-ink-2">
          Si no conoces tu FC máxima real, una aproximación razonable es 208 − 0,7 × edad. La FC de
          reposo se mide al despertar, aún tumbado. Cuanto más precisos sean estos valores, más fino
          será el cálculo de TRIMP, zonas y recuperación.
        </p>
      </Card>
    </div>
  );
}
