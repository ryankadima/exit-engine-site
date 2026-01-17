/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./staging.html",
    "./index.html",
    "./**/*.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'primary-blue': '#175DF1',
        'dark': '#050806',
      },
    },
  },
  plugins: [],
}

