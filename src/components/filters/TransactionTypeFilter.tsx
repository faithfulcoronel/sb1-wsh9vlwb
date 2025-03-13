import React from 'react';
import { Button } from '../ui/Button';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TransactionTypeFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function TransactionTypeFilter({ value, onChange }: TransactionTypeFilterProps) {
  return (
    <div className="flex space-x-2">
      <Button
        variant={value === 'income' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => onChange(value === 'income' ? 'all' : 'income')}
        icon={<TrendingUp />}
        className="flex-1"
      >
        Income
      </Button>
      <Button
        variant={value === 'expense' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => onChange(value === 'expense' ? 'all' : 'expense')}
        icon={<TrendingDown />}
        className="flex-1"
      >
        Expense
      </Button>
    </div>
  );
}