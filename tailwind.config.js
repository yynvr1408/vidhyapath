/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAFC', // Soft Slate White
        card: '#FFFFFF',   // Pure Crisp White
        border: {
          subtle: '#E2E8F0',
          DEFAULT: '#E2E8F0',
        },
        primary: {
          DEFAULT: '#0F766E', // Deep Educational Teal
          hover: '#115E59',
          dark: '#115E59',
          soft: '#F0FDFA',   // Pale Mint
          light: '#F0FDFA',
          text: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#D97706', // Warm Amber (Voice Mic / Highlights / Saved Offline)
          hover: '#B45309',
          soft: '#FEF3C7',
          text: '#92400E',
        },
        text: {
          main: '#0F172A',  // Deep Charcoal
          muted: '#475569', // Muted Slate
          sub: '#64748B',
        },
        success: {
          brand: '#16A34A', // Mastered / Online Green
          light: '#DCFCE7',
          text: '#14532D',
        },
        warning: {
          brand: '#D97706', // In Progress / Saved Offline Amber
          light: '#FEF3C7',
          text: '#92400E',
        },
        error: {
          brand: '#DC2626', // Weak / Needs Help
          light: '#FEE2E2',
          border: '#FECACA',
          text: '#991B1B',
        },
      },
      fontFamily: {
        telugu: ['Noto Sans Telugu', 'Tenali Ramakrishna', 'system-ui', '-apple-system', 'sans-serif'],
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
      borderRadius: {
        'card': '12px',
        'modal': '12px',
      },
    },
  },
  plugins: [],
}
