"use client";
import { useState, useEffect, use } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WS_API = API.replace("http", "ws");

function RiskBadge({ level }: { level: string }) {
  return <span className={`badge-${level || "low"}`} style={{ borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{level?.toUpperCase()}</span>;
}

function MetricCard({ label, value, unit, icon, critical }: any) {
  return (
    <div className="metric-tile" style={{ borderColor: critical ? "rgba(239,68,68,0.3)" : "var(--border)" }}>
      <div style={{ display: "flex", justify: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: critical ? "var(--accent-red)" : "var(--accent-cyan)", marginTop: 4 }}>{value ?? "—"}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{unit}</div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.7 }}>{icon}</div>
      </div>
    </div>
  );
}

function HealthRing({ score }: { score: number }) {
  const r = 45;
  const circ = 2 * Math.PI * r;
  const filled = circ * (score / 100);
  const color = score >= 75 ? "#22c55e" : score >= 55 ? "#f59e0b" : score >= 35 ? "#f97316" : "#ef4444";
  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <svg width={140} height={140} viewBox="0 0 120 120">
        <circle cx={60} cy={60} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
        <circle cx={60} cy={60} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 60 60)" style={{ transition: "stroke-dasharray 1s ease" }} />
        <text x={60} y={55} textAnchor="middle" fill={color} fontSize={22} fontWeight={800}>{score?.toFixed(0)}</text>
        <text x={60} y={72} textAnchor="middle" fill="#64748b" fontSize={10}>Health Score</text>
      </svg>
    </div>
  );
}

export default function AnimalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const animalId = parseInt(unwrappedParams.id);
  const [animal, setAnimal] = useState<any>(null);
  const [latestReading, setLatestReading] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [liveReadings, setLiveReadings] = useState<any[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const fetchAll = async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [a, h, p, r, logs] = await Promise.all([
        fetch(`${API}/animals/${animalId}`, { headers }).then(r => r.json()),
        fetch(`${API}/health/${animalId}?limit=1`, { headers }).then(r => r.json()),
        fetch(`${API}/predictions/${animalId}?limit=5`, { headers }).then(r => r.json()),
        fetch(`${API}/recommendations/${animalId}?limit=5`, { headers }).then(r => r.json()),
        fetch(`${API}/admin/logs?animal_id=${animalId}&limit=10`, { headers }).then(r => r.json()),
      ]);
      setAnimal(a);
      if (h?.[0]) setLatestReading(h[0]);
      setPredictions(Array.isArray(p) ? p : []);
      setRecommendations(Array.isArray(r) ? r : []);
      setAgentLogs(Array.isArray(logs) ? logs : []);
    } catch {}
  };

  useEffect(() => { fetchAll(); }, [animalId]);

  // WebSocket live readings
  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`${WS_API}/ws/health/${animalId}?token=${token}`);
    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === "health_reading") {
          setLatestReading(d);
          setLiveReadings(prev => [d, ...prev.slice(0, 19)]);
        }
      } catch {}
    };
    return () => ws.close();
  }, [animalId, token]);

  if (!animal) return (
    <div style={{ padding: 40 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
      </div>
    </div>
  );

  const animal_icon = animal.animal_type === "cow" ? "🐄" : animal.animal_type === "chicken" ? "🐔" : animal.animal_type === "goat" ? "🐐" : "🐾";

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400 }}>
      {/* Animal header */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 28, display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(6,182,212,0.1))", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
          {animal_icon}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>{animal.name}</h1>
          <div style={{ display: "flex", gap: 12, marginTop: 6, color: "var(--text-secondary)", fontSize: 13 }}>
            <span>🐄 {animal.animal_type}</span>
            {animal.breed && <span>• {animal.breed}</span>}
            {animal.tag_number && <span>• Tag #{animal.tag_number}</span>}
            {animal.age_months && <span>• {Math.floor(animal.age_months / 12)}y {animal.age_months % 12}m</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <HealthRing score={animal.health_score || 0} />
          <RiskBadge level={animal.risk_level} />
        </div>
      </div>

      {/* Live metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        <MetricCard label="Temperature" value={latestReading?.temperature?.toFixed(1)} unit="°C" icon="🌡️" critical={latestReading?.temperature > 41} />
        <MetricCard label="Heart Rate" value={latestReading?.heart_rate?.toFixed(0)} unit="bpm" icon="❤️" critical={latestReading?.heart_rate > 120} />
        <MetricCard label="SpO2*" value={latestReading?.spo2?.toFixed(1)} unit="% (unvalidated)" icon="💨" />
        <MetricCard label="Activity" value={latestReading?.activity_classification} unit={latestReading?.health_alert_class} icon="🏃" critical={latestReading?.health_alert_class === "HeatStress"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Predictions */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>🔮 AI Disease Predictions</h2>
          {predictions.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No predictions yet — run simulator to generate</div>
          ) : predictions.map((p, i) => (
            <div key={i} style={{ marginBottom: 16, padding: 14, background: "rgba(0,212,255,0.04)", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14, textTransform: "capitalize" }}>{p.prediction_type?.replace(/_/g, " ")}</span>
                <span style={{ fontSize: 13, color: p.confidence > 0.7 ? "var(--accent-red)" : "var(--accent-amber)" }}>{(p.confidence * 100).toFixed(0)}%</span>
              </div>
              {/* Confidence bar */}
              <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginBottom: 8 }}>
                <div style={{ height: "100%", width: `${p.confidence * 100}%`, background: p.confidence > 0.7 ? "var(--accent-red)" : "var(--accent-amber)", borderRadius: 2, transition: "width 1s ease" }} />
              </div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{p.reasoning}</p>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{new Date(p.predicted_at).toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>📋 Agent Recommendations</h2>
          {recommendations.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No recommendations yet</div>
          ) : recommendations.map((r, i) => (
            <div key={i} style={{ marginBottom: 12, padding: 14, background: r.priority === "urgent" ? "rgba(239,68,68,0.05)" : "rgba(0,212,255,0.03)", borderRadius: 10, border: `1px solid ${r.priority === "urgent" ? "rgba(239,68,68,0.2)" : "var(--border)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span className={`badge-${r.priority === "urgent" ? "critical" : r.priority === "high" ? "high" : "medium"}`} style={{ borderRadius: 6, padding: "2px 8px", fontSize: 10 }}>
                  {r.priority?.toUpperCase()}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>{r.action_type}</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.5 }}>{r.recommendation_text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Agent execution log */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🤖 Agent Execution Log</h2>
        <div className="agent-log" style={{ maxHeight: 240, overflowY: "auto" }}>
          {agentLogs.length === 0 ? (
            <div style={{ color: "#475569" }}>$ No agent logs yet. Submit sensor data to trigger the pipeline.</div>
          ) : agentLogs.map((log, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <span style={{ color: "#64748b" }}>$ [{log.created_at ? new Date(log.created_at).toLocaleTimeString() : "??:??"}] </span>
              <span style={{ color: "#06b6d4" }}>[{log.agent_name}]</span>
              <span style={{ color: "#22c55e" }}> {log.reasoning?.slice(0, 120)}</span>
              {log.execution_ms && <span style={{ color: "#475569" }}> ({log.execution_ms}ms)</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
