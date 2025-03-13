import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Currency = {
  code: 'USD' | 'PHP' | 'MYR';
  symbol: string;
};

export const currencies: Record<string, Currency> = {
  USD: { code: 'USD', symbol: '$' },
  PHP: { code: 'PHP', symbol: '₱' },
  MYR: { code: 'MYR', symbol: 'RM' },
};

interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: currencies.USD,
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: 'currency-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currency: state.currency }),
      onRehydrateStorage: () => (state) => {
        if (state?.currency && !currencies[state.currency.code]) {
          state.currency = currencies.USD;
        }
      },
    }
  )
);