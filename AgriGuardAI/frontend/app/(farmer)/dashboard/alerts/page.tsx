"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/alerts?limit=50&is_resolved=false`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setAlerts(d));
  }, [token]);

  const resolveAlert = async (id: number) => {
    if (!token) return;
    await fetch(`${API}/alerts/${id}/resolve`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1000 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Active Alerts</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {alerts.length === 0 && <div className="glass-card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No active alerts. All clear! ✅</div>}
        {alerts.map(a => (
          <div key={a.id} className="glass-card" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `4px solid ${a.severity === "critical" ? "#ef4444" : "#f59e0b"}` }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <span className={`badge-${a.severity === "critical" ? "critical" : "medium"}`} style={{ borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>{a.severity.toUpperCase()}</span>
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{new Date(a.created_at).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{a.message}</div>
            </div>
            <button onClick={() => resolveAlert(a.id)} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px", color: "var(--text-secondary)", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={e => (e.currentTarget.style.background = "rgba(0,212,255,0.1)")} onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
              Resolve
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
