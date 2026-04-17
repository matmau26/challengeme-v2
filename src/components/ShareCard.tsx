import { forwardRef } from "react";
import { View, Text } from "react-native";
import { Crown, Trophy, Flame, ThumbsUp, Sprout } from "lucide-react-native";
import { BADGE_CONFIG } from "@/src/lib/types";

interface ShareCardProps {
  title: string;
  badge: string;
  score: number;
  username: string;
  lang: string;
  performance: string;
  rank: number;
}

const BADGE_COLORS: Record<string, string> = {
  king: "#EAB308",
  elite: "#F59E0B",
  beast: "#00FF87",
  solid: "#60A5FA",
  rookie: "#9CA3AF",
};

function BadgeIcon({ badge, color }: { badge: string; color: string }) {
  const props = { size: 88, strokeWidth: 1.5, color };
  switch (badge) {
    case "king":  return <Crown {...props} />;
    case "elite": return <Trophy {...props} />;
    case "beast": return <Flame {...props} />;
    case "solid": return <ThumbsUp {...props} />;
    default:      return <Sprout {...props} />;
  }
}

export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  { title, badge, score, username, lang, performance, rank },
  ref,
) {
  const color = BADGE_COLORS[badge] || "#00FF87";
  const badgeConfig = BADGE_CONFIG[badge as keyof typeof BADGE_CONFIG];
  const badgeLabel = badgeConfig
    ? lang === "fr" ? badgeConfig.label_fr : badgeConfig.label_en
    : badge.toUpperCase();

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ width: 1080, height: 1920, backgroundColor: "#0A0A0A" }}
      className="items-center justify-between py-24 px-16"
    >
      <View className="items-center">
        <Text
          style={{ fontSize: 72, letterSpacing: -2 }}
          className="font-black tracking-tight"
        >
          <Text style={{ color: "#00FF87" }}>ChallengeMe</Text>
          <Text style={{ color: "#FFFFFF" }}> ⚡</Text>
        </Text>
        <View
          style={{ backgroundColor: "#1A1A1A", marginTop: 24 }}
          className="px-8 py-3 rounded-full border border-white/10"
        >
          <Text
            style={{ fontSize: 24, letterSpacing: 4, color: "#888888" }}
            className="font-black uppercase"
          >
            {lang === "fr" ? "Défi Relevé" : "Challenge Crushed"}
          </Text>
        </View>
      </View>

      <View className="items-center" style={{ paddingHorizontal: 40 }}>
        <Text
          style={{ fontSize: 64, color: "#FFFFFF", lineHeight: 72 }}
          className="font-black text-center uppercase italic"
          numberOfLines={3}
        >
          {title}
        </Text>
      </View>

      <View className="items-center">
        <View
          style={{
            width: 280,
            height: 280,
            borderRadius: 140,
            backgroundColor: "#0F0F0F",
            borderWidth: 6,
            borderColor: color,
          }}
          className="items-center justify-center"
        >
          <BadgeIcon badge={badge} color={color} />
        </View>
        <View
          style={{
            backgroundColor: badge === "king" ? color : "transparent",
            borderWidth: 3,
            borderColor: color,
            paddingVertical: 10,
            paddingHorizontal: 36,
            borderRadius: 40,
            marginTop: -24,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "900",
              color: badge === "king" ? "#000" : color,
              letterSpacing: 4,
            }}
            className="uppercase"
          >
            {badgeLabel}
          </Text>
        </View>
      </View>

      <View className="items-center">
        <Text
          style={{ fontSize: 220, lineHeight: 220, color: "#FFFFFF", letterSpacing: -8 }}
          className="font-black"
        >
          {score.toLocaleString()}
        </Text>
        <Text
          style={{ fontSize: 28, color: color, letterSpacing: 6, marginTop: 8 }}
          className="font-black uppercase"
        >
          XP Points
        </Text>
      </View>

      <View className="flex-row" style={{ gap: 24 }}>
        <View
          style={{ backgroundColor: "#1A1A1A", paddingHorizontal: 32, paddingVertical: 20 }}
          className="rounded-3xl items-center"
        >
          <Text
            style={{ fontSize: 20, color: "#888888", letterSpacing: 3 }}
            className="font-black uppercase"
          >
            Perf
          </Text>
          <Text
            style={{ fontSize: 40, color: "#00FF87", marginTop: 6 }}
            className="font-black italic"
          >
            {performance}
          </Text>
        </View>
        <View
          style={{ backgroundColor: "#1A1A1A", paddingHorizontal: 32, paddingVertical: 20 }}
          className="rounded-3xl items-center"
        >
          <Text
            style={{ fontSize: 20, color: "#888888", letterSpacing: 3 }}
            className="font-black uppercase"
          >
            {lang === "fr" ? "Rang" : "Rank"}
          </Text>
          <Text
            style={{ fontSize: 40, color: "#00FF87", marginTop: 6 }}
            className="font-black italic"
          >
            #{rank}
          </Text>
        </View>
      </View>

      <View className="items-center">
        <Text
          style={{ fontSize: 32, color: "#888888", letterSpacing: 3 }}
          className="font-black uppercase"
        >
          @{username}
        </Text>
        <Text
          style={{ fontSize: 22, color: "#555555", marginTop: 12, letterSpacing: 2 }}
          className="font-bold uppercase"
        >
          {lang === "fr" ? "Bats mon score sur ChallengeMe" : "Beat my score on ChallengeMe"}
        </Text>
      </View>
    </View>
  );
});
