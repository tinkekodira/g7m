/**
 * The theme, as state a screen can read and change.
 *
 * Most of the app never asks: it is drawn in tokens, and the tokens change
 * with the attribute `applyTheme` sets. This is for the few things that need a
 * literal colour — the 3D canvas, which is WebGL and cannot read a CSS
 * variable — and for the control in Settings.
 *
 * Two values, not one. `preference` is what was chosen and what Settings
 * shows; `theme` is what is actually on the page. They differ only under
 * `system`, which is the whole reason both exist.
 */
import { create } from 'zustand';
import { colorTokens, lightColorTokens } from '@g7m/ui';
import {
  DARK_QUERY,
  applyTheme,
  prefersDark,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type Theme,
  type ThemePreference,
} from './theme.js';

interface ThemeState {
  /** What the lifter chose. `system` is a standing instruction, not a colour. */
  readonly preference: ThemePreference;
  /** What is drawn right now. Never `system`. */
  readonly theme: Theme;
  readonly setPreference: (preference: ThemePreference) => void;
}

const initialPreference = readThemePreference();

export const useThemeStore = create<ThemeState>((set) => ({
  preference: initialPreference,
  theme: resolveTheme(initialPreference, prefersDark()),
  setPreference: (preference) => {
    const theme = resolveTheme(preference, prefersDark());
    writeThemePreference(preference);
    applyTheme(theme);
    set({ preference, theme });
  },
}));

/**
 * Follow the phone, while the phone is what is being followed.
 *
 * Subscribed once at module load rather than from an effect in a component:
 * the store is module state, a component that owned the listener could unmount
 * on a route change, and the one thing this must not do is stop following
 * halfway through an evening. Nothing happens unless the preference is
 * `system`, so the listener is free for everybody else.
 *
 * `addEventListener` on a MediaQueryList is the modern spelling and Safari
 * only learned it in 14. Older WebViews have `addListener` instead, and the
 * whole thing is optional — a device that cannot report its theme simply does
 * not change, which is what it did before this existed.
 */
function followSystem(): void {
  let query: MediaQueryList | undefined;
  try {
    query = globalThis.matchMedia?.(DARK_QUERY);
  } catch {
    return;
  }
  if (query === undefined) return;

  const onChange = (event: { matches: boolean }): void => {
    const { preference } = useThemeStore.getState();
    if (preference !== 'system') return;
    const theme = resolveTheme(preference, event.matches);
    applyTheme(theme);
    useThemeStore.setState({ theme });
  };

  if (typeof query.addEventListener === 'function') query.addEventListener('change', onChange);
  else query.addListener?.(onChange);
}

followSystem();

/** The backdrop the 3D body stands on, in the theme actually on screen. */
export function useStageColor(): string {
  const theme = useThemeStore((state) => state.theme);
  return theme === 'light' ? lightColorTokens['bg-stage'] : colorTokens['bg-stage'];
}
