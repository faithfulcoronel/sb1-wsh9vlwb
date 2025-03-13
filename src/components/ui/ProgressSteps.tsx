import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    icon: 'h-8 w-8',
    text: 'text-sm',
    line: 'w-0.5',
    connector: 'left-4'
  },
  md: {
    icon: 'h-10 w-10',
    text: 'text-base',
    line: 'w-0.5',
    connector: 'left-5'
  },
  lg: {
    icon: 'h-12 w-12',
    text: 'text-lg',
    line: 'w-0.5',
    connector: 'left-6'
  }
};

export function ProgressSteps({ 
  steps, 
  currentStep, 
  className = '',
  orientation = 'vertical',
  size = 'md'
}: ProgressStepsProps) {
  return (
    <div className={`
      ${orientation === 'horizontal' ? 'flex justify-between' : 'space-y-8'}
      ${className}
    `}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={index} className={`
            relative
            ${orientation === 'horizontal' ? 'flex-1' : ''}
          `}>
            {/* Connector Line */}
            {!isLast && (
              <div className={`
                absolute
                ${orientation === 'horizontal'
                  ? 'top-5 left-0 right-0 h-0.5'
                  : `${sizeClasses[size].connector} top-14 bottom-0 ${sizeClasses[size].line}`
                }
                ${isCompleted 
                  ? 'bg-primary dark:bg-primary' 
                  : 'bg-gray-200 dark:bg-gray-700'
                }
              `} />
            )}

            <div className={`
              relative flex
              ${orientation === 'horizontal' ? 'flex-col items-center' : 'items-start'}
            `}>
              {/* Step Icon */}
              <span className={`
                flex items-center justify-center rounded-full
                ${sizeClasses[size].icon}
                ${isCompleted 
                  ? 'bg-primary dark:bg-primary text-white' 
                  : isCurrent
                    ? 'bg-primary-light dark:bg-primary-light border-2 border-primary dark:border-primary text-primary dark:text-primary'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                }
                transition-all duration-200
              `}>
                {isCompleted ? (
                  <Check className={`
                    ${size === 'sm' ? 'h-4 w-4' : ''}
                    ${size === 'md' ? 'h-5 w-5' : ''}
                    ${size === 'lg' ? 'h-6 w-6' : ''}
                  `} />
                ) : step.icon || (
                  <span className="font-semibold">
                    {index + 1}
                  </span>
                )}
              </span>

              {/* Step Content */}
              <div className={`
                ${orientation === 'horizontal' ? 'mt-4 text-center' : 'ml-4'}
              `}>
                <h3 className={`
                  font-semibold
                  ${sizeClasses[size].text}
                  ${isCompleted || isCurrent 
                    ? 'text-gray-900 dark:text-gray-100' 
                    : 'text-gray-500 dark:text-gray-400'
                  }
                `}>
                  {step.title}
                </h3>
                <p className={`
                  mt-1
                  ${size === 'sm' ? 'text-xs' : 'text-sm'}
                  ${isCompleted || isCurrent 
                    ? 'text-gray-600 dark:text-gray-300' 
                    : 'text-gray-400 dark:text-gray-500'
                  }
                `}>
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}