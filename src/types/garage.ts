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
  engine?: string;
  /** Device time of the last local change (used for sync). */
  updatedAt: string;
};

export type TrackedPart = {
  id: string;
  vehicleId: string;
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
  | { type: 'part'; record: TrackedPart; deletedAt: string };

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
  trackedParts: TrackedPart[];
  settings: AppSettings;
  account: Account | null;
  sync: SyncState;
};
