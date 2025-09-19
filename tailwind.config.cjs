/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nightclub theme colors
        'mascate': {
          50: '#fefdf2',
          100: '#fefadf',
          200: '#fcf2b8',
          300: '#f9e589',
          400: '#f5d157',
          500: '#f1c535',
          600: '#e2a928',
          700: '#bc8421',
          800: '#986621',
          900: '#7c5520',
          950: '#462d0e',
        },
        'nightclub': {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
          950: '#4a044e',
        }
      },
    },
  },
  plugins: [],
};
