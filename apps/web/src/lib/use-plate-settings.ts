/**
 * The plate calculator's remembered settings, as state a screen can read and
 * change. See `plate-calculator-settings.ts` for what is stored and why.
 */
import { create } from 'zustand';
import { toggleSlot as toggleSlotIn, type PlateSlot } from '@g7m/core';
import {
  readPlateSettings,
  writePlateSettings,
  type PlateCalculatorSettings,
} from './plate-calculator-settings.js';

interface PlateSettingsState extends PlateCalculatorSettings {
  readonly toggleSlot: (slot: PlateSlot) => void;
  readonly setEzBarWeightKg: (kg: number) => void;
  readonly setEzBarWeightLb: (lb: number) => void;
}

export const usePlateSettingsStore = create<PlateSettingsState>((set, get) => ({
  ...readPlateSettings(),
  toggleSlot: (slot) => {
    const availableSlots = toggleSlotIn(get().availableSlots, slot);
    if (availableSlots === get().availableSlots) return; // refused: would empty the selection
    set({ availableSlots });
    writePlateSettings({ ...get(), availableSlots });
  },
  setEzBarWeightKg: (kg) => {
    if (!Number.isFinite(kg) || kg <= 0) return;
    set({ ezBarWeightKg: kg });
    writePlateSettings({ ...get(), ezBarWeightKg: kg });
  },
  setEzBarWeightLb: (lb) => {
    if (!Number.isFinite(lb) || lb <= 0) return;
    set({ ezBarWeightLb: lb });
    writePlateSettings({ ...get(), ezBarWeightLb: lb });
  },
}));
