import { Link } from 'react-router';
import {
  supersededBy,
  toneOf,
  toneOfLink,
  type Link as ObservationLink,
  type Observation,
  type Tone,
  type UnitSystem,
} from '@g7m/core';
import {
  REVIEW_ANCHOR,
  REVIEW_PARAM,
  describeLink,
  describeObservation,
} from '../screens/review-copy.js';
import { cx } from '@g7m/ui';
import { ChevronRightIcon } from './icons.js';
import { Panel } from './Panel.js';

/**
 * What the log says about how the training is going.
 *
 * ADR-0032's last piece. It reads the same whether the sessions came from the
 * generator or were typed in by somebody running their own program — which is
 * the entire point, because the lifter who ignores the plan is the one this
 * was built for.
 *
 * Three lines, not seven. `reviewTraining` returns everything it found,
 * ranked, and the cut happens here: a review somebody scrolls is a review
 * somebody stops opening.
 *
 * Links come first, and they are the point of the card. An observation is one
 * fact; a link is two of them read together, which is the difference between
 * "your squat has not moved" and "your squat has not moved, and the deficit
 * you asked for is why". The fact a link reasoned *from* stays on the list
 * underneath — that is what lets somebody check its working rather than take
 * its word for it — but the one it speaks for is dropped, or the card says the
 * same thing twice.
 */

/** Enough to be useful, few enough to read standing up. */
const SHOWN = 3;

const DOT_CLASSES = {
  good: 'bg-accent',
  warning: 'bg-danger',
  neutral: 'bg-muted',
} as const;

interface Entry {
  readonly key: string;
  readonly heading: string;
  readonly detail: string;
  readonly tone: Tone;
}

/** Links, then whatever they have not already spoken for. */
function entriesFor(
  observations: readonly Observation[],
  links: readonly ObservationLink[],
  unitSystem: UnitSystem,
): Entry[] {
  const spoken = supersededBy(links);

  return [
    ...links.map((link) => ({
      key: `link-${link.kind}`,
      ...describeLink(link, unitSystem),
      tone: toneOfLink(link),
    })),
    ...observations
      .filter((observation) => !spoken.has(observation.kind))
      .map((observation) => ({
        key: `observation-${observation.kind}`,
        ...describeObservation(observation, unitSystem),
        tone: toneOf(observation),
      })),
  ];
}

export function ReviewCard({
  observations,
  links = [],
  unitSystem,
  arrived = false,
}: {
  readonly observations: readonly Observation[];
  readonly links?: readonly ObservationLink[];
  readonly unitSystem: UnitSystem;
  /** Opened from Home's note: pointed out once, so the eye lands on it. */
  readonly arrived?: boolean;
}) {
  const shown = entriesFor(observations, links, unitSystem).slice(0, SHOWN);
  if (shown.length === 0) return null;

  return (
    <Panel
      id={REVIEW_ANCHOR}
      eyebrow="From your log"
      title="How it is going"
      className={cx('scroll-mt-4', arrived && 'spotlight')}
    >
      <p className="mt-1 text-sm text-muted">
        Read from what you logged, whether the plan wrote it or you did.
      </p>

      {/* Rows with the tone in a mark beside them, like Home's note, rather
          than a coloured box each: three red boxes read as three errors. */}
      <ul className="mt-2 flex flex-col">
        {shown.map((entry) => (
          <li
            key={entry.key}
            className="flex gap-3 border-b border-subtle/70 py-3 last:border-b-0 last:pb-0"
          >
            <span
              aria-hidden
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-elevated"
            >
              <span className={`size-2 rounded-full ${DOT_CLASSES[entry.tone]}`} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-5 font-semibold text-primary">
                {entry.heading}
              </span>
              <span className="mt-0.5 block text-sm text-secondary">{entry.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/**
 * The headline only, for a screen that is not about progress.
 *
 * One line and a way through to the rest. The brief asked for a *heads-up* —
 * something that finds the user rather than waiting to be opened — and
 * somebody running their own program may never tap Progress.
 *
 * On Home it sits under the month's cards as the coach's note (ADR-0120):
 * built like the cards' own insight lines, so it reads as part of the same
 * block rather than a banner bolted on below it. The dot keeps the review's
 * tone, inside a mark the size of the cards' symbols.
 */
export function ReviewNudge({
  observations,
  links = [],
  unitSystem,
}: {
  readonly observations: readonly Observation[];
  readonly links?: readonly ObservationLink[];
  readonly unitSystem: UnitSystem;
}) {
  const headline = entriesFor(observations, links, unitSystem)[0];
  // Nothing to say before there is data, and no point nudging somebody towards
  // a screen that will only tell them to come back later.
  if (headline === undefined || headline.key === 'observation-too_soon') return null;

  return (
    <Link
      to={`/progress?${REVIEW_PARAM}=review`}
      className="flex min-h-tap items-center gap-3 rounded-card border border-subtle bg-surface px-3 py-2.5 transition-transform duration-150 ease-out select-none active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-elevated"
      >
        <span className={`size-2 rounded-full ${DOT_CLASSES[headline.tone]}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] leading-4 font-semibold tracking-[0.08em] text-muted uppercase">
          How it is going
        </span>
        <span className="block text-sm leading-5 font-medium text-primary">{headline.heading}</span>
      </span>
      <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted" />
    </Link>
  );
}
