import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  fluid?: boolean;
  as?: keyof JSX.IntrinsicElements;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl'
};

export function Container({ 
  children, 
  className = '', 
  fluid = false,
  as: Component = 'div',
  size = 'xl'
}: ContainerProps) {
  return (
    <Component
      className={`
        w-full
        ${fluid ? '' : `${maxWidthClasses[size]} mx-auto`}
        px-4 sm:px-6 lg:px-8
        ${className}
      `}
    >
      {children}
    </Component>
  );
}