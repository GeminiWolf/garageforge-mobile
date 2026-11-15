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
  if (vehicle.engineCode) {
    next.engineCode = vehicle.engineCode;
  }
  const customerName = vehicle.customerName?.trim();
  if (customerName) {
    next.customerName = customerName;
  }
  const plate = vehicle.plate?.trim().toUpperCase();
  if (plate) {
    next.plate = plate;
  }
  if (vehicle.mileage != null) {
    next.mileage = vehicle.mileage;
    next.mileageUpdatedAt = now;
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

  updateVehicle: (id, patch) => {
    const now = new Date().toISOString();
    set(state => ({
      vehicles: state.vehicles.map(vehicle => {
        if (vehicle.id !== id) {
          return vehicle;
        }
        const next: Vehicle = { ...vehicle, updatedAt: now };
        // An empty value clears the field.
        if ('engineNumber' in patch) {
          const engineNumber = patch.engineNumber?.trim();
          if (engineNumber) next.engineNumber = engineNumber;
          else delete next.engineNumber;
        }
        if ('customerName' in patch) {
          const customerName = patch.customerName?.trim();
          if (customerName) next.customerName = customerName;
          else delete next.customerName;
        }
        if ('plate' in patch) {
          const plate = patch.plate?.trim().toUpperCase();
          if (plate) next.plate = plate;
          else delete next.plate;
        }
        if ('mileage' in patch) {
          if (patch.mileage != null) {
            next.mileage = patch.mileage;
            next.mileageUpdatedAt = patch.mileageUpdatedAt ?? now;
          } else {
            delete next.mileage;
            delete next.mileageUpdatedAt;
          }
        }
        return next;
      }),
    }));
  },

  removeVehicle: id => {
    set(state => {
      const now = new Date().toISOString();
      const vehicle = state.vehicles.find(item => item.id === id);
      const parts = state.trackedParts.filter(part => part.vehicleId === id);
      return {
        vehicles: state.vehicles.filter(item => item.id !== id),
        trackedParts: state.trackedParts.filter(part => part.vehicleId !== id),
        // The server deletes a vehicle's jobs, notes and time with it.
        jobs: state.jobs.filter(job => job.vehicleId !== id),
        notes: state.notes.filter(note => note.vehicleId !== id),
        timeEntries: state.timeEntries.filter(entry => entry.vehicleId !== id),
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
