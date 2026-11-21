/**
 * Which language is speaking, and its words.
 *
 * Module state rather than a React context, on purpose. The words are needed
 * in `@g7m/core` (badge names, the coach's explanations), in `@g7m/db` (the
 * catalogue) and in plain view-model files, none of which can reach a context.
 * A switch is rare — once at start-up, and again only when somebody picks a
 * language — so the app answers it by re-mounting everything under the auth
 * gate (`App.tsx`), and nothing here has to be observed to stay current.
 *
 * English is always loaded, because it is what every missing piece falls back
 * to and what the tests run in. The other languages are a chunk each, fetched
 * by `activateLocale` and precached by the service worker like every other
 * chunk, so a phone in a basement can still switch.
 */
import type { CatalogueText, ExerciseText } from './catalogue/types.js';
import { DEFAULT_LOCALE, INTL_TAGS, type Locale } from './locales.js';
import { en, type Messages } from './messages/en/index.js';

/** Everything one language brings: its words, and its catalogue. */
export interface LocaleBundle {
  readonly messages: Messages;
  readonly catalogue: CatalogueText | null;
}

let current: Locale = DEFAULT_LOCALE;
let messages: Messages = en;
let catalogue: CatalogueText | null = null;
const listeners = new Set<(locale: Locale) => void>();

/** The words of the language speaking now. Call it at render, never at import. */
export function t(): Messages {
  return messages;
}

export function currentLocale(): Locale {
  return current;
}

/** The tag to hand `Intl` and `toLocaleString`, e.g. `de-DE`. */
export function intlLocale(): string {
  return INTL_TAGS[current];
}

const LOADERS: Readonly<Record<Exclude<Locale, 'en'>, () => Promise<LocaleBundle>>> = {
  de: () => import('./bundles/de.js').then((m) => m.bundle),
  es: () => import('./bundles/es.js').then((m) => m.bundle),
  fr: () => import('./bundles/fr.js').then((m) => m.bundle),
  pt: () => import('./bundles/pt.js').then((m) => m.bundle),
  it: () => import('./bundles/it.js').then((m) => m.bundle),
};

/**
 * Switch language.
 *
 * Resolves once the words are in place. If a language's chunk cannot be
 * loaded — a build from before it existed, a cache evicted while offline —
 * the app stays in the language it was in rather than going blank, and the
 * error is for the caller to log.
 */
export async function activateLocale(locale: Locale): Promise<void> {
  const bundle: LocaleBundle =
    locale === 'en' ? { messages: en, catalogue: null } : await LOADERS[locale]();
  current = locale;
  messages = bundle.messages;
  catalogue = bundle.catalogue;
  for (const listener of listeners) listener(locale);
}

/** Told after every switch. Returns the unsubscribe. */
export function onLocaleChange(listener: (locale: Locale) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** For tests: put a bundle in place without a dynamic import. */
export function setBundleForTesting(locale: Locale, bundle: LocaleBundle): void {
  current = locale;
  messages = bundle.messages;
  catalogue = bundle.catalogue;
}

/**
 * A record of labels that always answers in the language speaking now.
 *
 * For the label maps `@g7m/core` and the app export as constants —
 * `REGION_LABELS[region]`, `Object.entries(ACTIVITY_LABELS)` — so that they
 * keep their shape and every call site keeps working, while the words behind
 * them follow `t()`. A plain object built at import time would be frozen in
 * whatever language was speaking when the module loaded.
 */
export function live<K extends string, V>(
  read: () => Readonly<Record<K, V>>,
): Readonly<Record<K, V>> {
  return new Proxy({} as Record<K, V>, {
    get: (_target, key) => (read() as Record<string | symbol, unknown>)[key],
    has: (_target, key) => key in read(),
    ownKeys: () => Reflect.ownKeys(read()),
    getOwnPropertyDescriptor: (_target, key) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(read(), key);
      return descriptor === undefined ? undefined : { ...descriptor, configurable: true };
    },
  });
}

/* -------------------------------------------------------------------------
 * The catalogue. Undefined means "say it in English", which is the row as
 * Postgres has it — so English needs no file of its own.
 * ---------------------------------------------------------------------- */

export function exerciseText(slug: string): ExerciseText | undefined {
  return catalogue?.exercises[slug];
}

export function muscleName(slug: string): string | undefined {
  return catalogue?.muscles[slug];
}

export function muscleGroupName(slug: string): string | undefined {
  return catalogue?.muscleGroups[slug];
}

export function equipmentName(slug: string): string | undefined {
  return catalogue?.equipment[slug];
}

/* -------------------------------------------------------------------------
 * Numbers and dates, in the language speaking now.
 * ---------------------------------------------------------------------- */

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString(intlLocale(), options);
}

export function formatDate(value: Date, options?: Intl.DateTimeFormatOptions): string {
  return value.toLocaleDateString(intlLocale(), options);
}

export function formatTime(value: Date, options?: Intl.DateTimeFormatOptions): string {
  return value.toLocaleTimeString(intlLocale(), options);
}

/**
 * A list read as a sentence: "chest, back and legs", "Brust, Rücken und Beine".
 * Falls back to commas where `Intl.ListFormat` is missing.
 */
export function formatList(
  items: readonly string[],
  type: 'conjunction' | 'disjunction' = 'conjunction',
): string {
  try {
    return new Intl.ListFormat(intlLocale(), { type }).format(items);
  } catch {
    return items.join(', ');
  }
}
