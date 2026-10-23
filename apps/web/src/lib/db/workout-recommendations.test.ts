import { describe, expect, it, vi } from 'vitest';
import type { Repositories } from './repositories.js';
import { loadWorkoutRecommendations } from './workout-recommendations.js';

describe('workout recommendation preference', () => {
  it('does not analyse an active manual workout when the user has opted out', async () => {
    const readHistory = vi.fn();
    const readCatalogue = vi.fn();
    const repositories = {
      sessions: { active: () => Promise.resolve({ id: 'manual-workout', source: 'manual' }) },
      profile: { current: () => Promise.resolve({ workoutRecommendations: false }) },
      exercises: { list: readCatalogue },
      history: { completedSets: readHistory },
    } as unknown as Repositories;

    expect(await loadWorkoutRecommendations(repositories)).toBeNull();
    expect(readCatalogue).not.toHaveBeenCalled();
    expect(readHistory).not.toHaveBeenCalled();
  });
});
