import React, { useState, useEffect, useRef } from 'react';
import './Scrollable.css';

interface ScrollableProps {
  children: React.ReactNode;
  className?: string;
  height?: string;
  maxHeight?: string;
  horizontal?: boolean;
  shadow?: boolean;
  hideScrollbar?: boolean;
}

export function Scrollable({
  children,
  className = '',
  height = 'h-64',
  maxHeight,
  horizontal = false,
  shadow = true,
  hideScrollbar = false
}: ScrollableProps) {
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(container?.dataset?.scrollTimeout);
      container?.setAttribute(
        'data-scroll-timeout',
        setTimeout(() => setIsScrolling(false), 1500).toString()
      );
    };

    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`
        relative
        ${height}
        ${maxHeight ? `max-h-[${maxHeight}]` : ''}
        ${horizontal ? 'overflow-x-auto' : 'overflow-y-auto'}
        ${shadow ? 'after:absolute after:left-0 after:right-0 after:bottom-0 after:h-4 after:bg-gradient-to-t after:from-white after:to-transparent dark:after:from-gray-900 after:pointer-events-none' : ''}
        ${hideScrollbar 
          ? 'scrollbar-none' 
          : `
            scrollbar-thin 
            scrollbar-track-gray-100 dark:scrollbar-track-gray-800
            scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600
            hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500
            transition-all duration-300 ease-out
            ${isScrolling ? 'scrollbar-visible' : 'scrollbar-hidden'}
          `
        }
        ${className}
      `}
    >
    
      {children}
    </div>
  );
}
