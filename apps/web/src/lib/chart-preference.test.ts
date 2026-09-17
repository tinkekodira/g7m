import { describe, expect, it } from 'vitest';
import { CHART_STORAGE_KEY, readChartMetric, writeChartMetric } from './chart-preference.js';

function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    read: (key: string) => map.get(key) ?? null,
  };
}

describe('remembering the chart view', () => {
  it('reads back what was written', () => {
    const storage = fakeStorage();
    writeChartMetric('sets', storage);
    expect(storage.read(CHART_STORAGE_KEY)).toBe('sets');
    expect(readChartMetric(storage)).toBe('sets');
  });

  it('says nothing is remembered rather than inventing a default', () => {
    expect(readChartMetric(fakeStorage())).toBeNull();
    expect(readChartMetric(fakeStorage({ [CHART_STORAGE_KEY]: 'reps' }))).toBeNull();
  });

  /** Private browsing, or a WebView with storage switched off. */
  it('survives a storage that throws, in both directions', () => {
    const broken = {
      getItem: () => {
        throw new Error('nope');
      },
      setItem: () => {
        throw new Error('nope');
      },
    };
    expect(readChartMetric(broken)).toBeNull();
    expect(() => {
      writeChartMetric('cardio', broken);
    }).not.toThrow();
    expect(readChartMetric(undefined)).toBeNull();
  });
});
