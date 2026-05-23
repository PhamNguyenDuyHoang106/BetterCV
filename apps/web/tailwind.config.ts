import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "glass-border": "rgba(255, 255, 255, 0.4)",
        "background": "#f5faff",
        "glass-bg": "rgba(255, 255, 255, 0.4)",
        "surface-variant": "#d3e5f2",
        "surface-container": "#def0fe",
        "on-primary-container": "#003f5d",
        "primary-fixed": "#c9e6ff",
        "secondary-container": "#c7e7fa",
        "primary-container": "#5dade2",
        "tertiary-fixed": "#dee3e6",
        "on-secondary": "#ffffff",
        "surface-tint": "#006491",
        "primary-fixed-dim": "#8aceff",
        "on-secondary-container": "#4a6878",
        "outline": "#707880",
        "secondary": "#446272",
        "on-primary-fixed-variant": "#004b6f",
        "on-surface": "#0c1d27",
        "text-secondary": "#5A7383",
        "on-tertiary-fixed-variant": "#42484a",
        "on-tertiary-container": "#363c3e",
        "on-primary-fixed": "#001e2f",
        "primary": "#006491",
        "surface-bright": "#f5faff",
        "surface-container-high": "#d8ebf8",
        "on-error-container": "#93000a",
        "tertiary-fixed-dim": "#c2c7ca",
        "error-container": "#ffdad6",
        "outline-variant": "#bfc7d0",
        "on-secondary-fixed": "#001f2b",
        "on-background": "#0c1d27",
        "accent-glow": "rgba(93, 173, 226, 0.3)",
        "surface-container-highest": "#d3e5f2",
        "inverse-primary": "#8aceff",
        "on-tertiary-fixed": "#171c1f",
        "inverse-on-surface": "#e3f3ff",
        "surface-dim": "#caddea",
        "on-primary": "#ffffff",
        "error": "#ba1a1a",
        "on-tertiary": "#ffffff",
        "secondary-fixed": "#c7e7fa",
        "surface-container-low": "#e9f5ff",
        "on-error": "#ffffff",
        "inverse-surface": "#22323d",
        "tertiary-container": "#a1a6a9",
        "surface-container-lowest": "#ffffff",
        "on-secondary-fixed-variant": "#2c4b59",
        "tertiary": "#5a5f62",
        "secondary-fixed-dim": "#abcbdd",
        "surface": "#f5faff",
        "text-primary": "#1C2D37",
        "on-surface-variant": "#40484f"
      },
      spacing: {
        "grid-gutter": "24px",
        "container-margin": "24px",
        "section-gap": "64px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "card-padding": "32px"
      },
      fontFamily: {
        "hero-title": ["Inter", "sans-serif"],
        "label-sm": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"],
        "hero-title-mobile": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "section-title": ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
