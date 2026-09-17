import { describe, expect, it } from 'vitest';
import {
  BROWSER_CHROME,
  DEFAULT_THEME_PREFERENCE,
  THEME_STORAGE_KEY,
  applyTheme,
  prefersDark,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ThemeDocument,
  type ThemeStorage,
} from './theme.js';

function memoryStorage(initial: Record<string, string> = {}): ThemeStorage & {
  readonly values: Map<string, string>;
} {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

const throwing: ThemeStorage = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

/** Just enough of a document to watch what a theme does to it. */
function fakeDocument() {
  const dataset: Record<string, string | undefined> = {};
  const style = { colorScheme: '' };
  const classes = new Set<string>(['dark']);
  const meta: Record<string, string> = { 'theme-color': '', 'color-scheme': '' };
  const doc: ThemeDocument = {
    documentElement: {
      dataset,
      style,
      classList: {
        toggle: (token, force) => {
          if (force === true) classes.add(token);
          else classes.delete(token);
        },
      },
    },
    querySelector: (selector) => {
      const name = /name="([^"]+)"/.exec(selector)?.[1];
      if (name === undefined || !(name in meta)) return null;
      return {
        setAttribute: (_attribute, value) => {
          meta[name] = value;
        },
      };
    },
  };
  return { doc, dataset, style, classes, meta };
}

describe('readThemePreference', () => {
  it('is dark until somebody chooses', () => {
    expect(DEFAULT_THEME_PREFERENCE).toBe('dark');
    expect(readThemePreference(memoryStorage())).toBe('dark');
  });

  it('reads back a choice that was made', () => {
    expect(readThemePreference(memoryStorage({ [THEME_STORAGE_KEY]: 'light' }))).toBe('light');
  });

  /**
   * The key and both old values are the ones they always were, so an account
   * that picked a theme before `system` existed is not reset by the upgrade.
   */
  it('still reads a choice made before system existed', () => {
    expect(readThemePreference(memoryStorage({ [THEME_STORAGE_KEY]: 'dark' }))).toBe('dark');
    expect(readThemePreference(memoryStorage({ [THEME_STORAGE_KEY]: 'light' }))).toBe('light');
  });

  it('reads the new choice too', () => {
    expect(readThemePreference(memoryStorage({ [THEME_STORAGE_KEY]: 'system' }))).toBe('system');
  });

  it('treats anything it does not recognise as the default', () => {
    expect(readThemePreference(memoryStorage({ [THEME_STORAGE_KEY]: 'sepia' }))).toBe('dark');
  });

  it('survives storage that refuses to be read', () => {
    expect(readThemePreference(throwing)).toBe('dark');
  });
});

describe('writeThemePreference', () => {
  it('remembers the choice', () => {
    const storage = memoryStorage();
    writeThemePreference('light', storage);
    expect(storage.values.get(THEME_STORAGE_KEY)).toBe('light');
    expect(readThemePreference(storage)).toBe('light');
  });

  it('does not throw when storage is full or switched off', () => {
    expect(() => {
      writeThemePreference('light', throwing);
    }).not.toThrow();
  });
});

describe('resolveTheme', () => {
  it('draws exactly what was asked for, whatever the device says', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('dark', true)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('light', false)).toBe('light');
  });

  it('follows the device only when asked to', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});

describe('prefersDark', () => {
  it('reports what the query says', () => {
    expect(prefersDark({ matches: true })).toBe(true);
    expect(prefersDark({ matches: false })).toBe(false);
  });

  /**
   * A WebView with no `matchMedia` cannot answer, and only somebody who chose
   * `system` ever asks. Dark is the app's own default, so it is the honest
   * fallback rather than a guess at the device.
   */
  it('falls back to the app default where there is nothing to ask', () => {
    expect(prefersDark(undefined)).toBe(true);
  });
});

describe('applyTheme', () => {
  it('switches every token by marking the root, and tells the browser', () => {
    const { doc, dataset, style, classes, meta } = fakeDocument();
    applyTheme('light', doc);
    expect(dataset['theme']).toBe('light');
    expect(style.colorScheme).toBe('light');
    expect(classes.has('dark')).toBe(false);
    expect(meta['theme-color']).toBe(BROWSER_CHROME.light);
    expect(meta['color-scheme']).toBe('light');
  });

  it('goes back to dark just as completely', () => {
    const { doc, dataset, style, classes, meta } = fakeDocument();
    applyTheme('light', doc);
    applyTheme('dark', doc);
    expect(dataset['theme']).toBe('dark');
    expect(style.colorScheme).toBe('dark');
    expect(classes.has('dark')).toBe(true);
    expect(meta['theme-color']).toBe(BROWSER_CHROME.dark);
  });

  it('does nothing where there is no document', () => {
    expect(() => {
      applyTheme('light', undefined);
    }).not.toThrow();
  });
});
