import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useRouter, Link, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FadeInView } from "@/src/components/ui/FadeInView";
import { Input } from "@/src/components/ui/Input";
import { supabase } from "@/src/lib/supabase";
import { useI18n } from "@/src/lib/i18n";

const SUPABASE_ERRORS: Record<string, { fr: string; en: string }> = {
  "Invalid login credentials":   { fr: "Email ou mot de passe incorrect.", en: "Incorrect email or password." },
  "Email not confirmed":         { fr: "Confirme ton email avant de te connecter.", en: "Please confirm your email before signing in." },
  "User already registered":     { fr: "Un compte existe déjà avec cet email.", en: "An account already exists with this email." },
  "Password should be at least": { fr: "Le mot de passe doit contenir au moins 6 caractères.", en: "Password must be at least 6 characters." },
  "invalid format":              { fr: "Format d'email invalide.", en: "Invalid email format." },
};

function translateError(msg: string, lang: string): string {
  for (const key of Object.keys(SUPABASE_ERRORS)) {
    if (msg.includes(key)) return lang === "fr" ? SUPABASE_ERRORS[key].fr : SUPABASE_ERRORS[key].en;
  }
  return lang === "fr" ? "Une erreur est survenue. Réessaie." : "An error occurred. Please try again.";
}

export default function AuthScreen() {
  const { lang } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const label = (fr: string, en: string) => (lang === "fr" ? fr : en);

  const [isSignUp, setIsSignUp] = useState(mode !== "login");
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  useEffect(() => {
    setIsSignUp(mode !== "login");
  }, [mode]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [acceptCGU, setAcceptCGU] = useState(false);

  const resetState = () => {
    setError("");
    setSuccess("");
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          first_name: firstName,
          last_name: lastName,
          cgu_accepted_at: new Date().toISOString(),
          cgu_version: "Avril 2026",
        },
      },
    });
    setLoading(false);
    if (error) {
      setError(translateError(error.message, lang));
    } else {
      setSuccess(
        label(
          "Compte créé ! Vérifie ton email pour confirmer.",
          "Account created! Check your email to confirm.",
        ),
      );
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(translateError(error.message, lang));
    }
    // Auth listener in AuthContext handles session update & NavigationGuard redirects
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError(label("Entre ton email.", "Enter your email."));
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setError(translateError(error.message, lang));
    } else {
      setSuccess(label("Email envoyé ! Vérifie ta boîte mail.", "Email sent! Check your inbox."));
    }
  };

  const handleSubmit = () => {
    if (isForgotPassword) handleForgotPassword();
    else if (isSignUp) handleSignUp();
    else handleLogin();
  };

  const isValid = isForgotPassword
    ? !!email
    : isSignUp
      ? !!(email && password.length >= 6 && username.length >= 3 && firstName && lastName && acceptCGU)
      : !!(email && password);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 justify-center">
          {/* Back button */}
          <TouchableOpacity
            onPress={() =>
              isForgotPassword
                ? (setIsForgotPassword(false), resetState())
                : router.replace({ pathname: "/(public)/landing/" })
            }
            className="flex-row items-center gap-1 mb-8"
          >
            <ArrowLeft size={14} color="#888888" />
            <Text className="text-xs text-muted-foreground">
              {isForgotPassword
                ? label("Retour à la connexion", "Back to sign in")
                : label("Retour à l'accueil", "Back to home")}
            </Text>
          </TouchableOpacity>

          <FadeInView duration={400} className="space-y-6">
            {/* Logo */}
            <View className="items-center mb-2">
              <Text className="text-2xl font-black">
                <Text className="text-primary">ChallengeMe</Text>
                <Text> {"\u26a1"}</Text>
              </Text>
              <Text className="text-lg font-black text-foreground mt-4">
                {isForgotPassword
                  ? label("Mot de passe oublié", "Forgot Password")
                  : isSignUp
                    ? label("Créer un compte", "Create Account")
                    : label("Se connecter", "Sign In")}
              </Text>
              {isForgotPassword && (
                <Text className="text-xs text-muted-foreground mt-1 text-center">
                  {label(
                    "Entre ton email et on t'envoie un lien de réinitialisation.",
                    "Enter your email and we'll send you a reset link.",
                  )}
                </Text>
              )}
            </View>

            {/* Feedback */}
            {!!success && (
              <View className="bg-primary/20 border border-primary rounded-xl p-3">
                <Text className="text-xs text-primary font-bold text-center">{success}</Text>
              </View>
            )}
            {!!error && (
              <View className="bg-destructive/20 border border-destructive rounded-xl p-3">
                <Text className="text-xs text-destructive font-bold text-center">{error}</Text>
              </View>
            )}

            {/* Sign-up only fields */}
            {isSignUp && !isForgotPassword && (
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Input
                    label={label("Prénom", "First Name")}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="John"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label={label("Nom", "Last Name")}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Doe"
                  />
                </View>
              </View>
            )}
            {isSignUp && !isForgotPassword && (
              <Input
                label={label("Nom d'utilisateur", "Username")}
                value={username}
                onChangeText={setUsername}
                placeholder={label("Choisis un pseudo...", "Pick a username...")}
              />
            )}

            {/* Email */}
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCapitalize="none"
            />

            {/* Password */}
            {!isForgotPassword && (
              <View>
                <Text className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                  {label("Mot de passe", "Password")}
                </Text>
                <View className="flex-row items-center bg-muted border border-border rounded-xl px-4">
                  <Input
                    className="flex-1 border-0 bg-transparent px-0"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    textContentType={isSignUp ? "newPassword" : "password"}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="pl-2 py-3">
                    {showPassword ? (
                      <EyeOff size={16} color="#888888" />
                    ) : (
                      <Eye size={16} color="#888888" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Forgot password link */}
            {!isSignUp && !isForgotPassword && (
              <TouchableOpacity
                onPress={() => {
                  setIsForgotPassword(true);
                  resetState();
                }}
                className="self-end -mt-2"
              >
                <Text className="text-xs text-muted-foreground underline">
                  {label("Mot de passe oublié ?", "Forgot password?")}
                </Text>
              </TouchableOpacity>
            )}

            {/* CGU checkbox */}
            {isSignUp && !isForgotPassword && (
              <View className="gap-3 pt-2">
                <TouchableOpacity
                  onPress={() => setAcceptCGU(!acceptCGU)}
                  className="flex-row items-start gap-3"
                >
                  <View
                    className={`w-4 h-4 rounded mt-0.5 border-2 items-center justify-center ${
                      acceptCGU ? "bg-primary border-primary" : "border-border"
                    }`}
                  >
                    {acceptCGU && (
                      <Text className="text-primary-foreground text-[10px] font-black">
                        {"\u2713"}
                      </Text>
                    )}
                  </View>
                  <Text className="text-xs text-muted-foreground flex-1 leading-relaxed">
                    {label("J'accepte les ", "I accept the ")}
                    <Link href="/(public)/terms">
                      <Text className="text-primary font-bold">
                        {label("Conditions Générales d'Utilisation", "Terms and Conditions")}
                      </Text>
                    </Link>
                    <Text className="text-destructive"> *</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Submit button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || !isValid}
              className={`w-full py-4 rounded-xl items-center ${
                loading || !isValid ? "bg-muted" : "bg-primary"
              }`}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#888888" />
              ) : (
                <Text
                  className={`font-black text-sm ${
                    loading || !isValid ? "text-muted-foreground" : "text-primary-foreground"
                  }`}
                >
                  {isForgotPassword
                    ? label("ENVOYER LE LIEN \ud83d\udce9", "SEND RESET LINK \ud83d\udce9")
                    : isSignUp
                      ? label("CRÉER MON COMPTE \ud83d\ude80", "CREATE MY ACCOUNT \ud83d\ude80")
                      : label("SE CONNECTER \u2192", "SIGN IN \u2192")}
                </Text>
              )}
            </TouchableOpacity>

            {/* Switch mode */}
            {!isForgotPassword && (
              <View className="flex-row justify-center gap-1">
                <Text className="text-xs text-muted-foreground">
                  {isSignUp
                    ? label("Déjà un compte ?", "Already have an account?")
                    : label("Pas encore de compte ?", "Don't have an account?")}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsSignUp(!isSignUp);
                    resetState();
                  }}
                >
                  <Text className="text-xs text-primary font-bold underline">
                    {isSignUp ? label("Se connecter", "Sign In") : label("S'inscrire", "Sign Up")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </FadeInView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
