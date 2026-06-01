import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        secondary: "#0f172a",
        midnight: '#0F172A',
        growth: '#10B981',
        alert: '#F59E0B', 
        trust: '#3B82F6',
        surface: '#F8FAFC',
        card: '#FFFFFF',
        muted: '#64748B',
      },
    },
  },
  plugins: [],
};

export default config;
