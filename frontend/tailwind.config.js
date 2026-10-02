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
        'cozy-bg': '#FAF5EB',
        'cozy-card': '#FFFDF8',
        'cozy-border': '#E5D9C5',
        'cozy-text': {
          DEFAULT: '#2D1F18',
          muted: '#5C4435',
          soft: '#8A7667',
        },
        'amber-warm': '#C8822A',
        parchment: {
          50: '#FFFDF9',
          100: '#FAF5EB',
          200: '#F4ECE0',
          300: '#EAE0CF',
          400: '#DACBBB',
          500: '#C4B4A0',
        },
        terracotta: {
          50: '#FDF6F3',
          100: '#FBEDE7',
          200: '#F7D6C9',
          300: '#EFAEA0',
          400: '#DC7356',
          500: '#A84323',
          600: '#94381C',
          700: '#7B2E16',
          800: '#632512',
          900: '#4D1D0E',
        },
        sage: {
          50: '#F4F7F1',
          100: '#E6EFE1',
          200: '#CFE0C6',
          300: '#AFCBA1',
          400: '#7FA86D',
          500: '#4E6E36',
          600: '#3F5B2A',
          700: '#324822',
        },
        espresso: {
          900: '#2D1F18',
          800: '#3E2B22',
          700: '#523B2F',
          600: '#6B4F3F',
          500: '#8A6854',
          400: '#AA8873',
          300: '#CCAFA0',
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#A84323',
          500: '#A84323',
          600: '#94381C',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        serif: ['Fraunces', 'Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
