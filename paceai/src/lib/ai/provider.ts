/**
 * Provider-agnostic LLM layer.
 *
 * PaceAI's product logic never talks to a vendor SDK directly: it asks for a
 * `CoachModel` and gets back whichever provider is configured. Set ONE of:
 *
 *   ANTHROPIC_API_KEY  → Claude (recommended, default model claude-opus-4-8)
 *   OPENAI_API_KEY     → GPT
 *   GEMINI_API_KEY     → Gemini
 *
 * Optionally override the model with AI_MODEL. With no key configured the
 * app still works: callers fall back to the deterministic rule-based engine.
 */

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface CoachModel {
  readonly provider: "anthropic" | "openai" | "gemini";
  /** One-shot completion. */
  complete(system: string, turns: ChatTurn[]): Promise<string>;
  /** Streaming completion for the chat UI. */
  stream(system: string, turns: ChatTurn[]): Promise<ReadableStream<Uint8Array>>;
}

export async function getCoachModel(): Promise<CoachModel | null> {
  if (process.env.ANTHROPIC_API_KEY) {
    const { createAnthropicModel } = await import("./anthropic");
    return createAnthropicModel();
  }
  if (process.env.OPENAI_API_KEY) {
    const { createOpenAIModel } = await import("./openai");
    return createOpenAIModel();
  }
  if (process.env.GEMINI_API_KEY) {
    const { createGeminiModel } = await import("./gemini");
    return createGeminiModel();
  }
  return null;
}

export function hasAiProvider(): boolean {
  return Boolean(
    process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY,
  );
}
