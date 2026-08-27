import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  // Relative base so the production build works under file:// when loaded
  // by Electron. With the default absolute "/" base, browsers resolve
  // /assets/... against the drive root (e.g. file:///C:/assets/...), all
  // assets 404, and the renderer shows a black/blank page.
  base: './',
  build: {
    target: 'es2022',
    sourcemap: true,
    // Split heavy vendor code into its own chunk so the main index bundle
    // stays under the 500 kB warning threshold. The 3D campus is already
    // lazy-loaded behind a dynamic import, so it ends up in its own chunk.
    rollupOptions: {
      output: {
        manualChunks: {
          // Pull Dexie + dexie-react-hooks into a `dexie` chunk. These are
          // large and only touched on hook-based live queries.
          dexie: ['dexie', 'dexie-react-hooks'],
          // React Router and its internals.
          router: ['react-router-dom'],
        },
      },
    },
    // 3D campus is large because of three.js; it's behind a dynamic import
    // and only fetched when learners opt in to the 3D view. Raise the
    // warning threshold so the lazy chunk doesn't fire a false alarm.
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
