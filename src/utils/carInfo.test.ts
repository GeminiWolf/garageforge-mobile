import type { Vehicle } from '../types/garage';
import {
  carInitials,
  carMatches,
  carSubtitle,
  carTitle,
  jobDates,
  jobTitle,
  jobTotals,
  lastVisit,
} from './carInfo';

const hilux: Vehicle = {
  id: 'v1',
  year: 2020,
  make: 'Toyota',
  model: 'Hilux',
  trim: '2.8 GD-6',
  customerName: 'Thabo Mokoena',
  plate: 'CA 123-456',
  updatedAt: '2026-11-10T00:00:00.000Z',
};
const own: Vehicle = {
  id: 'v2',
  year: 2017,
  make: 'VW',
  model: 'Polo Vivo',
  trim: '',
  updatedAt: '2026-11-10T00:00:00.000Z',
};
const NOW = new Date('2026-11-15T12:00:00.000Z');

describe('carMatches', () => {
  it.each([
    ['thabo', true],
    ['mokoena hilux', true],
    ['CA 123', true],
    ['ca123456', true],
    ['123-456', true],
    ['2020', true],
    ['polo', false],
    ['thabo polo', false],
    ['', true],
  ])('%s → %s', (query, expected) => {
    expect(carMatches(hilux, query)).toBe(expected);
  });

  it('works for a car with no customer or plate', () => {
    expect(carMatches(own, 'vivo')).toBe(true);
    expect(carMatches(own, 'CA')).toBe(false);
  });
});

describe('labels', () => {
  it('leads with the customer, else the car', () => {
    expect(carTitle(hilux)).toBe('Thabo Mokoena');
    expect(carSubtitle(hilux)).toBe('Toyota Hilux 2020');
    expect(carTitle(own)).toBe('VW Polo Vivo');
    expect(carSubtitle(own)).toBe('2017');
    expect(carInitials(hilux)).toBe('TM');
    expect(carInitials(own)).toBe('VV');
  });

  it('names and dates jobs', () => {
    const job = {
      id: 'j1',
      vehicleId: 'v1',
      status: 'done' as const,
      openedAt: '2026-09-02T08:00:00.000Z',
      closedAt: '2026-09-05T15:00:00.000Z',
      updatedAt: '2026-09-05T15:00:00.000Z',
    };
    expect(jobTitle(job, NOW)).toBe('Job on 2 Sep');
    expect(jobTitle({ ...job, title: 'Front suspension' })).toBe(
      'Front suspension',
    );
    expect(jobDates(job, NOW)).toBe('2 Sep – 5 Sep');
    expect(jobDates({ ...job, status: 'open' }, NOW)).toBe('Since 2 Sep');
    expect(lastVisit([job, { ...job, id: 'j2', status: 'open' }])).toBe(
      '2026-09-05T15:00:00.000Z',
    );
  });
});

describe('jobTotals', () => {
  it('adds up parts, cost (paid, else estimate) and time for one job', () => {
    const base = {
      vehicleId: 'v1',
      partNumber: '',
      category: '',
      priority: 'soon' as const,
      status: 'installed' as const,
      updatedAt: '',
    };
    expect(
      jobTotals(
        'j1',
        [
          { ...base, id: 'p1', jobId: 'j1', name: 'A', estimatedCost: 100 },
          {
            ...base,
            id: 'p2',
            jobId: 'j1',
            name: 'B',
            estimatedCost: 100,
            actualCost: 80,
          },
          { ...base, id: 'p3', jobId: 'j2', name: 'C', estimatedCost: 999 },
        ],
        [
          {
            id: 't1',
            vehicleId: 'v1',
            jobId: 'j1',
            minutes: 90,
            workedOn: '2026-09-02',
            updatedAt: '',
          },
        ],
      ),
    ).toEqual({ parts: 2, cost: 180, minutes: 90 });
  });
});
