// src/components/ui2/card.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
import { BaseProps } from './types';

interface CardProps extends BaseProps {
  hoverable?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hoverable, loading, onClick }, ref) => {
    const isInteractive = !!onClick;

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm',
          hoverable && 'transition-shadow hover:shadow-md',
          loading && 'animate-pulse',
          isInteractive && 'cursor-pointer',
          className
        )}
        onClick={onClick}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        aria-busy={loading}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

interface CardHeaderProps extends BaseProps {
  title?: string;
  description?: string;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, children }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)}>
      {title && (
        <h3 className="text-2xl font-semibold leading-none tracking-tight">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

interface CardContentProps extends BaseProps {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

interface CardFooterProps extends BaseProps {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)}>
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };
