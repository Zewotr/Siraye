/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#191A23",
        brand: {
          50: "rgb(var(--brand-50, 242 249 247) / <alpha-value>)",
          100: "rgb(var(--brand-100, 217 239 234) / <alpha-value>)",
          200: "rgb(var(--brand-200, 178 221 212) / <alpha-value>)",
          300: "rgb(var(--brand-300, 133 199 187) / <alpha-value>)",
          400: "rgb(var(--brand-400, 88 170 157) / <alpha-value>)",
          500: "rgb(var(--brand-500, 61 141 129) / <alpha-value>)",
          600: "rgb(var(--brand-600, 47 112 104) / <alpha-value>)",
          700: "rgb(var(--brand-700, 37 90 84) / <alpha-value>)",
          800: "rgb(var(--brand-800, 30 72 68) / <alpha-value>)",
          900: "rgb(var(--brand-900, 24 58 55) / <alpha-value>)",
        },
        accent: "#f59e0b"
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Manrope", "sans-serif"]
      },
      boxShadow: {
        soft: "0 20px 45px -25px rgba(15, 23, 42, 0.45)",
        float: "0 18px 50px -24px rgba(15, 23, 42, 0.28)"
      }
    },
  },
  plugins: [],
};
