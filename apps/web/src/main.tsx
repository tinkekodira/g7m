import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { CrashScreen } from './components/CrashScreen.js';
import { applyTheme, readTheme } from './lib/theme.js';
import { startLanguage } from './lib/language.js';
import './styles.css';

// Before the first render, so a light-theme user never sees the page drawn
// dark first. index.html is dark, which is what everyone else wants anyway.
applyTheme(readTheme());

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Root container #root is missing from index.html');
}

/**
 * The last line of defence.
 *
 * Each route has its own boundary (`RouteBoundary`), which keeps the tab bar.
 * This one catches whatever is outside them — the auth gate, the sign-in
 * screen, the router itself — where there is no smaller thing to retry, so it
 * offers Reload. Without it a failure there is a blank page for good.
 */
function render(root: HTMLElement): void {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary
        fallback={(error) => (
          <CrashScreen error={error} inWorkout={globalThis.location.hash.startsWith('#/workout')} />
        )}
      >
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

// The words before the first paint, so nobody whose app is in German sees a
// frame of English. English needs no fetch; any other language is one
// precached chunk. A language that will not load opens in English instead.
void startLanguage().finally(() => {
  render(container);
});
