import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { trainingMinutes } from '@g7m/core';
import { Button } from '@g7m/ui';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';
import {
  clearAutoFinished,
  readAutoFinished,
  readSnoozedAt,
  writeAutoFinished,
} from '../lib/workout-notice.js';
import {
  autoFinishNotice,
  idleLimitMinutes,
  lastActivityAt,
  shouldAutoFinish,
} from '../screens/workout-timer.js';
import { CheckIcon } from './icons.js';

/** How often the open workout is checked. The decision is made from timestamps. */
const TICK_MS = 30_000;

/**
 * Closes a workout nobody came back to, and says so afterwards. ADR-0077.
 *
 * Mounted beside the routes rather than on the workout screen, because the
 * common way a workout is abandoned is that the app is closed with it open —
 * and then nothing on the workout screen is running to notice. This runs
 * wherever the app is: it finds the open workout, sees that nothing has been
 * ticked for two idle limits, closes it at its last set, and leaves a note for
 * the next launch.
 *
 * Nothing is lost when it fires. Every ticked set was saved when it was
 * ticked; what changes is that the workout has an end, and an honest one —
 * the last set, not the moment the app noticed.
 */
export function AbandonedWorkoutWatcher() {
  const { write } = useWrite();
  const [now, setNow] = useState(() => new Date());
  const [dismissed, setDismissed] = useState<string | null>(null);
  /** Finished this session, so a re-read before the write lands cannot do it twice. */
  const handled = useRef(new Set<string>());

  const state = useCatalogue('open-workout', async (repositories) => {
    // Only workouts with something ticked in them are in here at all, which is
    // exactly the rule this wants: an empty session left open is Home's
    // business, not something to close and announce.
    const summaries = await repositories.history.sessionSummaries(null, { includeOpen: true });
    const noticeId = readAutoFinished();
    return {
      open: summaries.find((each) => each.endedAt === null && each.source !== 'past') ?? null,
      notice:
        noticeId === null ? null : (summaries.find((each) => each.sessionId === noticeId) ?? null),
    };
  });

  const open = state.data?.open ?? null;
  const openId = open?.sessionId ?? null;

  // Only while something is open, and only every half minute: the decision is
  // read off timestamps, so a phone that slept through the hour reaches the
  // same answer on its first tick awake.
  useEffect(() => {
    if (openId === null) return;
    const timer = setInterval(() => {
      setNow(new Date());
    }, TICK_MS);
    return () => {
      clearInterval(timer);
    };
  }, [openId]);

  useEffect(() => {
    if (open === null || openId === null || handled.current.has(openId)) return;
    const activity = lastActivityAt(open.startedAt, [open.lastSetAt]);
    const idle = shouldAutoFinish({
      lastActivityAt: activity,
      snoozedAt: readSnoozedAt(openId),
      now,
      // A treadmill hour is not idling; cardio is held to its own limit.
      limitMinutes: idleLimitMinutes(open.boutCount > 0 ? 'cardio' : 'strength'),
    });
    if (!idle) return;

    handled.current.add(openId);
    writeAutoFinished(openId);
    void write((repositories) => repositories.sessions.finish(openId, { endedAt: activity }));
  }, [open, openId, now, write]);

  const notice = state.data?.notice ?? null;
  if (notice === null || notice.sessionId === dismissed) return null;

  return (
    <AutoFinishDialog
      summary={notice}
      now={now}
      onDismiss={() => {
        setDismissed(notice.sessionId);
        clearAutoFinished();
      }}
    />
  );
}

/**
 * The popup, in the middle of the screen, on the way in.
 *
 * Middle rather than the top, and with a backdrop, because this is the one
 * thing in the app that reports something done *to* somebody's data. It should
 * be read, and it should take one tap to agree to — so Okay is the only thing
 * that closes it, and the way to the workout itself is beside it.
 */
function AutoFinishDialog({
  summary,
  now,
  onDismiss,
}: {
  readonly summary: {
    readonly sessionId: string;
    readonly startedAt: Date;
    readonly endedAt: Date | null;
    readonly exerciseCount: number;
    readonly setCount: number;
    readonly boutCount: number;
    readonly firstSetAt: Date | null;
    readonly lastSetAt: Date | null;
  };
  readonly now: Date;
  readonly onDismiss: () => void;
}) {
  // Focus lands on Okay, so the dialog can be agreed to without hunting for
  // it, and so a screen reader starts where the action is.
  const card = useRef<HTMLDivElement>(null);
  useEffect(() => {
    card.current?.querySelector('button')?.focus();
  }, []);

  const notice = autoFinishNotice({
    startedAt: summary.startedAt,
    endedAt: summary.endedAt,
    exerciseCount: summary.exerciseCount,
    setCount: summary.setCount,
    boutCount: summary.boutCount,
    minutes: trainingMinutes([summary.firstSetAt, summary.lastSetAt]),
    now,
  });

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="auto-finish-title"
      aria-describedby="auto-finish-detail"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onDismiss();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-base/70 p-4 backdrop-blur-sm"
    >
      <div
        ref={card}
        className="popup w-full max-w-sm rounded-card border border-subtle bg-surface p-5 shadow-floating"
      >
        <span
          aria-hidden
          className="flex size-12 items-center justify-center rounded-full bg-success/15 text-success"
        >
          <CheckIcon className="size-6" />
        </span>
        <h2 id="auto-finish-title" className="mt-3 text-xl font-semibold text-primary">
          {notice.title}
        </h2>
        <p className="mt-2 text-sm text-secondary">{notice.reason}</p>
        <p id="auto-finish-detail" className="mt-2 text-sm font-medium text-primary">
          {notice.detail}
        </p>
        <div className="mt-5 flex items-center gap-3">
          <Button fullWidth onClick={onDismiss}>
            Okay
          </Button>
          <Link
            to={`/progress/session/${summary.sessionId}`}
            onClick={onDismiss}
            className="inline-flex min-h-tap shrink-0 items-center rounded-control border border-subtle bg-elevated px-4 text-sm font-medium text-primary select-none active:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            See it
          </Link>
        </div>
      </div>
    </div>
  );
}
