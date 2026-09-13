/**
 * What to say when a screen throws.
 *
 * React unmounts the whole tree on an uncaught render error, so until there was
 * a boundary a bug anywhere left a blank page: no words, no way back, and on a
 * Home Screen app no address bar to reload from either. The boundary is in
 * `components/ErrorBoundary.tsx`; this is the part of it that can be tested
 * without a browser — which failures are which, and the report somebody can
 * copy into a message.
 *
 * ## Two kinds, and they want opposite advice
 *
 * **A stale build.** The app loads its heavier screens on demand, and those
 * files are named by their content. Deploy a new version while the old one is
 * open and the old one asks for files that no longer exist — the import fails,
 * and the screen that wanted it throws. Nothing is wrong except the version,
 * and reloading is the whole fix. Every engine words this differently, so the
 * match is on each engine's words.
 *
 * **Everything else** is a bug in the app. Reloading may or may not help;
 * saying what happened, and that the training is safe, always does.
 */

export type CrashKind = 'stale-build' | 'bug';

/**
 * How each engine says a lazily loaded file could not be fetched.
 *
 * Lower-cased, matched as substrings. The last is Vite's own, raised when the
 * CSS a chunk depends on is gone.
 */
const STALE_BUILD_WORDS = [
  // Chromium: WebView2 on Windows, Android's WebView, desktop Chrome.
  'failed to fetch dynamically imported module',
  // Firefox.
  'error loading dynamically imported module',
  // WebKit — Safari, and so every iPhone this app runs on.
  'importing a module script failed',
  'unable to preload css',
] as const;

/** Whatever was thrown, as a message. Things other than Errors get thrown too. */
export function crashMessage(error: unknown): string {
  if (error instanceof Error) return error.message === '' ? error.name : error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error) ?? String(error);
  } catch {
    return String(error);
  }
}

export function crashKind(error: unknown): CrashKind {
  const message = crashMessage(error).toLowerCase();
  if (error instanceof Error && error.name === 'ChunkLoadError') return 'stale-build';
  return STALE_BUILD_WORDS.some((words) => message.includes(words)) ? 'stale-build' : 'bug';
}

export interface CrashCopy {
  readonly title: string;
  readonly detail: string;
}

/**
 * The words on the crash screen.
 *
 * `inWorkout` changes the reassurance, not the facts: a set is written to the
 * device the moment it is ticked, so an open workout survives this, and the
 * person whose logger just broke mid-session needs to hear exactly that.
 */
export function crashCopy(kind: CrashKind, inWorkout: boolean): CrashCopy {
  if (kind === 'stale-build') {
    return {
      title: 'g7m has been updated',
      detail:
        'A new version arrived while this screen was open, and part of it is no longer where ' +
        'the old one expects. Reload to finish updating. Nothing you logged is lost.',
    };
  }
  return {
    title: 'Something went wrong on this screen',
    detail: inWorkout
      ? 'Your workout is safe. Every set is saved on this device the moment you tick it, so ' +
        'you can reopen the workout from Home and carry on where you were.'
      : 'Everything you have logged is saved on this device, so nothing is lost. Try again, or ' +
        'go back to Home.',
  };
}

export interface CrashContext {
  readonly at: Date;
  /** The address the crash happened at, hash route included. */
  readonly url: string;
  readonly userAgent: string;
}

/**
 * The text "Copy details" puts on the clipboard.
 *
 * Plain text, because it is going into an email or a chat, and in the order
 * someone reading it wants: what broke, where, when, on what — then the stack
 * for whoever fixes it. No account details: nothing in it identifies anyone,
 * which is what makes it safe to paste anywhere.
 */
export function crashReport(error: unknown, context: CrashContext): string {
  const lines = [
    `g7m crash report`,
    `What: ${crashMessage(error)}`,
    `Where: ${routeOf(context.url)}`,
    `When: ${context.at.toISOString()}`,
    `Device: ${context.userAgent}`,
  ];
  const stack = error instanceof Error ? error.stack : undefined;
  if (stack !== undefined && stack !== '') lines.push('', stack);
  return lines.join('\n');
}

/**
 * The route, not the whole address.
 *
 * The screen is what matters, and the full URL can carry what the auth
 * callback left in it; the hash route is the screen and nothing else.
 */
function routeOf(url: string): string {
  const hash = url.indexOf('#');
  if (hash === -1) return '/';
  const route = url.slice(hash + 1);
  return route === '' ? '/' : route;
}
