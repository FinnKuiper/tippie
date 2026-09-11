/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#b9d1ff",
          300: "#8bb2ff",
          400: "#5a8cff",
          500: "#3366ff",
          600: "#1f47db",
          700: "#1a38ad",
          800: "#1a318a",
          900: "#1a2d6e",
        },
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
