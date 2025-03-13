import React from 'react';
import { Input } from '../ui/Input';
import { DollarSign } from 'lucide-react';

interface AmountRangeFilterProps {
  value: {
    min: string;
    max: string;
  };
  onChange: (value: { min: string; max: string }) => void;
}

export function AmountRangeFilter({ value, onChange }: AmountRangeFilterProps) {
  return (
    <div className="flex-1 min-w-[200px]">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="number"
          value={value.min}
          onChange={(e) => onChange({ ...value, min: e.target.value })}
          icon={<DollarSign />}
          label="Min Amount"
          placeholder="0.00"
        />
        <Input
          type="number"
          value={value.max}
          onChange={(e) => onChange({ ...value, max: e.target.value })}
          icon={<DollarSign />}
          label="Max Amount"
          placeholder="0.00"
        />
      </div>
    </div>
  );
}