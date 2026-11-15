import { hasPartEstimate } from './partEstimate';
import type { PartPriority, PartStatus, TrackedPart } from '../types';

export type VehicleHealth = {
  neededCount: number;
  urgentCount: number;
  sourcingCount: number;
  orderedCount: number;
  summary: string;
};

const OPEN_STATUSES: PartStatus[] = ['needed', 'sourcing', 'ordered'];

export function getVehicleHealth(parts: TrackedPart[]): VehicleHealth {
  const open = parts.filter(p => OPEN_STATUSES.includes(p.status));
  const neededCount = open.filter(p => p.status === 'needed').length;
  const urgentCount = open.filter(p => p.priority === 'urgent').length;
  const sourcingCount = open.filter(p => p.status === 'sourcing').length;
  const orderedCount = open.filter(p => p.status === 'ordered').length;

  if (open.length === 0) {
    return {
      neededCount: 0,
      urgentCount: 0,
      sourcingCount: 0,
      orderedCount: 0,
      summary: parts.length === 0 ? 'No parts added' : 'All parts installed',
    };
  }

  const bits: string[] = [];
  if (neededCount > 0) {
    bits.push(`${neededCount} part${neededCount === 1 ? '' : 's'} needed`);
  }
  if (sourcingCount > 0) {
    bits.push(`${sourcingCount} sourcing`);
  }
  if (orderedCount > 0) {
    bits.push(`${orderedCount} ordered`);
  }
  if (urgentCount > 0) {
    bits.push(`${urgentCount} urgent`);
  }

  return {
    neededCount,
    urgentCount,
    sourcingCount,
    orderedCount,
    summary: bits.join(', '),
  };
}

const PRIORITY_RANK: Record<PartPriority, number> = {
  urgent: 0,
  soon: 1,
  someday: 2,
};

export function prioritizeParts(parts: TrackedPart[]): TrackedPart[] {
  return [...parts].sort((a, b) => {
    const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (byPriority !== 0) {
      return byPriority;
    }
    if (hasPartEstimate(a) !== hasPartEstimate(b)) {
      return hasPartEstimate(a) ? -1 : 1;
    }
    return a.estimatedCost - b.estimatedCost;
  });
}
