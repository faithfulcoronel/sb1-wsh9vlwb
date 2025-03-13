import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'filled' | 'outline';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
};

export function Rating({
  value,
  max = 5,
  onChange,
  readOnly = false,
  size = 'md',
  className = '',
  variant = 'filled'
}: RatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  const handleKeyDown = (event: React.KeyboardEvent, rating: number) => {
    if (readOnly) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onChange?.(rating);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onChange?.(Math.max(1, value - 1));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      onChange?.(Math.min(max, value + 1));
    }
  };

  return (
    <div 
      className={`flex items-center gap-1 ${className}`}
      role="radiogroup"
      aria-label="Rating"
    >
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onChange?.(star)}
          onKeyDown={(e) => handleKeyDown(e, star)}
          className={`
            ${readOnly ? 'cursor-default' : 'cursor-pointer'}
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
            rounded-full
            transition-colors duration-150
            disabled:opacity-50
            ${variant === 'outline' ? 'p-0.5' : 'p-0'}
          `}
          disabled={readOnly}
          role="radio"
          aria-checked={star <= value}
          aria-label={`${star} of ${max} stars`}
          tabIndex={readOnly ? -1 : 0}
        >
          <Star 
            className={`
              ${sizeClasses[size]}
              ${star <= value 
                ? variant === 'outline'
                  ? 'text-warning dark:text-warning stroke-2'
                  : 'text-warning dark:text-warning fill-current'
                : variant === 'outline'
                ? 'text-gray-300 dark:text-gray-600 stroke-2'
                : 'text-gray-300 dark:text-gray-600'
              }
              transition-colors duration-150
              ${!readOnly && 'hover:text-warning dark:hover:text-warning'}
            `}
          />
        </button>
      ))}
    </div>
  );
}