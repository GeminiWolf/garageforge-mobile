import { getDefaultSettings } from '../config';
import {
  normalizePersistedGarage,
  normalizeTrackedPart,
  normalizeVehicle,
  resolveApiConnection,
} from './normalizePersistedGarage';
import { defaultJobId } from './jobs';

const vehicle = {
  id: 'veh_1',
  year: 2015,
  make: 'BMW',
  model: 'M3',
  trim: 'F80',
  modelYearId: '99',
  vin: 'WBSXXXX',
};

const part = {
  id: 'part_1',
  vehicleId: 'veh_1',
  catalogPartId: 'cat_9',
  name: 'Oil filter',
  partNumber: 'OF-1',
  category: 'Engine',
  priority: 'soon' as const,
  status: 'needed' as const,
  estimatedCost: 250,
};

describe('normalizeVehicle', () => {
  it('keeps identity fields and drops unused catalogue keys', () => {
    expect(normalizeVehicle(vehicle)).toEqual({
      id: 'veh_1',
      year: 2015,
      make: 'BMW',
      model: 'M3',
      trim: 'F80',
      updatedAt: expect.any(String),
    });
  });

  it('keeps engine when it was already saved', () => {
    expect(normalizeVehicle({ ...vehicle, engine: 'S55' })).toEqual({
      id: 'veh_1',
      year: 2015,
      make: 'BMW',
      model: 'M3',
      trim: 'F80',
      engine: 'S55',
      updatedAt: expect.any(String),
    });
  });

  it('returns null when required fields are missing', () => {
    expect(normalizeVehicle({ id: 'veh_1', make: 'BMW' })).toBeNull();
  });
});

describe('normalizeTrackedPart', () => {
  it('drops catalogue ids that the garage never reads', () => {
    expect(normalizeTrackedPart(part)).toEqual({
      id: 'part_1',
      vehicleId: 'veh_1',
      name: 'Oil filter',
      partNumber: 'OF-1',
      category: 'Engine',
      priority: 'soon',
      status: 'needed',
      estimatedCost: 250,
      updatedAt: expect.any(String),
    });
  });
});

describe('normalizePersistedGarage', () => {
  it('merges settings defaults and ignores dead keys', () => {
    const normalized = normalizePersistedGarage({
      vehicles: [vehicle],
      trackedParts: [part],
      settings: {
        currency: 'USD',
        notificationsEnabled: true,
      },
      activeVehicleId: 'veh_1',
    });

    expect(normalized.vehicles).toEqual([
      {
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        year: 2015,
        make: 'BMW',
        model: 'M3',
        trim: 'F80',
        updatedAt: expect.any(String),
      },
    ]);
    expect(normalized.trackedParts).toHaveLength(1);
    expect(normalized.trackedParts[0].vehicleId).toBe(
      normalized.vehicles[0].id,
    );
    expect(normalized.settings).toEqual({
      ...getDefaultSettings(),
      currency: 'USD',
    });
    expect(normalized).not.toHaveProperty('activeVehicleId');
  });

  it('drops parts whose vehicle is missing', () => {
    const normalized = normalizePersistedGarage({
      vehicles: [vehicle],
      trackedParts: [{ ...part, vehicleId: 'gone' }],
    });

    expect(normalized.trackedParts).toEqual([]);
  });
});

describe('resolveApiConnection', () => {
  const defaults = {
    apiBaseUrl: 'https://api.example.com',
    apiBearerToken: '',
  };
  const saved = { apiBaseUrl: 'http://10.0.0.5:3000', apiBearerToken: 'abc' };

  it('keeps saved developer overrides in development builds', () => {
    expect(resolveApiConnection(saved, defaults, true)).toEqual(saved);
  });

  it('ignores saved overrides in release builds', () => {
    expect(resolveApiConnection(saved, defaults, false)).toEqual(defaults);
  });
});

describe('UUID migration and sync fields', () => {
  const legacy = {
    vehicles: [{ id: 'veh_old_1', year: 2015, make: 'BMW', model: 'M3' }],
    trackedParts: [
      {
        id: 'part_old_1',
        vehicleId: 'veh_old_1',
        name: 'Oil filter',
        partNumber: '',
        category: '',
        priority: 'soon',
        status: 'needed',
        estimatedCost: 250,
      },
    ],
  };

  it('replaces old ids with UUIDs and keeps parts linked', () => {
    const state = normalizePersistedGarage(legacy);
    const [migratedVehicle] = state.vehicles;
    const [migratedPart] = state.trackedParts;
    expect(migratedVehicle.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(migratedPart.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(migratedPart.vehicleId).toBe(migratedVehicle.id);
    expect(migratedVehicle.updatedAt).toEqual(expect.any(String));
  });

  it('keeps parts with an empty part number or category', () => {
    expect(normalizePersistedGarage(legacy).trackedParts).toHaveLength(1);
  });

  it('keeps existing UUIDs unchanged', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const state = normalizePersistedGarage({
      vehicles: [
        {
          id,
          year: 2015,
          make: 'BMW',
          model: 'M3',
          updatedAt: '2026-11-01T00:00:00.000Z',
        },
      ],
    });
    expect(state.vehicles[0]).toMatchObject({
      id,
      updatedAt: '2026-11-01T00:00:00.000Z',
    });
  });

  it('restores the account and sync state, dropping invalid entries', () => {
    const state = normalizePersistedGarage({
      account: { id: 'u1', email: 'a@example.test', name: 'A' },
      sync: {
        cursor: '2026-11-10T12:00:00.000Z',
        lastPushedAt: 'not a date',
        pendingDeletions: [{ type: 'vehicle', record: {}, deletedAt: 'x' }],
      },
    });
    expect(state.account).toEqual({
      id: 'u1',
      email: 'a@example.test',
      name: 'A',
    });
    expect(state.sync).toEqual({
      cursor: '2026-11-10T12:00:00.000Z',
      pendingDeletions: [],
    });
  });

  it('gives each car saved before jobs one open job holding its records', () => {
    const V = '11111111-1111-4111-8111-111111111111';
    const state = normalizePersistedGarage({
      vehicles: [
        {
          id: V,
          year: 2020,
          make: 'Toyota',
          model: 'Hilux',
          trim: '',
          mileage: 84320,
          updatedAt: '2026-11-10T00:00:00.000Z',
        },
      ],
      trackedParts: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          vehicleId: V,
          name: 'Oil filter',
          partNumber: '',
          category: 'Engine',
          priority: 'soon',
          status: 'needed',
          estimatedCost: 220,
          updatedAt: '2026-11-02T00:00:00.000Z',
        },
      ],
      notes: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          vehicleId: V,
          kind: 'customer',
          body: 'Knocking',
          writtenAt: '2026-11-01T00:00:00.000Z',
        },
      ],
    });
    expect(state.jobs).toEqual([
      expect.objectContaining({
        id: defaultJobId(V),
        vehicleId: V,
        status: 'open',
        openedAt: '2026-11-01T00:00:00.000Z',
        mileageIn: 84320,
      }),
    ]);
    expect(state.trackedParts[0].jobId).toBe(defaultJobId(V));
    expect(state.notes[0].jobId).toBe(defaultJobId(V));

    // Loading again changes nothing.
    const again = normalizePersistedGarage(JSON.parse(JSON.stringify(state)));
    expect(again.jobs).toEqual(state.jobs);
    expect(again.trackedParts).toEqual(state.trackedParts);
  });

  it('starts signed out with empty sync state', () => {
    const state = normalizePersistedGarage(undefined);
    expect(state.account).toBeNull();
    expect(state.sync).toEqual({ pendingDeletions: [] });
  });
});
