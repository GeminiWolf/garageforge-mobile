import type { TrackedPart } from '../types/garage';

export function hasPartEstimate(
  part: Pick<TrackedPart, 'estimatedCost' | 'estimateProvided'>,
): boolean {
  return part.estimateProvided ?? part.estimatedCost !== 0;
}

export type PartPrice = { amount: number; paid: boolean };

/**
 * The price to show for a part: what it actually cost once that's known,
 * else the estimate, else nothing. Matches how job and budget totals add up.
 */
export function partPrice(
  part: Pick<TrackedPart, 'actualCost' | 'estimatedCost' | 'estimateProvided'>,
): PartPrice | null {
  if (part.actualCost != null) {
    return { amount: part.actualCost, paid: true };
  }
  return hasPartEstimate(part)
    ? { amount: part.estimatedCost, paid: false }
    : null;
}
