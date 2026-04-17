import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Redirect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { FadeInView } from "@/src/components/ui/FadeInView";
import { ChevronLeft, Play, Camera, X, AlertTriangle, UserPlus } from "lucide-react-native";
import { UserAvatar } from "@/src/components/UserAvatar";
import { UserSearch, type SearchedUser } from "@/src/components/UserSearch";
import { useI18n } from "@/src/lib/i18n";
import {
  getCategoryConfig,
  computeScore,
  type MetricType,
  type Category,
} from "@/src/lib/types";
import { getCategoryIcon } from "@/src/lib/categoryIcon";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";
import { useUnitSystem } from "@/src/hooks/useUnitSystem";
import { formatTextUnits, saveWeightToMetric, saveDistanceToMetric } from "@/src/lib/units";

const submittedChallenges = new Set<string>();

export default function ChallengeDetailScreen() {
  const { slug, id } = useLocalSearchParams<{ slug: string; id: string }>();

  // Guard: expo-router can match this route with no params during navigation transitions
  if (!slug && !id) return <Redirect href="/(tabs)/feed/" />;

  const { lang, t } = useI18n();
  const { user } = useAuth();
  const { unitSystem } = useUnitSystem();
  const insets = useSafeAreaInsets();

  const scrollRef = useRef<ScrollView>(null);
  const formYRef = useRef<number>(0);

  const [showInput, setShowInput] = useState(false);
  const [minutesInput, setMinutesInput] = useState("");
  const [secondsInput, setSecondsInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [proofUri, setProofUri] = useState<string | null>(null);
  const [proofIsVideo, setProofIsVideo] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [proofError, setProofError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submittedThisSession, setSubmittedThisSession] = useState(false);
  const [filterGender, setFilterGender] = useState<"all" | "homme" | "femme">("all");
  const [opponent, setOpponent] = useState<SearchedUser | null>(null);
  const [showOpponentSearch, setShowOpponentSearch] = useState(false);

  const { data: challenge, isLoading: challengeLoading } = useQuery({
    queryKey: ["challenge-detail", id || slug],
    queryFn: async () => {
      if (id) {
        const { data } = await supabase.from("challenges").select("*").eq("id", id).single();
        return data || null;
      }
      const { data } = await supabase.from("challenges").select("*");
      return (
        (data || []).find((c: any) => {
          const generated = c.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          return generated === slug;
        }) || null
      );
    },
  });

  const { data: dbAttempts = [] } = useQuery({
    queryKey: ["challenge-top-attempts", challenge?.id],
    queryFn: async () => {
      if (!challenge) return [];
      const { data } = await supabase
        .from("attempts")
        .select("id, user_id, score, time_or_reps, proof_url, badge_earned")
        .eq("challenge_id", challenge.id)
        .order("score", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!challenge?.id,
  });

  const { data: totalAttemptCount = 0 } = useQuery({
    queryKey: ["challenge-attempt-count", challenge?.id],
    queryFn: async () => {
      if (!challenge) return 0;
      const { count } = await supabase
        .from("attempts")
        .select("id", { count: "exact", head: true })
        .eq("challenge_id", challenge.id);
      return count || 0;
    },
    enabled: !!challenge?.id,
  });

  const attemptUserIds = [...new Set(dbAttempts.map((a: any) => a.user_id))];
  const { data: attemptUsers = [] } = useQuery({
    queryKey: ["attempt-users", attemptUserIds.join(",")],
    queryFn: async () => {
      if (attemptUserIds.length === 0) return [];
      const { data } = await supabase.rpc("get_public_profiles", { user_ids: attemptUserIds });
      return data || [];
    },
    enabled: attemptUserIds.length > 0,
  });

  const handlePickProof = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        lang === "fr" ? "Permission requise" : "Permission required",
        lang === "fr"
          ? "Active l'acc\u00e8s \u00e0 la galerie dans les r\u00e9glages."
          : "Enable media library access in settings.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 100 * 1024 * 1024) {
        Alert.alert(lang === "fr" ? "Fichier trop lourd (Max 100 Mo)" : "File too large (Max 100MB)");
        return;
      }
      setProofUri(asset.uri);
      setProofIsVideo(asset.type === "video");
    }
  };

  const getEstimatedScore = (): number | null => {
    if (!challenge) return null;
    try {
      let rawValue = 0;
      const isTime = challenge.metric_type === "time";
      if (isTime) {
        const mins = parseInt(minutesInput || "0", 10);
        const secs = parseInt(secondsInput || "0", 10);
        rawValue = (isNaN(mins) ? 0 : mins) * 60 + (isNaN(secs) ? 0 : secs);
      } else {
        rawValue = parseFloat(valueInput);
      }
      if (!rawValue || rawValue <= 0) return null;
      const score = computeScore(rawValue, challenge.metric_type as MetricType, (challenge as any).scoring_logic);
      return typeof score === "number" && isFinite(score) ? Math.round(score) : null;
    } catch {
      return null;
    }
  };

  const estimatedScore = getEstimatedScore();

  const handleSubmit = async () => {
    if (!challenge || !user) return;
    setFormError(null);
    setProofError(false);

    const isTime = challenge.metric_type === "time";
    const isWeight = challenge.metric_type === "weight";
    const isReps = challenge.metric_type === "reps";
    const isDistance = challenge.metric_type === "distance";
    const category = challenge.category as Category;

    let rawValue = 0;
    let timeOrRepsValue = "";

    if (isTime) {
      const mins = Number.parseInt(minutesInput || "0", 10);
      const secs = Number.parseInt(secondsInput || "0", 10);
      rawValue = (Number.isNaN(mins) ? 0 : mins) * 60 + (Number.isNaN(secs) ? 0 : secs);
      if (rawValue <= 0) {
        setFormError(lang === "fr" ? "Entre un temps valide." : "Enter a valid time.");
        return;
      }
      timeOrRepsValue = String(rawValue);
    } else if (isWeight) {
      const val = Number.parseFloat(valueInput);
      if (Number.isNaN(val) || val <= 0) {
        setFormError(lang === "fr" ? "Entre une charge valide." : "Enter a valid weight.");
        return;
      }
      const metricVal = saveWeightToMetric(val, unitSystem);
      timeOrRepsValue = `${metricVal} kg`;
      rawValue = metricVal;
    } else if (isReps) {
      const reps = Number.parseInt(valueInput, 10);
      if (Number.isNaN(reps) || reps <= 0) {
        setFormError(lang === "fr" ? "Entre un nombre valide." : "Enter a valid count.");
        return;
      }
      timeOrRepsValue = category === "flechette" ? `${reps} points` : `${reps} reps`;
      rawValue = reps;
    } else if (isDistance) {
      const val = Number.parseFloat(valueInput);
      if (Number.isNaN(val) || val <= 0) {
        setFormError(lang === "fr" ? "Entre une distance valide." : "Enter a valid distance.");
        return;
      }
      const metricVal = saveDistanceToMetric(val, unitSystem);
      timeOrRepsValue = `${metricVal} km`;
      rawValue = metricVal;
    } else {
      const val = Number.parseFloat(valueInput);
      timeOrRepsValue = challenge.unit ? `${val} ${challenge.unit}` : String(val);
      rawValue = val;
    }

    setUploading(true);
    try {
      const estScore = computeScore(
        rawValue,
        challenge.metric_type as MetricType,
        (challenge as any).scoring_logic,
      );

      const { data: allAttemptsData } = await supabase
        .from("attempts")
        .select("score")
        .eq("challenge_id", challenge.id);

      const allScores = (allAttemptsData || []).map((a: any) => a.score);
      allScores.push(estScore);

      const betterCount = allScores.filter((s: number) => s > estScore).length;
      const estPercentile = (betterCount / allScores.length) * 100;
      const estBadge =
        estPercentile <= 1 ? "king"
        : estPercentile <= 10 ? "elite"
        : estPercentile <= 30 ? "beast"
        : estPercentile <= 60 ? "solid"
        : "rookie";

      if ((estBadge === "elite" || estBadge === "king") && estScore >= 70 && !proofUri) {
        setProofError(true);
        setUploading(false);
        return;
      }

      let proofUrl: string | null = null;
      let uploadedFilePath: string | null = null;

      if (proofUri) {
        const ext = proofUri.split(".").pop()?.toLowerCase() || "jpg";
        const mimeType = proofIsVideo ? "video/mp4" : ext === "png" ? "image/png" : "image/jpeg";
        const filePath = `${user.id}/${Date.now()}.${ext}`;
        const base64 = await FileSystem.readAsStringAsync(proofUri, {
          encoding: "base64" as const,
        });
        const blob = await (await fetch(`data:${mimeType};base64,${base64}`)).blob();
        const { error: uploadError } = await supabase.storage
          .from("preuves_video")
          .upload(filePath, blob, { contentType: mimeType });
        if (uploadError) throw uploadError;
        uploadedFilePath = filePath;
        const { data: urlData } = supabase.storage.from("preuves_video").getPublicUrl(filePath);
        proofUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("attempts").insert({
        user_id: user.id,
        challenge_id: challenge.id,
        time_or_reps: timeOrRepsValue,
        score: estScore,
        badge_earned: estBadge,
        proof_url: proofUrl,
        proof_file_path: uploadedFilePath,
        opponent_user_id: opponent?.id || null,
      });

      if (error) throw error;

      if (opponent) {
        await supabase.from("notifications").insert({
          sender_id: user.id,
          receiver_id: opponent.id,
          challenge_id: challenge.id,
          score_to_beat: Math.round(estScore),
        });
      }

      submittedChallenges.add(challenge.id);
      setSubmittedThisSession(true);

      router.push(
        `/(tabs)/feed/${slug}/result?id=${challenge.id}&value=${rawValue}&metric=${challenge.metric_type}&unit=${challenge.unit || ""}`,
      );
    } catch (err: any) {
      Alert.alert("Error", err?.message || "An error occurred");
      setUploading(false);
    }
  };

  if (challengeLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#00FF87" size="large" />
      </SafeAreaView>
    );
  }

  if (!challenge) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-muted-foreground text-center">
          {lang === "fr" ? "Challenge introuvable" : "Challenge not found"}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace({ pathname: "/(tabs)/feed/" })}
          className="mt-4 px-6 py-3 bg-primary rounded-xl"
        >
          <Text className="text-black font-bold">{lang === "fr" ? "Retour" : "Back"}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const alreadySubmitted = submittedChallenges.has(challenge.id) || submittedThisSession;
  const isTime = challenge.metric_type === "time";
  const isWeight = challenge.metric_type === "weight";
  const isReps = challenge.metric_type === "reps";
  const isDistance = challenge.metric_type === "distance";
  const category = challenge.category as Category;
  const catConfig = getCategoryConfig(category);

  const title = formatTextUnits(
    lang === "en" && challenge.title_en ? challenge.title_en : challenge.title,
    unitSystem,
  );
  const rawRules = lang === "en" && challenge.rules_en ? challenge.rules_en : challenge.rules;
  const rulesList: string[] = (
    Array.isArray(rawRules)
      ? rawRules.map((r: unknown) => String(r))
      : typeof rawRules === "string"
        ? rawRules.split("\n").filter(Boolean)
        : []
  ).map((rule) => formatTextUnits(rule, unitSystem));

  const desc = formatTextUnits(
    lang === "en"
      ? challenge.description_en || challenge.description || ""
      : challenge.description || challenge.description_en || "",
    unitSystem,
  );

  const userMap: Record<string, any> = {};
  attemptUsers.forEach((u: any) => { userMap[u.id] = u; });

  const filteredAttempts = dbAttempts.filter((a: any) => {
    if (filterGender === "all") return true;
    return userMap[a.user_id]?.gender === filterGender;
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace({ pathname: "/(tabs)/feed/" }))}
            className="flex-row items-center gap-1 mb-4"
          >
            <ChevronLeft size={20} color="#888888" />
            <Text className="text-muted-foreground text-sm">
              {lang === "fr" ? "Retour" : "Back"}
            </Text>
          </TouchableOpacity>

          {/* Header */}
          <FadeInView duration={400} className="items-center mb-6">
            <Text style={{ fontSize: 64 }}>{getCategoryIcon(category)}</Text>
            <Text className="text-2xl font-black text-foreground text-center mt-3 mb-2">
              {title}
            </Text>
            <View className="flex-row items-center gap-3 mb-2">
              <View
                className={`px-3 py-1 rounded-full border ${catConfig.bgClass} ${catConfig.borderClass}`}
              >
                <Text className={`text-xs font-bold ${catConfig.textClass}`}>
                  {lang === "fr" ? catConfig.label_fr : catConfig.label_en}
                </Text>
              </View>
              <View className="flex-row gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor:
                        i < challenge.difficulty ? catConfig.color || "#00FF87" : "#404040",
                    }}
                  />
                ))}
              </View>
              {totalAttemptCount > 0 && (
                <Text className="text-[10px] text-muted-foreground font-bold">
                  {totalAttemptCount}{" "}
                  {lang === "fr"
                    ? totalAttemptCount > 1 ? "tentatives" : "tentative"
                    : totalAttemptCount > 1 ? "attempts" : "attempt"}
                </Text>
              )}
            </View>
            {desc ? (
              <Text className="text-sm text-muted-foreground text-center">{desc}</Text>
            ) : null}
          </FadeInView>

          {/* Image */}
          {challenge.image_url ? (
            <View
              className="bg-muted rounded-xl overflow-hidden mb-4"
              style={{ aspectRatio: 16 / 9 }}
            >
              <Image
                source={{ uri: challenge.image_url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View
              className="bg-card rounded-xl border border-border mb-4 items-center justify-center gap-3"
              style={{ aspectRatio: 16 / 9 }}
            >
              <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center">
                <Play size={28} color="#00FF87" />
              </View>
              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                {lang === "fr" ? "D\u00e9mo du mouvement" : "Movement Demo"}
              </Text>
            </View>
          )}

          {/* Rules */}
          <View className="bg-card rounded-xl p-4 border border-border mb-4">
            <Text className="font-black text-sm text-foreground mb-3">
              {lang === "fr" ? "RÈGLES" : "RULES"}
            </Text>
            {rulesList.map((rule, i) => (
              <View key={i} className="flex-row gap-2 mb-2">
                <Text className="font-bold text-primary">{i + 1}.</Text>
                <Text className="text-sm text-muted-foreground flex-1">{rule}</Text>
              </View>
            ))}
          </View>

          {/* Proof warning */}
          <View
            className="flex-row items-start gap-2 rounded-lg p-3 mb-4"
            style={{
              backgroundColor: "rgba(255,165,0,0.1)",
              borderWidth: 1,
              borderColor: "rgba(255,165,0,0.3)",
            }}
          >
            <AlertTriangle size={16} color="#FF8C00" style={{ marginTop: 2 }} />
            <Text
              style={{
                fontSize: 11,
                color: "#FFA500",
                fontWeight: "700",
                flex: 1,
                lineHeight: 16,
              }}
            >
              {lang === "fr"
                ? "\u26a0\ufe0f Preuve irr\u00e9futable obligatoire pour les Rois \ud83d\udc51 et Elite \ud83c\udfc6 (\u00e0 partir de 70 pts)."
                : "\u26a0\ufe0f Proof required for King \ud83d\udc51 and Elite \ud83c\udfc6 ranks (70+ pts)."}
            </Text>
          </View>

          {/* Top performers */}
          {dbAttempts.length > 0 && (
            <View className="bg-card rounded-xl p-4 border border-border mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="font-black text-sm text-foreground">
                  {lang === "fr" ? "TOP PERFORMERS" : "TOP PERFORMERS"}
                </Text>
                <View className="flex-row gap-1">
                  {(["all", "homme", "femme"] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setFilterGender(g)}
                      className={`px-2 py-1 rounded ${
                        filterGender === g ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          filterGender === g ? "text-black" : "text-muted-foreground"
                        }`}
                      >
                        {g === "all"
                          ? lang === "fr" ? "Tous" : "All"
                          : g === "homme" ? "\u2642" : "\u2640"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {filteredAttempts.length === 0 ? (
                <Text className="text-xs text-muted-foreground text-center py-2">
                  {lang === "fr"
                    ? "Aucun r\u00e9sultat pour ce filtre."
                    : "No results for this filter."}
                </Text>
              ) : (
                <View className="gap-2">
                  {filteredAttempts.map((attempt: any, i: number) => {
                    const u = userMap[attempt.user_id];
                    return (
                      <View key={attempt.id} className="flex-row items-center gap-3">
                        <Text className="font-bold text-muted-foreground w-5 text-right text-sm">
                          #{i + 1}
                        </Text>
                        <UserAvatar
                          avatarUrl={u?.avatar_url}
                          username={u?.username}
                          size="xs"
                        />
                        <Text
                          className="font-medium text-foreground flex-1 text-sm"
                          numberOfLines={1}
                        >
                          {u?.username || "Athlete"}
                        </Text>
                        <Text className="text-muted-foreground text-xs">
                          {formatTextUnits(attempt.time_or_reps, unitSystem)}
                        </Text>
                        <Text className="font-bold text-primary text-xs">
                          {attempt.score} XP
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Submission form */}
          {showInput && (
            <View
              onLayout={(e) => {
                formYRef.current = e.nativeEvent.layout.y;
                scrollRef.current?.scrollTo({ y: e.nativeEvent.layout.y, animated: true });
              }}
            >
            <FadeInView duration={300} className="bg-card rounded-2xl p-5 border border-border mb-4">
              {/* Step 1 — Score */}
              <View className="mb-5">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                    <Text className="text-[11px] font-black text-black">1</Text>
                  </View>
                  <Text className="text-sm font-black uppercase tracking-widest text-foreground">
                    {isTime
                      ? lang === "fr" ? "Ton temps" : "Your time"
                      : isWeight
                        ? `${lang === "fr" ? "Ta charge" : "Your weight"} (${unitSystem === "metric" ? "kg" : "lbs"})`
                        : isReps
                          ? category === "flechette"
                            ? lang === "fr" ? "Tes points" : "Your points"
                            : lang === "fr" ? "Tes répétitions" : "Your reps"
                          : isDistance
                            ? `${lang === "fr" ? "Ta distance" : "Your distance"} (${unitSystem === "metric" ? "km" : "mi"})`
                            : lang === "fr" ? "Ton score" : "Your score"}
                  </Text>
                </View>

                {isTime ? (
                  <View className="flex-row items-center gap-2">
                    <View className="flex-1">
                      <TextInput
                        value={minutesInput}
                        onChangeText={setMinutesInput}
                        placeholder="0"
                        placeholderTextColor="#888888"
                        keyboardType="numeric"
                        className="bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-xl font-black text-center"
                      />
                      <Text className="text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1.5">
                        min
                      </Text>
                    </View>
                    <Text className="text-2xl font-black text-primary">:</Text>
                    <View className="flex-1">
                      <TextInput
                        value={secondsInput}
                        onChangeText={setSecondsInput}
                        placeholder="00"
                        placeholderTextColor="#888888"
                        keyboardType="numeric"
                        className="bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-xl font-black text-center"
                      />
                      <Text className="text-center text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1.5">
                        sec
                      </Text>
                    </View>
                  </View>
                ) : (
                  <TextInput
                    value={valueInput}
                    onChangeText={setValueInput}
                    placeholder={isWeight ? (unitSystem === "metric" ? "100" : "220") : isReps ? "25" : "0"}
                    placeholderTextColor="#888888"
                    keyboardType="decimal-pad"
                    className="bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-xl font-black text-center"
                  />
                )}

                {estimatedScore !== null && (
                  <View className="flex-row items-center justify-between bg-primary/10 border border-primary/30 rounded-xl px-4 py-2.5 mt-3">
                    <Text className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {lang === "fr" ? "Score estim\u00e9" : "Estimated score"}
                    </Text>
                    <Text className="text-lg font-black text-primary">{estimatedScore} XP</Text>
                  </View>
                )}

                {formError && (
                  <Text className="text-xs text-red-500 font-bold mt-3">{formError}</Text>
                )}
              </View>

              {/* Step 2 — Challenge friend */}
              <View className="mb-5">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-6 h-6 rounded-full bg-muted items-center justify-center">
                    <Text className="text-[11px] font-black text-muted-foreground">2</Text>
                  </View>
                  <Text className="text-sm font-black uppercase tracking-widest text-foreground">
                    {lang === "fr" ? "Défier un ami" : "Challenge a friend"}
                  </Text>
                  <Text className="text-[10px] text-muted-foreground font-bold">
                    {lang === "fr" ? "(optionnel)" : "(optional)"}
                  </Text>
                </View>

                {opponent ? (
                  <View className="flex-row items-center bg-primary/10 border border-primary/30 rounded-xl px-3 py-2.5">
                    <UserAvatar
                      avatarUrl={opponent.avatar_url}
                      username={opponent.username}
                      size="sm"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-foreground font-black text-sm" numberOfLines={1}>
                        {opponent.username}
                      </Text>
                      <Text className="text-[10px] text-primary font-black uppercase tracking-widest">
                        {lang === "fr" ? "Adversaire sélectionné" : "Opponent selected"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setOpponent(null)}
                      hitSlop={10}
                      className="w-7 h-7 rounded-full bg-muted items-center justify-center"
                    >
                      <X size={12} color="#888888" />
                    </TouchableOpacity>
                  </View>
                ) : showOpponentSearch ? (
                  <UserSearch
                    onSelect={(u) => {
                      setOpponent(u);
                      setShowOpponentSearch(false);
                    }}
                    placeholder={lang === "fr" ? "Pseudo de ton adversaire…" : "Opponent username…"}
                    ctaLabel={lang === "fr" ? "Défier" : "Challenge"}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowOpponentSearch(true)}
                    className="w-full py-3 rounded-xl border border-dashed border-border bg-muted/50 flex-row items-center justify-center gap-2"
                  >
                    <UserPlus size={14} color="#888888" />
                    <Text className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                      {lang === "fr" ? "Choisir un adversaire" : "Pick an opponent"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Step 3 — Proof */}
              <View className="mb-5">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-6 h-6 rounded-full bg-muted items-center justify-center">
                    <Text className="text-[11px] font-black text-muted-foreground">3</Text>
                  </View>
                  <Text className="text-sm font-black uppercase tracking-widest text-foreground">
                    {lang === "fr" ? "Preuve" : "Proof"}
                  </Text>
                  <Text className="text-[10px] text-muted-foreground font-bold">
                    {lang === "fr" ? "(photo ou vidéo)" : "(photo or video)"}
                  </Text>
                </View>

                {proofUri ? (
                  <View className="relative rounded-xl overflow-hidden border border-border">
                    <Image
                      source={{ uri: proofUri }}
                      style={{ width: "100%", height: 160 }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => { setProofUri(null); setProofIsVideo(false); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full items-center justify-center"
                      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                    >
                      <X size={13} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handlePickProof}
                    className={`w-full py-3 rounded-xl border border-dashed ${
                      proofError ? "border-red-500 bg-red-500/5" : "border-border bg-muted/50"
                    } flex-row items-center justify-center gap-2`}
                  >
                    <Camera size={14} color={proofError ? "#EF4444" : "#888888"} />
                    <Text
                      className={`text-[11px] font-black uppercase tracking-widest ${
                        proofError ? "text-red-500" : "text-muted-foreground"
                      }`}
                    >
                      {lang === "fr" ? "Filmer ou importer" : "Record or upload"}
                    </Text>
                  </TouchableOpacity>
                )}

                {proofError && (
                  <Text className="text-[11px] text-red-500 font-bold mt-2">
                    {lang === "fr"
                      ? "\u274c Preuve obligatoire pour valider ce top classement (70+ pts)"
                      : "\u274c Proof required for this top rank (70+ pts)"}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={uploading}
                className="w-full py-4 rounded-xl bg-primary items-center"
                style={{ opacity: uploading ? 0.6 : 1 }}
              >
                {uploading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text className="text-black font-black text-sm uppercase tracking-widest">
                    {lang === "fr" ? "Soumettre \u2192" : "Submit \u2192"}
                  </Text>
                )}
              </TouchableOpacity>
            </FadeInView>
            </View>
          )}
        </ScrollView>

        {/* Fixed start button */}
        {!showInput && (
          <View
            style={{
              position: "absolute",
              bottom: insets.bottom + 16,
              left: 16,
              right: 16,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowInput(true)}
              className={`w-full py-4 rounded-xl items-center ${
                alreadySubmitted ? "bg-secondary" : "bg-primary"
              }`}
            >
              <Text
                className={`font-extrabold text-sm ${alreadySubmitted ? "text-white" : "text-black"}`}
              >
                {alreadySubmitted
                  ? lang === "fr" ? "\ud83d\udd25 Am\u00e9liorer mon record" : "\ud83d\udd25 Improve my record"
                  : lang === "fr" ? "COMMENCER LE DÉFI \ud83d\ude80" : "START CHALLENGE \ud83d\ude80"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
