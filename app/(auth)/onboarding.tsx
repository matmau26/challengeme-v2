import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera } from "lucide-react-native";

type Lang = "FR" | "EN";
type Unit = "KG" | "LBS";

const CONTINENTS = [
  "Afrique",
  "Amérique du Nord",
  "Amérique du Sud",
  "Asie",
  "Europe",
  "Océanie",
];

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [mantra, setMantra] = useState("");
  const [age, setAge] = useState("");
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState("");
  const [gym, setGym] = useState("");
  const [language, setLanguage] = useState<Lang>("FR");
  const [unitSystem, setUnitSystem] = useState<Unit>("KG");

  const handlePickPhoto = () => {
    console.log("[ONBOARDING] upload factice photo");
    setPhotoUri("mock://profile-photo");
  };

  const handleFinish = () => {
    const payload = {
      photoUri,
      mantra,
      age,
      continent,
      country,
      gym,
      language,
      unitSystem,
    };
    console.log("[ONBOARDING] profile:", payload);
    router.replace("/(tabs)/feed");
  };

  const labelClass = "text-muted-foreground text-xs uppercase";
  const inputClass =
    "w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground";

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          gap: 16,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-2">
          <Text className="text-2xl font-black text-foreground">
            Finalise ton profil
          </Text>
          <Text className="text-xs text-muted-foreground mt-1">
            Quelques infos pour personnaliser ton expérience.
          </Text>
        </View>

        {/* Photo de profil */}
        <View>
          <Text className={labelClass}>Photo de profil</Text>
          <TouchableOpacity
            onPress={handlePickPhoto}
            className="mt-1.5 w-24 h-24 rounded-full bg-muted border border-border items-center justify-center"
            activeOpacity={0.8}
          >
            {photoUri ? (
              <Text className="text-xs text-primary font-bold">OK</Text>
            ) : (
              <Camera size={24} color="#888888" />
            )}
          </TouchableOpacity>
        </View>

        {/* Devise / Mantra */}
        <View>
          <Text className={labelClass}>Devise / Mantra</Text>
          <TextInput
            value={mantra}
            onChangeText={setMantra}
            placeholder="No pain, no gain"
            placeholderTextColor="#888888"
            selectionColor="#00FF87"
            keyboardAppearance="dark"
            maxLength={80}
            className={`${inputClass} mt-1.5`}
          />
        </View>

        {/* Âge */}
        <View>
          <Text className={labelClass}>Âge</Text>
          <TextInput
            value={age}
            onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ""))}
            placeholder="25"
            placeholderTextColor="#888888"
            selectionColor="#00FF87"
            keyboardAppearance="dark"
            keyboardType="number-pad"
            maxLength={3}
            className={`${inputClass} mt-1.5`}
          />
        </View>

        {/* Continent */}
        <View>
          <Text className={labelClass}>Continent</Text>
          <View className="flex-row flex-wrap gap-2 mt-1.5">
            {CONTINENTS.map((c) => {
              const active = continent === c;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setContinent(c)}
                  className={`px-3 py-2 rounded-xl border ${
                    active
                      ? "bg-primary border-primary"
                      : "bg-muted border-border"
                  }`}
                  activeOpacity={0.85}
                >
                  <Text
                    className={`text-xs font-bold ${
                      active ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Pays */}
        <View>
          <Text className={labelClass}>Pays</Text>
          <TextInput
            value={country}
            onChangeText={setCountry}
            placeholder="France"
            placeholderTextColor="#888888"
            selectionColor="#00FF87"
            keyboardAppearance="dark"
            className={`${inputClass} mt-1.5`}
          />
        </View>

        {/* Salle de sport */}
        <View>
          <Text className={labelClass}>Salle de sport</Text>
          <TextInput
            value={gym}
            onChangeText={setGym}
            placeholder="Basic-Fit Paris 11"
            placeholderTextColor="#888888"
            selectionColor="#00FF87"
            keyboardAppearance="dark"
            className={`${inputClass} mt-1.5`}
          />
        </View>

        {/* Langue */}
        <View>
          <Text className={labelClass}>Langue</Text>
          <View className="flex-row gap-2 mt-1.5">
            {(["FR", "EN"] as Lang[]).map((l) => {
              const active = language === l;
              return (
                <TouchableOpacity
                  key={l}
                  onPress={() => setLanguage(l)}
                  className={`flex-1 py-3 rounded-xl border items-center ${
                    active
                      ? "bg-primary border-primary"
                      : "bg-muted border-border"
                  }`}
                  activeOpacity={0.85}
                >
                  <Text
                    className={`text-xs font-black ${
                      active ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {l}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Système */}
        <View>
          <Text className={labelClass}>Système</Text>
          <View className="flex-row gap-2 mt-1.5">
            {(["KG", "LBS"] as Unit[]).map((u) => {
              const active = unitSystem === u;
              return (
                <TouchableOpacity
                  key={u}
                  onPress={() => setUnitSystem(u)}
                  className={`flex-1 py-3 rounded-xl border items-center ${
                    active
                      ? "bg-primary border-primary"
                      : "bg-muted border-border"
                  }`}
                  activeOpacity={0.85}
                >
                  <Text
                    className={`text-xs font-black ${
                      active ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleFinish}
          className="w-full py-4 rounded-xl items-center bg-primary mt-4"
          activeOpacity={0.85}
        >
          <Text className="font-black text-sm text-primary-foreground">
            FINALISER MON PROFIL
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
