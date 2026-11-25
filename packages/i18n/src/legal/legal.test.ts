import { describe, expect, it } from 'vitest';
import { LOCALES } from '../locales.js';
import { CONTACT_EMAIL, CONTROLLER_NAME, loadLegalText } from './index.js';
import type { LegalBlock, LegalText } from './types.js';

/**
 * The privacy policy is a promise, and each translation has to make the same
 * one. The types already insist every language has every field; these check
 * what types cannot — that no translation drops a section, a summary point or
 * the facts only the owner fills in.
 */

function words(block: LegalBlock): string {
  if (typeof block === 'string') return block;
  if ('list' in block) return block.list.join(' ');
  return block.terms.map((term) => `${term.term} ${term.detail}`).join(' ');
}

function wholeText(text: LegalText): string {
  return [
    ...text.privacy.summary,
    ...text.privacy.sections.flatMap((section) => section.blocks.map(words)),
    text.deletion.intro,
    text.deletion.byEmail.body,
    text.deletion.byEmail.action,
    ...text.deletion.sections.flatMap((section) => section.blocks.map(words)),
  ].join(' ');
}

const LABELS = {
  settings: 'SETTINGS',
  account: 'ACCOUNT',
  open: 'OPEN',
  word: 'WORD',
  yourData: 'DATA',
};

describe('legal text', () => {
  // One dynamic import per language; generous for a busy workspace run.
  it('says the same things in every language', { timeout: 30_000 }, async () => {
    const english = await loadLegalText('en');
    const ids = (text: LegalText) => ({
      privacy: text.privacy.sections.map((section) => section.id),
      deletion: text.deletion.sections.map((section) => section.id),
      summary: text.privacy.summary.length,
      blocks: text.privacy.sections.map((section) => section.blocks.length),
    });

    for (const locale of LOCALES) {
      const text = await loadLegalText(locale);
      expect(ids(text), locale).toEqual(ids(english));

      // The details the owner fills in reach every language.
      const all = wholeText(text);
      expect(all, locale).toContain(CONTACT_EMAIL);
      expect(all, locale).toContain(CONTROLLER_NAME);
      // No "[YOUR NAME]"-style placeholder survives into a published page.
      expect(all, locale).not.toMatch(/\[[A-Z ]+\]/);
      expect(text.deletion.byEmail.body, locale).toContain(CONTACT_EMAIL);

      // The in-app steps name the app's own controls, in its own words.
      const steps = text.deletion.inApp.steps(LABELS).join(' ');
      for (const label of ['SETTINGS', 'ACCOUNT', 'OPEN', 'WORD']) {
        expect(steps, `${locale} ${label}`).toContain(label);
      }

      // Translations say they are; the original does not.
      if (locale === 'en') expect(text.chrome.translationNote).toBeNull();
      else expect(text.chrome.translationNote, locale).toBeTruthy();
    }
  });

  it('names the services that process data in every language', async () => {
    for (const locale of LOCALES) {
      const all = wholeText(await loadLegalText(locale));
      for (const service of ['Supabase', 'PowerSync', 'GitHub', 'Google', 'Apple', 'AZOP']) {
        expect(all, `${locale} ${service}`).toContain(service);
      }
    }
  });
});
