import { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { FadeInView } from "@/src/components/ui/FadeInView";
import { Settings, Camera, LogOut, Crown, ChevronRight } from "lucide-react-native";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useUserProfile, useInvalidateProfile, avatarWithCache } from "@/src/hooks/useUserProfile";
import { BADGE_CONFIG, getBadge } from "@/src/lib/types";
import { formatTextUnits, type UnitSystem } from "@/src/lib/units";
import { useI18n } from "@/src/lib/i18n";

function slugify(title?: string) {
  if (!title) return "challenge";
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProfileScreen() {
  const { lang } = useI18n();
  const { user, signOut } = useAuth();
  const [showKingsOnly, setShowKingsOnly] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(15);

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const invalidateProfile = useInvalidateProfile();
  const unitSystem = ((profile as any)?.unit_system as UnitSystem) || "metric";

  const { data: allAttempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ["all-attempts-for-live-badges"],
    queryFn: async () => {
      const { data } = await supabase
        .from("attempts")
        .select("id, challenge_id, user_id, score, time_or_reps, created_at");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ["challenges-list"],
    queryFn: async () => {
      const { data } = await supabase.from("challenges").select("*");
      return data || [];
    },
    enabled: !!user,
  });

  const isLoading = profileLoading || attemptsLoading;

  const { liveBadgeCounts, globalScore, historyWithBadges } = useMemo(() => {
    const counts: Record<string, number> = { king: 0, elite: 0, beast: 0, solid: 0, rookie: 0 };
    let totalXP = 0;

    if (!user || allAttempts.length === 0)
      return { liveBadgeCounts: counts, globalScore: 0, historyWithBadges: [] as any[] };

    const userAttempts = allAttempts.filter((a: any) => a.user_id === user.id);
    const userBestByChallenge: Record<string, any> = {};

    userAttempts.forEach((a: any) => {
      if (!userBestByChallenge[a.challenge_id] || a.score > userBestByChallenge[a.challenge_id].score)
        userBestByChallenge[a.challenge_id] = a;
    });

    const historyBadgesMap: Record<string, string> = {};

    Object.entries(userBestByChallenge).forEach(([challengeId, bestAttempt]: [string, any]) => {
      totalXP += bestAttempt.score;
      const challengeScores = allAttempts
        .filter((a: any) => a.challenge_id === challengeId)
        .map((a: any) => a.score);
      const betterCount = challengeScores.filter((s: number) => s > bestAttempt.score).length;
      const percentile = (betterCount / challengeScores.length) * 100;
      const badge = getBadge(percentile);
      counts[badge]++;
      historyBadgesMap[challengeId] = badge;
    });

    const history = userAttempts
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .map((attempt: any) => ({
        ...attempt,
        currentBadge: historyBadgesMap[attempt.challenge_id] || "rookie",
      }));

    return { liveBadgeCounts: counts, globalScore: totalXP, historyWithBadges: history };
  }, [allAttempts, user]);

  const handleAvatarChange = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        lang === "fr" ? "Permission requise" : "Permission required",
        lang === "fr" ? "Active l'accès à la galerie dans les réglages." : "Enable gallery access in settings.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0] || !user) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert(lang === "fr" ? "Photo trop lourde (max 5 Mo)" : "Photo too large (max 5 MB)");
      return;
    }
    try {
      const ext = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";
      const filePath = `${user.id}/avatar.${ext}`;
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: "base64" as const,
      });
      const blob = await (await fetch(`data:${mimeType};base64,${base64}`)).blob();
      await supabase.storage.from("avatars").upload(filePath, blob, { contentType: mimeType, upsert: true });
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarWithTs = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.from("users").update({ avatar_url: avatarWithTs }).eq("id", user.id);
      invalidateProfile();
      Alert.alert(lang === "fr" ? "Photo mise à jour !" : "Photo updated!");
    } catch {
      Alert.alert(lang === "fr" ? "Erreur upload" : "Upload error");
    }
  };

  const displayedHistory = useMemo(() => {
    const h = showKingsOnly
      ? historyWithBadges.filter((a: any) => a.currentBadge === "king")
      : historyWithBadges;
    return h.slice(0, historyLimit);
  }, [historyWithBadges, showKingsOnly, historyLimit]);

  const totalKings = liveBadgeCounts["king"] || 0;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={["top"]}>
        <ActivityIndicator color="#00FF87" size="large" />
      </SafeAreaView>
    );
  }

  const avatarSrc = avatarWithCache(profile?.avatar_url, profile?.gender);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 112 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row justify-end mb-2">
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile/settings")}
            className="p-2 bg-card border border-border rounded-full"
          >
            <Settings size={20} color="#888888" />
          </TouchableOpacity>
        </View>

        <FadeInView duration={400} className="items-center mb-8">
          <View className="relative mb-4">
            <View className="w-24 h-24 rounded-full p-1 border-2 border-primary overflow-hidden">
              {avatarSrc ? (
                <Image
                  source={{ uri: avatarSrc }}
                  style={{ width: "100%", height: "100%", borderRadius: 48 }}
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full rounded-full bg-muted items-center justify-center">
                  <Text className="text-2xl font-black text-primary">
                    {(profile?.username || "A").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={handleAvatarChange}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center"
              style={{ shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }}
            >
              <Camera size={14} color="#000000" />
            </TouchableOpacity>
          </View>

          <Text className="text-2xl font-black text-foreground">@{profile?.username || "Athlete"}</Text>
          {profile?.mantra ? (
            <Text className="text-sm text-muted-foreground italic mt-1">"{profile.mantra}"</Text>
          ) : null}
          {profile?.country ? (
            <Text className="text-xs text-muted-foreground mt-1">{profile.country}</Text>
          ) : null}

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile/settings")}
            className="mt-3 px-4 py-1.5 rounded-full border border-border"
          >
            <Text className="text-xs font-bold text-muted-foreground">
              {lang === "fr" ? "Modifier le profil" : "Edit profile"}
            </Text>
          </TouchableOpacity>
        </FadeInView>

        <FadeInView duration={350} delay={100} style={{ flexDirection: "row", marginBottom: 24 }}>
          <View className="flex-1 bg-card rounded-2xl p-4 border border-border items-center mr-2">
            <Text className="text-3xl font-black text-foreground">{historyWithBadges.length}</Text>
            <Text className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
              {lang === "fr" ? "Tentatives" : "Attempts"}
            </Text>
          </View>
          <View className="flex-1 bg-primary rounded-2xl p-4 items-center ml-2">
            <Text className="text-3xl font-black text-black">{globalScore.toLocaleString()}</Text>
            <Text className="text-[10px] font-black uppercase tracking-widest text-black/80">
              {lang === "fr" ? "Score Global" : "Global Score"}
            </Text>
          </View>
        </FadeInView>

        <FadeInView duration={350} delay={200} className="bg-card rounded-2xl p-5 border border-border mb-6">
          <Text className="font-black text-xs text-muted-foreground uppercase tracking-widest mb-4">
            {lang === "fr" ? "Titres Actuels" : "Current Titles"}
          </Text>
          <View className="flex-row justify-between">
            {(["king", "elite", "beast", "solid", "rookie"] as const).map((b) => {
              const config = BADGE_CONFIG[b];
              const count = liveBadgeCounts[b] || 0;
              return (
                <View
                  key={b}
                  className="items-center"
                  style={{ opacity: count > 0 ? 1 : 0.1 }}
                >
                  <View style={{ position: "relative" }}>
                    <Text style={{ fontSize: 30 }}>{config.emoji}</Text>
                    {count > 0 && (
                      <View
                        style={{
                          position: "absolute",
                          top: -4,
                          right: -8,
                          backgroundColor: "#00FF87",
                          borderRadius: 10,
                          paddingHorizontal: 4,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: "900", color: "#000" }}>{count}</Text>
                      </View>
                    )}
                  </View>
                  <Text className={`text-[8px] font-black uppercase mt-1 ${config.colorClass}`}>
                    {lang === "fr" ? config.label_fr : config.label_en}
                  </Text>
                </View>
              );
            })}
          </View>
        </FadeInView>

        <FadeInView duration={350} delay={300} className="bg-card rounded-2xl p-5 border border-border mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-black text-xs text-muted-foreground uppercase tracking-widest">
              {lang === "fr" ? "Historique des Défis" : "Challenge History"}
            </Text>
            {totalKings > 0 && (
              <TouchableOpacity
                onPress={() => { setShowKingsOnly(!showKingsOnly); setHistoryLimit(15); }}
                className={`flex-row items-center px-3 py-1 rounded-full border ${
                  showKingsOnly
                    ? "bg-yellow-500/20 border-yellow-500/30"
                    : "bg-muted border-border"
                }`}
              >
                <Crown size={10} color={showKingsOnly ? "#CA8A04" : "#888888"} />
                <Text
                  className={`text-[10px] font-black ml-1 ${
                    showKingsOnly ? "text-[#CA8A04]" : "text-muted-foreground"
                  }`}
                >
                  {lang === "fr" ? "Kings" : "Kings only"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View>
            {displayedHistory.length === 0 ? (
              <Text className="text-xs text-muted-foreground text-center py-4">
                {lang === "fr" ? "Aucun défi trouvé." : "No challenges found."}
              </Text>
            ) : (
              displayedHistory.map((attempt: any) => {
                const challenge = challenges.find((c: any) => c.id === attempt.challenge_id);
                const isKing = attempt.currentBadge === "king";
                const challengeTitle = challenge?.title || "Challenge";
                const slug = slugify(challengeTitle);

                return (
                  <TouchableOpacity
                    key={attempt.id}
                    onPress={() => router.push(`/(tabs)/feed/${slug}?id=${challenge?.id}`)}
                    className={`flex-row items-center justify-between pb-3 mb-3 border-b border-border/50 ${
                      isKing ? "bg-yellow-500/5 -mx-2 px-2 rounded-lg" : ""
                    }`}
                    style={{ borderBottomWidth: 0.5 }}
                  >
                    <View className="flex-1 pr-4">
                      <View className="flex-row items-center">
                        <Text className="font-bold text-sm text-foreground" numberOfLines={1} style={{ flex: 1 }}>
                          {formatTextUnits(challengeTitle, unitSystem)}
                        </Text>
                        {isKing && <Text style={{ fontSize: 12, marginLeft: 6 }}>👑</Text>}
                      </View>
                      <Text className="text-[10px] text-muted-foreground">{attempt.time_or_reps}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="items-end mr-2">
                        <Text className={`font-black ${isKing ? "text-[#CA8A04]" : "text-primary"}`}>
                          {attempt.score}
                        </Text>
                        <Text className="text-[8px] font-bold text-muted-foreground uppercase">XP</Text>
                      </View>
                      <ChevronRight size={14} color="#333333" />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {historyWithBadges.length > historyLimit && (
            <TouchableOpacity
              onPress={() => setHistoryLimit(historyLimit + 15)}
              className="w-full mt-4 py-2 rounded-xl border border-border items-center"
            >
              <Text className="text-xs font-bold text-muted-foreground">
                {lang === "fr"
                  ? `Voir plus (${historyWithBadges.length - historyLimit} restants)`
                  : `Show more (${historyWithBadges.length - historyLimit} remaining)`}
              </Text>
            </TouchableOpacity>
          )}
        </FadeInView>

        <FadeInView duration={350} delay={400}>
          <TouchableOpacity
            onPress={async () => {
              await signOut();
              router.replace("/(public)/landing");
            }}
            className="w-full py-4 rounded-2xl bg-red-500/10 flex-row items-center justify-center"
          >
            <LogOut size={16} color="#EF4444" />
            <Text className="text-red-500 font-black text-sm ml-2">
              {lang === "fr" ? "Déconnexion" : "Sign out"}
            </Text>
          </TouchableOpacity>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}
