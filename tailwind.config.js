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
          primary: '#0D0F14',
          card: '#161A23',
          elevated: '#1E2330',
        },
        accent: {
          gold: '#C9A84C',
          teal: '#2DD4BF',
          rose: '#FB7185',
        },
        text: {
          primary: '#F1F5F9',
          muted: '#64748B',
        },
        border: '#1E2330',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
