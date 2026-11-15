import { getBudgetOverview, getBudgetPeriodSyncPatch } from './budgetStatus';
import { prioritizeParts } from './healthSummary';
import type { TrackedPart } from '../types/garage';
const settings = {
  monthlyBudget: 5000,
  budgetRollover: false,
  budgetCarryOver: 0,
  spendingAlertThreshold: 80,
};
const now = new Date('2026-10-03T12:00:00');
const part: TrackedPart = {
  id: 'p',
  vehicleId: 'v',
  name: 'Brakes',
  partNumber: '',
  category: 'Brakes',
  priority: 'soon',
  status: 'needed',
  estimatedCost: 1000,
};
const overview = (parts: TrackedPart[]) =>
  getBudgetOverview({ parts, settings, now });
it('keeps commitments deducted when an order is installed', () => {
  const ordered = {
    ...part,
    status: 'ordered' as const,
    committedAt: now.toISOString(),
  };
  expect(overview([ordered]).remaining).toBe(4000);
  expect(overview([{ ...ordered, status: 'installed' }]).remaining).toBe(4000);
});
it('uses actual cost once, replacing the estimated commitment', () => {
  const result = overview([
    {
      ...part,
      status: 'ordered',
      committedAt: now.toISOString(),
      actualCost: 1200,
      paidAt: now.toISOString(),
    },
  ]);
  expect(result.spent).toBe(1200);
  expect(result.committed).toBe(0);
  expect(result.remaining).toBe(3800);
});
it('separates wishlist costs and excludes historical and undated spending', () => {
  const result = overview([
    part,
    {
      ...part,
      id: 'old',
      status: 'installed',
      actualCost: 1000,
      paidAt: '2026-09-01T12:00:00',
    },
    { ...part, id: 'legacy', status: 'ordered' },
  ]);
  expect(result.totalNeeded).toBe(1000);
  expect(result.remaining).toBe(5000);
  expect(result.undatedCount).toBe(1);
});
it('keeps unknown prices behind known prices within the same priority', () => {
  expect(
    prioritizeParts([{ ...part, id: 'unknown', estimatedCost: 0 }, part])[0].id,
  ).toBe('p');
});
it('rolls over the prior month actual usage without a lifetime spending baseline', () => {
  const patch = getBudgetPeriodSyncPatch(
    {
      ...settings,
      budgetRollover: true,
      budgetPeriodKey: '2026-09',
      budgetPeriodCommittedBaseline: 99999,
    },
    1000,
    now,
    1200,
  );
  expect(patch?.budgetCarryOver).toBe(3800);
});
