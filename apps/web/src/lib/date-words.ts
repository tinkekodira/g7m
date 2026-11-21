/**
 * Day and month names, in the app's language.
 *
 * From the app's own words (`t().common.dates`) rather than `Intl` with the
 * device's locale: a phone set to Croatian would otherwise put "rujan" in the
 * middle of an English sentence, and British English `Intl` writes "Sept".
 * Indexed the way `Date` counts — Sunday is 0, January is 0. ADR-0181.
 */
import { t } from '@g7m/i18n';

export function weekdaysShort(): readonly string[] {
  return t().common.dates.weekdaysShort;
}

export function weekdayShort(date: Date): string {
  return t().common.dates.weekdaysShort[date.getDay()] ?? '';
}

export function weekdayName(date: Date): string {
  return t().common.dates.weekdays[date.getDay()] ?? '';
}

export function monthShort(date: Date): string {
  return t().common.dates.monthsShort[date.getMonth()] ?? '';
}

export function monthName(date: Date): string {
  return t().common.dates.months[date.getMonth()] ?? '';
}

/** "3 Mar", "3. März". */
export function dayMonth(date: Date): string {
  return t().common.dates.dayMonth(date.getDate(), monthShort(date));
}
