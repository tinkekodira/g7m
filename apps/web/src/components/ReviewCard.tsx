import { Link } from 'react-router';
import { toneOf, type Observation, type UnitSystem } from '@g7m/core';
import { describeObservation } from '../screens/review-copy.js';

/**
 * What the log says about how the training is going.
 *
 * ADR-0032's last piece. It reads the same whether the sessions came from the
 * generator or were typed in by somebody running their own program — which is
 * the entire point, because the lifter who ignores the plan is the one this
 * was built for.
 *
 * Three observations, not seven. `reviewTraining` returns everything it found,
 * ranked, and the cut happens here: a review somebody scrolls is a review
 * somebody stops opening.
 */

/** Enough to be useful, few enough to read standing up. */
const SHOWN = 3;

const TONE_CLASSES = {
  good: 'border-accent/40',
  warning: 'border-danger/40',
  neutral: 'border-subtle',
} as const;

const DOT_CLASSES = {
  good: 'bg-accent',
  warning: 'bg-danger',
  neutral: 'bg-muted',
} as const;

export function ReviewCard({
  observations,
  unitSystem,
}: {
  readonly observations: readonly Observation[];
  readonly unitSystem: UnitSystem;
}) {
  const shown = observations.slice(0, SHOWN);
  if (shown.length === 0) return null;

  return (
    <section className="rounded-card bg-surface p-4">
      <h2 className="text-lg font-semibold text-primary">How it is going</h2>
      <p className="mt-1 mb-3 text-sm text-muted">
        Read from what you logged, whether the plan wrote it or you did.
      </p>

      <ul className="flex flex-col gap-3">
        {shown.map((observation, index) => {
          const line = describeObservation(observation, unitSystem);
          const tone = toneOf(observation);
          return (
            <li
              key={`${observation.kind}-${String(index)}`}
              className={`rounded-control border p-3 ${TONE_CLASSES[tone]}`}
            >
              <div className="flex items-baseline gap-2">
                {/* A dot rather than colouring the text: the heading has to stay
                    readable, and a red sentence reads as an error rather than
                    as a thing worth looking at. */}
                <span
                  aria-hidden
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${DOT_CLASSES[tone]}`}
                />
                <p className="text-sm font-semibold text-primary">{line.heading}</p>
              </div>
              <p className="mt-1 text-sm text-secondary">{line.detail}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * The headline only, for a screen that is not about progress.
 *
 * One line and a way through to the rest. The brief asked for a *heads-up* —
 * something that finds the user rather than waiting to be opened — and
 * somebody running their own program may never tap Progress.
 */
export function ReviewNudge({
  observations,
  unitSystem,
}: {
  readonly observations: readonly Observation[];
  readonly unitSystem: UnitSystem;
}) {
  const headline = observations[0];
  // Nothing to say before there is data, and no point nudging somebody towards
  // a screen that will only tell them to come back later.
  if (headline === undefined || headline.kind === 'too_soon') return null;

  const line = describeObservation(headline, unitSystem);
  const tone = toneOf(headline);

  return (
    <Link
      to="/progress"
      className={`flex min-h-tap items-center justify-between gap-3 rounded-card border bg-surface px-4 py-3 active:bg-elevated ${TONE_CLASSES[tone]}`}
    >
      <span className="flex min-w-0 items-baseline gap-2">
        <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${DOT_CLASSES[tone]}`} />
        <span className="min-w-0 text-sm font-medium text-primary">{line.heading}</span>
      </span>
      <span aria-hidden className="shrink-0 text-muted">
        →
      </span>
    </Link>
  );
}
