import { lazy, Suspense, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../auth/auth-store.js';
import { useWrite } from './db/use-catalogue.js';
import { buzz } from './haptics.js';
import { readWorkoutStartOptions, saveWorkoutStartOptions } from './workout-start-preference.js';

const Chooser = lazy(() => import('../components/WorkoutStartDialog.js'));

/** Shared by Home and the empty logger; explicit plans/routines bypass it. */
export function useWorkoutStart() {
  const user = useAuthStore((s) => s.session?.user.id ?? '');
  const navigate = useNavigate();
  const { write, busy, error } = useWrite();
  const [open, setOpen] = useState(false);
  const starting = useRef(false);

  async function begin(routineId: string | null, skip = false): Promise<void> {
    if (starting.current) return;
    starting.current = true;
    buzz('tick');
    try {
      const result = await write(async (r) => {
        const { startWorkout } = await import('./db/start-workout.js');
        return startWorkout(r, routineId);
      });
      if (result !== null) {
        if (result.blank && skip) saveWorkoutStartOptions(user, false);
        setOpen(false);
        void navigate('/workout');
      }
    } finally {
      starting.current = false;
    }
  }

  return {
    busy,
    error,
    start: () => {
      if (starting.current || open) return;
      if (readWorkoutStartOptions(user)) setOpen(true);
      else void begin(null);
    },
    chooser: open ? (
      <Suspense fallback={null}>
        <Chooser
          busy={busy}
          error={error}
          onStart={(routineId, skip) => void begin(routineId, skip)}
          onClose={() => {
            if (!starting.current) setOpen(false);
          }}
        />
      </Suspense>
    ) : null,
  };
}
