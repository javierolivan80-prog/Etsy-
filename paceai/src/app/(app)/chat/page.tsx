import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/data";
import { ChatPanel } from "@/components/chat/chat-panel";

export const metadata: Metadata = { title: "Entrenador IA" };

export default async function ChatPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(60);

  const history = (data ?? []) as { role: "user" | "assistant"; content: string }[];

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <header className="fade-up">
        <h1 className="text-xl font-semibold tracking-tight">Entrenador IA</h1>
        <p className="mt-1 text-sm text-ink-2">
          Pregunta lo que quieras: responde usando todos tus entrenamientos, no frases genéricas.
        </p>
      </header>
      <ChatPanel initialTurns={history} />
    </div>
  );
}
