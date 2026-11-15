import { create } from 'zustand';
import { createGarageState } from './createGarageState';
import type { GarageState } from './types';
import type { NewTrackedPart, NewVehicle } from '../types/garage';

jest.mock('../services/api', () => ({
  setApiBearerToken: jest.fn(),
}));

function createTestStore() {
  return create<GarageState>()(createGarageState);
}

const vehicle: NewVehicle = {
  year: 2015,
  make: 'BMW',
  model: 'M3',
  trim: 'F80',
};

function partFor(vehicleId: string): NewTrackedPart {
  return {
    vehicleId,
    name: 'Oil filter',
    partNumber: 'OF-1',
    category: 'Engine',
    priority: 'soon',
    status: 'needed',
    estimatedCost: 250,
  };
}

describe('createGarageState', () => {
  it('adds a vehicle without catalogue ids', () => {
    const store = createTestStore();
    const id = store.getState().addVehicle(vehicle);

    expect(store.getState().vehicles).toEqual([
      {
        id,
        year: 2015,
        make: 'BMW',
        model: 'M3',
        trim: 'F80',
        updatedAt: expect.any(String),
      },
    ]);
  });

  it('removes a vehicle and its tracked parts', () => {
    const store = createTestStore();
    const keepId = store.getState().addVehicle(vehicle);
    const removeId = store.getState().addVehicle({
      ...vehicle,
      model: 'M4',
    });
    store.getState().addTrackedPart(partFor(keepId));
    store.getState().addTrackedPart(partFor(removeId));

    store.getState().removeVehicle(removeId);

    expect(store.getState().vehicles.map(item => item.id)).toEqual([keepId]);
    expect(store.getState().trackedParts.map(item => item.vehicleId)).toEqual([
      keepId,
    ]);
  });

  it('does not let a part patch change id or vehicleId', () => {
    const store = createTestStore();
    const vehicleId = store.getState().addVehicle(vehicle);
    const partId = store.getState().addTrackedPart(partFor(vehicleId));

    store.getState().updateTrackedPart(partId, {
      name: 'Air filter',
      // @ts-expect-error identity fields are not part of the patch type
      id: 'hijacked',
      vehicleId: 'other',
    });

    expect(store.getState().trackedParts[0]).toMatchObject({
      id: partId,
      vehicleId,
      name: 'Air filter',
    });
  });

  it('clears vehicles and parts and leaves settings', () => {
    const store = createTestStore();
    store.getState().addVehicle(vehicle);
    store.getState().updateSettings({ currency: 'EUR' });

    store.getState().clearGarage();

    expect(store.getState().vehicles).toEqual([]);
    expect(store.getState().trackedParts).toEqual([]);
    expect(store.getState().settings.currency).toBe('EUR');
  });
});

it('preserves commitment and payment dates through status transitions', () => {
  const store = createTestStore();
  const vehicleId = store.getState().addVehicle(vehicle);
  const id = store.getState().addTrackedPart(partFor(vehicleId));
  store.getState().updateTrackedPart(id, { status: 'ordered' });
  const committedAt = store.getState().trackedParts[0].committedAt;
  expect(committedAt).toBeDefined();
  store
    .getState()
    .updateTrackedPart(id, { status: 'installed', actualCost: 300 });
  expect(store.getState().trackedParts[0].committedAt).toBe(committedAt);
  expect(store.getState().trackedParts[0].paidAt).toBeDefined();
  store.getState().updateTrackedPart(id, { paidAt: '2026-09-01T12:00:00' });
  expect(store.getState().trackedParts[0].paidAt).toBe('2026-09-01T12:00:00');
  store.getState().updateTrackedPart(id, { actualCost: undefined });
  expect(store.getState().trackedParts[0].paidAt).toBeUndefined();
});

describe('sync bookkeeping', () => {
  it('stamps updatedAt on add and update', () => {
    const store = createTestStore();
    const vehicleId = store.getState().addVehicle(vehicle);
    const partId = store.getState().addTrackedPart(partFor(vehicleId));
    const before = store.getState().trackedParts[0].updatedAt;
    expect(store.getState().vehicles[0].updatedAt).toEqual(expect.any(String));

    jest.useFakeTimers().setSystemTime(Date.parse(before) + 1000);
    store.getState().updateTrackedPart(partId, { name: 'Air filter' });
    jest.useRealTimers();

    expect(store.getState().trackedParts[0].updatedAt > before).toBe(true);
  });

  it('queues deletions only when signed in', () => {
    const store = createTestStore();
    const first = store.getState().addVehicle(vehicle);
    store.getState().addTrackedPart(partFor(first));
    store.getState().removeVehicle(first);
    expect(store.getState().sync.pendingDeletions).toEqual([]);

    store
      .getState()
      .setAccount({ id: 'u1', email: 'a@example.test', name: 'A' });
    const second = store.getState().addVehicle(vehicle);
    store.getState().addTrackedPart(partFor(second));
    store.getState().removeVehicle(second);
    expect(
      store.getState().sync.pendingDeletions.map(item => item.type),
    ).toEqual(['vehicle', 'part']);
  });

  it('stamps settings changes only for settings stored in the account', () => {
    const store = createTestStore();
    store.getState().updateSettings({ apiBaseUrl: 'http://localhost:3000' });
    expect(store.getState().sync.settingsUpdatedAt).toBeUndefined();
    store.getState().updateSettings({ monthlyBudget: 2000 });
    expect(store.getState().sync.settingsUpdatedAt).toEqual(expect.any(String));
  });

  it('resetLocalAccountData clears the garage and account but keeps settings', () => {
    const store = createTestStore();
    store
      .getState()
      .setAccount({ id: 'u1', email: 'a@example.test', name: 'A' });
    store.getState().addVehicle(vehicle);
    store.getState().updateSettings({ currency: 'EUR' });
    store.getState().resetLocalAccountData();
    expect(store.getState()).toMatchObject({
      account: null,
      vehicles: [],
      trackedParts: [],
      sync: { pendingDeletions: [] },
      settings: expect.objectContaining({ currency: 'EUR' }),
    });
  });
});
