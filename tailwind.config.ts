import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ROOTS-AI Design System Colors
        ink: "#15171a",
        muted: "#626971",
        line: "#d8dce1",
        soft: "#f4f5f6",
        paper: "#ffffff",
        accent: "#2258d5",
        "accent-ink": "#ffffff",
        focus: "#ff9d00",
        danger: "#a42b27",
      },
      spacing: {
        content: "1180px",
      },
      borderRadius: {
        roots: "14px",
      },
      boxShadow: {
        roots: "0 18px 44px rgba(18, 25, 38, .10)",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Arial", "sans-serif"],
      },
      fontSize: {
        hero: ["clamp(42px, 6.2vw, 82px)", { lineHeight: "0.98", letterSpacing: "-0.055em" }],
        h2: ["clamp(30px, 3.8vw, 50px)", { lineHeight: "1.05", letterSpacing: "-0.045em" }],
        lead: ["clamp(18px, 2vw, 22px)", { lineHeight: "1.55" }],
      },
    },
  },
  plugins: [],
};

export default config;
