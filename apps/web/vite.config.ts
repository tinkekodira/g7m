import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { serviceWorker } from './service-worker/plugin.js';

export default defineConfig({
  /**
   * The service worker is built last, from the files the other two produced:
   * it needs the fingerprinted asset names, which do not exist until the
   * bundle is written. See `service-worker/plugin.ts`.
   */
  plugins: [react(), tailwindcss(), serviceWorker()],

  /**
   * `.env.local` lives at the repository root, so this has to say so.
   *
   * `envDir` defaults to `root`, which is this directory, and the README tells
   * you to copy `.env.example` — which is at the repository root — to
   * `.env.local` beside it. So Vite loaded no variables at all, `env.ts` threw
   * at startup, and the app was a blank page.
   *
   * It was invisible for months because CI does not use a file: the values
   * arrive as `process.env` from repository secrets, which Vite reads whatever
   * `envDir` says. Every deployed build worked and only `pnpm dev` was broken,
   * which is the worst way round for something nobody had needed to run yet.
   */
  envDir: fileURLToPath(new URL('../../', import.meta.url)),

  /**
   * Relative asset URLs, so one build artefact works wherever it is served
   * from: the root in development, a `/g7m/` subpath on GitHub Pages, and the
   * custom origins Capacitor and Tauri serve from. The alternative — passing
   * `--base` per deployment — means the build differs by target, which is a
   * class of bug nobody enjoys diagnosing from a blank white screen.
   */
  base: './',

  /**
   * PowerSync runs SQLite in web workers, and those workers import each other
   * — wa-sqlite's VFS modules are pulled in as separate chunks. Vite's default
   * worker format is `iife`, which cannot code-split, so the build fails with
   * "UMD and IIFE output formats are not supported for code-splitting builds".
   *
   * ES module workers are supported everywhere this app runs: Safari 15+,
   * Chrome 80+, and both native WebViews. That is the same floor as the `es2022`
   * target below, so this narrows nothing that was not already narrowed.
   */
  worker: {
    format: 'es',
  },

  server: {
    port: 5173,
    strictPort: true,
    // Capacitor live-reload and Tauri dev both need a host binding that is not
    // 127.0.0.1 to reach the dev server from a device or a native window.
    host: true,
  },

  build: {
    outDir: 'dist',
    // Native WebViews we target: iOS 17 (Safari 17), Android 12 (Chrome ~96+),
    // WebView2 (evergreen Chromium), macOS WKWebView. es2022 is safe across all
    // four and avoids shipping transpiled async/await to modern engines.
    target: 'es2022',
    sourcemap: true,
  },
});
