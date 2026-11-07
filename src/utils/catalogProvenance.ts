import type { CatalogConfidence, Vehicle } from '../types';

export type CatalogProvenanceInput = {
  source?: string | null;
  is_verified?: boolean | null;
  catalog_confidence?: string | null;
  independently_verified?: boolean | null;
};

export type CatalogProvenance = {
  confidence: CatalogConfidence;
  independentlyVerified: boolean;
};

export const CATALOGUE_MARKED_VERIFIED_LABEL = 'Catalogue marked verified';

const CATALOG_CONFIDENCE_VALUES: CatalogConfidence[] = [
  'estimated',
  'verified',
  'unverified',
  'unknown',
];

function isCatalogConfidence(value: string): value is CatalogConfidence {
  return CATALOG_CONFIDENCE_VALUES.includes(value as CatalogConfidence);
}

function isEstimatedSource(source: string | null | undefined): boolean {
  return (
    typeof source === 'string' && source.trim().toLowerCase() === 'estimated'
  );
}

function isHostnameLikeSource(source: string): boolean {
  const value = source.trim().toLowerCase();
  if (!value) {
    return false;
  }
  if (value.includes('://') || value.includes('/') || value.includes(':')) {
    return true;
  }
  return value.includes('.') && !/\s/.test(value);
}

function isClearClassificationSource(
  source: string | null | undefined,
): boolean {
  if (typeof source !== 'string') {
    return false;
  }
  const value = source.trim();
  if (!value || isEstimatedSource(value) || isHostnameLikeSource(value)) {
    return false;
  }
  return /^[a-z0-9][a-z0-9_-]*$/i.test(value);
}

function normalizeConfidence(
  value: string | null | undefined,
): CatalogConfidence | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return isCatalogConfidence(normalized) ? normalized : null;
}

export function resolveCatalogProvenance(
  input: CatalogProvenanceInput,
): CatalogProvenance {
  const fromField = normalizeConfidence(input.catalog_confidence);
  const estimated =
    fromField === 'estimated' || isEstimatedSource(input.source);

  let confidence: CatalogConfidence;
  if (estimated) {
    confidence = 'estimated';
  } else if (fromField) {
    confidence = fromField;
  } else if (
    input.is_verified === true &&
    isClearClassificationSource(input.source)
  ) {
    confidence = 'verified';
  } else {
    confidence = 'unknown';
  }

  // independently_verified is a stored catalogue assertion, not an audit we did.
  const independentlyVerified =
    !estimated && input.independently_verified === true;

  return { confidence, independentlyVerified };
}

export function getCatalogProvenanceLabel(
  provenance: CatalogProvenance,
): string | null {
  if (provenance.confidence === 'estimated') {
    return 'Estimated';
  }
  if (provenance.confidence === 'unverified') {
    return 'Unverified';
  }
  if (provenance.confidence === 'unknown') {
    return 'Unknown';
  }
  if (provenance.confidence === 'verified') {
    return CATALOGUE_MARKED_VERIFIED_LABEL;
  }
  return null;
}

export function getStoredVehicleProvenanceLabel(
  vehicle: Pick<Vehicle, 'catalogConfidence' | 'independentlyVerified'>,
): string | null {
  if (vehicle.catalogConfidence == null) {
    return null;
  }
  return getCatalogProvenanceLabel({
    confidence: vehicle.catalogConfidence,
    independentlyVerified: false,
  });
}
