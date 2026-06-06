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
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#60A5FA',
        },
        secondary: {
          DEFAULT: '#FACC15',
          dark: '#EAB308',
          light: '#FDE047',
        },
        accent: {
          DEFAULT: '#1E40AF',
          dark: '#0F172A',
          light: '#3B82F6',
        },
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 4px 20px -2px rgba(30, 41, 59, 0.05), 0 2px 8px -1px rgba(30, 41, 59, 0.03)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.04)',
      },
    },
  },
  plugins: [],
}
