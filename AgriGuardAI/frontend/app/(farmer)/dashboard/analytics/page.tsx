"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const RISK_COLORS: Record<string, string> = {
  low: "#22c55e", medium: "#f59e0b", high: "#f97316", critical: "#ef4444", unknown: "#64748b"
};

export default function AnalyticsPage() {
  const [herd, setHerd] = useState<any>(null);
  const [predSummary, setPredSummary] = useState<any>(null);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/analytics/herd-health`, { headers: h }).then(r => r.json()),
      fetch(`${API}/analytics/predictions/summary?days=7`, { headers: h }).then(r => r.json()),
      fetch(`${API}/animals`, { headers: h }).then(r => r.json()),
    ]).then(([herd, pred, an]) => {
      setHerd(herd);
      setPredSummary(pred);
      setAnimals(an || []);
      if (an?.[0]) { setSelectedAnimalId(an[0].id); }
    });
  }, [token]);

  useEffect(() => {
    if (!selectedAnimalId || !token) return;
    fetch(`${API}/analytics/trend/${selectedAnimalId}?hours=24`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setTrend(d.data || []));
  }, [selectedAnimalId, token]);

  const riskPieData = Object.entries(herd?.risk_distribution || {}).map(([k, v]) => ({
    name: k, value: v as number, color: RISK_COLORS[k]
  }));

  const predBarData = Object.entries(predSummary?.by_type || {}).map(([k, v]) => ({
    name: k.replace(/_/g, " "), count: v as number
  }));

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>📊 Herd Analytics</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>AI-generated health insights across your entire farm</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Risk distribution pie */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Herd Risk Distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {riskPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Disease predictions bar */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Disease Predictions (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={predBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0" }} />
              <Bar dataKey="count" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Health trend */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>24-Hour Health Trend</h2>
          <select
            value={selectedAnimalId || ""}
            onChange={e => setSelectedAnimalId(Number(e.target.value))}
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: 8, padding: "6px 12px", fontSize: 13 }}
          >
            {animals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.animal_type})</option>)}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trend.map(d => ({ ...d, time: new Date(d.timestamp).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 11 }} />
            <YAxis yAxisId="score" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
            <YAxis yAxisId="temp" orientation="right" domain={[36, 43]} tick={{ fill: "#64748b", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0" }} />
            <Legend />
            <Line yAxisId="score" type="monotone" dataKey="health_score" stroke="#22c55e" strokeWidth={2} dot={false} name="Health Score" />
            <Line yAxisId="temp" type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={false} name="Temp (°C)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
