/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg': 'var(--color-brand-bg, #1a1a2e)',
        'brand-surface': 'var(--color-brand-surface, #16213e)',
        'brand-primary': 'var(--color-brand-primary, #e94560)',
        'brand-secondary': 'var(--color-brand-secondary, #0f3460)',
        'brand-text': 'var(--color-brand-text, #dcdcdc)',
        'brand-text-light': 'var(--color-brand-text-light, #a7a9be)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
