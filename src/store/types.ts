import type { StateCreator } from 'zustand';
import type {
  Account,
  AppSettings,
  NewTrackedPart,
  NewVehicle,
  NoteKind,
  PendingDeletion,
  SyncState,
  TimeEntry,
  TrackedPart,
  TrackedPartPatch,
  Vehicle,
  VehicleNote,
  VehiclePatch,
} from '../types/garage';

export type VehiclesSlice = {
  vehicles: Vehicle[];
  addVehicle: (vehicle: NewVehicle) => string;
  updateVehicle: (id: string, patch: VehiclePatch) => void;
  removeVehicle: (id: string) => void;
};

export type NewNote = { vehicleId: string; kind: NoteKind; body: string };
export type NewTimeEntry = {
  vehicleId: string;
  minutes: number;
  workedOn: string;
  note?: string;
};

export type VehicleLogSlice = {
  notes: VehicleNote[];
  timeEntries: TimeEntry[];
  addNote: (note: NewNote) => string;
  updateNote: (
    id: string,
    patch: Partial<Pick<VehicleNote, 'kind' | 'body'>>,
  ) => void;
  removeNote: (id: string) => void;
  addTimeEntry: (entry: NewTimeEntry) => string;
  removeTimeEntry: (id: string) => void;
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
      | 'vehicles'
      | 'trackedParts'
      | 'notes'
      | 'timeEntries'
      | 'settings'
      | 'sync'
    >,
  ) => void;
  /** Removes the garage and account from this device (sign-out/delete). */
  resetLocalAccountData: () => void;
};

export type GarageState = VehiclesSlice &
  TrackedPartsSlice &
  VehicleLogSlice &
  SettingsSlice &
  AccountSlice & {
    hasHydrated: boolean;
    setHasHydrated: (value: boolean) => void;
    clearGarage: () => void;
  };

export type GarageSlice<T> = StateCreator<GarageState, [], [], T>;

export type { PendingDeletion };
