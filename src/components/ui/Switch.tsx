import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: {
    switch: 'w-8 h-5',
    thumb: 'h-4 w-4',
    translate: 'translate-x-3',
  },
  md: {
    switch: 'w-10 h-6',
    thumb: 'h-5 w-5',
    translate: 'translate-x-4',
  },
  lg: {
    switch: 'w-12 h-7',
    thumb: 'h-6 w-6',
    translate: 'translate-x-5',
  },
};

export function Switch({ 
  checked, 
  onChange, 
  disabled = false, 
  label, 
  size = 'md',
  className = '' 
}: SwitchProps) {
  return (
    <label className={`
      inline-flex items-center 
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} 
      ${className}
    `}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div className={`
          ${sizeClasses[size].switch}
          rounded-full
          transition-colors
          duration-200
          ease-in-out
          ${checked 
            ? 'bg-primary dark:bg-primary' 
            : 'bg-gray-200 dark:bg-gray-700'
          }
        `} />
        <div className={`
          ${sizeClasses[size].thumb}
          absolute
          left-0.5
          top-0.5
          bg-white
          dark:bg-gray-100
          rounded-full
          shadow-sm
          transition-transform
          duration-200
          ease-in-out
          ${checked ? sizeClasses[size].translate : 'translate-x-0'}
        `} />
      </div>
      {label && (
        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
          {label}
        </span>
      )}
    </label>
  );
}