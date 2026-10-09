/**
 * "Do this workout": a friend's session, started as your own.
 *
 * Their exercises, in their order, with their number of working sets — and
 * your weights, never theirs. The weights come from the same prefill a routine
 * uses (`nextSetTemplate` over what *you* last lifted, ADR-0079), because a
 * friend's 140 kg squat is their number and the logger offering it to you
 * would be the one prefill that could hurt somebody.
 *
 * An exercise you have never done starts empty, the way one added from the
 * library does: there is no number of yours to offer, and a row of zeros is a
 * form to fill rather than a plan. A cardio machine starts empty too — a bout
 * is set up on the machine, not in advance.
 *
 * The session is `manual`. Where it came from changes nothing about how it
 * runs, and `source` is what the app reads to decide that (ADR-0105).
 */
import {
  naturalLoadType,
  nextSetTemplate,
  workoutToCopy,
  workoutUnits,
  type SetTemplate,
} from '@g7m/core';
import type { WorkoutSession } from '@g7m/db';
import type { Repositories } from '../db/repositories.js';
import type { FriendSession } from './api.js';
import { writeFriendWorkoutNote, type FriendReference } from './cache.js';

export async function startFriendWorkout(
  repositories: Repositories,
  input: {
    readonly owner: string;
    readonly friendName: string | null;
    readonly session: FriendSession;
    /** What their workout is called on screen, given to yours. */
    readonly title: string;
    readonly bodyweightKg: number | null;
  },
): Promise<WorkoutSession> {
  const copied = workoutToCopy(input.session.exercises);

  const session = await repositories.sessions.start({
    source: 'manual',
    name: input.title,
    bodyweightKg: input.bodyweightKg,
  });

  // Their supersets are yours too: the exercises they did as one go in as one,
  // under a new id of this session's own (ADR-0112).
  const slots: { exercise: (typeof copied)[number]; id: string }[] = [];
  for (const unit of workoutUnits(copied, (exercise) => exercise.superset)) {
    const exercises = unit.kind === 'single' ? [unit.item] : unit.members;
    const added = await repositories.sessions.addExercises(
      session.id,
      exercises.map((exercise) => exercise.exerciseId),
      { superset: unit.kind === 'superset' },
    );
    for (const [index, exercise] of exercises.entries()) {
      const entry = added[index];
      if (entry !== undefined) slots.push({ exercise, id: entry.id });
    }
  }

  const references: Record<string, FriendReference> = {};
  for (const { exercise, id: slotId } of slots) {
    if (exercise.reference !== null) {
      references[exercise.exerciseId] = {
        reps: exercise.reference.reps,
        weightKg: exercise.reference.weightKg,
        loadType: exercise.reference.loadType,
      };
    }

    const [detail, previous, equipment] = await Promise.all([
      repositories.exercises.byId(exercise.exerciseId),
      repositories.sessions.lastPerformance(exercise.exerciseId, session.id),
      repositories.exercises.equipmentFor(exercise.exerciseId),
    ]);
    if (detail?.cardioKind != null) continue;
    if (previous.length === 0) continue;

    const loadType = naturalLoadType(equipment.map((item) => item.category));
    const written: SetTemplate[] = [];
    for (let index = 0; index < exercise.workingSets; index++) {
      const template = nextSetTemplate({
        current: written,
        previous,
        repLow: detail?.defaultRepLow ?? 8,
        loadType,
      });
      await repositories.sessions.addSet(slotId, {
        weightKg: template.weightKg,
        reps: template.reps,
        loadType: template.loadType,
        setType: 'working',
      });
      written.push(template);
    }
  }

  writeFriendWorkoutNote({
    owner: input.owner,
    sessionId: session.id,
    friendName: input.friendName,
    references,
  });

  return session;
}
