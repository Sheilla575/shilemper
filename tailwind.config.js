/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        gray: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          500: '#64748B',
          700: '#334155',
          900: '#0F172A',
        },
        success: { DEFAULT: '#16A34A', light: '#DCFCE7' },
        warning: { DEFAULT: '#D97706', light: '#FEF3C7' },
        danger: { DEFAULT: '#DC2626', light: '#FEE2E2' },
        info: { DEFAULT: '#0284C7', light: '#E0F2FE' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        pagetitle: ['28px', { lineHeight: '36px', fontWeight: '700' }],
        sectiontitle: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        cardtitle: ['16px', { lineHeight: '24px', fontWeight: '600' }],
        body: ['14px', { lineHeight: '22px', fontWeight: '400' }],
        bodystrong: ['14px', { lineHeight: '22px', fontWeight: '600' }],
        small: ['12px', { lineHeight: '18px', fontWeight: '400' }],
        caption: ['11px', { lineHeight: '16px', fontWeight: '500' }],
      },
      borderRadius: {
        button: '8px',
        input: '8px',
        card: '12px',
        modal: '12px',
        badge: '9999px',
        file: '8px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.08)',
        modal: '0 20px 40px rgba(15, 23, 42, 0.16)',
      },
      spacing: {
        xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '20px',
        '2xl': '24px', '3xl': '32px', '4xl': '40px', '5xl': '48px', '6xl': '64px',
      },
      width: {
        sidebar: '240px',
        'sidebar-collapsed': '72px',
      },
      height: {
        topbar: '64px',
      },
    },
  },
  plugins: [],
}
