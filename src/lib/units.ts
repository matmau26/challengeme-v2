const KG_TO_LBS = 2.20462;
const KM_TO_MILES = 0.621371;

export type UnitSystem = "metric" | "imperial";

export function displayWeight(kgValue: number, system: UnitSystem): string {
  if (system === "imperial") return `${Math.round(kgValue * KG_TO_LBS)} lbs`;
  return `${kgValue} kg`;
}

export function displayDistance(kmValue: number, system: UnitSystem): string {
  if (system === "imperial") return `${(kmValue * KM_TO_MILES).toFixed(2)} mi`;
  return `${kmValue} km`;
}

export function saveWeightToMetric(inputValue: number, system: UnitSystem): number {
  if (!inputValue) return 0;
  if (system === "imperial") return Number((inputValue / KG_TO_LBS).toFixed(2));
  return inputValue;
}

export function saveDistanceToMetric(inputValue: number, system: UnitSystem): number {
  if (!inputValue) return 0;
  if (system === "imperial") return Number((inputValue / KM_TO_MILES).toFixed(2));
  return inputValue;
}

export function formatTextUnits(text: string, system: UnitSystem): string {
  if (!text || system === "metric") return text;
  let t = text;
  t = t.replace(/(\d+(?:\.\d+)?)\s*kgs?/gi, (_, v) => displayWeight(parseFloat(v), "imperial"));
  t = t.replace(/(\d+(?:\.\d+)?)\s*kms?/gi, (_, v) => displayDistance(parseFloat(v), "imperial"));
  t = t.replace(/(\d+(?:\.\d+)?)\s*m(?!\w)/gi, (_, v) => {
    const m = parseFloat(v);
    return m >= 1000 ? displayDistance(m / 1000, "imperial") : `${m}m`;
  });
  return t;
}
