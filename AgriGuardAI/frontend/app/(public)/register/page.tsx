"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", full_name: "", farm_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Registration failed"); }
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
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
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>🌾</div>
          <h1 className="gradient-text" style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>Join the future of<br />smart farming</h1>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: 15 }}>
            Create an account to start monitoring your livestock with the AgriGuard AI Agent Network.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 48 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Create Account</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>Get started free. No credit card required.</p>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#ef4444", fontSize: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Full Name</label>
              <input type="text" required placeholder="John Doe" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", color: "var(--text-primary)", fontSize: 14, outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Farm Name</label>
              <input type="text" required placeholder="Valley View Farms" value={form.farm_name} onChange={e => setForm(f => ({ ...f, farm_name: e.target.value }))} style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", color: "var(--text-primary)", fontSize: 14, outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Email</label>
              <input type="email" required placeholder="farmer@agriguard.ai" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", color: "var(--text-primary)", fontSize: 14, outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Password</label>
              <input type="password" required placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", color: "var(--text-primary)", fontSize: 14, outline: "none" }} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", padding: "13px", fontSize: 15, marginTop: 8, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating account..." : "Sign Up →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, color: "var(--text-secondary)", fontSize: 14 }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--accent-cyan)", textDecoration: "none" }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
