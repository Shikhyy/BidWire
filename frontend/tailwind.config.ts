import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        slate: '#8e9aaf',
        lavender: '#cbc0d3',
        blush: '#efd3d7',
        mist: '#feeafa',
        periwinkle: '#dee2ff',
        dark: '#1a1625',
        surface: '#f8f4ff',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bid-up': 'bidUp 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        bidUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(222, 226, 255, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(222, 226, 255, 0.6)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;