/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F100D',
        bgFade: '#2F2F2F',
        accent: '#2A7A2A',
        swipeLeft: '#481414',
        swipeRight: '#285728',
        glass: 'rgba(255,255,255,0.08)',
        glassBorder: 'rgba(255,255,255,0.15)',
        stroke: '#D40000',
      },
      fontFamily: {
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
