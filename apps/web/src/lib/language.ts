/**
 * Which language the app speaks, on this device. ADR-0181.
 *
 * Three sources, in order:
 *
 * 1. The account's choice (`profiles.language`), applied by the auth gate when
 *    the profile arrives — so a language picked on the phone follows the
 *    lifter to the tablet.
 * 2. The last choice made on this device, kept here so the app opens in it
 *    before anybody has signed in, and before sync has delivered anything.
 * 3. The phone's own language, matched against the ones the app speaks.
 *
 * Switching re-mounts everything under the auth gate (`App.tsx`): every
 * screen re-reads its words and the catalogue its translations. It is rare
 * enough — once at start-up, once when somebody picks — that a cheap, total
 * answer beats making every component watch for it.
 */
import { create } from 'zustand';
import { activateLocale, currentLocale, isLocale, matchLocale, type Locale } from '@g7m/i18n';

export const LANGUAGE_STORAGE_KEY = 'g7m.language';

export type LanguageStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** The last language picked on this device, or null for "follow the phone". */
export function readStoredLanguage(
  storage: LanguageStorage | undefined = globalThis.localStorage,
): Locale | null {
  try {
    const stored = storage?.getItem(LANGUAGE_STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeStoredLanguage(
  locale: Locale,
  storage: LanguageStorage | undefined = globalThis.localStorage,
): void {
  try {
    storage?.setItem(LANGUAGE_STORAGE_KEY, locale);
  } catch {
    // Storage off or full. The choice lasts until the page does, and the
    // account still has it once the profile syncs.
  }
}

/** The phone's language, if the app speaks it; English otherwise. */
export function deviceLanguage(
  nav: Pick<Navigator, 'languages' | 'language'> | undefined = globalThis.navigator,
): Locale {
  if (nav === undefined) return 'en';
  const preferred = nav.languages.length > 0 ? nav.languages : [nav.language];
  return matchLocale(preferred);
}

/** What the app opens in, before any account is known. */
export function initialLanguage(): Locale {
  return readStoredLanguage() ?? deviceLanguage();
}

/** Tell the browser, screen readers and hyphenation which language the page is in. */
export function applyDocumentLanguage(locale: Locale): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
}

interface LanguageState {
  /** The language on screen. The app re-mounts when it changes. */
  readonly locale: Locale;
}

export const useLanguageStore = create<LanguageState>(() => ({ locale: currentLocale() }));

/**
 * Speak another language from now on.
 *
 * Remembered on this device; the account is the caller's business, because
 * only a signed-in screen can write it. Resolves false — and changes nothing —
 * when the language's words cannot be loaded.
 */
export async function switchLanguage(locale: Locale): Promise<boolean> {
  writeStoredLanguage(locale);
  if (locale === currentLocale()) return true;
  try {
    await activateLocale(locale);
  } catch (error) {
    console.error(`Could not load the ${locale} words`, error);
    return false;
  }
  applyDocumentLanguage(locale);
  useLanguageStore.setState({ locale });
  return true;
}

/**
 * Before the first render: open in the right language, or in English if its
 * words will not load.
 */
export async function startLanguage(): Promise<void> {
  const locale = initialLanguage();
  try {
    await activateLocale(locale);
  } catch (error) {
    console.error(`Could not load the ${locale} words`, error);
  }
  applyDocumentLanguage(currentLocale());
  useLanguageStore.setState({ locale: currentLocale() });
}
