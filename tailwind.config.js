/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        brand: {
          base: '#25D366',
          light: '#128C7E',
          medium: '#075E54',
          dark: '#0B1E2E',
          lightGreen: '#25D366',
          green: '#075E54',
        },
      },
    },
  },
  plugins: [],
}
