import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { FadeInView } from "@/src/components/ui/FadeInView";
import { ArrowLeft, ChevronDown, X } from "lucide-react-native";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";
import { useI18n } from "@/src/lib/i18n";
import { useUserProfile, useInvalidateProfile } from "@/src/hooks/useUserProfile";
import { type UnitSystem } from "@/src/lib/units";

const AGE_BRACKETS = ["19 et -", "20-29", "30-39", "40-49", "50 et +"];

const GENDERS = [
  { value: "homme", label_fr: "Homme", label_en: "Male" },
  { value: "femme", label_fr: "Femme", label_en: "Female" },
];

const CONTINENTS = [
  { value: "africa", label_fr: "Afrique", label_en: "Africa" },
  { value: "asia", label_fr: "Asie", label_en: "Asia" },
  { value: "europe", label_fr: "Europe", label_en: "Europe" },
  { value: "north_america", label_fr: "Am. Nord", label_en: "N. America" },
  { value: "south_america", label_fr: "Am. Sud", label_en: "S. America" },
  { value: "oceania", label_fr: "Océanie", label_en: "Oceania" },
];

const COUNTRIES_BY_CONTINENT: Record<string, { value: string; label_fr: string; label_en: string }[]> = {
  africa: [
    { value: "DZ", label_fr: "Algérie", label_en: "Algeria" },
    { value: "CM", label_fr: "Cameroun", label_en: "Cameroon" },
    { value: "CI", label_fr: "Côte d'Ivoire", label_en: "Ivory Coast" },
    { value: "EG", label_fr: "Égypte", label_en: "Egypt" },
    { value: "MA", label_fr: "Maroc", label_en: "Morocco" },
    { value: "NG", label_fr: "Nigeria", label_en: "Nigeria" },
    { value: "SN", label_fr: "Sénégal", label_en: "Senegal" },
    { value: "ZA", label_fr: "Afrique du Sud", label_en: "South Africa" },
    { value: "TN", label_fr: "Tunisie", label_en: "Tunisia" },
  ],
  asia: [
    { value: "CN", label_fr: "Chine", label_en: "China" },
    { value: "IN", label_fr: "Inde", label_en: "India" },
    { value: "JP", label_fr: "Japon", label_en: "Japan" },
    { value: "KR", label_fr: "Corée du Sud", label_en: "South Korea" },
    { value: "AE", label_fr: "Émirats", label_en: "UAE" },
    { value: "SA", label_fr: "Arabie Saoudite", label_en: "Saudi Arabia" },
    { value: "TH", label_fr: "Thaïlande", label_en: "Thailand" },
    { value: "SG", label_fr: "Singapour", label_en: "Singapore" },
  ],
  europe: [
    { value: "FR", label_fr: "France", label_en: "France" },
    { value: "DE", label_fr: "Allemagne", label_en: "Germany" },
    { value: "ES", label_fr: "Espagne", label_en: "Spain" },
    { value: "IT", label_fr: "Italie", label_en: "Italy" },
    { value: "GB", label_fr: "Royaume-Uni", label_en: "United Kingdom" },
    { value: "BE", label_fr: "Belgique", label_en: "Belgium" },
    { value: "CH", label_fr: "Suisse", label_en: "Switzerland" },
    { value: "PT", label_fr: "Portugal", label_en: "Portugal" },
    { value: "NL", label_fr: "Pays-Bas", label_en: "Netherlands" },
    { value: "PL", label_fr: "Pologne", label_en: "Poland" },
    { value: "SE", label_fr: "Suède", label_en: "Sweden" },
    { value: "NO", label_fr: "Norvège", label_en: "Norway" },
    { value: "DK", label_fr: "Danemark", label_en: "Denmark" },
    { value: "AT", label_fr: "Autriche", label_en: "Austria" },
    { value: "GR", label_fr: "Grèce", label_en: "Greece" },
    { value: "RU", label_fr: "Russie", label_en: "Russia" },
    { value: "TR", label_fr: "Turquie", label_en: "Turkey" },
  ],
  north_america: [
    { value: "US", label_fr: "États-Unis", label_en: "United States" },
    { value: "CA", label_fr: "Canada", label_en: "Canada" },
    { value: "MX", label_fr: "Mexique", label_en: "Mexico" },
  ],
  south_america: [
    { value: "BR", label_fr: "Brésil", label_en: "Brazil" },
    { value: "AR", label_fr: "Argentine", label_en: "Argentina" },
    { value: "CO", label_fr: "Colombie", label_en: "Colombia" },
    { value: "CL", label_fr: "Chili", label_en: "Chile" },
    { value: "PE", label_fr: "Pérou", label_en: "Peru" },
  ],
  oceania: [
    { value: "AU", label_fr: "Australie", label_en: "Australia" },
    { value: "NZ", label_fr: "Nouvelle-Zélande", label_en: "New Zealand" },
  ],
};

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-5">
      <Text className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 tracking-wider">
        {label}
      </Text>
      {children}
    </View>
  );
}

function SelectBtn({
  active,
  onPress,
  children,
}: {
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`py-2 px-3 rounded-xl border items-center justify-center ${
        active ? "bg-primary/20 border-primary" : "bg-muted/30 border-transparent"
      }`}
    >
      {children}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { lang, setLang } = useI18n();
  const { user } = useAuth();
  const { data: profile, isLoading } = useUserProfile();
  const invalidateProfile = useInvalidateProfile();

  const [username, setUsername] = useState("");
  const [motto, setMotto] = useState("");
  const [gymName, setGymName] = useState("");
  const [gender, setGender] = useState("homme");
  const [ageBracket, setAgeBracket] = useState("20-29");
  const [continent, setContinent] = useState("europe");
  const [country, setCountry] = useState("FR");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"continent" | "country">("continent");

  useEffect(() => {
    if (!profile || hydrated) return;
    setUsername(profile.username || "");
    setMotto(profile.mantra || "");
    setGymName((profile as any).gym_name || "");
    setGender(profile.gender || "homme");
    setAgeBracket(profile.age_bracket || "20-29");
    setCountry(profile.country || "FR");
    setUnitSystem((profile as any).unit_system || "metric");
    for (const [cont, countries] of Object.entries(COUNTRIES_BY_CONTINENT)) {
      if (countries.some((c) => c.value === profile.country)) {
        setContinent(cont);
        break;
      }
    }
    setHydrated(true);
  }, [profile, hydrated]);

  const validateUsername = (val: string) => {
    if (val.length < 3) {
      setUsernameError(lang === "fr" ? "Minimum 3 caractères" : "Minimum 3 characters");
      return false;
    }
    if (val.length > 20) {
      setUsernameError(lang === "fr" ? "Maximum 20 caractères" : "Maximum 20 characters");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(val)) {
      setUsernameError(lang === "fr" ? "Lettres, chiffres et _ uniquement" : "Letters, numbers and _ only");
      return false;
    }
    setUsernameError("");
    return true;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!validateUsername(username)) return;
    setSaving(true);
    await supabase.auth.updateUser({ data: { language: lang } });
    const { error } = await supabase
      .from("users")
      .update({
        username,
        mantra: motto || null,
        gym_name: gymName.trim() || null,
        gender,
        age_bracket: ageBracket,
        country,
        unit_system: unitSystem,
        language: lang,
      } as any)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
        setUsernameError(lang === "fr" ? "Ce pseudo est déjà pris" : "This username is already taken");
      } else {
        Alert.alert(lang === "fr" ? "Erreur de sauvegarde" : "Save error");
      }
      return;
    }
    Alert.alert(lang === "fr" ? "Profil mis à jour" : "Profile updated");
    invalidateProfile();
  };

  const countries = COUNTRIES_BY_CONTINENT[continent] || [];
  const selectedContinent = CONTINENTS.find((c) => c.value === continent);
  const selectedCountry = countries.find((c) => c.value === country);

  const modalOptions = modalMode === "continent" ? CONTINENTS : countries;
  const modalTitle =
    modalMode === "continent"
      ? lang === "fr" ? "Choisir un continent" : "Choose a continent"
      : lang === "fr" ? "Choisir un pays" : "Choose a country";

  const handleSelectOption = (value: string) => {
    if (modalMode === "continent") {
      setContinent(value);
      setCountry("");
    } else {
      setCountry(value);
    }
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={["top"]}>
        <ActivityIndicator color="#00FF87" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={20} color="#888888" />
          </TouchableOpacity>
          <Text className="text-lg font-black text-foreground">
            {lang === "fr" ? "Paramètres" : "Settings"}
          </Text>
        </View>

        <FadeInView duration={300}>
          <FieldGroup label={lang === "fr" ? "Nom d'utilisateur" : "Username"}>
            <TextInput
              value={username}
              onChangeText={(v) => {
                setUsername(v);
                if (usernameError) validateUsername(v);
              }}
              maxLength={20}
              autoCapitalize="none"
              placeholderTextColor="#888888"
              keyboardAppearance="dark"
              className={`w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground border ${
                usernameError ? "border-red-500" : "border-border"
              }`}
            />
            <View className="flex-row justify-between mt-1">
              {usernameError ? (
                <Text className="text-[10px] text-red-500 font-bold">{usernameError}</Text>
              ) : (
                <View />
              )}
              <Text className="text-[10px] text-muted-foreground">{username.length}/20</Text>
            </View>
          </FieldGroup>

          <FieldGroup label={lang === "fr" ? "Ma devise" : "My Motto"}>
            <TextInput
              value={motto}
              onChangeText={(v) => setMotto(v.slice(0, 60))}
              placeholder={lang === "fr" ? "Ex: No pain no gain" : "E.g., No pain no gain"}
              placeholderTextColor="#888888"
              keyboardAppearance="dark"
              maxLength={60}
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
            />
            <Text className="text-[10px] text-muted-foreground mt-1 text-right">{motto.length}/60</Text>
          </FieldGroup>

          <FieldGroup label={lang === "fr" ? "Ma salle de sport" : "My Gym"}>
            <TextInput
              value={gymName}
              onChangeText={(v) => setGymName(v.slice(0, 40))}
              placeholder={lang === "fr" ? "Ex: Basic-Fit République" : "E.g., Basic-Fit Republic"}
              placeholderTextColor="#888888"
              keyboardAppearance="dark"
              maxLength={40}
              autoCapitalize="words"
              className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground"
            />
            <Text className="text-[10px] text-muted-foreground mt-1 text-right">{gymName.length}/40</Text>
          </FieldGroup>

          <FieldGroup label={lang === "fr" ? "Genre" : "Gender"}>
            <View className="flex-row">
              {GENDERS.map((g, i) => (
                <View key={g.value} className={`flex-1 ${i === 0 ? "mr-2" : ""}`}>
                  <SelectBtn active={gender === g.value} onPress={() => setGender(g.value)}>
                    <Text
                      className={`text-xs font-bold ${gender === g.value ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {lang === "fr" ? g.label_fr : g.label_en}
                    </Text>
                  </SelectBtn>
                </View>
              ))}
            </View>
          </FieldGroup>

          <FieldGroup label={lang === "fr" ? "Tranche d'âge" : "Age Bracket"}>
            <View className="flex-row flex-wrap">
              {AGE_BRACKETS.map((a) => (
                <View key={a} className="mr-2 mb-2">
                  <SelectBtn active={ageBracket === a} onPress={() => setAgeBracket(a)}>
                    <Text className={`text-xs font-bold ${ageBracket === a ? "text-primary" : "text-muted-foreground"}`}>
                      {a}
                    </Text>
                  </SelectBtn>
                </View>
              ))}
            </View>
          </FieldGroup>

          <FieldGroup label={lang === "fr" ? "Continent" : "Continent"}>
            <TouchableOpacity
              onPress={() => {
                setModalMode("continent");
                setIsModalOpen(true);
              }}
              className="bg-muted/50 border border-border rounded-xl p-4 flex-row justify-between items-center mb-4"
              activeOpacity={0.7}
            >
              <Text className={`text-sm font-semibold ${selectedContinent ? "text-foreground" : "text-muted-foreground"}`}>
                {selectedContinent
                  ? lang === "fr" ? selectedContinent.label_fr : selectedContinent.label_en
                  : lang === "fr" ? "Sélectionner..." : "Select..."}
              </Text>
              <ChevronDown size={18} color="#888888" />
            </TouchableOpacity>
          </FieldGroup>

          <FieldGroup label={lang === "fr" ? "Pays" : "Country"}>
            <TouchableOpacity
              onPress={() => {
                setModalMode("country");
                setIsModalOpen(true);
              }}
              disabled={!continent}
              className={`bg-muted/50 border border-border rounded-xl p-4 flex-row justify-between items-center mb-4 ${!continent ? "opacity-50" : ""}`}
              activeOpacity={0.7}
            >
              <Text className={`text-sm font-semibold ${selectedCountry ? "text-foreground" : "text-muted-foreground"}`}>
                {selectedCountry
                  ? lang === "fr" ? selectedCountry.label_fr : selectedCountry.label_en
                  : lang === "fr" ? "Sélectionner..." : "Select..."}
              </Text>
              <ChevronDown size={18} color="#888888" />
            </TouchableOpacity>
          </FieldGroup>

          <FieldGroup label={lang === "fr" ? "Unités de mesure" : "Unit System"}>
            <View className="flex-row">
              {(["metric", "imperial"] as const).map((u, i) => (
                <View key={u} className={`flex-1 ${i === 0 ? "mr-2" : ""}`}>
                  <SelectBtn active={unitSystem === u} onPress={() => setUnitSystem(u)}>
                    <Text className={`text-xs font-bold ${unitSystem === u ? "text-primary" : "text-muted-foreground"}`}>
                      {u === "metric"
                        ? lang === "fr" ? "Métrique (kg, km)" : "Metric (kg, km)"
                        : lang === "fr" ? "Impérial (lbs, mi)" : "Imperial (lbs, mi)"}
                    </Text>
                  </SelectBtn>
                </View>
              ))}
            </View>
          </FieldGroup>

          <FieldGroup label={lang === "fr" ? "Langue" : "Language"}>
            <View className="flex-row">
              {(["fr", "en"] as const).map((l, i) => (
                <View key={l} className={`flex-1 ${i === 0 ? "mr-2" : ""}`}>
                  <SelectBtn active={lang === l} onPress={() => setLang(l)}>
                    <Text className={`text-xs font-bold ${lang === l ? "text-primary" : "text-muted-foreground"}`}>
                      {l === "fr" ? "Français" : "English"}
                    </Text>
                  </SelectBtn>
                </View>
              ))}
            </View>
          </FieldGroup>

          <View className="pt-4">
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving || !!usernameError || username.length < 3}
              className="w-full py-4 rounded-xl bg-primary items-center"
              style={{
                opacity: saving || !!usernameError || username.length < 3 ? 0.5 : 1,
                shadowColor: "#00FF87",
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text className="text-black font-black text-sm">
                  {lang === "fr" ? "SAUVEGARDER" : "SAVE CHANGES"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="pt-6 border-t border-border mt-6">
            <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
              {lang === "fr" ? "Zone de danger" : "Danger zone"}
            </Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  lang === "fr" ? "Supprimer le compte" : "Delete account",
                  lang === "fr"
                    ? "Cette action est irréversible."
                    : "This action is irreversible.",
                  [
                    { text: lang === "fr" ? "Annuler" : "Cancel", style: "cancel" },
                    {
                      text: lang === "fr" ? "Supprimer" : "Delete",
                      style: "destructive",
                      onPress: () =>
                        Alert.alert(
                          lang === "fr"
                            ? "Contacte support@challengeme.pro"
                            : "Contact support@challengeme.pro",
                        ),
                    },
                  ],
                )
              }
              className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 items-center"
            >
              <Text className="text-red-500 font-black text-xs">
                {lang === "fr" ? "Supprimer mon compte" : "Delete my account"}
              </Text>
            </TouchableOpacity>
          </View>
        </FadeInView>
      </ScrollView>

      <Modal
        transparent
        animationType="slide"
        visible={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View className="bg-black/80 flex-1 justify-end">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setIsModalOpen(false)} />
          <View className="bg-card rounded-t-3xl max-h-[70%]">
            <View className="flex-row justify-between items-center px-6 py-4 border-b border-border/50">
              <Text className="text-base font-black text-foreground">{modalTitle}</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} hitSlop={10}>
                <X size={20} color="#888888" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {modalOptions.map((opt) => {
                const isSelected =
                  modalMode === "continent" ? opt.value === continent : opt.value === country;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => handleSelectOption(opt.value)}
                    className="py-4 px-6 border-b border-border/50"
                    activeOpacity={0.7}
                  >
                    <Text className={`text-sm ${isSelected ? "text-primary font-black" : "text-foreground"}`}>
                      {lang === "fr" ? opt.label_fr : opt.label_en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <View className="h-8" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
