// src/components/snackbar/SolidSnackbar.tsx
import React from 'react';
import { SnackbarContent, CustomContentProps } from 'notistack';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '../ui2/button';

export const SolidSnackbar = React.forwardRef<HTMLDivElement, CustomContentProps>((props, ref) => {
  const { variant, message, action, id } = props;

  const Icon = {
    default: Info,
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  }[variant || 'default'];

  const bgColor = {
    default: 'bg-gray-800',
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600',
    info: 'bg-blue-600'
  }[variant || 'default'];

  return (
    <SnackbarContent ref={ref} role="alert">
      <div className={`flex items-center justify-between p-4 rounded-lg shadow-lg ${bgColor}`}>
        <div className="flex items-center space-x-3">
          <Icon className="h-5 w-5 text-white" />
          <p className="text-white font-medium">{message}</p>
        </div>
        {action ? (
          action
        ) : (
          <Button
            onClick={() => props.closeSnackbar(id)}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </SnackbarContent>
  );
});

SolidSnackbar.displayName = 'SolidSnackbar';
