import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Session, type User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { supabase } from "@/src/lib/supabase";
import { useI18n } from "@/src/lib/i18n";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setLang } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLanguageSynced, setIsLanguageSynced] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
      if (!session?.user) setIsLanguageSynced(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[AUTH] Changement d'état détecté :", _event);
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
      if (!session?.user) setIsLanguageSynced(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setIsLanguageSynced(false);
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("users")
        .select("language")
        .eq("id", user.id)
        .single();
      if (cancelled) return;
      const nextLang = (data as { language?: string } | null)?.language;
      if (nextLang === "fr" || nextLang === "en") setLang(nextLang);
      setIsLanguageSynced(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, setLang]);

  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      const queryString = url.split("#")[1] || url.split("?")[1];
      if (!queryString) return;

      const params: Record<string, string> = {};
      queryString.split("&").forEach((pair) => {
        const [key, value] = pair.split("=");
        if (key && value) params[key] = decodeURIComponent(value);
      });

      if (params.access_token && params.refresh_token) {
        console.log("[AUTH] Token intercepté depuis l'URL ! Configuration de la session...");
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });

        if (error) {
          console.error("[AUTH] Erreur d'injection du token:", error.message);
        } else {
          console.log("[AUTH] Token validé ! Le listener onAuthStateChange va prendre le relais.");
        }
      }
    };

    Linking.getInitialURL().then(handleDeepLink);

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isLoading = isAuthLoading || (!!user && !isLanguageSynced);

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
