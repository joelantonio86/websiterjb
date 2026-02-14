/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'rjb-yellow': '#FFD700',
        'rjb-text': '#2A2A2A',
        'rjb-bg-light': '#F8F9FA',
        'rjb-card-light': '#FFFFFF',
        'rjb-bg-dark': '#121212',
        'rjb-card-dark': '#1E1E1E',
        'rjb-text-dark': '#E0E0E0',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas'],
      },
      boxShadow: {
        'soft-glow': '0 0 20px rgba(255, 215, 0, 0.6)',
        'subtle-glow': '0 0 10px rgba(255, 215, 0, 0.2)',
        'deep-shadow': '0 10px 30px rgba(0, 0, 0, 0.1)',
      },
    }
  },
  plugins: [],
}
