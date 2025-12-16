import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // For GitHub Pages: Use repo name as base path in production
    // Set VITE_BASE_PATH env var or it defaults to repo name
    const basePath = mode === 'production'
      ? (env.VITE_BASE_PATH || '/Jusdncr-12-12-/')
      : '/';

    return {
      // Base path for GitHub Pages deployment
      base: basePath,

      server: {
        port: 3000,
        host: '0.0.0.0',
      },

      plugins: [react()],

      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },

      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },

      build: {
        // Output to dist folder (default)
        outDir: 'dist',

        // Generate sourcemaps for debugging
        sourcemap: false,

        // Optimize chunks
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor': ['react', 'react-dom'],
              'ai': ['@google/genai'],
              'icons': ['lucide-react']
            }
          }
        },

        // Target modern browsers
        target: 'esnext',

        // Minify for production
        minify: 'esbuild'
      },

      // Preview server config (for local testing of production build)
      preview: {
        port: 4173,
        host: '0.0.0.0'
      }
    };
});
