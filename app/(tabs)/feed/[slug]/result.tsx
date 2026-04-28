import { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Redirect } from "expo-router";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { FadeInView } from "@/src/components/ui/FadeInView";
import { ChevronLeft, Crown, Share2 } from "lucide-react-native";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
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
  const isKing = badge === "king" && rank === 1;

  const title = challenge
    ? formatTextUnits(
        lang === "en" && challenge.title_en ? challenge.title_en : challenge.title,
        unitSystem,
      )
    : "";

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
        dialogTitle: lang === "fr" ? "Partager ma performance" : "Share my performance",
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
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#00FF88" size="large" />
        <Text className="text-muted-foreground text-sm mt-4">
          {lang === "fr" ? "Chargement de ton exploit..." : "Loading your performance..."}
        </Text>
      </SafeAreaView>
    );
  }

  const displayScore = Math.max(1, Math.min(100, Math.round(score)));
  const scoreColor = isKing ? "#FFD700" : "#00FF88";
  const handleRetry = () => {
    if (router.canDismiss()) router.dismiss();
    else router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }} edges={["top", "bottom"]}>
      <View
        style={{ position: "absolute", left: -10000, top: -10000 }}
        pointerEvents="none"
        collapsable={false}
      >
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
        />
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 }}>
        <TouchableOpacity
          onPress={handleRetry}
          activeOpacity={0.7}
          hitSlop={12}
          style={{ alignSelf: "flex-start", padding: 4 }}
        >
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: "100%", maxWidth: 480, alignItems: "stretch" }}>
          <FadeInView duration={400} style={{ alignItems: "center", marginBottom: 32 }}>
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 12,
                letterSpacing: 8,
                color: "#7A8580",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              {lang === "fr" ? "Défi" : "Challenge"}
            </Text>
            <Text
              style={{
                fontFamily: "Poppins_800ExtraBold",
                fontSize: 28,
                letterSpacing: -1,
                color: "#FFFFFF",
                textAlign: "center",
                textTransform: "uppercase",
              }}
              numberOfLines={2}
            >
              {title}
            </Text>
          </FadeInView>

          <FadeInView
            duration={500}
            delay={100}
            style={{ alignItems: "center", marginBottom: 24 }}
          >
            <View
              style={{
                width: 280,
                height: 200,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Svg
                width={280}
                height={200}
                viewBox="0 0 280 200"
                style={{ position: "absolute", top: 0, left: 0 }}
                pointerEvents="none"
              >
                <Defs>
                  <RadialGradient
                    id="scoreHalo"
                    cx="50%"
                    cy="50%"
                    r="50%"
                  >
                    <Stop offset="0%" stopColor={scoreColor} stopOpacity={0.4} />
                    <Stop offset="50%" stopColor={scoreColor} stopOpacity={0.1} />
                    <Stop offset="100%" stopColor={scoreColor} stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width="280" height="200" fill="url(#scoreHalo)" />
              </Svg>
              <Text
                style={{
                  fontFamily: "Poppins_800ExtraBold",
                  fontSize: 140,
                  lineHeight: 160,
                  letterSpacing: -6,
                  color: scoreColor,
                  textAlign: "center",
                  textShadowColor: scoreColor,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: isKing ? 30 : 20,
                  includeFontPadding: false,
                }}
              >
                {displayScore}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 11,
                letterSpacing: 6,
                color: "#7A8580",
                textTransform: "uppercase",
                marginTop: 8,
              }}
            >
              Score / 100
            </Text>
          </FadeInView>

          <FadeInView
            duration={400}
            delay={200}
            style={{ alignItems: "center", marginBottom: 24 }}
          >
            {isKing ? (
              <View style={{ alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Crown size={20} color="#FFD700" />
                  <Text
                    style={{
                      fontFamily: "Poppins_800ExtraBold",
                      fontSize: 24,
                      letterSpacing: 8,
                      color: "#FFD700",
                    }}
                  >
                    KING
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: "Poppins_500Medium",
                    fontSize: 10,
                    letterSpacing: 6,
                    color: "#FFD700",
                    opacity: 0.7,
                    marginTop: 6,
                  }}
                >
                  {lang === "fr" ? "— #1 Mondial —" : "— #1 Worldwide —"}
                </Text>
              </View>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 24,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: "#1A1A1A",
                  borderWidth: 1,
                  borderColor: "#3A4540",
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#7A8580",
                    marginRight: 12,
                  }}
                />
                <Text
                  style={{
                    fontFamily: "Poppins_700Bold",
                    fontSize: 13,
                    letterSpacing: 4,
                    color: "#A8B0AC",
                  }}
                >
                  {badge.toUpperCase()}
                </Text>
              </View>
            )}
          </FadeInView>

          <FadeInView
            duration={400}
            delay={300}
            style={{ flexDirection: "row", gap: 12, width: "100%", marginBottom: 32 }}
          >
            <View
              style={{
                flex: 1,
                paddingVertical: 24,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 10,
                  letterSpacing: 3,
                  color: "#7A8580",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {lang === "fr" ? "Performance" : "Performance"}
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins_800ExtraBold",
                  fontSize: 26,
                  letterSpacing: -1,
                  color: "#FFFFFF",
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {displayValue}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                paddingVertical: 24,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: isKing ? 1.5 : 1,
                borderColor: isKing ? "rgba(255,215,0,0.4)" : "rgba(255,255,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 10,
                  letterSpacing: 3,
                  color: "#7A8580",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {lang === "fr" ? "Rang Mondial" : "World Rank"}
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins_800ExtraBold",
                  fontSize: 26,
                  letterSpacing: -1,
                  color: isKing ? "#FFD700" : "#FFFFFF",
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                #{rank}
              </Text>
            </View>
          </FadeInView>

          <FadeInView duration={400} delay={400}>
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.85}
              style={{
                width: "100%",
                paddingVertical: 18,
                borderRadius: 30,
                backgroundColor: scoreColor,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                shadowColor: scoreColor,
                shadowOpacity: 0.4,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
                marginBottom: 16,
              }}
            >
              <Share2 size={18} color="#000000" />
              <Text
                style={{
                  fontFamily: "Poppins_800ExtraBold",
                  fontSize: 16,
                  color: "#000000",
                }}
              >
                {lang === "fr" ? "Partager ma performance" : "Share my performance"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRetry}
              activeOpacity={0.7}
              style={{ alignSelf: "center", paddingVertical: 8 }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_500Medium",
                  fontSize: 14,
                  color: "#7A8580",
                  textAlign: "center",
                }}
              >
                {lang === "fr" ? "Réessayer ce défi →" : "Try again →"}
              </Text>
            </TouchableOpacity>
          </FadeInView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
