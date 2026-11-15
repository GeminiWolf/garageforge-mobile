import { getDefaultSettings } from '../config';
import type {
  Account,
  AppSettings,
  GaragePersistState,
  PendingDeletion,
  SyncState,
  TimeEntry,
  TrackedPart,
  Vehicle,
  VehicleNote,
} from '../types/garage';
import { createId, isUuid } from '../utils/createId';

/** Stamp for records saved before sync existed; they count as changed. */
const LEGACY_UPDATED_AT = () => new Date().toISOString();

function asTimestamp(value: unknown): string | undefined {
  const text = asString(value);
  return text && Number.isFinite(Date.parse(text)) ? text : undefined;
}

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
    updatedAt: asTimestamp(raw.updatedAt) ?? LEGACY_UPDATED_AT(),
  };
  for (const key of ['engine', 'engineCode', 'engineNumber'] as const) {
    const value = asString(raw[key]);
    if (value) {
      vehicle[key] = value;
    }
  }
  const mileage = asFiniteNumber(raw.mileage);
  if (mileage != null && mileage >= 0) {
    vehicle.mileage = mileage;
    const readAt = asTimestamp(raw.mileageUpdatedAt);
    if (readAt) {
      vehicle.mileageUpdatedAt = readAt;
    }
  }
  return vehicle;
}

export function normalizeNote(raw: unknown): VehicleNote | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id = asString(raw.id);
  const vehicleId = asString(raw.vehicleId);
  const body = asString(raw.body)?.trim();
  const writtenAt = asTimestamp(raw.writtenAt);
  if (!id || !vehicleId || !body || !writtenAt) {
    return null;
  }
  return {
    id,
    vehicleId,
    kind: raw.kind === 'customer' ? 'customer' : 'personal',
    body,
    writtenAt,
    updatedAt: asTimestamp(raw.updatedAt) ?? writtenAt,
  };
}

export function normalizeTimeEntry(raw: unknown): TimeEntry | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id = asString(raw.id);
  const vehicleId = asString(raw.vehicleId);
  const minutes = asFiniteNumber(raw.minutes);
  const workedOn = asString(raw.workedOn);
  if (
    !id ||
    !vehicleId ||
    minutes == null ||
    minutes < 1 ||
    minutes > 1440 ||
    !workedOn ||
    !/^\d{4}-\d{2}-\d{2}$/.test(workedOn)
  ) {
    return null;
  }
  const entry: TimeEntry = {
    id,
    vehicleId,
    minutes: Math.round(minutes),
    workedOn,
    updatedAt: asTimestamp(raw.updatedAt) ?? LEGACY_UPDATED_AT(),
  };
  const note = asString(raw.note)?.trim();
  if (note) {
    entry.note = note;
  }
  return entry;
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
    partNumber === undefined ||
    category === undefined ||
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
    updatedAt: asTimestamp(raw.updatedAt) ?? LEGACY_UPDATED_AT(),
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
    ...resolveApiConnection(raw, defaults),
  };
}

/**
 * The API URL and token are developer settings. Release builds always use the
 * production API with no token, even if an older build saved overrides.
 */
export function resolveApiConnection(
  raw: Record<string, unknown>,
  defaults: Pick<AppSettings, 'apiBaseUrl' | 'apiBearerToken'>,
  allowOverrides: boolean = __DEV__,
): Pick<AppSettings, 'apiBaseUrl' | 'apiBearerToken'> {
  if (!allowOverrides) {
    return {
      apiBaseUrl: defaults.apiBaseUrl,
      apiBearerToken: defaults.apiBearerToken,
    };
  }
  return {
    apiBaseUrl: asString(raw.apiBaseUrl) ?? defaults.apiBaseUrl,
    apiBearerToken: asString(raw.apiBearerToken) ?? defaults.apiBearerToken,
  };
}

function normalizeAccount(raw: unknown): Account | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id = asString(raw.id);
  const email = asString(raw.email);
  if (!id || !email) {
    return null;
  }
  return { id, email, name: asString(raw.name) ?? '' };
}

function normalizeDeletion(raw: unknown): PendingDeletion | null {
  if (!isRecord(raw)) {
    return null;
  }
  const deletedAt = asTimestamp(raw.deletedAt);
  if (!deletedAt) {
    return null;
  }
  if (raw.type === 'vehicle') {
    const record = normalizeVehicle(raw.record);
    return record && isUuid(record.id)
      ? { type: 'vehicle', record, deletedAt }
      : null;
  }
  if (raw.type === 'part') {
    const record = normalizeTrackedPart(raw.record);
    return record && isUuid(record.id)
      ? { type: 'part', record, deletedAt }
      : null;
  }
  if (raw.type === 'note') {
    const record = normalizeNote(raw.record);
    return record && isUuid(record.id)
      ? { type: 'note', record, deletedAt }
      : null;
  }
  if (raw.type === 'timeEntry') {
    const record = normalizeTimeEntry(raw.record);
    return record && isUuid(record.id)
      ? { type: 'timeEntry', record, deletedAt }
      : null;
  }
  return null;
}

export function normalizeSyncState(raw: unknown): SyncState {
  const stored = isRecord(raw) ? raw : {};
  const sync: SyncState = {
    pendingDeletions: Array.isArray(stored.pendingDeletions)
      ? stored.pendingDeletions.flatMap(item => {
          const deletion = normalizeDeletion(item);
          return deletion ? [deletion] : [];
        })
      : [],
  };
  for (const key of [
    'cursor',
    'lastPushedAt',
    'lastSyncedAt',
    'settingsUpdatedAt',
  ] as const) {
    const value = asTimestamp(stored[key]);
    if (value) {
      sync[key] = value;
    }
  }
  return sync;
}

/**
 * Older builds used ids like "veh_lq3k_x8f2". The server needs UUIDs, so
 * those are replaced once, and parts are re-pointed at their vehicle's new id.
 */
export function migrateIdsToUuid(
  vehicles: Vehicle[],
  trackedParts: TrackedPart[],
): { vehicles: Vehicle[]; trackedParts: TrackedPart[] } {
  const vehicleIds = new Map<string, string>();
  const nextVehicles = vehicles.map(vehicle => {
    const id = isUuid(vehicle.id) ? vehicle.id : createId();
    vehicleIds.set(vehicle.id, id);
    return id === vehicle.id ? vehicle : { ...vehicle, id };
  });
  const nextParts = trackedParts.map(part => {
    const id = isUuid(part.id) ? part.id : createId();
    const vehicleId = vehicleIds.get(part.vehicleId) ?? part.vehicleId;
    return id === part.id && vehicleId === part.vehicleId
      ? part
      : { ...part, id, vehicleId };
  });
  return { vehicles: nextVehicles, trackedParts: nextParts };
}

export function normalizePersistedGarage(raw: unknown): GaragePersistState {
  const stored = isRecord(raw) ? raw : {};
  const rawVehicles = Array.isArray(stored.vehicles)
    ? stored.vehicles.flatMap(item => {
        const vehicle = normalizeVehicle(item);
        return vehicle ? [vehicle] : [];
      })
    : [];
  const rawVehicleIds = new Set(rawVehicles.map(vehicle => vehicle.id));
  const rawParts = Array.isArray(stored.trackedParts)
    ? stored.trackedParts.flatMap(item => {
        const part = normalizeTrackedPart(item);
        if (!part || !rawVehicleIds.has(part.vehicleId)) {
          return [];
        }
        return [part];
      })
    : [];
  const { vehicles, trackedParts } = migrateIdsToUuid(rawVehicles, rawParts);
  // Notes and time entries were added after the UUID migration, so their
  // vehicle ids are already UUIDs.
  const vehicleIds = new Set(vehicles.map(vehicle => vehicle.id));
  const notes = Array.isArray(stored.notes)
    ? stored.notes.flatMap(item => {
        const note = normalizeNote(item);
        return note && vehicleIds.has(note.vehicleId) ? [note] : [];
      })
    : [];
  const timeEntries = Array.isArray(stored.timeEntries)
    ? stored.timeEntries.flatMap(item => {
        const entry = normalizeTimeEntry(item);
        return entry && vehicleIds.has(entry.vehicleId) ? [entry] : [];
      })
    : [];

  return {
    vehicles,
    trackedParts,
    notes,
    timeEntries,
    settings: normalizeSettings(stored.settings),
    account: normalizeAccount(stored.account),
    sync: normalizeSyncState(stored.sync),
  };
}
