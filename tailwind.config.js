/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFF1EB",
          100: "#FFD9CC",
          200: "#FFB399",
          300: "#FF8C66",
          400: "#FF6E40",
          500: "#FF5D29",
          600: "#E6521F",
          700: "#BF431A",
          800: "#993615",
          900: "#7A2B11"
        },
        accent: { 500: "#00c2ff", 600: "#00a7df" }
      },
      boxShadow: { soft: "0 8px 30px rgba(0,0,0,.06)" },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' }
    }
  },
  plugins: [],
};
