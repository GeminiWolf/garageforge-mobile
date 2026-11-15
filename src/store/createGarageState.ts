import type { StateCreator } from 'zustand';
import { createVehiclesSlice } from './slices/vehiclesSlice';
import { createTrackedPartsSlice } from './slices/trackedPartsSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import type { GarageState } from './types';

export const createGarageState: StateCreator<GarageState> = (
  set,
  get,
  api,
) => ({
  hasHydrated: false,
  setHasHydrated: value => set({ hasHydrated: value }),
  clearGarage: () => set({ vehicles: [], trackedParts: [] }),
  ...createVehiclesSlice(set, get, api),
  ...createTrackedPartsSlice(set, get, api),
  ...createSettingsSlice(set, get, api),
});
