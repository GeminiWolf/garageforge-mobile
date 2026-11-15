import { createId } from '../../utils/createId';
import type { NewVehicle, Vehicle } from '../../types/garage';
import type { GarageSlice, VehiclesSlice } from '../types';
import { queueDeletions } from './accountSlice';

function toVehicle(vehicle: NewVehicle, id: string, now: string): Vehicle {
  const next: Vehicle = {
    id,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    updatedAt: now,
  };
  if (vehicle.engine) {
    next.engine = vehicle.engine;
  }
  return next;
}

export const createVehiclesSlice: GarageSlice<VehiclesSlice> = set => ({
  vehicles: [],

  addVehicle: vehicle => {
    const id = vehicle.id ?? createId();
    const next = toVehicle(vehicle, id, new Date().toISOString());
    set(state => ({
      vehicles: [...state.vehicles, next],
    }));
    return id;
  },

  removeVehicle: id => {
    set(state => {
      const now = new Date().toISOString();
      const vehicle = state.vehicles.find(item => item.id === id);
      const parts = state.trackedParts.filter(part => part.vehicleId === id);
      return {
        vehicles: state.vehicles.filter(item => item.id !== id),
        trackedParts: state.trackedParts.filter(part => part.vehicleId !== id),
        sync: queueDeletions(state, [
          ...(vehicle
            ? [{ type: 'vehicle' as const, record: vehicle, deletedAt: now }]
            : []),
          ...parts.map(record => ({
            type: 'part' as const,
            record,
            deletedAt: now,
          })),
        ]),
      };
    });
  },
});
