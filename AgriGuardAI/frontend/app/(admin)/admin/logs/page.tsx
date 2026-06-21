"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/admin/logs?limit=100`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setLogs(d));
  }, [token]);

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1400 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>System Execution Logs</h1>
      
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Agent</th>
              <th>Animal ID</th>
              <th>Reasoning / Output</th>
              <th>Execution Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l: any) => (
              <tr key={l.id}>
                <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{new Date(l.created_at).toLocaleString()}</td>
                <td style={{ fontWeight: 600, color: "var(--accent-cyan)" }}>{l.agent_name}</td>
                <td>{l.animal_id}</td>
                <td style={{ fontSize: 13, lineHeight: 1.5 }}>{l.reasoning.length > 100 ? `${l.reasoning.slice(0, 100)}...` : l.reasoning}</td>
                <td style={{ color: "var(--text-secondary)" }}>{l.execution_ms ? `${l.execution_ms}ms` : "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>No logs available.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
