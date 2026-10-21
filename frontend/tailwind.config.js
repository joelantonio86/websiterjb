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
        // Light: cinza-pedra suave (menos brilho que branco puro; sem cream genérico)
        'rjb-yellow': '#D4AF37',
        'rjb-gold': 'var(--rjb-gold)',
        'rjb-yellow-ink': '#7A5F00',
        'rjb-yellow-hover': '#A6871C',
        'oud-green': '#0E3D2E',
        'oud-green-deep': '#07281E',
        'rjb-text': '#12382C',
        'rjb-text-muted': '#3E5C4C',
        'rjb-bg-light': '#FFFFFF',
        'rjb-card-light': '#FFFFFF',
        'rjb-border-light': '#E4DDD0',
        'rjb-bg-dark': '#07281E',
        'rjb-card-dark': '#0E3A2C',
        'rjb-border-dark': '#1E5A44',
        'rjb-text-dark': '#F6F3EA',
        'rjb-text-muted-dark': '#D4CBB4',
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
