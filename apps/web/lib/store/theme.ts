import { create } from "zustand";

export type Theme = "light" | "dark";

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "acv-theme";
const isClient = typeof window !== "undefined";

const getInitialTheme = (): Theme => {
  if (!isClient) return "light";
  const saved = localStorage.getItem(STORAGE_KEY) as Theme;
  let theme: Theme = "light";
  if (saved === "light" || saved === "dark") {
    theme = saved;
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    theme = prefersDark ? "dark" : "light";
  }
  
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  return theme;
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    if (isClient) {
      localStorage.setItem(STORAGE_KEY, theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    set({ theme });
  },
}));
