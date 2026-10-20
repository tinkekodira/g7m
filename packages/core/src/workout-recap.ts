import { boutCalories, type Bout, type CardioKind } from './cardio.js';
import { countSets, totalVolumeKg, type LoggedSet } from './load.js';
import { sessionBests, type LiftMark } from './lift-progress.js';
import { bestsFrom, recordsInSession, type SetRecord } from './records.js';
import { trainingMinutes, type HistoricalSet } from './progress.js';
import type { PrimaryWork } from './workout-title.js';
import {
  achievements,
  type Achievement,
  type AchievementInput,
  type AchievementSession,
} from './achievements.js';
import { xpLedger, levelFor, type XpSession } from './xp.js';

export interface RecapSet extends LoggedSet {
  readonly id: string;
  readonly completedAt: Date | null;
  readonly bout: Bout;
}
export interface RecapBlock {
  readonly exerciseId: string;
  readonly isTimeBased: boolean;
  readonly cardioKind: CardioKind | null;
  readonly sets: readonly RecapSet[];
}
export interface RecapComparison {
  readonly exerciseId: string;
  readonly timed: boolean;
  readonly current: LiftMark | null;
  readonly previous: LiftMark | null;
  readonly records: readonly SetRecord[];
}
export interface WorkoutRecap {
  readonly elapsedSeconds: number | null;
  readonly trainingMinutes: number | null;
  readonly exercises: number;
  readonly sets: number;
  readonly volume: ReturnType<typeof totalVolumeKg>;
  readonly comparisons: readonly RecapComparison[];
  readonly muscles: readonly { group: string; sets: number; share: number }[];
  readonly cardioSeconds: number;
  readonly cardioKcal: number;
}

/** All facts are rebuilt from saved rows. There is no second statistics store. */
export function buildWorkoutRecap(input: {
  readonly sessionId: string;
  readonly startedAt: Date;
  readonly endedAt: Date;
  readonly backdated: boolean;
  readonly bodyweightKg: number | null;
  readonly blocks: readonly RecapBlock[];
  readonly history: readonly HistoricalSet[];
  readonly work: readonly PrimaryWork[];
}): WorkoutRecap {
  const strength = input.blocks.filter((b) => b.cardioKind === null);
  const sets = strength.flatMap((b) => b.sets);
  const earlier = input.history.filter(
    (s) => s.sessionId !== input.sessionId && s.performedAt < input.startedAt,
  );
  const comparisons: RecapComparison[] = [];
  const ids = new Set(strength.map((b) => b.exerciseId));
  for (const exerciseId of ids) {
    const own = strength.filter((b) => b.exerciseId === exerciseId);
    const ownSets = own.flatMap((b) => b.sets);
    if (!ownSets.some((s) => s.isCompleted && s.setType !== 'warmup')) continue;
    const timed = own[0]?.isTimeBased === true;
    const current =
      sessionBests(
        ownSets.map((s) => ({
          ...s,
          sessionId: input.sessionId,
          exerciseId,
          performedAt: input.startedAt,
          bodyweightKg: input.bodyweightKg,
        })),
      )[0]?.best ?? null;
    const history = earlier.filter((s) => s.exerciseId === exerciseId);
    const previous = sessionBests(history).at(-1)?.best ?? null;
    comparisons.push({
      exerciseId,
      timed,
      current,
      previous,
      records: timed
        ? []
        : recordsInSession({
            sets: ownSets.filter((s) => s.reps > 0),
            bodyweightKg: input.bodyweightKg,
            bests: bestsFrom(history),
          }),
    });
  }

  const movers = new Map<string, number>();
  for (const entry of input.work)
    movers.set(entry.exerciseId, (movers.get(entry.exerciseId) ?? 0) + 1);
  const groups = new Map<string, number>();
  for (const entry of input.work)
    groups.set(
      entry.group,
      (groups.get(entry.group) ?? 0) + entry.sets / (movers.get(entry.exerciseId) ?? 1),
    );
  const total = [...groups.values()].reduce((sum, n) => sum + n, 0);

  let cardioSeconds = 0;
  let cardioKcal = 0;
  const times: Date[] = [];
  for (const block of input.blocks)
    for (const set of block.sets) {
      if (!set.isCompleted || set.setType === 'warmup') continue;
      if (set.completedAt !== null) times.push(set.completedAt);
      if (block.cardioKind !== null) {
        const seconds = Math.max(0, set.bout.durationSeconds ?? 0);
        cardioSeconds += seconds;
        cardioKcal += boutCalories(block.cardioKind, set.bout, input.bodyweightKg)?.kcal ?? 0;
        if (set.completedAt !== null && seconds > 0)
          times.push(new Date(set.completedAt.getTime() - seconds * 1000));
      }
    }
  return {
    elapsedSeconds: input.backdated
      ? null
      : Math.max(0, Math.floor((input.endedAt.getTime() - input.startedAt.getTime()) / 1000)),
    trainingMinutes: input.backdated ? null : trainingMinutes(times),
    exercises: new Set(
      input.blocks
        .filter((b) => b.sets.some((s) => s.isCompleted && s.setType !== 'warmup'))
        .map((b) => b.exerciseId),
    ).size,
    sets: countSets(sets),
    volume: totalVolumeKg(sets, input.bodyweightKg),
    comparisons,
    muscles: [...groups]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([group, n]) => ({ group, sets: n, share: total > 0 ? n / total : 0 })),
    cardioSeconds,
    cardioKcal,
  };
}

export interface RecapRewards {
  readonly xp: number;
  readonly levelBefore: number;
  readonly levelAfter: number;
  readonly achievements: readonly Achievement[];
}

/** Replay chronological prefixes so later sessions cannot leak into an old recap. */
export function workoutRecapRewards(
  input: Omit<AchievementInput, 'sessions'> & {
    readonly sessionId: string;
    readonly sessions: readonly (AchievementSession & XpSession)[];
  },
): RecapRewards {
  const ordered = input.sessions
    .filter((s) => s.finished)
    .sort(
      (a, b) =>
        a.startedAt.getTime() - b.startedAt.getTime() || a.sessionId.localeCompare(b.sessionId),
    );
  const index = ordered.findIndex((s) => s.sessionId === input.sessionId);
  const target = ordered[index];
  if (target === undefined) return { xp: 0, levelBefore: 1, levelAfter: 1, achievements: [] };
  const prefix = (sessions: typeof ordered) => {
    const ids = new Set(sessions.map((s) => s.sessionId));
    const sets = input.sets.filter((s) => ids.has(s.sessionId));
    const bouts = input.bouts.filter((b) => ids.has(b.sessionId));
    const goals = input.goals.filter((g) => g.startedAt <= target.startedAt);
    const list = achievements({ ...input, sessions, sets, bouts, goals }, target.startedAt);
    const ledger = xpLedger({
      sessions,
      sets,
      bouts,
      goals,
      achievements: list,
      weekStartsOn: input.weekStartsOn,
    });
    return { list, ledger };
  };
  const before = prefix(ordered.slice(0, index));
  const after = prefix(ordered.slice(0, index + 1));
  const earned = new Set(before.list.filter((a) => a.earnedAt !== null).map((a) => a.key));
  return {
    xp: Math.max(0, after.ledger.total - before.ledger.total),
    levelBefore: levelFor(before.ledger.total).level,
    levelAfter: levelFor(after.ledger.total).level,
    achievements: after.list.filter((a) => !a.secret && a.earnedAt !== null && !earned.has(a.key)),
  };
}
