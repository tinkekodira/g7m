/**
 * Day and month names, in English.
 *
 * English like the rest of the app outside the greeting (see greeting.ts), and
 * spelled out here rather than asked of `Intl` with the device's locale: a
 * phone set to Croatian would otherwise put "rujan" in the middle of an English
 * sentence. Indexed the way `Date` counts — Sunday is 0, January is 0.
 */

export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function weekdayShort(date: Date): string {
  return WEEKDAYS_SHORT[date.getDay()] ?? '';
}

export function weekdayName(date: Date): string {
  return WEEKDAYS[date.getDay()] ?? '';
}

export function monthShort(date: Date): string {
  return MONTHS_SHORT[date.getMonth()] ?? '';
}

export function monthName(date: Date): string {
  return MONTHS[date.getMonth()] ?? '';
}
