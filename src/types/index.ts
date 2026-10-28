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
  modelYearId: string;
  vehicleVariantId?: number;
  vin?: string;
};

export type TrackedPart = {
  id: string;
  vehicleId: string;
  catalogPartId?: string;
  name: string;
  partNumber: string;
  category: string;
  priority: PartPriority;
  status: PartStatus;
  estimatedCost: number;
  actualCost?: number;
  notes?: string;
  source?: string;
};

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
  notificationsEnabled: boolean;
};

export type Make = {
  id: number;
  name: string;
  slug: string;
  regions: string[];
  countries: string[];
};

export type MakeOption = {
  id: string;
} & Omit<Make, 'id'>;

export type Model = {
  id: number;
  make_id: number;
  name: string;
  created_at: Date;
};

export type ModelOption = {
  id: string;
} & Omit<Model, 'id'>;

export type ModelYear = {
  year: number;
};

export type YearOption = {
  id: string;
  name: string;
} & ModelYear;

export type VehicleVariant = {
  id: number;
  model_id: number;
  year: number;
  trim: string;
  engine_code: string;
  engine_name: string;
  engine_size_l: number;
  fuel_type: string;
  transmission: string;
  body_style: string;
  drive_type: string;
  source: string;
  source_vehicle_id: null;
  is_verified: boolean;
  created_at: Date;
};

export type VariantOption = {
  id: string;
  name: string;
} & Omit<VehicleVariant, 'id'>;

export type PartCategory = {
  id: number;
  name: string;
  parent_id?: number | null;
};

export type PartCategoryOption = {
  id: string;
  name: string;
} & Omit<PartCategory, 'id'>;

export interface PartCategories {
  id: number;
  name: string;
  slug: string;
}

export type CatalogPart = {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  part_number: string;
  brand?: string;
  description: string;
  is_oem: boolean;
  is_active: boolean;
  part_categories: PartCategories;
};

export type CatalogPartOption = {
  id: string;
  name: string;
  categoryId?: string | undefined;
} & Omit<CatalogPart, 'id' | 'category_id'>;

export type GaragePersistState = {
  vehicles: Vehicle[];
  trackedParts: TrackedPart[];
  settings: AppSettings;
  activeVehicleId: string | null;
};
