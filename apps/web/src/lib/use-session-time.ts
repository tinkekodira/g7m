/**
 * Time today, as state the plan can change and read. See
 * `session-time-settings.ts` for what is stored and why.
 */
import { create } from 'zustand';
import {
  readSessionMinutes,
  writeSessionMinutes,
  type SessionMinutes,
} from './session-time-settings.js';

interface SessionTimeState {
  readonly minutes: SessionMinutes | null;
  readonly setMinutes: (minutes: SessionMinutes | null) => void;
}

export const useSessionTimeStore = create<SessionTimeState>((set) => ({
  minutes: readSessionMinutes(),
  setMinutes: (minutes) => {
    set({ minutes });
    writeSessionMinutes(minutes);
  },
}));
