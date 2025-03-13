import React from 'react';
import { Card } from './Card';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  description?: string;
  legend?: React.ReactNode;
  loading?: boolean;
  className?: string;
  actions?: React.ReactNode;
}

export function ChartCard({
  title,
  children,
  description,
  legend,
  loading = false,
  className = '',
  actions
}: ChartCardProps) {
  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ) : (
          <>
            <div className="relative">
              {children}
            </div>
            {legend && (
              <div className="mt-4">
                {legend}
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

interface ChartLegendProps {
  items: {
    label: string;
    value: string | number;
    color: string;
  }[];
  className?: string;
}

export function ChartLegend({
  items,
  className = ''
}: ChartLegendProps) {
  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <div 
            className="h-3 w-3 rounded-full" 
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {item.label}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}