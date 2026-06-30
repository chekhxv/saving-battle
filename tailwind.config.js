/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#070710',
          900: '#0c0c18',
          800: '#13131f',
          700: '#1c1c2b',
          600: '#272739',
        },
        brand: {
          DEFAULT: '#ffdd2d',
          glow: '#ffe75c',
        },
        gold: '#ffd24a',
        silver: '#c8d2e0',
        bronze: '#e0894a',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(255, 221, 45, 0.45)',
        card: '0 20px 60px -25px rgba(0, 0, 0, 0.7)',
      },
      backgroundImage: {
        'grid-glow':
          'radial-gradient(1200px 600px at 50% -10%, rgba(255,221,45,0.12), transparent 60%)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '70%': { transform: 'scale(1.1)', opacity: '0' },
          '100%': { opacity: '0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
        shimmer: 'shimmer 1.8s infinite',
        float: 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
