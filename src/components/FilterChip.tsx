import React from 'react';
import { X } from 'lucide-react';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  icon?: React.ReactNode;
}

function FilterChip({ label, onRemove, icon }: FilterChipProps) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-700">
      {icon && <span className="mr-1.5">{icon}</span>}
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-1.5 inline-flex items-center justify-center rounded-full hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
      >
        <X className="h-4 w-4" />
      </button>
    </span>
  );
}

export default FilterChip;
