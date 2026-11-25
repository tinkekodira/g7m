import { formatTime, t } from '@g7m/i18n';
import { useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { validPastWorkoutMinutes } from '@g7m/core';
import { Button, TextField, cx } from '@g7m/ui';
import { useWrite } from '../lib/db/use-catalogue.js';
import { useKeyboardInset } from '../lib/use-keyboard-inset.js';
import { readPendingPastTime, writePendingPastTime } from '../lib/pending-past-time.js';
import { ClockIcon } from './icons.js';
import type { PastTime } from '../lib/past-time.js';

/** "18:05", the value a time field takes. */
function clockValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * When a workout logged afterwards happened (ADR-0193).
 *
 * Offered where a past workout is looked at: while it is being logged, on its
 * page from the calendar, and on its recap. A bottom sheet like the weigh-in,
 * lifted over the iOS keyboard. The day is fixed: only the time of day and
 * the length are asked for.
 */
export function PastTimeSheet({
  sessionId,
  day,
  given,
  onSave,
  onClose,
}: {
  readonly sessionId: string;
  /** The session's start: only its date is used. */
  readonly day: Date;
  /** The time already given, shown for correcting, or null for none yet. */
  readonly given: PastTime | null;
  /**
   * Instead of writing the finished workout: the one still being logged keeps
   * the time until Finish (`pending-past-time.ts`), having no end to hold it.
   */
  readonly onSave?: (time: PastTime) => void;
  readonly onClose: () => void;
}) {
  const headingId = useId();
  const hintId = useId();
  const { write, busy, error } = useWrite();
  const keyboard = useKeyboardInset();
  const panel = useRef<HTMLElement>(null);
  const [start, setStart] = useState(given === null ? '' : clockValue(given.start));
  const [minutes, setMinutes] = useState(given === null ? '' : String(given.minutes));
  const [problem, setProblem] = useState<{ field: 'start' | 'minutes'; text: string } | null>(null);

  // The dialog, not a field: focusing a time field on iOS opens its wheel
  // before the lifter has read what is being asked.
  useLayoutEffect(() => {
    panel.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    globalThis.addEventListener('keydown', onKey);
    return () => {
      globalThis.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    const match = /^(\d{1,2}):(\d{2})/.exec(start);
    if (match === null) {
      setProblem({ field: 'start', text: t().history.recap.needStart });
      return;
    }
    const length = Number(minutes.trim());
    if (!validPastWorkoutMinutes(length)) {
      setProblem({ field: 'minutes', text: t().history.recap.needMinutes });
      return;
    }
    const at = new Date(day);
    at.setHours(Number(match[1]), Number(match[2]), 0, 0);
    if (onSave !== undefined) {
      onSave({ start: at, minutes: length });
      onClose();
      return;
    }
    const saved = await write(async (r) => {
      await r.sessions.setPastTime(sessionId, at, length);
      return true;
    });
    if (saved === true) onClose();
  }

  // On the body: the recap's carousel transforms its cards, and a fixed
  // sheet inside a transformed card would be pinned to the card instead.
  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-end justify-center"
      style={keyboard > 0 ? { bottom: keyboard } : undefined}
    >
      <button
        type="button"
        aria-label={t().common.close}
        tabIndex={-1}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={hintId}
        tabIndex={-1}
        className={cx(
          'popup relative flex w-full max-w-2xl flex-col gap-5 rounded-t-sheet border-t border-subtle bg-surface px-5 pt-5 shadow-floating focus:outline-none',
          keyboard === 0 && 'pb-safe-bottom',
        )}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-card bg-accent/15 text-accent"
          >
            <ClockIcon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={headingId} className="text-xl leading-7 font-semibold text-primary">
              {t().history.recap.timeTitle}
            </h2>
            <p id={hintId} className="text-sm text-muted">
              {t().history.recap.timeHint}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-tap shrink-0 items-center rounded-control px-3 text-sm font-medium text-secondary active:bg-elevated focus-visible:outline-2 focus-visible:outline-accent"
          >
            {t().common.cancel}
          </button>
        </div>

        <form
          className="flex flex-col gap-4 pb-4"
          noValidate
          onSubmit={(event) => {
            void submit(event);
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={t().history.recap.startedAt}
              type="time"
              value={start}
              error={problem?.field === 'start' ? problem.text : undefined}
              onChange={(event) => {
                setStart(event.target.value);
                setProblem(null);
              }}
              className="numeric"
            />
            <TextField
              label={t().history.recap.lasted}
              inputMode="numeric"
              enterKeyHint="done"
              autoComplete="off"
              value={minutes}
              error={problem?.field === 'minutes' ? problem.text : undefined}
              onChange={(event) => {
                setMinutes(event.target.value.replace(/\D/g, ''));
                setProblem(null);
              }}
              className="numeric"
            />
          </div>
          {error !== null && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" fullWidth disabled={busy}>
            {t().common.save}
          </Button>
        </form>
      </section>
    </div>,
    document.body,
  );
}

/** "17:30 · 56 min", or the invitation to give one. */
function describe(time: PastTime | null): string {
  return time === null
    ? t().history.recap.addTime
    : `${formatTime(time.start, { hour: 'numeric', minute: '2-digit' })} · ${t().progress.minutes(time.minutes)}`;
}

const LINK =
  'inline-flex min-h-tap items-center gap-1.5 self-start rounded-control text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-accent';

/**
 * A finished past workout's time, written straight to it: on its recap and
 * on its page from the calendar.
 */
export function PastTimeButton({
  sessionId,
  day,
  given,
}: {
  readonly sessionId: string;
  readonly day: Date;
  readonly given: PastTime | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className={`past-time-button ${LINK}`}
      >
        <ClockIcon className="size-4" />
        {given === null ? t().history.recap.addTime : t().history.recap.changeTime}
      </button>
      {open && (
        <PastTimeSheet
          sessionId={sessionId}
          day={day}
          given={given}
          onClose={() => {
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

/**
 * The time of a past workout still being logged, under its gym: kept on the
 * device and applied when it is finished (`pending-past-time.ts`).
 */
export function PendingPastTimeRow({
  sessionId,
  day,
}: {
  readonly sessionId: string;
  readonly day: Date;
}) {
  const [time, setTime] = useState(() => readPendingPastTime(sessionId));
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        aria-label={
          time === null ? undefined : `${t().history.recap.changeTime}: ${describe(time)}`
        }
        className={`past-time-pending numeric ${LINK}`}
      >
        <ClockIcon className="size-4" />
        {describe(time)}
      </button>
      {open && (
        <PastTimeSheet
          sessionId={sessionId}
          day={day}
          given={time}
          onSave={(next) => {
            writePendingPastTime(sessionId, next);
            setTime(next);
          }}
          onClose={() => {
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
