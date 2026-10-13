/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sentinel: {
          50: '#f0f4fd',
          100: '#e0e9fb',
          200: '#c7d7f8',
          300: '#a1bdf3',
          400: '#739aeb',
          500: '#4f76e2',
          600: '#3857d4',
          700: '#2d43be',
          800: '#28389b',
          900: '#25327b',
          950: '#171e4b',
        },
        navy: {
          800: '#111827',
          900: '#0b0f19',
          950: '#060911',
        }
      }
    },
  },
  plugins: [],
}
