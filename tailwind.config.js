/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Matches the design system's "Primary action" (#2563EB) / "Hover"
        // (#1D4ED8) / "Focus" (#3B82F6) accent colors exactly — this is
        // Tailwind's stock `blue` scale, kept under the `brand` name so
        // existing `brand-*` usages across the app don't need renaming.
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // Dark-mode "chrome" background (top bar + toolbar), per the design
        // system's dark palette. The editor area (#1F2937) and sidebar
        // (#111827) dark tones are exact matches for Tailwind's stock
        // gray-800/gray-900, so only this one needs its own token.
        "topbar-dark": "#0f172a",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
          },
        },
      },
    },
  },
  plugins: [],
};
