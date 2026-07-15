import Anthropic from "@anthropic-ai/sdk";
import type { ChatTurn, CoachModel } from "./provider";

const MODEL = process.env.AI_MODEL || "claude-opus-4-8";

/**
 * Claude provider (Anthropic Messages API via the official SDK).
 * Adaptive thinking is enabled; streaming is used for chat responses.
 */
export function createAnthropicModel(): CoachModel {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY

  const toMessages = (turns: ChatTurn[]): Anthropic.MessageParam[] =>
    turns.map((t) => ({ role: t.role, content: t.content }));

  return {
    provider: "anthropic",

    async complete(system, turns) {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        system,
        messages: toMessages(turns),
      });
      const message = await stream.finalMessage();
      return message.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
    },

    async stream(system, turns) {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        system,
        messages: toMessages(turns),
      });
      const encoder = new TextEncoder();
      return new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            stream.on("text", (delta) => controller.enqueue(encoder.encode(delta)));
            await stream.finalMessage();
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
        cancel() {
          stream.abort();
        },
      });
    },
  };
}
