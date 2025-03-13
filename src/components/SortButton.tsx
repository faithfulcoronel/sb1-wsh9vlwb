import React from 'react';
import { ChevronUp, ChevronDown, SlidersHorizontal } from 'lucide-react';

interface SortButtonProps {
  label: string;
  active: boolean;
  direction: 'asc' | 'desc' | null;
  icon?: React.ReactNode;
  onClick: () => void;
}

function SortButton({ label, active, direction, icon, onClick }: SortButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group inline-flex items-center space-x-1 rounded px-2 py-1 text-sm font-medium
        ${active 
          ? 'bg-primary-50 text-primary-700' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }
        transition-colors duration-150 ease-in-out
      `}
    >
      {icon && <span className="text-gray-400 group-hover:text-gray-500">{icon}</span>}
      <span>{label}</span>
      <span className="flex items-center">
        {active ? (
          direction === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-primary-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-primary-500" />
          )
        ) : (
          <SlidersHorizontal className="h-4 w-4 text-gray-400 group-hover:text-gray-500" />
        )}
      </span>
    </button>
  );
}

export default SortButton;