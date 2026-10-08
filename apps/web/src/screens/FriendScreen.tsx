import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { describePresence, describeStreak, weekDots, weeklyStreak } from '@g7m/core';
import { cx } from '@g7m/ui';
import { Avatar } from '../components/Avatar.js';
import { ChallengeList, SendChallenge } from '../components/Challenges.js';
import { FriendsOffline, PresenceLine, Streak, WeekDots } from '../components/FriendParts.js';
import { HeaderLink } from '../components/HeaderLink.js';
import { ChevronRightIcon, MoreIcon } from '../components/icons.js';
import { useOnline } from '../lib/use-online.js';
import {
  fetchChallenges,
  fetchFriend,
  removeFriend,
  FriendsError,
  type FriendDetail,
} from '../lib/friends/api.js';
import {
  useChallengeCards,
  useMySide,
  useRemote,
  type MySide,
} from '../lib/friends/use-friends-data.js';
import type { ChallengeCardView } from './challenges-view.js';
import { headToHead, recentRows } from './friend-detail-view.js';
import { friendName } from './friends-view.js';

/**
 * One friend: their week, a challenge with them (ADR-0110), how your lifts
 * compare, and their recent workouts.
 *
 * Read from the server each time it is opened, like the list it came from. A
 * friend who stopped sharing — or is no longer a friend — gets nothing back
 * from the server, and the page says so rather than guessing which.
 */
export function FriendScreen() {
  const { friendId = '' } = useParams();
  const location = useLocation();
  const online = useOnline();
  const mine = useMySide();
  const detail = useRemote(`friend:${friendId}`, online, () => fetchFriend(friendId));
  const challenges = useRemote('friend-challenges', online, fetchChallenges);
  const cards = useChallengeCards(challenges.data, mine.data?.unitSystem ?? 'metric');
  const passedName = (location.state as { name?: unknown } | null)?.name;
  const name =
    detail.data?.name ?? (typeof passedName === 'string' ? passedName : friendName(null));

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-center justify-between gap-3 pt-6">
        <HeaderLink to="/friends">Friends</HeaderLink>
        <FriendMenu friendId={friendId} name={name} disabled={!online} />
      </header>

      {!online ? (
        <FriendsOffline />
      ) : detail.error !== null && detail.data === null ? (
        <p role="alert" className="rounded-card bg-surface p-4 text-sm text-danger">
          {detail.error}
        </p>
      ) : detail.loading || mine.data === null ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : detail.data === null ? (
        <section className="rounded-card border border-subtle bg-surface p-5">
          <h1 className="text-xl font-semibold text-primary">{name}</h1>
          <p className="mt-1 text-sm text-secondary">
            Not sharing their training right now, or no longer on your friends list.
          </p>
        </section>
      ) : (
        <FriendPage
          detail={detail.data}
          mine={mine.data}
          challenges={
            cards === null
              ? null
              : [...cards.incoming, ...cards.others].filter((card) => card.friendId === friendId)
          }
          onChallengesChanged={challenges.reload}
        />
      )}
    </main>
  );
}

function FriendPage({
  detail,
  mine,
  challenges,
  onChallengesChanged,
}: {
  readonly detail: FriendDetail;
  readonly mine: MySide;
  /** Your challenges with this friend; null while they load. */
  readonly challenges: readonly ChallengeCardView[] | null;
  readonly onChallengesChanged: () => void;
}) {
  const name = friendName(detail.name);
  const now = useMemo(() => new Date(), []);
  const [chosen, setChosen] = useState<string | null>(null);

  const dots = weekDots(detail.training.trainedAt, now, mine.weekStartsOn);
  const streak = describeStreak(
    weeklyStreak(detail.training.trainedAt, detail.training.daysPerWeek, now, mine.weekStartsOn),
  );
  const versus = headToHead({
    mine: mine.bests,
    theirs: detail.bests,
    names: mine.names,
    preferredId: mine.benchId,
    chosenId: chosen,
    unitSystem: mine.unitSystem,
    friend: name,
  });
  const recent = recentRows(detail.recent, now, mine.movers);

  return (
    <>
      <section className="rounded-card border border-subtle bg-surface p-5">
        <div className="flex items-center gap-4">
          <Avatar name={detail.name} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-primary">{name}</h1>
            <PresenceLine presence={describePresence(detail.training.lastActiveAt, now)} />
          </div>
        </div>
        <div className="mt-5">
          <WeekDots dots={dots} />
        </div>
        <div className="mt-3 min-h-5">
          <Streak streak={streak} />
        </div>
      </section>

      {challenges !== null && (
        <>
          {challenges.length > 0 && (
            <ChallengeList cards={challenges} onChanged={onChallengesChanged} />
          )}
          {/* One at a time: a new one once the last is over. */}
          {challenges.every((card) => card.phase === 'finished') && (
            <SendChallenge friendId={detail.userId} name={name} onSent={onChallengesChanged} />
          )}
        </>
      )}

      <section
        aria-labelledby="head-to-head"
        className="rounded-card border border-subtle bg-surface p-5"
      >
        <h2 id="head-to-head" className="text-lg font-semibold text-primary">
          Head-to-head
        </h2>
        {versus.comparison === null ? (
          <p className="mt-1 text-sm text-secondary">
            Nothing to compare yet. Once you’ve both logged the same lift, it shows up here.
          </p>
        ) : (
          <>
            <label className="mt-3 block">
              <span className="text-sm text-secondary">Exercise</span>
              <select
                value={versus.selectedId ?? ''}
                onChange={(event) => {
                  setChosen(event.target.value);
                }}
                className="mt-1 block min-h-tap w-full rounded-control border border-subtle bg-elevated px-3 text-base text-primary focus-visible:outline-2 focus-visible:outline-accent"
              >
                {versus.options.map((option) => (
                  <option key={option.exerciseId} value={option.exerciseId}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <dl className="mt-4 flex flex-col gap-3">
              <Bar
                label="You"
                value={versus.comparison.mine}
                share={versus.comparison.mineShare}
                highlight={versus.comparison.standing === 'ahead'}
              />
              <Bar
                label={name}
                value={versus.comparison.theirs}
                share={versus.comparison.theirsShare}
                highlight={versus.comparison.standing === 'behind'}
              />
            </dl>
            <p className="mt-3 text-base font-medium text-primary">{versus.comparison.verdict}</p>
          </>
        )}
      </section>

      <section aria-labelledby="recent">
        <h2 id="recent" className="mb-3 text-lg font-semibold text-primary">
          Recent workouts
        </h2>
        {recent.length === 0 ? (
          <p className="rounded-card border border-subtle bg-surface p-4 text-sm text-secondary">
            No finished workouts yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((row) => (
              <li key={row.sessionId}>
                <Link
                  to={`/friends/${detail.userId}/session/${row.sessionId}`}
                  state={{ name }}
                  className="flex min-h-tap items-center gap-3 rounded-card border border-subtle bg-surface p-4 active:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium text-primary">
                      {row.title}
                    </span>
                    <span className="numeric block text-sm text-secondary">
                      {row.when}
                      {row.duration !== null && ` · ${row.duration}`} · {row.exercises}
                    </span>
                  </span>
                  <ChevronRightIcon className="size-5 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/** One side of the head-to-head: a name, a bar to scale, and the number. */
function Bar({
  label,
  value,
  share,
  highlight,
}: {
  readonly label: string;
  readonly value: string;
  readonly share: number;
  readonly highlight: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="truncate text-sm text-secondary">{label}</dt>
        <dd className="numeric text-base font-semibold text-primary">{value}</dd>
      </div>
      <div aria-hidden className="mt-1 h-2.5 overflow-hidden rounded-full bg-elevated">
        <div
          className={cx('h-full rounded-full', highlight ? 'bg-accent' : 'bg-strong')}
          style={{ width: `${String(Math.round(Math.max(0.04, share) * 100))}%` }}
        />
      </div>
    </div>
  );
}

/**
 * The ⋯ menu, holding one thing: removing the friend. Behind a menu and a
 * confirmation, because it is the one action on this page that cannot be
 * taken back — they would have to accept you again.
 */
function FriendMenu({
  friendId,
  name,
  disabled,
}: {
  readonly friendId: string;
  readonly name: string;
  readonly disabled: boolean;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const remove = () => {
    setOpen(false);
    if (!globalThis.confirm(`Remove ${name} from your friends? They won’t be told.`)) return;
    setBusy(true);
    removeFriend(friendId).then(
      () => {
        void navigate('/friends', { replace: true });
      },
      (cause: unknown) => {
        setBusy(false);
        setFailure(cause instanceof FriendsError ? cause.message : 'That did not go through.');
      },
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled || busy}
        onClick={() => {
          setOpen((value) => !value);
        }}
        className="flex size-tap items-center justify-center rounded-control text-secondary active:bg-elevated focus-visible:outline-2 focus-visible:outline-accent disabled:text-muted/50"
      >
        <MoreIcon className="size-6" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-1 min-w-48 rounded-card border border-subtle bg-surface p-1 shadow-floating"
        >
          <button
            type="button"
            role="menuitem"
            onClick={remove}
            className="flex min-h-tap w-full items-center rounded-control px-3 text-left text-base text-destructive active:bg-elevated focus-visible:outline-2 focus-visible:outline-accent"
          >
            Remove friend
          </button>
        </div>
      )}
      {failure !== null && (
        <p role="alert" className="absolute top-full right-0 mt-1 w-56 text-sm text-danger">
          {failure}
        </p>
      )}
    </div>
  );
}
