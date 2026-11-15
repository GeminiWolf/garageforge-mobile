import type { PartPriority, PartStatus } from '../types/garage';

export const STATUS_ORDER: PartStatus[] = [
  'needed',
  'sourcing',
  'ordered',
  'installed',
];

export const STATUS_LABELS: Record<PartStatus, string> = {
  needed: 'To source',
  sourcing: 'Sourcing',
  ordered: 'Awaiting delivery',
  installed: 'Installed',
};

export const PRIORITY_LABELS: Record<PartPriority, string> = {
  urgent: 'Urgent',
  soon: 'Soon',
  someday: 'Someday',
};

export type PillTone = 'danger' | 'warning' | 'accent' | 'neutral' | 'info';

/** Colour for a part's status pill: awaiting delivery stands out in amber. */
export function statusTone(status: PartStatus): PillTone {
  switch (status) {
    case 'ordered':
      return 'warning';
    case 'installed':
      return 'accent';
    default:
      return 'neutral';
  }
}
