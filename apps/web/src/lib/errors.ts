/**
 * Turning backend errors into something a person can act on.
 *
 * PostgREST and GoTrue return accurate, terse strings written for whoever
 * debugs the server. "JWT issued at future" is exactly right and tells a lifter
 * standing in a gym precisely nothing — least of all that the fix is in their
 * phone's date settings.
 */

/** Whether the message describes a clock-skew rejection. */
export function isClockSkewError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('issued at future') ||
    m.includes('used before issued') ||
    m.includes('token used too early')
  );
}

/** Whether retrying in a moment could plausibly succeed. */
export function isTransient(message: string): boolean {
  const m = message.toLowerCase();
  return (
    isClockSkewError(message) ||
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('timeout') ||
    m.includes('503') ||
    m.includes('502')
  );
}

export function describeDataError(message: string): string {
  const m = message.toLowerCase();

  if (isClockSkewError(message)) {
    return (
      'This device’s clock is ahead of the server, so the sign-in token looks ' +
      'like it came from the future. Turn on Settings → General → Date & Time ' +
      '→ Set Automatically, then reopen the app.'
    );
  }

  if (m.includes('jwt expired') || m.includes('pgrst301')) {
    return 'Your session expired. Sign out and back in.';
  }

  if (m.includes('failed to fetch') || m.includes('networkerror')) {
    return 'Cannot reach the server. Your workouts are saved on this device and will sync when you are back online.';
  }

  if (m.includes('permission denied') || m.includes('row-level security')) {
    return 'You do not have access to that. If you just signed in, try reopening the app.';
  }

  if (m.includes('pgrst116') || m.includes('0 rows')) {
    return 'That record no longer exists.';
  }

  return message;
}

/**
 * Retry a request once after a short pause, but only for failures where that
 * could help.
 *
 * Clock skew is usually a second or two, in which case waiting is genuinely the
 * fix. When it is minutes, nothing here helps and the message above explains
 * what will. Retrying a permission error, by contrast, just makes the user wait
 * twice for the same answer.
 */
export async function retryOnceIfTransient<R extends { error: { message: string } | null }>(
  // PromiseLike, not Promise: Supabase's query builder is a thenable and has
  // no .catch or .finally, so it does not satisfy Promise.
  run: () => PromiseLike<R>,
  delayMs = 2500,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<R> {
  // Generic over the whole response, not just `data`: Supabase's result type is
  // a discriminated union, and destructuring it into a `{ error, data }` shape
  // collapses the row type to `{}` at the call site.
  const first = await run();
  if (first.error === null || !isTransient(first.error.message)) return first;
  await sleep(delayMs);
  return run();
}
