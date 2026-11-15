import {
  formatDuration,
  formatMileage,
  formatShortDate,
  parseDuration,
  parseMileage,
  toDateKey,
} from './vehicleDetails';

describe('vehicle detail formatting', () => {
  it('formats durations', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(120)).toBe('2 h');
    expect(formatDuration(390)).toBe('6 h 30 min');
  });

  it('formats mileage in the chosen units', () => {
    expect(formatMileage(84320, 'metric')).toBe('84,320 km');
    expect(formatMileage(1609, 'imperial')).toBe('1,000 mi');
  });

  it('parses typed mileage into km', () => {
    expect(parseMileage('84 320', 'metric')).toBe(84320);
    expect(parseMileage('1,000', 'imperial')).toBe(1609);
    expect(parseMileage('lots', 'metric')).toBeNull();
  });

  it('parses hours and minutes', () => {
    expect(parseDuration('1', '30')).toBe(90);
    expect(parseDuration('', '45')).toBe(45);
    expect(parseDuration('0', '0')).toBeNull();
    expect(parseDuration('25', '')).toBeNull();
    expect(parseDuration('1.5', '')).toBeNull();
  });

  it('formats dates without shifting calendar days', () => {
    const now = new Date(2026, 10, 15);
    expect(formatShortDate('2026-11-12', now)).toBe('12 Nov');
    expect(formatShortDate('2025-03-01', now)).toBe('1 Mar 2025');
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
