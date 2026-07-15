import { NextRequest } from "next/server";
import { z } from "zod";
import { getAnalysis } from "@/lib/data";
import { askCoach } from "@/lib/ai/coach";

const BodySchema = z.object({
  question: z.string().min(1).max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8000),
      }),
    )
    .max(30)
    .default([]),
});

/**
 * POST /api/chat — the AI coach. Streams plain text.
 * Grounded on the athlete's full history + engine analysis.
 */
export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Petición inválida" }, { status: 400 });
  }
  const { question, history } = parsed.data;
  const { activities, profile, analysis } = await getAnalysis();

  try {
    const result = await askCoach(question, history, activities, profile, analysis);
    if (typeof result === "string") {
      return new Response(result, {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    return new Response(result, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    console.error("chat error", err);
    return Response.json(
      { error: "El entrenador no está disponible ahora mismo. Inténtalo de nuevo." },
      { status: 502 },
    );
  }
}
