import type {
  Job,
  TimeEntry,
  TrackedPart,
  Vehicle,
  VehicleNote,
} from '../types/garage';

/**
 * The job a car gets when its records predate jobs (or came from the
 * website). Derived from the vehicle id, so two phones upgrading the same
 * garage create the same job instead of two. Only the first 8 hex digits
 * change, so the UUID version and variant stay valid.
 */
export function defaultJobId(vehicleId: string): string {
  const head = vehicleId.slice(0, 8);
  if (!/^[0-9a-f]{8}$/i.test(head)) {
    return vehicleId;
  }
  const mixed = (parseInt(head, 16) ^ 0xa5c3e1f7) >>> 0;
  return mixed.toString(16).padStart(8, '0') + vehicleId.slice(8);
}

const byOpenedDesc = (a: Job, b: Job) =>
  Date.parse(b.openedAt) - Date.parse(a.openedAt);

/** All of a car's jobs, newest first. */
export function jobsForVehicle(jobs: Job[], vehicleId: string): Job[] {
  return jobs.filter(job => job.vehicleId === vehicleId).sort(byOpenedDesc);
}

/** The job the car is in for now, if it is in the workshop. */
export function openJobFor(jobs: Job[], vehicleId: string): Job | undefined {
  return jobsForVehicle(jobs, vehicleId).find(job => job.status === 'open');
}

export function newJob(
  id: string,
  vehicle: Pick<Vehicle, 'id' | 'mileage'>,
  openedAt: string,
  now: string,
): Job {
  const job: Job = {
    id,
    vehicleId: vehicle.id,
    status: 'open',
    openedAt,
    updatedAt: now,
  };
  if (vehicle.mileage != null) {
    job.mileageIn = vehicle.mileage;
  }
  return job;
}

type Filed = {
  vehicles: Vehicle[];
  jobs: Job[];
  trackedParts: TrackedPart[];
  notes: VehicleNote[];
  timeEntries: TimeEntry[];
};

type Linked = { id: string; vehicleId: string; jobId?: string };

/**
 * Makes sure every car has a job and every part, note and time entry is
 * filed under one of its car's jobs. Records without a job (saved before
 * jobs existed, or added on the website) go to the car's open job, else its
 * latest job. A car with no jobs at all gets one open job. Returns the same
 * object when nothing needed filing.
 */
export function fileUnderJobs<T extends Filed>(state: T, now: string): T {
  const jobs = [...state.jobs];
  const jobIds = new Map(jobs.map(job => [job.id, job.vehicleId]));
  let changed = false;

  const targets = new Map<string, string>();
  for (const vehicle of state.vehicles) {
    const own = jobsForVehicle(jobs, vehicle.id);
    if (own.length === 0) {
      const id = defaultJobId(vehicle.id);
      const job = newJob(id, vehicle, earliestFor(state, vehicle), now);
      jobs.push(job);
      jobIds.set(id, vehicle.id);
      targets.set(vehicle.id, id);
      changed = true;
    } else {
      targets.set(
        vehicle.id,
        (own.find(job => job.status === 'open') ?? own[0]).id,
      );
    }
  }

  const file = <R extends Linked & { updatedAt: string }>(records: R[]) =>
    records.map(record => {
      if (record.jobId && jobIds.get(record.jobId) === record.vehicleId) {
        return record;
      }
      const target = targets.get(record.vehicleId);
      if (!target) {
        return record;
      }
      changed = true;
      return { ...record, jobId: target, updatedAt: now };
    });

  const trackedParts = file(state.trackedParts);
  const notes = file(state.notes);
  const timeEntries = file(state.timeEntries);
  if (!changed) {
    return state;
  }
  return { ...state, jobs, trackedParts, notes, timeEntries };
}

/** When a car's first job most likely started: its oldest record. */
function earliestFor(state: Filed, vehicle: Vehicle): string {
  const times = [
    ...state.trackedParts
      .filter(part => part.vehicleId === vehicle.id)
      .map(part => part.committedAt ?? part.updatedAt),
    ...state.notes
      .filter(note => note.vehicleId === vehicle.id)
      .map(note => note.writtenAt),
    ...state.timeEntries
      .filter(entry => entry.vehicleId === vehicle.id)
      .map(entry => `${entry.workedOn}T08:00:00.000Z`),
    vehicle.updatedAt,
  ].filter(time => Number.isFinite(Date.parse(time)));
  return times.reduce((min, time) =>
    Date.parse(time) < Date.parse(min) ? time : min,
  );
}
