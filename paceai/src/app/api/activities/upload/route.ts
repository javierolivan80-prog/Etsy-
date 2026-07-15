import { NextRequest } from "next/server";
import { addUploadedActivity } from "@/lib/data";
import { parseGpx } from "@/lib/parsers/gpx";
import { parseTcx } from "@/lib/parsers/tcx";
import { parseFit } from "@/lib/parsers/fit";

const MAX_BYTES = 15 * 1024 * 1024;

/**
 * POST /api/activities/upload — multipart upload of GPX / TCX / FIT files.
 * Parses, classifies and stores the activity, then the analysis engine picks
 * it up on the next render.
 */
export async function POST(req: NextRequest) {
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
    let activity;
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
    addUploadedActivity(activity);
    return Response.json({ ok: true, activity: { id: activity.id, name: activity.name } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo procesar el archivo.";
    return Response.json({ error: message }, { status: 422 });
  }
}
