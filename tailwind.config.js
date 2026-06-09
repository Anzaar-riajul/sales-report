/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#F8FAFC',
          card: '#FFFFFF',
          elevated: '#F1F5F9',
        },
        accent: {
          gold: '#C9A84C',
          teal: '#0D9488',
          rose: '#E11D48',
        },
        text: {
          primary: '#0F172A',
          muted: '#64748B',
        },
        border: '#E2E8F0',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
