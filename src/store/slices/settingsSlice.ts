import { setApiBearerToken } from '../../services/api';
import { getDefaultSettings } from '../../config';
import {
  getBudgetPeriodSyncPatch,
  getCommittedSpend,
  getBudgetOverview,
} from '../../utils/budgetStatus';
import type { GarageSlice, SettingsSlice } from '../types';
import type { AppSettings } from '../../types/garage';

/** Settings stored in the user's account; the rest stay on the device. */
export const SYNCED_SETTING_KEYS = [
  'currency',
  'units',
  'region',
  'monthlyBudget',
  'budgetRollover',
  'spendingAlertThreshold',
] as const satisfies readonly (keyof AppSettings)[];

export const createSettingsSlice: GarageSlice<SettingsSlice> = (set, get) => ({
  settings: getDefaultSettings(),

  updateSettings: patch => {
    set(state => {
      const settings = { ...state.settings, ...patch };
      setApiBearerToken(settings.apiBearerToken ?? '');
      const touchesSynced = SYNCED_SETTING_KEYS.some(
        key => key in patch && patch[key] !== state.settings[key],
      );
      return touchesSynced
        ? {
            settings,
            sync: {
              ...state.sync,
              settingsUpdatedAt: new Date().toISOString(),
            },
          }
        : { settings };
    });
  },

  syncBudgetPeriod: () => {
    const { settings, trackedParts } = get();
    const patch = getBudgetPeriodSyncPatch(
      settings,
      getCommittedSpend(trackedParts),
      new Date(),
      getBudgetOverview({
        parts: trackedParts,
        settings,
        now: new Date(`${settings.budgetPeriodKey}-15T12:00:00`),
      }).used,
    );
    if (patch == null) {
      return;
    }
    set({ settings: { ...settings, ...patch } });
  },
});
