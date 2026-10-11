/**
 * Your earned badges, sent where friends can see them. ADR-0117.
 *
 * Achievements are worked out on this phone from the training log and stored
 * nowhere (ADR-0072), so a friend's phone cannot work out yours. This sends
 * the result — each earned badge and its date, the birthday one aside — each
 * time it changes. A friend sees them as of the last time you opened the
 * app, which is the last time you could have earned one.
 *
 * Once per change rather than once per read: the list is read again after
 * every write, a set ticked mid-workout included. What was last sent is kept
 * per account on the phone, so an app reopened with nothing new sends
 * nothing. Offline it waits, and goes when the connection comes back.
 */
import { useEffect } from 'react';
import { achievementsToPublish, type Achievement } from '@g7m/core';
import { useAuthStore } from '../../auth/auth-store.js';
import { useOnline } from '../use-online.js';
import { publishAchievements } from './api.js';

const STORAGE_PREFIX = 'g7m:published-achievements:';

/** What a list publishes as, as one string to compare. */
export function publishedSignature(list: readonly Achievement[]): string {
  return achievementsToPublish(list)
    .map((each) => `${each.key}@${each.earnedAt.toISOString()}`)
    .join(',');
}

function recall(owner: string): string | null {
  try {
    return globalThis.localStorage.getItem(STORAGE_PREFIX + owner);
  } catch {
    return null;
  }
}

function remember(owner: string, signature: string): void {
  try {
    globalThis.localStorage.setItem(STORAGE_PREFIX + owner, signature);
  } catch {
    // Without storage it is sent again next launch, which costs one request.
  }
}

/** In flight, per account, so two reads close together send once. */
const sending = new Set<string>();

/**
 * `list` is null until the training log and profile have arrived on this
 * phone: publishing a half-synced log would tell friends you had lost badges.
 */
export function usePublishAchievements(list: readonly Achievement[] | null): void {
  const owner = useAuthStore((state) => state.session?.user.id ?? null);
  const online = useOnline();

  useEffect(() => {
    if (owner === null || list === null || !online) return;
    const signature = publishedSignature(list);
    const key = `${owner}:${signature}`;
    if (recall(owner) === signature || sending.has(key)) return;
    sending.add(key);
    publishAchievements(achievementsToPublish(list)).then(
      () => {
        sending.delete(key);
        remember(owner, signature);
      },
      (cause: unknown) => {
        // A friend sees older badges until the next change or launch.
        sending.delete(key);
        console.warn('Could not share achievements with friends.', cause);
      },
    );
  }, [owner, list, online]);
}
