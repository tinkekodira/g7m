/**
 * The languages the app speaks, and how to tell which one somebody wants.
 *
 * English is the language the app is written in and the one every other falls
 * back to. The rest are the first batch: the biggest gym-going markets that
 * read left to right in the Latin alphabet, so no screen has to be mirrored
 * and no font has to be added. ADR-0181.
 */

export const LOCALES = ['en', 'de', 'es', 'fr', 'pt', 'it'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Each language in its own words.
 *
 * A picker that lists "German" to somebody who reads no English has asked them
 * to find their language in a language they do not read.
 */
export const LOCALE_NAMES: Readonly<Record<Locale, string>> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  it: 'Italiano',
};

/**
 * The tag `Intl` formats numbers and dates with.
 *
 * English is British because the app always was: `en-GB` was hard-coded for
 * thousands separators and day-first dates long before there was a choice.
 * Portuguese is Brazilian, the larger audience by far, and the words in
 * `messages/pt` are Brazilian to match.
 */
export const INTL_TAGS: Readonly<Record<Locale, string>> = {
  en: 'en-GB',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  pt: 'pt-BR',
  it: 'it-IT',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * The first of somebody's preferred languages the app speaks, or English.
 *
 * Matched on the language alone, so `de-AT`, `de-CH` and `pt-PT` all find a
 * home. The order of the list is the person's order: a phone set to Croatian
 * with German second gets German, not English.
 */
export function matchLocale(preferred: readonly string[] | undefined): Locale {
  for (const tag of preferred ?? []) {
    const language = tag.toLowerCase().split(/[-_]/)[0];
    if (isLocale(language)) return language;
  }
  return DEFAULT_LOCALE;
}
