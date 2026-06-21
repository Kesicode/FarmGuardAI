"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STATS = [
  { label: "Animals Monitored", value: "10K+", suffix: "live" },
  { label: "Alerts Prevented", value: "98%", suffix: "accuracy" },
  { label: "Agent Decisions", value: "2M+", suffix: "daily" },
  { label: "Farms Protected", value: "500+", suffix: "globally" },
];

const FEATURES = [
  { icon: "🧠", title: "7 AI Agents", desc: "Autonomous multi-agent pipeline: observe, reason, predict, plan, act — no human intervention required." },
  { icon: "📡", title: "Real-Time IoT", desc: "ESP32 collar with MLX90614, MAX30102, MPU6050, Neo-6M GPS streams live data every 30 seconds." },
  { icon: "🔮", title: "Predictive Health", desc: "Gemini-powered disease prediction with confidence scores: heat stress, infection, digestive disorders." },
  { icon: "⚡", title: "Instant Alerts", desc: "Sub-5-second alert delivery via WebSocket, email. Critical vitals trigger fast-path bypass." },
  { icon: "🗺️", title: "GPS Tracking", desc: "Live animal positions, geofencing, missing animal detection, grazing pattern heatmaps." },
  { icon: "💬", title: "AI Chat (RAG)", desc: "Ask anything: health status, activity reports, risk animals, prediction explanations." },
];

export default function LandingPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Animated grid background */}
      <div style={{
        position: "fixed", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(var(--accent-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--accent-cyan) 1px, transparent 1px)",
        backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 0,
      }} />

      {/* Navbar */}
      <nav style={{ position: "relative", zIndex: 10, borderBottom: "1px solid var(--border)", padding: "16px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #00d4ff, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌾</div>
          <span style={{ fontSize: 20, fontWeight: 700 }} className="gradient-text">AgriGuard AI</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/login" style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--border)", color: "var(--text-secondary)", textDecoration: "none", transition: "all 0.2s" }}>Sign In</Link>
          <Link href="/register" className="btn-primary" style={{ padding: "8px 20px", borderRadius: 8, textDecoration: "none" }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "120px 48px 80px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", borderRadius: 20, padding: "6px 16px", marginBottom: 32, fontSize: 13, color: "var(--accent-cyan)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-cyan)", display: "inline-block", animation: "agent-pulse 1.5s ease-in-out infinite" }} />
          7-Agent AI Network • Live
        </div>

        <h1 style={{ fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
          <span className="gradient-text">Autonomous AI</span>
          <br />
          <span style={{ color: "var(--text-primary)" }}>Livestock Health Network</span>
        </h1>

        <p style={{ fontSize: 18, color: "var(--text-secondary)", maxWidth: 600, margin: "0 auto 48px", lineHeight: 1.7 }}>
          Multi-agent AI that observes, reasons, predicts, plans and acts on your livestock health data — autonomously, 24/7.
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/register" className="btn-primary" style={{ padding: "14px 32px", fontSize: 16, borderRadius: 10, textDecoration: "none" }}>
            Start Monitoring Free →
          </Link>
          <Link href="/login" style={{ padding: "14px 32px", fontSize: 16, borderRadius: 10, border: "1px solid var(--border)", color: "var(--text-primary)", textDecoration: "none" }}>
            View Dashboard Demo
          </Link>
        </div>

        {/* Live stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, maxWidth: 800, margin: "80px auto 0" }}>
          {STATS.map((s, i) => (
            <div key={i} className="glass-card" style={{ padding: "24px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--accent-cyan)" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--accent-cyan)", opacity: 0.7 }}>{s.suffix}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Agent Pipeline visualization */}
      <section style={{ padding: "80px 48px", position: "relative", zIndex: 1 }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 700, marginBottom: 12 }}>The 7-Agent Pipeline</h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: 48 }}>Every sensor reading passes through autonomous AI agents — no human needed</p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, overflowX: "auto", padding: "0 24px" }}>
          {["Sensor\nIntel", "Behavioral\nAnalysis", "Health\nAssess", "Disease\nPredict", "Recom-\nmendation", "Alert &\nNotify", "Conver-\nsational"].map((name, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div className="glass-card" style={{
                padding: "16px 20px", textAlign: "center", minWidth: 100,
                borderColor: tick % 7 === i ? "var(--accent-cyan)" : "var(--border)",
                boxShadow: tick % 7 === i ? "var(--glow-cyan)" : "none",
                transition: "all 0.5s",
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>
                  {["📡", "🐄", "❤️", "🔮", "📋", "🔔", "💬"][i]}
                </div>
                <div style={{ fontSize: 11, color: tick % 7 === i ? "var(--accent-cyan)" : "var(--text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.3 }}>
                  {name}
                </div>
                {tick % 7 === i && (
                  <div className="agent-active" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-cyan)", margin: "8px auto 0" }} />
                )}
              </div>
              {i < 6 && <div style={{ color: "var(--accent-cyan)", padding: "0 4px", opacity: 0.5 }}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "40px 48px 80px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, maxWidth: 1100, margin: "0 auto" }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="glass-card" style={{ padding: 28 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text-primary)" }}>{f.title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>© 2026 AgriGuard AI Agent Network</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "agent-pulse 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>All agents operational</span>
        </div>
      </footer>
    </div>
  );
}
