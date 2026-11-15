import type { TrackedPart } from '../types/garage';

export function hasPartEstimate(
  part: Pick<TrackedPart, 'estimatedCost' | 'estimateProvided'>,
): boolean {
  return part.estimateProvided ?? part.estimatedCost !== 0;
}
