import { createId } from '../../utils/createId';
import type { GarageSlice, VehicleLogSlice } from '../types';
import { queueDeletions } from './accountSlice';

/** Notes and time spent on each vehicle. Both sync like parts. */
export const createVehicleLogSlice: GarageSlice<VehicleLogSlice> = set => ({
  notes: [],
  timeEntries: [],

  addNote: ({ vehicleId, kind, body }) => {
    const id = createId();
    const now = new Date().toISOString();
    set(state => ({
      notes: [
        ...state.notes,
        {
          id,
          vehicleId,
          kind,
          body: body.trim(),
          writtenAt: now,
          updatedAt: now,
        },
      ],
    }));
    return id;
  },

  updateNote: (id, patch) => {
    const now = new Date().toISOString();
    set(state => ({
      notes: state.notes.map(note =>
        note.id === id
          ? {
              ...note,
              ...patch,
              body: (patch.body ?? note.body).trim(),
              updatedAt: now,
            }
          : note,
      ),
    }));
  },

  removeNote: id => {
    set(state => {
      const note = state.notes.find(item => item.id === id);
      return {
        notes: state.notes.filter(item => item.id !== id),
        sync: note
          ? queueDeletions(state, [
              {
                type: 'note',
                record: note,
                deletedAt: new Date().toISOString(),
              },
            ])
          : state.sync,
      };
    });
  },

  addTimeEntry: ({ vehicleId, minutes, workedOn, note }) => {
    const id = createId();
    const now = new Date().toISOString();
    set(state => ({
      timeEntries: [
        ...state.timeEntries,
        {
          id,
          vehicleId,
          minutes: Math.round(minutes),
          workedOn,
          ...(note?.trim() ? { note: note.trim() } : {}),
          updatedAt: now,
        },
      ],
    }));
    return id;
  },

  removeTimeEntry: id => {
    set(state => {
      const entry = state.timeEntries.find(item => item.id === id);
      return {
        timeEntries: state.timeEntries.filter(item => item.id !== id),
        sync: entry
          ? queueDeletions(state, [
              {
                type: 'timeEntry',
                record: entry,
                deletedAt: new Date().toISOString(),
              },
            ])
          : state.sync,
      };
    });
  },
});
