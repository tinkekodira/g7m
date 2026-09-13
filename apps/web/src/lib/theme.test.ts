import { describe, expect, it } from 'vitest';
import {
  BROWSER_CHROME,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  applyTheme,
  readTheme,
  writeTheme,
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

describe('readTheme', () => {
  it('is dark until somebody chooses', () => {
    expect(DEFAULT_THEME).toBe('dark');
    expect(readTheme(memoryStorage())).toBe('dark');
  });

  it('reads back a choice that was made', () => {
    expect(readTheme(memoryStorage({ [THEME_STORAGE_KEY]: 'light' }))).toBe('light');
  });

  it('treats anything it does not recognise as the default', () => {
    expect(readTheme(memoryStorage({ [THEME_STORAGE_KEY]: 'sepia' }))).toBe('dark');
  });

  it('survives storage that refuses to be read', () => {
    expect(readTheme(throwing)).toBe('dark');
  });
});

describe('writeTheme', () => {
  it('remembers the choice', () => {
    const storage = memoryStorage();
    writeTheme('light', storage);
    expect(storage.values.get(THEME_STORAGE_KEY)).toBe('light');
    expect(readTheme(storage)).toBe('light');
  });

  it('does not throw when storage is full or switched off', () => {
    expect(() => {
      writeTheme('light', throwing);
    }).not.toThrow();
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
