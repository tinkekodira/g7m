import type { ExperienceLevel, TrainingGoal } from './goals.js';
import type { LoggedSet } from './load.js';
import type { HistoricalSet } from './progress.js';
import { prescriptionFor } from './programming.js';
import { trainingProfile, type TrainingProfile } from './recommendation-catalogue.js';

/** Product heuristics, not measurements of stimulus or individual recovery. */
export const RECOMMENDATION_POLICY = {
  completedExercises: 3,
  meaningfulSets: 2,
  assistance: 0.5,
  proposedSets: 3,
  recentDays: 7,
  patternDays: 90,
  historySessions: 3,
  historyMinimum: 2,
} as const;
const DAY = 86_400_000;

export interface RecommendationExercise {
  readonly id: string;
  readonly slug: string;
  readonly equipment: readonly string[];
  readonly favourite: boolean;
  readonly order: number;
}
export interface RecommendationBlock {
  readonly exerciseId: string;
  readonly sets: readonly LoggedSet[];
}
export interface ExerciseRecommendation {
  readonly exerciseId: string;
  readonly reason: 'missing-group' | 'movement-variety' | 'regional-variety';
  readonly group: string;
  readonly emphasis: string;
}
export interface RecommendationInput {
  readonly catalogue: readonly RecommendationExercise[];
  /** Already filtered/searched by the library. */
  readonly eligibleIds: ReadonlySet<string>;
  readonly blocks: readonly RecommendationBlock[];
  readonly history: readonly HistoricalSet[];
  readonly experience: ExperienceLevel | null;
  readonly goal: TrainingGoal;
  readonly now: Date;
  readonly sessionId: string;
  readonly selectedIds?: ReadonlySet<string>;
}

function top(set: LoggedSet): boolean {
  return set.setType !== 'warmup' && set.setType !== 'dropset';
}
function done(set: LoggedSet): boolean {
  return top(set) && set.isCompleted && set.reps > 0;
}
function add(map: Map<string, number>, key: string, value: number): void {
  map.set(key, (map.get(key) ?? 0) + value);
}
function credit(map: Map<string, number>, p: TrainingProfile, sets: number): void {
  for (const group of p.direct) add(map, group, sets);
  for (const group of p.assistance) add(map, group, sets * RECOMMENDATION_POLICY.assistance);
}
const FAMILY: Readonly<Record<string, string>> = {
  chest: 'push',
  shoulders: 'push',
  triceps: 'push',
  back: 'pull',
  biceps: 'pull',
  rear_delts: 'pull',
  traps: 'pull',
  forearms: 'pull',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  adductors: 'legs',
  core: 'core',
};
function family(groups: ReadonlySet<string>): string | null {
  const families = new Set([...groups].map((g) => FAMILY[g]).filter((g) => g !== undefined));
  return families.size === 1 ? ([...families][0] ?? null) : null;
}

export function recommendExercises(input: RecommendationInput): ExerciseRecommendation[] {
  const { meaningfulSets, proposedSets } = RECOMMENDATION_POLICY;
  const catalogue = new Map(input.catalogue.map((e) => [e.id, e]));
  // A pending superset selection is queued work before Confirm writes it.
  const queuedBlocks = [
    ...input.blocks,
    ...[...(input.selectedIds ?? [])]
      .filter((id) => !input.blocks.some((b) => b.exerciseId === id))
      .map((exerciseId) => ({ exerciseId, sets: [] as readonly LoggedSet[] })),
  ];
  const blocks = new Map<string, LoggedSet[]>();
  for (const block of queuedBlocks)
    blocks.set(block.exerciseId, [...(blocks.get(block.exerciseId) ?? []), ...block.sets]);
  const complete = [...blocks.values()].filter(
    (sets) =>
      sets.some(done) &&
      sets.filter((s) => s.setType !== 'warmup').every((s) => s.isCompleted && s.reps > 0),
  ).length;
  if (complete < RECOMMENDATION_POLICY.completedExercises) return [];
  const prescription = prescriptionFor(input.goal, input.experience);
  const plannedSets = queuedBlocks.reduce(
    (sum, { sets }) =>
      sum + Math.max(sets.filter(top).length, sets.filter(top).length === 0 ? proposedSets : 0),
    0,
  );
  if (
    queuedBlocks.length + 1 > prescription.maxExercisesPerSession ||
    plannedSets + proposedSets > prescription.maxSetsPerSession
  )
    return [];

  const direct = new Map<string, number>();
  const planned = new Map<string, number>();
  const weekly = new Map<string, number>();
  const emphases = new Map<string, number>();
  const recentEmphases = new Map<string, number>();
  const knownEquipment = new Set<string>();
  for (const { exerciseId: id, sets } of queuedBlocks) {
    const exercise = catalogue.get(id);
    if (exercise === undefined) continue;
    for (const equipment of exercise.equipment) knownEquipment.add(equipment);
    const p = trainingProfile(exercise.slug);
    if (p === undefined) continue;
    const completed = sets.filter(done).length;
    for (const group of p.direct) add(direct, group, completed);
    const plannedCount = Math.max(
      sets.filter(top).length,
      sets.filter(top).length === 0 ? proposedSets : 0,
    );
    credit(planned, p, plannedCount);
    // An exercise already lined up reserves its emphasis even with only one set.
    for (const emphasis of p.emphases)
      add(emphases, emphasis.key, Math.max(plannedCount, meaningfulSets));
  }

  const pastGroups = new Map<string, { at: number; groups: Map<string, number> }>();
  for (const set of input.history) {
    const at = set.performedAt.getTime();
    if (
      !done(set) ||
      set.sessionId === input.sessionId ||
      !Number.isFinite(at) ||
      at >= input.now.getTime() ||
      at < input.now.getTime() - RECOMMENDATION_POLICY.patternDays * DAY
    )
      continue;
    const p = trainingProfile(catalogue.get(set.exerciseId)?.slug ?? '');
    if (p === undefined) continue;
    const session = pastGroups.get(set.sessionId) ?? { at, groups: new Map<string, number>() };
    for (const group of p.direct) add(session.groups, group, 1);
    pastGroups.set(set.sessionId, session);
    if (at >= input.now.getTime() - RECOMMENDATION_POLICY.recentDays * DAY) {
      credit(weekly, p, 1);
      for (const emphasis of p.emphases) add(recentEmphases, emphasis.key, 1);
    }
  }
  // At least two directly trained anchors; assistance cannot manufacture a split.
  const observed = new Set(
    [...direct].filter(([, sets]) => sets >= meaningfulSets).map(([g]) => g),
  );
  if (observed.size === 0) return [];
  const allowed = new Set(observed);
  const currentFamily = family(observed);
  if (observed.size >= 2 && currentFamily !== null) {
    const comparable = [...pastGroups.values()]
      .sort((a, b) => b.at - a.at)
      .filter((session) => {
        const groups = new Set(
          [...session.groups].filter(([, n]) => n >= meaningfulSets).map(([g]) => g),
        );
        return family(groups) === currentFamily && [...observed].every((g) => groups.has(g));
      })
      .slice(0, RECOMMENDATION_POLICY.historySessions);
    if (comparable.length >= RECOMMENDATION_POLICY.historyMinimum) {
      const votes = new Map<string, number>();
      for (const session of comparable)
        for (const [group, n] of session.groups) if (n >= meaningfulSets) add(votes, group, 1);
      for (const [group, votesFor] of votes)
        if (votesFor >= 2 && votesFor / comparable.length >= 2 / 3) allowed.add(group);
    }
  }
  const ranked: {
    recommendation: ExerciseRecommendation;
    priority: number;
    shortfall: number;
    familiar: number;
    exercise: RecommendationExercise;
  }[] = [];
  for (const exercise of input.catalogue) {
    if (
      !input.eligibleIds.has(exercise.id) ||
      blocks.has(exercise.id) ||
      input.selectedIds?.has(exercise.id) === true
    )
      continue;
    const p = trainingProfile(exercise.slug);
    if (p === undefined || p.emphases.length === 0 || p.direct.some((g) => !allowed.has(g)))
      continue;
    // Adding a secondary mover is fine; introducing an unchosen primary group is not.
    if (
      p.direct.some(
        (g) =>
          (weekly.get(g) ?? 0) + (planned.get(g) ?? 0) + proposedSets >
          prescription.weeklySetsPerGroup,
      )
    )
      continue;
    for (const emphasis of p.emphases) {
      if ((emphases.get(emphasis.key) ?? 0) >= meaningfulSets) continue;
      const coverage = planned.get(emphasis.group) ?? 0;
      const missing = coverage < meaningfulSets;
      if (!missing && (recentEmphases.get(emphasis.key) ?? 0) >= meaningfulSets) continue;
      const priority = missing ? 0 : emphasis.kind === 'movement' ? 1 : 2;
      ranked.push({
        recommendation: {
          exerciseId: exercise.id,
          group: emphasis.group,
          emphasis: emphasis.key,
          reason: missing
            ? 'missing-group'
            : emphasis.kind === 'movement'
              ? 'movement-variety'
              : 'regional-variety',
        },
        priority,
        shortfall: prescription.weeklySetsPerGroup - (weekly.get(emphasis.group) ?? 0) - coverage,
        familiar: exercise.equipment.filter((e) => knownEquipment.has(e)).length,
        exercise,
      });
    }
  }
  ranked.sort(
    (a, b) =>
      a.priority - b.priority ||
      b.shortfall - a.shortfall ||
      b.familiar - a.familiar ||
      Number(b.exercise.favourite) - Number(a.exercise.favourite) ||
      a.exercise.order - b.exercise.order ||
      a.exercise.slug.localeCompare(b.exercise.slug),
  );
  const result: ExerciseRecommendation[] = [];
  const needs = new Set<string>();
  let regional = 0;
  for (const candidate of ranked) {
    const r = candidate.recommendation;
    if (needs.has(r.emphasis) || result.some((e) => e.exerciseId === r.exerciseId)) continue;
    if (r.reason === 'regional-variety' && input.goal === 'get_stronger' && regional >= 1) continue;
    needs.add(r.emphasis);
    if (r.reason === 'regional-variety') regional += 1;
    result.push(r);
    if (result.length === 3) break;
  }
  return result;
}
