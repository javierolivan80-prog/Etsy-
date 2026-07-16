import { NextRequest } from "next/server";
import { z } from "zod";
import { getAnalysis } from "@/lib/data";
import { createClient, getUser } from "@/lib/supabase/server";
import { askCoach } from "@/lib/ai/coach";
import type { ChatTurn } from "@/lib/ai/provider";

const BodySchema = z.object({
  question: z.string().trim().min(1).max(4000),
});

/**
 * POST /api/chat — the AI coach. Streams plain text.
 * History is loaded from and persisted to the user's chat_messages rows,
 * and every answer is grounded on their full training history.
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Necesitas iniciar sesión." }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Petición inválida" }, { status: 400 });
  }
  const { question } = parsed.data;

  const supabase = await createClient();
  const [{ activities, profile, analysis }, historyRes] = await Promise.all([
    getAnalysis(),
    supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const history = ((historyRes.data ?? []) as ChatTurn[]).reverse();

  // Persist the user's question immediately.
  await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: question });

  const saveAssistant = async (content: string) => {
    if (content.trim()) {
      await supabase
        .from("chat_messages")
        .insert({ user_id: user.id, role: "assistant", content: content.slice(0, 20000) });
    }
  };

  try {
    const result = await askCoach(question, history, activities, profile, analysis);

    if (typeof result === "string") {
      await saveAssistant(result);
      return new Response(result, {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    // Tee the stream: forward to the client while accumulating for storage.
    let acc = "";
    const decoder = new TextDecoder();
    const persisting = result.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          acc += decoder.decode(chunk, { stream: true });
          controller.enqueue(chunk);
        },
        async flush() {
          await saveAssistant(acc);
        },
      }),
    );

    return new Response(persisting, {
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
