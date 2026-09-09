/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: '#E2E8F0',
        input: '#CBD5E1',
        ring: '#4F46E5',
        background: '#F8FAFC',
        foreground: '#0F172A',
        card: '#FFFFFF',
        primary: {
          DEFAULT: '#4F46E5',
          strong: '#4338CA',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#0891B2',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B',
        },
        destructive: {
          DEFAULT: '#DC2626',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#16A34A',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#D97706',
          foreground: '#FFFFFF',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgb(15 23 42 / 0.05), 0 8px 24px rgb(15 23 42 / 0.04)',
      },
      borderRadius: {
        xl: '0.75rem',
        lg: '0.625rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
};
