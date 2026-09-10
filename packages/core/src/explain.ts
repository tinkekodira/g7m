/**
 * Putting two observations next to each other and saying what they mean.
 *
 * `reviewTraining` reports facts, each true on its own and each independent of
 * the rest. That leaves the reader to join them, and a stalled squat means
 * three completely different things depending on what is beside it:
 *
 *   stalled + training once a week   -> you are not training it enough
 *   stalled + losing 0.9 kg a week   -> the deficit is doing this, and that is
 *                                       what a deficit does
 *   stalled + showing up + eating    -> now it is the programming
 *
 * Same fact, opposite advice. Nothing new is measured here; the observations
 * are simply read together.
 *
 * ## The rules this file obeys
 *
 * **One explanation per thing.** The three above answer the same question, so
 * exactly one may fire — in that order, because attendance is a more basic
 * cause than fuelling and fuelling is more basic than programming. If somebody
 * trains once a week *and* is cutting hard, the honest first answer is the
 * attendance.
 *
 * **Absence of evidence is not evidence.** No `pace` observation means there
 * are no weigh-ins, not that the weight is steady. "It is your programming"
 * therefore requires a `pace` observation to *exist* and show no meaningful
 * loss — never merely the lack of one. With no weigh-ins the honest output is
 * no link at all.
 *
 * **The signed rate, never the verdict.** `verdict: 'fast'` means losing
 * quickly on a cut and gaining quickly on a bulk, and only the first can stall
 * a lift. Reading `perWeekKg` directly makes the rule mean the same thing
 * whatever the goal, which is the trap this would otherwise walk into.
 *
 * **Explains, never diagnoses.** These say what usually accounts for a
 * pattern, not what definitely caused it, and they are about training and
 * fuelling — never about the body. ADR-0035's rule still holds.
 */
import type { Observation, Tone } from './review.js';
import type { TrainingGoal } from './goals.js';

/**
 * Weekly loss past which a stalled lift is unsurprising, in kilograms.
 *
 * `MEANINGFUL_KG` in `review.ts` is 0.1 — enough to tell a direction apart
 * from water, and far too small to explain anything. A quarter of a kilogram a
 * week is roughly half a percent of bodyweight for an 80 kg lifter, which is
 * the region where strength stops climbing for most people.
 *
 * Deliberately not goal-aware: losing this fast blunts a lift whether it was
 * the plan or not. What differs is the wording, not the arithmetic.
 */
export const LOSING_ENOUGH_KG = 0.25;

export type Link =
  /** Stalled, and not training often enough for it to be about the program. */
  | {
      readonly kind: 'stall_needs_attendance';
      readonly name: string;
      readonly perWeek: number;
      readonly target: number;
    }
  /** Stalled while losing weight fast enough to account for it. */
  | {
      readonly kind: 'stall_from_deficit';
      readonly name: string;
      readonly kg: number;
      readonly perWeekKg: number;
      readonly goal: TrainingGoal;
    }
  /** Stalled with attendance and weight both accounted for. */
  | {
      readonly kind: 'stall_is_programming';
      readonly name: string;
      readonly kg: number;
      readonly sessions: number;
    }
  /** A group behind its target because the sessions are not happening. */
  | {
      readonly kind: 'shortfall_is_attendance';
      readonly group: string;
      readonly perWeek: number;
      readonly target: number;
    }
  /** Climbing, on a weight that is going where it was asked to go. */
  | {
      readonly kind: 'progress_confirmed';
      readonly name: string;
      readonly fromKg: number;
      readonly toKg: number;
      readonly perWeekKg: number;
    };

export type LinkKind = Link['kind'];

/** The first observation of a kind, or undefined. At most one of each exists. */
function pick<K extends Observation['kind']>(
  observations: readonly Observation[],
  kind: K,
): Extract<Observation, { kind: K }> | undefined {
  return observations.find(
    (observation): observation is Extract<Observation, { kind: K }> => observation.kind === kind,
  );
}

/**
 * What the observations say when read together.
 *
 * Empty is a perfectly good answer and the common one — most weeks contain no
 * pair worth joining, and inventing a connection to fill a card is how an app
 * teaches somebody to stop reading it.
 */
export function linksFrom(observations: readonly Observation[]): Link[] {
  // Nothing has been established yet, so nothing can be explained by anything.
  // `too_soon` is returned alone, so this is belt and braces.
  if (pick(observations, 'too_soon') !== undefined) return [];

  const stalled = pick(observations, 'lift_stalled');
  const climbing = pick(observations, 'lift_climbing');
  const attendance = pick(observations, 'consistency');
  const short = pick(observations, 'group_short');
  const pace = pick(observations, 'pace');

  /**
   * Losing weight fast enough to blunt a lift.
   *
   * Undefined when there are no weigh-ins — which is *unknown*, and must not
   * collapse into "steady" anywhere below.
   */
  const losing = pace === undefined ? undefined : pace.perWeekKg <= -LOSING_ENOUGH_KG;

  const links: Link[] = [];

  // ── Why is this lift stuck? Exactly one answer. ───────────────────────
  if (stalled !== undefined) {
    if (attendance !== undefined) {
      links.push({
        kind: 'stall_needs_attendance',
        name: stalled.name,
        perWeek: attendance.perWeek,
        target: attendance.target,
      });
    } else if (losing === true && pace !== undefined) {
      links.push({
        kind: 'stall_from_deficit',
        name: stalled.name,
        kg: stalled.kg,
        perWeekKg: pace.perWeekKg,
        goal: pace.goal,
      });
    } else if (losing === false) {
      // Attendance is fine and the weight is known and not falling, so the two
      // usual explanations are both ruled *out* rather than merely unmentioned.
      links.push({
        kind: 'stall_is_programming',
        name: stalled.name,
        kg: stalled.kg,
        sessions: stalled.sessions,
      });
    }
    // `losing === undefined`: no weigh-ins. Nothing honest to say about why.
  }

  // ── A group behind, and the sessions to blame ─────────────────────────
  if (short !== undefined && attendance !== undefined) {
    links.push({
      kind: 'shortfall_is_attendance',
      group: short.group,
      perWeek: attendance.perWeek,
      target: attendance.target,
    });
  }

  /**
   * ── It is working ────────────────────────────────────────────────────
   *
   * Needs the weight to be going where it was asked to go, which is the one
   * place `verdict` is the right field: `on_track` is defined against the
   * goal's own target range, and that is exactly the question here.
   *
   * Silent when attendance is below target. "This is working, leave it alone"
   * next to "you are training once a week" is the app contradicting itself in
   * two lines.
   */
  if (climbing !== undefined && attendance === undefined && pace?.verdict === 'on_track') {
    links.push({
      kind: 'progress_confirmed',
      name: climbing.name,
      fromKg: climbing.fromKg,
      toKg: climbing.toKg,
      perWeekKg: pace.perWeekKg,
    });
  }

  return links;
}

/**
 * How loudly a link reads.
 *
 * `stall_from_deficit` is deliberately neutral rather than a warning. A lift
 * flattening during a cut is what a cut does — reporting it in red would be
 * telling somebody that the thing going to plan is a problem.
 */
export function toneOfLink(link: Link): Tone {
  switch (link.kind) {
    case 'progress_confirmed':
      return 'good';
    case 'stall_from_deficit':
      return 'neutral';
    case 'stall_needs_attendance':
    case 'stall_is_programming':
    case 'shortfall_is_attendance':
      return 'warning';
  }
}

/**
 * The observations a link has already spoken for.
 *
 * A card showing "your squat is stuck, and your weight explains it" directly
 * above "your squat has not moved" is saying one thing twice and looks like a
 * bug. The link supersedes its *subject* only — the stalled lift, the short
 * group, the climbing lift.
 *
 * What it does not supersede is the supporting fact. "You trained 1.4 times a
 * week" and "you are losing 0.9 kg a week" are worth reading on their own,
 * and leaving them is what lets somebody check the link's working rather than
 * take its word for it.
 */
export function supersededBy(links: readonly Link[]): Set<Observation['kind']> {
  const spoken = new Set<Observation['kind']>();

  for (const link of links) {
    switch (link.kind) {
      case 'stall_needs_attendance':
      case 'stall_from_deficit':
      case 'stall_is_programming':
        spoken.add('lift_stalled');
        break;
      case 'shortfall_is_attendance':
        spoken.add('group_short');
        break;
      case 'progress_confirmed':
        spoken.add('lift_climbing');
        break;
    }
  }

  return spoken;
}
