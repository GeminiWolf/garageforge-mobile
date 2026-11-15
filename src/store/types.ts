import type { StateCreator } from 'zustand';
import type {
  AppSettings,
  NewTrackedPart,
  NewVehicle,
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

export type GarageState = VehiclesSlice &
  TrackedPartsSlice &
  SettingsSlice & {
    hasHydrated: boolean;
    setHasHydrated: (value: boolean) => void;
    clearGarage: () => void;
  };

export type GarageSlice<T> = StateCreator<GarageState, [], [], T>;
