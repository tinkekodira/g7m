/**
 * Your XP, sent where friends can see it. ADR-0132.
 *
 * Worked out on this phone from the training log, like the achievements it is
 * partly made of, so a friend's phone cannot work it out; this sends the
 * total each time it changes, the way `usePublishAchievements` sends badges.
 * Friends turn it into a level with the curve in their own copy of the app.
 *
 * The last total sent is kept per account on the phone, so an app reopened
 * with nothing new sends nothing. Offline it waits, and goes when the
 * connection comes back.
 */
import { useEffect } from 'react';
import { useAuthStore } from '../../auth/auth-store.js';
import { useOnline } from '../use-online.js';
import { publishXp } from './api.js';

const STORAGE_PREFIX = 'g7m:published-xp:';

function recall(owner: string): string | null {
  try {
    return globalThis.localStorage.getItem(STORAGE_PREFIX + owner);
  } catch {
    return null;
  }
}

function remember(owner: string, total: number): void {
  try {
    globalThis.localStorage.setItem(STORAGE_PREFIX + owner, String(total));
  } catch {
    // Without storage it is sent again next launch, which costs one request.
  }
}

/** In flight, per account, so two reads close together send once. */
const sending = new Set<string>();

/**
 * `total` is null until the training log and profile have arrived on this
 * phone: publishing a half-synced log would tell friends you had lost levels.
 */
export function usePublishXp(total: number | null): void {
  const owner = useAuthStore((state) => state.session?.user.id ?? null);
  const online = useOnline();

  useEffect(() => {
    if (owner === null || total === null || !online) return;
    const key = `${owner}:${String(total)}`;
    if (recall(owner) === String(total) || sending.has(key)) return;
    sending.add(key);
    publishXp(total).then(
      () => {
        sending.delete(key);
        remember(owner, total);
      },
      (cause: unknown) => {
        // A friend sees the older level until the next change or launch.
        sending.delete(key);
        console.warn('Could not share your level with friends.', cause);
      },
    );
  }, [owner, total, online]);
}
