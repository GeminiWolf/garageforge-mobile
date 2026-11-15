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
};

export type NewVehicle = Omit<Vehicle, 'id'> & { id?: string };
export type NewTrackedPart = Omit<TrackedPart, 'id'> & { id?: string };
export type TrackedPartPatch = Partial<Omit<TrackedPart, 'id' | 'vehicleId'>>;

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

export type GaragePersistState = {
  vehicles: Vehicle[];
  trackedParts: TrackedPart[];
  settings: AppSettings;
};
