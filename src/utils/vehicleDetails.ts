import type { UnitSystem } from '../types/garage';

const KM_PER_MILE = 1.609344;
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Local calendar date as YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "12 Nov", or "12 Nov 2025" when not this year. */
export function formatShortDate(value: string, now: Date = new Date()): string {
  // A bare YYYY-MM-DD is a calendar date: read it as local, not UTC.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(
        Number(value.slice(0, 4)),
        Number(value.slice(5, 7)) - 1,
        Number(value.slice(8, 10)),
      )
    : new Date(value);
  const label = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear()
    ? label
    : `${label} ${date.getFullYear()}`;
}

/** 90 → "1 h 30 min", 45 → "45 min", 120 → "2 h". */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

/** Mileage is stored in km and shown in the user's units. */
export function formatMileage(km: number, units: UnitSystem): string {
  const value = units === 'imperial' ? km / KM_PER_MILE : km;
  return `${Math.round(value).toLocaleString('en-ZA').replace(/\s/g, ',')} ${
    units === 'imperial' ? 'mi' : 'km'
  }`;
}

/** Converts a typed reading in the user's units to km. Null if not a number. */
export function parseMileage(text: string, units: UnitSystem): number | null {
  const cleaned = text.replace(/[\s,]/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  const km = units === 'imperial' ? value * KM_PER_MILE : value;
  return km > 5_000_000 ? null : Math.round(km);
}

/** Hours and minutes typed separately → total minutes (1–1440), or null. */
export function parseDuration(hours: string, minutes: string): number | null {
  const h = hours.trim() === '' ? 0 : Number(hours);
  const m = minutes.trim() === '' ? 0 : Number(minutes);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || m < 0) {
    return null;
  }
  const total = h * 60 + m;
  return total >= 1 && total <= 1440 ? total : null;
}
