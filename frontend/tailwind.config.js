/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#191A23",
        brand: {
          50: "#f2f9f7",
          100: "#d9efea",
          200: "#b2ddd4",
          300: "#85c7bb",
          400: "#58aa9d",
          500: "#3d8d81",
          600: "#2f7068",
          700: "#255a54",
          800: "#1e4844",
          900: "#183a37"
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
