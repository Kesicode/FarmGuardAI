"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterAnimal() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", animal_type: "cow", breed: "", age_months: "", device_serial: "" });
  const [loading, setLoading] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      // Register device
      const dres = await fetch(`${API}/devices`, { method: "POST", headers: h, body: JSON.stringify({ device_serial: form.device_serial }) });
      const device = await dres.json();

      // Register animal
      const ares = await fetch(`${API}/animals`, { method: "POST", headers: h, body: JSON.stringify({ name: form.name, animal_type: form.animal_type, breed: form.breed, age_months: parseInt(form.age_months) || 0 }) });
      const animal = await ares.json();

      // Link them
      await fetch(`${API}/devices/${device.id}/link`, { method: "POST", headers: h, body: JSON.stringify({ animal_id: animal.id }) });
      router.push(`/dashboard/animals/${animal.id}`);
    } catch (err) {
      alert("Error registering animal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 600 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Register New Animal</h1>
      <form onSubmit={submit} className="glass-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Name / Identifier</label>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "white", outline: "none" }} />
        </div>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Animal Type</label>
          <select value={form.animal_type} onChange={e => setForm(f => ({ ...f, animal_type: e.target.value }))} style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "white", outline: "none" }}>
            <option value="cow">Cow 🐄</option><option value="chicken">Chicken 🐔</option><option value="goat">Goat 🐐</option><option value="pig">Pig 🐷</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Device Serial (ESP32 Collar ID)</label>
          <input required value={form.device_serial} onChange={e => setForm(f => ({ ...f, device_serial: e.target.value }))} style={{ width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "white", outline: "none" }} />
        </div>
        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 12 }}>{loading ? "Registering..." : "Register + Link Collar"}</button>
      </form>
    </div>
  );
}
