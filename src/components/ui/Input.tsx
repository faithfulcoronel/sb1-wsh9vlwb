import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, X, AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
  icon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  labelClassName?: string;
  inputClassName?: string;
  containerClassName?: string;
  showPasswordToggle?: boolean;
  description?: string;
  loading?: boolean;
  success?: boolean;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className = '', 
    error, 
    label, 
    helperText, 
    icon,
    clearable,
    onClear,
    labelClassName = '',
    inputClassName = '',
    containerClassName = '',
    showPasswordToggle = false,
    type = 'text',
    required,
    disabled,
    value,
    onChange,
    description,
    loading,
    success,
    rightElement,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = () => {
      if (onChange) {
        const event = {
          target: { value: '' }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
      onClear?.();
    };

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    const inputType = showPasswordToggle 
      ? (showPassword ? 'text' : 'password')
      : type;

    return (
      <div className={`w-full ${containerClassName}`}>
        {/* Label + Helper Text */}
        {(label || helperText) && (
          <div className="flex items-start justify-between mb-2">
            <div className="flex flex-col">
              {label && (
                <label 
                  className={`
                    block text-sm font-medium text-gray-900 dark:text-gray-100
                    ${disabled ? 'opacity-60' : ''}
                    ${labelClassName}
                  `}
                >
                  {label}
                  {required && <span className="text-danger ml-1">*</span>}
                </label>
              )}
              {description && (
                <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</span>
              )}
            </div>
            {helperText && !error && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{helperText}</span>
            )}
          </div>
        )}

        <div className="relative">
          {/* Input Icon */}
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <span className={`text-gray-500 dark:text-gray-400 ${disabled ? 'opacity-60' : ''}`}>
                {icon}
              </span>
            </div>
          )}

          {/* Main Input */}
          <input
            ref={ref}
            type={inputType}
            className={`
              block w-full rounded-btn border shadow-sm text-base
              h-10 /* Fixed height */
              ${icon ? 'pl-11' : 'pl-4'} /* Adjusted left padding */
              ${(clearable && value) || showPasswordToggle || rightElement ? 'pr-11' : 'pr-4'} /* Adjusted right padding */
              ${error
                ? 'border-danger text-danger placeholder-danger-light focus:border-danger focus:ring-danger dark:border-danger dark:text-danger dark:placeholder-danger-light'
                : success
                ? 'border-success text-success focus:border-success focus:ring-success dark:border-success dark:text-success'
                : 'border-gray-300 text-gray-900 focus:border-primary focus:ring-primary dark:border-gray-600 dark:text-gray-100 dark:focus:border-primary dark:focus:ring-primary'
              }
              ${disabled
                ? 'bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400'
                : 'bg-white dark:bg-gray-900'
              }
              ${loading ? 'opacity-75' : ''}
              ${isFocused ? 'ring-2 ring-offset-0' : ''}
              transition-all duration-200
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              ${inputClassName}
              ${className}
            `}
            value={value}
            onChange={onChange}
            disabled={disabled || loading}
            required={required}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : undefined}
            {...props}
          />

          {/* Clear Button */}
          {clearable && value && !disabled && !loading && !rightElement && (
            <button
              type="button"
              onClick={handleClear}
              className={`
                absolute inset-y-0 right-0 flex items-center
                ${showPasswordToggle ? 'pr-11' : 'pr-3.5'}
              `}
            >
              <X 
                className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400" 
                aria-hidden="true"
              />
            </button>
          )}

          {/* Password Toggle */}
          {showPasswordToggle && !disabled && !loading && !rightElement && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff 
                  className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400" 
                  aria-hidden="true"
                />
              ) : (
                <Eye 
                  className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400" 
                  aria-hidden="true"
                />
              )}
            </button>
          )}

          {/* Right Element (e.g., InputAddon) */}
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex">
              {rightElement}
            </div>
          )}

          {/* Loading Spinner */}
          {loading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 dark:border-gray-600 border-t-primary dark:border-t-primary" />
            </div>
          )}

          {/* Success Icon */}
          {success && !error && !loading && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
              <div className="h-5 w-5 text-success dark:text-success">✓</div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="mt-2 text-sm text-danger dark:text-danger flex items-center"
            id={`${props.id}-error`}
          >
            <AlertCircle className="h-4 w-4 mr-1.5" />
            {error}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';