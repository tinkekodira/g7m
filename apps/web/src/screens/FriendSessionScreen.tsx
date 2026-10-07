import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { describeWorkoutDay } from '@g7m/core';
import { useAuthStore } from '../auth/auth-store.js';
import { FriendsOffline } from '../components/FriendParts.js';
import { HeaderLink } from '../components/HeaderLink.js';
import { PlayIcon } from '../components/icons.js';
import { SessionBody, type SessionBlock } from '../components/SessionBody.js';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import { useOnline } from '../lib/use-online.js';
import {
  decodeSession,
  fetchFriendSessionReply,
  FriendsError,
  type FriendSession,
} from '../lib/friends/api.js';
import {
  forgetFriendSession,
  recallFriendSession,
  rememberFriendSession,
} from '../lib/friends/cache.js';
import { startFriendWorkout } from '../lib/friends/start-friend-workout.js';
import { useMySide } from '../lib/friends/use-friends-data.js';
import { friendName, summaryDuration, summaryTitle } from './friends-view.js';

type Loaded =
  | { readonly step: 'loading' }
  | { readonly step: 'shown'; readonly session: FriendSession; readonly fromDevice: boolean }
  | { readonly step: 'gone' }
  | { readonly step: 'offline' }
  | { readonly step: 'failed'; readonly message: string };

/**
 * One of a friend's workouts, every exercise and every set — and the button
 * that starts it as yours.
 *
 * Read from the server when there is a connection, and kept on the phone once
 * read (`lib/friends/cache.ts`), so a workout looked at on the way to the gym
 * still starts in a basement with no signal. That is the only thing about
 * friends that works offline (ADR-0105).
 */
export function FriendSessionScreen() {
  const { friendId = '', sessionId = '' } = useParams();
  const location = useLocation();
  const online = useOnline();
  const owner = useAuthStore((s) => s.session?.user.id ?? '');
  const passed = (location.state as { name?: unknown } | null)?.name;
  const passedName = typeof passed === 'string' ? passed : null;
  // Only labels what is stored; not a reason to fetch again.
  const passedNameRef = useRef(passedName);
  passedNameRef.current = passedName;
  const [loaded, setLoaded] = useState<Loaded>({ step: 'loading' });
  const [cachedName, setCachedName] = useState<string | null>(null);
  const name = passedName ?? cachedName ?? friendName(null);

  useEffect(() => {
    let cancelled = false;
    const fromDevice = (): Loaded => {
      const kept = recallFriendSession(owner, friendId, sessionId);
      if (kept === null) return { step: 'offline' };
      setCachedName(kept.friendName);
      try {
        return { step: 'shown', session: decodeSession(kept.reply), fromDevice: true };
      } catch {
        return { step: 'offline' };
      }
    };

    if (!online) {
      setLoaded(fromDevice());
      return;
    }
    fetchFriendSessionReply(friendId, sessionId).then(
      (reply) => {
        if (cancelled) return;
        if (reply === null) {
          // No longer theirs to show: forget the copy too.
          forgetFriendSession(owner, friendId, sessionId);
          setLoaded({ step: 'gone' });
          return;
        }
        rememberFriendSession(owner, {
          friendId,
          sessionId,
          friendName: passedNameRef.current,
          reply,
        });
        setLoaded({ step: 'shown', session: decodeSession(reply), fromDevice: false });
      },
      (cause: unknown) => {
        if (cancelled) return;
        // The connection said yes and the request said no: a copy kept on the
        // phone is still better than an error.
        const kept = fromDevice();
        setLoaded(
          kept.step === 'shown'
            ? kept
            : {
                step: 'failed',
                message: cause instanceof FriendsError ? cause.message : 'Could not load it.',
              },
        );
      },
    );
    return () => {
      cancelled = true;
    };
  }, [online, owner, friendId, sessionId]);

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-center justify-between gap-3 pt-6">
        <HeaderLink to={`/friends/${friendId}`}>{name}</HeaderLink>
      </header>

      {loaded.step === 'loading' ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : loaded.step === 'offline' ? (
        <FriendsOffline />
      ) : loaded.step === 'gone' ? (
        <p className="rounded-card border border-subtle bg-surface p-5 text-sm text-secondary">
          This workout isn’t shared with you any more.
        </p>
      ) : loaded.step === 'failed' ? (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-danger">
          {loaded.message}
        </p>
      ) : (
        <FriendWorkout
          session={loaded.session}
          fromDevice={loaded.fromDevice}
          owner={owner}
          friend={name}
        />
      )}
    </main>
  );
}

function FriendWorkout({
  session,
  fromDevice,
  owner,
  friend,
}: {
  readonly session: FriendSession;
  readonly fromDevice: boolean;
  readonly owner: string;
  readonly friend: string;
}) {
  const navigate = useNavigate();
  const mine = useMySide();
  const { write, busy, error } = useWrite();
  const open = useCatalogue('friend-session-open-workout', (r) => r.sessions.active());
  const hasOpenWorkout = open.data !== null;

  const ids = session.exercises.map((exercise) => exercise.exerciseId).join(',');
  const catalogue = useCatalogue(`friend-session-exercises:${ids}`, async (r) => {
    const found = await Promise.all(
      session.exercises.map((exercise) => r.exercises.byId(exercise.exerciseId)),
    );
    return new Map(
      found.flatMap((exercise) =>
        exercise === null
          ? []
          : [
              [
                exercise.id,
                { name: exercise.name, slug: exercise.slug, cardioKind: exercise.cardioKind },
              ] as const,
            ],
      ),
    );
  });

  const blocks: SessionBlock[] = useMemo(
    () =>
      session.exercises.map((exercise, index) => ({
        entry: { id: String(index), exerciseId: exercise.exerciseId },
        exercise: catalogue.data?.get(exercise.exerciseId) ?? null,
        sets: exercise.sets.map((set, number) => ({
          ...set,
          id: `${String(index)}-${String(number)}`,
        })),
      })),
    [session, catalogue.data],
  );

  if (mine.data === null || catalogue.data === null) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  const title = summaryTitle(session, mine.data.movers);
  const duration = summaryDuration(session);
  const bodyweightKg = mine.data.bodyweightKg;

  const start = async () => {
    const started = await write((r) =>
      startFriendWorkout(r, { owner, friendName: friend, session, title, bodyweightKg }),
    );
    if (started !== null) void navigate('/workout');
  };

  return (
    <>
      <section>
        <p className="text-sm text-secondary">{friend}’s workout</p>
        <h1 className="text-2xl font-bold text-primary">{title}</h1>
        <p className="numeric mt-1 text-sm text-secondary">
          {describeWorkoutDay(session.startedAt, new Date())}
          {duration !== null && ` · ${duration}`}
        </p>
        {fromDevice && (
          <p className="mt-2 text-xs text-muted">
            Saved on this phone from when you last opened it.
          </p>
        )}
      </section>

      <section className="rounded-card border border-accent/30 bg-surface p-4">
        <button
          type="button"
          disabled={busy || hasOpenWorkout || open.loading}
          onClick={() => {
            void start();
          }}
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-lg font-medium text-on-accent shadow-floating select-none hover:bg-accent-hover active:bg-accent-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:bg-strong disabled:text-muted disabled:shadow-none"
        >
          <PlayIcon className="size-5" />
          {busy ? 'Setting it up…' : 'Do this workout'}
        </button>
        {hasOpenWorkout ? (
          <p className="mt-3 text-sm text-muted">
            Finish the workout you have open before starting this one.{' '}
            <Link
              to="/workout"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              Open it
            </Link>
          </p>
        ) : (
          <p className="mt-3 text-sm text-secondary">
            Their exercises and sets, with your own weights from last time. Their numbers are shown
            beside each exercise as a guide.
          </p>
        )}
        {error !== null && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}
      </section>

      <SessionBody
        startedAt={session.startedAt}
        bodyweightKg={null}
        unitSystem={mine.data.unitSystem}
        blocks={blocks}
        linkTo={(_, exercise) => `/exercises/${exercise.slug}`}
        explainUnmeasured={false}
      />
    </>
  );
}
