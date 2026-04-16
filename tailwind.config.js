/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#00FF87",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#FF6B35",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#0F0F0F",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#1A1A1A",
          foreground: "#888888",
        },
        border: "#2A2A2A",
        input: "#1A1A1A",
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        neon: {
          green: "#00FF87",
          orange: "#FF6B35",
        },
        cat: {
          fitness: "#00FF87",
          muscle: "#F0C040",
          football: "#4D8BF5",
          running: "#30C9B0",
          crossfit: "#E04040",
          hyrox: "#9B59B6",
          extreme: "#FF6B35",
          flechette: "#FF8C00",
        },
        badge: {
          king: "#FFD700",
          elite: "#F0C040",
          beast: "#00FF87",
          solid: "#4D8BF5",
          rookie: "#888888",
        },
      },
      borderRadius: {
        lg: 12,
        md: 10,
        sm: 8,
        xl: 16,
        "2xl": 20,
        "3xl": 28,
        full: 9999,
      },
    },
  },
  plugins: [],
};
