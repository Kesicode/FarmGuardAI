"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function RiskBadge({ level }: { level: string }) {
  return <span className={`badge-${level}`} style={{ borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{level?.toUpperCase() || "?"}</span>;
}

export default function AnimalsList() {
  const [animals, setAnimals] = useState<any[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/animals`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setAnimals(d));
  }, [token]);

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>My Herd</h1>
        <Link href="/dashboard/animals/register" className="btn-primary" style={{ textDecoration: "none", padding: "10px 20px" }}>+ Add Animal</Link>
      </div>

      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Animal</th>
              <th>Type</th>
              <th>Health Score</th>
              <th>Risk Level</th>
              <th>Last Update</th>
            </tr>
          </thead>
          <tbody>
            {animals.map((a: any) => (
              <tr key={a.id}>
                <td><Link href={`/dashboard/animals/${a.id}`} style={{ color: "var(--accent-cyan)", textDecoration: "none", fontWeight: 600 }}>{a.name}</Link></td>
                <td style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>{a.animal_type}</td>
                <td><span style={{ color: a.health_score < 50 ? "var(--accent-red)" : "var(--accent-green)", fontWeight: 700 }}>{a.health_score?.toFixed(0) ?? "—"}</span></td>
                <td><RiskBadge level={a.risk_level} /></td>
                <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{a.last_health_update ? new Date(a.last_health_update).toLocaleString() : "Never"}</td>
              </tr>
            ))}
            {animals.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>No animals registered yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
