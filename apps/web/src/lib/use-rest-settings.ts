/**
 * The lifter's own rest times, as state Settings can change and the workout
 * can read. See `rest-settings.ts` for what is stored and why.
 */
import { create } from 'zustand';
import {
  readRestSettings,
  tidyRestSeconds,
  writeRestSettings,
  type Mechanic,
  type RestSettings,
} from './rest-settings.js';

interface RestSettingsState extends RestSettings {
  readonly setCustom: (custom: boolean) => void;
  readonly setSeconds: (mechanic: Mechanic, seconds: number) => void;
}

export const useRestSettingsStore = create<RestSettingsState>((set, get) => ({
  ...readRestSettings(),
  setCustom: (custom) => {
    set({ custom });
    writeRestSettings({ ...get(), custom });
  },
  setSeconds: (mechanic, seconds) => {
    const tidy = tidyRestSeconds(seconds);
    if (tidy === null) return;
    set({ [mechanic]: tidy });
    writeRestSettings({ ...get(), [mechanic]: tidy });
  },
}));
