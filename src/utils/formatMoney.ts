import type {CurrencyCode} from '../types';

const SYMBOLS: Record<CurrencyCode, string> = {
  ZAR: 'R',
  USD: '$',
  EUR: '€',
};

const LOCALE_MAP: Record<CurrencyCode, string> = {
  ZAR: 'en-ZA',
  USD: 'en-US',
  EUR: 'en-ZA',
};

const formatters: Map<CurrencyCode, Intl.NumberFormat> = new Map();

function getFormatter(currency: CurrencyCode): Intl.NumberFormat {
  if (!formatters.has(currency)) {
    try {
      const locale = LOCALE_MAP[currency];
      const formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      formatters.set(currency, formatter);
    } catch {
      const fallback = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      formatters.set(currency, fallback);
    }
  }
  return formatters.get(currency)!;
}

export function getCurrencySymbol(currency: CurrencyCode = 'ZAR'): string {
  return SYMBOLS[currency];
}

export function formatMoney(
  amount: number,
  currency: CurrencyCode = 'ZAR',
): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatter = getFormatter(currency);
  const formatted = formatter.format(safe);
  return `${SYMBOLS[currency]}${formatted}`;
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
