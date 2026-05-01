import { forwardRef, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from "react-native-svg";
import type { Badge } from "@/src/lib/types";

const W = 1080;
const H = 1920;

const TIER_PALETTES = {
  rookie: {
    primary: "#4DAA7A",
    primaryDark: "#1f5238",
    cardBg: "#0d1612",
    starsActive: 1,
    starsTotal: 5,
    badgeName: "ROOKIE",
    statusFr: "vient de poser sa marque",
    statusEn: "set a new mark",
    egoBaitFr: { line1: "J'AI OSÉ.", line2: "ET TOI ?" },
    egoBaitEn: { line1: "I DARED.", line2: "DID YOU?" },
  },
  solid: {
    primary: "#00D4FF",
    primaryDark: "#003e4d",
    cardBg: "#0d1620",
    starsActive: 2,
    starsTotal: 5,
    badgeName: "SOLID",
    statusFr: "vient de poser sa marque",
    statusEn: "set a new mark",
    egoBaitFr: { line1: "PAS MAL.", line2: "FAIS MIEUX." },
    egoBaitEn: { line1: "NOT BAD.", line2: "DO BETTER." },
  },
  beast: {
    primary: "#00FF88",
    primaryDark: "#003d20",
    cardBg: "#0d1f15",
    starsActive: 3,
    starsTotal: 5,
    badgeName: "BEAST",
    statusFr: "vient de débloquer",
    statusEn: "just unlocked",
    egoBaitFr: { line1: "J'AI OSÉ.", line2: "TOI, T'OSES ?" },
    egoBaitEn: { line1: "I DARED.", line2: "YOU DARE?" },
  },
  elite: {
    primary: "#FF6B35",
    primaryDark: "#4a1f0a",
    cardBg: "#1f1208",
    starsActive: 4,
    starsTotal: 5,
    badgeName: "ELITE",
    statusFr: "vient de débloquer",
    statusEn: "just unlocked",
    egoBaitFr: { line1: "TOP 5%.", line2: "BATS-MOI." },
    egoBaitEn: { line1: "TOP 5%.", line2: "BEAT ME." },
  },
  king: {
    primary: "#FFD700",
    primaryDark: "#5c4a00",
    cardBg: "#1f1d08",
    starsActive: 5,
    starsTotal: 5,
    badgeName: "KING",
    statusFr: "règne sur ce défi",
    statusEn: "rules this challenge",
    egoBaitFr: { line1: "#1 MONDIAL.", line2: "PERSONNE NE FAIT MIEUX." },
    egoBaitEn: { line1: "#1 WORLDWIDE.", line2: "NOBODY DOES BETTER." },
  },
} as const;

const CATEGORY_EMOJI: Record<string, string> = {
  muscle: "🏋️",
  fitness: "💪",
  football: "⚽",
  running: "🏃",
  crossfit: "🔥",
  hyrox: "⚔️",
  extreme: "⚡",
  flechette: "🎯",
};

const CATEGORY_LABEL = {
  fr: {
    muscle: "MUSCU",
    fitness: "FITNESS",
    football: "FOOT",
    running: "RUNNING",
    crossfit: "CROSSFIT",
    hyrox: "HYROX",
    extreme: "EXTRÊME",
    flechette: "FLÉCHETTES",
  },
  en: {
    muscle: "STRENGTH",
    fitness: "FITNESS",
    football: "FOOTBALL",
    running: "RUNNING",
    crossfit: "CROSSFIT",
    hyrox: "HYROX",
    extreme: "EXTREME",
    flechette: "DARTS",
  },
} as const;

const CATEGORY_LABEL_SHORT = {
  fr: {
    muscle: "MUSCU",
    fitness: "FIT",
    football: "FOOT",
    running: "RUN",
    crossfit: "CFT",
    hyrox: "HYROX",
    extreme: "EXT",
    flechette: "DARTS",
  },
  en: {
    muscle: "STR",
    fitness: "FIT",
    football: "FOOT",
    running: "RUN",
    crossfit: "CFT",
    hyrox: "HYROX",
    extreme: "EXT",
    flechette: "DARTS",
  },
} as const;

const getCategoryEmoji = (cat: string): string =>
  CATEGORY_EMOJI[(cat || "").toLowerCase()] || "🎯";

const getCategoryLabel = (cat: string, locale: string): string => {
  const lang = locale === "en" ? "en" : "fr";
  const key = (cat || "").toLowerCase() as keyof typeof CATEGORY_LABEL.fr;
  return CATEGORY_LABEL[lang][key] || (cat || "").toUpperCase();
};

const getCategoryLabelShort = (cat: string, locale: string): string => {
  const lang = locale === "en" ? "en" : "fr";
  const key = (cat || "").toLowerCase() as keyof typeof CATEGORY_LABEL_SHORT.fr;
  return CATEGORY_LABEL_SHORT[lang][key] || getCategoryLabel(cat, locale);
};

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const padNumber = (n: number, length: number = 3): string =>
  String(Math.max(0, Math.floor(n))).padStart(length, "0");

const renderStars = (active: number, total: number): string =>
  "★".repeat(active) + "☆".repeat(total - active);

const PARTICLES: { x: number; y: number }[] = [
  { x: 90, y: 280 }, { x: 1010, y: 320 }, { x: 50, y: 600 },
  { x: 1030, y: 780 }, { x: 80, y: 950 }, { x: 1020, y: 1100 },
  { x: 100, y: 1300 }, { x: 1010, y: 1450 }, { x: 70, y: 420 },
  { x: 1020, y: 540 }, { x: 60, y: 850 }, { x: 1010, y: 990 },
  { x: 90, y: 1200 }, { x: 1030, y: 1230 }, { x: 50, y: 1380 },
];

const PARTICLES_KING_EXTRA: { x: number; y: number }[] = [
  { x: 130, y: 350 }, { x: 970, y: 380 }, { x: 110, y: 500 },
  { x: 990, y: 660 }, { x: 140, y: 720 }, { x: 980, y: 880 },
  { x: 120, y: 1050 }, { x: 970, y: 1180 }, { x: 150, y: 1170 },
  { x: 990, y: 1370 }, { x: 110, y: 1430 }, { x: 980, y: 470 },
  { x: 130, y: 600 }, { x: 990, y: 1290 }, { x: 140, y: 880 },
];

interface ShareCardProps {
  locale: string;
  username: string;
  avatarUrl?: string;
  challengeName: string;
  score: number;
  performance: string;
  rank: number;
  badge: Badge;
  totalAttempts: number;
  category: string;
}

function Avatar({ avatarUrl, username }: { avatarUrl?: string; username: string }) {
  const [imageError, setImageError] = useState(false);
  if (avatarUrl && !imageError) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={styles.avatarImage}
        onError={() => setImageError(true)}
      />
    );
  }
  const initial = (username?.[0] || "?").toUpperCase();
  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
}

export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  {
    locale,
    username,
    avatarUrl,
    challengeName,
    score,
    performance,
    rank,
    badge,
    totalAttempts,
    category,
  },
  ref,
) {
  const lang = locale === "en" ? "en" : "fr";
  const palette =
    TIER_PALETTES[badge as keyof typeof TIER_PALETTES] || TIER_PALETTES.rookie;
  const isKing = badge === "king" && rank === 1;

  const safeUser = (username && username.trim()) || "athlete";
  const displayScore = Math.max(1, Math.min(100, Math.round(score)));
  const status = lang === "en" ? palette.statusEn : palette.statusFr;
  const egoBait = lang === "en" ? palette.egoBaitEn : palette.egoBaitFr;
  const ctaText = lang === "en" ? "BEAT ME →" : "BATS-MOI →";

  const categoryLabel = getCategoryLabel(category, lang);
  const categoryLabelShort = getCategoryLabelShort(category, lang);
  const categoryEmoji = getCategoryEmoji(category);
  const tierLabel = lang === "en" ? `${palette.badgeName} TIER` : palette.badgeName;
  const stars = renderStars(palette.starsActive, palette.starsTotal);
  const rankLabel = `N°${padNumber(rank, 3)}/${padNumber(totalAttempts, 3)}`;

  const haloOpacity1 = isKing ? 0.5 : 0.4;
  const haloOpacity2 = isKing ? 0.18 : 0.1;
  const cardBorderWidth = isKing ? 8 : 6;
  const particles = isKing ? [...PARTICLES, ...PARTICLES_KING_EXTRA] : PARTICLES;

  const officialFr = "CHALLENGEME · CARTE OFFICIELLE";
  const officialEn = "CHALLENGEME · OFFICIAL CARD";
  const verifiedFr = "VÉRIFIÉ";
  const verifiedEn = "VERIFIED";
  const officialText = lang === "en" ? officialEn : officialFr;
  const verifiedText = lang === "en" ? verifiedEn : verifiedFr;
  const scoreXpLabel = lang === "en" ? "SCORE · XP" : "SCORE · XP";
  const performanceLabel = "PERFORMANCE";
  const rankCellLabel = lang === "en" ? "RANK" : "RANG";
  const badgeCellLabel = "BADGE";
  const catCellLabel = lang === "en" ? "CAT." : "CAT.";

  return (
    <View ref={ref} collapsable={false} style={styles.canvas}>
      {/* Halo extérieur SVG (derrière la card) */}
      <Svg
        width={1020}
        height={1300}
        viewBox="0 0 1020 1300"
        style={[styles.absolute, { top: 200, left: 30 }]}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="cardHalo" cx="50%" cy="50%" r="60%">
            <Stop offset="0%" stopColor={palette.primary} stopOpacity={haloOpacity1} />
            <Stop offset="50%" stopColor={palette.primary} stopOpacity={haloOpacity2} />
            <Stop offset="100%" stopColor={palette.primary} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="1020" height="1300" fill="url(#cardHalo)" />
      </Svg>

      {/* Particules */}
      <Svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={styles.absoluteFill}
        pointerEvents="none"
      >
        {particles.map((p, idx) => (
          <Circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={palette.primary}
            opacity={0.6}
          />
        ))}
      </Svg>

      {/* === HEADER (hors carte) === */}
      <View style={styles.topBar}>
        <View style={[styles.topBarDot, { backgroundColor: palette.primary }]} />
        <Text style={[styles.topBarText, { color: palette.primary }]}>challengeme.pro</Text>
      </View>

      <View style={styles.headerLeft}>
        <Avatar avatarUrl={avatarUrl} username={safeUser} />
        <View style={styles.headerLeftText}>
          <Text style={styles.username} numberOfLines={1}>
            @{safeUser}
          </Text>
          <Text style={styles.statusText} numberOfLines={1}>
            {status}
          </Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <Text style={styles.brandName}>ChallengeMe</Text>
        <Text style={[styles.brandSlogan, { color: palette.primary }]}>PROVE YOURSELF</Text>
      </View>

      {/* === CARD === */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.cardBg,
            borderColor: palette.primary,
            borderWidth: cardBorderWidth,
          },
        ]}
      />

      {/* Couronne KING (au-dessus de la bordure haute) */}
      {isKing && (
        <Text style={styles.kingCrown} allowFontScaling={false}>
          👑
        </Text>
      )}

      {/* === SECTION 1 — Header carte === */}
      <Text style={[styles.categoryTag, { color: palette.primary }]} numberOfLines={1}>
        {categoryLabel}
      </Text>
      <Text style={styles.challengeTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
        {(challengeName || "").toUpperCase()}
      </Text>
      <View
        style={[
          styles.categoryCircle,
          {
            backgroundColor: hexToRgba(palette.primary, 0.2),
            borderColor: palette.primary,
          },
        ]}
      >
        <Text style={styles.categoryEmoji} allowFontScaling={false}>
          {categoryEmoji}
        </Text>
      </View>

      <View
        style={[
          styles.cardSeparator,
          { backgroundColor: hexToRgba(palette.primary, 0.4) },
        ]}
      />

      {/* === SECTION 2 — Tier metadata === */}
      <Text
        style={[styles.tierStars, { color: palette.primary }]}
        allowFontScaling={false}
      >
        {stars}
      </Text>
      <Text style={styles.tierLabel}>{tierLabel}</Text>
      <Text style={[styles.tierRank, { color: palette.primary }]}>{rankLabel}</Text>

      {/* === SECTION 3 — Score géant === */}
      <View style={styles.scoreSection}>
        <Text style={styles.scoreText} allowFontScaling={false}>
          {displayScore}
        </Text>
      </View>

      {/* === SECTION 4 — Sous-titre score === */}
      <Text style={styles.scoreXpLabel}>{scoreXpLabel}</Text>

      {/* === SECTION 5 — Holder === */}
      <Text style={styles.holderText} numberOfLines={1}>
        HOLDER · @{safeUser.toUpperCase()}
      </Text>

      {/* === SECTION 6 — Performance bar === */}
      <View
        style={[
          styles.perfBar,
          {
            borderColor: hexToRgba(palette.primary, 0.4),
          },
        ]}
      >
        <Text style={[styles.perfBarLabel, { color: palette.primary }]}>
          {performanceLabel}
        </Text>
        <Text
          style={styles.perfBarMain}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {(challengeName || "").toUpperCase()}
          <Text> — </Text>
          <Text style={{ color: palette.primary }}>{performance}</Text>
        </Text>
      </View>

      {/* === SECTION 7 — Stats footer 3 colonnes === */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCell,
            { borderColor: hexToRgba(palette.primary, 0.6) },
          ]}
        >
          <Text style={styles.statCellLabel}>{rankCellLabel}</Text>
          <Text
            style={[styles.statCellValue, { color: palette.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            #{rank}
          </Text>
        </View>
        <View
          style={[
            styles.statCell,
            { borderColor: hexToRgba(palette.primary, 0.6) },
          ]}
        >
          <Text style={styles.statCellLabel}>{badgeCellLabel}</Text>
          <Text
            style={[styles.statCellValue, { color: palette.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {palette.badgeName}
          </Text>
        </View>
        <View
          style={[
            styles.statCell,
            { borderColor: hexToRgba(palette.primary, 0.6) },
          ]}
        >
          <Text style={styles.statCellLabel}>{catCellLabel}</Text>
          <Text
            style={[styles.statCellValue, { color: palette.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {categoryLabelShort}
          </Text>
        </View>
      </View>

      {/* === SECTION 8 — Footer carte (bandeau) === */}
      <View style={styles.cardFooterBanner}>
        <Text style={styles.cardFooterText}>{officialText}</Text>
        <View style={[styles.cardFooterDot, { backgroundColor: palette.primary }]} />
        <Text style={styles.cardFooterText}>{verifiedText}</Text>
      </View>

      {/* === EGO-BAIT (hors carte) === */}
      <Text style={styles.egoBaitLine1} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {egoBait.line1}
      </Text>
      <Text
        style={[
          styles.egoBaitLine2,
          {
            color: palette.primary,
            textShadowColor: palette.primary,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {egoBait.line2}
      </Text>

      {/* === CTA "BATS-MOI" === */}
      <View
        style={[
          styles.ctaButton,
          {
            borderColor: palette.primary,
            shadowColor: palette.primary,
          },
        ]}
      >
        <Text style={styles.ctaText} numberOfLines={1}>
          {ctaText}
        </Text>
      </View>

      {/* === URL === */}
      <Text style={styles.footerUrl}>CHALLENGEME.PRO</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  canvas: {
    width: W,
    height: H,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  absolute: {
    position: "absolute",
  },
  absoluteFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Header top bar
  topBar: {
    position: "absolute",
    top: 30,
    left: 50,
    flexDirection: "row",
    alignItems: "center",
  },
  topBarDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 14,
  },
  topBarText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 32,
    letterSpacing: 1,
  },

  // Avatar + user
  headerLeft: {
    position: "absolute",
    top: 100,
    left: 50,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFA500",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 36,
    color: "#FFFFFF",
  },
  headerLeftText: {
    marginLeft: 18,
    maxWidth: 600,
  },
  username: {
    fontFamily: "Poppins_700Bold",
    fontSize: 36,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  statusText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 24,
    color: "#888888",
    marginTop: 4,
  },

  // Header right
  headerRight: {
    position: "absolute",
    top: 100,
    right: 50,
    alignItems: "flex-end",
  },
  brandName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 36,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  brandSlogan: {
    fontFamily: "Poppins_500Medium",
    fontSize: 22,
    letterSpacing: 4,
    marginTop: 6,
  },

  // Card
  card: {
    position: "absolute",
    top: 230,
    left: 60,
    width: 960,
    height: 1240,
    borderRadius: 32,
  },

  // King crown overlay
  kingCrown: {
    position: "absolute",
    top: 178,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 80,
    transform: [{ rotate: "-8deg" }],
  },

  // Section 1 — header carte
  categoryTag: {
    position: "absolute",
    top: 280,
    left: 110,
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    letterSpacing: 4,
  },
  challengeTitle: {
    position: "absolute",
    top: 320,
    left: 110,
    right: 220,
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 44,
    color: "#FFFFFF",
    letterSpacing: -0.5,
    lineHeight: 50,
  },
  categoryCircle: {
    position: "absolute",
    top: 290,
    right: 110,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryEmoji: {
    fontSize: 44,
    lineHeight: 56,
    textAlign: "center",
  },
  cardSeparator: {
    position: "absolute",
    top: 420,
    left: 100,
    right: 100,
    height: 1,
  },

  // Section 2 — tier metadata
  tierStars: {
    position: "absolute",
    top: 470,
    left: 110,
    fontFamily: "Poppins_700Bold",
    fontSize: 32,
    letterSpacing: 4,
  },
  tierLabel: {
    position: "absolute",
    top: 470,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Poppins_700Bold",
    fontSize: 36,
    color: "#FFFFFF",
    letterSpacing: 6,
  },
  tierRank: {
    position: "absolute",
    top: 478,
    right: 110,
    fontFamily: "Courier",
    fontSize: 28,
    letterSpacing: 1,
  },

  // Section 3 — score giant
  scoreSection: {
    position: "absolute",
    top: 540,
    left: 0,
    right: 0,
    height: 480,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 360,
    lineHeight: 380,
    color: "#FFFFFF",
    letterSpacing: -10,
    textAlign: "center",
    includeFontPadding: false,
    paddingVertical: 20,
  },

  // Section 4 — score subtitle
  scoreXpLabel: {
    position: "absolute",
    top: 1040,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
    fontSize: 26,
    color: "#888888",
    letterSpacing: 8,
  },

  // Section 5 — holder
  holderText: {
    position: "absolute",
    top: 1110,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
    fontSize: 24,
    color: "#888888",
    letterSpacing: 4,
  },

  // Section 6 — performance bar
  perfBar: {
    position: "absolute",
    top: 1170,
    left: 110,
    right: 110,
    height: 70,
    paddingHorizontal: 30,
    backgroundColor: "#000000",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  perfBarLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    letterSpacing: 3,
  },
  perfBarMain: {
    flex: 1,
    textAlign: "right",
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: "#FFFFFF",
    marginLeft: 16,
  },

  // Section 7 — stats footer
  statsRow: {
    position: "absolute",
    top: 1300,
    left: 110,
    right: 110,
    height: 110,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCell: {
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statCellLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#888888",
    letterSpacing: 3,
    marginBottom: 6,
  },
  statCellValue: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 36,
    letterSpacing: -1,
  },

  // Section 8 — footer banner
  cardFooterBanner: {
    position: "absolute",
    top: 1430,
    left: 60,
    right: 60,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cardFooterText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 18,
    color: "#888888",
    letterSpacing: 2,
  },
  cardFooterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 14,
  },

  // Ego-bait
  egoBaitLine1: {
    position: "absolute",
    top: 1530,
    left: 0,
    right: 0,
    paddingHorizontal: 80,
    textAlign: "center",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 88,
    lineHeight: 92,
    color: "#FFFFFF",
    letterSpacing: -2,
  },
  egoBaitLine2: {
    position: "absolute",
    top: 1626,
    left: 0,
    right: 0,
    paddingHorizontal: 80,
    textAlign: "center",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 88,
    lineHeight: 92,
    letterSpacing: -2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },

  // CTA button
  ctaButton: {
    position: "absolute",
    top: 1750,
    left: (W - 380) / 2,
    width: 380,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  ctaText: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 32,
    color: "#000000",
    letterSpacing: 2,
  },

  // URL
  footerUrl: {
    position: "absolute",
    top: 1860,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
    fontSize: 22,
    color: "#888888",
    letterSpacing: 6,
  },
});
