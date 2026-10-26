import { useState, type ReactNode } from 'react';
import { LoadingStarted } from '../lib/loading-context.js';

// Kept above Suspense so code and data use the same deadline. A new pathname
// starts a new scope; search/filter changes must not remount the screen.
export function LoadingScope({ children }: { readonly children: ReactNode }) {
  const [started] = useState(Date.now);
  return <LoadingStarted.Provider value={started}>{children}</LoadingStarted.Provider>;
}
