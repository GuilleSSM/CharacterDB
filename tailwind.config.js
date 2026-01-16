/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark Academia palette
        parchment: {
          50: "#fdfcfa",
          100: "#f9f6f0",
          200: "#f3ede1",
          300: "#e8ddc8",
          400: "#d9c9a8",
          500: "#c7b188",
          600: "#b09968",
          700: "#937c52",
          800: "#7a6645",
          900: "#65543a",
        },
        ink: {
          50: "#f6f5f4",
          100: "#e7e5e2",
          200: "#d1cdc8",
          300: "#b5aea6",
          400: "#968c82",
          500: "#7b7169",
          600: "#615953",
          700: "#4d4641",
          800: "#3d3835",
          900: "#2d2a28",
          950: "#1a1918",
        },
        accent: {
          gold: "#c9a227",
          burgundy: "#722f37",
          forest: "#2d4a3e",
          navy: "#1e3a5f",
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "serif"],
        body: ['"Source Serif 4"', "serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        paper:
          "0 1px 3px rgba(45, 42, 40, 0.08), 0 4px 12px rgba(45, 42, 40, 0.04)",
        "paper-hover":
          "0 4px 12px rgba(45, 42, 40, 0.12), 0 8px 24px rgba(45, 42, 40, 0.08)",
        "paper-lifted":
          "0 8px 24px rgba(45, 42, 40, 0.16), 0 16px 48px rgba(45, 42, 40, 0.12)",
      },
      backgroundImage: {
        "paper-texture":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
