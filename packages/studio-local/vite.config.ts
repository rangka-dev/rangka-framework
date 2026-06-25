import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 4000,
  },
  define:
    command === 'serve'
      ? { 'import.meta.env.VITE_WS_URL': JSON.stringify('ws://localhost:4001/ws') }
      : {},
}));
