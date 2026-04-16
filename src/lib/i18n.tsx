import { createContext, useContext, useState, type ReactNode } from "react";

type Lang = "fr" | "en";

const translations = {
  fr: {
    "hero.title": "Forge ta légende.",
    "hero.sub": "Choisis ton challenge. Arrache ton score. Défie tes amis.",
    "hero.cta": "REJOINDRE GRATUITEMENT \u2192",
    "hero.step1": "Choisis",
    "hero.step2": "Score",
    "hero.step3": "Partage",
    "hero.step1d": "Choisis ton défi parmi des dizaines de challenges sportifs.",
    "hero.step2d": "L'IA analyse ta perf et te donne un score de 0 à 100.",
    "hero.step3d": "Partage ta carte de score et défie tes amis.",
    "nav.feed": "D\u00e9fis",
    "nav.leaderboard": "Classement",
    "nav.profile": "Profil",
    "feed.all": "Tous",
    "feed.accept": "REL\u00c8VE LE D\u00c9FI \u2192",
    "feed.beat_record": "BATTRE MON RECORD \u2192",
    "detail.rules": "R\u00c8GLES",
    "detail.top": "TOP PERFORMERS",
    "detail.start": "COMMENCER LE D\u00c9FI \ud83d\ude80",
    "detail.submit": "SOUMETTRE \u2192",
    "result.retry": "R\u00c9ESSAYER \ud83d\udd04",
    "result.back": "RETOUR AU FEED",
  },
  en: {
    "hero.title": "Forge your legend.",
    "hero.sub": "Pick a challenge. Earn your score. Defy your friends.",
    "hero.cta": "JOIN FOR FREE \u2192",
    "hero.step1": "Pick",
    "hero.step2": "Score",
    "hero.step3": "Share",
    "hero.step1d": "Choose your challenge from dozens of sports challenges.",
    "hero.step2d": "AI analyzes your performance and gives you a score from 0 to 100.",
    "hero.step3d": "Share your score card and challenge your friends.",
    "nav.feed": "Challenges",
    "nav.leaderboard": "Leaderboard",
    "nav.profile": "Profile",
    "feed.all": "All",
    "feed.accept": "TAKE THE CHALLENGE \u2192",
    "feed.beat_record": "BEAT MY RECORD \u2192",
    "detail.rules": "RULES",
    "detail.top": "TOP PERFORMERS",
    "detail.start": "START CHALLENGE \ud83d\ude80",
    "detail.submit": "SUBMIT \u2192",
    "result.retry": "TRY AGAIN \ud83d\udd04",
    "result.back": "BACK TO FEED",
  },
} as const;

type TranslationKey = keyof typeof translations.fr;

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");
  const t = (key: TranslationKey) => translations[lang][key] || key;
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
