/**
 * The theme, as state a screen can read and change.
 *
 * Most of the app never asks: it is drawn in tokens, and the tokens change
 * with the attribute `applyTheme` sets. This is for the few things that need a
 * literal colour — the 3D canvas, which is WebGL and cannot read a CSS
 * variable — and for the switch in Settings.
 */
import { create } from 'zustand';
import { colorTokens, lightColorTokens } from '@g7m/ui';
import { applyTheme, readTheme, writeTheme, type Theme } from './theme.js';

interface ThemeState {
  readonly theme: Theme;
  readonly setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: readTheme(),
  setTheme: (theme) => {
    writeTheme(theme);
    applyTheme(theme);
    set({ theme });
  },
}));

/** The backdrop the 3D body stands on, in the current theme. */
export function useStageColor(): string {
  const theme = useThemeStore((state) => state.theme);
  return theme === 'light' ? lightColorTokens['bg-stage'] : colorTokens['bg-stage'];
}
