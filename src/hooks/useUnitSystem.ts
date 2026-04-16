import { useUserProfile } from "@/src/hooks/useUserProfile";
import { type UnitSystem, formatTextUnits } from "@/src/lib/units";

export function useUnitSystem(): { unitSystem: UnitSystem; fmt: (text: string) => string } {
  const { data: profile } = useUserProfile();
  const unitSystem: UnitSystem = profile?.unit_system === "imperial" ? "imperial" : "metric";
  const fmt = (text: string) => formatTextUnits(text, unitSystem);
  return { unitSystem, fmt };
}
