import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF8F5",
        ink: "#1F2125",
        muted: "#6B6E73",
        line: "#E5E1DA",
        sbb: "#D0091F",
        sbbDim: "#A8071A",
        dark: {
          bg: "#1A1A1C",
          surface: "#222226",
          text: "#E8E8EA",
          muted: "#9A9AA0",
          line: "#2C2C30",
        },
        era: {
          1: "#8B6F47",
          2: "#A07A4F",
          3: "#B58A57",
          4: "#7E8E94",
          5: "#5B7A8B",
          6: "#3F6B83",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      maxWidth: { app: "1280px" },
    },
  },
  plugins: [],
};
export default config;
