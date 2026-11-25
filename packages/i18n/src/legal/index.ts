/**
 * The privacy policy and the account-deletion page, one chunk per language.
 *
 * English is a chunk too, unlike `Messages`: these pages are long, opened
 * rarely, and the entry bundle is paid for by every launch. A language whose
 * chunk will not load falls back to English rather than leaving a page that
 * the app stores link to blank. ADR-0189.
 */
import type { Locale } from '../locales.js';
import type { LegalText } from './types.js';

const LOADERS: Readonly<Record<Locale, () => Promise<LegalText>>> = {
  en: () => import('./en.js').then((m) => m.legal),
  de: () => import('./de.js').then((m) => m.legal),
  es: () => import('./es.js').then((m) => m.legal),
  fr: () => import('./fr.js').then((m) => m.legal),
  pt: () => import('./pt.js').then((m) => m.legal),
  it: () => import('./it.js').then((m) => m.legal),
};

export async function loadLegalText(locale: Locale): Promise<LegalText> {
  try {
    return await LOADERS[locale]();
  } catch (error) {
    if (locale === 'en') throw error;
    console.error(`Could not load the ${locale} legal text; showing English.`, error);
    return LOADERS.en();
  }
}

export { CONTACT_EMAIL, CONTROLLER_NAME, LEGAL_UPDATED } from './details.js';
export type { DeletionLabels, LegalBlock, LegalSection, LegalTerm, LegalText } from './types.js';
