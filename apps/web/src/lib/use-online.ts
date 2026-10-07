import { useEffect, useState } from 'react';

/**
 * Whether the browser thinks there is a network. A hint, not a promise — the
 * request is the test.
 *
 * For the few things that only work online — deleting the account, sending
 * feedback, friends — so each can say what it needs instead of failing.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => globalThis.navigator.onLine);
  useEffect(() => {
    const update = () => {
      setOnline(globalThis.navigator.onLine);
    };
    globalThis.addEventListener('online', update);
    globalThis.addEventListener('offline', update);
    return () => {
      globalThis.removeEventListener('online', update);
      globalThis.removeEventListener('offline', update);
    };
  }, []);
  return online;
}
