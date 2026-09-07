import { useId, useMemo } from 'react';
import { GREETABLE_COUNTRIES, countryName } from '@g7m/core';

/**
 * Where you are from, for one word on the home screen.
 *
 * A native `<select>`, not a searchable combobox. Sixty entries is a list a
 * platform picker handles better than anything built here would: iOS shows a
 * wheel, Android a bottom sheet, desktop a dropdown with type-ahead, and all
 * three are already accessible and already familiar. A custom widget would
 * have to earn that back, and it is one optional question.
 *
 * The names come from `Intl.DisplayNames` in the reader's own locale, so the
 * app ships sixty two-letter codes and no country names at all — and somebody
 * whose phone is set to Croatian sees Njemačka rather than Germany.
 *
 * Sorted by the displayed name rather than by code, because a list that reads
 * Austria, Australia, Bosnia is sorted by something the reader cannot see.
 */
export function CountryPicker({
  value,
  onChange,
  disabled = false,
  label = 'Where are you from?',
  hint,
}: {
  readonly value: string | null;
  readonly onChange: (country: string | null) => void;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly hint?: string;
}) {
  const id = useId();

  const countries = useMemo(() => {
    const locale = typeof navigator === 'undefined' ? undefined : navigator.language;
    return GREETABLE_COUNTRIES.map((code) => ({ code, name: countryName(code, locale) })).sort(
      (a, b) => a.name.localeCompare(b.name),
    );
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-secondary">
        {label}
      </label>

      <select
        id={id}
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value === '' ? null : event.target.value);
        }}
        className="min-h-tap w-full rounded-control border border-subtle bg-elevated px-3 text-base text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
      >
        {/* Skippable, and shown as skippable. Nobody should be stuck on an
            optional question that only changes a greeting. */}
        <option value="">Rather not say</option>
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>

      {hint !== undefined && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}
