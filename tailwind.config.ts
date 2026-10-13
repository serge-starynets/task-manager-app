import type { Config } from 'tailwindcss';

const config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        note: ['var(--font-note)', 'cursive'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          muted: 'var(--surface-muted)',
          elevated: 'var(--surface-elevated)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
        },
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        dark: {
          base: '#0c0c0f',
          elevated: '#16161b',
          high: '#22222a',
          border: {
            subtle: '#3a3a46',
            default: '#525260',
            medium: '#686878',
            strong: '#808094',
          },
        },
      },
      boxShadow: {
        mode: '0 1px 2px 0 rgba(24, 24, 27, 0.06), 0 1px 3px 0 rgba(24, 24, 27, 0.1)',
        soft: '0 1px 2px rgba(24, 24, 27, 0.06), 0 8px 24px rgba(24, 24, 27, 0.08)',
        lift: '0 4px 12px rgba(24, 24, 27, 0.08), 0 16px 40px rgba(24, 24, 27, 0.12)',
        glow: '0 0 0 1px rgba(124, 58, 237, 0.16), 0 8px 28px rgba(124, 58, 237, 0.22)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
} satisfies Config;

export default config;
