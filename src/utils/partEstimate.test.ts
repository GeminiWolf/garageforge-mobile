import { hasPartEstimate, partPrice } from './partEstimate';
import { normalizeTrackedPart } from '../store/normalizePersistedGarage';

it('distinguishes blank and explicit zero estimates after persistence', () => {
  const base = {
    id: 'p1',
    vehicleId: 'v1',
    name: 'Brake booster',
    partNumber: '187',
    category: 'Brakes',
    priority: 'soon',
    status: 'needed',
    estimatedCost: 0,
  };
  const blank = normalizeTrackedPart({ ...base, estimateProvided: false })!;
  const zero = normalizeTrackedPart({ ...base, estimateProvided: true })!;
  expect(hasPartEstimate(blank)).toBe(false);
  expect(hasPartEstimate(zero)).toBe(true);
  expect(hasPartEstimate({ estimatedCost: 250 })).toBe(true);
  expect(hasPartEstimate({ estimatedCost: 0 })).toBe(false);
});

describe('partPrice', () => {
  it('shows what was paid once it is known', () => {
    expect(
      partPrice({
        estimatedCost: 900,
        actualCost: 860,
        estimateProvided: true,
      }),
    ).toEqual({ amount: 860, paid: true });
  });

  it('falls back to the estimate', () => {
    expect(partPrice({ estimatedCost: 900, estimateProvided: true })).toEqual({
      amount: 900,
      paid: false,
    });
  });

  it('has no price without an estimate or a cost', () => {
    expect(partPrice({ estimatedCost: 0, estimateProvided: false })).toBeNull();
  });

  it('shows a free part that was paid as R0', () => {
    expect(
      partPrice({ estimatedCost: 0, actualCost: 0, estimateProvided: false }),
    ).toEqual({ amount: 0, paid: true });
  });
});
