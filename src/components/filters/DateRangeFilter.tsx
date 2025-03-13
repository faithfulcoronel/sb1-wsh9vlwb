import React from 'react';
import { Input } from '../ui/Input';
import { Calendar } from 'lucide-react';

interface DateRangeFilterProps {
  value: {
    start: string;
    end: string;
  };
  onChange: (value: { start: string; end: string }) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex-1 min-w-[200px]">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="date"
          value={value.start}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          icon={<Calendar />}
          label="Start Date"
        />
        <Input
          type="date"
          value={value.end}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          icon={<Calendar />}
          label="End Date"
        />
      </div>
    </div>
  );
}