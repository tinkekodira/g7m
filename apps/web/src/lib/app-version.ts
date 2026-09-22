/**
 * The `package.json` version, baked in at build time.
 *
 * `__APP_VERSION__` is a Vite `define` (see `vite.config.ts`), the same
 * mechanism the service worker uses for `__BUILD_ID__` — a plain string
 * substituted into the bundle, not read at runtime.
 */
declare const __APP_VERSION__: string;

export const APP_VERSION = __APP_VERSION__;
