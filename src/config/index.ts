import { Platform } from 'react-native';
import type { AppSettings } from '../types/garage';
import { getBudgetPeriodKey } from '../utils/budgetStatus';

export const STORAGE_KEY = 'garageforge.v1';

export const BASE_URL_OBJ = {
  production: 'https://auto-v-backend-production.up.railway.app',
  localAndroid: 'http://10.0.2.2:3000',
  localIOS: 'http://localhost:3000',
};

/** Host docs/privacy-policy.md and set this to the live HTTPS URL before store submission. */
export const PRIVACY_POLICY_URL =
  'https://example.com/garage-forge-privacy-policy';

export function getDefaultApiBaseUrl(): string {
  if (!__DEV__) {
    return BASE_URL_OBJ.production;
  }

  return Platform.OS === 'android'
    ? BASE_URL_OBJ.localAndroid
    : BASE_URL_OBJ.localIOS;
}

export function getDefaultSettings(): AppSettings {
  return {
    currency: 'ZAR',
    units: 'metric',
    monthlyBudget: 0,
    budgetRollover: false,
    budgetCarryOver: 0,
    budgetPeriodKey: getBudgetPeriodKey(),
    budgetPeriodCommittedBaseline: 0,
    spendingAlertThreshold: 80,
    region: 'AF',
    apiBaseUrl: getDefaultApiBaseUrl(),
    apiBearerToken: '',
  };
}

export const YEAR_RANGE = { min: 2010, max: 2026 };
