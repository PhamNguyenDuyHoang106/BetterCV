import { useState, useEffect } from "react";
import { useLanguageStore } from "../lib/store/language";
import { translations } from "../lib/translations";
import { TranslationSchema } from "../lib/translations/types";

export function useTranslation() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeLang = mounted ? language : "vi";
  
  // Get active translations, default to English as type check fallback
  const t: TranslationSchema = translations[activeLang] || translations.en;
  
  return {
    t,
    language: activeLang,
    mounted,
  };
}
