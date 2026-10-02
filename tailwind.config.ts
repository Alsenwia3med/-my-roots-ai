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
        // ROOTS-AI Dark Blue Theme
        'roots-dark': '#0a1628',
        'roots-blue': '#1e3a5f',
        'roots-blue-light': '#2d5a87',
        'roots-accent': '#3b82f6',
        'roots-gold': '#f59e0b',
        'roots-gold-light': '#fbbf24',
        'roots-white': '#ffffff',
        'roots-gray': '#e5e7eb',
        'roots-text': '#1f2937',
        'roots-text-light': '#6b7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'hero': ['clamp(48px, 5vw, 72px)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'section-title': ['clamp(32px, 4vw, 48px)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
      },
    },
  },
  plugins: [],
};

export default config;
