import {
  getCatalogProvenanceLabel,
  getStoredVehicleProvenanceLabel,
  resolveCatalogProvenance,
} from './catalogProvenance';

describe('resolveCatalogProvenance', () => {
  it('treats a legacy hostname source with is_verified true as unknown, not independently verified', () => {
    expect(
      resolveCatalogProvenance({
        source: 'nhtsa.dot.gov',
        is_verified: true,
      }),
    ).toEqual({
      confidence: 'unknown',
      independentlyVerified: false,
    });
    expect(
      getCatalogProvenanceLabel(
        resolveCatalogProvenance({
          source: 'carqueryapi.com',
          is_verified: true,
        }),
      ),
    ).toBe('Unknown');
  });

  it('uses future catalog_confidence and independently_verified when present', () => {
    expect(
      resolveCatalogProvenance({
        source: 'nhtsa.dot.gov',
        is_verified: false,
        catalog_confidence: 'unverified',
        independently_verified: false,
      }),
    ).toEqual({
      confidence: 'unverified',
      independentlyVerified: false,
    });
    expect(
      resolveCatalogProvenance({
        catalog_confidence: 'verified',
        independently_verified: true,
      }),
    ).toEqual({
      confidence: 'verified',
      independentlyVerified: true,
    });
  });

  it('never treats an estimated source as independently confirmed, even when flags say otherwise', () => {
    expect(
      resolveCatalogProvenance({
        source: 'estimated',
        is_verified: true,
        catalog_confidence: 'verified',
        independently_verified: true,
      }),
    ).toEqual({
      confidence: 'estimated',
      independentlyVerified: false,
    });
    expect(
      getCatalogProvenanceLabel(
        resolveCatalogProvenance({
          source: 'Estimated',
          is_verified: true,
          independently_verified: true,
        }),
      ),
    ).toBe('Estimated');
  });

  it('does not invent verified or unverified labels when confidence is unknown', () => {
    const provenance = resolveCatalogProvenance({
      source: 'https://catalogue.example.com',
      is_verified: true,
    });
    expect(provenance.confidence).toBe('unknown');
    expect(provenance.independentlyVerified).toBe(false);
    expect(getCatalogProvenanceLabel(provenance)).toBe('Unknown');
    expect(getCatalogProvenanceLabel(provenance)).not.toMatch(/verified/i);
  });

  it('does not overstate catalogue-verified as independently verified', () => {
    const provenance = resolveCatalogProvenance({
      catalog_confidence: 'verified',
      independently_verified: false,
      is_verified: true,
    });
    expect(provenance).toEqual({
      confidence: 'verified',
      independentlyVerified: false,
    });
    expect(getCatalogProvenanceLabel(provenance)).toBeNull();
  });
});

describe('getStoredVehicleProvenanceLabel', () => {
  it('does not label vehicles saved before provenance was stored', () => {
    expect(getStoredVehicleProvenanceLabel({})).toBeNull();
  });

  it('keeps unknown as unknown on stored vehicles', () => {
    expect(
      getStoredVehicleProvenanceLabel({ catalogConfidence: 'unknown' }),
    ).toBe('Unknown');
  });
});
