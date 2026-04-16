export function getCategoryIcon(category: string | null | undefined): string {
  switch (category?.toLowerCase()) {
    case "muscle":    return "\ud83c\udfcb\ufe0f";
    case "fitness":   return "\ud83d\udcaa";
    case "football":  return "\u26bd";
    case "running":   return "\ud83c\udfc3";
    case "crossfit":  return "\ud83d\udd25";
    case "hyrox":     return "\u2694\ufe0f";
    case "extreme":   return "\u26a1";
    case "flechette": return "\ud83c\udfaf";
    default:          return "\ud83c\udfaf";
  }
}
