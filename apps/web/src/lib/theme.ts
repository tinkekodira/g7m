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

/**
 * The two themes that can actually be drawn. Everything below the preference
 * layer works in these: `applyTheme`, the browser chrome, the 3D stage.
 */
export const THEMES = ['dark', 'light'] as const;
export type Theme = (typeof THEMES)[number];

/**
 * What the lifter chose, which is not the same thing.
 *
 * `system` is a standing instruction rather than a colour — it resolves to
 * whichever theme the phone is in, and re-resolves when that changes. Keeping
 * the two types apart is what stops `Record<Theme, string>` and the stage
 * colour having to invent an answer for a value that is not a colour.
 */
export const THEME_PREFERENCES = ['dark', 'light', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const THEME_STORAGE_KEY = 'g7m.theme';

/**
 * Dark, until somebody says otherwise — Brief §10, and still true.
 *
 * Not `system`. Dark is the design's home and the theme the app was drawn in;
 * flipping every existing account to whatever their phone happens to be set to
 * would be a redesign delivered by an update nobody asked for. `system` is
 * offered, not assumed.
 */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'dark';

/** What `system` resolves to when there is nothing to ask. */
export const DEFAULT_THEME: Theme = 'dark';

/** The media query that answers "what is this phone set to". */
export const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Whether the device is currently in dark mode.
 *
 * False wherever there is no `matchMedia` — an old WebView, a test — which
 * resolves `system` to light. That is only reachable when somebody has
 * explicitly chosen `system` on a device that cannot answer, and light is the
 * safer guess than pretending to know.
 */
export function prefersDark(mql: { matches: boolean } | undefined = safeMatch()): boolean {
  return mql?.matches ?? DEFAULT_THEME === 'dark';
}

/** The theme to actually draw, given what was chosen and what the device says. */
export function resolveTheme(preference: ThemePreference, deviceIsDark: boolean): Theme {
  if (preference === 'system') return deviceIsDark ? 'dark' : 'light';
  return preference;
}

function safeMatch(): { matches: boolean } | undefined {
  try {
    return globalThis.matchMedia?.(DARK_QUERY);
  } catch {
    // Some embedded WebViews declare matchMedia and throw on use.
    return undefined;
  }
}

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
 *
 * The key is the one it always was, and `dark` and `light` still mean what they
 * meant, so an account that chose a theme before `system` existed reads back
 * its own choice rather than being reset by the upgrade.
 */
export function readThemePreference(
  storage: ThemeStorage | undefined = globalThis.localStorage,
): ThemePreference {
  try {
    const stored = storage?.getItem(THEME_STORAGE_KEY);
    return (THEME_PREFERENCES as readonly (string | null | undefined)[]).includes(stored)
      ? (stored as ThemePreference)
      : DEFAULT_THEME_PREFERENCE;
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

/** Remember a choice. Failing to is not worth an error: the page still changes. */
export function writeThemePreference(
  preference: ThemePreference,
  storage: ThemeStorage | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, preference);
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
