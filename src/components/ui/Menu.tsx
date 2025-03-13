import React from 'react';

interface MenuProps {
  children: React.ReactNode;
  className?: string;
}

interface MenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  description?: string;
  destructive?: boolean;
  selected?: boolean;
}

export function Menu({ children, className = '' }: MenuProps) {
  return (
    <div 
      className={`py-1 divide-y divide-gray-100 dark:divide-gray-700 ${className}`} 
      role="menu"
    >
      {children}
    </div>
  );
}

export function MenuItem({ 
  children, 
  onClick, 
  disabled = false, 
  className = '',
  icon,
  description,
  destructive = false,
  selected = false
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative w-full flex items-center px-4 py-2 text-sm
        ${destructive 
          ? 'text-danger hover:bg-danger-light focus:bg-danger-light dark:text-danger dark:hover:bg-danger-light' 
          : selected
            ? 'bg-primary-light text-primary dark:bg-primary-light dark:text-primary'
            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-colors duration-150 ease-in-out
        ${className}
      `}
      role="menuitem"
    >
      {icon && (
        <span className={`
          mr-3 h-5 w-5 flex-shrink-0
          ${destructive 
            ? 'text-danger group-hover:text-danger dark:text-danger dark:group-hover:text-danger' 
            : selected
              ? 'text-primary group-hover:text-primary dark:text-primary dark:group-hover:text-primary'
              : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
          }
        `}>
          {icon}
        </span>
      )}
      <div className="flex flex-col flex-grow min-w-0">
        <span className="truncate">{children}</span>
        {description && (
          <span className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
            {description}
          </span>
        )}
      </div>
    </button>
  );
}

export function MenuDivider() {
  return (
    <div 
      className="h-px my-1 bg-gray-200 dark:bg-gray-700" 
      role="separator"
    />
  );
}

export function MenuHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      {children}
    </div>
  );
}

export function MenuGroup({ 
  children,
  title 
}: { 
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div role="group">
      {title && (
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}