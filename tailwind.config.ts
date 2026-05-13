import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces — pushed cream, editorial archive feel (Redesign v2)
        paper: "#F1EADA",
        paper2: "#E5DBC2",
        paper3: "#D7CBAE",
        surface: "#FFFFFF",
        ink: "#0F1115",
        ink2: "#3A3C42",
        muted: "#7A7466",
        faint: "#B5AC9C",
        line: "#DDD4BE",
        rule: "#CDC1A4",

        sbb: "#C5051C",
        sbbDim: "#8E0414",
        accentGreen: "#1C6B43",
        accentYellow: "#A87206",
        ochre: "#B68D2D",

        dark: {
          bg: "#1A1A1C",
          surface: "#222226",
          text: "#E8E8EA",
          muted: "#9A9AA0",
          line: "#2C2C30",
        },

        // Era band — pushed for richer use
        era: {
          1: "#6B4F2E",
          2: "#8C6635",
          3: "#B0823F",
          4: "#566C77",
          5: "#345D77",
          6: "#1F4A66",
        },
        // Era tints — pale fills voor EraBadge backgrounds
        eraTint: {
          1: "#EEDFC4",
          2: "#EBD8B6",
          3: "#EFD3A1",
          4: "#D8DEE0",
          5: "#C8D5DE",
          6: "#B8CADA",
        },
      },
      fontFamily: {
        serif: [
          "var(--font-serif)",
          '"Instrument Serif"',
          '"Cormorant Garamond"',
          "Georgia",
          '"Times New Roman"',
          "serif",
        ],
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
        eyebrow: "0.18em",
        eyebrowWide: "0.24em",
      },
    },
  },
  plugins: [],
};
export default config;
