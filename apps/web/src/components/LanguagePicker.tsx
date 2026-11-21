import { useId } from 'react';
import { LOCALES, LOCALE_NAMES, type Locale } from '@g7m/i18n';
import { GlobeIcon } from './icons.js';

/**
 * A flag beside each name, so the eye lands on its language before reading.
 *
 * The flag of the country whose spelling the words use: British for English
 * (`en-GB`), Brazilian for Portuguese (`pt-BR`), as in `INTL_TAGS`. Emoji, so
 * they cost nothing to ship; Windows draws them as two letters, which still
 * reads.
 */
const LOCALE_FLAGS: Readonly<Record<Locale, string>> = {
  en: '\u{1F1EC}\u{1F1E7}',
  de: '\u{1F1E9}\u{1F1EA}',
  es: '\u{1F1EA}\u{1F1F8}',
  fr: '\u{1F1EB}\u{1F1F7}',
  pt: '\u{1F1E7}\u{1F1F7}',
  it: '\u{1F1EE}\u{1F1F9}',
};

/**
 * The languages, each named in itself. ADR-0181.
 *
 * Never translated: somebody looking for Deutsch in a list written in
 * Portuguese is looking for the word they know, and "Alemão" is not it.
 */
const OPTIONS = LOCALES.map((locale) => ({
  locale,
  name: LOCALE_NAMES[locale],
  flag: LOCALE_FLAGS[locale],
}));

/**
 * One large radio per language: the first question of onboarding, answered
 * with a thumb before anything else in the app can be read.
 */
export function LanguageChoices({
  selected,
  disabled = false,
  onPick,
}: {
  readonly selected: Locale;
  readonly disabled?: boolean;
  readonly onPick: (locale: Locale) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {OPTIONS.map(({ locale, name, flag }) => (
        <label
          key={locale}
          lang={locale}
          className="flex min-h-tap cursor-pointer items-center gap-4 rounded-control border border-subtle bg-surface p-4 hover:border-strong has-checked:border-accent has-checked:bg-accent-subtle has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
        >
          <input
            type="radio"
            name="language"
            value={locale}
            checked={selected === locale}
            disabled={disabled}
            onChange={() => onPick(locale)}
            className="size-5 shrink-0 accent-accent"
          />
          <span aria-hidden="true" className="shrink-0 text-2xl leading-none">
            {flag}
          </span>
          <span className="block text-base font-semibold text-primary">{name}</span>
        </label>
      ))}
    </div>
  );
}

/**
 * The same choice as a native select: Settings, and the sign-in screen, where
 * it sits beside other things rather than being the question.
 */
export function LanguageSelect({
  value,
  label,
  disabled = false,
  compact = false,
  onChange,
}: {
  readonly value: Locale;
  readonly label: string;
  readonly disabled?: boolean;
  /** A globe and the select alone, with the label for screen readers only. */
  readonly compact?: boolean;
  readonly onChange: (locale: Locale) => void;
}) {
  const id = useId();
  return (
    <div className={compact ? 'flex items-center gap-2' : 'flex flex-col gap-1.5'}>
      {compact && <GlobeIcon className="size-5 shrink-0 text-muted" />}
      <label htmlFor={id} className={compact ? 'sr-only' : 'text-sm font-medium text-secondary'}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = OPTIONS.find((option) => option.locale === event.target.value);
          if (next !== undefined) onChange(next.locale);
        }}
        className={`min-h-tap rounded-control border border-subtle bg-elevated px-3 text-base text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 ${compact ? '' : 'w-full'}`}
      >
        {OPTIONS.map(({ locale, name, flag }) => (
          <option key={locale} value={locale} lang={locale}>
            {`${flag} ${name}`}
          </option>
        ))}
      </select>
    </div>
  );
}
