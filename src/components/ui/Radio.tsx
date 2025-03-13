import React, { forwardRef } from 'react';

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
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
          <input
            ref={ref}
            type="radio"
            className={`
              appearance-none
              ${sizeClasses[size]}
              rounded-full
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
              checked:border-primary
              dark:checked:border-primary
              checked:before:absolute
              checked:before:inset-0
              checked:before:m-auto
              checked:before:h-2.5
              checked:before:w-2.5
              checked:before:rounded-full
              checked:before:bg-primary
              dark:checked:before:bg-primary
              ${error ? 'border-danger dark:border-danger' : ''}
              ${className}
            `}
            {...props}
          />
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

Radio.displayName = 'Radio';