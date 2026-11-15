import type {
  CurrencyCode,
  JobStatus,
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
  /** Missing from servers older than the jobs release. */
  registrationNumber?: string | null;
  customerName?: string | null;
  clientUpdatedAt: string;
  deletedAt: string | null;
};

export type ServerJob = {
  id: string;
  vehicleId: string;
  title: string | null;
  status: JobStatus;
  openedAt: string;
  closedAt: string | null;
  mileageIn: number | null;
  clientUpdatedAt: string;
  deletedAt: string | null;
};

export type ServerNote = {
  id: string;
  vehicleId: string;
  jobId?: string | null;
  kind: NoteKind;
  body: string;
  writtenAt: string;
  clientUpdatedAt: string;
  deletedAt: string | null;
};

export type ServerTimeEntry = {
  id: string;
  vehicleId: string;
  jobId?: string | null;
  minutes: number;
  workedOn: string;
  note: string | null;
  clientUpdatedAt: string;
  deletedAt: string | null;
};

export type ServerPart = {
  id: string;
  vehicleId: string;
  jobId?: string | null;
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
  registrationNumber: string | null;
  customerName: string | null;
  updatedAt: string;
  deletedAt?: string;
};

export type JobChange = {
  id: string;
  vehicleId: string;
  title: string | null;
  status: JobStatus;
  openedAt: string;
  closedAt: string | null;
  mileageIn: number | null;
  updatedAt: string;
  deletedAt?: string;
};

export type NoteChange = {
  id: string;
  vehicleId: string;
  jobId: string | null;
  kind: NoteKind;
  body: string;
  writtenAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type TimeEntryChange = {
  id: string;
  vehicleId: string;
  jobId: string | null;
  minutes: number;
  workedOn: string;
  note: string | null;
  updatedAt: string;
  deletedAt?: string;
};

export type PartChange = {
  id: string;
  vehicleId: string;
  jobId: string | null;
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
  jobs: JobChange[];
  parts: PartChange[];
  notes: NoteChange[];
  timeEntries: TimeEntryChange[];
  settings?: ServerSettings & { updatedAt: string };
};

export type SyncRejection = {
  type: 'vehicle' | 'job' | 'part' | 'note' | 'time_entry';
  id: string;
  reason: 'id_conflict' | 'unknown_vehicle';
};

export type SyncResponse = {
  cursor: string;
  vehicles: ServerVehicle[];
  /** Missing from servers older than the jobs release. */
  jobs?: ServerJob[];
  parts: ServerPart[];
  /** Missing from servers older than the vehicle details release. */
  notes?: ServerNote[];
  timeEntries?: ServerTimeEntry[];
  settings: ServerSettings;
  rejected: SyncRejection[];
};
