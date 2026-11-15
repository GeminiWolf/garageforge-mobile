import type { Vehicle } from '../types';

type VehicleIdentity = Pick<Vehicle, 'year' | 'make' | 'model' | 'trim'>;

export function formatVehicleTitle(vehicle: VehicleIdentity): string {
  return [vehicle.make, vehicle.model]
    .map(value => value.trim())
    .filter(Boolean)
    .join(' ');
}

export function formatVehicleMeta(vehicle: VehicleIdentity): string {
  const model = vehicle.model.trim();
  const trim = vehicle.trim.trim();
  // Catalogue variants often include the model as their first word.
  const detail =
    model && trim.toLowerCase().startsWith(`${model.toLowerCase()} `)
      ? trim.slice(model.length).trim()
      : trim.toLowerCase() === model.toLowerCase()
      ? ''
      : trim;
  return [vehicle.year, detail].filter(Boolean).join(' · ');
}

export function formatVehicleName(vehicle: VehicleIdentity): string {
  return [formatVehicleTitle(vehicle), formatVehicleMeta(vehicle)]
    .filter(Boolean)
    .join(' · ');
}
