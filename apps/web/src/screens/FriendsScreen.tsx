import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { checkFriendCode } from '@g7m/core';
import { Button, TextField, cx } from '@g7m/ui';
import { Avatar } from '../components/Avatar.js';
import {
  FriendsOffline,
  NamePrompt,
  PresenceLine,
  Streak,
  WeekDots,
  YourCode,
} from '../components/FriendParts.js';
import { AddFriendIcon, ChevronRightIcon } from '../components/icons.js';
import { useOnline } from '../lib/use-online.js';
import {
  answerFriendRequest,
  fetchOverview,
  sendFriendRequest,
  FriendsError,
  type FriendsOverview,
} from '../lib/friends/api.js';
import { useMySide, useRemote, type MySide } from '../lib/friends/use-friends-data.js';
import { FriendsLeaderboard } from './FriendsLeaderboard.js';
import {
  describeCodeProblem,
  describeSendResult,
  friendCard,
  requestRow,
  sortFriends,
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
 * Three sub-tabs: the friends themselves, the leaderboard (ADR-0106), and the
 * requests waiting for you.
 */
type SubTab = 'friends' | 'leaderboard' | 'requests';

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
  const requests = overview.data?.requests.length ?? 0;
  const code = overview.data?.me?.code ?? null;

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
      ) : mine.data?.hasProfile !== true ? (
        <p className="text-sm text-muted">Loading…</p>
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
            overview.error === null && <p className="text-sm text-muted">Loading…</p>
          ) : tab === 'friends' ? (
            <FriendList overview={overview.data} mine={mine.data} />
          ) : tab === 'leaderboard' ? (
            <FriendsLeaderboard mine={mine.data} code={code} />
          ) : (
            <RequestList overview={overview.data} onAnswered={overview.reload} />
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

/** Friends | Leaderboard | Requests. Tabs in the ARIA sense: one is selected. */
function SubTabs({
  value,
  requests,
  onChange,
}: {
  readonly value: SubTab;
  readonly requests: number;
  readonly onChange: (tab: SubTab) => void;
}) {
  const tabClass = (selected: boolean) =>
    cx(
      'relative flex min-h-tap flex-1 items-center justify-center gap-1.5 px-2 text-sm font-medium transition-colors',
      'focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-accent',
      selected
        ? 'text-accent after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent'
        : 'text-secondary',
    );

  return (
    <div role="tablist" aria-label="Friends" className="flex border-b border-subtle">
      <button
        type="button"
        role="tab"
        aria-selected={value === 'friends'}
        className={tabClass(value === 'friends')}
        onClick={() => {
          onChange('friends');
        }}
      >
        Friends
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'leaderboard'}
        className={tabClass(value === 'leaderboard')}
        onClick={() => {
          onChange('leaderboard');
        }}
      >
        Leaderboard
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'requests'}
        className={tabClass(value === 'requests')}
        onClick={() => {
          onChange('requests');
        }}
      >
        Requests
        {requests > 0 && (
          <span className="numeric flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-on-accent">
            {requests}
            <span className="sr-only"> waiting</span>
          </span>
        )}
      </button>
    </div>
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
        myBigThree: mine.bigThree,
        movers: mine.movers,
      }),
    );
  }, [overview, mine]);

  if (cards.length === 0) {
    return (
      <section className="rounded-card border border-subtle bg-surface p-5">
        <h2 className="text-lg font-semibold text-primary">Train with friends</h2>
        <p className="mt-1 text-sm text-secondary">
          Share your code with someone you train with. Once they add you, you’ll see each other’s
          week, best lifts and workouts here.
        </p>
        {overview.me !== null && (
          <div className="mt-4">
            <YourCode code={overview.me.code} />
          </div>
        )}
      </section>
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
 * One friend, calmly: who and whether they are around, this week's dots and
 * the streak, the three lifts against yours, and their last workout.
 *
 * The whole card opens their page — the name is the link, stretched over the
 * card — and the last workout is a link of its own on top of that, so the two
 * targets never nest.
 */
function FriendCard({ card }: { readonly card: FriendCardView }) {
  return (
    <article className="relative rounded-card border border-subtle bg-surface p-4">
      <div className="flex items-center gap-3">
        <Avatar name={card.avatarName} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-primary">
            <Link
              to={`/friends/${card.userId}`}
              state={{ name: card.name }}
              className="after:absolute after:inset-0 after:rounded-card after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-accent"
            >
              {card.name}
            </Link>
          </h2>
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

          {card.lifts !== null && (
            <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-subtle pt-3">
              {card.lifts.map((lift) => (
                <div key={lift.label}>
                  <dt className="text-xs text-muted">{lift.label}</dt>
                  <dd className="numeric flex flex-wrap items-baseline gap-x-1.5">
                    <span className="sr-only">{lift.description}</span>
                    <span aria-hidden className="text-base font-semibold text-primary">
                      {lift.theirs}
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

          {card.lastWorkout !== null && (
            <Link
              to={`/friends/${card.userId}/session/${card.lastWorkout.sessionId}`}
              state={{ name: card.name }}
              className="relative z-10 mt-3 flex min-h-tap items-center gap-3 rounded-control bg-elevated px-3 py-2 active:bg-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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

function RequestList({
  overview,
  onAnswered,
}: {
  readonly overview: FriendsOverview;
  readonly onAnswered: () => void;
}) {
  const rows = useMemo(() => {
    const now = new Date();
    return overview.requests.map((request) => requestRow(request, now));
  }, [overview]);

  if (rows.length === 0) {
    return (
      <p className="rounded-card border border-subtle bg-surface p-5 text-sm text-secondary">
        No requests waiting. When someone adds you with your code, it shows up here for you to
        accept.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.id}>
          <RequestCard row={row} onAnswered={onAnswered} />
        </li>
      ))}
    </ul>
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
    <article className="rounded-card border border-subtle bg-surface p-4">
      <div className="flex items-center gap-3">
        <Avatar name={row.avatarName} />
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
    <div className="fixed inset-0 z-40 flex items-end justify-center">
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
