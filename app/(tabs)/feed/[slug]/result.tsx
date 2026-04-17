import { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useLocalSearchParams, router, Redirect } from "expo-router";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { FadeInView } from "@/src/components/ui/FadeInView";
import {
  Trophy, Share2, RefreshCcw, Home, Crown, Flame, ThumbsUp, Sprout, ListOrdered,
} from "lucide-react-native";
import { useI18n } from "@/src/lib/i18n";
import {
  BADGE_CONFIG,
  getCategoryConfig,
  getBadge,
  formatValue,
  computeScore,
  type MetricType,
  type Category,
} from "@/src/lib/types";
import { getCategoryIcon } from "@/src/lib/categoryIcon";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";
import { useUserProfile } from "@/src/hooks/useUserProfile";
import { useUnitSystem } from "@/src/hooks/useUnitSystem";
import { formatTextUnits } from "@/src/lib/units";
import { ShareCard } from "@/src/components/ShareCard";

const renderBadgeIcon = (badge: string, color: string) => {
  const props = { size: 52, strokeWidth: 1.5, color };
  switch (badge) {
    case "king":  return <Crown {...props} />;
    case "elite": return <Trophy {...props} />;
    case "beast": return <Flame {...props} />;
    case "solid": return <ThumbsUp {...props} />;
    default:      return <Sprout {...props} />;
  }
};

const getBadgeMotivation = (badge: string, lang: string): string => {
  if (badge === "king") return lang === "fr" ? "TU ES N\u00b01 MONDIAL. D\u00c9FENDS TON TR\u00d4NE." : "YOU ARE #1 WORLDWIDE. DEFEND YOUR THRONE.";
  if (badge === "elite") return lang === "fr" ? "TOP 10% MONDIAL. Tu domines. Partage-le." : "TOP 10% WORLDWIDE. You dominate. Share it.";
  if (badge === "beast") return lang === "fr" ? "TOP 30%. Solide. La prochaine fois tu vises Elite." : "TOP 30%. Solid. Next time aim for Elite.";
  if (badge === "solid") return lang === "fr" ? "Bien jou\u00e9. Tu progresses. Reviens t'am\u00e9liorer." : "Good job. Keep improving. Come back for more.";
  return lang === "fr" ? "Premier essai. Continue, tout le monde commence quelque part." : "First try. Keep going, everyone starts somewhere.";
};

export default function ResultScreen() {
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
  const tabBarHeight = useBottomTabBarHeight();
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const shareRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

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
  const badgeConfig = BADGE_CONFIG[badge];
  const isKing = badge === "king";
  const isElite = badge === "elite";
  const percentileDisplay = Math.max(1, Math.ceil(100 - percentileValue)).toString();

  const badgeColor = {
    king: "#EAB308",
    elite: "#F59E0B",
    beast: "#00FF87",
    solid: "#60A5FA",
    rookie: "#9CA3AF",
  }[badge] || "#00FF87";

  const category = challenge?.category as Category;
  const title = challenge
    ? formatTextUnits(
        lang === "en" && challenge.title_en ? challenge.title_en : challenge.title,
        unitSystem,
      )
    : "";

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const uri = await captureRef(shareRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: lang === "fr" ? "Partager ton exploit" : "Share your performance",
        });
      }
    } catch {
      // User cancelled or capture failed
    } finally {
      setIsSharing(false);
    }
  };

  if (challengeLoading || !challenge) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#00FF87" size="large" />
        <Text className="text-muted-foreground text-sm mt-4">
          {lang === "fr" ? "Chargement de ton exploit..." : "Loading your performance..."}
        </Text>
      </SafeAreaView>
    );
  }

  const username = profile?.username || user?.email?.split("@")[0] || "Athlete";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View
        style={{ position: "absolute", left: -9999, top: 0 }}
        pointerEvents="none"
      >
        <View collapsable={false}>
          <ShareCard
            ref={shareRef}
            title={title}
            badge={badge}
            score={score}
            username={username}
            lang={lang}
            performance={displayValue}
            rank={rank}
          />
        </View>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: tabBarHeight + 24,
          flexGrow: 1,
          justifyContent: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Challenge header */}
        <FadeInView duration={400} className="items-center mb-4">
          <View className="px-3 py-0.5 rounded-full bg-muted/50 border border-border mb-2">
            <Text className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              {lang === "fr" ? "D\u00e9fi Termin\u00e9" : "Challenge Completed"}
            </Text>
          </View>
          <Text
            className="text-xl font-black text-foreground text-center uppercase italic"
            numberOfLines={2}
          >
            {title}
          </Text>
        </FadeInView>

        {/* Badge hero */}
        <FadeInView duration={500} delay={100} className="items-center mb-4">
          <View
            className={`p-4 rounded-full border-4 items-center justify-center ${
              isKing ? "border-[#EAB308]" : isElite ? "border-[#F59E0B]" : "border-border"
            }`}
            style={{ backgroundColor: "#0F0F0F" }}
          >
            {renderBadgeIcon(badge, badgeColor)}
          </View>
          <View
            style={{
              backgroundColor: isKing ? "#EAB308" : "transparent",
              borderWidth: 1.5,
              borderColor: badgeColor,
              paddingVertical: 3,
              paddingHorizontal: 14,
              borderRadius: 20,
              marginTop: -8,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "900",
                color: isKing ? "#000" : badgeColor,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {lang === "fr" ? badgeConfig.label_fr : badgeConfig.label_en}
            </Text>
          </View>
        </FadeInView>

        {/* Score */}
        <FadeInView duration={400} delay={200} className="items-center mb-4">
          <Text
            style={{
              fontSize: 80,
              fontWeight: "900",
              color: "#FFFFFF",
              lineHeight: 80,
              letterSpacing: -3,
            }}
          >
            {score.toLocaleString()}
          </Text>
          <View className="flex-row items-center gap-2 mt-6">
            <View style={{ width: 24, height: 1, backgroundColor: "rgba(255,255,255,0.1)" }} />
            <Text className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              XP Points
            </Text>
            <View style={{ width: 24, height: 1, backgroundColor: "rgba(255,255,255,0.1)" }} />
          </View>
        </FadeInView>

        {/* Stats */}
        <FadeInView duration={400} delay={300} className="flex-row gap-2 mb-4 mx-2">
          {[
            { label: "Performance", value: displayValue },
            { label: lang === "fr" ? "Rang Mondial" : "World Rank", value: `#${rank}` },
          ].map((s, i) => (
            <View
              key={i}
              className="flex-1 bg-card/60 border border-border py-4 px-3 rounded-2xl items-center"
            >
              <Text className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                {s.label}
              </Text>
              <Text className="text-lg font-black text-primary italic" numberOfLines={1}>
                {s.value}
              </Text>
            </View>
          ))}
        </FadeInView>

        {/* Motivation */}
        <FadeInView duration={400} delay={400} className="items-center mb-6 px-4">
          <Text
            className="text-[10px] font-black uppercase tracking-widest text-center leading-relaxed"
            style={{ color: isKing ? "#EAB308" : isElite ? "#F59E0B" : "#888888" }}
          >
            {getBadgeMotivation(badge, lang)}
          </Text>
          {!isKing && (
            <Text className="text-[10px] text-muted-foreground mt-1">
              {lang === "fr" ? "Top " : "Top "}
              <Text className="text-primary font-black">{percentileDisplay}%</Text>
              {lang === "fr" ? " des athl\u00e8tes mondiaux" : " of worldwide athletes"}
            </Text>
          )}
        </FadeInView>

        {/* Action buttons */}
        <FadeInView duration={400} delay={500} className="gap-3 mx-2">
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            activeOpacity={0.85}
            className="w-full py-5 rounded-2xl bg-orange-500 flex-row items-center justify-center gap-2"
            style={{
              shadowColor: "#F97316",
              shadowOpacity: 0.4,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 6,
              opacity: isSharing ? 0.6 : 1,
            }}
          >
            {isSharing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Share2 size={20} color="#000" />
            )}
            <Text className="text-black font-black text-base uppercase tracking-wide">
              {isSharing
                ? lang === "fr" ? "G\u00e9n\u00e9ration..." : "Generating..."
                : lang === "fr" ? "Partage ton exploit" : "Share your performance"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row gap-3">
            {[
              {
                icon: <RefreshCcw size={14} color="#888888" />,
                label: lang === "fr" ? "R\u00e9essayer" : "Try again",
                onPress: () => router.back(),
              },
              {
                icon: <ListOrdered size={14} color="#888888" />,
                label: lang === "fr" ? "Classement" : "Leaderboard",
                onPress: () => router.replace({ pathname: "/(tabs)/leaderboard/" }),
              },
              {
                icon: <Home size={14} color="#888888" />,
                label: lang === "fr" ? "Accueil" : "Home",
                onPress: () => router.replace({ pathname: "/(tabs)/feed/" }),
              },
            ].map((btn, i) => (
              <TouchableOpacity
                key={i}
                onPress={btn.onPress}
                className="flex-1 py-3 px-4 rounded-xl bg-muted/50 border border-border/50 flex-row items-center justify-center gap-2"
              >
                {btn.icon}
                <Text className="text-muted-foreground font-bold text-[10px] uppercase">
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}
