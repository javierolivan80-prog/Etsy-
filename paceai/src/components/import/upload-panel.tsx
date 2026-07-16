"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2 } from "lucide-react";

export function UploadPanel() {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function upload(file: File) {
    setBusy(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/activities/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al subir el archivo");
      setMessage({ ok: true, text: `«${json.activity.name}» importado y analizado. Abriendo informe…` });
      router.push(`/activities/${encodeURIComponent(json.activity.id)}`);
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Error inesperado" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        className={`flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-line hover:border-[var(--border-strong)]"
        }`}
      >
        {busy ? (
          <Loader2 size={26} className="animate-spin text-accent" />
        ) : (
          <FileUp size={26} className="text-ink-3" />
        )}
        <div>
          <p className="text-sm font-medium">{busy ? "Analizando…" : "Arrastra tu archivo aquí o haz clic"}</p>
          <p className="mt-1 text-xs text-ink-3">GPX · TCX · FIT — máx. 15 MB</p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".gpx,.tcx,.fit,application/gpx+xml,text/xml,application/xml,application/octet-stream"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
      {message && (
        <p className={`mt-3 text-sm ${message.ok ? "text-good" : "text-critical"}`}>{message.text}</p>
      )}
    </div>
  );
}
