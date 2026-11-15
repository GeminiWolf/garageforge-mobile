import { getDefaultSettings } from '../config';
import type { TrackedPart, Vehicle } from '../types/garage';
import {
  applySyncResponse,
  buildSyncRequest,
  hasPendingChanges,
  type SyncSnapshot,
} from './sync';
import type {
  ServerJob,
  ServerPart,
  ServerVehicle,
  SyncResponse,
} from './syncTypes';
import { defaultJobId } from '../store/jobs';

const T0 = '2026-11-10T10:00:00.000Z';
const PUSHED = '2026-11-10T11:00:00.000Z';
const STARTED = '2026-11-10T12:00:00.000Z';
const LATER = '2026-11-10T12:00:05.000Z';
const NOW = '2026-11-10T12:00:10.000Z';

const V1 = '11111111-1111-4111-8111-111111111111';
const V2 = '22222222-2222-4222-8222-222222222222';
const P1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const P2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const J1 = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const J2 = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

const serverJob = (
  id: string,
  vehicleId: string,
  extra: Partial<ServerJob> = {},
): ServerJob => ({
  id,
  vehicleId,
  title: null,
  status: 'open',
  openedAt: T0,
  closedAt: null,
  mileageIn: null,
  clientUpdatedAt: T0,
  deletedAt: null,
  ...extra,
});

const vehicle = (id: string, updatedAt: string, make = 'BMW'): Vehicle => ({
  id,
  year: 2015,
  make,
  model: 'M3',
  trim: 'F80',
  updatedAt,
});

const part = (
  id: string,
  vehicleId: string,
  updatedAt: string,
  extra: Partial<TrackedPart> = {},
): TrackedPart => ({
  id,
  vehicleId,
  name: 'Oil filter',
  partNumber: 'OF-1',
  category: 'Engine',
  priority: 'soon',
  status: 'needed',
  estimatedCost: 250,
  updatedAt,
  ...extra,
});

const serverVehicle = (
  id: string,
  extra: Partial<ServerVehicle> = {},
): ServerVehicle => ({
  id,
  variantId: null,
  year: 2015,
  make: 'BMW',
  model: 'M3',
  trim: 'F80',
  engine: null,
  engineCode: null,
  engineNumber: null,
  currentMileage: null,
  mileageUpdatedAt: null,
  clientUpdatedAt: T0,
  deletedAt: null,
  ...extra,
});

const serverPart = (
  id: string,
  vehicleId: string,
  extra: Partial<ServerPart> = {},
): ServerPart => ({
  id,
  vehicleId,
  name: 'Oil filter',
  partNumber: 'OF-1',
  category: 'Engine',
  priority: 'soon',
  status: 'needed',
  estimatedCost: 250,
  estimateProvided: null,
  actualCost: null,
  committedAt: null,
  paidAt: null,
  notes: null,
  source: null,
  clientUpdatedAt: T0,
  deletedAt: null,
  ...extra,
});

const settings = getDefaultSettings();
const serverSettings = {
  currency: settings.currency,
  units: settings.units,
  region: settings.region,
  monthlyBudget: settings.monthlyBudget,
  budgetRollover: settings.budgetRollover,
  spendingAlertThreshold: settings.spendingAlertThreshold,
};

function snapshot(extra: Partial<SyncSnapshot> = {}): SyncSnapshot {
  return {
    vehicles: [],
    jobs: [],
    trackedParts: [],
    notes: [],
    timeEntries: [],
    settings,
    sync: { pendingDeletions: [] },
    ...extra,
  };
}

const response = (extra: Partial<SyncResponse> = {}): SyncResponse => ({
  cursor: '2026-11-10T12:00:01.000Z',
  vehicles: [],
  parts: [],
  settings: serverSettings,
  rejected: [],
  ...extra,
});

describe('buildSyncRequest', () => {
  it('sends everything on the first sync', () => {
    const request = buildSyncRequest(
      snapshot({
        vehicles: [vehicle(V1, T0)],
        trackedParts: [part(P1, V1, T0)],
      }),
    );
    expect(request.since).toBeUndefined();
    expect(request.vehicles.map(v => v.id)).toEqual([V1]);
    expect(request.parts[0]).toMatchObject({
      id: P1,
      vehicleId: V1,
      actualCost: null,
      paidAt: null,
    });
    expect(request.settings).toBeUndefined();
  });

  it('sends only records changed since the last push, plus deletions', () => {
    const request = buildSyncRequest(
      snapshot({
        vehicles: [vehicle(V1, T0), vehicle(V2, STARTED)],
        sync: {
          cursor: PUSHED,
          lastPushedAt: PUSHED,
          settingsUpdatedAt: STARTED,
          pendingDeletions: [
            { type: 'part', record: part(P2, V1, T0), deletedAt: STARTED },
          ],
        },
      }),
    );
    expect(request.since).toBe(PUSHED);
    expect(request.vehicles.map(v => v.id)).toEqual([V2]);
    expect(request.parts).toEqual([
      expect.objectContaining({
        id: P2,
        deletedAt: STARTED,
        updatedAt: STARTED,
      }),
    ]);
    expect(request.settings).toMatchObject({ updatedAt: STARTED });
  });
});

describe('applySyncResponse', () => {
  it('adds server records stamped no later than the sync start', () => {
    const later = '2026-11-10T13:00:00.000Z'; // other device's clock is ahead
    const result = applySyncResponse(
      snapshot(),
      { vehicles: [], jobs: [], parts: [], notes: [], timeEntries: [] },
      response({
        vehicles: [serverVehicle(V1, { clientUpdatedAt: later })],
        jobs: [serverJob(J1, V1)],
        parts: [
          serverPart(P1, V1, {
            actualCost: 99,
            notes: 'From web',
            jobId: J1,
          }),
        ],
      }),
      STARTED,
      NOW,
    );
    expect(result.vehicles).toEqual([vehicle(V1, STARTED)]);
    expect(result.trackedParts[0]).toMatchObject({
      id: P1,
      actualCost: 99,
      notes: 'From web',
      jobId: J1,
      updatedAt: T0,
    });
    expect(result.sync).toMatchObject({
      cursor: '2026-11-10T12:00:01.000Z',
      lastPushedAt: STARTED,
      lastSyncedAt: NOW,
    });
    expect(hasPendingChanges(result)).toBe(false);
  });

  it('removes deleted vehicles and their parts', () => {
    const result = applySyncResponse(
      snapshot({
        vehicles: [vehicle(V1, T0), vehicle(V2, T0)],
        trackedParts: [part(P1, V1, T0), part(P2, V2, T0)],
      }),
      { vehicles: [], jobs: [], parts: [], notes: [], timeEntries: [] },
      response({ vehicles: [serverVehicle(V1, { deletedAt: T0 })] }),
      STARTED,
      NOW,
    );
    expect(result.vehicles.map(v => v.id)).toEqual([V2]);
    expect(result.trackedParts.map(p => p.id)).toEqual([P2]);
  });

  it('keeps local edits made while the request was in flight', () => {
    const result = applySyncResponse(
      snapshot({ vehicles: [vehicle(V1, LATER, 'Edited on phone')] }),
      { vehicles: [], jobs: [], parts: [], notes: [], timeEntries: [] },
      response({ vehicles: [serverVehicle(V1, { make: 'From server' })] }),
      STARTED,
      NOW,
    );
    expect(result.vehicles[0].make).toBe('Edited on phone');
    expect(hasPendingChanges(result)).toBe(true);
  });

  it('applies server settings unless they changed on the phone mid-sync', () => {
    const fromServer = { ...serverSettings, monthlyBudget: 4000 };
    const applied = applySyncResponse(
      snapshot(),
      { vehicles: [], jobs: [], parts: [], notes: [], timeEntries: [] },
      response({ settings: fromServer }),
      STARTED,
      NOW,
    );
    expect(applied.settings.monthlyBudget).toBe(4000);

    const kept = applySyncResponse(
      snapshot({
        settings: { ...settings, monthlyBudget: 1500 },
        sync: { pendingDeletions: [], settingsUpdatedAt: LATER },
      }),
      { vehicles: [], jobs: [], parts: [], notes: [], timeEntries: [] },
      response({ settings: fromServer }),
      STARTED,
      NOW,
    );
    expect(kept.settings.monthlyBudget).toBe(1500);
  });

  it('clears deletions that were sent and keeps newer ones', () => {
    const sent = {
      type: 'part' as const,
      record: part(P1, V1, T0),
      deletedAt: T0,
    };
    const queuedLater = {
      type: 'part' as const,
      record: part(P2, V1, T0),
      deletedAt: LATER,
    };
    const result = applySyncResponse(
      snapshot({ sync: { pendingDeletions: [sent, queuedLater] } }),
      {
        vehicles: [],
        jobs: [],
        parts: [{ ...sent.record, deletedAt: T0 } as never],
        notes: [],
        timeEntries: [],
      },
      response(),
      STARTED,
      NOW,
    );
    expect(result.sync.pendingDeletions).toEqual([queuedLater]);
  });

  it('gives a rejected record a new id so it uploads as new next time', () => {
    const result = applySyncResponse(
      snapshot({
        vehicles: [vehicle(V1, T0)],
        trackedParts: [part(P1, V1, T0)],
      }),
      { vehicles: [], jobs: [], parts: [], notes: [], timeEntries: [] },
      response({
        rejected: [{ type: 'vehicle', id: V1, reason: 'id_conflict' }],
      }),
      STARTED,
      NOW,
    );
    const [moved] = result.vehicles;
    expect(moved.id).not.toBe(V1);
    expect(moved.updatedAt).toBe(NOW);
    expect(result.trackedParts[0].vehicleId).toBe(moved.id);
    expect(hasPendingChanges(result)).toBe(true);
  });
});

describe('vehicle details, notes and time', () => {
  const N1 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const E1 = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const sent = {
    vehicles: [],
    jobs: [],
    parts: [],
    notes: [],
    timeEntries: [],
  };

  it('sends phone-editable vehicle fields, clearing empty ones', () => {
    const request = buildSyncRequest(
      snapshot({
        vehicles: [
          {
            ...vehicle(V1, STARTED),
            engineCode: '1GD-FTV',
            mileage: 84320,
            mileageUpdatedAt: T0,
          },
        ],
        sync: { lastPushedAt: PUSHED, pendingDeletions: [] },
      }),
    );
    expect(request.vehicles[0]).toMatchObject({
      engineCode: '1GD-FTV',
      engineNumber: null,
      currentMileage: 84320,
      mileageUpdatedAt: T0,
    });
  });

  it('pushes new notes and time entries and queued deletions', () => {
    const request = buildSyncRequest(
      snapshot({
        vehicles: [vehicle(V1, T0)],
        notes: [
          {
            id: N1,
            vehicleId: V1,
            kind: 'customer',
            body: 'Knocking',
            writtenAt: STARTED,
            updatedAt: STARTED,
          },
        ],
        sync: {
          lastPushedAt: PUSHED,
          pendingDeletions: [
            {
              type: 'timeEntry',
              record: {
                id: E1,
                vehicleId: V1,
                minutes: 30,
                workedOn: '2026-11-10',
                updatedAt: T0,
              },
              deletedAt: STARTED,
            },
          ],
        },
      }),
    );
    expect(request.notes).toEqual([
      expect.objectContaining({ id: N1, kind: 'customer', body: 'Knocking' }),
    ]);
    expect(request.timeEntries).toEqual([
      expect.objectContaining({ id: E1, deletedAt: STARTED, note: null }),
    ]);
  });

  it('pulls notes and time entries and drops them with their vehicle', () => {
    const pulled = applySyncResponse(
      snapshot({ vehicles: [vehicle(V1, T0)] }),
      sent,
      response({
        vehicles: [
          serverVehicle(V1, { engineNumber: 'ENG-1', currentMileage: 1000 }),
        ],
        notes: [
          {
            id: N1,
            vehicleId: V1,
            kind: 'personal',
            body: 'Check CV joint',
            writtenAt: T0,
            clientUpdatedAt: T0,
            deletedAt: null,
          },
        ],
        timeEntries: [
          {
            id: E1,
            vehicleId: V1,
            minutes: 90,
            workedOn: '2026-11-10',
            note: null,
            clientUpdatedAt: T0,
            deletedAt: null,
          },
        ],
      }),
      STARTED,
      NOW,
    );
    expect(pulled.vehicles[0]).toMatchObject({
      engineNumber: 'ENG-1',
      mileage: 1000,
    });
    expect(pulled.notes).toHaveLength(1);
    expect(pulled.timeEntries[0]).toMatchObject({ minutes: 90 });

    const deleted = applySyncResponse(
      pulled,
      sent,
      response({ vehicles: [serverVehicle(V1, { deletedAt: NOW })] }),
      STARTED,
      NOW,
    );
    expect(deleted.notes).toEqual([]);
    expect(deleted.timeEntries).toEqual([]);
  });

  it('copes with a server that does not send notes yet', () => {
    const result = applySyncResponse(
      snapshot({ vehicles: [vehicle(V1, T0)] }),
      sent,
      { ...response(), notes: undefined, timeEntries: undefined },
      STARTED,
      NOW,
    );
    expect(result.notes).toEqual([]);
  });
});

describe('jobs', () => {
  const empty = {
    vehicles: [],
    jobs: [],
    parts: [],
    notes: [],
    timeEntries: [],
  };

  it('sends jobs, the job of each part, the plate and the customer', () => {
    const request = buildSyncRequest(
      snapshot({
        vehicles: [
          { ...vehicle(V1, T0), plate: 'CA 123-456', customerName: 'Thabo' },
        ],
        jobs: [
          {
            id: J1,
            vehicleId: V1,
            title: 'Front suspension',
            status: 'done',
            openedAt: T0,
            closedAt: T0,
            mileageIn: 79900,
            updatedAt: T0,
          },
        ],
        trackedParts: [part(P1, V1, T0, { jobId: J1 })],
      }),
    );
    expect(request.vehicles[0]).toMatchObject({
      registrationNumber: 'CA 123-456',
      customerName: 'Thabo',
    });
    expect(request.jobs).toEqual([
      {
        id: J1,
        vehicleId: V1,
        title: 'Front suspension',
        status: 'done',
        openedAt: T0,
        closedAt: T0,
        mileageIn: 79900,
        updatedAt: T0,
      },
    ]);
    expect(request.parts[0].jobId).toBe(J1);
  });

  it('pulls jobs and files a website part under the open job', () => {
    const result = applySyncResponse(
      snapshot(),
      empty,
      response({
        vehicles: [
          serverVehicle(V1, {
            registrationNumber: 'CY 778-901',
            customerName: 'Sipho',
          }),
        ],
        jobs: [
          serverJob(J1, V1, { status: 'done', closedAt: T0 }),
          serverJob(J2, V1, { openedAt: PUSHED }),
        ],
        parts: [serverPart(P1, V1)],
      }),
      STARTED,
      NOW,
    );
    expect(result.vehicles[0]).toMatchObject({
      plate: 'CY 778-901',
      customerName: 'Sipho',
    });
    expect(result.jobs.map(job => job.status).sort()).toEqual(['done', 'open']);
    expect(result.trackedParts[0]).toMatchObject({ jobId: J2, updatedAt: NOW });
    expect(hasPendingChanges(result)).toBe(true);
  });

  it('gives a car from a server without jobs the same job on every phone', () => {
    const result = applySyncResponse(
      snapshot(),
      empty,
      response({
        vehicles: [serverVehicle(V1)],
        parts: [serverPart(P1, V1)],
      }),
      STARTED,
      NOW,
    );
    expect(result.jobs).toEqual([
      expect.objectContaining({
        id: defaultJobId(V1),
        vehicleId: V1,
        status: 'open',
      }),
    ]);
    expect(defaultJobId(V1)).not.toBe(V1);
    expect(defaultJobId(V1)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(result.trackedParts[0].jobId).toBe(defaultJobId(V1));
  });

  it("moves records to a rejected job's new id", () => {
    const result = applySyncResponse(
      snapshot({
        vehicles: [vehicle(V1, T0)],
        jobs: [
          {
            id: J1,
            vehicleId: V1,
            status: 'open',
            openedAt: T0,
            updatedAt: T0,
          },
        ],
        trackedParts: [part(P1, V1, T0, { jobId: J1 })],
      }),
      empty,
      response({ rejected: [{ type: 'job', id: J1, reason: 'id_conflict' }] }),
      STARTED,
      NOW,
    );
    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].id).not.toBe(J1);
    expect(result.trackedParts[0].jobId).toBe(result.jobs[0].id);
  });
});
