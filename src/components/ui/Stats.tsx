import React from 'react';
import { Card } from './Card';
import { Tooltip } from './Tooltip';
import { Badge } from './Badge';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down';
  };
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

export function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  loading = false,
  className = '',
  onClick
}: StatsCardProps) {
  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className={`${className} ${loading ? 'animate-pulse' : ''}`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0">
            {icon && (
              <div className="h-12 w-12 rounded-full bg-primary-50 dark:bg-primary-900 flex items-center justify-center">
                {React.cloneElement(icon as React.ReactElement, {
                  className: 'h-6 w-6 text-primary-600 dark:text-primary-400'
                })}
              </div>
            )}
          </div>
          {trend && (
            <Badge
              variant={trend.direction === 'up' ? 'success' : 'danger'}
              className="flex items-center space-x-1"
            >
              {trend.direction === 'up' ? '↑' : '↓'}
              <span>{Math.abs(trend.value)}%</span>
            </Badge>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </h3>
          <div className="mt-1">
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {value}
              </p>
            )}
          </div>
          {description && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
          {trend && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {trend.label}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
};

const gapClasses = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8'
};

export function StatsGrid({
  children,
  columns = 4,
  gap = 'md',
  className = ''
}: StatsGridProps) {
  return (
    <div className={`
      grid
      ${columnClasses[columns]}
      ${gapClasses[gap]}
      ${className}
    `}>
      {children}
    </div>
  );
}