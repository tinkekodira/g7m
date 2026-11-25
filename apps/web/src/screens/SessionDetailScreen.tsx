import { t } from '@g7m/i18n';
import { useCallback, useEffect, useState } from 'react';
import { canEditWorkout, type RecapRewards } from '@g7m/core';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { loadWorkoutRecap } from '../lib/db/workout-recap.js';
import { WorkoutRecap } from '../components/WorkoutRecap.js';
import { PastTimeButton } from '../components/PastTimeSheet.js';
import { givenPastTime, pastTimeable } from '../lib/past-time.js';
import { LevelUpCelebration } from '../components/LevelUpCelebration.js';
import { SessionBody } from '../components/SessionBody.js';
import { HeaderLink } from '../components/HeaderLink.js';
import { PinIcon, TrashIcon } from '../components/icons.js';
import { Button, TextField } from '@g7m/ui';
import { useCatalogue, useWrite } from '../lib/db/use-catalogue.js';

/** History opens the full log; finishing a workout opens its separate recap. */
export function SessionDetailScreen() {
  const { sessionId = '' } = useParams();

  const location = useLocation();
  const navigate = useNavigate();
  const [celebration, setCelebration] = useState<RecapRewards | null>(null);
  const details = location.pathname.endsWith('/details');
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => {
      setNow(new Date());
    };
    const timer = setInterval(refresh, 1000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, []);
  const navigation = location.state as { workoutFinished?: boolean; afterwards?: string } | null;
  const fresh = navigation?.workoutFinished === true;
  const afterwards = navigation?.afterwards ?? '/';
  const completeCelebration = useCallback(() => {
    // Closed here, not by leaving the screen. The router changes routes inside
    // a transition, so while Home is still rendering — a slow phone, a chunk
    // still loading — React keeps this screen, dialog and all, on display. A
    // visit back to this workout before Home lands then reuses this instance
    // and its celebration, and the moment replays from history. Clearing it is
    // an urgent update, so the dialog goes the instant it is dismissed.
    setCelebration(null);
    void navigate(afterwards, { replace: true });
  }, [navigate, afterwards]);
  const state = useCatalogue(`session:${sessionId}`, (r) => loadWorkoutRecap(r, sessionId));

  const data = state.data;

  return (
    <main
      className={`${details ? 'min-h-full pb-safe-bottom' : 'recap-screen'} mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-safe-top`}
    >
      <header className="flex shrink-0 items-baseline justify-between gap-4 pt-4 pb-1">
        <h1 className="min-w-0 text-2xl font-semibold break-words text-primary">
          {fresh ? t().history.session.saved : (data?.title ?? t().history.session.workout)}
        </h1>
        {!fresh && <HeaderLink to="/progress">{t().progress.title}</HeaderLink>}
      </header>

      {state.error !== null ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : state.loading ? (
        <p className="text-sm text-muted">{t().common.loading}</p>
      ) : data === null ? (
        <p className="max-w-prose text-sm text-secondary">{t().history.session.notOnDevice}</p>
      ) : (
        <>
          {details ? (
            <>
              {data.gymName !== null && (
                <p className="flex items-center gap-1.5 text-sm text-secondary">
                  <PinIcon className="size-4 shrink-0 text-muted" />
                  {data.gymName}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                {canEditWorkout(data.session.endedAt, now) ? (
                  <>
                    <HeaderLink to={`/workout/${sessionId}`}>{t().history.session.edit}</HeaderLink>
                    <p className="text-sm text-secondary">{t().history.session.editable}</p>
                  </>
                ) : (
                  <p className="text-sm text-secondary">{t().history.session.closed}</p>
                )}
                <HeaderLink to={`/progress/session/${sessionId}`}>
                  {t().history.session.recap}
                </HeaderLink>
              </div>
              {/* Where the calendar's "Open the workout" lands (ADR-0194). */}
              {pastTimeable(data.session.source, data.recap.sets, data.recap.cardioSeconds) && (
                <PastTimeButton
                  sessionId={sessionId}
                  day={data.session.startedAt}
                  given={givenPastTime(
                    data.session.startedAt,
                    data.session.endedAt,
                    data.recap.trainingMinutes,
                  )}
                />
              )}
              <SessionBody
                startedAt={data.session.startedAt}
                bodyweightKg={data.session.bodyweightKg}
                unitSystem={data.profile?.unitSystem ?? 'metric'}
                blocks={data.blocks}
              />
              {data.blocks.length === 0 && (
                <p className="text-sm text-muted">{t().history.session.noExercises}</p>
              )}
            </>
          ) : (
            <WorkoutRecap key={sessionId} data={data} />
          )}
          <div
            className="recap-actions grid shrink-0 grid-cols-2 gap-2 pb-3"
            aria-label={t().history.session.actions}
            role="group"
          >
            <Link
              to={fresh ? afterwards : '/progress'}
              onClick={(event) => {
                if (
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                if (!fresh || details || data.rewards.levelAfter <= data.rewards.levelBefore)
                  return;
                event.preventDefault();
                setCelebration(data.rewards);
                // Consume the fresh-finish state before showing it, including on reload/back.
                void navigate(location.pathname, {
                  replace: true,
                  state: { ...navigation, workoutFinished: false },
                });
              }}
              className="col-span-2 flex min-h-tap items-center justify-center rounded-control bg-accent px-4 font-medium text-on-accent hover:bg-accent-hover active:bg-accent-pressed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {fresh ? t().common.continue : t().common.done}
            </Link>
            <KeepAsRoutine
              sessionId={sessionId}
              suggestion={data.session.name ?? ''}
              enabled={data.blocks.some((block) =>
                block.sets.some((set) => set.isCompleted && set.setType !== 'warmup'),
              )}
            />
            <DeleteWorkout sessionId={sessionId} />
          </div>
        </>
      )}
      {celebration !== null && (
        <LevelUpCelebration rewards={celebration} onComplete={completeCelebration} />
      )}
    </main>
  );
}

/**
 * Turn a workout that already happened into a routine.
 *
 * The other half of the offer made when a workout is finished, for the session
 * somebody said "not this one" to and then trained twice more. Opens closed:
 * this screen is read to see what was done, and a name box on it by default
 * would be a form in the way of that.
 */
function KeepAsRoutine({
  sessionId,
  suggestion,
  enabled,
}: {
  readonly sessionId: string;
  readonly suggestion: string;
  readonly enabled: boolean;
}) {
  const navigate = useNavigate();
  const { write, busy, error } = useWrite();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(suggestion);

  return (
    <section className={open ? 'col-span-2' : 'min-w-0'}>
      {open ? (
        <>
          <h2 className="mb-3 text-base font-semibold text-primary">
            {t().history.session.nameRoutine}
          </h2>
          <TextField
            label={t().history.session.routineName}
            value={name}
            placeholder={t().history.session.routinePlaceholder}
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              disabled={busy || name.trim() === ''}
              onClick={() => {
                void write((r) => r.routines.createFromSession({ sessionId, name })).then(
                  (saved) => {
                    if (saved !== null) void navigate('/routines');
                  },
                );
              }}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
          {error !== null && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </>
      ) : (
        <>
          <Button
            variant="secondary"
            className="px-2 text-sm"
            disabled={!enabled}
            fullWidth
            onClick={() => {
              setOpen(true);
            }}
          >
            {t().history.session.saveAsRoutine}
          </Button>
        </>
      )}
    </section>
  );
}

/**
 * Delete this workout for good.
 *
 * At the bottom of the screen, after everything else, so it cannot be hit
 * reaching for something above it. Deletes the session and every exercise and
 * set logged under it (`SessionRepository.discard`, the same call the
 * in-progress workout screen uses to abandon a session) — nothing about that
 * call is specific to a session still in progress. Every number that could
 * mention this workout (Progress, the calendar, an exercise's estimated 1RM,
 * streaks, achievements) is computed fresh from the sessions on the device
 * rather than cached, so none of it needs separate cleanup — see DECISIONS.md.
 */
function DeleteWorkout({ sessionId }: { readonly sessionId: string }) {
  const navigate = useNavigate();
  const { write, busy, error } = useWrite();

  return (
    <div>
      <Button
        variant="danger-outline"
        fullWidth
        className="px-2 text-sm"
        disabled={busy}
        onClick={() => {
          if (!globalThis.confirm(t().history.confirmDelete)) return;
          void write((r) => r.sessions.discard(sessionId)).then((result) => {
            // Null means the write failed and its error is already set below —
            // leaving means the error message goes with it, unread.
            if (result !== null) void navigate(-1);
          });
        }}
      >
        <TrashIcon className="hidden size-4 shrink-0 sm:block" />
        {t().history.session.delete}
      </Button>
      {error !== null && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
