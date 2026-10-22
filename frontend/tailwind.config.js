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
        // Programa de concerto: marfim e carvão no claro; preto de palco no escuro.
        // O dourado fica no detalhe. O verde permanece só na marca.
        'rjb-yellow': '#C6A36A',
        'rjb-gold': 'var(--rjb-gold)',
        'rjb-yellow-ink': '#143D32',
        'rjb-yellow-hover': '#A8884E',
        'oud-green': '#143D32',
        'oud-green-deep': '#0E2C24',
        'rjb-text': '#141414',
        'rjb-text-muted': '#5A5955',
        'rjb-bg-light': '#F7F7F5',
        'rjb-card-light': '#FFFFFF',
        'rjb-border-light': '#E6E5E1',
        'rjb-bg-dark': '#111111',
        'rjb-card-dark': '#1A1A1A',
        'rjb-border-dark': '#2A2A2A',
        'rjb-text-dark': '#F5F3EE',
        'rjb-text-muted-dark': '#A9A69F',
        yellow: {
          500: '#C6A36A',
          600: '#A8884E',
        },
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
