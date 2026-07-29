import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'terminal-black': 'var(--color-terminal-black)',
        'terminal-green': 'var(--color-terminal-green)',
        'terminal-cyan': 'var(--color-terminal-cyan)',
        'terminal-danger': 'var(--color-terminal-danger)',
        'terminal-warning': 'var(--color-terminal-warning)',
        'terminal-gray': 'var(--color-terminal-gray)',
      },
      fontFamily: {
        'terminal-mono': ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;