import React, { useState, useRef, useEffect } from 'react';

interface PopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  arrow?: boolean;
  offset?: number;
  closeOnClick?: boolean;
  closeOnClickOutside?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({ 
  trigger, 
  content, 
  position = 'bottom', 
  className = '',
  arrow = true,
  offset = 8,
  closeOnClick = true,
  closeOnClickOutside = true,
  open: controlledOpen,
  onOpenChange
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const open = controlledOpen ?? isOpen;
  const setOpen = onOpenChange ?? setIsOpen;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (closeOnClickOutside && 
          popoverRef.current && 
          !popoverRef.current.contains(event.target as Node) &&
          !triggerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, closeOnClickOutside, setOpen]);

  const positionClasses = {
    top: `bottom-full left-1/2 -translate-x-1/2 mb-${offset}`,
    right: `left-full top-1/2 -translate-y-1/2 ml-${offset}`,
    bottom: `top-full left-1/2 -translate-x-1/2 mt-${offset}`,
    left: `right-full top-1/2 -translate-y-1/2 mr-${offset}`
  };

  const arrowClasses = {
    top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-t-gray-200 dark:border-t-gray-700 border-l-transparent border-r-transparent border-b-transparent',
    right: 'left-[-6px] top-1/2 -translate-y-1/2 border-r-gray-200 dark:border-r-gray-700 border-t-transparent border-b-transparent border-l-transparent',
    bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-b-gray-200 dark:border-b-gray-700 border-l-transparent border-r-transparent border-t-transparent',
    left: 'right-[-6px] top-1/2 -translate-y-1/2 border-l-gray-200 dark:border-l-gray-700 border-t-transparent border-b-transparent border-r-transparent'
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        role="button"
        tabIndex={0}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {open && (
        <div
          ref={popoverRef}
          className={`
            absolute z-50
            bg-white dark:bg-gray-800
            rounded-popover
            shadow-popover dark:shadow-none
            border border-gray-200 dark:border-gray-700
            ${positionClasses[position]}
            ${className}
          `}
          onClick={() => {
            if (closeOnClick) {
              setOpen(false);
            }
          }}
        >
          {arrow && (
            <div className={`
              absolute w-3 h-3
              transform rotate-45
              border-4
              ${arrowClasses[position]}
              bg-white dark:bg-gray-800
            `} />
          )}
          <div className="relative">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}