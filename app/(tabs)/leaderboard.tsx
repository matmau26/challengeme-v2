import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { FadeInView } from "@/src/components/ui/FadeInView";
import { useI18n } from "@/src/lib/i18n";
import { useAuth } from "@/src/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { UserAvatar } from "@/src/components/UserAvatar";
import { Trophy, Medal, Star, Crown, ChevronRight } from "lucide-react-native";
import { getBadge } from "@/src/lib/types";

type FilterType = "global" | "activity" | "gender" | "age" | "location";
type RankingMode = "score" | "kings";

const FILTER_LABELS: Record<FilterType, { fr: string; en: string }> = {
  global: { fr: "Scratch", en: "Scratch" },
  activity: { fr: "Activité", en: "Activity" },
  gender: { fr: "Genre", en: "Gender" },
  age: { fr: "Âge", en: "Age" },
  location: { fr: "Monde", en: "World" },
};

const ACTIVITY_TRANSLATIONS: Record<string, { fr: string; en: string }> = {
  hyrox: { fr: "Hyrox", en: "Hyrox" },
  fitness: { fr: "Fitness", en: "Fitness" },
  flechette: { fr: "Fléchettes", en: "Darts" },
  extreme: { fr: "Extrême", en: "Extreme" },
  running: { fr: "Running", en: "Running" },
  crossfit: { fr: "CrossFit", en: "CrossFit" },
  muscle: { fr: "Muscle", en: "Muscle" },
  football: { fr: "Football", en: "Football" },
};

const AGE_OPTIONS = ["19 et -", "20-29", "30-39", "40-49", "50 et +"];

const CONTINENTS = [
  { value: "africa", label_fr: "Afrique", label_en: "Africa" },
  { value: "asia", label_fr: "Asie", label_en: "Asia" },
  { value: "europe", label_fr: "Europe", label_en: "Europe" },
  { value: "north_america", label_fr: "Am. Nord", label_en: "N. America" },
  { value: "south_america", label_fr: "Am. Sud", label_en: "S. America" },
  { value: "oceania", label_fr: "Océanie", label_en: "Oceania" },
];

const COUNTRIES_BY_CONTINENT: Record<string, { value: string; label: string }[]> = {
  africa: [
    { value: "DZ", label: "Algérie" }, { value: "CM", label: "Cameroun" },
    { value: "CI", label: "Côte d'Ivoire" }, { value: "EG", label: "Égypte" },
    { value: "MA", label: "Maroc" }, { value: "NG", label: "Nigeria" },
    { value: "SN", label: "Sénégal" }, { value: "ZA", label: "Afrique du Sud" },
    { value: "TN", label: "Tunisie" },
  ],
  asia: [
    { value: "CN", label: "Chine" }, { value: "IN", label: "Inde" },
    { value: "JP", label: "Japon" }, { value: "KR", label: "Corée du Sud" },
    { value: "AE", label: "Émirats" }, { value: "SA", label: "Arabie Saoudite" },
  ],
  europe: [
    { value: "FR", label: "France" }, { value: "DE", label: "Allemagne" },
    { value: "ES", label: "Espagne" }, { value: "IT", label: "Italie" },
    { value: "GB", label: "Royaume-Uni" }, { value: "BE", label: "Belgique" },
    { value: "CH", label: "Suisse" }, { value: "PT", label: "Portugal" },
    { value: "NL", label: "Pays-Bas" }, { value: "PL", label: "Pologne" },
    { value: "SE", label: "Suède" }, { value: "NO", label: "Norvège" },
  ],
  north_america: [
    { value: "US", label: "États-Unis" }, { value: "CA", label: "Canada" },
    { value: "MX", label: "Mexique" },
  ],
  south_america: [
    { value: "BR", label: "Brésil" }, { value: "AR", label: "Argentine" },
    { value: "CO", label: "Colombie" }, { value: "CL", label: "Chili" },
  ],
  oceania: [
    { value: "AU", label: "Australie" }, { value: "NZ", label: "Nouvelle-Zélande" },
  ],
};

interface LeaderboardUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  gender: string | null;
  age_bracket: string | null;
  country: string | null;
  total_score: number;
}

function PodiumStep({
  user,
  rank,
  color,
  bgColor,
  height,
  isFirst,
  icon,
  rankingMode,
}: {
  user: LeaderboardUser;
  rank: number;
  color: string;
  bgColor: string;
  height: number;
  isFirst?: boolean;
  icon: React.ReactNode;
  rankingMode: RankingMode;
}) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <View style={{ height: 32, justifyContent: "flex-end", marginBottom: 6 }}>
        {icon}
      </View>
      <View style={{ position: "relative", marginBottom: 12 }}>
        <UserAvatar
          avatarUrl={user.avatar_url}
          username={user.username}
          size={isFirst ? "lg" : "md"}
        />
        <View
          style={{
            position: "absolute",
            bottom: -8,
            right: -8,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: bgColor,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1.5,
            borderColor: color,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "900", color }}>{rank}</Text>
        </View>
      </View>
      <View style={{ alignItems: "center", paddingHorizontal: 4, marginBottom: 8 }}>
        <Text
          style={{ fontSize: 10, fontWeight: "900", color: "#FFFFFF" }}
          numberOfLines={1}
        >
          {user.username}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "900",
            color: rankingMode === "kings" ? "#EAB308" : color,
            marginTop: 2,
          }}
        >
          {user.total_score.toLocaleString()}{rankingMode === "kings" ? " 👑" : ""}
        </Text>
      </View>
      <View
        style={{
          width: "85%",
          height,
          backgroundColor: bgColor,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderTopWidth: 3,
          borderLeftWidth: 3,
          borderRightWidth: 3,
          borderColor: color + "33",
        }}
      />
    </View>
  );
}

export default function LeaderboardScreen() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();

  const [rankingMode, setRankingMode] = useState<RankingMode>("score");
  const [filter, setFilter] = useState<FilterType>("global");
  const [activityFilter, setActivityFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("");
  const [continentFilter, setContinentFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  const { data: dynamicActivities = [] } = useQuery({
    queryKey: ["unique-activities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("challenges").select("category");
      if (error) throw error;
      return Array.from(new Set(data.map((c: { category: string }) => c.category))).filter(Boolean).sort() as string[];
    },
  });

  const getActivityLabel = (cat: string) => {
    if (ACTIVITY_TRANSLATIONS[cat])
      return lang === "fr" ? ACTIVITY_TRANSLATIONS[cat].fr : ACTIVITY_TRANSLATIONS[cat].en;
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const { data: leaderboardData = [], isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ["leaderboard-live-data", rankingMode, activityFilter],
    staleTime: 0,
    queryFn: async () => {
      const { data: attempts, error: attemptsError } = await supabase
        .from("attempts")
        .select("user_id, challenge_id, score");
      if (attemptsError) throw attemptsError;

      const { data: challengesData } = await supabase.from("challenges").select("id, category");
      const challengeCats: Record<string, string> = {};
      challengesData?.forEach((c: { id: string; category: string }) => (challengeCats[c.id] = c.category));

      type AttemptRow = { user_id: string; challenge_id: string; score: number };
      const filteredAttempts: AttemptRow[] =
        activityFilter === "all"
          ? (attempts as AttemptRow[]) || []
          : ((attempts as AttemptRow[]) || []).filter((a) => challengeCats[a.challenge_id] === activityFilter);

      const userStats: Record<string, { score: number; kings: number }> = {};

      if (rankingMode === "score") {
        const bestScores: Record<string, number> = {};
        filteredAttempts.forEach((a) => {
          const key = `${a.user_id}_${a.challenge_id}`;
          if (!bestScores[key] || a.score > bestScores[key]) bestScores[key] = a.score;
        });
        Object.entries(bestScores).forEach(([key, score]) => {
          const userId = key.split("_")[0];
          if (!userStats[userId]) userStats[userId] = { score: 0, kings: 0 };
          userStats[userId].score += score;
        });
      } else {
        const scoresByChallenge: Record<string, number[]> = {};
        const userBestByChallenge: Record<string, Record<string, number>> = {};
        filteredAttempts.forEach((a) => {
          if (!scoresByChallenge[a.challenge_id]) scoresByChallenge[a.challenge_id] = [];
          scoresByChallenge[a.challenge_id].push(a.score);
          if (!userBestByChallenge[a.user_id]) userBestByChallenge[a.user_id] = {};
          if (
            !userBestByChallenge[a.user_id][a.challenge_id] ||
            a.score > userBestByChallenge[a.user_id][a.challenge_id]
          ) {
            userBestByChallenge[a.user_id][a.challenge_id] = a.score;
          }
        });
        Object.keys(userBestByChallenge).forEach((userId) => {
          let kingCount = 0;
          Object.entries(userBestByChallenge[userId]).forEach(([challengeId, bestScore]) => {
            const allScores = scoresByChallenge[challengeId];
            const betterCount = allScores.filter((s) => s > bestScore).length;
            const percentile = (betterCount / allScores.length) * 100;
            if (getBadge(percentile) === "king") kingCount++;
          });
          userStats[userId] = { score: 0, kings: kingCount };
        });
      }

      const userIds = Object.keys(userStats);
      if (userIds.length === 0) return [];

      const { data: users } = await supabase.rpc("get_public_profiles", { user_ids: userIds });
      const userMap: Record<string, any> = {};
      users?.forEach((u: any) => (userMap[u.id] = u));

      return userIds
        .map((uid) => ({
          user_id: uid,
          username: userMap[uid]?.username || "Athlete",
          avatar_url: userMap[uid]?.avatar_url || null,
          gender: userMap[uid]?.gender || null,
          age_bracket: userMap[uid]?.age_bracket || null,
          country: userMap[uid]?.country || null,
          total_score: rankingMode === "kings" ? userStats[uid].kings : userStats[uid].score,
        }))
        .filter((u) => u.total_score > 0)
        .sort((a, b) => b.total_score - a.total_score);
    },
  });

  let filtered = [...leaderboardData];
  if (filter === "gender" && genderFilter !== "all") {
    filtered = filtered.filter((u) => {
      const g = (u.gender || "").toLowerCase();
      return genderFilter === "male"
        ? ["male", "homme", "m"].includes(g)
        : ["female", "femme", "f"].includes(g);
    });
  }
  if (filter === "age" && ageFilter) {
    filtered = filtered.filter((u) => u.age_bracket === ageFilter);
  }
  if (filter === "location") {
    if (countryFilter !== "all") {
      filtered = filtered.filter((u) => u.country === countryFilter);
    } else if (continentFilter !== "all") {
      const allowed = COUNTRIES_BY_CONTINENT[continentFilter]?.map((c) => c.value) || [];
      filtered = filtered.filter((u) => u.country && allowed.includes(u.country));
    }
  }

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);
  const myData = leaderboardData.find((u) => u.user_id === user?.id);
  const myRank = filtered.findIndex((u) => u.user_id === user?.id) + 1;
  const myPercentile =
    myRank > 0 ? Math.max(1, Math.round((myRank / filtered.length) * 100)) : 0;

  const resetFilters = (newFilter: FilterType) => {
    setFilter(newFilter);
    setActivityFilter("all");
    setGenderFilter("all");
    setAgeFilter("");
    setContinentFilter("all");
    setCountryFilter("all");
  };

  const continentCountries =
    continentFilter !== "all" ? COUNTRIES_BY_CONTINENT[continentFilter] || [] : [];

  const filterBtnClass = (active: boolean) =>
    `px-4 py-2 rounded-full border items-center justify-center ${
      active
        ? "bg-primary/10 border-primary"
        : "bg-muted/30 border-transparent"
    }`;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center mb-6">
          <Trophy size={24} color="#00FF87" />
          <Text className="text-2xl font-black text-foreground ml-2">
            {lang === "fr" ? "Classement" : "Leaderboard"}
          </Text>
        </View>

        <View className="flex-row bg-muted/30 p-1 rounded-2xl mb-6">
          <TouchableOpacity
            onPress={() => setRankingMode("score")}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              rankingMode === "score" ? "bg-primary" : ""
            }`}
          >
            <Text className={`text-xs font-black ${rankingMode === "score" ? "text-black" : "text-muted-foreground"}`}>
              🏆 Points (XP)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setRankingMode("kings")}
            style={rankingMode === "kings" ? { backgroundColor: "#EAB308" } : {}}
            className={`flex-1 py-2.5 rounded-xl items-center`}
          >
            <Text className={`text-xs font-black ${rankingMode === "kings" ? "text-black" : "text-muted-foreground"}`}>
              👑 Kings
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <View className="flex-row pb-2">
            {(Object.keys(FILTER_LABELS) as FilterType[]).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => resetFilters(f)}
                className={`px-4 py-2 rounded-full items-center justify-center mr-2 ${
                  filter === f ? "bg-foreground" : "bg-muted/50"
                }`}
              >
                <Text
                  className={`text-[11px] font-black uppercase tracking-widest ${
                    filter === f ? "text-background" : "text-muted-foreground"
                  }`}
                >
                  {lang === "fr" ? FILTER_LABELS[f].fr : FILTER_LABELS[f].en}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={{ minHeight: 48, marginBottom: 16 }}>
          {filter === "activity" && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setActivityFilter("all")}
                  className={`${filterBtnClass(activityFilter === "all")} mr-2`}
                >
                  <Text className={`text-[10px] font-black ${activityFilter === "all" ? "text-primary" : "text-muted-foreground"}`}>
                    {lang === "fr" ? "Toutes" : "All"}
                  </Text>
                </TouchableOpacity>
                {dynamicActivities.map((act) => (
                  <TouchableOpacity
                    key={act}
                    onPress={() => setActivityFilter(act)}
                    className={`${filterBtnClass(activityFilter === act)} mr-2`}
                  >
                    <Text className={`text-[10px] font-black ${activityFilter === act ? "text-primary" : "text-muted-foreground"}`}>
                      {getActivityLabel(act)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {filter === "gender" && (
            <View className="flex-row">
              {[
                { value: "all", fr: "Tous", en: "All" },
                { value: "male", fr: "♂ Homme", en: "♂ Male" },
                { value: "female", fr: "♀ Femme", en: "♀ Female" },
              ].map((g, i) => (
                <TouchableOpacity
                  key={g.value}
                  onPress={() => setGenderFilter(g.value)}
                  className={`flex-1 px-4 py-2 rounded-full border items-center justify-center ${i < 2 ? "mr-2" : ""} ${
                    genderFilter === g.value ? "bg-primary/10 border-primary" : "bg-muted/30 border-transparent"
                  }`}
                >
                  <Text className={`text-[10px] font-black ${genderFilter === g.value ? "text-primary" : "text-muted-foreground"}`}>
                    {lang === "fr" ? g.fr : g.en}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {filter === "age" && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setAgeFilter("")}
                  className={`${filterBtnClass(ageFilter === "")} mr-2`}
                >
                  <Text className={`text-[10px] font-black ${ageFilter === "" ? "text-primary" : "text-muted-foreground"}`}>
                    {lang === "fr" ? "Tous" : "All"}
                  </Text>
                </TouchableOpacity>
                {AGE_OPTIONS.map((age) => (
                  <TouchableOpacity
                    key={age}
                    onPress={() => setAgeFilter(age)}
                    className={`${filterBtnClass(ageFilter === age)} mr-2`}
                  >
                    <Text className={`text-[10px] font-black ${ageFilter === age ? "text-primary" : "text-muted-foreground"}`}>
                      {age}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {filter === "location" && (
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row mb-2">
                  <TouchableOpacity
                    onPress={() => { setContinentFilter("all"); setCountryFilter("all"); }}
                    className={`${filterBtnClass(continentFilter === "all")} mr-2`}
                  >
                    <Text className={`text-[10px] font-black ${continentFilter === "all" ? "text-primary" : "text-muted-foreground"}`}>
                      {lang === "fr" ? "Monde" : "World"}
                    </Text>
                  </TouchableOpacity>
                  {CONTINENTS.map((c) => (
                    <TouchableOpacity
                      key={c.value}
                      onPress={() => { setContinentFilter(c.value); setCountryFilter("all"); }}
                      className={`${filterBtnClass(continentFilter === c.value)} mr-2`}
                    >
                      <Text className={`text-[10px] font-black ${continentFilter === c.value ? "text-primary" : "text-muted-foreground"}`}>
                        {lang === "fr" ? c.label_fr : c.label_en}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {continentCountries.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row">
                    <TouchableOpacity
                      onPress={() => setCountryFilter("all")}
                      className={`${filterBtnClass(countryFilter === "all")} mr-2`}
                    >
                      <Text className={`text-[10px] font-black ${countryFilter === "all" ? "text-primary" : "text-muted-foreground"}`}>
                        {lang === "fr" ? "Tous" : "All"}
                      </Text>
                    </TouchableOpacity>
                    {continentCountries.map((c) => (
                      <TouchableOpacity
                        key={c.value}
                        onPress={() => setCountryFilter(c.value)}
                        className={`${filterBtnClass(countryFilter === c.value)} mr-2`}
                      >
                        <Text className={`text-[10px] font-black ${countryFilter === c.value ? "text-primary" : "text-muted-foreground"}`}>
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
          )}
        </View>

        {isLoading && (
          <View className="items-center py-12">
            <ActivityIndicator color="#00FF87" size="large" />
          </View>
        )}

        {!isLoading && filtered.length === 0 && (
          <View className="bg-card rounded-3xl p-10 border border-dashed border-border items-center">
            <Star size={48} color="#333333" />
            <Text className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-4">
              {lang === "fr" ? "Aucun athlète trouvé" : "No athletes found"}
            </Text>
          </View>
        )}

        {!isLoading && filtered.length > 0 && (
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                marginBottom: 32,
              }}
            >
              {top3[1] ? (
                <PodiumStep
                  user={top3[1]}
                  rank={2}
                  color="#94A3B8"
                  bgColor="#94A3B81A"
                  height={96}
                  icon={<Medal size={24} color="#94A3B8" />}
                  rankingMode={rankingMode}
                />
              ) : (
                <View style={{ flex: 1 }} />
              )}
              {top3[0] ? (
                <PodiumStep
                  user={top3[0]}
                  rank={1}
                  color="#EAB308"
                  bgColor="#EAB3081A"
                  height={140}
                  isFirst
                  icon={<Crown size={28} color="#EAB308" />}
                  rankingMode={rankingMode}
                />
              ) : (
                <View style={{ flex: 1 }} />
              )}
              {top3[2] ? (
                <PodiumStep
                  user={top3[2]}
                  rank={3}
                  color="#B45309"
                  bgColor="#B453091A"
                  height={72}
                  icon={<Medal size={24} color="#B45309" />}
                  rankingMode={rankingMode}
                />
              ) : (
                <View style={{ flex: 1 }} />
              )}
            </View>

            <View>
              {rest.map((u, i) => (
                <FadeInView
                  key={u.user_id}
                  duration={400}
                  delay={i * 40}
                  className={`flex-row items-center bg-card/40 rounded-2xl px-4 py-3 border mb-2 ${
                    u.user_id === user?.id ? "border-primary/50 bg-primary/10" : "border-border"
                  }`}
                >
                  <Text className="font-black text-muted-foreground/40 w-6 text-center text-[10px]">
                    #{i + 4}
                  </Text>
                  <View className="mx-3">
                    <UserAvatar avatarUrl={u.avatar_url} username={u.username} size="sm" />
                  </View>
                  <Text className="font-bold text-sm text-foreground flex-1" numberOfLines={1}>
                    {u.username}
                  </Text>
                  <View className="items-end mr-2">
                    <Text
                      className={`font-black text-sm leading-none ${
                        rankingMode === "kings" ? "text-[#EAB308]" : "text-primary"
                      }`}
                    >
                      {u.total_score.toLocaleString()}{rankingMode === "kings" ? " 👑" : ""}
                    </Text>
                    <Text className="text-[7px] font-black uppercase text-muted-foreground">
                      {rankingMode === "kings" ? (lang === "fr" ? "Couronnes" : "Crowns") : "Points"}
                    </Text>
                  </View>
                  <ChevronRight size={14} color="#333333" />
                </FadeInView>
              ))}
            </View>
          </>
        )}

        {user && myData && <View style={{ height: 80 }} />}
      </ScrollView>

      {user && myData && (
        <View
          style={{
            position: "absolute",
            bottom: tabBarHeight,
            left: 16,
            right: 16,
          }}
        >
          <FadeInView
            duration={400}
            style={{
              backgroundColor: rankingMode === "kings" ? "#EAB308" : "#00FF87",
              borderRadius: 14,
              paddingVertical: 10,
              paddingHorizontal: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View className="flex-row items-center">
              <View
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: "rgba(0,0,0,0.2)",
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "900", color: "#000" }}>
                  #{myRank > 0 ? myRank : "--"}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 9, fontWeight: "900", color: "#000", opacity: 0.8, textTransform: "uppercase", letterSpacing: 1.5 }}>
                  {lang === "fr" ? "Ton Classement" : "Your Rank"}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#000" }}>
                  Top {myPercentile}% {lang === "fr" ? "des athlètes" : "of athletes"}
                </Text>
              </View>
            </View>
            <View
              style={{
                alignItems: "flex-end",
                paddingLeft: 12,
                borderLeftWidth: 1,
                borderLeftColor: "rgba(0,0,0,0.1)",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#000", lineHeight: 20 }}>
                {myData.total_score.toLocaleString()}
              </Text>
              <Text style={{ fontSize: 8, fontWeight: "900", color: "#000", opacity: 0.8, textTransform: "uppercase" }}>
                {rankingMode === "kings"
                  ? lang === "fr" ? "Couronnes" : "Crowns"
                  : lang === "fr" ? "Points Total" : "Total Points"}
              </Text>
            </View>
          </FadeInView>
        </View>
      )}
    </SafeAreaView>
  );
}
