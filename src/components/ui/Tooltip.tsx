import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  delay?: number;
  maxWidth?: string;
  arrow?: boolean;
  variant?: 'light' | 'dark';
}

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2'
};

const arrowClasses = {
  top: 'bottom-[-5px] left-1/2 -translate-x-1/2 border-t-current border-l-transparent border-r-transparent border-b-transparent',
  right: 'left-[-5px] top-1/2 -translate-y-1/2 border-r-current border-t-transparent border-b-transparent border-l-transparent',
  bottom: 'top-[-5px] left-1/2 -translate-x-1/2 border-b-current border-l-transparent border-r-transparent border-t-transparent',
  left: 'right-[-5px] top-1/2 -translate-y-1/2 border-l-current border-t-transparent border-b-transparent border-r-transparent'
};

const variantClasses = {
  light: {
    background: 'bg-white dark:bg-gray-800',
    border: 'border border-gray-200 dark:border-gray-700',
    text: 'text-gray-900 dark:text-gray-100',
    arrow: 'border-white dark:border-gray-800'
  },
  dark: {
    background: 'bg-gray-900 dark:bg-gray-950',
    border: 'border border-gray-800 dark:border-gray-900',
    text: 'text-white',
    arrow: 'border-gray-900 dark:border-gray-950'
  }
};

export function Tooltip({ 
  content, 
  children, 
  position = 'top', 
  className = '',
  delay = 0,
  maxWidth = '200px',
  arrow = true,
  variant = 'dark'
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setIsMounted(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    // Keep the element mounted briefly for exit animation
    setTimeout(() => setIsMounted(false), 200);
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {isMounted && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`
            absolute z-50
            ${positionClasses[position]}
            ${variantClasses[variant].background}
            ${variantClasses[variant].border}
            rounded-tooltip
            shadow-tooltip
            py-1.5 px-2.5
            text-sm
            whitespace-normal
            max-w-[${maxWidth}]
            ${variantClasses[variant].text}
            transition-all duration-200
            ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            ${className}
          `}
        >
          {content}
          {arrow && (
            <div className={`
              absolute
              w-0 h-0
              border-[5px]
              ${arrowClasses[position]}
              ${variantClasses[variant].arrow}
            `} />
          )}
        </div>
      )}
    </div>
  );
}