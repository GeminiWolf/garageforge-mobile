import { create } from 'zustand';
import { getDefaultSettings } from '../config';
import { useGarageStore } from '../store/garageStore';
import { SYNCED_SETTING_KEYS } from '../store/slices/settingsSlice';
import { ApiError, request, setSessionToken, getSessionToken } from './api';
import { deleteAccount, getMe, signIn, signOutRemote, signUp } from './auth';
import {
  clearSessionToken,
  loadSessionToken,
  saveSessionToken,
} from './session';
import { applySyncResponse, buildSyncRequest, hasPendingChanges } from './sync';
import type { SyncResponse } from './syncTypes';

export type SyncStatus = {
  state: 'idle' | 'syncing' | 'error';
  message?: string;
};

/** Live sync status for the UI (not persisted). */
export const useSyncStatus = create<SyncStatus>(() => ({ state: 'idle' }));

/**
 * Settings changed before sync existed have no timestamp. Stamping them just
 * after the epoch means they beat a brand-new account's defaults (stamped at
 * the epoch) but lose to settings another device already saved.
 */
const LEGACY_SETTINGS_STAMP = '1970-01-01T00:00:00.001Z';

const baseUrl = () => useGarageStore.getState().settings.apiBaseUrl;

let inFlight: Promise<void> | null = null;
let runAgain = false;

/** Pushes local changes and pulls server changes. One sync at a time. */
export function syncNow(): Promise<void> {
  if (inFlight) {
    runAgain = true;
    return inFlight;
  }
  inFlight = runSync().finally(() => {
    inFlight = null;
    if (runAgain) {
      runAgain = false;
      syncNow().catch(() => undefined);
    }
  });
  return inFlight;
}

async function runSync(): Promise<void> {
  const state = useGarageStore.getState();
  if (!state.account || !getSessionToken()) {
    return;
  }
  const startedAt = new Date().toISOString();
  const body = buildSyncRequest(state);
  useSyncStatus.setState({ state: 'syncing', message: undefined });
  try {
    const response = await request<SyncResponse>(
      baseUrl(),
      '/api/v1/garage/sync',
      { method: 'POST', body: JSON.stringify(body) },
      20000,
    );
    const latest = useGarageStore.getState();
    if (!latest.account) {
      return; // signed out while syncing
    }
    latest.applySyncResult(
      applySyncResponse(
        latest,
        body,
        response,
        startedAt,
        new Date().toISOString(),
      ),
    );
    useSyncStatus.setState({ state: 'idle', message: undefined });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await endExpiredSession();
      return;
    }
    useSyncStatus.setState({
      state: 'error',
      message: syncErrorMessage(error),
    });
  }
}

function differsFromDefaults(): boolean {
  const { settings } = useGarageStore.getState();
  const defaults = getDefaultSettings();
  return SYNCED_SETTING_KEYS.some(key => settings[key] !== defaults[key]);
}

async function startSession(token: string): Promise<void> {
  await saveSessionToken(token);
  setSessionToken(token);
  try {
    const me = await getMe(baseUrl());
    const state = useGarageStore.getState();
    state.setAccount({
      id: me.user.id,
      email: me.user.email,
      name: me.user.name,
    });
    // Upload everything on this device to the account on first sync.
    state.applySyncResult({
      vehicles: state.vehicles,
      jobs: state.jobs,
      trackedParts: state.trackedParts,
      notes: state.notes,
      timeEntries: state.timeEntries,
      settings: state.settings,
      sync: {
        pendingDeletions: [],
        settingsUpdatedAt:
          state.sync.settingsUpdatedAt ??
          (differsFromDefaults() ? LEGACY_SETTINGS_STAMP : undefined),
      },
    });
  } catch (error) {
    await clearSessionToken();
    setSessionToken(null);
    throw error;
  }
  await syncNow();
}

export async function signInWithEmail(email: string, password: string) {
  await startSession(await signIn(baseUrl(), { email, password }));
}

export async function createAccount(
  name: string,
  email: string,
  password: string,
) {
  await startSession(await signUp(baseUrl(), { name, email, password }));
}

/**
 * Signs out and removes the garage from this device (it stays in the
 * account). Returns false without signing out if changes could not be
 * uploaded and `force` is not set.
 */
export async function signOut({ force = false } = {}): Promise<boolean> {
  await syncNow();
  if (!force && hasPendingChanges(useGarageStore.getState())) {
    return false;
  }
  await signOutRemote(baseUrl());
  await clearSessionToken();
  setSessionToken(null);
  useGarageStore.getState().resetLocalAccountData();
  useSyncStatus.setState({ state: 'idle', message: undefined });
  return true;
}

/** Permanently deletes the account and its data, and clears this device. */
export async function deleteMyAccount(): Promise<void> {
  await deleteAccount(baseUrl());
  await clearSessionToken();
  setSessionToken(null);
  useGarageStore.getState().resetLocalAccountData();
  useSyncStatus.setState({ state: 'idle', message: undefined });
}

/** Called after the store loads from disk. */
export async function restoreSession(): Promise<void> {
  const state = useGarageStore.getState();
  let token: string | null = null;
  try {
    token = await loadSessionToken();
  } catch {
    token = null;
  }
  if (state.account && token) {
    setSessionToken(token);
    await syncNow();
  } else if (state.account) {
    // Account remembered but no token (e.g. restored from a backup):
    // keep the garage and ask the user to sign in again.
    await endExpiredSession();
  } else if (token) {
    await clearSessionToken();
  }
}

async function endExpiredSession(): Promise<void> {
  await clearSessionToken().catch(() => undefined);
  setSessionToken(null);
  const state = useGarageStore.getState();
  state.setAccount(null);
  state.applySyncResult({
    vehicles: state.vehicles,
    jobs: state.jobs,
    trackedParts: state.trackedParts,
    notes: state.notes,
    timeEntries: state.timeEntries,
    settings: state.settings,
    sync: { pendingDeletions: [] },
  });
  useSyncStatus.setState({
    state: 'error',
    message: 'Your session ended. Sign in again to keep syncing.',
  });
}

/** Short, calm wording for the sync line in Settings. */
export function syncErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.offline) {
    return 'Offline. Changes will sync when you’re back online.';
  }
  if (error instanceof ApiError && (error.status ?? 0) >= 500) {
    return 'Couldn’t sync just now. It will try again soon.';
  }
  return error instanceof Error ? error.message : 'Couldn’t sync. Try again.';
}
