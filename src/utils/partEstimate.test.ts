import { hasPartEstimate } from './partEstimate';
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
