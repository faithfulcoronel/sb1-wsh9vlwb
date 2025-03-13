import React from 'react';

interface InputGroupProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface InputAddonProps {
  children: React.ReactNode;
  position: 'left' | 'right';
  className?: string;
  icon?: React.ReactNode;
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12'
};

const addonSizeClasses = {
  sm: 'px-2 text-sm',
  md: 'px-3 text-base',
  lg: 'px-4 text-lg'
};

export function InputGroup({ 
  children, 
  className = '',
  size = 'md'
}: InputGroupProps) {
  return (
    <div className={`relative flex rounded-btn shadow-sm ${className}`}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;

        // Pass size prop to children if they accept it
        if ('size' in child.props) {
          return React.cloneElement(child, { size });
        }

        return child;
      })}
    </div>
  );
}

export function InputAddon({ 
  children, 
  position, 
  className = '',
  icon
}: InputAddonProps) {
  const baseClasses = `
    inline-flex items-center justify-center
    px-3 text-sm
    text-gray-500 dark:text-gray-400
    bg-gray-50 dark:bg-gray-800
    border border-gray-300 dark:border-gray-600
    ${position === 'left' ? 'rounded-l-btn border-r-0' : 'rounded-r-btn border-l-0'}
  `;
  
  return (
    <span className={`${baseClasses} ${className}`}>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </span>
  );
}

export function InputIcon({ 
  children,
  position = 'left',
  className = ''
}: {
  children: React.ReactNode;
  position?: 'left' | 'right';
  className?: string;
}) {
  return (
    <div className={`
      absolute inset-y-0 ${position}-0 
      ${position === 'left' ? 'pl-3' : 'pr-3'}
      flex items-center pointer-events-none
      text-gray-400 dark:text-gray-500
      ${className}
    `}>
      {children}
    </div>
  );
}