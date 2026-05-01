import { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Redirect } from "expo-router";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { ChevronLeft, Share2 } from "lucide-react-native";
import { useI18n } from "@/src/lib/i18n";
import {
  getBadge,
  formatValue,
  computeScore,
  type MetricType,
} from "@/src/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";
import { useUnitSystem } from "@/src/hooks/useUnitSystem";
import { formatTextUnits } from "@/src/lib/units";
import { ShareCard } from "@/src/components/ShareCard";
import { useUserProfile } from "@/src/hooks/useUserProfile";

const TIER_PALETTES = {
  rookie: { primary: "#4DAA7A", glow: "rgba(77, 170, 122, 0.6)", emoji: "🌱", stars: 1, label: "ROOKIE" },
  solid:  { primary: "#00D4FF", glow: "rgba(0, 212, 255, 0.6)", emoji: "💪", stars: 2, label: "SOLID" },
  beast:  { primary: "#00FF88", glow: "rgba(0, 255, 136, 0.6)", emoji: "🔥", stars: 3, label: "BEAST" },
  elite:  { primary: "#FF6B35", glow: "rgba(255, 107, 53, 0.6)", emoji: "⚡", stars: 4, label: "ELITE" },
  king:   { primary: "#FFD700", glow: "rgba(255, 215, 0, 0.7)", emoji: "👑", stars: 5, label: "KING" },
} as const;

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

const getCategoryLabel = (cat: string, lang: "fr" | "en"): string => {
  const key = (cat || "").toLowerCase() as keyof typeof CATEGORY_LABEL.fr;
  return CATEGORY_LABEL[lang][key] || (cat || "").toUpperCase();
};

const EGO_BAIT = {
  rookie: {
    fr: { line1: "J'ai osé.", line2: "Et toi ?" },
    en: { line1: "I dared.", line2: "You ?" },
  },
  solid: {
    fr: { line1: "Pas mal.", line2: "Fais mieux." },
    en: { line1: "Not bad.", line2: "Do better." },
  },
  beast: {
    fr: { line1: "Performance brutale.", line2: "À toi de jouer." },
    en: { line1: "Brutal performance.", line2: "Your turn." },
  },
  elite: {
    fr: { line1: "TOP 5% MONDIAL.", line2: "Bats-moi si tu peux." },
    en: { line1: "TOP 5% WORLDWIDE.", line2: "Beat me if you can." },
  },
  king: {
    fr: { line1: "#1 MONDIAL.", line2: "PERSONNE NE FAIT MIEUX." },
    en: { line1: "#1 WORLDWIDE.", line2: "NOBODY DOES BETTER." },
  },
} as const;

const renderStars = (active: number, total: number = 5): string =>
  "★".repeat(active) + "☆".repeat(total - active);

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function Result() {
  const { slug, id, value, metric, unit } = useLocalSearchParams<{
    slug: string;
    id: string;
    value: string;
    metric: string;
    unit: string;
  }>();

  if (!slug && !id) return <Redirect href="/(tabs)/feed/" />;

  const { lang } = useI18n();
  const { unitSystem } = useUnitSystem();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile } = useUserProfile();
  const shareCardRef = useRef<View>(null);

  const scoreScale = useRef(new Animated.Value(0.5)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["challenges-feed"] });
    queryClient.invalidateQueries({ queryKey: ["user-attempts-set", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["user-best-scores", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["attempt-counts"] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["challenge-top-attempts", id] });
      queryClient.invalidateQueries({ queryKey: ["challenge-attempt-count", id] });
    }
  }, [queryClient, user?.id, id]);

  useEffect(() => {
    Animated.spring(scoreScale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [scoreScale]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaScale, {
          toValue: 1.02,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ctaScale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ctaScale]);

  const rawValue = parseFloat(value || "0") || 0;
  const metricType = (metric || "time") as MetricType;

  const { data: challenge, isLoading: challengeLoading } = useQuery({
    queryKey: ["challenge-result", id || slug],
    queryFn: async () => {
      if (id) {
        const { data } = await supabase.from("challenges").select("*").eq("id", id).single();
        return data || null;
      }
      const { data } = await supabase.from("challenges").select("*");
      return (
        (data || []).find((c: any) => {
          const generated = c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          return generated === slug;
        }) || null
      );
    },
  });

  const { data: allAttempts = [] } = useQuery({
    queryKey: ["challenge-attempts-result", challenge?.id],
    queryFn: async () => {
      if (!challenge) return [];
      const { data } = await supabase.from("attempts").select("score").eq("challenge_id", challenge.id);
      return data || [];
    },
    enabled: !!challenge?.id,
  });

  const score = useMemo(() => {
    try {
      const s = computeScore(rawValue, metricType, (challenge as any)?.scoring_logic);
      return typeof s === "number" && isFinite(s) ? s : 0;
    } catch { return 0; }
  }, [rawValue, metricType, challenge]);

  const displayValue = useMemo(() => {
    try {
      if (challenge?.category === "flechette" || unit === "pts") return `${rawValue} pts`;
      if (metricType === "reps") return `${rawValue} reps`;
      if (metricType === "distance") return formatTextUnits(`${rawValue} km`, unitSystem);
      if (metricType === "weight") return formatTextUnits(`${rawValue} kg`, unitSystem);
      return formatValue(rawValue, metricType, unit || "sec");
    } catch { return `${rawValue} ${unit}`; }
  }, [rawValue, metricType, unit, unitSystem, challenge]);

  const totalAttempts = allAttempts.length || 1;
  const betterCount = allAttempts.filter((a: any) => (a?.score || 0) > score).length;
  const rank = betterCount + 1;
  const percentileValue = (betterCount / totalAttempts) * 100;
  const badge = getBadge(percentileValue);
  const palette = TIER_PALETTES[badge as keyof typeof TIER_PALETTES] || TIER_PALETTES.rookie;
  const localeKey: "fr" | "en" = lang === "en" ? "en" : "fr";
  const egoBait = EGO_BAIT[badge as keyof typeof EGO_BAIT][localeKey];

  const title = challenge
    ? formatTextUnits(
        lang === "en" && challenge.title_en ? challenge.title_en : challenge.title,
        unitSystem,
      )
    : "";

  const categoryLabel = getCategoryLabel(challenge?.category || "", localeKey);

  const handleShare = async () => {
    try {
      if (!shareCardRef.current) return;
      const uri = await captureRef(shareCardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(
          lang === "fr"
            ? "Le partage n'est pas pris en charge sur cet appareil."
            : "Sharing is not supported on this device.",
        );
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: lang === "fr" ? "Partager ma carte" : "Share my card",
      });
    } catch (err) {
      console.warn("Share failed", err);
      Alert.alert(
        lang === "fr" ? "Erreur" : "Error",
        lang === "fr" ? "Impossible de partager pour le moment." : "Unable to share right now.",
      );
    }
  };

  if (challengeLoading || !challenge) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color="#00FF88" size="large" />
        <Text style={styles.loadingText}>
          {lang === "fr" ? "Chargement de ton exploit..." : "Loading your performance..."}
        </Text>
      </SafeAreaView>
    );
  }

  const displayScore = Math.max(1, Math.min(100, Math.round(score)));
  const handleBack = () => {
    if (router.canDismiss()) router.dismiss();
    else router.back();
  };

  const shareLabel = lang === "fr" ? "Partager ma carte" : "Share my card";

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      {/* offscreen ShareCard for capture */}
      <View style={styles.offscreen} pointerEvents="none" collapsable={false}>
        <ShareCard
          ref={shareCardRef}
          locale={lang}
          username={profile?.username || ""}
          avatarUrl={profile?.avatar_url || undefined}
          challengeName={title}
          score={score}
          performance={displayValue}
          rank={rank}
          badge={badge}
          totalAttempts={totalAttempts}
          category={challenge?.category || ""}
        />
      </View>

      <View style={styles.main}>
        {/* [1] HEADER — back only */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={12}
            style={styles.backButton}
          >
            <ChevronLeft size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* [2] CHALLENGE TITLE */}
        <View style={styles.titleBlock}>
          <Text style={[styles.categoryTag, { color: palette.primary }]} numberOfLines={1}>
            {categoryLabel}
          </Text>
          <Text
            style={styles.title}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {title}
          </Text>
        </View>

        {/* [3] SCORE BLOCK */}
        <View style={styles.scoreBlock}>
          <Text
            style={[styles.stars, { color: palette.primary }]}
            allowFontScaling={false}
          >
            {renderStars(palette.stars)}
          </Text>
          <Animated.View style={{ transform: [{ scale: scoreScale }] }}>
            <Text
              style={[
                styles.score,
                {
                  color: palette.primary,
                  textShadowColor: palette.glow,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              allowFontScaling={false}
            >
              {displayScore}
            </Text>
          </Animated.View>
          <Text style={styles.scoreLabel}>SCORE / 100</Text>
          <View
            style={[
              styles.tierPill,
              {
                backgroundColor: hexToRgba(palette.primary, 0.15),
                borderColor: palette.primary,
              },
            ]}
          >
            <Text style={styles.tierEmoji} allowFontScaling={false}>
              {palette.emoji}
            </Text>
            <Text style={[styles.tierLabel, { color: palette.primary }]}>
              {palette.label}
            </Text>
          </View>
        </View>

        {/* [4] EGO-BAIT */}
        <View style={styles.egoBlock}>
          <Text
            style={styles.egoLine1}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {egoBait.line1}
          </Text>
          <Text
            style={[
              styles.egoLine2,
              { color: palette.primary, textShadowColor: palette.glow },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {egoBait.line2}
          </Text>
        </View>

        {/* [5] STATS */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCell,
              {
                backgroundColor: hexToRgba(palette.primary, 0.05),
                borderColor: hexToRgba(palette.primary, 0.4),
              },
            ]}
          >
            <Text style={styles.statLabel} numberOfLines={1}>
              {lang === "fr" ? "PERFORMANCE" : "PERFORMANCE"}
            </Text>
            <Text
              style={styles.statValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {displayValue}
            </Text>
          </View>
          <View
            style={[
              styles.statCell,
              {
                backgroundColor: hexToRgba(palette.primary, 0.05),
                borderColor: hexToRgba(palette.primary, 0.4),
              },
            ]}
          >
            <Text style={styles.statLabel} numberOfLines={1}>
              {lang === "fr" ? "RANG MONDIAL" : "WORLD RANK"}
            </Text>
            <Text
              style={styles.statValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              #{rank}
            </Text>
          </View>
        </View>

        {/* [6] CTA */}
        <View style={styles.ctaBlock}>
          <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.85}
              style={[
                styles.ctaButton,
                {
                  backgroundColor: palette.primary,
                  shadowColor: palette.glow,
                },
              ]}
            >
              <Share2 size={20} color="#000000" />
              <Text style={styles.ctaText}>{shareLabel}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  loading: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#888888",
    marginTop: 16,
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  offscreen: { position: "absolute", left: -10000, top: -10000 },

  main: { flex: 1, justifyContent: "space-between" },

  // [1] header
  header: {
    height: 60,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  backButton: { alignSelf: "flex-start", padding: 4 },

  // [2] title
  titleBlock: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 4,
    maxHeight: 100,
  },
  categoryTag: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    letterSpacing: 4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 24,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
  },

  // [3] score
  scoreBlock: { alignItems: "center", gap: 12, paddingHorizontal: 24 },
  stars: {
    fontFamily: "Poppins_700Bold",
    fontSize: 28,
    letterSpacing: 8,
  },
  score: {
    fontFamily: "Poppins_800ExtraBold",
    fontWeight: "900",
    fontSize: 200,
    lineHeight: 220,
    letterSpacing: -8,
    textAlign: "center",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
    includeFontPadding: false,
  },
  scoreLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#888888",
    letterSpacing: 4,
    marginTop: 8,
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 4,
  },
  tierEmoji: { fontSize: 18 },
  tierLabel: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 16,
    letterSpacing: 4,
  },

  // [4] ego-bait
  egoBlock: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginVertical: 24,
  },
  egoLine1: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  egoLine2: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginTop: 4,
  },

  // [5] stats
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    height: 110,
  },
  statCell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
  },
  statLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#888888",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  statValue: {
    fontFamily: "Poppins_800ExtraBold",
    fontWeight: "900",
    fontSize: 28,
    color: "#FFFFFF",
    letterSpacing: -1,
  },

  // [6] CTA
  ctaBlock: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
  },
  ctaButton: {
    height: 64,
    borderRadius: 32,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    shadowOpacity: 0.6,
    elevation: 12,
  },
  ctaText: {
    fontFamily: "Poppins_800ExtraBold",
    fontWeight: "800",
    fontSize: 18,
    color: "#000000",
  },
});
