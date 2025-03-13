import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  striped?: boolean;
  compact?: boolean;
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  header?: boolean;
  align?: 'left' | 'center' | 'right';
}

export function Table({ 
  children, 
  className = '',
  hoverable = false,
  striped = false,
  compact = false
}: TableProps) {
  return (
    <div className="relative overflow-x-auto">
      <table className={`
        min-w-full divide-y divide-gray-200 dark:divide-gray-700
        ${hoverable ? 'table-hover' : ''}
        ${striped ? 'table-striped' : ''}
        ${compact ? 'table-compact' : ''}
        ${className}
      `}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }: TableHeaderProps) {
  return (
    <thead className={`
      bg-gray-50 dark:bg-gray-800
      ${className}
    `}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }: TableBodyProps) {
  return (
    <tbody className={`
      bg-white dark:bg-gray-900
      divide-y divide-gray-200 dark:divide-gray-700
      ${className}
    `}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '' }: TableRowProps) {
  return (
    <tr className={`
      group
      hover:bg-gray-50 dark:hover:bg-gray-800
      transition-colors duration-150 ease-in-out
      ${className}
    `}>
      {children}
    </tr>
  );
}

export function TableCell({ 
  children, 
  className = '', 
  header = false,
  align = 'left'
}: TableCellProps) {
  const Component = header ? 'th' : 'td';
  
  const baseClasses = header
    ? 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'
    : 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100';

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <Component className={`
      ${baseClasses}
      ${alignmentClasses[align]}
      ${className}
    `}>
      {children}
    </Component>
  );
}