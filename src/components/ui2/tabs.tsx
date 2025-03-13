import * as React from 'react';
import { cn } from '@/lib/utils';
import { Scrollable } from './scrollable';

interface TabsProps {
  tabs: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    badge?: number;
    disabled?: boolean;
  }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'line' | 'enclosed' | 'pills';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
};

const variantClasses = {
  line: {
    nav: 'border-b border-border',
    tab: 'border-b-2 -mb-px',
    active: 'border-primary text-primary',
    inactive: 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
  },
  enclosed: {
    nav: 'bg-muted/50 rounded-xl p-1.5',
    tab: 'rounded-lg',
    active: 'bg-background text-foreground shadow-sm',
    inactive: 'text-muted-foreground hover:text-foreground hover:bg-background/50'
  },
  pills: {
    nav: 'space-x-2',
    tab: 'rounded-full',
    active: 'bg-primary text-primary-foreground shadow-sm',
    inactive: 'text-muted-foreground hover:text-foreground hover:bg-muted'
  }
};

export function Tabs({ 
  tabs, 
  activeTab, 
  onChange, 
  className = '',
  variant = 'line',
  size = 'md',
  fullWidth = false
}: TabsProps) {
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const activeTabRef = React.useRef<HTMLButtonElement>(null);

  // Scroll active tab into view when it changes
  React.useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const container = tabsRef.current;
      const activeElement = activeTabRef.current;
      
      // Calculate scroll position to center the active tab
      const scrollLeft = activeElement.offsetLeft - (container.clientWidth / 2) + (activeElement.clientWidth / 2);
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [activeTab]);

  return (
    <div className={className}>
      <Scrollable orientation="horizontal" className={cn(
        'relative',
        variantClasses[variant].nav,
        fullWidth ? 'flex' : 'inline-flex',
        'space-x-2'
      )}>
        <div className="flex min-w-full sm:min-w-0 items-center" ref={tabsRef}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDisabled = tab.disabled;

            return (
              <button
                key={tab.id}
                ref={isActive ? activeTabRef : null}
                onClick={() => !isDisabled && onChange(tab.id)}
                disabled={isDisabled}
                className={cn(
                  'group inline-flex items-center py-3 px-4',
                  'font-medium',
                  'transition-all duration-200',
                  sizeClasses[size],
                  variantClasses[variant].tab,
                  isActive 
                    ? variantClasses[variant].active 
                    : variantClasses[variant].inactive,
                  isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                  fullWidth ? 'flex-1 justify-center' : '',
                  'whitespace-nowrap',
                  'select-none'
                )}
                role="tab"
                aria-selected={isActive}
                aria-disabled={isDisabled}
              >
                {tab.icon && (
                  <span className={cn(
                    'mr-2 transition-colors',
                    isActive 
                      ? 'text-primary dark:text-primary' 
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}>
                    {tab.icon}
                  </span>
                )}
                {tab.label}
                {typeof tab.badge === 'number' && (
                  <span className={cn(
                    'ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Scrollable>
    </div>
  );
}