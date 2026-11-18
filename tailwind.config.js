/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Theme-aware tokens (values live in index.css, flip in dark mode)
        page: token('page'),
        surface: token('surface'),
        soft: token('soft'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        // Brand
        navy: {
          950: '#081528',
          900: '#0b1f3a',
          800: '#12294d',
          700: '#1a3763',
          600: '#27487e',
        },
        brand: {
          50: '#e8f8f7',
          100: '#c7eeeb',
          200: '#93ddd7',
          400: '#2fb9b0',
          500: '#0f9e98',
          600: '#0b8a85',
          700: '#0a726e',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,31,58,.04), 0 4px 16px rgba(11,31,58,.06)',
        lift: '0 8px 30px rgba(11,31,58,.14)',
      },
      borderRadius: { xl2: '1.25rem' },
    },
  },
  plugins: [],
};
