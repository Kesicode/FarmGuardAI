"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/admin", icon: "⚙️", label: "System Overview" },
  { href: "/admin/agents", icon: "🤖", label: "Agent Pipeline" },
  { href: "/admin/logs", icon: "📜", label: "Execution Logs" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const u = JSON.parse(localStorage.getItem("user") || "null");
    if (!token || u?.role !== "admin") router.push("/login");
    else setUser(u);
  }, [router]);

  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };


  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #a855f7, #00d4ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }} className="gradient-text">AgriGuard Admin</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Command Center</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "16px 0" }}>
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href} className={`nav-item ${active ? "active" : ""}`}>
                <span style={{ fontSize: 17 }}>{n.icon}</span>
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div style={{ padding: 16, borderTop: "1px solid var(--border)" }}>
          <button onClick={logout} style={{ width: "100%", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, padding: "8px", color: "var(--text-muted)", cursor: "pointer", fontSize: 12, transition: "all 0.2s" }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto", background: "var(--bg-primary)" }}>
        {children}
      </main>
    </div>
  );
}
