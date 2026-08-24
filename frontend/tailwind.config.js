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
        risk: {
          low:      '#2ecc71',
          medium:   '#f39c12',
          high:     '#e67e22',
          critical: '#e74c3c',
        },
        brand: {
          primary:   '#6366f1',
          secondary: '#8b5cf6',
          accent:    '#06b6d4',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up':   'slideUp 0.3s ease-out',
        'fade-in':    'fadeIn 0.4s ease-out',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      fontSize: {
        'xxs': '0.65rem',
      }
    },
  },
  plugins: [],
}