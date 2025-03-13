// src/components/ui2/input.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, X } from 'lucide-react';
import { FormFieldProps } from './types';

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        default: 'h-10 py-2',
        sm: 'h-8 px-2 text-xs',
        lg: 'h-12 px-4 text-base'
      },
      error: {
        true: 'border-destructive focus-visible:ring-destructive',
        false: ''
      }
    },
    defaultVariants: {
      size: 'default',
      error: false
    }
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants>,
    FormFieldProps {
  icon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  showPasswordToggle?: boolean;
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    type = 'text',
    size,
    error,
    label,
    helperText,
    required,
    disabled,
    icon,
    clearable,
    onClear,
    showPasswordToggle,
    rightElement,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const id = React.useId();

    const inputType = showPasswordToggle 
      ? (showPassword ? 'text' : 'password')
      : type;

    const hasValue = props.value != null && props.value !== '';
    const showClearButton = clearable && hasValue && !disabled;
    const showPasswordButton = showPasswordToggle && !disabled;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={id}
            className={cn(
              "block text-sm font-medium mb-1.5",
              error ? 'text-destructive' : 'text-foreground',
              disabled && 'opacity-50'
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
              {icon}
            </div>
          )}

          <input
            id={id}
            ref={ref}
            type={inputType}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error || helperText ? `${id}-description` : undefined
            }
            className={cn(
              inputVariants({ size, error }),
              icon && 'pl-10',
              (showClearButton || showPasswordButton || rightElement) && 'pr-10',
              className
            )}
            {...props}
          />

          {showClearButton && (
            <button
              type="button"
              onClick={onClear}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
              aria-label="Clear input"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {showPasswordButton && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}

          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p
            id={`${id}-description`}
            className={cn(
              'mt-1.5 text-sm',
              error ? 'text-destructive' : 'text-muted-foreground'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
