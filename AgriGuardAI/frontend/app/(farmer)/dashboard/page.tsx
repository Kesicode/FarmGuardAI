"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function useAuth() {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  return { token, user };
}

async function apiFetch(path: string, token: string) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

function StatCard({ label, value, icon, color, sub }: any) {
  return (
    <div className="glass-card" style={{ padding: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, color }}>{value ?? "—"}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 28, opacity: 0.7 }}>{icon}</div>
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  return (
    <span className={`badge-${level}`} style={{ borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
      {level?.toUpperCase() || "?"}
    </span>
  );
}

export default function FarmerDashboard() {
  const { token, user } = useAuth();
  const [herd, setHerd] = useState<any>(null);
  const [animals, setAnimals] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentEvents, setAgentEvents] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [h, al] = await Promise.all([
        apiFetch("/analytics/herd-health", token),
        apiFetch("/alerts?limit=5&is_resolved=false", token),
      ]);
      setHerd(h);
      setAnimals(h.animals_at_risk || []);
      setAlerts(al || []);
    } catch (e) {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // WebSocket — agent events + alerts
  useEffect(() => {
    if (!token || !user) return;
    const ws = new WebSocket(`${API.replace("http", "ws")}/ws/agents?token=${token}`);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "agent_event") {
          setAgentEvents(prev => [`[${new Date().toLocaleTimeString()}] ${data.agent}: ${data.message || data.animal_name}`, ...prev.slice(0, 9)]);
        }
      } catch {}
    };
    return () => ws.close();
  }, [token, user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <div className="skeleton" style={{ height: 40, width: 300, marginBottom: 32 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>{greeting}, {user?.full_name?.split(" ")[0] || "Farmer"} 👋</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>Your herd is being monitored by 7 AI agents</p>
        </div>
        <Link href="/dashboard/animals/register" className="btn-primary" style={{ textDecoration: "none", padding: "10px 20px" }}>
          + Register Animal
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        <StatCard label="Total Animals" value={herd?.total_animals ?? 0} icon="🐄" color="var(--accent-cyan)" />
        <StatCard label="Avg Health Score" value={herd?.avg_health_score ? `${herd.avg_health_score}` : "—"} icon="❤️" color="var(--accent-green)" sub="out of 100" />
        <StatCard label="Open Alerts" value={alerts.length} icon="🔔" color="var(--accent-amber)" />
        <StatCard label="At Risk" value={(herd?.risk_distribution?.high || 0) + (herd?.risk_distribution?.critical || 0)} icon="⚠️" color="var(--accent-red)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
        {/* Animals at risk */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Animals Requiring Attention</h2>
          {animals.length === 0 ? (
            <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ color: "var(--text-secondary)" }}>All animals are in the low-risk zone</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {animals.map((a: any) => (
                <Link key={a.id} href={`/dashboard/animals/${a.id}`} style={{ textDecoration: "none" }}>
                  <div className="glass-card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                      {a.animal_type === "cow" ? "🐄" : a.animal_type === "chicken" ? "🐔" : a.animal_type === "goat" ? "🐐" : "🐾"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "capitalize" }}>{a.animal_type}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: a.health_score < 50 ? "var(--accent-red)" : "var(--accent-amber)" }}>
                        {a.health_score?.toFixed(0) ?? "—"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>health score</div>
                    </div>
                    <RiskBadge level={a.risk_level} />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Recent alerts */}
          {alerts.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Recent Alerts</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {alerts.map((al: any) => (
                  <div key={al.id} className="glass-card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center", borderColor: al.severity === "critical" ? "rgba(239,68,68,0.3)" : "var(--border)" }}>
                    <div style={{ fontSize: 18 }}>{al.severity === "critical" ? "🚨" : "⚠️"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{al.message}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{new Date(al.created_at).toLocaleString()}</div>
                    </div>
                    <span className={`badge-${al.severity === "critical" ? "critical" : "medium"}`} style={{ borderRadius: 6, padding: "2px 10px", fontSize: 11 }}>
                      {al.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Agent Activity Log */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="agent-active" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-cyan)", display: "inline-block" }} />
              Live Agent Activity
            </span>
          </h2>
          <div className="agent-log" style={{ height: 400, overflowY: "auto" }}>
            {agentEvents.length === 0 ? (
              <div style={{ color: "var(--text-muted)" }}>$ Waiting for agent events...<br />$ Run simulator to see live activity</div>
            ) : agentEvents.map((e, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                <span style={{ color: "#64748b" }}>$ </span>{e}
              </div>
            ))}
          </div>

          {/* Risk distribution */}
          <div style={{ marginTop: 16 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Herd Risk Distribution</div>
              {Object.entries(herd?.risk_distribution || {}).map(([k, v]: any) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <RiskBadge level={k} />
                  <div style={{ fontSize: 18, fontWeight: 700, color: k === "critical" ? "var(--accent-red)" : k === "high" ? "#f97316" : "var(--text-primary)" }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
