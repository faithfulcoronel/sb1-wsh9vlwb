import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ 
    className = '', 
    label, 
    error, 
    helperText,
    size = 'md',
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };

    return (
      <div className="relative flex items-start">
        <div className="flex items-center h-5">
          <div className="relative">
            <input
              ref={ref}
              type="checkbox"
              className={`
                peer
                appearance-none
                ${sizeClasses[size]}
                rounded-[4px]
                border
                border-gray-300
                dark:border-gray-600
                bg-white
                dark:bg-gray-900
                text-primary
                dark:text-primary
                shadow-sm
                focus:ring-2
                focus:ring-primary
                dark:focus:ring-primary
                focus:ring-offset-2
                dark:focus:ring-offset-gray-900
                disabled:opacity-50
                disabled:cursor-not-allowed
                ${error ? 'border-danger dark:border-danger' : ''}
                ${className}
              `}
              {...props}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity">
              <Check 
                className={`
                  text-white dark:text-white
                  ${size === 'sm' ? 'h-3 w-3' : ''}
                  ${size === 'md' ? 'h-4 w-4' : ''}
                  ${size === 'lg' ? 'h-5 w-5' : ''}
                `} 
              />
            </div>
          </div>
        </div>

        {label && (
          <div className="ml-3 text-sm">
            <label className={`
              font-medium 
              text-gray-900 
              dark:text-gray-100
              ${props.disabled ? 'opacity-50' : ''}
            `}>
              {label}
            </label>
            {helperText && (
              <p className="text-gray-500 dark:text-gray-400">{helperText}</p>
            )}
            {error && (
              <p className="text-danger dark:text-danger">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';