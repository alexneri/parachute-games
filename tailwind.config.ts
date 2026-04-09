import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lcd: {
          bg: '#b8c9a3',
          sprite: '#1a1a1a',
        },
        frame: {
          body: '#e8e0d0',
          bezel: '#c47a7a',
          label: '#2a2a2a',
          btnA: '#3a3a5c',
          btnB: '#5c3a3a',
        },
        page: {
          bg: '#1a1a1a',
          text: '#b8c9a3',
        },
      },
      borderRadius: {
        frame: '16px',
        screen: '8px',
      },
      fontFamily: {
        label: ['Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
