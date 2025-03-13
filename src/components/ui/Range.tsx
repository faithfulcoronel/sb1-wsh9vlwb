import React, { forwardRef } from 'react';

interface RangeProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
}

const variantClasses = {
  primary: 'text-primary dark:text-primary',
  secondary: 'text-secondary dark:text-secondary',
  success: 'text-success dark:text-success',
  danger: 'text-danger dark:text-danger',
  warning: 'text-warning dark:text-warning',
  info: 'text-info dark:text-info'
};

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
};

export const Range = forwardRef<HTMLInputElement, RangeProps>(
  ({ 
    className = '', 
    label, 
    error, 
    helperText, 
    showValue = false,
    size = 'md',
    variant = 'primary',
    value,
    ...props 
  }, ref) => {
    return (
      <div className="w-full">
        {(label || showValue) && (
          <div className="flex justify-between mb-2">
            {label && (
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                {label}
              </label>
            )}
            {showValue && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {value}
              </span>
            )}
          </div>
        )}

        <div className="relative">
          <input
            ref={ref}
            type="range"
            className={`
              appearance-none
              w-full
              ${sizeClasses[size]}
              rounded-full
              bg-gray-200
              dark:bg-gray-700
              cursor-pointer
              focus:outline-none
              focus:ring-2
              focus:ring-offset-2
              focus:ring-primary
              dark:focus:ring-primary
              dark:focus:ring-offset-gray-900
              disabled:opacity-50
              disabled:cursor-not-allowed
              ${variantClasses[variant]}

              /* Thumb styles */
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-current
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:duration-200
              [&::-webkit-slider-thumb]:hover:scale-110

              [&::-moz-range-thumb]:appearance-none
              [&::-moz-range-thumb]:border-0
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-current
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:transition-transform
              [&::-moz-range-thumb]:duration-200
              [&::-moz-range-thumb]:hover:scale-110

              /* Track styles */
              [&::-webkit-slider-runnable-track]:rounded-full
              [&::-webkit-slider-runnable-track]:bg-gray-200
              [&::-webkit-slider-runnable-track]:dark:bg-gray-700

              [&::-moz-range-track]:rounded-full
              [&::-moz-range-track]:bg-gray-200
              [&::-moz-range-track]:dark:bg-gray-700

              ${error ? 'bg-danger-light dark:bg-danger-light' : ''}
              ${className}
            `}
            value={value}
            {...props}
          />

          {/* Progress fill */}
          <div
            className={`
              absolute
              top-0
              left-0
              ${sizeClasses[size]}
              rounded-full
              pointer-events-none
              ${variantClasses[variant]}
              opacity-20
            `}
            style={{
              width: `${((Number(value) - (props.min || 0)) / ((props.max || 100) - (props.min || 0))) * 100}%`
            }}
          />
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

Range.displayName = 'Range';