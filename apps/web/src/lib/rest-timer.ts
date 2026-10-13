/**
 * The rest that is running, kept on this phone so leaving the workout screen
 * does not end it.
 *
 * The timer used to live in the workout screen's state, so anything that
 * unmounted the screen threw it away: opening the library to add an exercise,
 * a look at Settings, the app being closed mid-rest. You came back to no timer
 * and had to guess how long you had been resting.
 *
 * Nothing about it needs counting while the screen is away. A rest is a start
 * time and a length (`restRemaining`), so writing those two down is enough to
 * bring it back exactly where it would have been. It is kept per workout, so a
 * rest from a finished workout never appears on the next one, and it lives
 * here rather than synced for the reason the snooze does (`workout-notice.ts`):
 * it is about this phone's last few minutes.
 */
export const REST_TIMER_STORAGE_KEY = 'g7m.restTimer';

/**
 * How long a finished rest is still worth bringing back. Long enough to come
 * back from the library to "Rest over"; short enough that opening the app
 * hours later does not greet you with a rest from the morning.
 */
export const REST_KEPT_AFTER_SECONDS = 5 * 60;

export interface RunningRest {
  /** The workout it belongs to. */
  readonly sessionId: string;
  readonly startedAt: Date;
  readonly seconds: number;
}

/** The subset of `Storage` this needs, so the tests can hand it a map. */
export type RestTimerStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

interface StoredShape {
  readonly sessionId?: unknown;
  readonly startedAt?: unknown;
  readonly seconds?: unknown;
}

/**
 * The rest that was running, or null.
 *
 * Null for anything malformed, and for a rest that ended more than
 * `REST_KEPT_AFTER_SECONDS` before `now`. Which workout it belongs to is the
 * caller's to check (`restOfSession`): the workout is read after this is.
 */
export function readRunningRest(
  now: Date,
  storage: RestTimerStorage | undefined = globalThis.localStorage,
): RunningRest | null {
  try {
    const raw = storage?.getItem(REST_TIMER_STORAGE_KEY);
    if (raw === null || raw === undefined) return null;
    const parsed = JSON.parse(raw) as StoredShape;
    if (typeof parsed.sessionId !== 'string' || parsed.sessionId === '') return null;
    if (typeof parsed.seconds !== 'number' || !Number.isFinite(parsed.seconds)) return null;
    if (typeof parsed.startedAt !== 'string') return null;
    const startedAt = new Date(parsed.startedAt);
    if (Number.isNaN(startedAt.getTime())) return null;
    const endsAt = startedAt.getTime() + parsed.seconds * 1000;
    if (now.getTime() - endsAt > REST_KEPT_AFTER_SECONDS * 1000) return null;
    return { sessionId: parsed.sessionId, startedAt, seconds: Math.max(0, parsed.seconds) };
  } catch {
    // Unparseable, or storage switched off: no rest to bring back.
    return null;
  }
}

/** Remember the running rest, or forget it with null. Failing to is not worth an error. */
export function writeRunningRest(
  rest: RunningRest | null,
  storage: RestTimerStorage | undefined = globalThis.localStorage,
): void {
  try {
    if (rest === null) {
      storage?.removeItem(REST_TIMER_STORAGE_KEY);
      return;
    }
    storage?.setItem(
      REST_TIMER_STORAGE_KEY,
      JSON.stringify({
        sessionId: rest.sessionId,
        startedAt: rest.startedAt.toISOString(),
        seconds: rest.seconds,
      }),
    );
  } catch {
    // Storage full or switched off. The timer lasts as long as the screen does.
  }
}

/** The rest to show on this workout: the running one, only if it is this workout's. */
export function restOfSession(
  rest: RunningRest | null,
  sessionId: string | null,
): RunningRest | null {
  return rest !== null && rest.sessionId === sessionId ? rest : null;
}
