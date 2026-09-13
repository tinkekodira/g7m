import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { applyTheme, readTheme } from './lib/theme.js';
import './styles.css';

// Before the first render, so a light-theme user never sees the page drawn
// dark first. index.html is dark, which is what everyone else wants anyway.
applyTheme(readTheme());

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Root container #root is missing from index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
