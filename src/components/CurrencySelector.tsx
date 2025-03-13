import React from 'react';
import { useCurrencyStore, currencies } from '../stores/currencyStore';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui2/select';
import { DollarSign, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from './ui2/card';

function CurrencySelector() {
  const { currency, setCurrency } = useCurrencyStore();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium">Currency Settings</h3>
            </div>
            {currency && (
              <div className="flex items-center text-sm text-success">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                <span>Saved</span>
              </div>
            )}
          </div>

          <Select
            value={currency.code}
            onValueChange={(value) => setCurrency(currencies[value])}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(currencies).map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  <div className="flex items-center">
                    <span className="mr-2">{curr.symbol}</span>
                    <span>{curr.code}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-sm text-muted-foreground">
            Your currency preference is automatically saved
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default CurrencySelector;