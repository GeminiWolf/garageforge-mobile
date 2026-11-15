import { getDefaultSettings } from '../config';
import {
  normalizePersistedGarage,
  normalizeTrackedPart,
  normalizeVehicle,
  resolveApiConnection,
} from './normalizePersistedGarage';

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
        id: 'veh_1',
        year: 2015,
        make: 'BMW',
        model: 'M3',
        trim: 'F80',
      },
    ]);
    expect(normalized.trackedParts).toHaveLength(1);
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
