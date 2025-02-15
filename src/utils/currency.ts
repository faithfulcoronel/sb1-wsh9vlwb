import { Currency } from '../stores/currencyStore';

export function formatCurrency(amount: number | null | undefined, currency: Currency): string {
  if (amount === null || amount === undefined) {
    return `${currency.symbol}0.00`;
  }
  
  return `${currency.symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}