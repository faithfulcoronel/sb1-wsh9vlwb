import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
  width?: 'auto' | 'sm' | 'md' | 'lg' | 'xl';
  offset?: number;
}

const widthClasses = {
  auto: 'w-auto',
  sm: 'w-48',
  md: 'w-56',
  lg: 'w-64',
  xl: 'w-72'
};

export function Dropdown({ 
  trigger, 
  children, 
  className = '',
  align = 'right',
  width = 'md',
  offset = 4
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        role="button"
        tabIndex={0}
      >
        {trigger}
      </div>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-20 bg-black/25 dark:bg-black/50 backdrop-blur-sm lg:hidden" 
            onClick={() => setIsOpen(false)} 
            aria-hidden="true"
          />

          {/* Dropdown menu */}
          <div 
            className={`
              absolute z-30 
              ${offset ? `mt-${offset}` : 'mt-2'} 
              ${widthClasses[width]}
              rounded-dropdown
              bg-white dark:bg-gray-800
              shadow-dropdown dark:shadow-none
              border border-gray-200 dark:border-gray-700
              focus:outline-none
              transform opacity-100 scale-100
              ${align === 'right' ? 'right-0' : 'left-0'}
            `}
          >
            <div 
              className="py-1" 
              role="menu" 
              aria-orientation="vertical"
            >
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function DropdownTrigger({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={`
        group inline-flex items-center gap-x-1.5 rounded-btn
        px-3 py-2 text-sm font-medium
        bg-white dark:bg-gray-900
        text-gray-900 dark:text-gray-100
        hover:bg-gray-50 dark:hover:bg-gray-800
        border border-gray-300 dark:border-gray-600
        shadow-sm
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
      `}
    >
      {children}
    </button>
  );
}

interface MenuProps {
  children: React.ReactNode;
  className?: string;
}

export function Menu({ children, className = '' }: MenuProps) {
  return (
    <div className={`py-1 divide-y divide-gray-100 dark:divide-gray-700 ${className}`}>
      {children}
    </div>
  );
}

interface MenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  description?: string;
  destructive?: boolean;
}

export function MenuItem({ 
  children, 
  onClick, 
  disabled = false, 
  className = '',
  icon,
  description,
  destructive = false
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative w-full flex items-center px-4 py-2 text-sm
        ${destructive 
          ? 'text-danger hover:bg-danger-light focus:bg-danger-light dark:text-danger dark:hover:bg-danger-light' 
          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      role="menuitem"
    >
      {icon && (
        <span className={`
          mr-3 h-5 w-5
          ${destructive 
            ? 'text-danger group-hover:text-danger dark:text-danger dark:group-hover:text-danger' 
            : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
          }
        `}>
          {icon}
        </span>
      )}
      <div className="flex flex-col flex-grow">
        <span className="truncate">{children}</span>
        {description && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</span>
        )}
      </div>
    </button>
  );
}

export function MenuDivider() {
  return <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" role="none" />;
}

export function MenuHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      {children}
    </div>
  );
}