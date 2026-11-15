import type { StateCreator } from 'zustand';
import type {
  Account,
  AppSettings,
  NewTrackedPart,
  NewVehicle,
  PendingDeletion,
  SyncState,
  TrackedPart,
  TrackedPartPatch,
  Vehicle,
} from '../types/garage';

export type VehiclesSlice = {
  vehicles: Vehicle[];
  addVehicle: (vehicle: NewVehicle) => string;
  removeVehicle: (id: string) => void;
};

export type TrackedPartsSlice = {
  trackedParts: TrackedPart[];
  addTrackedPart: (part: NewTrackedPart) => string;
  updateTrackedPart: (id: string, patch: TrackedPartPatch) => void;
  removeTrackedPart: (id: string) => void;
};

export type SettingsSlice = {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  syncBudgetPeriod: () => void;
};

export type AccountSlice = {
  account: Account | null;
  sync: SyncState;
  setAccount: (account: Account | null) => void;
  /** Replaces sync bookkeeping and garage data after a sync round. */
  applySyncResult: (
    result: Pick<
      GarageState,
      'vehicles' | 'trackedParts' | 'settings' | 'sync'
    >,
  ) => void;
  /** Removes the garage and account from this device (sign-out/delete). */
  resetLocalAccountData: () => void;
};

export type GarageState = VehiclesSlice &
  TrackedPartsSlice &
  SettingsSlice &
  AccountSlice & {
    hasHydrated: boolean;
    setHasHydrated: (value: boolean) => void;
    clearGarage: () => void;
  };

export type GarageSlice<T> = StateCreator<GarageState, [], [], T>;

export type { PendingDeletion };
