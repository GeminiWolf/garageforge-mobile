import type { StateCreator } from 'zustand';
import { createVehiclesSlice } from './slices/vehiclesSlice';
import { createTrackedPartsSlice } from './slices/trackedPartsSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import { createAccountSlice, queueDeletions } from './slices/accountSlice';
import type { GarageState } from './types';

export const createGarageState: StateCreator<GarageState> = (
  set,
  get,
  api,
) => ({
  hasHydrated: false,
  setHasHydrated: value => set({ hasHydrated: value }),
  clearGarage: () =>
    set(state => {
      const now = new Date().toISOString();
      return {
        vehicles: [],
        trackedParts: [],
        sync: queueDeletions(state, [
          ...state.vehicles.map(record => ({
            type: 'vehicle' as const,
            record,
            deletedAt: now,
          })),
          ...state.trackedParts.map(record => ({
            type: 'part' as const,
            record,
            deletedAt: now,
          })),
        ]),
      };
    }),
  ...createVehiclesSlice(set, get, api),
  ...createTrackedPartsSlice(set, get, api),
  ...createSettingsSlice(set, get, api),
  ...createAccountSlice(set, get, api),
});
