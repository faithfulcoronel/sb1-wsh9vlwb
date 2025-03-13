import * as React from 'react';
import { cn } from '@/lib/utils';

interface ScrollableProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical' | 'both';
  className?: string;
  children: React.ReactNode;
}

const Scrollable = React.forwardRef<HTMLDivElement, ScrollableProps>(
  ({ className, orientation = 'vertical', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative',
          orientation === 'horizontal' && 'overflow-x-auto',
          orientation === 'vertical' && 'overflow-y-auto',
          orientation === 'both' && 'overflow-auto',
          'scrollbar-thin scrollbar-track-transparent',
          'scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
          'hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500',
          'scrollbar-thumb-rounded-full',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Scrollable.displayName = 'Scrollable';

export { Scrollable };