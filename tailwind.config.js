/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFCF5',
          100: '#FFF8E7',
          200: '#FDF0CD',
          300: '#FBE4A8',
        },
        indigo: {
          brand: '#2B2D6E',
          dark: '#1C1E4F',
          light: '#3F4294',
        },
        lantern: {
          DEFAULT: '#F2A33A',
          glow: '#FFB84D',
          dim: '#C47E20',
          light: '#FFF0D4',
        },
        success: {
          brand: '#2E8B57',
          light: '#E7F5ED',
        },
        hint: {
          brand: '#2F6DB5',
          light: '#EAF2FB',
        },
        coral: {
          brand: '#D9534F',
          light: '#FCEBEA',
        }
      },
      fontFamily: {
        telugu: ['Noto Sans Telugu', 'Tenali Ramakrishna', 'system-ui', '-apple-system', 'sans-serif'],
      },
      minHeight: {
        touch: '56px',
      },
      minWidth: {
        touch: '56px',
      }
    },
  },
  plugins: [],
}
