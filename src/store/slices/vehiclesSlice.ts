import { createId } from '../../utils/createId';
import type { NewVehicle, Vehicle } from '../../types/garage';
import type { GarageSlice, VehiclesSlice } from '../types';

function toVehicle(vehicle: NewVehicle, id: string): Vehicle {
  const next: Vehicle = {
    id,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
  };
  if (vehicle.engine) {
    next.engine = vehicle.engine;
  }
  return next;
}

export const createVehiclesSlice: GarageSlice<VehiclesSlice> = set => ({
  vehicles: [],

  addVehicle: vehicle => {
    const id = vehicle.id ?? createId('veh');
    const next = toVehicle(vehicle, id);
    set(state => ({
      vehicles: [...state.vehicles, next],
    }));
    return id;
  },

  removeVehicle: id => {
    set(state => ({
      vehicles: state.vehicles.filter(vehicle => vehicle.id !== id),
      trackedParts: state.trackedParts.filter(part => part.vehicleId !== id),
    }));
  },
});
