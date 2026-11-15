import type {
  AppSettings,
  PendingDeletion,
  SyncState,
  TimeEntry,
  TrackedPart,
  Vehicle,
  VehicleNote,
} from '../types/garage';
import { createId } from '../utils/createId';
import type {
  NoteChange,
  PartChange,
  ServerNote,
  ServerPart,
  ServerSettings,
  ServerTimeEntry,
  ServerVehicle,
  SyncRequest,
  SyncResponse,
  TimeEntryChange,
  VehicleChange,
} from './syncTypes';

export type SyncSnapshot = {
  vehicles: Vehicle[];
  trackedParts: TrackedPart[];
  notes: VehicleNote[];
  timeEntries: TimeEntry[];
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
    // Editable on the phone, so absent values are sent as null to clear them.
    engineNumber: vehicle.engineNumber ?? null,
    currentMileage: vehicle.mileage ?? null,
    mileageUpdatedAt: vehicle.mileageUpdatedAt ?? null,
    updatedAt: vehicle.updatedAt,
  };
  // Omitted (not null) so a value added on the website is not wiped; the
  // phone only sets the engine from the catalogue when adding a vehicle.
  if (vehicle.engine) {
    change.engine = vehicle.engine;
  }
  if (vehicle.engineCode) {
    change.engineCode = vehicle.engineCode;
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

function toNoteChange(note: VehicleNote): NoteChange {
  return {
    id: note.id,
    vehicleId: note.vehicleId,
    kind: note.kind,
    body: note.body,
    writtenAt: note.writtenAt,
    updatedAt: note.updatedAt,
  };
}

function toTimeEntryChange(entry: TimeEntry): TimeEntryChange {
  return {
    id: entry.id,
    vehicleId: entry.vehicleId,
    minutes: entry.minutes,
    workedOn: entry.workedOn,
    note: entry.note ?? null,
    updatedAt: entry.updatedAt,
  };
}

function addDeletion(request: SyncRequest, deletion: PendingDeletion): void {
  const meta = { updatedAt: deletion.deletedAt, deletedAt: deletion.deletedAt };
  switch (deletion.type) {
    case 'vehicle':
      request.vehicles.push({ ...toVehicleChange(deletion.record), ...meta });
      break;
    case 'part':
      request.parts.push({ ...toPartChange(deletion.record), ...meta });
      break;
    case 'note':
      request.notes.push({ ...toNoteChange(deletion.record), ...meta });
      break;
    case 'timeEntry':
      request.timeEntries.push({
        ...toTimeEntryChange(deletion.record),
        ...meta,
      });
      break;
  }
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
  const changed = (item: { updatedAt: string }) =>
    isAfter(item.updatedAt, lastPushedAt);
  return (
    pendingDeletions.length > 0 ||
    snapshot.vehicles.some(changed) ||
    snapshot.trackedParts.some(changed) ||
    snapshot.notes.some(changed) ||
    snapshot.timeEntries.some(changed) ||
    (settingsUpdatedAt !== undefined &&
      isAfter(settingsUpdatedAt, lastPushedAt))
  );
}

/** Everything changed on the device since the last successful push. */
export function buildSyncRequest(snapshot: SyncSnapshot): SyncRequest {
  const { sync } = snapshot;
  const changed = (item: { updatedAt: string }) =>
    isAfter(item.updatedAt, sync.lastPushedAt);
  const request: SyncRequest = {
    vehicles: snapshot.vehicles.filter(changed).map(toVehicleChange),
    parts: snapshot.trackedParts.filter(changed).map(toPartChange),
    notes: snapshot.notes.filter(changed).map(toNoteChange),
    timeEntries: snapshot.timeEntries.filter(changed).map(toTimeEntryChange),
  };
  for (const deletion of sync.pendingDeletions) {
    addDeletion(request, deletion);
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
  if (row.engine) vehicle.engine = row.engine;
  if (row.engineCode) vehicle.engineCode = row.engineCode;
  if (row.engineNumber) vehicle.engineNumber = row.engineNumber;
  if (row.currentMileage != null) {
    vehicle.mileage = row.currentMileage;
    if (row.mileageUpdatedAt) vehicle.mileageUpdatedAt = row.mileageUpdatedAt;
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

function fromServerNote(row: ServerNote, updatedAt: string): VehicleNote {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    kind: row.kind,
    body: row.body,
    writtenAt: row.writtenAt,
    updatedAt,
  };
}

function fromServerTimeEntry(
  row: ServerTimeEntry,
  updatedAt: string,
): TimeEntry {
  const entry: TimeEntry = {
    id: row.id,
    vehicleId: row.vehicleId,
    minutes: row.minutes,
    workedOn: row.workedOn,
    updatedAt,
  };
  if (row.note) entry.note = row.note;
  return entry;
}

type ChildRecord = { id: string; vehicleId: string; updatedAt: string };
type ChildRow = {
  id: string;
  vehicleId: string;
  clientUpdatedAt: string;
  deletedAt: string | null;
};

/**
 * Applies server rows for records that belong to a vehicle. Local edits made
 * after the request started win; rows for missing vehicles are dropped.
 */
function mergeChildren<T extends ChildRecord, R extends ChildRow>(
  records: Map<string, T>,
  rows: R[],
  vehicles: Map<string, Vehicle>,
  startedAt: string,
  fromServer: (row: R, updatedAt: string) => T,
): void {
  for (const row of rows) {
    const local = records.get(row.id);
    if (local && isAfter(local.updatedAt, startedAt)) {
      continue;
    }
    if (row.deletedAt || !vehicles.has(row.vehicleId)) {
      records.delete(row.id);
    } else {
      records.set(
        row.id,
        fromServer(row, minTime(row.clientUpdatedAt, startedAt)),
      );
    }
  }
}

/** Gives a record the server refused a fresh id so it uploads as new. */
function reissueId<T extends { id: string; updatedAt: string }>(
  records: Map<string, T>,
  id: string,
  now: string,
): void {
  const record = records.get(id);
  if (!record) return;
  const newId = createId();
  records.delete(id);
  records.set(newId, { ...record, id: newId, updatedAt: now });
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
  const notes = new Map(current.notes.map(item => [item.id, item]));
  const timeEntries = new Map(current.timeEntries.map(item => [item.id, item]));
  const children = [parts, notes, timeEntries] as Map<string, ChildRecord>[];

  for (const row of response.vehicles) {
    const local = vehicles.get(row.id);
    if (local && editedSinceStart(local)) {
      continue;
    }
    if (row.deletedAt) {
      vehicles.delete(row.id);
      for (const records of children) {
        for (const record of records.values()) {
          if (record.vehicleId === row.id) records.delete(record.id);
        }
      }
    } else {
      vehicles.set(
        row.id,
        fromServerVehicle(row, minTime(row.clientUpdatedAt, startedAt)),
      );
    }
  }

  mergeChildren(parts, response.parts, vehicles, startedAt, fromServerPart);
  mergeChildren(
    notes,
    response.notes ?? [],
    vehicles,
    startedAt,
    fromServerNote,
  );
  mergeChildren(
    timeEntries,
    response.timeEntries ?? [],
    vehicles,
    startedAt,
    fromServerTimeEntry,
  );

  // Records the server refused: give them a fresh id so they upload as new
  // records next time instead of failing forever.
  for (const rejection of response.rejected) {
    if (rejection.reason !== 'id_conflict') continue;
    switch (rejection.type) {
      case 'vehicle': {
        const vehicle = vehicles.get(rejection.id);
        if (!vehicle) break;
        const newId = createId();
        vehicles.delete(rejection.id);
        vehicles.set(newId, { ...vehicle, id: newId, updatedAt: now });
        for (const records of children) {
          for (const record of records.values()) {
            if (record.vehicleId === rejection.id) {
              records.set(record.id, {
                ...record,
                vehicleId: newId,
                updatedAt: now,
              });
            }
          }
        }
        break;
      }
      case 'part':
        reissueId(parts, rejection.id, now);
        break;
      case 'note':
        reissueId(notes, rejection.id, now);
        break;
      case 'time_entry':
        reissueId(timeEntries, rejection.id, now);
        break;
    }
  }

  const settingsChangedSinceStart =
    current.sync.settingsUpdatedAt !== undefined &&
    isAfter(current.sync.settingsUpdatedAt, startedAt);
  const settings = settingsChangedSinceStart
    ? current.settings
    : { ...current.settings, ...response.settings };

  const sentDeletions = new Set(
    [...sent.vehicles, ...sent.parts, ...sent.notes, ...sent.timeEntries]
      .filter(change => change.deletedAt)
      .map(change => change.id),
  );

  return {
    vehicles: [...vehicles.values()],
    trackedParts: [...parts.values()],
    notes: [...notes.values()],
    timeEntries: [...timeEntries.values()],
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
