import React, { forwardRef, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './Button';

interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  error?: string;
  label?: string;
  helperText?: string;
  buttonText?: string;
  accept?: string;
  value?: File | null;
  onChange?: (file: File | null) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'solid';
}

export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  ({ 
    className = '', 
    error, 
    label, 
    helperText, 
    buttonText = 'Choose file', 
    accept,
    value,
    onChange,
    size = 'md',
    variant = 'outline',
    ...props 
  }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
      fileInputRef.current?.click();
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && onChange) {
        onChange(file);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onChange) {
        onChange(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <div className="mt-1 flex items-center">
          <Button
            type="button"
            onClick={handleClick}
            variant={variant}
            size={size}
            icon={<Upload />}
            className={className}
          >
            {buttonText}
          </Button>

          {value && (
            <div className="ml-3 flex items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                {value.name}
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="ml-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          <input
            ref={ref || fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleChange}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-danger dark:text-danger">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

FileInput.displayName = 'FileInput';