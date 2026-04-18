/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f0f1a',
          card: '#1a1a2e',
          elevated: '#16213e',
          border: '#2d2d4e',
        }
      }
    },
  },
  plugins: [],
};
