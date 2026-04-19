import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { FadeInView } from "@/src/components/ui/FadeInView";
import { Camera, ChevronDown, X } from "lucide-react-native";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/contexts/AuthContext";
import { useI18n } from "@/src/lib/i18n";
import { useInvalidateProfile } from "@/src/hooks/useUserProfile";
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

export default function Onboarding() {
  const router = useRouter();
  const { lang } = useI18n();
  const { user } = useAuth();
  const invalidateProfile = useInvalidateProfile();

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [motto, setMotto] = useState("");
  const [gymName, setGymName] = useState("");
  const [gender, setGender] = useState("homme");
  const [ageBracket, setAgeBracket] = useState("20-29");
  const [continent, setContinent] = useState("europe");
  const [country, setCountry] = useState("FR");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [selectedLanguage, setSelectedLanguage] = useState<"fr" | "en">(lang);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"continent" | "country">("continent");

  const handlePickPhoto = async () => {
    if (!user) return;
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
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert(lang === "fr" ? "Photo trop lourde (max 5 Mo)" : "Photo too large (max 5 MB)");
      return;
    }
    setUploading(true);
    try {
      const ext = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";
      const filePath = `${user.id}/avatar.${ext}`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, arrayBuffer, { contentType: mimeType, upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUri(`${urlData.publicUrl}?t=${Date.now()}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert(lang === "fr" ? "Erreur de sauvegarde" : "Save error", message);
    } finally {
      setUploading(false);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: langError } = await supabase.auth.updateUser({
        data: { language: selectedLanguage },
      });
      if (langError) throw langError;

      const { error: upsertError } = await supabase.from("users").upsert({
        id: user.id,
        username: user.user_metadata?.username,
        email: user.email,
        unit_system: unitSystem,
        age_bracket: ageBracket,
        gender,
        country,
        mantra: motto.trim() || null,
        gym_name: gymName.trim() || null,
        avatar_url: avatarUri,
        cgu_accepted_at: new Date().toISOString(),
        cgu_version: "Avril 2026",
      });
      if (upsertError) throw upsertError;

      invalidateProfile();
      router.replace("/(tabs)/feed");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert(lang === "fr" ? "Erreur de sauvegarde" : "Save error", message);
    } finally {
      setSaving(false);
    }
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <Text className="text-2xl font-black text-foreground">
            {lang === "fr" ? "Finalise ton profil" : "Finalize your profile"}
          </Text>
          <Text className="text-xs text-muted-foreground mt-1">
            {lang === "fr"
              ? "Quelques infos pour personnaliser ton expérience."
              : "A few details to personalize your experience."}
          </Text>
        </View>

        <FadeInView duration={300}>
          <FieldGroup label={lang === "fr" ? "Photo de profil" : "Profile photo"}>
            <View className="items-center">
              <TouchableOpacity
                onPress={handlePickPhoto}
                disabled={uploading}
                className="w-24 h-24 rounded-full bg-muted border border-border items-center justify-center overflow-hidden"
                activeOpacity={0.8}
              >
                {uploading ? (
                  <ActivityIndicator color="#00FF87" />
                ) : avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                ) : (
                  <Camera size={24} color="#888888" />
                )}
              </TouchableOpacity>
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
                  <SelectBtn active={selectedLanguage === l} onPress={() => setSelectedLanguage(l)}>
                    <Text
                      className={`text-xs font-bold ${selectedLanguage === l ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {l === "fr" ? "Français" : "English"}
                    </Text>
                  </SelectBtn>
                </View>
              ))}
            </View>
          </FieldGroup>

          <View className="pt-4">
            <TouchableOpacity
              onPress={handleFinish}
              disabled={saving || uploading}
              className="w-full py-4 rounded-xl bg-primary items-center"
              style={{
                opacity: saving || uploading ? 0.5 : 1,
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
                  {lang === "fr" ? "FINALISER MON PROFIL" : "FINALIZE MY PROFILE"}
                </Text>
              )}
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
