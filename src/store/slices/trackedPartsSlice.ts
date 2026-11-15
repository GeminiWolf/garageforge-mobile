import { createId } from '../../utils/createId';
import type { NewTrackedPart, TrackedPart } from '../../types/garage';
import type { GarageSlice, TrackedPartsSlice } from '../types';

function toTrackedPart(part: NewTrackedPart, id: string): TrackedPart {
  const next: TrackedPart = {
    id,
    vehicleId: part.vehicleId,
    name: part.name,
    partNumber: part.partNumber,
    category: part.category,
    priority: part.priority,
    status: part.status,
    estimatedCost: part.estimatedCost,
  };
  if (part.estimateProvided != null) {
    next.estimateProvided = part.estimateProvided;
  }
  if (part.actualCost != null) {
    next.actualCost = part.actualCost;
  }
  if (part.notes) {
    next.notes = part.notes;
  }
  if (part.source) {
    next.source = part.source;
  }
  const now = new Date().toISOString();
  if (part.status === 'ordered' || part.status === 'installed') {
    next.committedAt = part.committedAt ?? now;
  }
  if (part.actualCost != null) {
    next.paidAt = part.paidAt ?? now;
  }
  return next;
}

export const createTrackedPartsSlice: GarageSlice<TrackedPartsSlice> = set => ({
  trackedParts: [],

  addTrackedPart: part => {
    const id = part.id ?? createId('part');
    const next = toTrackedPart(part, id);
    set(state => ({ trackedParts: [...state.trackedParts, next] }));
    return id;
  },

  updateTrackedPart: (id, patch) => {
    set(state => ({
      trackedParts: state.trackedParts.map(part =>
        part.id === id
          ? {
              ...part,
              ...patch,
              id: part.id,
              vehicleId: part.vehicleId,
              committedAt:
                patch.committedAt ??
                part.committedAt ??
                (patch.status === 'ordered' || patch.status === 'installed'
                  ? new Date().toISOString()
                  : undefined),
              paidAt:
                patch.actualCost === undefined && 'actualCost' in patch
                  ? undefined
                  : patch.paidAt ??
                    part.paidAt ??
                    (patch.actualCost != null
                      ? new Date().toISOString()
                      : undefined),
            }
          : part,
      ),
    }));
  },

  removeTrackedPart: id => {
    set(state => ({
      trackedParts: state.trackedParts.filter(part => part.id !== id),
    }));
  },
});
