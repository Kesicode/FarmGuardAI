"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/dashboard", icon: "🏠", label: "Dashboard" },
  { href: "/dashboard/animals", icon: "🐄", label: "Animals" },
  { href: "/dashboard/map", icon: "🗺️", label: "Live Map" },
  { href: "/dashboard/analytics", icon: "📊", label: "Analytics" },
  { href: "/dashboard/predictions", icon: "🔮", label: "Predictions" },
  { href: "/dashboard/alerts", icon: "🔔", label: "Alerts" },
  { href: "/dashboard/chat", icon: "💬", label: "AI Assistant" },
];

export default function FarmerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) router.push("/login");
    else setUser(JSON.parse(localStorage.getItem("user") || "null"));
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
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #00d4ff, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌾</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }} className="gradient-text">AgriGuard AI</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>7 Agents Active</div>
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
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #a855f7, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                {user.full_name?.[0] || "?"}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{user.full_name}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "capitalize" }}>{user.role}</div>
              </div>
            </div>
          )}
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
