import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { checkFriendCode } from '@g7m/core';
import { Button, SegmentedControl, TextField, cx } from '@g7m/ui';
import { Avatar } from '../components/Avatar.js';
import { Panel } from '../components/Panel.js';
import { StatValue } from '../components/StatValue.js';
import {
  FriendsOffline,
  NamePrompt,
  PresenceLine,
  Streak,
  WeekDots,
  YourCode,
} from '../components/FriendParts.js';
import { ChallengeList } from '../components/Challenges.js';
import { AddFriendIcon, ChevronRightIcon } from '../components/icons.js';
import { useOnline } from '../lib/use-online.js';
import {
  answerFriendRequest,
  fetchChallenges,
  fetchOverview,
  sendFriendRequest,
  FriendsError,
  type FriendsOverview,
} from '../lib/friends/api.js';
import {
  useChallengeCards,
  useMySide,
  useRemote,
  type MySide,
} from '../lib/friends/use-friends-data.js';
import type { ChallengeCardView } from './challenges-view.js';
import { FriendsLeaderboard } from './FriendsLeaderboard.js';
import { FriendsSkeleton } from '../components/ContentSkeletons.js';
import { useKeyboardInset } from '../lib/use-keyboard-inset.js';
import {
  describeCodeProblem,
  describeSendResult,
  friendCard,
  requestRow,
  sortFriends,
  type CardLift,
  type FriendCardView,
  type Message,
  type RequestView,
} from './friends-view.js';

/**
 * Friends: the people you train with, what they did this week, and how your
 * lifts compare.
 *
 * Everything on it comes from the server as it is opened (ADR-0105), so with
 * no connection it says so and stops — calmly, the way Send feedback does —
 * rather than showing a list that might be days old. A workout you have
 * already opened is the one exception, on its own screen.
 *
 * Three sub-tabs: the friends themselves, the leaderboard (ADR-0106) with
 * your challenges above it (ADR-0110), and the requests and challenges
 * waiting for your answer.
 *
 * In Home's shell (ADR-0127): the sub-tabs are the pill Progress picks its
 * period with, every card has the large corner, and labels are Home's small
 * capitals.
 */
type SubTab = 'friends' | 'leaderboard' | 'requests';

/** How a card that opens something answers a press: in slightly, as Home's do. */
const PRESS = 'transition-transform duration-150 ease-out active:scale-[0.985]';

function subTab(value: string | null): SubTab {
  return value === 'requests' || value === 'leaderboard' ? value : 'friends';
}

export function FriendsScreen() {
  const online = useOnline();
  const mine = useMySide();
  const [params, setParams] = useSearchParams();
  const tab = subTab(params.get('tab'));
  const [adding, setAdding] = useState(false);

  const named = mine.data?.displayName != null;
  const overview = useRemote('friends-overview', online && named, fetchOverview);
  // Asked again on every tab change, as the board is when it opens, so a
  // friend's workout since the last look is counted.
  const challenges = useRemote(`friends-challenges:${tab}`, online && named, fetchChallenges);
  const cards = useChallengeCards(challenges.data, mine.data?.unitSystem ?? 'metric');
  const requests = (overview.data?.requests.length ?? 0) + (cards?.incoming.length ?? 0);
  const code = overview.data?.me?.code ?? null;
  const target = params.get('challenge');
  const reloadChallenges = challenges.reload;
  const arrived = useRef<string | null>(null);
  useEffect(() => {
    if (target === null || cards === null || tab !== 'leaderboard' || arrived.current === target)
      return;
    const node = document.getElementById(`challenge-${target}`);
    if (node) {
      node.scrollIntoView({ block: 'center' });
      node.focus({ preventScroll: true });
      arrived.current = target;
    }
  }, [target, cards, tab]);
  useEffect(() => {
    const reload = () => reloadChallenges();
    globalThis.addEventListener('challenge-results-changed', reload);
    return () => globalThis.removeEventListener('challenge-results-changed', reload);
  }, [reloadChallenges]);

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 pt-safe-top pb-safe-bottom">
      <header className="flex items-center justify-between gap-4 pt-6">
        <h1 className="text-3xl font-bold text-primary">Friends</h1>
        <button
          type="button"
          aria-label="Add a friend"
          disabled={!online || !named || code === null}
          onClick={() => {
            setAdding(true);
          }}
          className="flex size-14 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent-subtle text-accent transition-colors active:bg-accent/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:border-subtle disabled:bg-elevated disabled:text-muted"
        >
          <AddFriendIcon className="size-6" />
        </button>
      </header>

      {!online ? (
        <FriendsOffline />
      ) : mine.error !== null ? (
        <p role="alert" className="text-sm text-danger">
          {mine.error}
        </p>
      ) : mine.loading && mine.data === null ? (
        <FriendsSkeleton tab={tab} />
      ) : mine.data?.hasProfile !== true ? (
        <p role="status" className="text-sm text-secondary">
          Your profile is unavailable. Open your profile and try again.
        </p>
      ) : !named ? (
        <NamePrompt />
      ) : (
        <>
          <SubTabs
            value={tab}
            requests={requests}
            onChange={(next) => {
              setParams(next === 'friends' ? {} : { tab: next }, { replace: true });
            }}
          />

          {overview.error !== null && (
            <p role="alert" className="rounded-card bg-surface p-4 text-sm text-danger">
              {overview.error}
            </p>
          )}

          {overview.data === null ? (
            overview.error === null && <FriendsSkeleton tab={tab} />
          ) : tab === 'friends' ? (
            <FriendList overview={overview.data} mine={mine.data} />
          ) : tab === 'leaderboard' ? (
            <>
              {cards !== null && cards.others.length > 0 && (
                <ChallengesSection cards={cards.others} onChanged={challenges.reload} />
              )}
              {target !== null &&
                cards !== null &&
                !cards.others.some((card) => card.id === target) && (
                  <p role="status" className="text-sm text-secondary">
                    This result has already been dismissed.
                  </p>
                )}
              <FriendsLeaderboard mine={mine.data} code={code}>
                {/* With no challenges yet, where one starts — under the board
                    rather than above it, so the board comes first. */}
                {overview.data.friends.length > 0 &&
                  cards !== null &&
                  cards.others.length === 0 && (
                    <p className="text-xs text-muted">
                      Challenge a friend to a week: open their page and pick a stat.
                    </p>
                  )}
              </FriendsLeaderboard>
            </>
          ) : (
            <RequestList
              overview={overview.data}
              challenges={cards?.incoming ?? []}
              onAnswered={overview.reload}
              onChallengeAnswered={challenges.reload}
            />
          )}
        </>
      )}

      {adding && code !== null && (
        <AddFriendSheet
          code={code}
          onClose={() => {
            setAdding(false);
          }}
          onSent={overview.reload}
        />
      )}
    </main>
  );
}

/**
 * Friends | Leaderboard | Requests. Tabs in the ARIA sense: one is selected.
 *
 * Uses Learn's sliding highlight; still tabs underneath, not radios,
 * because each one swaps the whole page below it.
 */
function SubTabs({
  value,
  requests,
  onChange,
}: {
  readonly value: SubTab;
  readonly requests: number;
  readonly onChange: (tab: SubTab) => void;
}) {
  return (
    <SegmentedControl
      role="tablist"
      label="Friends"
      value={value}
      onChange={onChange}
      options={[
        { value: 'friends', label: 'Friends' },
        { value: 'leaderboard', label: 'Leaderboard' },
        {
          value: 'requests',
          label: (
            <span className="flex items-center gap-1.5">
              Requests
              {requests > 0 && (
                <span
                  className={cx(
                    'numeric flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                    // On the filled pill the count turns inside out, or it vanishes into it.
                    value === 'requests' ? 'bg-on-accent text-accent' : 'bg-accent text-on-accent',
                  )}
                >
                  {requests}
                  <span className="sr-only"> waiting</span>
                </span>
              )}
            </span>
          ),
        },
      ]}
    />
  );
}

function FriendList({
  overview,
  mine,
}: {
  readonly overview: FriendsOverview;
  readonly mine: MySide;
}) {
  // Worked out once per answer from the server, not on every render.
  const cards = useMemo(() => {
    const now = new Date();
    return sortFriends(overview.friends).map((friend) =>
      friendCard(friend, {
        now,
        weekStartsOn: mine.weekStartsOn,
        unitSystem: mine.unitSystem,
        myBests: mine.bests,
        movers: mine.movers,
        names: mine.names,
        slugs: mine.slugs,
      }),
    );
  }, [overview, mine]);

  if (cards.length === 0) {
    return (
      <Panel tone="hero" eyebrow="Friends" title="Train with friends">
        <p className="mt-1 text-sm text-secondary">
          Share your code with someone you train with. Once they add you, you’ll see each other’s
          week, best lifts and workouts here.
        </p>
        {overview.me !== null && (
          <div className="mt-4 border-t border-subtle/70 pt-4">
            <YourCode code={overview.me.code} />
          </div>
        )}
      </Panel>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {cards.map((card) => (
        <li key={card.userId}>
          <FriendCard card={card} />
        </li>
      ))}
    </ul>
  );
}

/**
 * A friend's level, beside their name: small, since it is a number to glance
 * at and compare rather than read. ADR-0132.
 */
function LevelPill({ level }: { readonly level: number }) {
  return (
    <span className="numeric shrink-0 rounded-full bg-elevated px-2 py-0.5 text-[11px] leading-4 font-semibold text-secondary">
      <span aria-hidden>Lv {level}</span>
      <span className="sr-only">Level {level}</span>
    </span>
  );
}

/**
 * One friend, calmly: who and whether they are around, this week's dots and
 * the streak, their best lifts against yours, and their last workout.
 *
 * The whole card opens their page — the name is the link, stretched over the
 * card — and the last workout is a link of its own on top of that, so the two
 * targets never nest.
 */
function FriendCard({ card }: { readonly card: FriendCardView }) {
  return (
    <article className={cx('relative rounded-sheet border border-subtle bg-surface p-4', PRESS)}>
      <div className="flex items-center gap-3">
        <Avatar name={card.avatarName} tint />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="min-w-0 truncate text-lg font-semibold text-primary">
              <Link
                to={`/friends/${card.userId}`}
                state={{ name: card.name }}
                className="after:absolute after:inset-0 after:rounded-sheet after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-accent"
              >
                {card.name}
              </Link>
            </h2>
            {card.level !== null && <LevelPill level={card.level} />}
          </div>
          {card.presence !== null && <PresenceLine presence={card.presence} />}
        </div>
        <ChevronRightIcon className="size-5 shrink-0 text-muted" />
      </div>

      {!card.sharing ? (
        <p className="mt-3 text-sm text-muted">Not sharing their training</p>
      ) : (
        <>
          {card.dots !== null && (
            <div className="mt-4">
              <WeekDots dots={card.dots} />
            </div>
          )}
          <div className="mt-2 min-h-5">
            <Streak streak={card.streak} />
          </div>

          {card.lifts !== null && <BestLifts lifts={card.lifts} />}

          {card.lastWorkout !== null && (
            <Link
              to={`/friends/${card.userId}/session/${card.lastWorkout.sessionId}`}
              state={{ name: card.name }}
              className="relative z-10 mt-4 flex min-h-tap items-center gap-3 rounded-card bg-base/70 px-3 py-2.5 active:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted">Last workout</span>
                <span className="block truncate text-sm font-medium text-primary">
                  {card.lastWorkout.title}
                </span>
                <span className="numeric block text-xs text-secondary">
                  {card.lastWorkout.when}
                  {card.lastWorkout.duration !== null && ` · ${card.lastWorkout.duration}`}
                </span>
              </span>
              <ChevronRightIcon className="size-5 shrink-0 text-muted" />
            </Link>
          )}
        </>
      )}
    </article>
  );
}

/**
 * Their heaviest lifts, three columns under one caption (ADR-0113): their
 * number, and beside it the gap from your side when you have done the lift
 * too. Each column is centred, so a name too long for one line wraps under
 * itself rather than off to one side.
 */
function BestLifts({ lifts }: { readonly lifts: readonly CardLift[] }) {
  const captionId = useId();
  return (
    <div className="mt-3 border-t border-subtle/70 pt-3">
      <p
        id={captionId}
        className="text-[11px] leading-4 font-semibold tracking-[0.08em] text-muted uppercase"
      >
        Best lifts
      </p>
      {lifts.length === 0 ? (
        <p className="mt-1 text-sm text-secondary">No lifts logged yet</p>
      ) : (
        <dl aria-labelledby={captionId} className="mt-2 grid grid-cols-3 gap-2">
          {lifts.map((lift) => (
            <div key={lift.exerciseId} className="flex flex-col items-center text-center">
              <dt className="text-xs text-secondary">{lift.label}</dt>
              <dd className="numeric mt-0.5 flex flex-wrap items-baseline justify-center gap-x-1.5">
                <span className="sr-only">{lift.description}</span>
                {/* The unit a size down, as on Home. */}
                <span aria-hidden>
                  <StatValue text={lift.theirs} size="text-base leading-6" />
                </span>
                {lift.delta !== null && (
                  <span
                    aria-hidden
                    className={cx(
                      'text-xs font-medium',
                      lift.delta.standing === 'ahead'
                        ? 'text-success'
                        : lift.delta.standing === 'behind'
                          ? 'text-danger/80'
                          : 'text-muted',
                    )}
                  >
                    {lift.delta.text}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/**
 * Your challenges, above the board: running, waiting on a friend, and
 * finished in the last week. With none, a line saying where one starts.
 */
function ChallengesSection({
  cards,
  onChanged,
}: {
  readonly cards: readonly ChallengeCardView[];
  readonly onChanged: () => void;
}) {
  return (
    <section aria-labelledby="challenges-heading" className="flex flex-col gap-3">
      <h2 id="challenges-heading" className="text-lg font-semibold text-primary">
        Challenges
      </h2>
      <ChallengeList cards={cards} onChanged={onChanged} />
    </section>
  );
}

function RequestList({
  overview,
  challenges,
  onAnswered,
  onChallengeAnswered,
}: {
  readonly overview: FriendsOverview;
  readonly challenges: readonly ChallengeCardView[];
  readonly onAnswered: () => void;
  readonly onChallengeAnswered: () => void;
}) {
  const rows = useMemo(() => {
    const now = new Date();
    return overview.requests.map((request) => requestRow(request, now));
  }, [overview]);

  if (rows.length === 0 && challenges.length === 0) {
    return (
      <p className="rounded-sheet border border-subtle bg-surface p-4 text-sm text-secondary">
        No requests waiting. When someone adds you with your code, or challenges you, it shows up
        here for you to accept.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {challenges.length > 0 && (
        <ChallengeList cards={challenges} onChanged={onChallengeAnswered} />
      )}
      {rows.length > 0 && (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id}>
              <RequestCard row={row} onAnswered={onAnswered} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RequestCard({
  row,
  onAnswered,
}: {
  readonly row: RequestView;
  readonly onAnswered: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const answer = (accept: boolean) => {
    setBusy(true);
    setFailure(null);
    answerFriendRequest(row.id, accept).then(
      () => {
        onAnswered();
      },
      (cause: unknown) => {
        setBusy(false);
        setFailure(cause instanceof FriendsError ? cause.message : 'That did not go through.');
      },
    );
  };

  return (
    <article className="rounded-sheet border border-subtle bg-surface p-4">
      <div className="flex items-center gap-3">
        <Avatar name={row.avatarName} tint />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-primary">{row.name}</h2>
          <p className="text-sm text-muted">{row.when}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Button
          disabled={busy}
          aria-label={`Accept ${row.name}`}
          onClick={() => {
            answer(true);
          }}
        >
          Accept
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          aria-label={`Decline ${row.name}`}
          onClick={() => {
            answer(false);
          }}
        >
          Decline
        </Button>
      </div>
      {failure !== null && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {failure}
        </p>
      )}
    </article>
  );
}

/**
 * Your code to give, and a box for theirs, in a sheet from the bottom of the
 * screen where a thumb already is. What came of sending is said in place,
 * under the button, rather than in a toast that may be gone before it is read.
 */
function AddFriendSheet({
  code,
  onClose,
  onSent,
}: {
  readonly code: string;
  readonly onClose: () => void;
  readonly onSent: () => void;
}) {
  const keyboard = useKeyboardInset();
  const titleId = useId();
  const [typed, setTyped] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    globalThis.addEventListener('keydown', onKey);
    return () => {
      globalThis.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const send = () => {
    const check = checkFriendCode(typed);
    if (!check.ok) {
      setMessage(describeCodeProblem(check));
      return;
    }
    setSending(true);
    setMessage(null);
    sendFriendRequest(check.code).then(
      (result) => {
        setSending(false);
        setMessage(describeSendResult(result));
        if (result.outcome === 'sent' || result.outcome === 'now_friends') {
          setTyped('');
          onSent();
        }
      },
      (cause: unknown) => {
        setSending(false);
        setMessage({
          tone: 'error',
          text: cause instanceof FriendsError ? cause.message : 'That did not go through.',
        });
      },
    );
  };

  return (
    // Lifted by the keyboard's height while one is open: iOS leaves a fixed
    // sheet under the keyboard otherwise, field and button included.
    <div
      className="fixed inset-0 z-40 flex items-end justify-center"
      style={keyboard > 0 ? { bottom: keyboard } : undefined}
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-2xl rounded-t-sheet border-t border-subtle bg-surface px-5 pt-5 pb-safe-bottom shadow-floating"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-xl font-semibold text-primary">
            Add a friend
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="inline-flex min-h-tap items-center rounded-control px-3 text-sm font-medium text-secondary active:bg-elevated focus-visible:outline-2 focus-visible:outline-accent"
          >
            Done
          </button>
        </div>

        <div className="mt-4">
          <YourCode code={code} />
        </div>

        <form
          className="mt-4 flex flex-col gap-3 border-t border-subtle pt-4 pb-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!sending) send();
          }}
        >
          <TextField
            label="Their code"
            value={typed}
            placeholder="K7PX4M"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={12}
            onChange={(event) => {
              setTyped(event.target.value);
              setMessage(null);
            }}
          />
          <Button type="submit" fullWidth disabled={sending || typed.trim() === ''}>
            {sending ? 'Sending…' : 'Send request'}
          </Button>
          <p
            role="status"
            className={cx(
              'min-h-5 text-sm',
              message?.tone === 'success'
                ? 'text-success'
                : message?.tone === 'error'
                  ? 'text-danger'
                  : 'text-secondary',
            )}
          >
            {message?.text}
          </p>
        </form>
      </section>
    </div>
  );
}
