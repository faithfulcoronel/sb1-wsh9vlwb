import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  className?: string;
  animated?: boolean;
  striped?: boolean;
}

const variantClasses = {
  primary: 'bg-primary dark:bg-primary',
  secondary: 'bg-secondary dark:bg-secondary',
  success: 'bg-success dark:bg-success',
  danger: 'bg-danger dark:bg-danger',
  warning: 'bg-warning dark:bg-warning',
  info: 'bg-info dark:bg-info'
};

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
};

export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  variant = 'primary',
  className = '',
  animated = false,
  striped = false
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`
        w-full 
        bg-gray-200 dark:bg-gray-700 
        rounded-progress overflow-hidden
        ${sizeClasses[size]}
      `}>
        <div
          className={`
            ${sizeClasses[size]}
            rounded-progress
            transition-all duration-300 ease-in-out
            ${variantClasses[variant]}
            ${striped ? 'bg-stripes' : ''}
            ${animated ? 'animate-progress' : ''}
            relative
          `}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          {/* Progress bar stripes */}
          {striped && (
            <div className="absolute inset-0 bg-stripes opacity-15" />
          )}
        </div>
      </div>
    </div>
  );
}