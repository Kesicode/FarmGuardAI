"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Login failed"); }
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-primary)" }}>
      {/* Left panel */}
      <div style={{ width: "45%", background: "linear-gradient(135deg, #080d1a 0%, #0a1628 100%)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "center", padding: 64, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "-30%", width: 400, height: 400, borderRadius: "50%", background: "rgba(0,212,255,0.04)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "-20%", width: 300, height: 300, borderRadius: "50%", background: "rgba(168,85,247,0.04)", filter: "blur(60px)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>🌾</div>
          <h1 className="gradient-text" style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>AgriGuard<br />AI Agent Network</h1>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: 15 }}>
            7 autonomous AI agents monitoring your livestock health — 24/7, no human intervention required.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 40 }}>
            {["Sensor Intelligence Agent", "Health Assessment Agent", "Disease Prediction Agent"].map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-secondary)", fontSize: 13 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-cyan)", animation: `agent-pulse ${1.5 + i * 0.3}s ease-in-out infinite` }} />
                {a}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Welcome back</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Sign in to your AgriGuard dashboard</p>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#ef4444", fontSize: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Email</label>
              <input
                type="email" required placeholder="farmer@agriguard.ai"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", color: "var(--text-primary)", fontSize: 14, outline: "none" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Password</label>
              <input
                type="password" required placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", color: "var(--text-primary)", fontSize: 14, outline: "none" }}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "13px", fontSize: 15, marginTop: 8, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, color: "var(--text-secondary)", fontSize: 14 }}>
            No account?{" "}
            <Link href="/register" style={{ color: "var(--accent-cyan)", textDecoration: "none" }}>Create one free</Link>
          </p>

          {/* Demo credentials hint */}
          <div style={{ marginTop: 32, padding: 16, background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.1)", borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Demo credentials:</p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>admin@agriguard.ai / admin123</p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>farmer@agriguard.ai / farmer123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
