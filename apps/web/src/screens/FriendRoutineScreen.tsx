import { Link, useNavigate, useParams } from 'react-router';
import { workoutUnits } from '@g7m/core';
import { Avatar } from '../components/Avatar.js';
import { FriendsOffline } from '../components/FriendParts.js';
import { HeaderLink } from '../components/HeaderLink.js';
import { PlayIcon } from '../components/icons.js';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import { startFriendRoutineWorkout } from '../lib/db/use-routines.js';
import { heatSince } from '../lib/db/use-trained-body.js';
import { fetchFriendProfile, type FriendRoutine } from '../lib/friends/api.js';
import { useMySide, useRemote, type MySide } from '../lib/friends/use-friends-data.js';
import { useOnline } from '../lib/use-online.js';
import { targetText } from './friend-detail-view.js';
import { friendName } from './friends-view.js';

/**
 * One of a friend's routines, opened from their page, with the button that
 * starts it as your workout. ADR-0117.
 *
 * Their movements, sets and rep ranges; your weights, from what you last
 * lifted — the same as one of your own routines, and the same rule as "Do
 * this workout": a friend's numbers are theirs.
 */
export function FriendRoutineScreen() {
  const { friendId = '', routineId = '' } = useParams();
  const online = useOnline();
  const mine = useMySide();
  const profile = useRemote(`friend-profile:${friendId}`, online, () =>
    fetchFriendProfile(friendId, heatSince(new Date())),
  );
  const known = profile.data?.name ?? null;
  const name = friendName(known);
  const routine = profile.data?.routines.find((each) => each.id === routineId) ?? null;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-center justify-between gap-3 pt-6">
        <HeaderLink to={`/friends/${friendId}`}>{name}</HeaderLink>
      </header>

      {!online ? (
        <FriendsOffline />
      ) : profile.error !== null && profile.data === null ? (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-destructive">
          {profile.error}
        </p>
      ) : profile.loading || mine.data === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : routine === null ? (
        <p className="rounded-card border border-subtle bg-surface p-5 text-sm text-secondary">
          This routine isn’t shared with you any more.
        </p>
      ) : (
        <Routine
          friendId={friendId}
          name={name}
          avatarName={known}
          routine={routine}
          mine={mine.data}
        />
      )}
    </main>
  );
}

function Routine({
  friendId,
  name,
  avatarName,
  routine,
  mine,
}: {
  readonly friendId: string;
  readonly name: string;
  readonly avatarName: string | null;
  readonly routine: FriendRoutine;
  readonly mine: MySide;
}) {
  const navigate = useNavigate();
  const { write, busy, error } = useWrite();
  const open = useCatalogue('friend-routine-open-workout', (r) => r.sessions.active());
  const hasOpenWorkout = open.data !== null;
  const units = workoutUnits(routine.exercises, (movement) => movement.supersetId);
  const count = routine.exercises.length;

  const start = async () => {
    const started = await write((r) =>
      startFriendRoutineWorkout(r, {
        name: routine.name,
        movements: routine.exercises,
        bodyweightKg: mine.bodyweightKg,
      }),
    );
    if (started !== null) void navigate('/workout');
  };

  return (
    <>
      <section>
        <Link
          to={`/friends/${friendId}`}
          aria-label={`${name}’s routine, open ${name}’s profile`}
          className="-mx-1 mb-3 flex min-h-tap w-fit max-w-full items-center gap-3 rounded-card px-1 py-1 active:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Avatar name={avatarName} tint />
          <span className="min-w-0 truncate text-base font-medium text-secondary">
            {name}’s routine
          </span>
        </Link>
        <h1 className="text-2xl font-bold text-primary">{routine.name}</h1>
        <p className="numeric mt-1 text-sm text-secondary">
          {count === 1 ? '1 exercise' : `${String(count)} exercises`}
        </p>
      </section>

      {count > 0 && (
        <section className="rounded-card border border-subtle bg-surface p-4">
          <button
            type="button"
            disabled={busy || hasOpenWorkout || open.loading}
            onClick={() => {
              void start();
            }}
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-lg font-medium text-on-accent shadow-floating select-none hover:bg-accent-hover active:bg-accent-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:bg-strong disabled:text-muted disabled:shadow-none"
          >
            <PlayIcon className="size-5" />
            {busy ? 'Setting it up…' : 'Do this routine'}
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
              Their exercises, sets and rep ranges, with your own weights from last time.
            </p>
          )}
          {error !== null && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </section>
      )}

      {count === 0 ? (
        <p className="rounded-card border border-subtle bg-surface p-4 text-sm text-secondary">
          Nothing in it yet.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {units.map((unit, index) => {
            const label = String(index + 1);
            if (unit.kind === 'single') {
              return (
                <li key={`${label}-${unit.item.exerciseId}`}>
                  <Movement movement={unit.item} label={label} mine={mine} />
                </li>
              );
            }
            return (
              <li key={unit.supersetId}>
                <section
                  aria-label="Superset"
                  className="flex flex-col gap-2 rounded-card border-l-4 border-subtle pl-2"
                >
                  <p className="pl-2 text-xs font-semibold tracking-wide text-accent uppercase">
                    {label} · Superset
                  </p>
                  {unit.members.map((movement, member) => (
                    <Movement
                      key={`${label}-${movement.exerciseId}`}
                      movement={movement}
                      label={`${label}${String.fromCharCode(97 + member)}`}
                      mine={mine}
                    />
                  ))}
                </section>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

function Movement({
  movement,
  label,
  mine,
}: {
  readonly movement: FriendRoutine['exercises'][number];
  /** "3", or "3a" for the first movement of the third thing, a superset. */
  readonly label: string;
  readonly mine: MySide;
}) {
  const name = mine.names.get(movement.exerciseId) ?? 'Unknown exercise';
  const slug = mine.slugs.get(movement.exerciseId);
  const body = (
    <>
      <span className="numeric w-6 shrink-0 text-center text-sm text-muted">{label}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium text-primary">{name}</span>
        <span className="numeric block text-xs text-muted">{targetText(movement)}</span>
      </span>
    </>
  );
  const className =
    'flex min-h-tap items-center gap-2 rounded-card border border-subtle bg-surface p-3';
  return slug === undefined ? (
    <div className={className}>{body}</div>
  ) : (
    <Link to={`/exercises/${slug}`} className={`${className} active:bg-elevated`}>
      {body}
    </Link>
  );
}
