"use client";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";

// Fix default marker icons in Next.js
const createIcon = (color: string, emoji: string) =>
  L.divIcon({
    html: `<div style="font-size:24px;text-align:center;line-height:32px;width:32px;height:32px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.3);box-shadow:0 0 12px ${color}">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    className: "",
  });

const RISK_COLORS: Record<string, string> = {
  low: "rgba(34,197,94,0.8)",
  medium: "rgba(245,158,11,0.8)",
  high: "rgba(249,115,22,0.8)",
  critical: "rgba(239,68,68,0.9)",
  unknown: "rgba(100,116,139,0.8)",
};

const ANIMAL_EMOJIS: Record<string, string> = {
  cow: "🐄", chicken: "🐔", goat: "🐐", pig: "🐷", dog: "🐕"
};

export default function AnimalMap({ animals }: { animals: any[] }) {
  const center: [number, number] = [12.9716, 77.5946]; // Default: Bangalore

  if (!animals || animals.length === 0) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d1526", color: "#64748b" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
          <div>No animals with GPS data found</div>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: "100%", width: "100%", background: "#0d1526" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {animals.map((animal) => {
        if (!animal.device?.lat || !animal.device?.lng) return null;
        const pos: [number, number] = [animal.device.lat, animal.device.lng];
        const color = RISK_COLORS[animal.risk_level || "unknown"];
        const emoji = ANIMAL_EMOJIS[animal.animal_type] || "🐾";
        const icon = createIcon(color, emoji);
        return (
          <div key={animal.id}>
            {animal.geofence_lat && (
              <Circle
                center={[animal.geofence_lat, animal.geofence_lng]}
                radius={animal.geofence_radius_m || 500}
                pathOptions={{ color: "rgba(0,212,255,0.4)", fillColor: "rgba(0,212,255,0.05)", fillOpacity: 1 }}
              />
            )}
            <Marker position={pos} icon={icon}>
              <Popup>
                <div style={{ color: "#0f172a", minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{animal.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{animal.animal_type}</div>
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    Health Score: <strong>{animal.health_score?.toFixed(0) ?? "N/A"}</strong>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Risk: <strong style={{ color: animal.risk_level === "critical" ? "#ef4444" : "#f59e0b" }}>
                      {animal.risk_level?.toUpperCase()}
                    </strong>
                  </div>
                </div>
              </Popup>
            </Marker>
          </div>
        );
      })}
    </MapContainer>
  );
}
