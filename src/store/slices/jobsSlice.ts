import { createId } from '../../utils/createId';
import type { Job } from '../../types/garage';
import { newJob, openJobFor } from '../jobs';
import type { GarageSlice, GarageState, JobsSlice } from '../types';

/**
 * The job new parts, notes and time go under: the car's open job, or a new
 * one when the car isn't in the workshop yet.
 */
export function jobForNewRecord(
  state: Pick<GarageState, 'jobs' | 'vehicles'>,
  vehicleId: string,
  now: string,
): { jobId: string; jobs: Job[] } {
  const open = openJobFor(state.jobs, vehicleId);
  if (open) {
    return { jobId: open.id, jobs: state.jobs };
  }
  const vehicle = state.vehicles.find(item => item.id === vehicleId) ?? {
    id: vehicleId,
  };
  const job = newJob(createId(), vehicle, now, now);
  return { jobId: job.id, jobs: [...state.jobs, job] };
}

export const createJobsSlice: GarageSlice<JobsSlice> = set => ({
  jobs: [],

  startJob: ({ vehicleId, title, mileageIn, customerNote }) => {
    const id = createId();
    const now = new Date().toISOString();
    set(state => {
      // One job per car at a time: anything still open is finished.
      const jobs = state.jobs.map(job =>
        job.vehicleId === vehicleId && job.status === 'open'
          ? { ...job, status: 'done' as const, closedAt: now, updatedAt: now }
          : job,
      );
      const job: Job = {
        id,
        vehicleId,
        status: 'open',
        openedAt: now,
        updatedAt: now,
      };
      if (title?.trim()) job.title = title.trim();
      if (mileageIn != null) job.mileageIn = mileageIn;

      const vehicles =
        mileageIn != null
          ? state.vehicles.map(vehicle =>
              vehicle.id === vehicleId
                ? {
                    ...vehicle,
                    mileage: mileageIn,
                    mileageUpdatedAt: now,
                    updatedAt: now,
                  }
                : vehicle,
            )
          : state.vehicles;
      const notes = customerNote?.trim()
        ? [
            ...state.notes,
            {
              id: createId(),
              vehicleId,
              jobId: id,
              kind: 'customer' as const,
              body: customerNote.trim(),
              writtenAt: now,
              updatedAt: now,
            },
          ]
        : state.notes;
      return { jobs: [...jobs, job], vehicles, notes };
    });
    return id;
  },

  updateJob: (id, patch) => {
    const now = new Date().toISOString();
    set(state => ({
      jobs: state.jobs.map(job => {
        if (job.id !== id) return job;
        const next: Job = { ...job, updatedAt: now };
        if ('title' in patch) {
          const title = patch.title?.trim();
          if (title) next.title = title;
          else delete next.title;
        }
        if ('mileageIn' in patch) {
          if (patch.mileageIn != null) next.mileageIn = patch.mileageIn;
          else delete next.mileageIn;
        }
        return next;
      }),
    }));
  },

  finishJob: id => {
    const now = new Date().toISOString();
    set(state => ({
      jobs: state.jobs.map(job =>
        job.id === id && job.status === 'open'
          ? { ...job, status: 'done', closedAt: now, updatedAt: now }
          : job,
      ),
    }));
  },

  reopenJob: id => {
    const now = new Date().toISOString();
    set(state => {
      const target = state.jobs.find(job => job.id === id);
      if (!target || openJobFor(state.jobs, target.vehicleId)) {
        // The car already has a job in progress.
        return {};
      }
      return {
        jobs: state.jobs.map(job => {
          if (job.id !== id) return job;
          const next: Job = { ...job, status: 'open', updatedAt: now };
          delete next.closedAt;
          return next;
        }),
      };
    });
  },
});
