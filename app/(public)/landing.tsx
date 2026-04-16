import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Target, Zap, Share2 } from "lucide-react-native";
import { FadeInView } from "@/src/components/ui/FadeInView";
import { useI18n } from "@/src/lib/i18n";

const CATEGORIES = [
  { label: "Football",    emoji: "\u26bd" },
  { label: "Running",     emoji: "\ud83c\udfc3" },
  { label: "Hyrox",       emoji: "\u2694\ufe0f" },
  { label: "CrossFit",    emoji: "\ud83d\udd25" },
  { label: "Muscle",      emoji: "\ud83c\udfcb\ufe0f" },
  { label: "Fitness",     emoji: "\ud83d\udcaa" },
  { label: "Extreme",     emoji: "\u26a1" },
  { label: "Fl\u00e9chettes", emoji: "\ud83c\udfaf" },
];

export default function LandingScreen() {
  const { lang, setLang, t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Language toggle */}
      <TouchableOpacity
        onPress={() => setLang(lang === "fr" ? "en" : "fr")}
        className="self-end mr-4 mb-4 px-2 py-1 rounded border border-border bg-muted"
      >
        <Text className="text-xs font-bold text-foreground">{lang === "fr" ? "EN" : "FR"}</Text>
      </TouchableOpacity>

      <View className="flex-1 px-6 items-center">
        {/* Logo */}
        <FadeInView duration={600} className="mb-6 items-center">
          <Text className="text-2xl font-black tracking-tight">
            <Text className="text-primary">ChallengeMe</Text>
            <Text> \u26a1</Text>
          </Text>
        </FadeInView>

        {/* Hero */}
        <FadeInView duration={600} delay={100} className="items-center mb-6">
          <Text className="text-4xl font-black text-foreground text-center leading-tight mb-4">
            {t("hero.title")}
          </Text>
          <Text className="text-base text-muted-foreground text-center leading-relaxed max-w-xs">
            {t("hero.sub")}
          </Text>
        </FadeInView>

        {/* Stats */}
        <FadeInView duration={500} delay={200} className="flex-row gap-6 mb-8 items-center">
          <View className="items-center gap-0.5">
            <Text className="font-black text-sm text-foreground">
              {lang === "fr" ? "52 d\u00e9fis" : "52 challenges"}
            </Text>
            <Text className="text-[9px] text-muted-foreground uppercase tracking-widest">
              {lang === "fr" ? "& en croissance" : "& growing"}
            </Text>
          </View>
          <View className="w-px h-8 bg-border" />
          <View className="items-center gap-0.5">
            <Text className="font-black text-sm text-primary">
              {lang === "fr" ? "Gratuit" : "Free"}
            </Text>
            <Text className="text-[9px] text-muted-foreground uppercase tracking-widest">
              {lang === "fr" ? "Pour toujours" : "Forever"}
            </Text>
          </View>
          <View className="w-px h-8 bg-border" />
          <View className="items-center gap-0.5">
            <Text className="font-black text-sm text-foreground">{"\ud83c\udf0d"}</Text>
            <Text className="text-[9px] text-muted-foreground uppercase tracking-widest">
              {lang === "fr" ? "Classement mondial" : "World ranking"}
            </Text>
          </View>
        </FadeInView>

        {/* CTA */}
        <FadeInView duration={600} delay={300} className="w-full max-w-xs mb-3">
          <TouchableOpacity
            onPress={() => router.push("/(public)/auth")}
            className="w-full py-4 px-6 rounded-xl bg-primary items-center"
            activeOpacity={0.85}
          >
            <Text className="font-black text-base text-primary-foreground">{t("hero.cta")}</Text>
          </TouchableOpacity>
        </FadeInView>

        {/* Login link */}
        <FadeInView duration={400} delay={400} className="mb-8">
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/(public)/auth", params: { mode: "login" } })}
          >
            <Text className="text-xs text-muted-foreground underline">
              {lang === "fr" ? "D\u00e9j\u00e0 un compte ? Connexion" : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>
        </FadeInView>

        {/* Categories scroll */}
        <FadeInView duration={600} delay={450} className="w-full mb-12">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {[...CATEGORIES, ...CATEGORIES].map((cat, i) => (
              <View
                key={i}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border mr-2"
              >
                <Text>{cat.emoji}</Text>
                <Text className="text-xs font-semibold text-foreground">{cat.label}</Text>
              </View>
            ))}
          </ScrollView>
        </FadeInView>

        {/* 3 steps */}
        <FadeInView duration={600} delay={550} className="flex-row gap-4 max-w-sm w-full mb-8">
          <StepCard icon={<Target size={24} color="#00FF87" />} title={t("hero.step1")} desc={t("hero.step1d")} />
          <StepCard icon={<Zap size={24} color="#00FF87" />}    title={t("hero.step2")} desc={t("hero.step2d")} />
          <StepCard icon={<Share2 size={24} color="#00FF87" />} title={t("hero.step3")} desc={t("hero.step3d")} />
        </FadeInView>

        {/* Trust footer */}
        <FadeInView duration={400} delay={700}>
          <Text className="text-[10px] text-muted-foreground text-center">
            {lang === "fr"
              ? "\ud83d\udd12 Gratuit \u00b7 Sans carte bancaire \u00b7 iOS & Android"
              : "\ud83d\udd12 Free \u00b7 No credit card \u00b7 iOS & Android"}
          </Text>
        </FadeInView>
      </View>
    </ScrollView>
  );
}

function StepCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <View className="flex-1 items-center gap-2">
      <View className="w-12 h-12 rounded-full bg-muted items-center justify-center">{icon}</View>
      <Text className="font-bold text-sm text-foreground text-center">{title}</Text>
      <Text className="text-[10px] text-muted-foreground leading-tight text-center">{desc}</Text>
    </View>
  );
}
