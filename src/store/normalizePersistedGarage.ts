import { getDefaultSettings } from '../config';
import type {
  AppSettings,
  GaragePersistState,
  TrackedPart,
  Vehicle,
} from '../types/garage';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

export function normalizeVehicle(raw: unknown): Vehicle | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = asString(raw.id);
  const year = asFiniteNumber(raw.year);
  const make = asString(raw.make);
  const model = asString(raw.model);
  if (!id || year == null || !make || !model) {
    return null;
  }

  const vehicle: Vehicle = {
    id,
    year,
    make,
    model,
    trim: asString(raw.trim) ?? '',
  };
  const engine = asString(raw.engine);
  if (engine) {
    vehicle.engine = engine;
  }
  return vehicle;
}

export function normalizeTrackedPart(raw: unknown): TrackedPart | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = asString(raw.id);
  const vehicleId = asString(raw.vehicleId);
  const name = asString(raw.name);
  const partNumber = asString(raw.partNumber);
  const category = asString(raw.category);
  const priority = asString(raw.priority);
  const status = asString(raw.status);
  const estimatedCost = asFiniteNumber(raw.estimatedCost);
  if (
    !id ||
    !vehicleId ||
    !name ||
    !partNumber ||
    !category ||
    (priority !== 'urgent' && priority !== 'soon' && priority !== 'someday') ||
    (status !== 'needed' &&
      status !== 'sourcing' &&
      status !== 'ordered' &&
      status !== 'installed') ||
    estimatedCost == null
  ) {
    return null;
  }

  const part: TrackedPart = {
    id,
    vehicleId,
    name,
    partNumber,
    category,
    priority,
    status,
    estimatedCost,
  };
  if (typeof raw.estimateProvided === 'boolean') {
    part.estimateProvided = raw.estimateProvided;
  }
  const actualCost = asFiniteNumber(raw.actualCost);
  if (actualCost != null) {
    part.actualCost = actualCost;
  }
  for (const key of ['committedAt', 'paidAt'] as const) {
    const value = asString(raw[key]);
    if (value && Number.isFinite(Date.parse(value))) {
      part[key] = value;
    }
  }
  const notes = asString(raw.notes);
  if (notes) {
    part.notes = notes;
  }
  const source = asString(raw.source);
  if (source) {
    part.source = source;
  }
  return part;
}

export function normalizeSettings(raw: unknown): AppSettings {
  const defaults = getDefaultSettings();
  if (!isRecord(raw)) {
    return defaults;
  }

  return {
    currency:
      raw.currency === 'ZAR' || raw.currency === 'USD' || raw.currency === 'EUR'
        ? raw.currency
        : defaults.currency,
    units:
      raw.units === 'metric' || raw.units === 'imperial'
        ? raw.units
        : defaults.units,
    region: asString(raw.region) ?? defaults.region,
    monthlyBudget: asFiniteNumber(raw.monthlyBudget) ?? defaults.monthlyBudget,
    budgetRollover:
      typeof raw.budgetRollover === 'boolean'
        ? raw.budgetRollover
        : defaults.budgetRollover,
    budgetCarryOver:
      asFiniteNumber(raw.budgetCarryOver) ?? defaults.budgetCarryOver,
    budgetPeriodKey: asString(raw.budgetPeriodKey) ?? defaults.budgetPeriodKey,
    budgetPeriodCommittedBaseline:
      asFiniteNumber(raw.budgetPeriodCommittedBaseline) ??
      defaults.budgetPeriodCommittedBaseline,
    spendingAlertThreshold:
      asFiniteNumber(raw.spendingAlertThreshold) ??
      defaults.spendingAlertThreshold,
    apiBaseUrl: asString(raw.apiBaseUrl) ?? defaults.apiBaseUrl,
    apiBearerToken: asString(raw.apiBearerToken) ?? defaults.apiBearerToken,
  };
}

export function normalizePersistedGarage(raw: unknown): GaragePersistState {
  const stored = isRecord(raw) ? raw : {};
  const vehicles = Array.isArray(stored.vehicles)
    ? stored.vehicles.flatMap(item => {
        const vehicle = normalizeVehicle(item);
        return vehicle ? [vehicle] : [];
      })
    : [];
  const vehicleIds = new Set(vehicles.map(vehicle => vehicle.id));
  const trackedParts = Array.isArray(stored.trackedParts)
    ? stored.trackedParts.flatMap(item => {
        const part = normalizeTrackedPart(item);
        if (!part || !vehicleIds.has(part.vehicleId)) {
          return [];
        }
        return [part];
      })
    : [];

  return {
    vehicles,
    trackedParts,
    settings: normalizeSettings(stored.settings),
  };
}
