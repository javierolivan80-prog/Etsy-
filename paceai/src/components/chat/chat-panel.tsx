"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Send, User } from "lucide-react";

interface Turn {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "¿Por qué hoy corrí peor?",
  "¿Cómo bajo de 45 minutos en 10K?",
  "¿Estoy listo para una media maratón?",
  "¿Estoy entrenando demasiado?",
];

export function ChatPanel() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  async function send(question: string) {
    if (!question.trim() || busy) return;
    const history = turns;
    setTurns((t) => [...t, { role: "user", content: question }, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, history }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Error de red");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      // Stream tokens into the last assistant turn.
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setTurns((t) => {
          const copy = [...t];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
        scrollToBottom();
      }
    } catch (err) {
      setTurns((t) => {
        const copy = [...t];
        copy[copy.length - 1] = {
          role: "assistant",
          content: err instanceof Error ? `⚠️ ${err.message}` : "⚠️ No se pudo responder.",
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {turns.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-accent">
              <Bot size={22} />
            </span>
            <p className="max-w-sm text-sm text-ink-2">
              Soy tu entrenador. Conozco cada kilómetro que has corrido: tus ritmos, tu carga, tus errores y tu
              potencial. Pregúntame.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-line bg-elevated px-3.5 py-1.5 text-xs text-ink-2 transition-colors hover:border-[var(--border-strong)] hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${t.role === "user" ? "justify-end" : ""}`}
          >
            {t.role === "assistant" && (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-accent">
                <Bot size={15} />
              </span>
            )}
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                t.role === "user" ? "bg-accent text-white" : "bg-hover text-ink"
              }`}
            >
              {t.content || (
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:240ms]" />
                </span>
              )}
            </div>
            {t.role === "user" && (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-hover text-ink-2">
                <User size={15} />
              </span>
            )}
          </motion.div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-line p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregunta a tu entrenador…"
          disabled={busy}
          className="h-11 flex-1 rounded-xl border border-line bg-elevated px-4 text-sm text-ink outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Enviar"
          className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Send size={17} />
        </button>
      </form>
    </div>
  );
}
