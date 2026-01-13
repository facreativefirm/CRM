import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number | string | DecimalValue, currencyCode: string = 'BDT'): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount));

  if (isNaN(num)) return '0.00';

  // In a real app, you might want to fetch the symbol from a store.
  // For now, we'll use a helper to get common symbols.
  const symbol = getCurrencySymbol(currencyCode);

  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    'BDT': '৳',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹'
  };
  return symbols[code] || code;
}

type DecimalValue = {
  toString: () => string;
};
