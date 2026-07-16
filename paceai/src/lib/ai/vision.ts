import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.AI_MODEL || "claude-opus-4-8";

/** Media types Claude's vision API accepts. iOS Safari normally re-encodes to JPEG on upload. */
const SUPPORTED = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type SupportedMedia = (typeof SUPPORTED)[number];

export function isSupportedImage(mediaType: string): mediaType is SupportedMedia {
  return (SUPPORTED as readonly string[]).includes(mediaType);
}

/** Summary a screenshot can plausibly yield — no per-point GPS, so no real splits. */
export interface ExtractedActivity {
  distanceKm: number;
  durationSec: number;
  /** ISO date if the screenshot shows one; caller defaults to today otherwise. */
  dateISO?: string;
  avgHr?: number;
  maxHr?: number;
  elevationGainM?: number;
  name?: string;
}

const SYSTEM = `Eres un extractor de datos de entrenamientos de correr a partir de capturas de pantalla (Strava, Garmin, Apple Fitness, relojes, etc.).
Devuelves EXCLUSIVAMENTE un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones.

Extrae SOLO lo que veas con claridad en la imagen. Campos:
- "distanceKm" (number, obligatorio): distancia total en kilómetros. Si ves millas, conviértelas (1 mi = 1.609 km).
- "durationSec" (number, obligatorio): tiempo total en movimiento en SEGUNDOS. Convierte "hh:mm:ss" o "mm:ss" a segundos.
- "dateISO" (string opcional): fecha del entrenamiento en formato ISO 8601 si aparece.
- "avgHr" (number opcional): pulsaciones medias (bpm).
- "maxHr" (number opcional): pulsaciones máximas (bpm).
- "elevationGainM" (number opcional): desnivel positivo en metros. Si ves pies, conviértelos (1 ft = 0.3048 m).
- "name" (string opcional): título del entrenamiento si aparece.

Reglas:
- Si un campo no es visible o no estás seguro, OMÍTELO (no lo inventes, no pongas 0 ni null).
- Si la imagen NO es un entrenamiento de correr con al menos distancia y tiempo legibles, devuelve exactamente: {"error":"no_data"}.`;

/**
 * Read a workout screenshot with Claude vision and return the summary numbers.
 * Requires ANTHROPIC_API_KEY. A photo has no GPS trace, so only summary data is
 * recoverable — the caller synthesises even splits from distance and duration.
 */
export async function extractActivityFromImage(
  base64: string,
  mediaType: SupportedMedia,
): Promise<ExtractedActivity> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: "Extrae los datos de este entrenamiento como JSON." },
        ],
      },
    ],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  const json = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("No se pudo leer la imagen. Prueba con una captura más nítida y completa.");
  }

  if (parsed.error === "no_data") {
    throw new Error(
      "No he encontrado un entrenamiento de correr en la imagen. Sube una captura donde se vean al menos la distancia y el tiempo.",
    );
  }

  const distanceKm = Number(parsed.distanceKm);
  const durationSec = Number(parsed.durationSec);
  if (!(distanceKm > 0) || !(durationSec > 0)) {
    throw new Error("No he podido leer la distancia y el tiempo. Prueba con una captura más clara.");
  }

  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  const inRange = (v: number | undefined, lo: number, hi: number) =>
    v !== undefined && v >= lo && v <= hi ? Math.round(v) : undefined;

  return {
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationSec: Math.round(durationSec),
    dateISO:
      typeof parsed.dateISO === "string" && !Number.isNaN(new Date(parsed.dateISO).getTime())
        ? new Date(parsed.dateISO).toISOString()
        : undefined,
    avgHr: inRange(num(parsed.avgHr), 40, 240),
    maxHr: inRange(num(parsed.maxHr), 40, 250),
    elevationGainM: (() => {
      const e = num(parsed.elevationGainM);
      return e !== undefined && e >= 0 ? Math.round(e) : undefined;
    })(),
    name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim().slice(0, 120) : undefined,
  };
}
