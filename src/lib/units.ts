const KG_TO_LBS = 2.20462;
const KM_TO_MILES = 0.621371;
const M_TO_FEET = 3.28084;

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

export const formatDynamicUnit = (
  rawString: string | number | null | undefined,
  unitSystem: UnitSystem,
): string => {
  if (rawString === null || rawString === undefined || rawString === "") return "";
  const strValue = String(rawString).trim();

  if (unitSystem === "metric") return strValue;

  const match = strValue.match(/^([\d.]+)\s*(km|kg|°C|C|m)$/i);
  if (!match) return strValue;

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "km":
      return `${(value * KM_TO_MILES).toFixed(1)} mi`;
    case "m":
      return `${Math.round(value * M_TO_FEET)} ft`;
    case "kg":
      return `${Math.round(value * KG_TO_LBS)} lbs`;
    case "°c":
    case "c":
      return `${Math.round((value * 9) / 5 + 32)} °F`;
    default:
      return strValue;
  }
};

export function formatTextUnits(text: string, system: UnitSystem): string {
  if (!text || system === "metric") return text;
  let t = text;
  t = t.replace(/(\d+(?:\.\d+)?)\s*kgs?\b/gi, (_, v) => displayWeight(parseFloat(v), "imperial"));
  t = t.replace(/(\d+(?:\.\d+)?)\s*kms?\b/gi, (_, v) => displayDistance(parseFloat(v), "imperial"));
  t = t.replace(/(\d+(?:\.\d+)?)\s*m(?!\w)/gi, (_, v) => {
    const m = parseFloat(v);
    return m >= 1000 ? displayDistance(m / 1000, "imperial") : `${Math.round(m * M_TO_FEET)} ft`;
  });
  t = t.replace(/(\d+(?:\.\d+)?)\s*°C\b/gi, (_, v) => {
    return `${Math.round((parseFloat(v) * 9) / 5 + 32)} °F`;
  });
  return t;
}
