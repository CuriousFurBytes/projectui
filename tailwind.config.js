/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          'FiraCode Nerd Font',
          'Fira Code Nerd Font',
          'FiraCode Nerd Font Mono',
          'Symbols Nerd Font Mono',
          'Fira Code',
          'ui-monospace',
          'monospace',
        ],
      },
      colors: {
        ink: {
          900: '#0b0d12',
          800: '#10131a',
          700: '#161a23',
          600: '#1d222d',
          500: '#262c39',
          400: '#3a4255',
          300: '#5a657f',
          200: '#9aa3b8',
          100: '#cdd3e1',
        },
        accent: {
          DEFAULT: '#7aa2f7',
          muted: '#3b4a6b',
        },
      },
    },
  },
  plugins: [],
};
