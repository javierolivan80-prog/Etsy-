import { NextRequest } from "next/server";
import { insertActivity } from "@/lib/data";
import { getUser } from "@/lib/supabase/server";
import { parseGpx } from "@/lib/parsers/gpx";
import { parseTcx } from "@/lib/parsers/tcx";
import { parseFit } from "@/lib/parsers/fit";
import type { Activity } from "@/lib/engine/types";

const MAX_BYTES = 15 * 1024 * 1024;

/** Server-side sanity checks on parsed activities before persisting. */
function validateActivity(a: Activity): string | null {
  if (!(a.distanceKm > 0 && a.distanceKm < 1000)) return "Distancia fuera de rango.";
  if (!(a.durationSec > 0 && a.durationSec < 48 * 3600)) return "Duración fuera de rango.";
  if (!Number.isFinite(a.avgPaceSecKm) || a.avgPaceSecKm <= 0) return "Ritmo inválido.";
  if (Number.isNaN(new Date(a.date).getTime())) return "Fecha inválida.";
  if (!Array.isArray(a.splits) || a.splits.length > 1000) return "Parciales inválidos.";
  return null;
}

/**
 * POST /api/activities/upload — multipart upload of GPX / TCX / FIT files.
 * Requires an authenticated session; the activity is stored under the
 * user's account (RLS enforces ownership).
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Necesitas iniciar sesión para importar." }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Falta el archivo (campo 'file')." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Archivo demasiado grande (máx. 15 MB)." }, { status: 413 });
  }

  const name = file.name.toLowerCase();
  try {
    let activity: Activity;
    if (name.endsWith(".gpx")) {
      activity = parseGpx(await file.text(), file.name);
    } else if (name.endsWith(".tcx")) {
      activity = parseTcx(await file.text(), file.name);
    } else if (name.endsWith(".fit")) {
      activity = parseFit(await file.arrayBuffer(), file.name);
    } else {
      return Response.json(
        { error: "Formato no soportado. Sube un archivo GPX, TCX o FIT." },
        { status: 415 },
      );
    }

    const invalid = validateActivity(activity);
    if (invalid) {
      return Response.json({ error: `El archivo no supera la validación: ${invalid}` }, { status: 422 });
    }

    const { id } = await insertActivity(activity);
    return Response.json({ ok: true, activity: { id, name: activity.name } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo procesar el archivo.";
    return Response.json({ error: message }, { status: 422 });
  }
}
