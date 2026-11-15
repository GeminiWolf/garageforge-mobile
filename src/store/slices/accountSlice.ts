import type { PendingDeletion, SyncState } from '../../types/garage';
import type { AccountSlice, GarageSlice, GarageState } from '../types';

export function emptySyncState(): SyncState {
  return { pendingDeletions: [] };
}

/**
 * Deletions only need to reach the server when signed in; local-only
 * records were never uploaded, so nothing is queued for them.
 */
export function queueDeletions(
  state: Pick<GarageState, 'account' | 'sync'>,
  deletions: PendingDeletion[],
): SyncState {
  if (!state.account || deletions.length === 0) {
    return state.sync;
  }
  return {
    ...state.sync,
    pendingDeletions: [...state.sync.pendingDeletions, ...deletions],
  };
}

export const createAccountSlice: GarageSlice<AccountSlice> = set => ({
  account: null,
  sync: emptySyncState(),

  setAccount: account => set({ account }),

  applySyncResult: result => set(result),

  resetLocalAccountData: () =>
    set({
      account: null,
      sync: emptySyncState(),
      vehicles: [],
      jobs: [],
      trackedParts: [],
      notes: [],
      timeEntries: [],
    }),
});
