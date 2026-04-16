export type Category = "fitness" | "muscle" | "football" | "running" | "crossfit" | "hyrox" | "extreme" | "flechette";
export type MetricType = "time" | "weight" | "reps" | "distance" | "pass";
export type Badge = "king" | "elite" | "beast" | "solid" | "rookie";

export type CategoryStyle = {
  label_fr: string;
  label_en: string;
  color: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
};

const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  label_fr: "",
  label_en: "",
  color: "#888888",
  textClass: "text-[#888888]",
  bgClass: "bg-[#888888]/10",
  borderClass: "border-[#888888]/20",
};

export const CATEGORY_CONFIG: Record<Category, CategoryStyle> = {
  fitness: {
    label_fr: "Fitness", label_en: "Fitness", color: "#00FF87",
    textClass: "text-[#00FF87]", bgClass: "bg-[#00FF87]/10", borderClass: "border-[#00FF87]/20",
  },
  muscle: {
    label_fr: "Muscle", label_en: "Muscle", color: "#F0C040",
    textClass: "text-[#F0C040]", bgClass: "bg-[#F0C040]/10", borderClass: "border-[#F0C040]/20",
  },
  football: {
    label_fr: "Football", label_en: "Football", color: "#4D8BF5",
    textClass: "text-[#4D8BF5]", bgClass: "bg-[#4D8BF5]/10", borderClass: "border-[#4D8BF5]/20",
  },
  running: {
    label_fr: "Running", label_en: "Running", color: "#30C9B0",
    textClass: "text-[#30C9B0]", bgClass: "bg-[#30C9B0]/10", borderClass: "border-[#30C9B0]/20",
  },
  crossfit: {
    label_fr: "CrossFit", label_en: "CrossFit", color: "#E04040",
    textClass: "text-[#E04040]", bgClass: "bg-[#E04040]/10", borderClass: "border-[#E04040]/20",
  },
  hyrox: {
    label_fr: "Hyrox", label_en: "Hyrox", color: "#9B59B6",
    textClass: "text-[#9B59B6]", bgClass: "bg-[#9B59B6]/10", borderClass: "border-[#9B59B6]/20",
  },
  extreme: {
    label_fr: "Extr\u00eame", label_en: "Extreme", color: "#FF6B35",
    textClass: "text-[#FF6B35]", bgClass: "bg-[#FF6B35]/10", borderClass: "border-[#FF6B35]/20",
  },
  flechette: {
    label_fr: "Fl\u00e9chettes", label_en: "Darts", color: "#FF8C00",
    textClass: "text-[#FF8C00]", bgClass: "bg-[#FF8C00]/10", borderClass: "border-[#FF8C00]/20",
  },
};

export function getCategoryConfig(category: string): CategoryStyle {
  const known = CATEGORY_CONFIG[category as Category];
  if (known) return known;
  const cap = category.charAt(0).toUpperCase() + category.slice(1);
  return { ...DEFAULT_CATEGORY_STYLE, label_fr: cap, label_en: cap };
}

export const BADGE_CONFIG: Record<
  Badge,
  { label_fr: string; label_en: string; emoji: string; colorClass: string }
> = {
  king:   { label_fr: "KING",   label_en: "KING",   emoji: "\ud83d\udc51", colorClass: "text-[#FFD700]" },
  elite:  { label_fr: "ELITE",  label_en: "ELITE",  emoji: "\ud83c\udfc6", colorClass: "text-[#F0C040]" },
  beast:  { label_fr: "BEAST",  label_en: "BEAST",  emoji: "\ud83d\udcaa", colorClass: "text-[#00FF87]" },
  solid:  { label_fr: "SOLID",  label_en: "SOLID",  emoji: "\ud83d\udc4d", colorClass: "text-[#4D8BF5]" },
  rookie: { label_fr: "ROOKIE", label_en: "ROOKIE", emoji: "\ud83c\udf31", colorClass: "text-[#888888]" },
};

export function getBadge(percentile: number): Badge {
  if (percentile <= 1)  return "king";
  if (percentile <= 10) return "elite";
  if (percentile <= 30) return "beast";
  if (percentile <= 60) return "solid";
  return "rookie";
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s > 0 ? s + "s" : ""}`.trim();
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm > 0 ? rm + "m" : ""}`.trim();
}

export function formatValue(value: number, metricType: MetricType, unit: string): string {
  if (metricType === "time")     return formatTime(value);
  if (metricType === "weight")   return `${value} ${unit}`;
  if (metricType === "reps")     return `${value} ${unit}`;
  if (metricType === "distance") return `${value} ${unit}`;
  return value.toString();
}

export function isHigherBetter(metricType: MetricType, scoringLogic?: string): boolean {
  if (metricType === "time" && scoringLogic === "higher_is_better") return true;
  return metricType === "weight" || metricType === "reps" || metricType === "distance";
}

export function computeScore(value: number, metricType: MetricType, scoringLogic?: string): number {
  if (value <= 0) return 0;
  if (metricType === "pass")     return 100;
  if (metricType === "distance") return Number((value * 10).toFixed(2));
  if (metricType === "weight")   return Number((value * 1.2).toFixed(2));
  if (metricType === "reps")     return Number((value * 1).toFixed(2));
  if (metricType === "time") {
    if (scoringLogic === "higher_is_better") return Number((value * 1).toFixed(2));
    return Number((6000 / value).toFixed(2));
  }
  return 0;
}
