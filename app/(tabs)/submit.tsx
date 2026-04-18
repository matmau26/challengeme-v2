import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Zap } from "lucide-react-native";
import { FadeInView } from "@/src/components/ui/FadeInView";
import { useI18n } from "@/src/lib/i18n";
import { useAuth } from "@/src/contexts/AuthContext";
import { supabase } from "@/src/lib/supabase";
import {
  CATEGORY_CONFIG,
  type Category,
  type MetricType,
} from "@/src/lib/types";
import { getCategoryIcon } from "@/src/lib/categoryIcon";

const CATEGORY_OPTIONS = Object.keys(CATEGORY_CONFIG) as Category[];

const METRIC_OPTIONS: {
  value: MetricType;
  fr: string;
  en: string;
  defaultUnit: string;
}[] = [
  { value: "time",     fr: "Chrono",    en: "Timed",    defaultUnit: "sec" },
  { value: "reps",     fr: "Série Max", en: "Max Reps", defaultUnit: "reps" },
  { value: "distance", fr: "Distance",  en: "Distance", defaultUnit: "km" },
  { value: "weight",   fr: "Poids",     en: "Weight",   defaultUnit: "kg" },
];

export default function SubmitScreen() {
  const { lang } = useI18n();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [category, setCategory] = useState<Category | "other" | null>(null);
  const [customCategory, setCustomCategory] = useState("");
  const [metric, setMetric] = useState<MetricType | null>(null);
  const [difficulty, setDifficulty] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(lang === "fr" ? "Le titre est requis." : "Title is required.");
      return;
    }
    if (!category) {
      setError(lang === "fr" ? "Choisis une catégorie." : "Pick a category.");
      return;
    }
    const trimmedCustomCategory = customCategory.trim();
    if (category === "other" && !trimmedCustomCategory) {
      setError(
        lang === "fr"
          ? "Précise le nom de ton activité."
          : "Enter your custom activity name.",
      );
      return;
    }
    if (!metric) {
      setError(
        lang === "fr"
          ? "Choisis un type de mesure."
          : "Pick a metric type.",
      );
      return;
    }

    const metricConfig = METRIC_OPTIONS.find((m) => m.value === metric)!;
    const resolvedCategory =
      category === "other" ? trimmedCustomCategory.toLowerCase() : category;
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        title: trimmedTitle,
        category: resolvedCategory,
        metric_type: metric,
        unit: metricConfig.defaultUnit,
        difficulty: Number(difficulty),
      };
      const trimmedDescription = description.trim();
      const trimmedRules = rules.trim();
      const combinedDescription = trimmedRules
        ? trimmedDescription
          ? `${trimmedDescription}\n\n${lang === "fr" ? "Règles du jeu" : "Rules"}:\n${trimmedRules}`
          : `${lang === "fr" ? "Règles du jeu" : "Rules"}:\n${trimmedRules}`
        : trimmedDescription;
      if (combinedDescription) payload.description = combinedDescription;
      if (user?.id) payload.user_id = user.id;

      const { error: insertError } = await supabase
        .from("challenges")
        .insert(payload);

      if (insertError) {
        console.error("[SUPABASE INSERT ERROR]:", insertError);
        setError(
          lang === "fr"
            ? "Impossible de créer le défi. Réessaie."
            : "Couldn't create the challenge. Try again.",
        );
        setIsSubmitting(false);
        return;
      }

      router.replace("/(tabs)/feed/");
    } catch (error) {
      console.error("[SUPABASE INSERT ERROR]:", error);
      setError(
        lang === "fr"
          ? "Une erreur inattendue est survenue."
          : "An unexpected error occurred.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full items-center justify-center bg-muted/50"
          >
            <ArrowLeft size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-base font-black text-foreground uppercase tracking-widest">
            {lang === "fr" ? "Proposer un défi" : "Suggest a Challenge"}
          </Text>
          <View className="w-9" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FadeInView duration={350} className="gap-6">
            {/* Title */}
            <View>
              <Text className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                {lang === "fr" ? "Titre du défi" : "Challenge Title"}
              </Text>
              <TextInput
                value={title}
                onChangeText={(v) => setTitle(v.slice(0, 80))}
                placeholder={
                  lang === "fr"
                    ? "Ex: 100 Pompes le plus vite possible"
                    : "E.g., 100 Push-ups for Time"
                }
                placeholderTextColor="#666666"
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-4 text-lg font-bold text-foreground"
              />
              <Text className="text-[10px] text-muted-foreground mt-1 text-right">
                {title.length}/80
              </Text>
            </View>

            {/* Description */}
            <View>
              <Text className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                {lang === "fr"
                  ? "Description (optionnel)"
                  : "Description (optional)"}
              </Text>
              <TextInput
                value={description}
                onChangeText={(v) => setDescription(v.slice(0, 280))}
                placeholder={
                  lang === "fr"
                    ? "Format, astuces, contexte..."
                    : "Format, tips, context..."
                }
                placeholderTextColor="#666666"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-5 text-sm text-foreground min-h-[110px]"
              />
              <Text className="text-[10px] text-muted-foreground mt-1 text-right">
                {description.length}/280
              </Text>
            </View>

            {/* Category */}
            <View>
              <Text className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                {lang === "fr" ? "Catégorie" : "Category"}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 8 }}
              >
                <View className="flex-row gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const cfg = CATEGORY_CONFIG[cat];
                    const active = cat === category;
                    const emoji = getCategoryIcon(cat);
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setCategory(cat)}
                        activeOpacity={0.8}
                        style={{
                          borderColor: active ? cfg.color : "#2A2A2A",
                          backgroundColor: active
                            ? `${cfg.color}20`
                            : "rgba(42,42,42,0.5)",
                        }}
                        className="flex-row items-center gap-1.5 px-4 py-2 rounded-full border"
                      >
                        <Text style={{ fontSize: 14 }}>{emoji}</Text>
                        <Text
                          style={{ color: active ? cfg.color : "#888888" }}
                          className="text-xs font-black uppercase tracking-wider"
                        >
                          {lang === "fr" ? cfg.label_fr : cfg.label_en}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {(() => {
                    const active = category === "other";
                    return (
                      <TouchableOpacity
                        key="other"
                        onPress={() => setCategory("other")}
                        activeOpacity={0.8}
                        style={{
                          borderColor: active ? "#FFFFFF" : "#2A2A2A",
                          backgroundColor: active
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(42,42,42,0.5)",
                        }}
                        className="flex-row items-center gap-1.5 px-4 py-2 rounded-full border"
                      >
                        <Text style={{ fontSize: 14 }}>✨</Text>
                        <Text
                          style={{ color: active ? "#FFFFFF" : "#888888" }}
                          className="text-xs font-black uppercase tracking-wider"
                        >
                          {lang === "fr" ? "Autre" : "Other"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })()}
                </View>
              </ScrollView>
              {category === "other" && (
                <TextInput
                  value={customCategory}
                  onChangeText={(v) => setCustomCategory(v.slice(0, 40))}
                  placeholder={
                    lang === "fr"
                      ? "Nom de ton activité (ex: Escalade)"
                      : "Your activity name (e.g., Climbing)"
                  }
                  placeholderTextColor="#666666"
                  className="bg-muted/50 border border-border rounded-xl p-4 mt-3 text-foreground"
                />
              )}
            </View>

            {/* Metric type */}
            <View>
              <Text className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                {lang === "fr" ? "Type de mesure" : "Metric Type"}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {METRIC_OPTIONS.map((m) => {
                  const active = m.value === metric;
                  return (
                    <TouchableOpacity
                      key={m.value}
                      onPress={() => setMetric(m.value)}
                      activeOpacity={0.8}
                      className={`px-4 py-2 rounded-full border ${
                        active
                          ? "bg-primary border-primary"
                          : "bg-muted/50 border-border"
                      }`}
                    >
                      <Text
                        className={`text-xs font-black uppercase tracking-wider ${
                          active ? "text-black" : "text-muted-foreground"
                        }`}
                      >
                        {lang === "fr" ? m.fr : m.en}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Challenge Rules */}
            <View>
              <Text className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                {lang === "fr"
                  ? "Règles du jeu (Optionnel)"
                  : "Game Rules (Optional)"}
              </Text>
              <TextInput
                value={rules}
                onChangeText={(v) => setRules(v.slice(0, 400))}
                placeholder={
                  lang === "fr"
                    ? "Ex: Pas de pause > 10s, amplitude complète, pieds joints..."
                    : "E.g., no break > 10s, full range of motion, feet together..."
                }
                placeholderTextColor="#666666"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="text-foreground bg-muted/50 p-4 rounded-xl border border-border mt-2 min-h-[120px] text-sm"
              />
              <Text className="text-[10px] text-muted-foreground mt-1 text-right">
                {rules.length}/400
              </Text>
            </View>

            {/* Difficulty */}
            <View>
              <Text className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                {lang === "fr" ? "Difficulté" : "Difficulty"}
              </Text>
              <View className="flex-row items-center gap-2 bg-muted/50 border border-border rounded-xl px-4 py-5">
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const active = lvl <= difficulty;
                  return (
                    <TouchableOpacity
                      key={lvl}
                      onPress={() => setDifficulty(lvl)}
                      activeOpacity={0.7}
                      className="flex-1 items-center py-1"
                    >
                      <Zap
                        size={26}
                        color={active ? "#00FF87" : "#3A3A3A"}
                        fill={active ? "#00FF87" : "transparent"}
                        strokeWidth={1.5}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text className="text-[10px] text-muted-foreground mt-1 text-right">
                {difficulty}/5
              </Text>
            </View>

            {/* Error */}
            {error && (
              <View className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3">
                <Text className="text-red-400 text-xs font-bold">{error}</Text>
              </View>
            )}

            {/* Submit */}
            <View className="items-center w-full mt-2">
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
                className={`self-center px-8 py-3.5 rounded-full bg-primary flex-row items-center justify-center gap-2 ${
                  isSubmitting ? "opacity-60" : ""
                }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#000" />
                ) : null}
                <Text className="text-black font-black text-sm uppercase tracking-widest">
                  {isSubmitting
                    ? lang === "fr"
                      ? "ENVOI..."
                      : "SUBMITTING..."
                    : lang === "fr"
                      ? "CRÉER LE DÉFI"
                      : "CREATE CHALLENGE"}
                </Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
