"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Leaflet only renders client-side
const MapWithNoSSR = dynamic(() => import("@/components/map/AnimalMap"), { ssr: false });

export default function MapPage() {
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/animals?with_location=true`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setAnimals(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", padding: "28px 32px 0" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>🗺️ Live Animal Map</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 2 }}>GPS positions updated every 30 seconds</p>
      </div>
      {loading ? (
        <div className="skeleton" style={{ flex: 1, borderRadius: 16, marginBottom: 32 }} />
      ) : (
        <div style={{ flex: 1, borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", marginBottom: 32 }}>
          <MapWithNoSSR animals={animals} />
        </div>
      )}
    </div>
  );
}
