import React, { useEffect, useState } from 'react';
import { useCurrencyStore, currencies } from '../stores/currencyStore';
import { CheckCircle2 } from 'lucide-react';

function CurrencySelector() {
  const { currency, setCurrency } = useCurrencyStore();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = currencies[e.target.value];
    setCurrency(newCurrency);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currency-settings') {
        const newData = JSON.parse(e.newValue || '{}');
        if (newData.state?.currency && newData.state.currency !== currency) {
          setCurrency(newData.state.currency);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currency, setCurrency]);

  return (
    <div className="relative">
      <select
        value={currency.code}
        onChange={handleCurrencyChange}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
      >
        {Object.values(currencies).map((curr) => (
          <option key={curr.code} value={curr.code}>
            {curr.code} ({curr.symbol})
          </option>
        ))}
      </select>
      
      {showSuccess && (
        <div className="absolute top-0 -right-8 flex items-center">
          <CheckCircle2 className="h-5 w-5 text-green-500 animate-bounce" />
        </div>
      )}
      
      <p className="mt-2 text-xs text-gray-500">
        Your currency symbol preference is automatically saved
      </p>
    </div>
  );
}

export default CurrencySelector;