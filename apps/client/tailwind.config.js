/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom dark theme palette
        background: '#0a0a0a',
        surface: '#1a1a1a',
        border: '#333333',
        primary: '#00ffff',
        secondary: '#00ff00',
        accent: '#ff00ff',
      }
    },
  },
  plugins: [],
}