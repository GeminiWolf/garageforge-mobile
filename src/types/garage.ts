export type PartPriority = 'urgent' | 'soon' | 'someday';
export type PartStatus = 'needed' | 'sourcing' | 'ordered' | 'installed';
export type CurrencyCode = 'ZAR' | 'USD' | 'EUR';
export type UnitSystem = 'metric' | 'imperial';

export type Vehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  /** Engine name from the catalogue, e.g. "2.8 GD-6". */
  engine?: string;
  /** Engine code from the catalogue, e.g. "1GD-FTV". */
  engineCode?: string;
  /** Stamped on this car's engine; typed in by hand. */
  engineNumber?: string;
  /** Odometer reading in kilometres (shown in miles for imperial units). */
  mileage?: number;
  mileageUpdatedAt?: string;
  /** Whose car it is (workshops). Personal users leave it out. */
  customerName?: string;
  /** Number plate, e.g. "CA 123-456". */
  plate?: string;
  /** Device time of the last local change (used for sync). */
  updatedAt: string;
};

export type VehiclePatch = Partial<
  Pick<
    Vehicle,
    'engineNumber' | 'mileage' | 'mileageUpdatedAt' | 'customerName' | 'plate'
  >
>;

export type JobStatus = 'open' | 'done';

/**
 * One visit of a car to the workshop. A car is added once; each visit is a
 * job with its own parts, notes and time. At most one job per car is open.
 */
export type Job = {
  id: string;
  vehicleId: string;
  /** e.g. "Service and front brakes". Optional. */
  title?: string;
  status: JobStatus;
  /** When the car came in. */
  openedAt: string;
  /** When the job was finished. */
  closedAt?: string;
  /** Odometer reading when the car came in, in kilometres. */
  mileageIn?: number;
  updatedAt: string;
};

export type JobPatch = Partial<Pick<Job, 'title' | 'mileageIn'>>;

export type NoteKind = 'customer' | 'personal';

/** A dated note on a vehicle: what the customer reported, or your own. */
export type VehicleNote = {
  id: string;
  vehicleId: string;
  /** The job (visit) this note belongs to. */
  jobId?: string;
  kind: NoteKind;
  body: string;
  writtenAt: string;
  updatedAt: string;
};

/** Time spent working on a vehicle. */
export type TimeEntry = {
  id: string;
  vehicleId: string;
  jobId?: string;
  minutes: number;
  /** Calendar date, YYYY-MM-DD. */
  workedOn: string;
  note?: string;
  updatedAt: string;
};

export type TrackedPart = {
  id: string;
  vehicleId: string;
  /** The job (visit) this part is for. */
  jobId?: string;
  name: string;
  partNumber: string;
  category: string;
  priority: PartPriority;
  status: PartStatus;
  estimatedCost: number;
  estimateProvided?: boolean;
  actualCost?: number;
  committedAt?: string;
  paidAt?: string;
  notes?: string;
  source?: string;
  /** Device time of the last local change (used for sync). */
  updatedAt: string;
};

export type NewVehicle = Omit<Vehicle, 'id' | 'updatedAt'> & { id?: string };
export type NewTrackedPart = Omit<TrackedPart, 'id' | 'updatedAt'> & {
  id?: string;
};
export type TrackedPartPatch = Partial<
  Omit<TrackedPart, 'id' | 'vehicleId' | 'updatedAt'>
>;

export type AppSettings = {
  currency: CurrencyCode;
  units: UnitSystem;
  region: string;
  monthlyBudget: number;
  budgetRollover: boolean;
  budgetCarryOver: number;
  budgetPeriodKey: string;
  budgetPeriodCommittedBaseline: number;
  spendingAlertThreshold: number;
  apiBaseUrl: string;
  apiBearerToken: string;
};

/** The signed-in account, if any. The session token lives in the Keychain. */
export type Account = {
  id: string;
  email: string;
  name: string;
};

/** A deleted record waiting to be sent to the server. */
export type PendingDeletion =
  | { type: 'vehicle'; record: Vehicle; deletedAt: string }
  | { type: 'job'; record: Job; deletedAt: string }
  | { type: 'part'; record: TrackedPart; deletedAt: string }
  | { type: 'note'; record: VehicleNote; deletedAt: string }
  | { type: 'timeEntry'; record: TimeEntry; deletedAt: string };

export type SyncState = {
  /** Server cursor from the last successful sync. */
  cursor?: string;
  /** Device time when the last successful push started. */
  lastPushedAt?: string;
  /** Device time of the last successful sync (for display). */
  lastSyncedAt?: string;
  /** Device time of the last change to synced settings. */
  settingsUpdatedAt?: string;
  pendingDeletions: PendingDeletion[];
};

export type GaragePersistState = {
  vehicles: Vehicle[];
  jobs: Job[];
  trackedParts: TrackedPart[];
  notes: VehicleNote[];
  timeEntries: TimeEntry[];
  settings: AppSettings;
  account: Account | null;
  sync: SyncState;
};
