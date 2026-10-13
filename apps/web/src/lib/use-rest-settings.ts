/**
 * The lifter's own rest times, as state Settings can change and the workout
 * can read. See `rest-settings.ts` for what is stored and why.
 */
import { create } from 'zustand';
import {
  readRestSettings,
  tidyAdjustSeconds,
  tidyRestSeconds,
  writeRestSettings,
  type Mechanic,
  type RestSettings,
} from './rest-settings.js';

interface RestSettingsState extends RestSettings {
  readonly setCustom: (custom: boolean) => void;
  readonly setSeconds: (mechanic: Mechanic, seconds: number) => void;
  readonly setAdjust: (seconds: number) => void;
  readonly setSound: (sound: boolean) => void;
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
  setAdjust: (seconds) => {
    const adjust = tidyAdjustSeconds(seconds);
    if (adjust === null) return;
    set({ adjust });
    writeRestSettings({ ...get(), adjust });
  },
  setSound: (sound) => {
    set({ sound });
    writeRestSettings({ ...get(), sound });
  },
}));
