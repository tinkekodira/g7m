import { afterEach, describe, expect, it } from 'vitest';
import { LOCALES, matchLocale } from './locales.js';
import {
  activateLocale,
  currentLocale,
  equipmentName,
  exerciseText,
  formatList,
  formatNumber,
  intlLocale,
  live,
  muscleName,
  t,
} from './runtime.js';

afterEach(async () => {
  await activateLocale('en');
});

describe('matchLocale', () => {
  it('takes the first preferred language the app speaks', () => {
    expect(matchLocale(['hr-HR', 'de-AT', 'en-GB'])).toBe('de');
    expect(matchLocale(['pt-PT'])).toBe('pt');
    expect(matchLocale(['es_419'])).toBe('es');
  });

  it('falls back to English', () => {
    expect(matchLocale(['hr', 'ja'])).toBe('en');
    expect(matchLocale([])).toBe('en');
    expect(matchLocale(undefined)).toBe('en');
  });
});

describe('activateLocale', () => {
  it('loads every language with its own words and catalogue', async () => {
    const saves = new Set<string>();
    for (const locale of LOCALES) {
      await activateLocale(locale);
      expect(currentLocale()).toBe(locale);
      saves.add(t().common.save);
      if (locale === 'en') {
        expect(exerciseText('barbell-back-squat')).toBeUndefined();
      } else {
        expect(exerciseText('barbell-back-squat')?.name).toBeTruthy();
        expect(muscleName('latissimus-dorsi')).toBeTruthy();
        expect(equipmentName('barbell')).toBeTruthy();
      }
    }
    // Six languages, six different words for Save.
    expect(saves.size).toBe(LOCALES.length);
  });

  it('formats numbers and lists the way the language does', async () => {
    await activateLocale('de');
    expect(intlLocale()).toBe('de-DE');
    expect(formatNumber(12450)).toBe('12.450');
    expect(formatList(['Brust', 'Rücken', 'Beine'])).toBe('Brust, Rücken und Beine');
    expect(t().common.dates.dayMonth(3, 'März')).toBe('3. März');
  });

  it('keeps a live record in step with the language', async () => {
    const regions = live(() => t().core.regions);
    expect(regions.chest).toBe('Chest');
    await activateLocale('fr');
    expect(regions.chest).toBe('Pectoraux');
    expect(Object.keys(regions)).toContain('legs');
  });
});
