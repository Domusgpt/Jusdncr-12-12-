import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: __dirname,
  server: {
    port: 3001,
    host: '0.0.0.0',
  },
  plugins: [react()],
  build: {
    outDir: '../dist-vnext',
    emptyOutDir: true,
    sourcemap: false,
    target: 'esnext',
  },
  preview: {
    port: 4174,
    host: '0.0.0.0',
  },
});
