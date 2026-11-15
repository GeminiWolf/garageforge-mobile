import type { Job, TimeEntry, TrackedPart, Vehicle } from '../types/garage';
import { formatVehicleTitle } from './formatVehicleName';
import { formatShortDate } from './vehicleDetails';

/** "CA 123-456" and "ca123456" match the same plate. */
const squash = (text: string) => text.toLowerCase().replace(/[\s\-.]/g, '');

/**
 * True when the search text matches the customer, plate, make, model or
 * year. Every word typed has to match something.
 */
export function carMatches(vehicle: Vehicle, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return true;
  }
  const haystack = [
    vehicle.customerName ?? '',
    vehicle.make,
    vehicle.model,
    vehicle.trim,
    String(vehicle.year),
  ]
    .join(' ')
    .toLowerCase();
  const plate = squash(vehicle.plate ?? '');
  // A plate is often typed with or without its spaces.
  if (plate && plate.includes(squash(query))) {
    return true;
  }
  return words.every(
    word => haystack.includes(word) || (plate !== '' && plate.includes(word)),
  );
}

/** The card title: the customer when there is one, else the car. */
export function carTitle(vehicle: Vehicle): string {
  return vehicle.customerName || formatVehicleTitle(vehicle);
}

/**
 * The line under the title. With a customer it names the car
 * ("Toyota Hilux 2020"); without one it is the year and version.
 */
export function carSubtitle(vehicle: Vehicle): string {
  if (vehicle.customerName) {
    return `${formatVehicleTitle(vehicle)} ${vehicle.year}`;
  }
  const trim = vehicle.trim.trim();
  return [String(vehicle.year), trim].filter(Boolean).join(' · ');
}

/** Two letters for the round badge in lists. */
export function carInitials(vehicle: Vehicle): string {
  const words = carTitle(vehicle).split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** A job's name: its title, or the day it started. */
export function jobTitle(job: Job, now?: Date): string {
  return job.title || `Job on ${formatShortDate(job.openedAt, now)}`;
}

/** "2 Sep – 5 Sep 2026", "Since 10 Nov". */
export function jobDates(job: Job, now: Date = new Date()): string {
  if (job.status === 'open' || !job.closedAt) {
    return `Since ${formatShortDate(job.openedAt, now)}`;
  }
  const start = formatShortDate(job.openedAt, now);
  const end = formatShortDate(job.closedAt, now);
  return start === end ? start : `${start} – ${end}`;
}

export type JobTotals = {
  parts: number;
  /** What the parts cost: paid amounts, else estimates. */
  cost: number;
  minutes: number;
};

export function jobTotals(
  jobId: string,
  parts: TrackedPart[],
  timeEntries: TimeEntry[],
): JobTotals {
  const own = parts.filter(part => part.jobId === jobId);
  return {
    parts: own.length,
    cost: own.reduce(
      (sum, part) => sum + (part.actualCost ?? part.estimatedCost ?? 0),
      0,
    ),
    minutes: timeEntries
      .filter(entry => entry.jobId === jobId)
      .reduce((sum, entry) => sum + entry.minutes, 0),
  };
}

/** When the car was last in: its open job, else when its last job ended. */
export function lastVisit(jobs: Job[]): string | undefined {
  let latest: string | undefined;
  for (const job of jobs) {
    const time = job.status === 'open' ? job.openedAt : job.closedAt;
    if (time && (!latest || Date.parse(time) > Date.parse(latest))) {
      latest = time;
    }
  }
  return latest;
}
