import type { ChatTurn, CoachModel } from "./provider";

const MODEL = process.env.AI_MODEL || "gemini-2.0-flash";
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** Google Gemini provider via the REST generateContent API. */
export function createGeminiModel(): CoachModel {
  const key = process.env.GEMINI_API_KEY!;
  const body = (system: string, turns: ChatTurn[]) =>
    JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: turns.map((t) => ({
        role: t.role === "assistant" ? "model" : "user",
        parts: [{ text: t.content }],
      })),
    });

  return {
    provider: "gemini",

    async complete(system, turns) {
      const res = await fetch(`${BASE}/${MODEL}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body(system, turns),
      });
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
      const json = await res.json();
      return json.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    },

    async stream(system, turns) {
      // Gemini streams NDJSON with ?alt=sse; keep it simple and re-serve the
      // full completion as a single chunk if streaming parse fails.
      const res = await fetch(`${BASE}/${MODEL}:streamGenerateContent?alt=sse&key=${key}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body(system, turns),
      });
      if (!res.ok || !res.body) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const reader = res.body.getReader();
      let buffer = "";
      return new ReadableStream<Uint8Array>({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const data = line.replace(/^data: /, "").trim();
            if (!data) continue;
            try {
              const parts = JSON.parse(data).candidates?.[0]?.content?.parts;
              for (const p of parts ?? []) {
                if (p.text) controller.enqueue(encoder.encode(p.text));
              }
            } catch {
              // partial JSON — wait for more
            }
          }
        },
        cancel() {
          reader.cancel();
        },
      });
    },
  };
}
