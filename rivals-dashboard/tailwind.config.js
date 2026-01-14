/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0a0f',
        'bg-secondary': '#1a1a2e',
        'accent-cyan': '#00f5ff',
        'accent-magenta': '#ff00ff',
        'accent-gold': '#ffd700',
      }
    },
  },
  plugins: [],
}
