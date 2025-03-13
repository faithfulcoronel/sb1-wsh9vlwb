import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  helperText?: string;
  options: (SelectOption | SelectGroup)[];
  icon?: React.ReactNode;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 text-sm',
  md: 'h-10 text-base',
  lg: 'h-12 text-lg'
};

const paddingClasses = {
  sm: 'px-2',
  md: 'px-3',
  lg: 'px-4'
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className = '', 
    error, 
    label, 
    helperText, 
    options = [], 
    icon,
    placeholder,
    size = 'md',
    ...props 
  }, ref) => {
    // Check if options are grouped
    const isGrouped = options.length > 0 && 'options' in options[0];

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
              {React.cloneElement(icon as React.ReactElement, {
                className: 'h-5 w-5 text-gray-400 dark:text-gray-500',
              })}
            </div>
          )}
          <select
            ref={ref}
            className={`
              block w-full rounded-btn
              border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-900
              text-gray-900 dark:text-gray-100
              shadow-sm
              focus:border-primary focus:ring-primary
              dark:focus:border-primary dark:focus:ring-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:bg-gray-50 dark:disabled:bg-gray-800
              ${error ? 'border-danger dark:border-danger text-danger dark:text-danger' : ''}
              ${icon ? 'pl-10' : paddingClasses[size]}
              pr-10
              ${sizeClasses[size]}
              appearance-none
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-gray-500 dark:text-gray-400">
                {placeholder}
              </option>
            )}
            {isGrouped ? (
              // Handle grouped options
              (options as SelectGroup[]).map((group) => (
                <optgroup 
                  key={group.label} 
                  label={group.label} 
                  className="text-gray-900 dark:text-gray-100 font-medium"
                >
                  {group.options.map((option) => (
                    <option 
                      key={`${group.label}-${option.value}`} 
                      value={option.value}
                      className="text-gray-900 dark:text-gray-100"
                    >
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))
            ) : (
              // Handle flat options
              (options as SelectOption[]).map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  className="text-gray-900 dark:text-gray-100"
                >
                  {option.label}
                </option>
              ))
            )}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-danger dark:text-danger">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';