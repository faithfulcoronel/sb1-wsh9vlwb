import React from 'react';
import {Scrollable} from '../ui/Scrollable';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'secondary' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantClasses = {
  default: `
    bg-white dark:bg-gray-800 
    border-gray-200 dark:border-gray-700
  `,
  primary: `
    bg-primary-50 dark:bg-primary-900/10
    border-primary-100 dark:border-primary-800
    shadow-primary/5
  `,
  secondary: `
    bg-gray-50 dark:bg-gray-900/50
    border-gray-100 dark:border-gray-800
  `,
  gradient: `
    bg-gradient-to-br from-white to-gray-50
    dark:from-gray-800 dark:to-gray-900
    border-gray-200/50 dark:border-gray-700/50
    backdrop-blur-sm
  `
};

const sizeClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

export function Card({ 
  children, 
  className = '', 
  header, 
  footer, 
  hoverable = false,
  onClick,
  variant = 'default',
  size = 'md',
  loading = false
}: CardProps) {
  return (
    <div
      className={`
        relative
        rounded-xl
        border
        shadow-sm dark:shadow-none
        transition-all duration-200
        overflow-hidden
        ${variantClasses[variant]}
        ${hoverable ? `
          cursor-pointer
          hover:shadow-lg dark:hover:shadow-none
          hover:-translate-y-0.5
          hover:border-primary-200 dark:hover:border-primary-700
          active:translate-y-0
        ` : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${loading ? 'animate-pulse' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <Scrollable height="10">
      {/* Gradient overlay for hover effect */}
      {hoverable && (
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-primary-500/0 to-primary-500/0 opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-200" />
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm" />
      )}

      {/* Header */}
      {header && (
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {header}
        </div>
      )}

      {/* Content */}
      <div className={`
        ${!header && !footer ? sizeClasses[size] : ''}
        ${header || footer ? 'px-4 py-5 sm:p-6' : ''}
      `}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-4 py-4 sm:px-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {footer}
        </div>
      )}

      {/* Shimmer effect for loading state */}
      {loading && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 transform translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      )}
      </Scrollable>
    </div>
  );
}