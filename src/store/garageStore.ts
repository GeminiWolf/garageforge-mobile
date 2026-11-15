import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY } from '../config';
import { setApiBearerToken } from '../services/api';
import { createGarageState } from './createGarageState';
import { normalizePersistedGarage } from './normalizePersistedGarage';
import type { GarageState } from './types';

export type { GarageState } from './types';

export const useGarageStore = create<GarageState>()(
  persist(createGarageState, {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => AsyncStorage),
    partialize: state => ({
      vehicles: state.vehicles,
      trackedParts: state.trackedParts,
      settings: state.settings,
    }),
    merge: (persisted, current) => ({
      ...current,
      ...normalizePersistedGarage(persisted),
    }),
    onRehydrateStorage: () => state => {
      if (state) {
        setApiBearerToken(state.settings.apiBearerToken ?? '');
        state.syncBudgetPeriod();
        state.setHasHydrated(true);
        return;
      }
      useGarageStore.setState({ hasHydrated: true });
    },
  }),
);
