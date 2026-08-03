/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#14213D',
          light: '#223460',
          dark: '#0D1730',
        },
        coral: {
          DEFAULT: '#FF6B4A',
          dark: '#E8552F',
          light: '#FFE4DB',
        },
        teal: {
          DEFAULT: '#0EA99F',
          dark: '#0B8A82',
          light: '#DFF7F5',
        },
        gold: '#F4B740',
        surface: '#FFFFFF',
        canvas: '#F5F7FA',
        ink: '#16213D',
        muted: '#6B7280',
        line: '#E5E8EE',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(20,33,61,0.06)',
        'card-hover': '0 12px 28px rgba(20,33,61,0.14)',
        dock: '0 20px 45px rgba(20,33,61,0.22)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
