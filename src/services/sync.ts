import type {
  AppSettings,
  PendingDeletion,
  SyncState,
  TrackedPart,
  Vehicle,
} from '../types/garage';
import { createId } from '../utils/createId';
import type {
  PartChange,
  ServerPart,
  ServerSettings,
  ServerVehicle,
  SyncRequest,
  SyncResponse,
  VehicleChange,
} from './syncTypes';

export type SyncSnapshot = {
  vehicles: Vehicle[];
  trackedParts: TrackedPart[];
  settings: AppSettings;
  sync: SyncState;
};

const isAfter = (a: string, b: string | undefined) =>
  b === undefined || Date.parse(a) > Date.parse(b);

const minTime = (a: string, b: string) =>
  Date.parse(a) <= Date.parse(b) ? a : b;

function toVehicleChange(vehicle: Vehicle): VehicleChange {
  const change: VehicleChange = {
    id: vehicle.id,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    updatedAt: vehicle.updatedAt,
  };
  // Omitted (not null) so a value added on the website is not wiped; the
  // phone cannot edit a vehicle's engine after adding it.
  if (vehicle.engine) {
    change.engine = vehicle.engine;
  }
  return change;
}

function toPartChange(part: TrackedPart): PartChange {
  // Every part field is editable on the phone, so absent values are sent
  // as null to clear them on the server.
  return {
    id: part.id,
    vehicleId: part.vehicleId,
    name: part.name,
    partNumber: part.partNumber,
    category: part.category,
    priority: part.priority,
    status: part.status,
    estimatedCost: part.estimatedCost,
    estimateProvided: part.estimateProvided ?? null,
    actualCost: part.actualCost ?? null,
    committedAt: part.committedAt ?? null,
    paidAt: part.paidAt ?? null,
    notes: part.notes ?? null,
    source: part.source ?? null,
    updatedAt: part.updatedAt,
  };
}

function deletionChange(
  deletion: PendingDeletion,
): { vehicle: VehicleChange } | { part: PartChange } {
  const meta = { updatedAt: deletion.deletedAt, deletedAt: deletion.deletedAt };
  return deletion.type === 'vehicle'
    ? { vehicle: { ...toVehicleChange(deletion.record), ...meta } }
    : { part: { ...toPartChange(deletion.record), ...meta } };
}

function pickSyncedSettings(settings: AppSettings): ServerSettings {
  return {
    currency: settings.currency,
    units: settings.units,
    region: settings.region,
    monthlyBudget: settings.monthlyBudget,
    budgetRollover: settings.budgetRollover,
    spendingAlertThreshold: settings.spendingAlertThreshold,
  };
}

/** True when something changed on the device since the last push. */
export function hasPendingChanges(snapshot: SyncSnapshot): boolean {
  const { lastPushedAt, pendingDeletions, settingsUpdatedAt } = snapshot.sync;
  return (
    pendingDeletions.length > 0 ||
    snapshot.vehicles.some(item => isAfter(item.updatedAt, lastPushedAt)) ||
    snapshot.trackedParts.some(item => isAfter(item.updatedAt, lastPushedAt)) ||
    (settingsUpdatedAt !== undefined &&
      isAfter(settingsUpdatedAt, lastPushedAt))
  );
}

/** Everything changed on the device since the last successful push. */
export function buildSyncRequest(snapshot: SyncSnapshot): SyncRequest {
  const { sync } = snapshot;
  const request: SyncRequest = {
    vehicles: snapshot.vehicles
      .filter(item => isAfter(item.updatedAt, sync.lastPushedAt))
      .map(toVehicleChange),
    parts: snapshot.trackedParts
      .filter(item => isAfter(item.updatedAt, sync.lastPushedAt))
      .map(toPartChange),
  };
  for (const deletion of sync.pendingDeletions) {
    const change = deletionChange(deletion);
    if ('vehicle' in change) {
      request.vehicles.push(change.vehicle);
    } else {
      request.parts.push(change.part);
    }
  }
  if (sync.cursor) {
    request.since = sync.cursor;
  }
  if (
    sync.settingsUpdatedAt &&
    isAfter(sync.settingsUpdatedAt, sync.lastPushedAt)
  ) {
    request.settings = {
      ...pickSyncedSettings(snapshot.settings),
      updatedAt: sync.settingsUpdatedAt,
    };
  }
  return request;
}

function fromServerVehicle(row: ServerVehicle, updatedAt: string): Vehicle {
  const vehicle: Vehicle = {
    id: row.id,
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim,
    updatedAt,
  };
  if (row.engine) {
    vehicle.engine = row.engine;
  }
  return vehicle;
}

function fromServerPart(row: ServerPart, updatedAt: string): TrackedPart {
  const part: TrackedPart = {
    id: row.id,
    vehicleId: row.vehicleId,
    name: row.name,
    partNumber: row.partNumber,
    category: row.category,
    priority: row.priority,
    status: row.status,
    estimatedCost: row.estimatedCost,
    updatedAt,
  };
  if (row.estimateProvided !== null)
    part.estimateProvided = row.estimateProvided;
  if (row.actualCost !== null) part.actualCost = row.actualCost;
  if (row.committedAt) part.committedAt = row.committedAt;
  if (row.paidAt) part.paidAt = row.paidAt;
  if (row.notes) part.notes = row.notes;
  if (row.source) part.source = row.source;
  return part;
}

/**
 * Merges a sync response into the device state.
 *
 * `current` is the state now (it may have changed while the request was in
 * flight); `startedAt` is the device time the request was built. Local edits
 * made after `startedAt` are kept (they are pushed next time). Server records
 * are stamped no later than `startedAt`, so a device with a fast clock
 * elsewhere cannot make them look like new local edits.
 */
export function applySyncResponse(
  current: SyncSnapshot,
  sent: SyncRequest,
  response: SyncResponse,
  startedAt: string,
  now: string,
): SyncSnapshot {
  const editedSinceStart = (item: { updatedAt: string }) =>
    isAfter(item.updatedAt, startedAt);

  const vehicles = new Map(current.vehicles.map(item => [item.id, item]));
  const parts = new Map(current.trackedParts.map(item => [item.id, item]));

  for (const row of response.vehicles) {
    const local = vehicles.get(row.id);
    if (local && editedSinceStart(local)) {
      continue;
    }
    if (row.deletedAt) {
      vehicles.delete(row.id);
      for (const part of parts.values()) {
        if (part.vehicleId === row.id) parts.delete(part.id);
      }
    } else {
      vehicles.set(
        row.id,
        fromServerVehicle(row, minTime(row.clientUpdatedAt, startedAt)),
      );
    }
  }

  for (const row of response.parts) {
    const local = parts.get(row.id);
    if (local && editedSinceStart(local)) {
      continue;
    }
    if (row.deletedAt || !vehicles.has(row.vehicleId)) {
      parts.delete(row.id);
    } else {
      parts.set(
        row.id,
        fromServerPart(row, minTime(row.clientUpdatedAt, startedAt)),
      );
    }
  }

  // Records the server refused: give them a fresh id so they upload as new
  // records next time instead of failing forever.
  for (const rejection of response.rejected) {
    if (rejection.reason !== 'id_conflict') continue;
    const newId = createId();
    if (rejection.type === 'vehicle') {
      const vehicle = vehicles.get(rejection.id);
      if (!vehicle) continue;
      vehicles.delete(rejection.id);
      vehicles.set(newId, { ...vehicle, id: newId, updatedAt: now });
      for (const part of parts.values()) {
        if (part.vehicleId === rejection.id) {
          parts.set(part.id, { ...part, vehicleId: newId, updatedAt: now });
        }
      }
    } else {
      const part = parts.get(rejection.id);
      if (!part) continue;
      parts.delete(rejection.id);
      parts.set(newId, { ...part, id: newId, updatedAt: now });
    }
  }

  const settingsChangedSinceStart =
    current.sync.settingsUpdatedAt !== undefined &&
    isAfter(current.sync.settingsUpdatedAt, startedAt);
  const settings = settingsChangedSinceStart
    ? current.settings
    : { ...current.settings, ...response.settings };

  const sentDeletions = new Set(
    [...sent.vehicles, ...sent.parts]
      .filter(change => change.deletedAt)
      .map(change => change.id),
  );

  return {
    vehicles: [...vehicles.values()],
    trackedParts: [...parts.values()],
    settings,
    sync: {
      ...current.sync,
      cursor: response.cursor,
      lastPushedAt: startedAt,
      lastSyncedAt: now,
      pendingDeletions: current.sync.pendingDeletions.filter(
        deletion => !sentDeletions.has(deletion.record.id),
      ),
    },
  };
}
