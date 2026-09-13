/**
 * Light or dark: the choice, remembered, and put on the page.
 *
 * Dark is the default and the design's home (Brief §10). Light is the same
 * token names redefined under `:root[data-theme='light']` in tokens.css, so
 * applying a theme is one attribute on the root element — nothing that uses a
 * token needs to know which theme it is drawn in. The few things that cannot
 * read a CSS variable (the 3D canvas, the browser's own chrome) are handed a
 * literal colour from here. See ADR-0062.
 *
 * Kept on this device rather than on the profile. It is how this screen looks,
 * not a fact about the lifter — a phone in the gym and a laptop at home can
 * reasonably disagree.
 */

export const THEMES = ['dark', 'light'] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = 'g7m.theme';

/** Dark, until somebody says otherwise. */
export const DEFAULT_THEME: Theme = 'dark';

/**
 * The browser's colour for its own chrome — the address bar, the status bar
 * of an installed app — which reads `<meta name="theme-color">` and nothing
 * in the stylesheet. Each theme's page background.
 */
export const BROWSER_CHROME: Record<Theme, string> = {
  dark: '#1f1e1d',
  light: '#f5f3ee',
};

/** The subset of `Storage` this needs, so the tests can hand it a map. */
export type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * The stored preference, or dark.
 *
 * Anything unrecognised reads as the default rather than as itself, and a
 * storage that throws — private browsing on some engines, a WebView with
 * storage switched off — reads as the default rather than as a crash.
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

/** Remember a choice. Failing to is not worth an error: the page still changes. */
export function writeTheme(
  theme: Theme,
  storage: ThemeStorage | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage full or switched off. The choice lasts until the page does.
  }
}

/** The parts of a document a theme touches. A real `document` satisfies it. */
export interface ThemeDocument {
  readonly documentElement: {
    readonly dataset: Record<string, string | undefined>;
    readonly style: { colorScheme: string };
    readonly classList: { toggle: (token: string, force?: boolean) => unknown };
  };
  querySelector: (
    selector: string,
  ) => { setAttribute: (name: string, value: string) => void } | null;
}

/**
 * Put a theme on the page.
 *
 * The attribute switches every token. `color-scheme` tells the browser too, so
 * its own controls — a date picker, a scrollbar, the page behind an
 * overscroll — come out in the same theme. And the two meta tags are what the
 * browser's chrome reads, since it never looks at the stylesheet.
 */
export function applyTheme(
  theme: Theme,
  doc: ThemeDocument | undefined = globalThis.document,
): void {
  if (doc === undefined) return;
  const root = doc.documentElement;
  root.dataset['theme'] = theme;
  root.style.colorScheme = theme;
  root.classList.toggle('dark', theme === 'dark');
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', BROWSER_CHROME[theme]);
  doc.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme);
}
