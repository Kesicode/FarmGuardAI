"""Simulator — scenario-based deterioration scripts for demo."""
import asyncio
import random
import sys
import httpx

BASE_URL = "http://localhost:8000"

SCENARIOS = {
    "heat_stress": [
        # (temp, hr, activity_class, health_alert_class, lat, lng)
        (38.5, 65, "Rumination",     "Normal",         12.9716, 77.5946),
        (39.1, 70, "Walking",        "Normal",         12.9718, 77.5948),
        (39.8, 78, "RandomActivity", "Stress",         12.9720, 77.5950),
        (40.3, 85, "RandomActivity", "HeatStress",     12.9722, 77.5952),
        (40.8, 92, "Resting",        "HeatStress",     12.9720, 77.5950),
        (41.2, 98, "Resting",        "HeatStress",     12.9720, 77.5950),
    ],
    "digestive_issue": [
        (38.9, 68, "Rumination",     "Normal",         12.9716, 77.5946),
        (39.0, 72, "Resting",        "Normal",         12.9716, 77.5946),
        (39.2, 75, "Resting",        "DigestiveIssue", 12.9716, 77.5946),
        (39.5, 80, "Resting",        "DigestiveIssue", 12.9716, 77.5946),
        (39.8, 85, "Resting",        "InfectionRisk",  12.9716, 77.5946),
    ],
    "infection": [
        (38.7, 70, "Walking",        "Normal",         12.9716, 77.5946),
        (39.3, 80, "Resting",        "Stress",         12.9716, 77.5946),
        (39.9, 88, "Resting",        "InfectionRisk",  12.9714, 77.5944),
        (40.4, 95, "Resting",        "InfectionRisk",  12.9714, 77.5944),
        (41.0, 102,"Resting",        "InfectionRisk",  12.9714, 77.5944),
    ],
    "normal_day": [
        (round(38.5 + random.uniform(-0.3, 0.4), 1),
         random.randint(55, 75),
         random.choice(["Rumination", "Walking", "Resting"]),
         "Normal",
         12.9716 + i * 0.0001,
         77.5946 + i * 0.0001)
        for i in range(8)
    ],
}


async def run_scenario(
    animal_id: int,
    scenario_name: str = "heat_stress",
    speed_factor: float = 60.0,
):
    """
    Run a scenario. speed_factor=60 means 30min steps play in 30sec (demo speed).
    speed_factor=1 for real-time (30min waits per step).
    """
    scenario = SCENARIOS.get(scenario_name)
    if not scenario:
        print(f"Unknown scenario: {scenario_name}. Choose from: {list(SCENARIOS.keys())}")
        return

    print(f"\n▶ AgriGuard Simulator — Scenario: '{scenario_name}' | Animal ID: {animal_id}")
    print(f"  Speed: {speed_factor}x | Steps: {len(scenario)}\n")

    async with httpx.AsyncClient(timeout=10.0) as client:
        for i, step in enumerate(scenario):
            temp, hr, activity, alert_class, lat, lng = step
            payload = {
                "animal_id": animal_id,
                "temperature": temp + random.uniform(-0.1, 0.1),
                "heart_rate": hr + random.randint(-2, 2),
                "spo2": round(97 - random.uniform(0, 2), 1),
                "activity_level": random.randint(20, 80),
                "activity_classification": activity,
                "health_alert_class": alert_class,
                "lat": lat + random.uniform(-0.0001, 0.0001),
                "lng": lng + random.uniform(-0.0001, 0.0001),
                "source": "simulator",
            }
            try:
                resp = await client.post(f"{BASE_URL}/ingest/simulate", json=payload)
                status_icon = "✅" if resp.status_code == 202 else "❌"
                print(f"  Step {i+1}/{len(scenario)} {status_icon} | "
                      f"temp={temp:.1f}°C | hr={hr} bpm | "
                      f"class={alert_class} | HTTP {resp.status_code}")
            except Exception as e:
                print(f"  Step {i+1} ❌ Connection error: {e}")

            if i < len(scenario) - 1:
                sleep_sec = 30.0 / speed_factor
                await asyncio.sleep(sleep_sec)

    print(f"\n✅ Scenario '{scenario_name}' complete.")


if __name__ == "__main__":
    animal_id   = int(sys.argv[1])   if len(sys.argv) > 1 else 1
    scenario    = sys.argv[2]         if len(sys.argv) > 2 else "heat_stress"
    speed       = float(sys.argv[3])  if len(sys.argv) > 3 else 60.0
    asyncio.run(run_scenario(animal_id, scenario, speed))
