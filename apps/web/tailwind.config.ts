import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "glass-border": "rgba(255, 255, 255, 0.5)",
        "background": "#f6fbf7",
        "glass-bg": "rgba(255, 255, 255, 0.55)",
        "surface-variant": "#dcefe0",
        "surface-container": "#e8f5ea",
        "on-primary-container": "#1a4d2e",
        "primary-fixed": "#d4f0d6",
        "secondary-container": "#c8e6cc",
        "primary-container": "#8fd493",
        "tertiary-fixed": "#dee8e0",
        "on-secondary": "#ffffff",
        "surface-tint": "#ACE1AF",
        "primary-fixed-dim": "#b8e6bb",
        "on-secondary-container": "#3d5c44",
        "outline": "#6b7d70",
        "secondary": "#4a6b52",
        "on-primary-fixed-variant": "#2d6a3e",
        "on-surface": "#142318",
        "text-secondary": "#4a6350",
        "on-tertiary-fixed-variant": "#424a44",
        "on-tertiary-container": "#363e38",
        "on-primary-fixed": "#0d2818",
        "primary": "#ACE1AF",
        "primary-dark": "#7bc47e",
        "primary-darker": "#2d6a3e",
        "surface-bright": "#f6fbf7",
        "surface-container-high": "#d8edd9",
        "on-error-container": "#93000a",
        "tertiary-fixed-dim": "#c2cac4",
        "error-container": "#ffdad6",
        "outline-variant": "#b8c9bb",
        "on-secondary-fixed": "#0d2818",
        "on-background": "#142318",
        "accent-glow": "rgba(172, 225, 175, 0.45)",
        "surface-container-highest": "#cce8cf",
        "inverse-primary": "#2d6a3e",
        "on-tertiary-fixed": "#171f19",
        "inverse-on-surface": "#e8f5ea",
        "surface-dim": "#d4e8d6",
        "on-primary": "#1a3d28",
        "error": "#ba1a1a",
        "on-tertiary": "#ffffff",
        "secondary-fixed": "#c8e6cc",
        "surface-container-low": "#eef8ef",
        "on-error": "#ffffff",
        "inverse-surface": "#1e3324",
        "tertiary-container": "#a1a9a3",
        "surface-container-lowest": "#ffffff",
        "on-secondary-fixed-variant": "#2c4b36",
        "tertiary": "#5a625c",
        "secondary-fixed-dim": "#abceaf",
        "surface": "#f6fbf7",
        "text-primary": "#142318",
        "on-surface-variant": "#404a44"
      },
      spacing: {
        "grid-gutter": "24px",
        "container-margin": "24px",
        "section-gap": "64px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "card-padding": "32px",
        "topnav-height": "4.25rem"
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        "hero-title": ["Inter", "sans-serif"],
        "label-sm": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"],
        "hero-title-mobile": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "section-title": ["Inter", "sans-serif"]
      },
      backgroundImage: {
        "landing-mesh": "radial-gradient(ellipse 80% 50% at 20% 40%, rgba(172,225,175,0.35) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 20%, rgba(143,212,147,0.25) 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 60% 80%, rgba(212,240,214,0.4) 0%, transparent 50%)"
      }
    }
  },
  plugins: []
};

export default config;
