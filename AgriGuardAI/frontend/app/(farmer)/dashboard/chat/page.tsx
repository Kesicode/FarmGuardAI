"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function ChatPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const messagesEnd = { current: null as HTMLDivElement | null };

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const createSession = async () => {
    const res = await fetch(`${API}/chat/sessions`, { method: "POST", headers });
    const data = await res.json();
    setCurrentSession(data.session_id);
    setMessages([]);
    setSessions(prev => [data, ...prev]);
  };

  useEffect(() => { createSession(); }, []);

  const scrollToBottom = () => {
    document.getElementById("chat-bottom")?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { scrollToBottom(); }, [messages, streamText]);

  const sendMessage = async () => {
    if (!input.trim() || !currentSession || streaming) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setStreamText("");

    try {
      const res = await fetch(`${API}/chat/sessions/${currentSession}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: userMsg.content }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.replace("data: ", "");
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            full += parsed.text;
            setStreamText(full);
          } catch {}
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: full }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: Could not reach the AI agent. Please check if the backend is running. (${e.message})` }]);
    } finally {
      setStreamText("");
      setStreaming(false);
    }
  };

  const SUGGESTIONS = [
    "Which animals are at critical risk right now?",
    "Explain the latest health alert for my herd",
    "What does a HeatStress prediction mean?",
    "Show me animals with abnormal heart rates",
  ];

  return (
    <div style={{ height: "calc(100vh - 0px)", display: "flex", flexDirection: "column", padding: "28px 32px", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>💬 AgriGuard AI Assistant</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>RAG-powered chat with full farm knowledge base</p>
        </div>
        <button onClick={createSession} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>
          + New Chat
        </button>
      </div>

      {/* Chat messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, paddingRight: 8 }}>
        {messages.length === 0 && !streaming && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 24 }}>
            <div style={{ fontSize: 48 }}>🌾</div>
            <h2 className="gradient-text" style={{ fontSize: 22, fontWeight: 700 }}>Ask about your livestock</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 600 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => setInput(s)} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13, textAlign: "left", transition: "all 0.2s" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 12, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #00d4ff, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>🌾</div>
            )}
            <div style={{
              maxWidth: "70%", padding: "14px 18px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: m.role === "user" ? "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(6,182,212,0.1))" : "var(--bg-card)",
              border: "1px solid var(--border)", fontSize: 14, lineHeight: 1.6, color: "var(--text-primary)",
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {streaming && streamText && (
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #00d4ff, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>🌾</div>
            <div style={{ maxWidth: "70%", padding: "14px 18px", borderRadius: "18px 18px 18px 4px", background: "var(--bg-card)", border: "1px solid var(--accent-cyan)", fontSize: 14, lineHeight: 1.6 }}>
              {streamText}<span style={{ animation: "agent-pulse 1s ease-in-out infinite", display: "inline-block", width: 8, height: 14, background: "var(--accent-cyan)", borderRadius: 2, marginLeft: 4, verticalAlign: "text-bottom" }} />
            </div>
          </div>
        )}
        <div id="chat-bottom" />
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 12 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask about your livestock health, alerts, or predictions..."
          style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 20px", color: "var(--text-primary)", fontSize: 14, outline: "none" }}
        />
        <button onClick={sendMessage} disabled={streaming || !input.trim()} className="btn-primary" style={{ padding: "14px 24px", opacity: streaming || !input.trim() ? 0.5 : 1 }}>
          {streaming ? "..." : "Send →"}
        </button>
      </div>
    </div>
  );
}
