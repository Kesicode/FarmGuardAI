"""
Deterministic health score formula. No LLM needed — called by Agent 3.
Returns a 0-100 score based on species-calibrated reference ranges
and on-device TinyML classifications.

NOTE: SpO2 (MAX30102) is intentionally excluded from the score.
The sensor algorithm is calibrated for human skin and produces unreliable
values on animal hide/ear. SpO2 is stored in DB for reference only.
"""

SPECIES_NORMAL_RANGES: dict[str, dict] = {
    "cow":     {"temp": (38.0, 39.5), "hr": (40.0, 80.0)},
    "chicken": {"temp": (40.6, 41.7), "hr": (250.0, 400.0)},
    "goat":    {"temp": (38.5, 40.0), "hr": (70.0, 90.0)},
    "pig":     {"temp": (38.7, 39.8), "hr": (60.0, 80.0)},
    "dog":     {"temp": (38.3, 39.2), "hr": (60.0, 140.0)},
}

ALERT_CLASS_PENALTIES: dict[str, float] = {
    "Normal":         0.0,
    "Stress":        15.0,
    "DigestiveIssue": 20.0,
    "InfectionRisk":  25.0,
    "HeatStress":     30.0,
}

ACTIVITY_PENALTIES: dict[str, float] = {
    "Resting":        0.0,
    "Rumination":     0.0,
    "Walking":        0.0,
    "RandomActivity": 10.0,
}


def calculate_health_score(obs: dict, animal_type: str = "cow") -> float:
    """
    Returns 0-100 (100 = perfect health).
    Deterministic — no API calls, fast execution.
    """
    score = 100.0
    ranges = SPECIES_NORMAL_RANGES.get(animal_type, SPECIES_NORMAL_RANGES["cow"])
    temp_min, temp_max = ranges["temp"]
    hr_min, hr_max = ranges["hr"]

    # Temperature penalty
    temp = obs.get("temperature")
    if temp is not None:
        if temp > temp_max + 1.0:    score -= 25.0
        elif temp > temp_max:         score -= 10.0
        elif temp < temp_min - 0.5:   score -= 15.0
        elif temp < temp_min:         score -= 5.0

    # Heart rate penalty
    hr = obs.get("heart_rate")
    if hr is not None:
        if hr > hr_max * 1.25 or hr < hr_min * 0.75:  score -= 20.0
        elif hr > hr_max or hr < hr_min:               score -= 10.0

    # TinyML alert class penalty
    alert_class = obs.get("health_alert_class", "Normal")
    score -= ALERT_CLASS_PENALTIES.get(alert_class, 0.0)

    # Activity penalty
    activity = obs.get("activity_classification", "Resting")
    score -= ACTIVITY_PENALTIES.get(activity, 0.0)

    return max(0.0, min(100.0, score))


def get_risk_level(health_score: float) -> str:
    if health_score >= 75:  return "low"
    if health_score >= 55:  return "medium"
    if health_score >= 35:  return "high"
    return "critical"


def get_health_factors(obs: dict, animal_type: str, health_score: float) -> list[str]:
    """Human-readable list of what drove the health score. For explainability."""
    factors = []
    ranges = SPECIES_NORMAL_RANGES.get(animal_type, SPECIES_NORMAL_RANGES["cow"])
    temp = obs.get("temperature")
    hr = obs.get("heart_rate")

    if temp is not None:
        if temp > ranges["temp"][1]:
            factors.append(f"Elevated temperature ({temp:.1f}°C > {ranges['temp'][1]}°C normal max)")
        elif temp < ranges["temp"][0]:
            factors.append(f"Low temperature ({temp:.1f}°C < {ranges['temp'][0]}°C normal min)")
    if hr is not None:
        if hr > ranges["hr"][1]:
            factors.append(f"High heart rate ({hr:.0f} bpm > {ranges['hr'][1]:.0f} bpm normal max)")
        elif hr < ranges["hr"][0]:
            factors.append(f"Low heart rate ({hr:.0f} bpm < {ranges['hr'][0]:.0f} bpm normal min)")

    ac = obs.get("health_alert_class", "Normal")
    if ac != "Normal":
        factors.append(f"On-device TinyML classification: {ac}")

    act = obs.get("activity_classification", "Resting")
    if act == "RandomActivity":
        factors.append("Erratic movement detected (RandomActivity classification)")

    if not factors:
        factors.append("All vitals within normal species range")

    return factors
