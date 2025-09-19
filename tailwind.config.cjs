/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mascate brand colors
        'mascate': {
          // Original gold preserved for compatibility
          50: '#fefdf2',
          100: '#fefadf', 
          200: '#fcf2b8',
          300: '#f9e589',
          400: '#f5d157',
          500: '#f1c535', // Original gold
          600: '#e2a928',
          700: '#bc8421',
          800: '#986621',
          900: '#7c5520',
          950: '#462d0e',
          // New brand colors
          'red': '#b10d2f',      // Navbar background
          'bg': '#ece9d6',       // Main background
          'yellow': '#f8b03c',   // Item backgrounds
          'green': '#0a3522',    // Titles/fonts
        }
      },
    },
  },
  plugins: [],
};
