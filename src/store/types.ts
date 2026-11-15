import type { StateCreator } from 'zustand';
import type {
  Account,
  AppSettings,
  Job,
  JobPatch,
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

export type NewJob = {
  vehicleId: string;
  title?: string;
  /** Odometer reading when the car came in; also updates the car. */
  mileageIn?: number;
  /** What the customer said; saved as a customer note on the job. */
  customerNote?: string;
};

export type JobsSlice = {
  jobs: Job[];
  /** Starts a job (finishing any job still open on the car). */
  startJob: (job: NewJob) => string;
  updateJob: (id: string, patch: JobPatch) => void;
  finishJob: (id: string) => void;
  /** Reopens a finished job if the car has no job in progress. */
  reopenJob: (id: string) => void;
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
      | 'jobs'
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
  JobsSlice &
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
