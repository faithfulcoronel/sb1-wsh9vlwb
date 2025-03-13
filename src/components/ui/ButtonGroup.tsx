import React from 'react';

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  vertical?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function ButtonGroup({ 
  children, 
  className = '', 
  vertical = false,
  size = 'md'
}: ButtonGroupProps) {
  return (
    <div
      className={`
        inline-flex ${vertical ? 'flex-col' : ''}
        rounded-btn overflow-hidden
        shadow-sm
        ${className}
      `}
      role="group"
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        return React.cloneElement(child, {
          className: `
            ${child.props.className || ''}
            ${vertical
              ? index === 0
                ? 'rounded-t-btn rounded-b-none'
                : index === React.Children.count(children) - 1
                ? 'rounded-b-btn rounded-t-none border-t-0'
                : 'rounded-none border-t-0'
              : index === 0
              ? 'rounded-l-btn rounded-r-none'
              : index === React.Children.count(children) - 1
              ? 'rounded-r-btn rounded-l-none border-l-0'
              : 'rounded-none border-l-0'
            }
            ${size === child.props.size ? '' : `h-${size}`}
          `,
          size: size || child.props.size,
        });
      })}
    </div>
  );
}