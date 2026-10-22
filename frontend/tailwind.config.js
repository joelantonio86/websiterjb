/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        // Breakpoint extra para smartphones grandes / phablets (iPhone 12+, S22+ etc.)
        // Complementa Tailwind default (sm=640, md=768, lg=1024, xl=1280, 2xl=1536)
        'xs': '480px',
      },
      colors: {
        'rjb-yellow': '#D4AF37',
        'rjb-gold': 'var(--rjb-gold)',
        'rjb-yellow-ink': '#7A5F00',
        'rjb-yellow-hover': '#A6871C',
        'oud-green': '#0E3D2E',
        'oud-green-deep': '#07281E',
        'rjb-text': '#2C2A26',
        'rjb-text-muted': '#5A564E',
        'rjb-bg-light': '#E5E2DB',
        'rjb-card-light': '#FBFAF7',
        'rjb-border-light': '#D4D0C7',
        'rjb-bg-dark': '#0E0E10',
        'rjb-card-dark': '#242427',
        'rjb-border-dark': '#33333A',
        'rjb-text-dark': '#E0E0E0',
        'rjb-text-muted-dark': '#A8A29A',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas'],
      },
      boxShadow: {
        'soft-glow': '0 0 20px rgba(212, 175, 55, 0.55)',
        'subtle-glow': '0 0 10px rgba(212, 175, 55, 0.2)',
        'deep-shadow': '0 10px 30px rgba(0, 0, 0, 0.1)',
      },
    }
  },
  plugins: [],
}
