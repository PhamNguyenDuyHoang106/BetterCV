import { create } from "zustand";

export type Language = "vi" | "en";

type LanguageState = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

const STORAGE_KEY = "acv-lang";
const isClient = typeof window !== "undefined";

const getInitialLanguage = (): Language => {
  if (!isClient) return "vi";
  const saved = localStorage.getItem(STORAGE_KEY) as Language;
  if (saved === "vi" || saved === "en") return saved;
  
  // Browser language detection flow
  const browserLang = navigator.language;
  return browserLang.startsWith("vi") ? "vi" : "en";
};

export const useLanguageStore = create<LanguageState>((set) => ({
  language: getInitialLanguage(),
  setLanguage: (language) => {
    if (isClient) {
      localStorage.setItem(STORAGE_KEY, language);
    }
    set({ language });
  },
}));

