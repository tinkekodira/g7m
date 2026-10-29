import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repositories } from './repositories.js';
import { startWorkout } from './start-workout.js';

const { startRoutine } = vi.hoisted(() => ({ startRoutine: vi.fn() }));
// This suite tests start orchestration. The routine module also exports React
// hooks that initialize auth/configuration; keep that boundary out of unit tests.
vi.mock('./use-routines.js', () => ({ startRoutineWorkout: startRoutine }));

beforeEach(() => {
  startRoutine.mockReset();
});

function setup() {
  const session = { id: 'new-session' };
  const sessions = {
    active: vi.fn().mockResolvedValue(null),
    start: vi.fn().mockResolvedValue(session),
  };
  const profile = { current: vi.fn().mockResolvedValue({ bodyweightKg: 80 }) };
  const routines = { byId: vi.fn().mockResolvedValue(null) };
  const r = { sessions, profile, routines } as unknown as Repositories;
  return { r, sessions, profile, routines, session };
}

describe('generic workout start', () => {
  it('resumes a workout that appeared while the chooser was open', async () => {
    const { r, sessions, profile, routines } = setup();
    sessions.active.mockResolvedValue({ id: 'existing' });
    expect(await startWorkout(r, 'a-routine')).toEqual({
      session: { id: 'existing' },
      blank: false,
    });
    expect(sessions.start).not.toHaveBeenCalled();
    expect(profile.current).not.toHaveBeenCalled();
    expect(routines.byId).not.toHaveBeenCalled();
  });

  it('snapshots bodyweight for a blank workout', async () => {
    const { r, sessions, session } = setup();
    expect(await startWorkout(r, null)).toEqual({ session, blank: true });
    expect(sessions.start).toHaveBeenCalledWith({ bodyweightKg: 80 });
  });

  it('permits an unknown bodyweight', async () => {
    const { r, profile, sessions } = setup();
    profile.current.mockResolvedValue(null);
    await startWorkout(r, null);
    expect(sessions.start).toHaveBeenCalledWith({ bodyweightKg: null });
  });

  it('does not create a workout for a removed or now-empty routine', async () => {
    const { r, routines, sessions } = setup();
    await expect(startWorkout(r, 'removed')).rejects.toThrow('no longer available');
    routines.byId.mockResolvedValue({ exercises: [] });
    await expect(startWorkout(r, 'empty')).rejects.toThrow('no exercises');
    expect(sessions.start).not.toHaveBeenCalled();
    expect(startRoutine).not.toHaveBeenCalled();
  });

  it('delegates a valid routine with the current bodyweight', async () => {
    const { r, routines, sessions, session } = setup();
    const routine = { routine: { id: 'push' }, exercises: [{ exerciseId: 'bench' }] };
    routines.byId.mockResolvedValue(routine);
    startRoutine.mockResolvedValue(session);
    expect(await startWorkout(r, 'push')).toEqual({ session, blank: false });
    expect(startRoutine).toHaveBeenCalledWith(r, { routine, bodyweightKg: 80 });
    expect(sessions.start).not.toHaveBeenCalled();
  });

  it('propagates a failed routine start without falling back to a blank workout', async () => {
    const { r, routines, sessions } = setup();
    routines.byId.mockResolvedValue({ exercises: [{ exerciseId: 'bench' }] });
    startRoutine.mockRejectedValue(new Error('device full'));
    await expect(startWorkout(r, 'push')).rejects.toThrow('device full');
    expect(sessions.start).not.toHaveBeenCalled();
  });

  it('propagates failed starts without reporting a successful blank creation', async () => {
    const { r, sessions } = setup();
    sessions.start.mockRejectedValue(new Error('device full'));
    await expect(startWorkout(r, null)).rejects.toThrow('device full');
  });
});
