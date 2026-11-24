/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0D1B2A',
          800: '#1B263B',
          700: '#273852',
          600: '#415A77',
          500: '#778DA9',
          100: '#E0E1DD',
        },
        royal: {
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        status: {
          present: '#10B981',
          break: '#F59E0B',
          outduty: '#3B82F6',
          absent: '#EF4444',
          leave: '#8B5CF6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

