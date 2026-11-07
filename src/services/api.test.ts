import type { VehicleVariant } from '../types';
import {
  CATALOGUE_MARKED_VERIFIED_LABEL,
  getCatalogProvenanceLabel,
} from '../utils/catalogProvenance';
import { getCategories, getParts, mapCategory, mapVariant } from './api';

jest.mock('react-native-blob-util', () => ({
  fs: {
    dirs: { CacheDir: '/tmp' },
    writeFile: jest.fn(),
  },
}));

function mockJson(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    headers: { get: () => null },
  } as unknown as Response);
}

describe('mapCategory', () => {
  it('maps snake_case parent_id onto the option', () => {
    expect(
      mapCategory({ id: 4, name: 'Filters', parent_id: 12 }),
    ).toEqual({
      id: '4',
      name: 'Filters',
      parent_id: 12,
    });
  });

  it('maps a missing parent_id to null', () => {
    expect(mapCategory({ id: 1, name: 'Engine' })).toEqual({
      id: '1',
      name: 'Engine',
      parent_id: null,
    });
  });
});

function variantFixture(
  overrides: Partial<VehicleVariant> = {},
): VehicleVariant {
  return {
    id: 41,
    model_id: 3,
    year: 2018,
    trim: 'Sport',
    engine_code: 'K20',
    engine_name: '2.0 I4',
    engine_size_l: 2,
    fuel_type: 'petrol',
    transmission: 'manual',
    body_style: 'hatch',
    drive_type: 'fwd',
    source: 'nhtsa.dot.gov',
    source_vehicle_id: null,
    is_verified: false,
    created_at: new Date('2024-01-01'),
    ...overrides,
  };
}

describe('mapVariant', () => {
  it('maps a legacy source/is_verified response without treating hostname or is_verified as independent confirmation', () => {
    const mapped = mapVariant(
      variantFixture({
        source: 'nhtsa.dot.gov',
        is_verified: true,
      }),
    );
    expect(mapped.catalogConfidence).toBe('unknown');
    expect(mapped.independentlyVerified).toBe(false);
  });

  it('maps future catalog_confidence and independently_verified fields', () => {
    const mapped = mapVariant(
      variantFixture({
        catalog_confidence: 'unverified',
        independently_verified: false,
        is_verified: true,
      }),
    );
    expect(mapped.catalogConfidence).toBe('unverified');
    expect(mapped.independentlyVerified).toBe(false);
  });

  it('lets estimated source override contradictory verification flags', () => {
    const mapped = mapVariant(
      variantFixture({
        source: 'estimated',
        is_verified: true,
        catalog_confidence: 'verified',
        independently_verified: true,
      }),
    );
    expect(mapped.catalogConfidence).toBe('estimated');
    expect(mapped.independentlyVerified).toBe(false);
    expect(
      getCatalogProvenanceLabel({
        confidence: mapped.catalogConfidence,
        independentlyVerified: mapped.independentlyVerified,
      }),
    ).toBe('Estimated');
  });

  it('maps catalog_confidence verified to catalogue marked verified, not independent audit wording', () => {
    const mapped = mapVariant(
      variantFixture({
        catalog_confidence: 'verified',
        independently_verified: true,
        is_verified: true,
      }),
    );
    expect(mapped.catalogConfidence).toBe('verified');
    expect(
      getCatalogProvenanceLabel({
        confidence: mapped.catalogConfidence,
        independentlyVerified: mapped.independentlyVerified,
      }),
    ).toBe(CATALOGUE_MARKED_VERIFIED_LABEL);
    expect(
      getCatalogProvenanceLabel({
        confidence: mapped.catalogConfidence,
        independentlyVerified: mapped.independentlyVerified,
      }),
    ).not.toMatch(/independently/i);
  });

  it('maps legacy is_verified with a clear non-hostname source as catalogue marked verified', () => {
    const mapped = mapVariant(
      variantFixture({
        source: 'vpic',
        is_verified: true,
      }),
    );
    expect(mapped.catalogConfidence).toBe('verified');
    expect(
      getCatalogProvenanceLabel({
        confidence: mapped.catalogConfidence,
        independentlyVerified: mapped.independentlyVerified,
      }),
    ).toBe(CATALOGUE_MARKED_VERIFIED_LABEL);
  });
});

describe('getCategories', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests GET /categories for the root level', async () => {
    global.fetch = jest.fn().mockImplementation(() => mockJson([]));

    await getCategories('https://api.example.com');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/categories',
      expect.any(Object),
    );
  });

  it('requests GET /categories?parent_id= when a parent is set', async () => {
    global.fetch = jest.fn().mockImplementation(() => mockJson([]));

    await getCategories('https://api.example.com', '12');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/categories?parent_id=12',
      expect.any(Object),
    );
  });
});

describe('getParts', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests GET /api/v1/parts?category_id=', async () => {
    global.fetch = jest.fn().mockImplementation(() => mockJson([]));

    await getParts('https://api.example.com', '8');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/parts?category_id=8',
      expect.any(Object),
    );
  });
});
