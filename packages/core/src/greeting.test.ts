import { describe, expect, it } from 'vitest';
import { GREETABLE_COUNTRIES, countryName, firstName, greetingFor } from './greeting.js';

describe('greetingFor', () => {
  it('greets somebody in the language of where they are from', () => {
    expect(greetingFor('DE', null).text).toBe('Willkommen');
    expect(greetingFor('FR', null).text).toBe('Bienvenue');
    expect(greetingFor('JP', null).text).toBe('ようこそ');
  });

  it('accepts a lower-case code, because URLs and forms are careless', () => {
    expect(greetingFor('de', null).text).toBe('Willkommen');
  });

  /**
   * "Welcome" is one word in English and inflects across most of Europe. A
   * Croatian man is *dobrodošao* and a Croatian woman *dobrodošla*, and the
   * wrong one is far more noticeable to the reader than to somebody who only
   * speaks English.
   */
  it('inflects where the language does', () => {
    expect(greetingFor('HR', 'male').text).toBe('Dobrodošao');
    expect(greetingFor('HR', 'female').text).toBe('Dobrodošla');
    expect(greetingFor('ES', 'female').text).toBe('Bienvenida');
    expect(greetingFor('ES', 'male').text).toBe('Bienvenido');
  });

  it('uses the form a stranger would when it does not know', () => {
    // Plural or neutral, not a coin flip between two gendered forms.
    expect(greetingFor('HR', null).text).toBe('Dobro došli');
    expect(greetingFor('SI', null).text).toBe('Dobrodošli');
  });

  it('ignores sex in a language that does not inflect', () => {
    expect(greetingFor('DE', 'female').text).toBe('Willkommen');
    expect(greetingFor('DE', 'male').text).toBe('Willkommen');
  });

  it('falls back to English rather than to nothing', () => {
    expect(greetingFor(null, null).text).toBe('Welcome');
    expect(greetingFor('XX', null).text).toBe('Welcome');
    expect(greetingFor('', null).text).toBe('Welcome');
  });

  /**
   * Arabic inside an English heading runs the wrong way without being told,
   * and a screen reader spells a foreign word out letter by letter unless the
   * element carries `lang`.
   */
  it('says which way the text runs and what language it is', () => {
    expect(greetingFor('SA', null).direction).toBe('rtl');
    expect(greetingFor('IL', null).direction).toBe('rtl');
    expect(greetingFor('DE', null).direction).toBe('ltr');
    expect(greetingFor('DE', null).language).toBe('de');
  });
});

describe('the country list', () => {
  /** Where "Welcome" is the right answer rather than the fallback. */
  const ENGLISH_SPEAKING = ['GB', 'US', 'AU', 'NZ', 'CA', 'SG', 'NG', 'ZA'];

  /**
   * The list is also the picker. A country with no greeting would offer
   * somebody a choice and then ignore it, which is worse than not asking.
   */
  it('can greet every country it offers', () => {
    for (const code of GREETABLE_COUNTRIES) {
      expect(greetingFor(code, null).text, code).not.toBe('');
    }
  });

  it('does not quietly fall back to English for a country that does not speak it', () => {
    // The failure this guards against is a country added to the picker without
    // a greeting: it resolves to `en` and nobody notices for a year.
    for (const code of GREETABLE_COUNTRIES) {
      if (ENGLISH_SPEAKING.includes(code)) continue;
      expect(greetingFor(code, null).language, code).not.toBe('en');
    }
  });

  it('offers the English-speaking ones too, greeting them in English', () => {
    expect(GREETABLE_COUNTRIES).toContain('GB');
    expect(greetingFor('AU', null).text).toBe('Welcome');
  });

  it('is every code exactly once, upper case, two letters', () => {
    expect(new Set(GREETABLE_COUNTRIES).size).toBe(GREETABLE_COUNTRIES.length);
    for (const code of GREETABLE_COUNTRIES) {
      expect(code, code).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('is long enough to be worth a picker', () => {
    expect(GREETABLE_COUNTRIES.length).toBeGreaterThan(40);
  });
});

describe('countryName', () => {
  it('names a country in the reader’s own language', () => {
    expect(countryName('DE', 'en')).toBe('Germany');
    expect(countryName('DE', 'de')).toBe('Deutschland');
  });

  /**
   * The app carries codes and no names at all, which is also why the picker
   * reads correctly for somebody whose phone is set to Croatian.
   */
  it('never throws, whatever it is handed', () => {
    // A well-formed but unassigned code comes back as ICU's own placeholder;
    // a malformed one makes `Intl` throw, and that is the case the catch is
    // there for.
    expect(countryName('ZZ', 'en')).not.toBe('');
    expect(countryName('Z', 'en')).toBe('Z');
    expect(countryName('DE', 'not-a-locale')).not.toBe('');
  });
});

describe('firstName', () => {
  it('greets somebody by the name they go by, not their full one', () => {
    expect(firstName('Tin Milanović')).toBe('Tin');
    expect(firstName('Tin')).toBe('Tin');
  });

  it('copes with the whitespace a pasted name arrives with', () => {
    expect(firstName('  Tin  Milanović ')).toBe('Tin');
    expect(firstName('Tin	Milanović')).toBe('Tin');
  });

  /**
   * The common case. The field is optional and most people never fill it in,
   * so the greeting has to read without one rather than inventing a name from
   * an email address.
   */
  it('has nothing to say when there is no name', () => {
    expect(firstName(null)).toBeNull();
    expect(firstName('')).toBeNull();
    expect(firstName('   ')).toBeNull();
  });
});
