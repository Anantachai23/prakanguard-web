/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        prompt: ['Prompt', '"IBM Plex Sans Thai"', 'sans-serif'],
        sarabun: ['Sarabun', 'sans-serif'],
        gov: ['"IBM Plex Sans Thai"', 'Prompt', 'sans-serif'],
        sans: ['Prompt', '"IBM Plex Sans Thai"', '"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"SF Mono"', 'Consolas', '"Liberation Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        slate: {
          750: '#293548',
          850: '#151f32',
          855: '#111827',
          950: '#070b14',
        },
        civic: {
          50: '#f0f5fc',
          100: '#e2edfa',
          200: '#c5dcf5',
          300: '#97c2ee',
          400: '#64a2e4',
          500: '#3e83d8',
          600: '#2768c8',
          700: '#1f53b1',
          800: '#1d4590',
          900: '#1b3b73',
          950: '#0f244a',
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
