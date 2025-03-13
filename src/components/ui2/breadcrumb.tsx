// src/components/ui2/breadcrumb.tsx
import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BaseProps } from './types';

interface BreadcrumbProps extends BaseProps {
  separator?: React.ReactNode;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, separator, children, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="breadcrumb"
      className={cn('flex', className)}
      {...props}
    >
      <ol className="flex items-center space-x-2">{children}</ol>
    </nav>
  )
);
Breadcrumb.displayName = 'Breadcrumb';

interface BreadcrumbItemProps extends BaseProps {
  href?: string;
  active?: boolean;
}

const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, href, active, children, ...props }, ref) => {
    const content = href ? (
      <a
        href={href}
        className={cn(
          'text-sm font-medium underline-offset-4 hover:underline',
          active ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {children}
      </a>
    ) : (
      <span
        className={cn(
          'text-sm font-medium',
          active ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {children}
      </span>
    );

    return (
      <li
        ref={ref}
        className={cn('flex items-center', className)}
        aria-current={active ? 'page' : undefined}
        {...props}
      >
        {content}
        {!active && (
          <ChevronRight className="ml-2 h-4 w-4 text-muted-foreground" />
        )}
      </li>
    );
  }
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

export { Breadcrumb, BreadcrumbItem };
