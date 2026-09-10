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
import {
  GOAL_LABELS,
  toDisplayWeight,
  type Link,
  type Observation,
  type UnitSystem,
} from '@g7m/core';

export interface Line {
  /** A few words. The thing being reported on. */
  readonly heading: string;
  /** One sentence. What happened, and what it means. */
  readonly detail: string;
}

/** Muscle group slugs read as words in a sentence, not as identifiers. */
const GROUP_WORDS: Record<string, string> = {
  chest: 'chest',
  back: 'back',
  shoulders: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  quads: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes',
  calves: 'calves',
  core: 'core',
};

export function describeObservation(observation: Observation, unitSystem: UnitSystem): Line {
  const show = (kg: number): string => {
    const display = toDisplayWeight(Math.abs(kg), unitSystem);
    return `${String(display.value)} ${display.unit}`;
  };
  const group = (slug: string): string => GROUP_WORDS[slug] ?? slug;

  switch (observation.kind) {
    case 'too_soon':
      return {
        heading: 'Not enough to go on yet',
        detail: `${String(observation.sessions)} of ${String(observation.needed)} sessions logged. Once there are a few, this is where you will find out how it is actually going.`,
      };

    case 'consistency':
      return {
        heading: 'You are training less than you planned for',
        // Not "you should train more". The plan was built to fit the number
        // they gave, so the honest framing is that the two disagree — and
        // changing the plan is as valid an answer as changing the week.
        detail: `About ${String(observation.perWeek)} sessions a week over the last ${String(observation.weeks)}, against the ${String(observation.target)} you set. The plan is built to fit ${String(observation.target)}; if that is not the week you have, it is worth changing the number.`,
      };

    case 'group_short':
      return {
        heading: `Your ${group(observation.group)} is behind`,
        detail: `${String(observation.perWeek)} sets a week against a target of ${String(observation.target)}. It is the furthest behind of anything you train, which makes it the one thing worth adding first.`,
      };

    case 'group_over':
      return {
        heading: `A lot of ${group(observation.group)}`,
        detail: `${String(observation.perWeek)} sets a week against a target of ${String(observation.target)}. Not harmful, but past a point the extra sets stop paying for the recovery they cost.`,
      };

    case 'lift_climbing':
      return {
        heading: `Your ${observation.name.toLowerCase()} is going up`,
        detail: `${show(observation.fromKg)} to ${show(observation.toKg)} across ${String(observation.sessions)} sessions. That is the thing working.`,
      };

    case 'lift_stalled':
      return {
        heading: `Your ${observation.name.toLowerCase()} has not moved`,
        detail: `Still ${show(observation.kg)} after ${String(observation.sessions)} sessions. A plateau usually breaks by backing off about ten percent and running at it again, which the plan will do for you after three short sessions in a row.`,
      };

    case 'pace':
      return describePace(observation, show);
  }
}

function describePace(
  observation: Extract<Observation, { kind: 'pace' }>,
  show: (kg: number) => string,
): Line {
  const rate = show(observation.perWeekKg);
  const goal = GOAL_LABELS[observation.goal].toLowerCase();
  const direction = observation.perWeekKg < 0 ? 'down' : 'up';

  switch (observation.verdict) {
    case 'on_track':
      return {
        heading: 'Your weight is doing what you asked it to',
        detail: `${rate} a week, which is inside the range for ${goal}. Nothing to change.`,
      };
    case 'fast':
      return {
        heading: 'Your weight is moving faster than the goal wants',
        // Named as a cost, not a scolding. Somebody cutting hard usually knows
        // they are; what they may not know is what it costs.
        detail: `${rate} a week. Faster than the range for ${goal} — which usually means giving up strength on the way, and the training here is meant to keep it.`,
      };
    case 'slow':
      return {
        heading: 'Your weight is barely moving',
        detail: `${rate} a week, which is short of the range for ${goal}. The training is not what changes this one.`,
      };
    case 'wrong_way':
      return {
        heading: 'Your weight is going the other way',
        detail: `${rate} a week ${direction}, and you asked for ${goal}. Either the goal has changed or the week has; both are worth a look.`,
      };
  }
}

/**
 * How a joined-up observation is worded.
 *
 * The register shifts here, and deliberately. Every line above is a statement
 * about one thing that happened. A link is a statement about *two* — and the
 * only reason to print it is to say what they mean together, so these are the
 * lines that are allowed to draw a conclusion.
 *
 * They still do not diagnose. "Usually", "most of", "worth" — a stalled lift
 * beside a fast cut is very probably the cut and is not certainly the cut, and
 * a sentence that pretends otherwise is one the reader catches out eventually.
 */
export function describeLink(link: Link, unitSystem: UnitSystem): Line {
  const show = (kg: number): string => {
    const display = toDisplayWeight(Math.abs(kg), unitSystem);
    return `${String(display.value)} ${display.unit}`;
  };
  const group = (slug: string): string => GROUP_WORDS[slug] ?? slug;
  const rate = (perWeek: number): string => `${String(Math.round(perWeek * 10) / 10)} a week`;

  switch (link.kind) {
    case 'stall_needs_attendance':
      return {
        heading: `Your ${link.name.toLowerCase()} is stuck, and the sessions are why`,
        detail: `You have trained ${rate(link.perWeek)} against the ${String(link.target)} you set. A lift needs to come round often enough to be pushed — this one is not a programming problem yet.`,
      };

    case 'stall_from_deficit':
      return {
        heading: `Your ${link.name.toLowerCase()} is stuck, and your weight explains it`,
        detail: `Still ${show(link.kg)}, while you are losing ${show(link.perWeekKg)} a week. Strength usually flattens in a deficit — holding the number is the win here, so this is worth leaving alone rather than rebuilding the plan around.`,
      };

    case 'stall_is_programming':
      return {
        heading: `Your ${link.name.toLowerCase()} is stuck, and nothing else explains it`,
        detail: `Still ${show(link.kg)} after ${String(link.sessions)} sessions, with the sessions happening and your weight where you asked it to be. That leaves the training: back off about ten percent and run at it again, which the plan does for you after three short sessions.`,
      };

    case 'shortfall_is_attendance':
      return {
        heading: `Your ${group(link.group)} is behind because the sessions are`,
        detail: `Training ${rate(link.perWeek)} against the ${String(link.target)} you set. Adding volume to a plan you are not getting to will not fix this one — the attendance comes first.`,
      };

    case 'progress_confirmed':
      return {
        heading: 'This is working',
        detail: `Your ${link.name.toLowerCase()} went ${show(link.fromKg)} to ${show(link.toKg)}, and your weight is moving at ${show(link.perWeekKg)} a week, which is where you asked for it. Nothing here needs changing.`,
      };
  }
}
