import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  // Fix: Explicitly import 'process' to ensure cwd() is recognized by the TypeScript compiler in the Node.js environment.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/study-group-finder/',
    plugins: [react()],
    define: {
      // Polyfill process.env for the browser
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    },
    server: {
      port: 3000,
      proxy: {
        // Redirect API calls to the Laravel backend
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});
