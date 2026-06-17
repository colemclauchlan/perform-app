"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Bot, User, AlertCircle, RotateCcw } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Review my training this week and suggest what to prioritise next.",
  "Build me a high-protein day that hits my macro targets.",
  "Am I progressing on my main lifts? What should I push?",
  "Explain my active protocol's timing and what bloodwork to watch.",
];

const GREETING =
  "Hey — I'm your built-in coach. I can see your logged lifts, macros, body weight and protocols. Ask me about training, nutrition, or your compounds and I'll give you specific, data-backed guidance.";

function renderMarkdown(text: string) {
  // Lightweight inline renderer: bold, bullets, line breaks.
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    const content = bulletMatch ? bulletMatch[1] : line;
    const parts = content.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <strong key={j} className="text-text-1 font-semibold">
          {p.slice(2, -2)}
        </strong>
      ) : (
        <span key={j}>{p}</span>
      )
    );
    if (bulletMatch) {
      return (
        <div key={i} className="flex gap-2 pl-1">
          <span className="text-accent mt-px">•</span>
          <span>{parts}</span>
        </div>
      );
    }
    if (!line.trim()) return <div key={i} className="h-2" />;
    return <div key={i}>{parts}</div>;
  });
}

export default function CoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "The coach could not respond. Please try again.");
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "(no response)" }]);
    } catch {
      setError("Network error reaching the coach. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
            <Sparkles size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-1">AI Coach</h1>
            <p className="text-xs text-text-3">Powered by Claude · sees your tracked data</p>
          </div>
        </div>
        {!empty && (
          <button
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
            className="btn btn-ghost btn-sm flex items-center gap-1.5"
          >
            <RotateCcw size={14} /> New chat
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-2xl border border-border bg-bg-2 p-4 space-y-4"
      >
        {empty && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mb-4">
              <Bot size={28} className="text-accent" />
            </div>
            <p className="text-text-2 max-w-md mb-6 leading-relaxed">{GREETING}</p>
            <div className="grid sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm text-text-2 hover:text-text-1 rounded-xl border border-border bg-bg-3 hover:border-accent/40 px-3 py-2.5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                m.role === "user" ? "bg-bg-3 text-text-2" : "bg-accent/15 text-accent"
              }`}
            >
              {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div
              className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-[80%] ${
                m.role === "user"
                  ? "bg-accent text-white"
                  : "bg-bg-3 text-text-2 border border-border"
              }`}
            >
              {m.role === "assistant" ? (
                <div className="space-y-0.5">{renderMarkdown(m.content)}</div>
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-bg-3 border border-border flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-text-3 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-text-3 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-text-3 animate-bounce" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-2 items-start rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-text-2">
            <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex items-end gap-2">
        <textarea
          ref={taRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Ask your coach anything…"
          className="flex-1 resize-none rounded-xl border border-border bg-bg-2 px-4 py-3 text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:border-accent/50 max-h-40"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn btn-primary h-[46px] w-[46px] flex items-center justify-center p-0 disabled:opacity-40"
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </form>
      <p className="text-[11px] text-text-3 text-center mt-2">
        Educational guidance only — not medical advice. Consult a doctor and get regular bloodwork.
      </p>
    </div>
  );
}
