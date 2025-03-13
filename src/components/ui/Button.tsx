import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses = {
  primary: `
    bg-primary text-primary-inverse hover:bg-primary-active focus:ring-primary
    dark:bg-primary dark:text-primary-inverse dark:hover:bg-primary-active
  `,
  secondary: `
    bg-secondary text-secondary-inverse hover:bg-secondary-active focus:ring-secondary
    dark:bg-secondary dark:text-secondary-inverse dark:hover:bg-secondary-active
  `,
  outline: `
    border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary
    dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700
  `,
  ghost: `
    text-gray-700 hover:bg-gray-50 focus:ring-gray-500
    dark:text-gray-300 dark:hover:bg-gray-700
  `,
  danger: `
    bg-danger text-danger-inverse hover:bg-danger-active focus:ring-danger
    dark:bg-danger dark:text-danger-inverse dark:hover:bg-danger-active
  `
};

const sizeClasses = {
  xs: 'h-7 text-2xs',
  sm: 'h-8 text-xs',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base'
};

const paddingClasses = {
  xs: 'px-2',
  sm: 'px-3',
  md: 'px-4',
  lg: 'px-6'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      children,
      icon,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-medium rounded-btn
          focus:outline-none focus:ring-2 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          shadow-sm hover:shadow
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${paddingClasses[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Loader2 className={`
            animate-spin
            ${size === 'xs' ? 'h-3 w-3' : ''}
            ${size === 'sm' ? 'h-4 w-4' : ''}
            ${size === 'md' ? 'h-5 w-5' : ''}
            ${size === 'lg' ? 'h-6 w-6' : ''}
          `} />
        ) : (
          <>
            {icon && (
              <span className={`
                ${size === 'xs' ? 'mr-1.5 text-2xs' : ''}
                ${size === 'sm' ? 'mr-2 text-xs' : ''}
                ${size === 'md' ? 'mr-2 text-sm' : ''}
                ${size === 'lg' ? 'mr-3 text-base' : ''}
              `}>
                {icon}
              </span>
            )}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';