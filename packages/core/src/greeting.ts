/**
 * Saying hello in the user's own language.
 *
 * One word on the home screen, and the only place in the app that is
 * translated at all. That is deliberate: this is a greeting, not a locale
 * setting, and it must not quietly become one. Everything else stays in
 * English until there is a real decision to translate the app, which is a much
 * larger commitment than a map of forty greetings.
 *
 * ## A country is not a language
 *
 * Switzerland has four, Belgium has three, and India has twenty-two official
 * ones. Picking a single language for a country is a guess. It is a guess
 * worth making *here*, because the cost of being wrong is a greeting somebody
 * did not expect, and it would be the wrong call anywhere with meaning in it —
 * which is why the column is documented as not-a-locale and nothing else reads
 * it.
 *
 * Where a country genuinely has no single answer, the most widely spoken one
 * is used and the comment says so.
 *
 * ## Gendered greetings
 *
 * "Welcome" is one word in English and inflects in most of Europe: a Croatian
 * man is *dobrodošao* and a Croatian woman *dobrodošla*. Getting that wrong is
 * far more noticeable to the reader than it is to somebody who only speaks
 * English, and the profile already knows. Where the app does not know, the
 * plural or neutral form is used, which is what a stranger would say.
 */
import type { Sex } from './body.js';

/** One greeting, in every form the language needs. */
interface Greeting {
  /** Used when the sex is unknown. A plural or neutral form where one exists. */
  readonly neutral: string;
  readonly male?: string;
  readonly female?: string;
}

/**
 * The greetings, by language.
 *
 * Keyed by ISO 639-1, though nothing looks a language up directly — the
 * country map below is the only door. Kept separate anyway, because several
 * countries share a language and duplicating the string is how one of them
 * ends up with a typo nobody notices for a year.
 */
const GREETINGS: Record<string, Greeting> = {
  en: { neutral: 'Welcome' },
  de: { neutral: 'Willkommen' },
  fr: { neutral: 'Bienvenue' },
  es: { neutral: 'Bienvenido', female: 'Bienvenida' },
  pt: { neutral: 'Bem-vindo', female: 'Bem-vinda' },
  it: { neutral: 'Benvenuto', female: 'Benvenuta' },
  nl: { neutral: 'Welkom' },
  sv: { neutral: 'Välkommen' },
  no: { neutral: 'Velkommen' },
  da: { neutral: 'Velkommen' },
  fi: { neutral: 'Tervetuloa' },
  is: { neutral: 'Velkomin', male: 'Velkominn' },
  et: { neutral: 'Tere tulemast' },
  lv: { neutral: 'Laipni lūdzam' },
  lt: { neutral: 'Sveiki atvykę' },
  pl: { neutral: 'Witaj' },
  cs: { neutral: 'Vítej' },
  sk: { neutral: 'Vitaj' },
  hu: { neutral: 'Üdvözöllek' },
  ro: { neutral: 'Bun venit' },
  // Serbo-Croatian and its neighbours all inflect the same way.
  hr: { neutral: 'Dobro došli', male: 'Dobrodošao', female: 'Dobrodošla' },
  sr: { neutral: 'Добро дошли', male: 'Добродошао', female: 'Добродошла' },
  bs: { neutral: 'Dobro došli', male: 'Dobrodošao', female: 'Dobrodošla' },
  sl: { neutral: 'Dobrodošli', male: 'Dobrodošel', female: 'Dobrodošla' },
  mk: { neutral: 'Добредојдовте', male: 'Добредојде', female: 'Добредојде' },
  sq: { neutral: 'Mirë se erdhët', male: 'Mirë se erdhe', female: 'Mirë se erdhe' },
  bg: { neutral: 'Добре дошли', male: 'Добре дошъл', female: 'Добре дошла' },
  el: { neutral: 'Καλώς ήρθες' },
  tr: { neutral: 'Hoş geldin' },
  ru: { neutral: 'Добро пожаловать' },
  uk: { neutral: 'Ласкаво просимо' },
  ar: { neutral: 'أهلاً وسهلاً' },
  he: { neutral: 'ברוך הבא', female: 'ברוכה הבאה' },
  fa: { neutral: 'خوش آمدید' },
  hi: { neutral: 'स्वागत है' },
  bn: { neutral: 'স্বাগতম' },
  ur: { neutral: 'خوش آمدید' },
  th: { neutral: 'ยินดีต้อนรับ' },
  vi: { neutral: 'Chào mừng' },
  id: { neutral: 'Selamat datang' },
  ms: { neutral: 'Selamat datang' },
  tl: { neutral: 'Maligayang pagdating' },
  ja: { neutral: 'ようこそ' },
  ko: { neutral: '환영합니다' },
  zh: { neutral: '欢迎' },
  sw: { neutral: 'Karibu' },
  af: { neutral: 'Welkom' },
  ga: { neutral: 'Fáilte' },
  cy: { neutral: 'Croeso' },
  ca: { neutral: 'Benvingut', female: 'Benvinguda' },
};

/**
 * Country to language, ISO 3166-1 alpha-2 to ISO 639-1.
 *
 * This list is also the country picker — a country with no greeting here would
 * offer somebody a choice and then ignore it, which is worse than not asking.
 * Adding a country means adding a greeting first.
 *
 * The awkward ones, named rather than hidden: Switzerland is given German,
 * Belgium Dutch, Canada English, India Hindi and South Africa English, each
 * being the most widely spoken rather than the only one. Somebody in Geneva
 * will be greeted in the wrong language, and the cost of that is one word.
 */
const COUNTRY_LANGUAGE: Record<string, string> = {
  AE: 'ar',
  AR: 'es',
  AT: 'de',
  AU: 'en',
  BA: 'bs',
  BD: 'bn',
  BE: 'nl',
  BG: 'bg',
  BR: 'pt',
  CA: 'en',
  CH: 'de',
  CL: 'es',
  CN: 'zh',
  CO: 'es',
  CZ: 'cs',
  DE: 'de',
  DK: 'da',
  EE: 'et',
  EG: 'ar',
  ES: 'es',
  FI: 'fi',
  FR: 'fr',
  GB: 'en',
  GR: 'el',
  HR: 'hr',
  HU: 'hu',
  ID: 'id',
  IE: 'ga',
  IL: 'he',
  IN: 'hi',
  IR: 'fa',
  IS: 'is',
  IT: 'it',
  JP: 'ja',
  KE: 'sw',
  KR: 'ko',
  LT: 'lt',
  LV: 'lv',
  MA: 'ar',
  MK: 'mk',
  MX: 'es',
  MY: 'ms',
  NG: 'en',
  NL: 'nl',
  NO: 'no',
  NZ: 'en',
  PE: 'es',
  PH: 'tl',
  PK: 'ur',
  PL: 'pl',
  PT: 'pt',
  RO: 'ro',
  RS: 'sr',
  RU: 'ru',
  SA: 'ar',
  SE: 'sv',
  SG: 'en',
  SI: 'sl',
  SK: 'sk',
  TH: 'th',
  TR: 'tr',
  TW: 'zh',
  UA: 'uk',
  US: 'en',
  VN: 'vi',
  ZA: 'en',
};

/** Languages written right to left, so the heading can be told which way to run. */
const RIGHT_TO_LEFT = new Set(['ar', 'he', 'fa', 'ur']);

/** Every country the app can greet somebody from, sorted by code. */
export const GREETABLE_COUNTRIES: readonly string[] = Object.keys(COUNTRY_LANGUAGE).sort();

export interface LocalisedGreeting {
  readonly text: string;
  /** For the `dir` attribute. Arabic inside an English heading needs telling. */
  readonly direction: 'ltr' | 'rtl';
  /** For `lang`, so a screen reader switches voice instead of spelling it out. */
  readonly language: string;
}

/**
 * "Welcome", in the language of the country the user gave.
 *
 * Falls back to English for an unknown country, a missing one, or a country
 * whose language has somehow lost its greeting — the last being a bug, but one
 * that should show up as an English word rather than as an empty heading.
 */
export function greetingFor(country: string | null, sex: Sex | null): LocalisedGreeting {
  const language = country === null ? 'en' : (COUNTRY_LANGUAGE[country.toUpperCase()] ?? 'en');
  const greeting = GREETINGS[language] ?? GREETINGS.en;

  const text =
    greeting === undefined
      ? 'Welcome'
      : sex === 'male'
        ? (greeting.male ?? greeting.neutral)
        : sex === 'female'
          ? (greeting.female ?? greeting.neutral)
          : greeting.neutral;

  return {
    text,
    direction: RIGHT_TO_LEFT.has(language) ? 'rtl' : 'ltr',
    language,
  };
}

/**
 * The country's name, in the reader's own language.
 *
 * `Intl.DisplayNames` ships on every target platform and knows all of this
 * already, so the app carries codes and no names at all — which is also why
 * the picker reads correctly for somebody whose phone is set to Croatian.
 *
 * Wrapped in a try/catch because it throws on an unsupported locale in some
 * older WebViews, and a picker that renders codes is worse than one that
 * renders names but far better than one that does not render.
 */
export function countryName(code: string, locale?: string): string {
  try {
    const names = new Intl.DisplayNames([locale ?? 'en'], { type: 'region' });
    return names.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/**
 * What to call somebody, from what they typed as their name.
 *
 * The first word only. A greeting is the one place in an app that should sound
 * like a person talking, and "Welcome, Tin Milanović" is a form letter —
 * nobody is greeted by their full name except by an institution.
 *
 * Null when there is nothing usable, which is the common case: the field is
 * optional and most people never fill it in. The caller then greets them
 * without a name rather than inventing one from an email address, which is how
 * an app ends up saying "Welcome, milanovic.tin+test".
 */
export function firstName(displayName: string | null): string | null {
  if (displayName === null) return null;

  // Any whitespace, not just a space: a name pasted from a form can arrive
  // with a non-breaking space or a tab in it.
  const first = displayName.trim().split(/\s+/)[0] ?? '';
  return first === '' ? null : first;
}
