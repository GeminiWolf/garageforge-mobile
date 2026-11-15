import type {
  CurrencyCode,
  NoteKind,
  PartPriority,
  PartStatus,
  UnitSystem,
} from '../types/garage';

/** Shapes of the backend's /api/v1/garage/sync contract (auto-v-backend). */

export type ServerVehicle = {
  id: string;
  variantId: string | null;
  year: number;
  make: string;
  model: string;
  trim: string;
  engine: string | null;
  engineCode: string | null;
  engineNumber: string | null;
  currentMileage: number | null;
  mileageUpdatedAt: string | null;
  clientUpdatedAt: string;
  deletedAt: string | null;
};

export type ServerNote = {
  id: string;
  vehicleId: string;
  kind: NoteKind;
  body: string;
  writtenAt: string;
  clientUpdatedAt: string;
  deletedAt: string | null;
};

export type ServerTimeEntry = {
  id: string;
  vehicleId: string;
  minutes: number;
  workedOn: string;
  note: string | null;
  clientUpdatedAt: string;
  deletedAt: string | null;
};

export type ServerPart = {
  id: string;
  vehicleId: string;
  name: string;
  partNumber: string;
  category: string;
  priority: PartPriority;
  status: PartStatus;
  estimatedCost: number;
  estimateProvided: boolean | null;
  actualCost: number | null;
  committedAt: string | null;
  paidAt: string | null;
  notes: string | null;
  source: string | null;
  clientUpdatedAt: string;
  deletedAt: string | null;
};

export type ServerSettings = {
  currency: CurrencyCode;
  units: UnitSystem;
  region: string;
  monthlyBudget: number;
  budgetRollover: boolean;
  spendingAlertThreshold: number;
};

export type VehicleChange = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  engine?: string;
  engineCode?: string;
  engineNumber: string | null;
  currentMileage: number | null;
  mileageUpdatedAt: string | null;
  updatedAt: string;
  deletedAt?: string;
};

export type NoteChange = {
  id: string;
  vehicleId: string;
  kind: NoteKind;
  body: string;
  writtenAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type TimeEntryChange = {
  id: string;
  vehicleId: string;
  minutes: number;
  workedOn: string;
  note: string | null;
  updatedAt: string;
  deletedAt?: string;
};

export type PartChange = {
  id: string;
  vehicleId: string;
  name: string;
  partNumber: string;
  category: string;
  priority: PartPriority;
  status: PartStatus;
  estimatedCost: number;
  estimateProvided: boolean | null;
  actualCost: number | null;
  committedAt: string | null;
  paidAt: string | null;
  notes: string | null;
  source: string | null;
  updatedAt: string;
  deletedAt?: string;
};

export type SyncRequest = {
  since?: string;
  vehicles: VehicleChange[];
  parts: PartChange[];
  notes: NoteChange[];
  timeEntries: TimeEntryChange[];
  settings?: ServerSettings & { updatedAt: string };
};

export type SyncRejection = {
  type: 'vehicle' | 'part' | 'note' | 'time_entry';
  id: string;
  reason: 'id_conflict' | 'unknown_vehicle';
};

export type SyncResponse = {
  cursor: string;
  vehicles: ServerVehicle[];
  parts: ServerPart[];
  /** Missing from servers older than the vehicle details release. */
  notes?: ServerNote[];
  timeEntries?: ServerTimeEntry[];
  settings: ServerSettings;
  rejected: SyncRejection[];
};
