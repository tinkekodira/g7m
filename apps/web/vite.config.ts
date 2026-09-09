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

  /**
   * PowerSync must not be pre-bundled, or its SQLite worker cannot be found.
   *
   * `@powersync/web` opens the database from `lib/worker/client.js` with
   *
   *     new SharedWorker(new URL('./worker.js', import.meta.url))
   *
   * where `worker.js` is that file's sibling. Vite's dependency optimizer
   * flattens the whole package into one file under `node_modules/.vite/deps/`,
   * so `import.meta.url` points there instead and the browser asks for
   * `.vite/deps/worker.js` — which esbuild never copied.
   *
   * The worker never starts, `db.init()` never settles, and every screen waits
   * for a database nobody is opening. There is no error to catch: a promise
   * that never settles is not something a `catch` can see. The only signal is
   * one line in the dev server log.
   *
   * This is development only, which is why every build stayed green —
   * `optimizeDeps` does not run for `vite build`, and Rollup resolves the
   * worker correctly. The same shape as the `envDir` bug above: CI passing and
   * `pnpm dev` broken, on a repository where the served build is what CI sees.
   *
   * `@journeyapps/wa-sqlite` is excluded with it. It ships the `.wasm` binaries
   * the VFS loads by relative URL, and they flatten the same way.
   */
  optimizeDeps: {
    exclude: ['@powersync/web', '@journeyapps/wa-sqlite'],
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
