import type { Activity } from "@/lib/engine/types";

/**
 * FIT (Garmin/Coros/Wahoo binary format) support.
 *
 * Parsing FIT requires a binary decoder (e.g. the `fit-file-parser` or
 * Garmin's official `@garmin/fitsdk` package). To keep the initial bundle
 * lean the decoder is not vendored yet — this module defines the seam where
 * it plugs in. GPX/TCX cover the same data for the first release; every
 * watch platform can export both.
 */
export function parseFit(_buffer: ArrayBuffer, _fileName: string): Activity {
  throw new Error(
    "Los archivos FIT estarán soportados próximamente. Mientras tanto exporta la actividad como GPX o TCX (todas las plataformas lo permiten).",
  );
}
