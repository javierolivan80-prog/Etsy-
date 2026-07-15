import type { Metadata } from "next";
import { ChatPanel } from "@/components/chat/chat-panel";

export const metadata: Metadata = { title: "Entrenador IA" };

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <header className="fade-up">
        <h1 className="text-xl font-semibold tracking-tight">Entrenador IA</h1>
        <p className="mt-1 text-sm text-ink-2">
          Pregunta lo que quieras: responde usando todos tus entrenamientos, no frases genéricas.
        </p>
      </header>
      <ChatPanel />
    </div>
  );
}
