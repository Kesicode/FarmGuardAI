"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-primary)", overflow: "hidden", position: "relative" }}>
      
      {/* Background ambient glow */}
      <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: "80vw", height: "80vh", background: "radial-gradient(ellipse at top, rgba(0,212,255,0.15) 0%, transparent 60%)", zIndex: 0, pointerEvents: "none" }}></div>

      {/* Header */}
      <header style={{ padding: "24px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #a855f7, #00d4ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌾</div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }} className="gradient-text">AgriGuard AI</span>
        </div>
        <nav style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link href="/login" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: 14, fontWeight: 500, transition: "color 0.2s" }} onMouseOver={e => e.currentTarget.style.color = "white"} onMouseOut={e => e.currentTarget.style.color = "var(--text-secondary)"}>Sign In</Link>
          <Link href="/register" className="btn-primary" style={{ textDecoration: "none", padding: "10px 20px" }}>Get Started →</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "64px 24px", zIndex: 1 }}>
        
        <div style={{ display: "inline-block", background: "rgba(0, 212, 255, 0.1)", border: "1px solid rgba(0, 212, 255, 0.2)", color: "var(--accent-cyan)", padding: "6px 16px", borderRadius: 100, fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
          🚀 The Future of Smart Farming is Here
        </div>

        <h1 style={{ fontSize: "clamp(48px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 24, maxWidth: 900 }}>
          Autonomous Multi-Agent <br/>
          <span className="gradient-text">Livestock Intelligence</span>
        </h1>
        
        <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "var(--text-secondary)", maxWidth: 700, lineHeight: 1.6, marginBottom: 48 }}>
          Transform your farm with real-time IoT wearables, LangGraph agent networks, and predictive health AI. Detect diseases before they happen.
        </p>

        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/register" className="btn-primary" style={{ padding: "16px 32px", fontSize: 16, textDecoration: "none" }}>Launch Platform</Link>
          <a href="#features" style={{ padding: "16px 32px", fontSize: 16, textDecoration: "none", color: "white", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontWeight: 600, transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"} onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>Learn More</a>
        </div>

        {/* Feature Grid */}
        <div id="features" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginTop: 80, width: "100%", maxWidth: 1200 }}>
          
          <div className="glass-card" style={{ padding: 32, textAlign: "left", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>📡</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "white" }}>Real-Time IoT Ingestion</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6 }}>Event-driven architecture processes telemetry from ESP32 collars instantly via Redis Pub/Sub.</p>
          </div>

          <div className="glass-card" style={{ padding: 32, textAlign: "left", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🧠</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "white" }}>LangGraph Agent Network</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6 }}>7 interconnected AI agents dynamically assess health, predict diseases, and trigger autonomous alerts.</p>
          </div>

          <div className="glass-card" style={{ padding: 32, textAlign: "left", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>💬</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "white" }}>Conversational RAG AI</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6 }}>Chat with your herd data. The system embeds agent summaries into a pgvector database for semantic querying.</p>
          </div>

        </div>

      </main>

    </div>
  );
}
