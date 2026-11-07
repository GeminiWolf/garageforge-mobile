import {
  CATALOGUE_MARKED_VERIFIED_LABEL,
  getCatalogProvenanceLabel,
  getStoredVehicleProvenanceLabel,
  resolveCatalogProvenance,
} from './catalogProvenance';

function expectNoIndependentClaim(label: string | null) {
  expect(label).not.toMatch(/independently/i);
  expect(label).not.toBe('Independently verified');
}

describe('resolveCatalogProvenance', () => {
  it('treats a legacy hostname source with is_verified true as unknown', () => {
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

  it('uses future catalog_confidence when present', () => {
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
        independently_verified: false,
      }),
    ).toEqual({
      confidence: 'verified',
      independentlyVerified: false,
    });
  });

  it('lets estimated override contradictory verification flags', () => {
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

  it('keeps unknown as unknown and does not invent verified labels', () => {
    const provenance = resolveCatalogProvenance({
      source: 'https://catalogue.example.com',
      is_verified: true,
    });
    expect(provenance.confidence).toBe('unknown');
    expect(getCatalogProvenanceLabel(provenance)).toBe('Unknown');
    expectNoIndependentClaim(getCatalogProvenanceLabel(provenance));
  });

  it('treats legacy is_verified as catalogue verified only for a clear non-estimated source', () => {
    const clear = resolveCatalogProvenance({
      source: 'vpic',
      is_verified: true,
    });
    expect(clear.confidence).toBe('verified');
    expect(getCatalogProvenanceLabel(clear)).toBe(
      CATALOGUE_MARKED_VERIFIED_LABEL,
    );

    expect(
      resolveCatalogProvenance({
        source: 'vpic',
        is_verified: false,
      }).confidence,
    ).toBe('unknown');
  });
});

describe('catalogue status wording', () => {
  it('shows catalogue marked verified for catalog_confidence verified without independently_verified', () => {
    const provenance = resolveCatalogProvenance({
      catalog_confidence: 'verified',
      independently_verified: false,
      is_verified: true,
    });
    expect(provenance.confidence).toBe('verified');
    expect(getCatalogProvenanceLabel(provenance)).toBe(
      CATALOGUE_MARKED_VERIFIED_LABEL,
    );
    expectNoIndependentClaim(getCatalogProvenanceLabel(provenance));
  });

  it('does not treat independently_verified true as an audit we performed', () => {
    const provenance = resolveCatalogProvenance({
      catalog_confidence: 'verified',
      independently_verified: true,
    });
    expect(provenance.confidence).toBe('verified');
    expect(getCatalogProvenanceLabel(provenance)).toBe(
      CATALOGUE_MARKED_VERIFIED_LABEL,
    );
    expectNoIndependentClaim(getCatalogProvenanceLabel(provenance));
  });

  it('does not promote independently_verified alone into catalogue verified', () => {
    const provenance = resolveCatalogProvenance({
      source: 'nhtsa.dot.gov',
      is_verified: true,
      independently_verified: true,
    });
    expect(provenance.confidence).toBe('unknown');
    expect(getCatalogProvenanceLabel(provenance)).toBe('Unknown');
    expectNoIndependentClaim(getCatalogProvenanceLabel(provenance));
  });

  it('keeps unverified and unknown wording clear', () => {
    expect(
      getCatalogProvenanceLabel(
        resolveCatalogProvenance({ catalog_confidence: 'unverified' }),
      ),
    ).toBe('Unverified');
    expect(
      getCatalogProvenanceLabel(
        resolveCatalogProvenance({ catalog_confidence: 'unknown' }),
      ),
    ).toBe('Unknown');
  });
});

describe('getStoredVehicleProvenanceLabel', () => {
  it('does not label vehicles saved before provenance was stored', () => {
    expect(getStoredVehicleProvenanceLabel({})).toBeNull();
  });

  it('does not treat a stored independentlyVerified flag as independent proof', () => {
    expect(
      getStoredVehicleProvenanceLabel({ independentlyVerified: true }),
    ).toBeNull();
    expect(
      getStoredVehicleProvenanceLabel({
        catalogConfidence: 'verified',
        independentlyVerified: true,
      }),
    ).toBe(CATALOGUE_MARKED_VERIFIED_LABEL);
  });

  it('keeps unknown as unknown on stored vehicles', () => {
    expect(
      getStoredVehicleProvenanceLabel({ catalogConfidence: 'unknown' }),
    ).toBe('Unknown');
  });
});
