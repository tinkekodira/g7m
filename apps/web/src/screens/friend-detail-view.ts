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
import type { FriendBest, WorkoutSummary } from '../lib/friends/api.js';
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
