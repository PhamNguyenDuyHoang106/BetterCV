"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "../lib/store/language";

export function LanguageDropdown() {
  const { language, setLanguage } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="inline-block h-8 w-16 bg-slate-100/50 rounded-full animate-pulse" />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-all select-none group"
      title={language === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
    >
      <div className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
        <span className="material-symbols-outlined text-[13px] text-slate-500 leading-none">
          language
        </span>
      </div>
      <span className="text-xs font-bold uppercase text-slate-600 group-hover:text-slate-800 transition-colors pr-0.5">
        {language === "vi" ? "vn" : "en"}
      </span>
    </button>
  );
}
