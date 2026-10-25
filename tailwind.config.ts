import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        hairline: 'var(--hairline)',
        text: 'var(--text)',
        'text-2': 'var(--text-2)',
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          soft: 'var(--brand-soft)',
        },
        focus: 'var(--focus)',
        danger: 'var(--danger)',
        win: 'var(--win)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI Variable Text"',
          '"Segoe UI"',
          'Inter',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        chip: '8px',
        control: '12px',
        panel: '16px',
        dialog: '24px',
      },
      boxShadow: {
        floating: '0 1px 2px rgba(15, 27, 45, 0.06), 0 12px 32px rgba(15, 27, 45, 0.10)',
        ground: '0 8px 30px rgba(15, 27, 45, 0.08), 0 2px 6px rgba(15, 27, 45, 0.04)',
        thumb: '0 1px 3px rgba(15, 27, 45, 0.15), 0 1px 1px rgba(15, 27, 45, 0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config;
