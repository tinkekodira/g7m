import { useSyncExternalStore } from 'react';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * The system's Reduce Motion setting, kept current: it can be switched with
 * the page open.
 *
 * CSS animations are already flattened by the rule at the end of tokens.css.
 * This is for motion driven from script — a number counting up, a video
 * loop — which that rule cannot reach.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}

/** The same, read once, for code outside a component. */
export function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.(REDUCED_MOTION).matches ?? false;
}

function subscribe(onChange: () => void): () => void {
  const query = globalThis.matchMedia?.(REDUCED_MOTION);
  query?.addEventListener('change', onChange);
  return () => {
    query?.removeEventListener('change', onChange);
  };
}
