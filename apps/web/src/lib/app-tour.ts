import { create } from 'zustand';

/** UI only: a tour is never resumed after reload or inherited by another account. */
export const useTourStore = create<{
  user: string | null;
  open: (user: string) => void;
  close: () => void;
}>((set) => ({
  user: null,
  open: (user) => set({ user }),
  close: () => set({ user: null }),
}));
