import type { CurrencyCode } from '../types';

const SYMBOLS: Record<CurrencyCode, string> = {
  ZAR: 'R',
  USD: '$',
  EUR: '€',
};

function formatAmount(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const [intPart, decPart] = String(rounded).split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart != null ? `${withCommas}.${decPart}` : withCommas;
}

export function getCurrencySymbol(currency: CurrencyCode = 'ZAR'): string {
  return SYMBOLS[currency];
}

export function formatMoney(
  amount: number,
  currency: CurrencyCode = 'ZAR',
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${SYMBOLS[currency]}${formatAmount(safe)}`;
}

export function parseMonthlyBudget(value: string): number | null {
  const cleaned = value.trim().replace(/,/g, '');
  if (cleaned === '') {
    return null;
  }
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }
  return Math.round(amount * 100) / 100;
}
