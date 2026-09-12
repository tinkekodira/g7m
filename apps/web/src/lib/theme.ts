/**
 * Light or dark, as a preference the app keeps but does not act on yet.
 *
 * v1 is dark only — Brief §10, and the header of tokens.css, which says a
 * light theme is a later override of the `:root` block and not to build one
 * now. The Settings screen has the switch anyway, so the control exists where
 * people will look for it and the choice is remembered for the day a light
 * palette arrives. Until then `appliedTheme` answers dark whatever was chosen,
 * and it is the only thing that will need to change.
 *
 * Kept on this device rather than on the profile. It is how this screen looks,
 * not a fact about the lifter — a phone in the gym and a laptop at home can
 * reasonably disagree — and a synced column would be a migration for a setting
 * that changes nothing yet.
 */

export const THEMES = ['dark', 'light'] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = 'g7m.theme';

/** Dark, until somebody says otherwise. */
export const DEFAULT_THEME: Theme = 'dark';

/** The subset of `Storage` this needs, so the tests can hand it a map. */
export type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * The stored preference, or dark.
 *
 * Anything unrecognised reads as the default rather than as itself, and a
 * storage that throws — private browsing on some engines, a WebView with
 * storage switched off — reads as the default rather than as a crash on the
 * settings screen.
 */
export function readTheme(storage: ThemeStorage | undefined = globalThis.localStorage): Theme {
  try {
    const stored = storage?.getItem(THEME_STORAGE_KEY);
    return (THEMES as readonly (string | null | undefined)[]).includes(stored)
      ? (stored as Theme)
      : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Remember a choice. Failing to is not worth an error: the switch still moves. */
export function writeTheme(
  theme: Theme,
  storage: ThemeStorage | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage full or switched off. The preference lasts until the page does.
  }
}

/**
 * The theme actually drawn, given the one chosen.
 *
 * Dark, always, until the light palette exists. This is the seam: when it
 * does, this returns `chosen` and the root element gets a `data-theme`.
 */
export function appliedTheme(_chosen: Theme): Theme {
  return 'dark';
}
