/**
 * How the review is worded.
 *
 * Separated from the markup for the same reason `metrics-prompt.ts` is: the
 * decision of *what* to say lives in `@g7m/core` and is tested against
 * numbers, and the decision of *how* to say it lives here and is tested
 * against tone. Changing a sentence should not break a test about programming.
 *
 * ## The register
 *
 * Every line below is a statement about what happened, with the number in it.
 * None of them are instructions, and none of them are compliments. That is
 * deliberate and it is the same rule ADR-0035 set for the metrics screen: an
 * app that tells somebody they are doing well is one they stop believing the
 * first time it says so on a bad month.
 *
 * The one thing each line does add is *what it means* — "your back has had
 * four sets a week against sixteen" is a number; "which is the one thing
 * holding this back" is why it was worth surfacing. Without that a review is a
 * dashboard, and dashboards do not change what anybody does on Tuesday.
 */
import { formatNumber, t } from '@g7m/i18n';
import {
  GOAL_LABELS,
  toDisplayWeight,
  type LiftMark,
  type Link,
  type Observation,
  type UnitSystem,
} from '@g7m/core';

/**
 * How Home's note says "and show me the review": `/progress?show=review`.
 *
 * In the query rather than a `#fragment`, because the hash already holds the
 * route. Progress reads it, scrolls the review card into view once it is drawn,
 * and points it out (ADR-0121).
 */
export const REVIEW_PARAM = 'show';
export const REVIEW_ANCHOR = 'how-it-is-going';

export interface Line {
  /** A few words. The thing being reported on. */
  readonly heading: string;
  /** One sentence. What happened, and what it means. */
  readonly detail: string;
}

/**
 * A lift's best set in words: "100 kg × 5", "+20 kg × 8", "12 reps with
 * 15 kg of help", "60 s".
 */
export function describeMark(mark: LiftMark, timed: boolean, show: (kg: number) => string): string {
  const words = t().review.mark;
  const count = timed ? words.seconds(mark.reps) : words.reps(mark.reps);
  const done = timed ? words.forSeconds(mark.reps) : words.times(mark.reps);

  switch (mark.loadType) {
    case 'external':
      return `${show(mark.weightKg)}${done}`;
    case 'bodyweight_plus':
      return mark.weightKg > 0 ? `+${show(mark.weightKg)}${done}` : count;
    case 'assisted':
      return mark.weightKg > 0 ? words.help(count, show(mark.weightKg)) : count;
    case 'bodyweight':
      return count;
  }
}

/**
 * Whether the plan itself breaks this plateau: it backs a loaded lift off and
 * builds it back, but leaves holds and bodyweight movements to the lifter.
 */
function planBacksOff(mark: LiftMark, timed: boolean): boolean {
  return mark.loadType === 'external' && !timed;
}

function weightShower(unitSystem: UnitSystem): (kg: number) => string {
  return (kg: number): string => {
    const display = toDisplayWeight(Math.abs(kg), unitSystem);
    return `${formatNumber(display.value)} ${display.unit}`;
  };
}

export function describeObservation(observation: Observation, unitSystem: UnitSystem): Line {
  const show = weightShower(unitSystem);
  const words = t().review;

  switch (observation.kind) {
    case 'too_soon':
      return describeTooSoon(observation);

    case 'consistency':
      return {
        heading: words.consistency.heading,
        detail: words.consistency.detail(
          observation.perWeek,
          observation.weeks,
          observation.target,
        ),
      };

    case 'group_short':
      return {
        heading: words.groupShort.heading(observation.group),
        detail: words.groupShort.detail(observation.perWeek, observation.target),
      };

    case 'group_over':
      return {
        heading: words.groupOver.heading(observation.group),
        detail: words.groupOver.detail(observation.perWeek, observation.target),
      };

    case 'lift_climbing': {
      const mark = (set: LiftMark): string => describeMark(set, observation.timed, show);
      return {
        heading: words.climbing.heading(observation.name),
        detail: words.climbing.detail(
          mark(observation.from),
          mark(observation.to),
          observation.sessions,
        ),
      };
    }

    case 'lift_stalled': {
      const { best, timed, sessionsSince, daysSince } = observation;
      return {
        heading: words.stalled.heading(observation.name),
        detail: words.stalled.detail(
          describeMark(best, timed, show),
          words.ago(daysSince),
          sessionsSince,
          planBacksOff(best, timed) ? words.stalled.backOff : words.stalled.yours(timed),
        ),
      };
    }

    case 'pace':
      return describePace(observation, show);
  }
}

function describeTooSoon(observation: Extract<Observation, { kind: 'too_soon' }>): Line {
  const { sessions, needed, days, neededDays } = observation;
  const words = t().review;

  if (sessions < needed) {
    return {
      heading: words.tooSoon.heading,
      detail: words.tooSoon.detail(sessions, needed),
    };
  }

  const wait = Math.max(1, neededDays - days);
  return {
    heading: words.notEnoughWeeks.heading,
    detail: words.notEnoughWeeks.detail(sessions, days, wait),
  };
}

function describePace(
  observation: Extract<Observation, { kind: 'pace' }>,
  show: (kg: number) => string,
): Line {
  const rate = show(observation.perWeekKg);
  const goal = GOAL_LABELS[observation.goal];
  const words = t().review.pace;

  switch (observation.verdict) {
    case 'on_track':
      return { heading: words.onTrack.heading, detail: words.onTrack.detail(rate, goal) };
    case 'fast':
      return { heading: words.fast.heading, detail: words.fast.detail(rate, goal) };
    case 'slow':
      return { heading: words.slow.heading, detail: words.slow.detail(rate, goal) };
    case 'wrong_way':
      return {
        heading: words.wrongWay.heading,
        detail: words.wrongWay.detail(rate, observation.perWeekKg < 0, goal),
      };
  }
}

export function describeLink(link: Link, unitSystem: UnitSystem): Line {
  const show = weightShower(unitSystem);
  const words = t().review.links;
  const rate = (perWeek: number): string => words.rate(formatNumber(Math.round(perWeek * 10) / 10));

  switch (link.kind) {
    case 'stall_needs_attendance':
      return {
        heading: words.attendance.heading(link.name),
        detail: words.attendance.detail(rate(link.perWeek), link.target),
      };

    case 'stall_from_deficit':
      return {
        heading: words.deficit.heading(link.name),
        detail: words.deficit.detail(
          describeMark(link.best, link.timed, show),
          show(link.perWeekKg),
        ),
      };

    case 'stall_is_programming':
      return {
        heading: words.programming.heading(link.name),
        detail: words.programming.detail(
          describeMark(link.best, link.timed, show),
          link.sessionsSince,
          planBacksOff(link.best, link.timed) ? words.programming.backOff : words.programming.yours,
        ),
      };

    case 'shortfall_is_attendance':
      return {
        heading: words.shortfall.heading(link.group),
        detail: words.shortfall.detail(rate(link.perWeek), link.target),
      };

    case 'progress_confirmed':
      return {
        heading: words.confirmed.heading,
        detail: words.confirmed.detail(
          link.name,
          describeMark(link.from, link.timed, show),
          describeMark(link.to, link.timed, show),
          show(link.perWeekKg),
        ),
      };
  }
}
