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
          base: '#111114',
          elevated: '#18181c',
          high: '#1f1f24',
          border: {
            subtle: '#2a2a32',
            default: '#35353e',
            medium: '#474752',
            strong: '#5c5c68',
          },
        },
      },
      boxShadow: {
        mode: '0 1px 2px 0 rgba(24, 24, 27, 0.04), 0 1px 3px 0 rgba(24, 24, 27, 0.06)',
        soft: '0 1px 2px rgba(24, 24, 27, 0.04), 0 8px 24px rgba(24, 24, 27, 0.04)',
        lift: '0 4px 12px rgba(24, 24, 27, 0.06), 0 16px 40px rgba(24, 24, 27, 0.06)',
        glow: '0 0 0 1px rgba(124, 58, 237, 0.12), 0 8px 28px rgba(124, 58, 237, 0.18)',
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
