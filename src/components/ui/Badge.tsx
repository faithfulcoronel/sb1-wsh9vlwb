import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantClasses = {
  primary: 'bg-primary-light text-primary dark:bg-primary-light dark:text-primary',
  secondary: 'bg-secondary-light text-secondary dark:bg-secondary-light dark:text-secondary',
  success: 'bg-success-light text-success dark:bg-success-light dark:text-success',
  danger: 'bg-danger-light text-danger dark:bg-danger-light dark:text-danger',
  warning: 'bg-warning-light text-warning dark:bg-warning-light dark:text-warning',
  info: 'bg-info-light text-info dark:bg-info-light dark:text-info'
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-2xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm'
};

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  className = ''
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-badge font-medium
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}