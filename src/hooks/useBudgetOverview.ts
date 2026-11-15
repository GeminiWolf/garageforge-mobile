import { useEffect, useMemo } from 'react';
import { useGarageStore } from '../store/garageStore';
import type { TrackedPart } from '../types/garage';
import { getBudgetOverview, type BudgetOverview } from '../utils/budgetStatus';

export function useBudgetOverview(parts: TrackedPart[]): BudgetOverview {
  const settings = useGarageStore(s => s.settings);
  const syncBudgetPeriod = useGarageStore(s => s.syncBudgetPeriod);

  useEffect(() => {
    syncBudgetPeriod();
  }, [syncBudgetPeriod]);

  return useMemo(
    () => getBudgetOverview({ parts, settings }),
    [parts, settings],
  );
}
