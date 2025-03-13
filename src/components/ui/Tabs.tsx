import React, { useRef, useEffect } from 'react';
import {Scrollable} from '../ui/Scrollable';

interface TabsProps {
  tabs: {
    id: string;
    label: string;
    content?: React.ReactNode;
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
    nav: 'border-b border-gray-200 dark:border-gray-700',
    tab: 'border-b-2 -mb-px',
    active: 'border-primary dark:border-primary text-primary dark:text-primary',
    inactive: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
  },
  enclosed: {
    nav: 'bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-1.5',
    tab: 'rounded-lg',
    active: 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm',
    inactive: 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50'
  },
  pills: {
    nav: 'space-x-2',
    tab: 'rounded-full',
    active: 'bg-primary text-white dark:text-white shadow-sm',
    inactive: 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
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
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Scroll active tab into view when it changes
  useEffect(() => {
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

  // Mouse/touch event handlers for scrolling
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    const container = tabsRef.current;
    if (!container) return;

    container.style.cursor = 'grabbing';
    container.style.userSelect = 'none';

    if ('touches' in e) {
      startX.current = e.touches[0].pageX - container.offsetLeft;
    } else {
      startX.current = e.pageX - container.offsetLeft;
    }
    
    scrollLeft.current = container.scrollLeft;
  };

  const handleDragEnd = () => {
    isDragging.current = false;
    if (tabsRef.current) {
      tabsRef.current.style.cursor = 'grab';
      tabsRef.current.style.removeProperty('user-select');
    }
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current || !tabsRef.current) return;
    e.preventDefault();

    let x;
    if ('touches' in e) {
      x = e.touches[0].pageX - tabsRef.current.offsetLeft;
    } else {
      x = e.pageX - tabsRef.current.offsetLeft;
    }

    const walk = (x - startX.current) * 2;
    tabsRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div className={className}>
      <Scrollable height="10">
      <div 
        ref={tabsRef}
        className={`
          relative
          overflow-x-auto
          scrollbar-thin
          scrollbar-track-transparent
          scrollbar-thumb-gray-300
          dark:scrollbar-thumb-gray-600
          hover:scrollbar-thumb-gray-400
          dark:hover:scrollbar-thumb-gray-500
          cursor-grab
          active:cursor-grabbing
          ${variantClasses[variant].nav}
          ${fullWidth ? 'flex' : 'inline-flex'}
          space-x-2
          pb-px
          -mx-4 px-4 sm:mx-0 sm:px-0
        `}
        onMouseDown={handleDragStart}
        onMouseLeave={handleDragEnd}
        onMouseUp={handleDragEnd}
        onMouseMove={handleDragMove}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
        onTouchMove={handleDragMove}
      >
        
        <div className="flex min-w-full sm:min-w-0 items-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDisabled = tab.disabled;

            return (
              <button
                key={tab.id}
                ref={isActive ? activeTabRef : null}
                onClick={() => !isDisabled && onChange(tab.id)}
                disabled={isDisabled}
                className={`
                  group inline-flex items-center py-3 px-4
                  font-medium
                  transition-all duration-200
                  ${sizeClasses[size]}
                  ${variantClasses[variant].tab}
                  ${isActive 
                    ? variantClasses[variant].active 
                    : variantClasses[variant].inactive
                  }
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${fullWidth ? 'flex-1 justify-center' : ''}
                  whitespace-nowrap
                  select-none
                `}
                role="tab"
                aria-selected={isActive}
                aria-disabled={isDisabled}
              >
                {tab.icon && (
                  <span className={`
                    mr-2 transition-colors
                    ${isActive 
                      ? 'text-primary dark:text-primary' 
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    }
                  `}>
                    {tab.icon}
                  </span>
                )}
                {tab.label}
                {typeof tab.badge === 'number' && (
                  <span className={`
                    ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium
                    ${isActive
                      ? 'bg-primary-light text-primary dark:bg-primary-light dark:text-primary'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }
                  `}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
          
      </div>
        </Scrollable>
      <div className="mt-4">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}