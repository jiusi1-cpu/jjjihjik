import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#050816",
        surface: "#0c1329",
        panel: "#111a35",
        border: "rgba(148, 163, 184, 0.16)",
        primary: {
          DEFAULT: "#5B8CFF",
          foreground: "#EFF4FF"
        },
        success: "#34d399",
        warning: "#fbbf24",
        danger: "#fb7185"
      },
      boxShadow: {
        glow: "0 16px 50px rgba(91, 140, 255, 0.18)"
      },
      backgroundImage: {
        grid: "radial-gradient(circle at top, rgba(91, 140, 255, 0.14), transparent 36%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
