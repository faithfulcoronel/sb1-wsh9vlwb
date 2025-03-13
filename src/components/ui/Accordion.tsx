import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionProps {
  items: {
    title: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
  }[];
  className?: string;
  variant?: 'default' | 'bordered' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses = {
  default: 'divide-y divide-gray-200 dark:divide-gray-700 border-y border-gray-200 dark:border-gray-700',
  bordered: 'divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg',
  ghost: 'space-y-2'
};

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
};

export function Accordion({ 
  items, 
  className = '',
  variant = 'default',
  size = 'md'
}: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        
        return (
          <div 
            key={index} 
            className={`
              ${variant === 'ghost' ? 'border border-gray-200 dark:border-gray-700 rounded-lg' : ''}
              ${variant === 'ghost' && isOpen ? 'bg-gray-50 dark:bg-gray-800' : ''}
            `}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className={`
                flex w-full items-center justify-between
                ${variant === 'ghost' ? 'px-4' : 'px-0'} py-4
                text-left
                ${sizeClasses[size]}
                font-medium
                text-gray-900 dark:text-gray-100
                hover:text-primary dark:hover:text-primary
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                transition-colors duration-200
              `}
            >
              <div className="flex items-center space-x-3">
                {item.icon && (
                  <span className="text-gray-400 dark:text-gray-500">
                    {item.icon}
                  </span>
                )}
                <span>{item.title}</span>
              </div>
              <ChevronDown
                className={`
                  h-5 w-5 text-gray-400 dark:text-gray-500
                  transition-transform duration-200
                  ${isOpen ? 'rotate-180' : ''}
                `}
              />
            </button>
            
            {isOpen && (
              <div 
                className={`
                  ${variant === 'ghost' ? 'px-4' : 'px-0'}
                  pb-4
                  ${item.icon ? 'pl-8' : ''}
                  pr-12
                  text-sm
                  text-gray-600 dark:text-gray-300
                  animate-accordion-down
                `}
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}