import { formatRelativeTime } from './formatRelativeTime';

export type SyncLine = {
  text: string;
  /** True when the garage is not backed up and the user can retry. */
  problem: boolean;
};

/**
 * The short sync note under the garage title. Says plainly when the last
 * attempt failed instead of showing an old "synced" time.
 */
export function describeSyncLine(
  state: 'idle' | 'syncing' | 'error',
  lastSyncedAt: string | undefined,
  now: Date = new Date(),
): SyncLine {
  if (state === 'syncing') {
    return { text: 'syncing…', problem: false };
  }
  if (state === 'error') {
    return {
      text: lastSyncedAt
        ? `not synced since ${formatRelativeTime(lastSyncedAt, now)}`
        : 'not synced yet',
      problem: true,
    };
  }
  return lastSyncedAt
    ? {
        text: `synced ${formatRelativeTime(lastSyncedAt, now)}`,
        problem: false,
      }
    : { text: 'not synced yet', problem: false };
}
