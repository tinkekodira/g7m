/**
 * Which view the progress chart was last set to.
 *
 * The choice already lives in the URL (ADR-0071), which is what makes Back and
 * a reload keep it. What the URL cannot survive is the app being closed:
 * reopening starts at `/`, with no query on it, and the chart went back to
 * weight lifted every time — including on a Home Screen app, where "closed"
 * is just swiping it out of the switcher.
 *
 * So the last choice is remembered here as well, and stands in when the
 * address says nothing. The address still wins when it says something, which
 * keeps a shared or bookmarked link showing what it says it shows.
 */
import { isChartMetric, type ChartMetric } from '@g7m/core';

export const CHART_STORAGE_KEY = 'g7m.chart';

/** The subset of `Storage` this needs, so the tests can hand it a map. */
export type ChartStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * The remembered view, or null for "nothing remembered".
 *
 * Null rather than a default, so the caller keeps one place where the default
 * lives. A storage that throws — private browsing, a WebView with storage off
 * — reads as nothing remembered rather than as a crash.
 */
export function readChartMetric(
  storage: ChartStorage | undefined = globalThis.localStorage,
): ChartMetric | null {
  try {
    const stored = storage?.getItem(CHART_STORAGE_KEY);
    return isChartMetric(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Remember a choice. Failing to is not worth an error: the chart still changed. */
export function writeChartMetric(
  metric: ChartMetric,
  storage: ChartStorage | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(CHART_STORAGE_KEY, metric);
  } catch {
    // Storage full or switched off. The choice lasts as long as the app is open.
  }
}
