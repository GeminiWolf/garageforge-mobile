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
  const confidence: CatalogConfidence = estimated
    ? 'estimated'
    : fromField ?? 'unknown';

  // is_verified and source hostnames are not independent confirmation.
  const independentlyVerified =
    confidence !== 'estimated' &&
    confidence !== 'unverified' &&
    input.independently_verified === true;

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
  if (provenance.independentlyVerified) {
    return 'Independently verified';
  }
  if (provenance.confidence === 'unknown') {
    return 'Unknown';
  }
  return null;
}

export function getStoredVehicleProvenanceLabel(
  vehicle: Pick<Vehicle, 'catalogConfidence' | 'independentlyVerified'>,
): string | null {
  if (
    vehicle.catalogConfidence == null &&
    vehicle.independentlyVerified == null
  ) {
    return null;
  }
  return getCatalogProvenanceLabel({
    confidence: vehicle.catalogConfidence ?? 'unknown',
    independentlyVerified: vehicle.independentlyVerified === true,
  });
}
