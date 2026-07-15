import type { ChatTurn, CoachModel } from "./provider";

const MODEL = process.env.AI_MODEL || "gpt-4o";
const API = "https://api.openai.com/v1/chat/completions";

/** OpenAI provider via the REST Chat Completions API (no SDK dependency). */
export function createOpenAIModel(): CoachModel {
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  };
  const body = (system: string, turns: ChatTurn[], stream: boolean) =>
    JSON.stringify({
      model: MODEL,
      stream,
      messages: [{ role: "system", content: system }, ...turns],
    });

  return {
    provider: "openai",

    async complete(system, turns) {
      const res = await fetch(API, { method: "POST", headers, body: body(system, turns, false) });
      if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
      const json = await res.json();
      return json.choices?.[0]?.message?.content ?? "";
    },

    async stream(system, turns) {
      const res = await fetch(API, { method: "POST", headers, body: body(system, turns, true) });
      if (!res.ok || !res.body) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
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
            if (!data || data === "[DONE]") continue;
            try {
              const delta = JSON.parse(data).choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // skip malformed keep-alives
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
