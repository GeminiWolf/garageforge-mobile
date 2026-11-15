export const SPENDING_ALERT_THRESHOLDS = [50, 60, 70, 80, 90, 100] as const;

export type SpendingAlertThreshold = (typeof SPENDING_ALERT_THRESHOLDS)[number];

export function formatSpendingAlertThreshold(percent: number): string {
  return `${percent}%`;
}

export function isSpendingAlertThreshold(
  value: string,
): value is `${SpendingAlertThreshold}` {
  const amount = Number(value);
  return (SPENDING_ALERT_THRESHOLDS as readonly number[]).includes(amount);
}

export function parseSpendingAlertThreshold(value: string): number | null {
  if (!isSpendingAlertThreshold(value)) {
    return null;
  }
  return Number(value);
}

export function isSpendingAlertActive(
  usagePercent: number,
  threshold: number,
): boolean {
  if (!Number.isFinite(usagePercent) || !Number.isFinite(threshold)) {
    return false;
  }
  if (threshold <= 0) {
    return false;
  }
  return usagePercent >= threshold;
}
