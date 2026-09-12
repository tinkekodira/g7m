import { describe, expect, it } from 'vitest';
import { LOSING_ENOUGH_KG, linksFrom, supersededBy, toneOfLink, type Link } from './explain.js';
import type { Observation } from './review.js';

const STALLED: Observation = {
  kind: 'lift_stalled',
  exerciseId: 'squat',
  name: 'Barbell Back Squat',
  best: { loadType: 'external', weightKg: 100, reps: 5 },
  timed: false,
  sessionsSince: 3,
  daysSince: 24,
};

const CLIMBING: Observation = {
  kind: 'lift_climbing',
  exerciseId: 'bench',
  name: 'Barbell Bench Press',
  from: { loadType: 'external', weightKg: 60, reps: 8 },
  to: { loadType: 'external', weightKg: 70, reps: 8 },
  timed: false,
  sessions: 5,
};

const SKIPPING: Observation = { kind: 'consistency', perWeek: 1.4, target: 4, weeks: 3 };

const BACK_SHORT: Observation = { kind: 'group_short', group: 'back', perWeek: 4, target: 16 };

/** A weigh-in trend, at a signed rate. Negative is losing. */
function pace(perWeekKg: number, verdict: 'on_track' | 'slow' | 'fast' | 'wrong_way'): Observation {
  return { kind: 'pace', verdict, perWeekKg, goal: 'lose_fat' };
}

const kinds = (links: readonly Link[]): string[] => links.map((link) => link.kind);

describe('why a lift is stuck', () => {
  /**
   * The whole point of the feature. One stalled squat, three sets of
   * surroundings, three different answers — and never more than one.
   */
  it('blames attendance when the sessions are not happening', () => {
    const links = linksFrom([STALLED, SKIPPING, pace(-0.6, 'on_track')]);
    expect(kinds(links)).toContain('stall_needs_attendance');
  });

  it('blames the deficit when they are showing up and losing weight fast', () => {
    const links = linksFrom([STALLED, pace(-0.9, 'fast')]);
    expect(kinds(links)).toContain('stall_from_deficit');
  });

  it('blames the programming when attendance and weight are both accounted for', () => {
    const links = linksFrom([STALLED, pace(0, 'on_track')]);
    expect(kinds(links)).toContain('stall_is_programming');
  });

  /**
   * Three explanations of the same fact must never appear together — that is
   * an app arguing with itself.
   */
  it('gives exactly one reason, never two', () => {
    const everything = linksFrom([STALLED, SKIPPING, BACK_SHORT, pace(-0.9, 'fast')]);
    const reasons = kinds(everything).filter((kind) => kind.startsWith('stall_'));
    expect(reasons).toHaveLength(1);
  });

  /** Attendance is the more basic cause, so it wins when both are true. */
  it('prefers attendance over the deficit when both would fit', () => {
    const links = linksFrom([STALLED, SKIPPING, pace(-0.9, 'fast')]);
    expect(kinds(links)).toContain('stall_needs_attendance');
    expect(kinds(links)).not.toContain('stall_from_deficit');
  });
});

describe('what it refuses to say', () => {
  /**
   * The trap this feature could most easily walk into. No `pace` observation
   * means there are no weigh-ins — *unknown*, not *steady*. Concluding "it is
   * your programming" from a missing line is inventing evidence.
   */
  it('says nothing about a stall when there are no weigh-ins', () => {
    expect(linksFrom([STALLED])).toEqual([]);
    expect(linksFrom([STALLED, BACK_SHORT])).toEqual([]);
  });

  it('says nothing at all before there is enough logged', () => {
    expect(
      linksFrom([{ kind: 'too_soon', sessions: 2, needed: 4, days: 3, neededDays: 12 }]),
    ).toEqual([]);
  });

  it('says nothing when there is nothing to join', () => {
    expect(linksFrom([])).toEqual([]);
    expect(linksFrom([pace(0, 'on_track')])).toEqual([]);
    expect(linksFrom([BACK_SHORT])).toEqual([]);
  });
});

describe('reading the rate rather than the verdict', () => {
  /**
   * The other trap. `verdict: 'fast'` is "faster than target in the goal's own
   * direction" — losing quickly on a cut, *gaining* quickly on a bulk. Only
   * the first can stall a lift, so the rule reads the signed rate instead.
   */
  it('does not blame a surplus for a stall', () => {
    const gainingFast: Observation = {
      kind: 'pace',
      verdict: 'fast',
      perWeekKg: 0.7,
      goal: 'build_muscle',
    };
    const links = linksFrom([STALLED, gainingFast]);

    expect(kinds(links)).not.toContain('stall_from_deficit');
    expect(kinds(links)).toContain('stall_is_programming');
  });

  /**
   * And the mirror: losing weight on a *gaining* goal reads as `wrong_way`,
   * not `fast`, and is exactly the case where the fuelling is the answer.
   */
  it('blames an unintended deficit on a gaining goal', () => {
    const slipping: Observation = {
      kind: 'pace',
      verdict: 'wrong_way',
      perWeekKg: -0.5,
      goal: 'build_muscle',
    };
    expect(kinds(linksFrom([STALLED, slipping]))).toContain('stall_from_deficit');
  });

  /**
   * Losing at exactly the rate that was asked for still explains a stall —
   * that is what a cut does, and saying so is the useful part. A rule keyed on
   * `verdict !== 'on_track'` would have missed the most common case there is.
   */
  it('blames a deficit that is going entirely to plan', () => {
    expect(kinds(linksFrom([STALLED, pace(-0.6, 'on_track')]))).toContain('stall_from_deficit');
  });

  it('treats drift too small to matter as not losing', () => {
    const barely = -(LOSING_ENOUGH_KG / 2);
    expect(kinds(linksFrom([STALLED, pace(barely, 'slow')]))).toContain('stall_is_programming');
  });

  it('is inclusive at the threshold itself', () => {
    expect(kinds(linksFrom([STALLED, pace(-LOSING_ENOUGH_KG, 'slow')]))).toContain(
      'stall_from_deficit',
    );
  });
});

describe('a group behind its target', () => {
  it('names the attendance when the sessions explain it', () => {
    expect(kinds(linksFrom([BACK_SHORT, SKIPPING, pace(0, 'on_track')]))).toContain(
      'shortfall_is_attendance',
    );
  });

  /**
   * Turning up as promised and still short is a real finding about the plan,
   * and blaming attendance for it would be wrong.
   */
  it('stays quiet when they are turning up as promised', () => {
    expect(kinds(linksFrom([BACK_SHORT, pace(0, 'on_track')]))).not.toContain(
      'shortfall_is_attendance',
    );
  });
});

describe('confirming that it is working', () => {
  it('says so when a lift is climbing and the weight is on target', () => {
    expect(kinds(linksFrom([CLIMBING, pace(0.3, 'on_track')]))).toContain('progress_confirmed');
  });

  /**
   * "This is working, leave it alone" beside "you are training once a week" is
   * the app contradicting itself inside one card.
   */
  it('will not call it working while attendance is short', () => {
    expect(kinds(linksFrom([CLIMBING, SKIPPING, pace(0.3, 'on_track')]))).not.toContain(
      'progress_confirmed',
    );
  });

  it('needs the weight to actually be on target, not merely known', () => {
    expect(kinds(linksFrom([CLIMBING, pace(-0.9, 'fast')]))).not.toContain('progress_confirmed');
    expect(kinds(linksFrom([CLIMBING]))).toEqual([]);
  });

  /** One lift climbing and another stuck is an ordinary week, not a paradox. */
  it('can confirm one lift while explaining another', () => {
    const links = kinds(linksFrom([CLIMBING, STALLED, pace(0.3, 'on_track')]));
    expect(links).toContain('progress_confirmed');
    expect(links).toContain('stall_is_programming');
  });
});

describe('the numbers it carries', () => {
  /** The copy prints these, so a link that loses them prints a blank. */
  it('carries what each sentence needs to say', () => {
    const [attendanceLink] = linksFrom([STALLED, SKIPPING, pace(-0.6, 'on_track')]);
    expect(attendanceLink).toMatchObject({
      kind: 'stall_needs_attendance',
      name: 'Barbell Back Squat',
      perWeek: 1.4,
      target: 4,
    });

    const [deficitLink] = linksFrom([STALLED, pace(-0.9, 'fast')]);
    expect(deficitLink).toMatchObject({
      kind: 'stall_from_deficit',
      name: 'Barbell Back Squat',
      best: { loadType: 'external', weightKg: 100, reps: 5 },
      timed: false,
      perWeekKg: -0.9,
      goal: 'lose_fat',
    });

    const [programmingLink] = linksFrom([STALLED, pace(0, 'on_track')]);
    expect(programmingLink).toMatchObject({
      kind: 'stall_is_programming',
      best: { loadType: 'external', weightKg: 100, reps: 5 },
      sessionsSince: 3,
    });

    const [working] = linksFrom([CLIMBING, pace(0.3, 'on_track')]);
    expect(working).toMatchObject({
      kind: 'progress_confirmed',
      from: { weightKg: 60, reps: 8 },
      to: { weightKg: 70, reps: 8 },
      timed: false,
    });
  });
});

describe('how a link reads', () => {
  /**
   * A lift flattening during a cut is what a cut does. Printing that in red
   * tells somebody the thing going to plan is a problem.
   */
  it('does not call an expected stall a warning', () => {
    const [link] = linksFrom([STALLED, pace(-0.9, 'fast')]);
    expect(link !== undefined && toneOfLink(link)).toBe('neutral');
  });

  it('warns where something is actually wrong, and praises where it is not', () => {
    const [attendance] = linksFrom([STALLED, SKIPPING, pace(-0.6, 'on_track')]);
    expect(attendance !== undefined && toneOfLink(attendance)).toBe('warning');

    const [working] = linksFrom([CLIMBING, pace(0.3, 'on_track')]);
    expect(working !== undefined && toneOfLink(working)).toBe('good');
  });
});

describe('what a link speaks for', () => {
  /**
   * "Your squat is stuck, and your weight explains it" directly above "your
   * squat has not moved" is one thing said twice, and reads as a bug.
   */
  it('speaks for the thing it is about', () => {
    expect(supersededBy(linksFrom([STALLED, pace(-0.9, 'fast')]))).toContain('lift_stalled');
    expect(supersededBy(linksFrom([BACK_SHORT, SKIPPING, pace(0, 'on_track')]))).toContain(
      'group_short',
    );
    expect(supersededBy(linksFrom([CLIMBING, pace(0.3, 'on_track')]))).toContain('lift_climbing');
  });

  /**
   * But not for the supporting fact. "You are losing 0.9 kg a week" is worth
   * reading on its own, and leaving it is what lets somebody check the link's
   * working instead of taking its word.
   */
  it('leaves the fact it reasoned from on the screen', () => {
    const spoken = supersededBy(linksFrom([STALLED, SKIPPING, pace(-0.9, 'fast')]));
    expect(spoken).not.toContain('consistency');
    expect(spoken).not.toContain('pace');
  });

  it('speaks for nothing when there are no links', () => {
    expect(supersededBy([]).size).toBe(0);
  });
});
