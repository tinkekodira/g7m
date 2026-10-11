/**
 * One friend's page: the head-to-head and the list of their workouts.
 *
 * The comparison rule is core's (`sharedLifts`, `compareLifts`). This decides
 * what the page says about it — which lift it opens on, how long each bar is,
 * and the sentence under them, which is the part somebody actually reads.
 */
import {
  compareLifts,
  describeWorkoutDay,
  sharedLifts,
  type BestLift,
  type Standing,
  type UnitSystem,
} from '@g7m/core';
import type { TrainingHeat } from '../lib/db/use-trained-body.js';
import type {
  FriendBest,
  FriendProfile,
  FriendRoutine,
  WorkoutSummary,
} from '../lib/friends/api.js';
import type { BestLift as ProfileBestLift } from './profile-view.js';
import { summaryDuration, summaryTitle, weightText, type Movers } from './friends-view.js';

export interface HeadToHeadOption {
  readonly exerciseId: string;
  readonly name: string;
}

export interface HeadToHeadComparison {
  readonly mine: string;
  readonly theirs: string;
  /** Each bar's length as a share of the longer one, 0 to 1. */
  readonly mineShare: number;
  readonly theirsShare: number;
  readonly standing: Standing;
  /** "You're 10 kg ahead", "Alex is 5 kg ahead", "Level". */
  readonly verdict: string;
}

export interface HeadToHeadView {
  readonly options: readonly HeadToHeadOption[];
  readonly selectedId: string | null;
  readonly comparison: HeadToHeadComparison | null;
}

export function headToHead(input: {
  readonly mine: ReadonlyMap<string, BestLift>;
  readonly theirs: readonly FriendBest[];
  readonly names: ReadonlyMap<string, string>;
  /** The bench press's id, which the comparison opens on when you both have it. */
  readonly preferredId: string | null;
  /** What was picked, if anything has been. */
  readonly chosenId: string | null;
  readonly unitSystem: UnitSystem;
  readonly friend: string;
}): HeadToHeadView {
  const theirs = new Map(
    input.theirs.map((best) => [best.exerciseId, { bestKg: best.bestKg, lastAt: best.lastAt }]),
  );
  const { lifts, defaultId } = sharedLifts(input.mine, theirs, input.preferredId);
  const options = lifts.map((lift) => ({
    exerciseId: lift.exerciseId,
    name: input.names.get(lift.exerciseId) ?? 'Unknown exercise',
  }));

  const selectedId =
    input.chosenId !== null && lifts.some((lift) => lift.exerciseId === input.chosenId)
      ? input.chosenId
      : defaultId;
  const selected = lifts.find((lift) => lift.exerciseId === selectedId);
  const comparison =
    selected === undefined
      ? null
      : compareLifts(selected.mineKg, selected.theirsKg, input.unitSystem);

  if (selected === undefined || comparison === null) {
    return { options, selectedId: null, comparison: null };
  }

  const longest = Math.max(selected.mineKg, selected.theirsKg);
  const gap = `${String(comparison.gap.value)} ${comparison.gap.unit}`;
  return {
    options,
    selectedId,
    comparison: {
      mine: weightText(selected.mineKg, input.unitSystem),
      theirs: weightText(selected.theirsKg, input.unitSystem),
      mineShare: longest > 0 ? selected.mineKg / longest : 0,
      theirsShare: longest > 0 ? selected.theirsKg / longest : 0,
      standing: comparison.standing,
      verdict:
        comparison.standing === 'ahead'
          ? `You’re ${gap} ahead`
          : comparison.standing === 'behind'
            ? `${input.friend} is ${gap} ahead`
            : 'Level',
    },
  };
}

export interface RecentRow {
  readonly sessionId: string;
  readonly title: string;
  readonly when: string;
  readonly duration: string | null;
  readonly exercises: string;
}

export function recentRows(
  recent: readonly WorkoutSummary[],
  now: Date,
  movers: Movers,
): readonly RecentRow[] {
  return recent.map((summary) => ({
    sessionId: summary.id,
    title: summaryTitle(summary, movers),
    when: describeWorkoutDay(summary.startedAt, now),
    duration: summaryDuration(summary),
    exercises:
      summary.work.length === 1 ? '1 exercise' : `${String(summary.work.length)} exercises`,
  }));
}

/**
 * A friend's heat, as the body card draws it: the server's share of the peak
 * per muscle, and the hardest-worked few named from this phone's catalogue.
 * Their order is the server's, hardest first. ADR-0117.
 */
export function friendHeat(
  profile: Pick<FriendProfile, 'heat' | 'trained'>,
  muscleNames: ReadonlyMap<string, string>,
  topCount: number,
): TrainingHeat {
  const worked = profile.heat.filter((muscle) => muscle.intensity > 0);
  return {
    intensity: new Map(worked.map((muscle) => [muscle.slug, muscle.intensity])),
    trained: profile.trained,
    top: worked
      .flatMap((muscle) => {
        const name = muscleNames.get(muscle.slug);
        return name === undefined ? [] : [{ slug: muscle.slug, name }];
      })
      .slice(0, topCount),
  };
}

/** A friend's best lifts as the card lists them: heaviest first, ties by name. */
export function friendBestLifts(
  bests: FriendProfile['bests'],
  names: ReadonlyMap<string, string>,
): ProfileBestLift[] {
  return bests
    .map((best) => ({
      exerciseId: best.exerciseId,
      name: names.get(best.exerciseId) ?? 'Unknown exercise',
      valueKg: best.bestKg,
      achievedAt: best.achievedAt,
    }))
    .sort((a, b) => b.valueKg - a.valueKg || a.name.localeCompare(b.name, 'en'));
}

/** "4 exercises · Bench Press, Incline Press, Fly" for a routine's row. */
export function routineLine(routine: FriendRoutine, names: ReadonlyMap<string, string>): string {
  const count = routine.exercises.length;
  const total = count === 1 ? '1 exercise' : `${String(count)} exercises`;
  if (count === 0) return total;
  const listed = routine.exercises
    .map((movement) => names.get(movement.exerciseId) ?? 'Unknown exercise')
    .join(', ');
  return `${total} · ${listed}`;
}

/** "3 × 8–12", or "3 × 5" for a fixed number. */
export function targetText(movement: FriendRoutine['exercises'][number]): string {
  const reps =
    movement.targetRepHigh > movement.targetRepLow
      ? `${String(movement.targetRepLow)}–${String(movement.targetRepHigh)}`
      : String(movement.targetRepLow);
  return `${String(movement.targetSets)} × ${reps}`;
}
