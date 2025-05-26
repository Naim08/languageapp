/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        secondary: '#8B5CF6', 
        accent: '#F59E0B',
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        bgDark: '#1F2937',
        bgLight: '#F9FAFB',
        bgCard: '#374151',
        textDark: '#F3F4F6',
        textLight: '#111827',
        textMuted: '#9CA3AF'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px'
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px'
      }
    }
  },
  plugins: []
};
