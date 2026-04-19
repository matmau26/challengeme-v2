import { useCallback, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { FadeInView } from "@/src/components/ui/FadeInView";
import { useI18n } from "@/src/lib/i18n";
import { getCategoryConfig } from "@/src/lib/types";
import { getCategoryIcon } from "@/src/lib/categoryIcon";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";
import { Plus, Trophy, Dumbbell, X } from "lucide-react-native";
import { UserAvatar } from "@/src/components/UserAvatar";
import { useUnitSystem } from "@/src/hooks/useUnitSystem";

interface PendingDuel {
  id: string;
  score_to_beat: number | null;
  sender: { username: string | null; avatar_url: string | null } | null;
  challenge: { id: string; title: string; category: string | null } | null;
}

function slugify(title?: string) {
  if (!title) return "challenge";
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function DifficultyDots({ difficulty, color }: { difficulty: number; color: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i < difficulty ? color : "#404040",
          }}
        />
      ))}
    </View>
  );
}

export default function FeedScreen() {
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const { fmt } = useUnitSystem();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("all");
  const [gymOnly, setGymOnly] = useState(false);
  const listRef = useRef<FlatList>(null);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["challenges-feed"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .order("category", { ascending: true })
        .order("title", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: completedChallengeIds = new Set<string>() } = useQuery({
    queryKey: ["user-attempts-set", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      if (!user?.id) return new Set<string>();
      const { data, error } = await supabase
        .from("attempts")
        .select("challenge_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return new Set((data || []).map((a: any) => a?.challenge_id).filter(Boolean));
    },
  });

  const { data: userBestScores = {} } = useQuery({
    queryKey: ["user-best-scores", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      if (!user?.id) return {};
      const { data, error } = await supabase
        .from("attempts")
        .select("challenge_id, score")
        .eq("user_id", user.id)
        .order("score", { ascending: false });
      if (error) return {};
      const best: Record<string, { score: number }> = {};
      for (const a of data || []) {
        if (a.challenge_id && !best[a.challenge_id]) {
          best[a.challenge_id] = { score: a.score };
        }
      }
      return best;
    },
  });

  const { data: attemptCounts = {} } = useQuery({
    queryKey: ["attempt-counts"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("attempts").select("challenge_id");
      if (error) return {};
      const counts: Record<string, number> = {};
      for (const a of data || []) {
        if (a.challenge_id) counts[a.challenge_id] = (counts[a.challenge_id] || 0) + 1;
      }
      return counts;
    },
  });

  const pendingDuelsKey = ["pending-duels", user?.id];
  const { data: pendingDuels = [] } = useQuery<PendingDuel[]>({
    queryKey: pendingDuelsKey,
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select(
          "id, score_to_beat, sender:sender_id(username, avatar_url), challenge:challenge_id(id, title, category)",
        )
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[DUEL] fetch pending notifications error:", error);
        return [];
      }
      return ((data || []) as unknown as PendingDuel[]).filter(
        (d) => d.challenge && d.sender,
      );
    },
  });

  const handleDeclineChallenge = async (duelId: string) => {
    const previous = queryClient.getQueryData<PendingDuel[]>(pendingDuelsKey);
    queryClient.setQueryData<PendingDuel[]>(pendingDuelsKey, (prev) =>
      (prev || []).filter((d) => d.id !== duelId),
    );
    const { error } = await supabase
      .from("notifications")
      .update({ status: "declined" })
      .eq("id", duelId);
    if (error) {
      console.error("[DUEL] decline notification error:", error);
      if (previous) queryClient.setQueryData(pendingDuelsKey, previous);
      Alert.alert(
        lang === "fr" ? "Erreur" : "Error",
        lang === "fr"
          ? "Impossible de refuser le défi. Réessaie."
          : "Could not decline the challenge. Try again.",
      );
    }
  };

  const { data: myGymName = null } = useQuery({
    queryKey: ["my-gym-name", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase.from("users").select("gym_name").eq("id", user.id).single();
      return (data?.gym_name as string | null) || null;
    },
  });

  const { data: gymAttemptCounts = {} } = useQuery({
    queryKey: ["gym-attempt-counts", myGymName],
    enabled: !!myGymName,
    staleTime: 60_000,
    queryFn: async () => {
      if (!myGymName) return {};
      const { data: gymUsers, error: gErr } = await supabase.rpc("get_user_ids_by_gym", {
        gym: myGymName,
      });
      if (gErr) return {};
      const gymUserIds = (gymUsers || []).map((r: { id: string }) => r.id);
      if (gymUserIds.length === 0) return {};
      const { data, error } = await supabase
        .from("attempts")
        .select("challenge_id, user_id")
        .in("user_id", gymUserIds);
      if (error) return {};
      const counts: Record<string, number> = {};
      for (const a of data || []) {
        if (a.challenge_id) counts[a.challenge_id] = (counts[a.challenge_id] || 0) + 1;
      }
      return counts;
    },
  });

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["user-attempts-set", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["user-best-scores", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["attempt-counts"] });
      queryClient.invalidateQueries({ queryKey: ["gym-attempt-counts", myGymName] });
      queryClient.invalidateQueries({ queryKey: ["pending-duels", user?.id] });
    }, [queryClient, user?.id, myGymName]),
  );

  const categories = useMemo(() => {
    const safe = Array.isArray(challenges) ? challenges : [];
    const unique = [...new Set(safe.map((c: any) => c?.category).filter(Boolean) as string[])].sort();
    return ["all", ...unique];
  }, [challenges]);

  const safe = Array.isArray(challenges) ? challenges : [];
  const activeCounts = gymOnly ? gymAttemptCounts : attemptCounts;
  const filtered = (activeCategory === "all"
    ? safe
    : safe.filter((c: any) => c?.category === activeCategory)
  ).filter((c: any) => (gymOnly ? (activeCounts[c?.id] || 0) > 0 : true));

  const renderItem = ({ item: challenge, index: i }: { item: any; index: number }) => {
    if (!challenge) return null;
    const safeCategory = challenge.category || "other";
    const catConfig = getCategoryConfig(safeCategory);
    const rawTitle =
      lang === "en" && challenge.title_en ? challenge.title_en : challenge.title || "Challenge";
    const title = fmt(rawTitle);
    const slug = slugify(challenge.title);
    const emoji = getCategoryIcon(safeCategory);
    const isCompleted = completedChallengeIds.has(challenge.id);
    const attemptCount = activeCounts[challenge.id] || 0;
    const bestAttempt = userBestScores[challenge.id] as { score: number } | undefined;

    return (
      <FadeInView duration={350} delay={i * 50}>
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/feed/${slug}?id=${challenge.id}`)}
          className="bg-card rounded-xl p-4 border border-border mb-3"
          activeOpacity={0.7}
        >
          {challenge.image_url && (
            <View
              className="w-full bg-muted rounded-lg overflow-hidden mb-3"
              style={{ aspectRatio: 16 / 9 }}
            >
              <Image
                source={{ uri: challenge.image_url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>
          )}

          <View className="flex-row items-center gap-3">
            <Text style={{ fontSize: 30 }}>{emoji}</Text>
            <View className="flex-1">
              <Text className="font-bold text-sm text-foreground mb-1" numberOfLines={1}>
                {title}
              </Text>
              <View className="flex-row items-center gap-2 mb-2">
                <View
                  className={`px-2 py-0.5 rounded-full border ${catConfig.bgClass} ${catConfig.borderClass}`}
                >
                  <Text className={`text-[10px] font-bold ${catConfig.textClass}`}>
                    {lang === "fr" ? catConfig.label_fr : catConfig.label_en}
                  </Text>
                </View>
                <View className="ml-2">
                  <DifficultyDots
                    difficulty={Number(challenge.difficulty) || 1}
                    color={catConfig.color || "#888888"}
                  />
                </View>
              </View>
              <View className="flex-row items-center gap-3 flex-wrap">
                {attemptCount > 0 && (
                  <Text className="text-[10px] text-muted-foreground font-bold mt-1">
                    {attemptCount}{" "}
                    {lang === "fr"
                      ? attemptCount > 1 ? "tentatives" : "tentative"
                      : attemptCount > 1 ? "attempts" : "attempt"}
                  </Text>
                )}
                {bestAttempt && (
                  <View className="flex-row items-center gap-1">
                    <Trophy size={10} color="#00FF87" />
                    <Text className="text-[10px] text-primary font-black">
                      {lang === "fr" ? "Mon meilleur : " : "My best: "}
                      {bestAttempt.score} XP
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View className="mt-3">
            <View
              className={`w-full py-2.5 rounded-lg items-center justify-center ${
                isCompleted ? "border border-primary bg-transparent" : "bg-primary"
              }`}
            >
              <Text
                className={`text-xs font-extrabold ${isCompleted ? "text-primary" : "text-black"}`}
              >
                {isCompleted
                  ? lang === "fr" ? "BATTRE MON RECORD \u2192" : "BEAT MY RECORD \u2192"
                  : lang === "fr" ? "RELÈVE LE DÉFI \u2192" : "TAKE THE CHALLENGE \u2192"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </FadeInView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header logo */}
      <View className="px-4 pt-3 pb-2 items-center">
        <Text className="text-xl font-black tracking-tight">
          <Text className="text-primary">ChallengeMe</Text>
          <Text className="text-foreground"> ⚡</Text>
        </Text>
      </View>

      {/* Pending duels */}
      {pendingDuels.length > 0 && (
        <View className="pt-2 pb-1">
          <Text className="px-4 mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {lang === "fr" ? "⚔️ Défis reçus" : "⚔️ Incoming duels"}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          >
            {pendingDuels.map((duel) => {
              const senderName = duel.sender?.username || "Athlete";
              const challengeTitle = fmt(duel.challenge?.title || "Challenge");
              return (
                <TouchableOpacity
                  key={duel.id}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/feed/[slug]",
                      params: {
                        slug: slugify(challengeTitle),
                        id: duel.challenge?.id ?? "",
                        duel_id: duel.id,
                        score_to_beat: String(duel.score_to_beat ?? ""),
                      },
                    })
                  }
                  className="w-72 bg-card border border-orange-500/50 rounded-2xl p-4 relative"
                >
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeclineChallenge(duel.id);
                    }}
                    hitSlop={12}
                    className="absolute top-2 right-2 w-6 h-6 items-center justify-center rounded-full"
                    activeOpacity={0.7}
                  >
                    <X size={14} color="#888888" />
                  </TouchableOpacity>
                  <View className="flex-row items-center gap-2 mb-2 pr-6">
                    <UserAvatar
                      avatarUrl={duel.sender?.avatar_url ?? null}
                      username={senderName}
                      size="sm"
                    />
                    <Text
                      className="text-orange-500 font-black flex-1"
                      numberOfLines={1}
                    >
                      ⚔️ {senderName} {lang === "fr" ? "te défie !" : "challenges you!"}
                    </Text>
                  </View>
                  <Text
                    className="text-foreground font-bold text-sm mb-1"
                    numberOfLines={2}
                  >
                    {challengeTitle}
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    {lang === "fr" ? "Objectif à battre : " : "Score to beat: "}
                    <Text className="text-orange-500 font-black">
                      {duel.score_to_beat ?? "?"}
                    </Text>
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Category filter bar */}
      <View className="bg-background px-4 pb-2 pt-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 items-center">
            <TouchableOpacity
              onPress={() => {
                if (!myGymName) return;
                setGymOnly((v) => !v);
                listRef.current?.scrollToOffset({ offset: 0, animated: true });
              }}
              disabled={!myGymName}
              style={{ height: 30 }}
              className={`flex-row items-center justify-center gap-1.5 px-4 rounded-full ${
                gymOnly
                  ? "bg-primary"
                  : myGymName
                    ? "bg-muted"
                    : "bg-muted opacity-40"
              }`}
            >
              <Dumbbell size={11} color={gymOnly ? "#000" : "#888888"} />
              <Text
                style={{ lineHeight: 13, includeFontPadding: false }}
                className={`text-[11px] font-black uppercase tracking-widest ${gymOnly ? "text-black" : "text-muted-foreground"}`}
                numberOfLines={1}
              >
                {lang === "fr" ? "Ma Salle" : "My Gym"}
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => {
              const active = cat === activeCategory;
              let catLabel = cat;
              if (cat === "all") {
                catLabel = lang === "fr" ? "Tous" : "All";
              } else {
                const config = getCategoryConfig(cat);
                catLabel = lang === "fr" ? config.label_fr : config.label_en;
              }
              const count =
                cat === "all"
                  ? safe.length
                  : safe.filter((c: any) => c?.category === cat).length;

              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => handleCategoryChange(cat)}
                  style={{ height: 30 }}
                  className={`flex-row items-center justify-center gap-1.5 px-4 rounded-full ${
                    active ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <Text
                    style={{ lineHeight: 13, includeFontPadding: false }}
                    className={`text-[11px] font-black uppercase tracking-widest ${active ? "text-black" : "text-muted-foreground"}`}
                  >
                    {catLabel}
                  </Text>
                  <Text
                    style={{ lineHeight: 11, includeFontPadding: false }}
                    className={`text-[9px] font-black ${
                      active ? "text-black/70" : "text-muted-foreground/50"
                    }`}
                  >
                    {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <FlatList
        ref={listRef}
        data={isLoading ? [] : filtered}
        keyExtractor={(item: any) => item?.id || String(Math.random())}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/submit")}
            className="flex-row items-center justify-center gap-2 w-full mb-5 py-3 rounded-xl border border-dashed border-border"
          >
            <Plus size={14} color="#888888" />
            <Text className="text-sm font-bold text-muted-foreground">
              {lang === "fr" ? "Proposer un défi" : "Suggest a challenge"}
            </Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator color="#00FF87" size="large" />
            </View>
          ) : (
            <View className="bg-card rounded-xl p-8 border border-border items-center">
              <Text className="text-sm text-muted-foreground font-bold">
                {lang === "fr" ? "Aucun challenge disponible." : "No challenges available."}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
