import { formatVehicleTitle, formatVehicleMeta } from './formatVehicleName';
import { getVehicleHealth } from './healthSummary';
import type { TrackedPart } from '../types';

it('separates identity and removes a repeated model prefix from the variant', () => {
  const vehicle = {
    year: 2021,
    make: 'Audi',
    model: 'A3',
    trim: 'A3 Sedan 40 TFSI S line',
  };
  expect(formatVehicleTitle(vehicle)).toBe('Audi A3');
  expect(formatVehicleMeta(vehicle)).toBe('2021 · Sedan 40 TFSI S line');
  expect(formatVehicleMeta({ ...vehicle, trim: 'A30 special' })).toBe(
    '2021 · A30 special',
  );
});

it('distinguishes an empty build from a completed parts list', () => {
  expect(getVehicleHealth([]).summary).toBe('No parts added');
  expect(
    getVehicleHealth([{ status: 'installed' } as TrackedPart]).summary,
  ).toBe('All parts installed');
});
