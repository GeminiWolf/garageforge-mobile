import { createId } from '../../utils/createId';
import type { NewTrackedPart, TrackedPart } from '../../types/garage';
import type { GarageSlice, TrackedPartsSlice } from '../types';
import { queueDeletions } from './accountSlice';

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
    updatedAt: new Date().toISOString(),
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
    const id = part.id ?? createId();
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
              updatedAt: new Date().toISOString(),
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
    set(state => {
      const part = state.trackedParts.find(item => item.id === id);
      return {
        trackedParts: state.trackedParts.filter(item => item.id !== id),
        sync: queueDeletions(
          state,
          part
            ? [
                {
                  type: 'part' as const,
                  record: part,
                  deletedAt: new Date().toISOString(),
                },
              ]
            : [],
        ),
      };
    });
  },
});
