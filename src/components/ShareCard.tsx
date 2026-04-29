import { forwardRef } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Polygon,
  G,
  Circle,
} from "react-native-svg";
import type { Badge } from "@/src/lib/types";

// === THEME TOKENS ===

const STANDARD_THEME = {
  bgGradientFrom: "#0A2418",
  bgGradientMid: "#050D08",
  bgGradientTo: "#000000",
  scoreColorFrom: "#7FFFC4",
  scoreColorMid: "#00FF88",
  scoreColorTo: "#00CC55",
  haloColor: "#00FF88",
  haloOpacity: 0.45,
  accentColor: "#00FF88",
  borderSubtle: "rgba(255,255,255,0.08)",
  borderAccent: "rgba(0,255,136,0.4)",
  textPrimary: "#FFFFFF",
  textMuted: "#7A8580",
  textSubtle: "#3A4540",
  textTier: "#A8B0AC",
  avatarBg: "#1A2A20",
  avatarBorder: "#00FF88",
} as const;

const KING_THEME = {
  bgGradientFrom: "#2A1F08",
  bgGradientMid: "#100A02",
  bgGradientTo: "#000000",
  scoreColorFrom: "#FFF4B0",
  scoreColorMid: "#FFD700",
  scoreColorTo: "#B8860B",
  haloColor: "#FFD700",
  haloOpacity: 0.55,
  accentColor: "#FFD700",
  borderSubtle: "rgba(255,215,0,0.2)",
  borderAccent: "rgba(255,215,0,0.7)",
  textPrimary: "#FFFFFF",
  textMuted: "#9A8550",
  textSubtle: "#5A4A20",
  textTier: "#FFD700",
  avatarBg: "#1F1808",
  avatarBorder: "#FFD700",
} as const;

// === TRANSLATIONS ===

const TRANSLATIONS = {
  fr: {
    headerTag: "a posé sa marque.",
    challengeLabel: "DÉFI",
    scoreLabel: "SCORE / 100",
    provocationTop: "Tu peux mieux ?",
    provocationBottom: "Prouve-le.",
    statPerformance: "PERFORMANCE",
    statRank: "RANG MONDIAL",
    fallbackUser: "athlète",
    kingHeaderTag: "règne sur ce défi.",
    kingTitle: "KING",
    kingSubtitle: "— #1 MONDIAL —",
    kingChallengeLabel: "DÉFI MAÎTRISÉ",
    kingProvocationTop: "Le sommet est pris.",
    kingProvocationBottom: "Détrône-moi.",
    kingCtaTop: "Bats ce score.",
    kingCtaBottom: "Prends le trône.",
  },
  en: {
    headerTag: "set a new mark.",
    challengeLabel: "CHALLENGE",
    scoreLabel: "SCORE / 100",
    provocationTop: "Think you're better?",
    provocationBottom: "Prove it.",
    statPerformance: "PERFORMANCE",
    statRank: "WORLD RANK",
    fallbackUser: "athlete",
    kingHeaderTag: "rules this challenge.",
    kingTitle: "KING",
    kingSubtitle: "— #1 WORLDWIDE —",
    kingChallengeLabel: "CHALLENGE MASTERED",
    kingProvocationTop: "The top is taken.",
    kingProvocationBottom: "Dethrone me.",
    kingCtaTop: "Beat this score.",
    kingCtaBottom: "Take the throne.",
  },
} as const;

// === HELPERS ===

const W = 1080;
const H = 1920;

function getStandardCta(rank: number, locale: "fr" | "en"): { top: string; bottom: string } {
  if (locale === "fr") {
    if (rank === 1) return { top: "#1 mondial.", bottom: "Détrône-le." };
    if (rank <= 100) return { top: `Top ${rank} mondial.`, bottom: "Et toi ?" };
    if (rank <= 1000) return { top: "Dans le top 1000.", bottom: "Et toi ?" };
    return { top: "Sur le tableau mondial.", bottom: "À ton tour." };
  }
  if (rank === 1) return { top: "#1 worldwide.", bottom: "Dethrone them." };
  if (rank <= 100) return { top: `Top ${rank} worldwide.`, bottom: "Your turn?" };
  if (rank <= 1000) return { top: "In the global top 1000.", bottom: "Your turn?" };
  return { top: "On the worldwide board.", bottom: "Your turn." };
}

// === SUB-COMPONENTS ===

function Crown({ accentColor }: { accentColor: string }) {
  return (
    <Svg width="200" height="80" viewBox="0 0 200 80">
      <Defs>
        <SvgLinearGradient id="crownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFEB7F" />
          <Stop offset="50%" stopColor={accentColor} />
          <Stop offset="100%" stopColor="#B8860B" />
        </SvgLinearGradient>
      </Defs>
      <Rect x="35" y="50" width="130" height="14" fill="url(#crownGrad)" rx="2" />
      <Polygon
        points="35,50 45,20 55,45 65,5 75,45 85,15 95,45 105,5 115,45 125,15 135,45 145,5 155,45 165,20 165,50"
        fill="url(#crownGrad)"
      />
      <Circle cx="65" cy="20" r="4" fill="#FF1744" />
      <Circle cx="100" cy="15" r="5" fill="#FF1744" />
      <Circle cx="135" cy="20" r="4" fill="#FF1744" />
    </Svg>
  );
}

function Rays({ accentColor }: { accentColor: string }) {
  return (
    <Svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <G transform={`translate(${W / 2}, 950)`} opacity="0.12">
        <Polygon points="0,0 -40,-1100 40,-1100" fill={accentColor} />
        <Polygon points="0,0 -40,1100 40,1100" fill={accentColor} />
        <Polygon points="0,0 -1100,-40 -1100,40" fill={accentColor} />
        <Polygon points="0,0 1100,-40 1100,40" fill={accentColor} />
      </G>
      <G transform={`translate(${W / 2}, 950) rotate(45)`} opacity="0.08">
        <Polygon points="0,0 -30,-1100 30,-1100" fill={accentColor} />
        <Polygon points="0,0 -30,1100 30,1100" fill={accentColor} />
        <Polygon points="0,0 -1100,-30 -1100,30" fill={accentColor} />
        <Polygon points="0,0 1100,-30 1100,30" fill={accentColor} />
      </G>
    </Svg>
  );
}

// === MAIN COMPONENT ===

interface ShareCardProps {
  locale: "fr" | "en";
  username: string;
  avatarUrl?: string;
  challengeName: string;
  score: number;
  performance: string;
  rank: number;
  badge: Badge;
}

export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  { locale, username, avatarUrl, challengeName, score, performance, rank, badge },
  ref,
) {
  const t = TRANSLATIONS[locale];
  const isKing = badge === "king" && rank === 1;
  const THEME = isKing ? KING_THEME : STANDARD_THEME;

  const safeUser = (username && username.trim()) || t.fallbackUser;
  const initial = safeUser.charAt(0).toUpperCase() || "?";
  const displayScore = Math.max(1, Math.min(100, Math.round(score)));
  const scoreFontSize = isKing ? 460 : 500;
  const scoreLineHeight = isKing ? 540 : 600;
  const scoreGlowRadius = isKing ? 35 : 25;
  const haloCY = isKing ? 950 : 900;
  const haloMid = THEME.haloOpacity * 0.4;

  const cta = isKing
    ? { top: t.kingCtaTop, bottom: t.kingCtaBottom }
    : getStandardCta(rank, locale);

  const headerTag = isKing ? t.kingHeaderTag : t.headerTag;

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <LinearGradient
        colors={[THEME.bgGradientFrom, THEME.bgGradientMid, THEME.bgGradientTo]}
        style={StyleSheet.absoluteFill}
      />

      <Svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient
            id="halo"
            cx={W / 2}
            cy={haloCY}
            r="500"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor={THEME.haloColor} stopOpacity={THEME.haloOpacity} />
            <Stop offset="50%" stopColor={THEME.haloColor} stopOpacity={haloMid} />
            <Stop offset="100%" stopColor={THEME.haloColor} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={W} height={H} fill="url(#halo)" />
      </Svg>

      {isKing && <Rays accentColor={THEME.accentColor} />}

      <View style={styles.headerLeft}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={[styles.avatar, { borderColor: THEME.avatarBorder }]}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              { backgroundColor: THEME.avatarBg, borderColor: THEME.avatarBorder },
            ]}
          >
            <Text style={[styles.avatarInitial, { color: THEME.accentColor }]}>{initial}</Text>
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={[styles.username, { color: THEME.textPrimary }]} numberOfLines={1}>
            @{safeUser}
          </Text>
          <Text style={[styles.userTag, { color: THEME.textMuted }]} numberOfLines={1}>
            {headerTag}
          </Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <Text style={[styles.brandName, { color: THEME.textPrimary }]}>ChallengeMe</Text>
        <Text style={[styles.brandSlogan, { color: THEME.accentColor }]}>PROVE YOURSELF</Text>
      </View>

      {isKing ? (
        <View style={styles.kingBlock}>
          <Crown accentColor={THEME.accentColor} />
          <Text style={[styles.kingTitle, { color: THEME.accentColor }]}>{t.kingTitle}</Text>
          <Text style={[styles.kingSubtitle, { color: THEME.accentColor }]}>{t.kingSubtitle}</Text>
          <Text style={[styles.kingChallengeLabel, { color: THEME.textMuted }]}>
            {t.kingChallengeLabel}
          </Text>
          <Text
            style={[styles.kingChallengeName, { color: THEME.textPrimary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {challengeName.toUpperCase()}
          </Text>
        </View>
      ) : (
        <View style={styles.challengeBlock}>
          <Text style={[styles.challengeLabel, { color: THEME.textMuted }]}>{t.challengeLabel}</Text>
          <Text
            style={[styles.challengeName, { color: THEME.textPrimary }]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {challengeName.toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.scoreSection}>
        <View
          style={[
            styles.scoreContainer,
            {
              height: scoreFontSize * 1.6,
              paddingHorizontal: 80,
            },
          ]}
        >
          <Text
            style={[
              styles.scoreText,
              {
                fontSize: scoreFontSize,
                lineHeight: scoreLineHeight,
                color: THEME.scoreColorMid,
                textShadowColor: THEME.haloColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: scoreGlowRadius,
              },
            ]}
          >
            {displayScore}
          </Text>
        </View>
        <Text style={[styles.scoreLabel, { color: THEME.textMuted }]}>{t.scoreLabel}</Text>
      </View>

      {!isKing && (
        <View style={styles.tierBlock}>
          <View
            style={[
              styles.tierPill,
              { backgroundColor: "#1A1A1A", borderColor: "#3A4540" },
            ]}
          >
            <View style={[styles.tierDot, { backgroundColor: THEME.textMuted }]} />
            <Text style={[styles.tierLabel, { color: THEME.textTier }]}>
              {badge.toUpperCase()}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.provocationBlock}>
        <Text style={[styles.provocationLine, { color: THEME.textPrimary }]}>
          {isKing ? t.kingProvocationTop : t.provocationTop}
        </Text>
        <Text
          style={[
            styles.provocationLine,
            styles.provocationAccent,
            {
              color: THEME.accentColor,
              textShadowColor: THEME.accentColor,
            },
          ]}
        >
          {isKing ? t.kingProvocationBottom : t.provocationBottom}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: THEME.borderSubtle }]}>
          <Text style={[styles.statLabel, { color: THEME.textMuted }]}>{t.statPerformance}</Text>
          <Text
            style={[styles.statValue, { color: THEME.textPrimary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {performance}
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            { borderColor: THEME.borderAccent, borderWidth: 1.5 },
          ]}
        >
          <Text style={[styles.statLabel, { color: THEME.textMuted }]}>{t.statRank}</Text>
          <Text
            style={[
              styles.statValue,
              {
                color: THEME.accentColor,
                textShadowColor: THEME.accentColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            #{rank}
          </Text>
        </View>
      </View>

      <View style={styles.ctaBlock}>
        <Text style={[styles.ctaLine, { color: THEME.textPrimary }]}>{cta.top}</Text>
        <Text
          style={[
            styles.ctaLine,
            { color: THEME.accentColor, textShadowColor: THEME.accentColor },
            styles.ctaAccent,
          ]}
        >
          {cta.bottom}
        </Text>
      </View>

      <Text style={[styles.footerUrl, { color: THEME.textMuted }]}>CHALLENGEME.PRO</Text>
    </View>
  );
});

// === STYLES ===

const styles = StyleSheet.create({
  card: {
    width: W,
    height: H,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  headerLeft: {
    position: "absolute",
    top: 130,
    left: 80,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: "Poppins_700Bold",
    fontSize: 44,
  },
  headerText: {
    marginLeft: 25,
    maxWidth: 600,
  },
  username: {
    fontFamily: "Poppins_700Bold",
    fontSize: 38,
    letterSpacing: -0.5,
  },
  userTag: {
    fontFamily: "Poppins_400Regular",
    fontSize: 22,
    marginTop: 4,
  },
  headerRight: {
    position: "absolute",
    top: 130,
    right: 80,
    alignItems: "flex-end",
  },
  brandName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 32,
    letterSpacing: -0.5,
  },
  brandSlogan: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    letterSpacing: 6,
    marginTop: 8,
  },
  challengeBlock: {
    position: "absolute",
    top: 380,
    left: 80,
    right: 80,
    alignItems: "center",
  },
  challengeLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 18,
    letterSpacing: 8,
  },
  challengeName: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 60,
    letterSpacing: -1,
    marginTop: 16,
    textAlign: "center",
  },
  kingBlock: {
    position: "absolute",
    top: 320,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  kingTitle: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 80,
    letterSpacing: 20,
    marginTop: 8,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  kingSubtitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 18,
    letterSpacing: 10,
    marginTop: 8,
  },
  kingChallengeLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 18,
    letterSpacing: 8,
    marginTop: 28,
  },
  kingChallengeName: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 60,
    letterSpacing: -1,
    marginTop: 12,
    paddingHorizontal: 80,
    textAlign: "center",
  },
  scoreSection: {
    position: "absolute",
    top: 700,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  scoreContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  scoreText: {
    fontFamily: "Poppins_800ExtraBold",
    letterSpacing: -10,
    textAlign: "center",
    includeFontPadding: false,
    paddingVertical: 30,
  },
  scoreLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 18,
    letterSpacing: 8,
    marginTop: 12,
  },
  tierBlock: {
    position: "absolute",
    top: 1300,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
  },
  tierDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 18,
  },
  tierLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    letterSpacing: 6,
  },
  provocationBlock: {
    position: "absolute",
    top: 1420,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  provocationLine: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 56,
    letterSpacing: -1,
    textAlign: "center",
    lineHeight: 70,
  },
  provocationAccent: {
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  statsRow: {
    position: "absolute",
    top: 1580,
    left: 60,
    right: 60,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    width: 460,
    height: 180,
    borderRadius: 32,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  statLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    letterSpacing: 4,
    marginBottom: 18,
  },
  statValue: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 78,
    letterSpacing: -2,
  },
  ctaBlock: {
    position: "absolute",
    top: 1770,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  ctaLine: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 48,
    letterSpacing: -1,
    textAlign: "center",
    lineHeight: 50,
  },
  ctaAccent: {
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  footerUrl: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 22,
    letterSpacing: 6,
    textAlign: "center",
  },
});
