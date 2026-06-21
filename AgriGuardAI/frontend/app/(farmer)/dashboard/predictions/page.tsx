"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function PredictionsPage() {
  const [animals, setAnimals] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/animals`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setAnimals(d); if (d?.[0]) setSelectedAnimalId(d[0].id); });
  }, [token]);

  useEffect(() => {
    if (!token || !selectedAnimalId) return;
    fetch(`${API}/predictions/${selectedAnimalId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setPredictions(d));
  }, [selectedAnimalId, token]);

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1000 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>AI Disease Predictions</h1>
      
      <div style={{ marginBottom: 24 }}>
        <select value={selectedAnimalId || ""} onChange={e => setSelectedAnimalId(Number(e.target.value))} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "white", borderRadius: 8, padding: "10px 16px", fontSize: 14 }}>
          {animals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.animal_type})</option>)}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {predictions.length === 0 && <div className="glass-card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No predictions for this animal.</div>}
        {predictions.map(p => (
          <div key={p.id} className="glass-card" style={{ padding: 24, borderLeft: `4px solid ${p.confidence > 0.7 ? "#ef4444" : "#f59e0b"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 600, textTransform: "capitalize" }}>{p.prediction_type.replace(/_/g, " ")}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: p.confidence > 0.7 ? "var(--accent-red)" : "var(--accent-amber)" }}>{(p.confidence * 100).toFixed(0)}% Confidence</div>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{p.reasoning}</p>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Predicted at: {new Date(p.predicted_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
