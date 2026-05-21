"use client";

import { useEffect, useState } from "react";
import { Button } from "@notoflow/ui/components/button";

interface AiRequest {
  prompt: string;
  type?: "improve" | "summarize" | "expand" | "translate" | "fix" | "brainstorm";
  context?: string;
  targetLang?: string;
}

export function AiPanel() {
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState<AiRequest | null>(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<AiRequest>;
      setOpen(true);
      setRequest(customEvent.detail);
      setInput(customEvent.detail.prompt);
      sendRequest(customEvent.detail);
    };
    window.addEventListener("open-ai-panel", handler as EventListener);
    return () => window.removeEventListener("open-ai-panel", handler as EventListener);
  }, []);

  const sendRequest = async (aiRequest: AiRequest) => {
    setLoading(true);
    setResponse("");

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(aiRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        setResponse(`Erreur: ${error.error || "Une erreur est survenue"}`);
        setLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setResponse("Erreur: Impossible de lire la réponse");
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setLoading(false);
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                setResponse((prev) => prev + `\n\nErreur: ${parsed.error}`);
              } else if (parsed.text) {
                setResponse((prev) => prev + parsed.text);
              }
            } catch (e) {
              // Ignore parsing errors for non-JSON data
            }
          }
        }
      }
    } catch (error) {
      setResponse(`Erreur réseau: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendRequest({
      prompt: input,
      type: request?.type,
      context: request?.context,
      targetLang: request?.targetLang,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(420px,calc(100vw-2rem))] rounded-xl border bg-popover p-4 shadow-xl flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Assistant IA</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Fermer
        </Button>
      </div>

      {response && (
        <div className="max-h-64 overflow-y-auto rounded-lg bg-muted p-3 text-sm prose prose-sm dark:prose-invert">
          <div className="whitespace-pre-wrap">{response}</div>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Votre demande..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={loading}
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-50"
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          size="sm"
        >
          {loading ? "..." : "Envoyer"}
        </Button>
      </div>
    </div>
  );
}
