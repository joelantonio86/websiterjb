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
        'rjb-yellow': '#D4AF37',            // ouro heráldico (metálico, orquestra) — usar em bg/border/ring
        'rjb-gold': 'var(--rjb-gold)',      // ouro adaptativo p/ TEXTO (sépia no light, metálico no dark)
        'rjb-yellow-ink': '#7A5F00',        // texto/link dourado legível no light (~5.6:1 sobre #FBFAF7)
        'rjb-yellow-hover': '#A6871C',      // hover intermediário
        'rjb-text': '#2C2A26',
        'rjb-text-muted': '#5A564E',        // texto secundário light (~6.8:1)
        'rjb-bg-light': '#E5E2DB',
        'rjb-card-light': '#FBFAF7',
        'rjb-border-light': '#D4D0C7',
        'rjb-bg-dark': '#0E0E10',
        'rjb-card-dark': '#242427',
        'rjb-border-dark': '#33333A',
        'rjb-text-dark': '#E0E0E0',
        'rjb-text-muted-dark': '#A8A29A',   // texto secundário dark (~7.5:1)
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
