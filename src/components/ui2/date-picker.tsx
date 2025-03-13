import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
  clearable = true,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setDate(value);
  }, [value]);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    onChange?.(selectedDate);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = new Date(e.target.value);
    if (!isNaN(inputDate.getTime())) {
      handleSelect(inputDate);
    }
  };

  return (
    <div className="relative">
      <Input
        type="date"
        value={date ? format(date, 'yyyy-MM-dd') : ''}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        icon={<CalendarIcon className="h-4 w-4" />}
        clearable={clearable && !!date}
        onClear={() => handleSelect(undefined)}
      />
    </div>
  );
}