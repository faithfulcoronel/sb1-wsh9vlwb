import React, { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  resize?: boolean;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className = '', 
    error, 
    label, 
    helperText,
    size = 'md',
    resize = true,
    required,
    disabled,
    ...props 
  }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            block w-full
            rounded-btn
            border-gray-300 dark:border-gray-600
            shadow-sm
            focus:border-primary focus:ring-primary
            dark:focus:border-primary dark:focus:ring-primary
            bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            disabled:opacity-50 disabled:cursor-not-allowed
            disabled:bg-gray-50 dark:disabled:bg-gray-800
            ${error ? 'border-danger dark:border-danger text-danger dark:text-danger' : ''}
            ${!resize && 'resize-none'}
            ${sizeClasses[size]}
            ${className}
          `}
          disabled={disabled}
          required={required}
          {...props}
        />
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

Textarea.displayName = 'Textarea';