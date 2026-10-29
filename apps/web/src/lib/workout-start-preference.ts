import { create } from 'zustand';

const remembered = new Map<string, boolean>();
const keyFor = (user: string) => `g7m.workout-start-options.${user}`;

export function readWorkoutStartOptions(user: string): boolean {
  const cached = remembered.get(user);
  if (cached !== undefined) return cached;
  try {
    return localStorage.getItem(keyFor(user)) !== 'false';
  } catch {
    return true;
  }
}

export function saveWorkoutStartOptions(user: string, show: boolean): void {
  remembered.set(user, show);
  try {
    localStorage.setItem(keyFor(user), String(show));
  } catch {
    // The preference still works for this visit if the WebView refuses storage.
  }
  useWorkoutStartPreference.getState().changed();
}

export const useWorkoutStartPreference = create<{ revision: number; changed: () => void }>(
  (set) => ({
    revision: 0,
    changed: () => set((state) => ({ revision: state.revision + 1 })),
  }),
);
