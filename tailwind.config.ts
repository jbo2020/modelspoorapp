import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces — warmed cream, technical archive feel
        paper: "#F4EEE2",
        paper2: "#EBE3D2",
        surface: "#FFFFFF",
        ink: "#16181C",
        ink2: "#3C3D42",
        muted: "#807A6F",
        faint: "#B5AC9C",
        line: "#E1D9C8",
        rule: "#D6CCB7",

        // Accent + status
        sbb: "#D0091F",
        sbbDim: "#A50817",
        accentGreen: "#1F7A4D",
        accentYellow: "#B57E0E",

        dark: {
          bg: "#1A1A1C",
          surface: "#222226",
          text: "#E8E8EA",
          muted: "#9A9AA0",
          line: "#2C2C30",
        },

        // Era band (Zwitserse tijdperken) — versterkte palette
        era: {
          1: "#7B5E3A",
          2: "#9A7544",
          3: "#B58A57",
          4: "#6E7E84",
          5: "#48708A",
          6: "#2E5F7F",
        },
      },
      fontFamily: {
        sans: [
          '"Helvetica Neue"',
          "Helvetica",
          "var(--font-inter)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          '"JetBrains Mono"',
          '"IBM Plex Mono"',
          "ui-monospace",
          "Menlo",
          "monospace",
        ],
      },
      maxWidth: { app: "1320px" },
      letterSpacing: {
        eyebrow: "0.16em",
      },
    },
  },
  plugins: [],
};
export default config;
