"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); });
  }, [token]);

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>System Overview</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: "var(--accent-cyan)" }}>{stats.users ?? "—"}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Registered Farmers</div>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: "var(--accent-green)" }}>{stats.animals ?? "—"}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Animals Monitored</div>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: "var(--accent-amber)" }}>{stats.devices ?? "—"}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Active Devices</div>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: "var(--accent-purple)" }}>{stats.readings ?? "—"}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Total Ingested Readings</div>
        </div>
      </div>
    </div>
  );
}
