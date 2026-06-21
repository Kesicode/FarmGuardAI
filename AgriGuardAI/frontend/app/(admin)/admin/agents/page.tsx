"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WS_API = API.replace("http", "ws");

export default function AdminAgentsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`${WS_API}/ws/agents?token=${token}`);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "agent_event") {
          setEvents(prev => [data, ...prev].slice(0, 50));
        }
      } catch {}
    };
    return () => ws.close();
  }, [token]);

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Live Agent Pipeline</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {["Supervisor", "Sensor Intel", "Health Assess", "Disease Predict"].map(agent => (
          <div key={agent} className="glass-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span className="agent-active" style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent-cyan)", display: "inline-block" }} />
            <span style={{ fontWeight: 600 }}>{agent}</span>
          </div>
        ))}
      </div>

      <div className="agent-log" style={{ height: "60vh", overflowY: "auto", fontSize: 13, background: "#020617" }}>
        {events.length === 0 ? (
          <div style={{ color: "#475569" }}>$ Waiting for agent events from LangGraph...</div>
        ) : events.map((ev, i) => (
          <div key={i} style={{ marginBottom: 8, borderBottom: "1px solid rgba(34,197,94,0.1)", paddingBottom: 8 }}>
            <span style={{ color: "#64748b" }}>$ [{new Date().toLocaleTimeString()}] </span>
            <span style={{ color: "#06b6d4", fontWeight: "bold" }}>[{ev.agent}] </span>
            <span style={{ color: "#22c55e" }}>Animal {ev.animal_id} </span>
            <span style={{ color: "white" }}>{ev.message || `Processed node with status: ${ev.status}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
