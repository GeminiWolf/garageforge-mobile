import type { AppSettings, TrackedPart, UnitSystem, Vehicle } from '../types';

export type GarageExportPayload = {
  exportedAt: string;
  vehicles: Vehicle[];
  trackedParts: TrackedPart[];
  settings: Pick<
    AppSettings,
    | 'currency'
    | 'units'
    | 'region'
    | 'monthlyBudget'
    | 'budgetRollover'
    | 'spendingAlertThreshold'
  >;
};

export function getUnitSystemLabel(units: UnitSystem): string {
  return units === 'metric' ? 'Metric' : 'Imperial';
}

export function isUnitSystem(value: string): value is UnitSystem {
  return value === 'metric' || value === 'imperial';
}

export function buildGarageExportPayload(input: {
  vehicles: Vehicle[];
  trackedParts: TrackedPart[];
  settings: AppSettings;
  exportedAt?: string;
}): GarageExportPayload {
  return {
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    vehicles: input.vehicles,
    trackedParts: input.trackedParts,
    settings: {
      currency: input.settings.currency,
      units: input.settings.units,
      region: input.settings.region,
      monthlyBudget: input.settings.monthlyBudget,
      budgetRollover: input.settings.budgetRollover,
      spendingAlertThreshold: input.settings.spendingAlertThreshold,
    },
  };
}

export function serializeGarageExport(payload: GarageExportPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function getVehicleExportLabel(vehicle: Vehicle): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

export function getPartsExportDescription(count: number): string {
  return count === 1 ? '1 part' : `${count} parts`;
}

export function getTrackedPartsForVehicle(
  trackedParts: TrackedPart[],
  vehicleId: string,
): TrackedPart[] {
  return trackedParts.filter(part => part.vehicleId === vehicleId);
}

export function buildVehicleExportFilename(vehicle: Vehicle): string {
  const slug = `${vehicle.year}-${vehicle.make}-${vehicle.model}`
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '');
  return `${slug}-export.pdf`;
}

export function parseContentDispositionFilename(
  header: string | null | undefined,
): string | null {
  if (header == null || header === '') {
    return null;
  }

  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1].trim());
    } catch {
      return utfMatch[1].trim();
    }
  }

  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted?.[1]) {
    return quoted[1];
  }

  const plain = /filename=([^;]+)/i.exec(header);
  if (plain?.[1]) {
    return plain[1].trim().replace(/^["']|["']$/g, '');
  }

  return null;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
