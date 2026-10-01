/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        prompt: ['Prompt', 'sans-serif'],
        sans: ['Prompt', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        slate: {
          750: '#293548',
          850: '#151f32',
          855: '#111827',
        },
        ocean: {
          950: '#070d18',
          900: '#0c1527',
          800: '#16233b',
          700: '#1e3357',
        }
      }
    },
  },
  plugins: [],
}
