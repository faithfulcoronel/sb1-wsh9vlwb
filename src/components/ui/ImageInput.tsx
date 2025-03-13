import React, { forwardRef, useState } from 'react';
import { Upload, X, Camera, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface ImageInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  error?: string;
  label?: string;
  helperText?: string;
  value?: string;
  onChange?: (file: File | null) => void;
  onRemove?: () => void;
  success?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'square' | 'circle';
  showOverlay?: boolean;
  loading?: boolean;
  placeholder?: React.ReactNode;
}

const sizeClasses = {
  sm: 'h-24 w-24',
  md: 'h-32 w-32',
  lg: 'h-40 w-40',
  xl: 'h-48 w-48'
};

const shapeClasses = {
  square: 'rounded-lg',
  circle: 'rounded-full'
};

export const ImageInput = forwardRef<HTMLInputElement, ImageInputProps>(
  ({ 
    className = '', 
    error, 
    label, 
    helperText, 
    value, 
    onChange, 
    onRemove,
    success = false,
    size = 'md',
    shape = 'circle',
    showOverlay = true,
    loading = false,
    placeholder,
    ...props 
  }, ref) => {
    const [preview, setPreview] = useState<string | null>(value || null);
    const [isHovered, setIsHovered] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleClick = () => {
      inputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          onChange?.(null);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        onChange?.(file);
      }

      // Reset input value to allow selecting the same file again
      if (event.target) {
        event.target.value = '';
      }
    };

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      setPreview(null);
      onRemove?.();
      onChange?.(null);
    };

    const defaultPlaceholder = (
      <div className="flex flex-col items-center justify-center">
        <Camera className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        <span className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Click to upload
        </span>
      </div>
    );

    return (
      <div className={`relative ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {label}
          </label>
        )}

        <div 
          className="relative group cursor-pointer"
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          role="button"
          tabIndex={0}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Image Preview or Placeholder */}
          <div className={`
            ${sizeClasses[size]}
            ${shapeClasses[shape]}
            overflow-hidden
            bg-gray-100 dark:bg-gray-800
            flex
            items-center
            justify-center
            border-2
            ${error ? 'border-danger dark:border-danger' : success ? 'border-success dark:border-success' : 'border-gray-300 dark:border-gray-600'}
            ${isHovered ? 'border-primary dark:border-primary ring-2 ring-primary-light dark:ring-primary-light' : ''}
            transition-all
            duration-200
            relative
          `}>
            {loading ? (
              <div className="absolute inset-0 bg-black/10 dark:bg-black/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary dark:text-primary animate-spin" />
              </div>
            ) : preview ? (
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              placeholder || defaultPlaceholder
            )}

            {/* Overlay */}
            {showOverlay && !loading && (
              <div className={`
                absolute inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center
                transition-opacity duration-200
                ${isHovered ? 'opacity-100' : 'opacity-0'}
              `}>
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-6 w-6 text-white" />
                  <span className="text-xs text-white font-medium">
                    {preview ? 'Change Photo' : 'Upload Photo'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Remove Button */}
          {preview && !loading && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 rounded-full !p-1 shadow-lg"
              icon={<X className="h-4 w-4" />}
              aria-label="Remove image"
            />
          )}

          {/* Hidden File Input */}
          <input
            ref={(node) => {
              // Handle both refs
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
              inputRef.current = node;
            }}
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            accept="image/*"
            {...props}
          />
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mt-2 flex items-center text-sm text-danger dark:text-danger">
            <AlertCircle className="h-4 w-4 mr-1.5" />
            {error}
          </div>
        )}
        {success && !error && (
          <div className="mt-2 flex items-center text-sm text-success dark:text-success">
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Image uploaded successfully
          </div>
        )}
        {helperText && !error && !success && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

ImageInput.displayName = 'ImageInput';