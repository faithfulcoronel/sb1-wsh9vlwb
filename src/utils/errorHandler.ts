import { PostgrestError } from '@supabase/supabase-js';
import { useMessageStore } from '../components/MessageHandler';

// Error types
type ErrorType = 'auth' | 'database' | 'network' | 'validation' | 'unknown';

// Error messages for users
const USER_FRIENDLY_MESSAGES: Record<ErrorType, string> = {
  auth: 'There was a problem with your account access. Please try signing in again.',
  database: 'Unable to process your request. Please try again later.',
  network: 'Network connection issue. Please check your internet connection.',
  validation: 'Please check your input and try again.',
  unknown: 'An unexpected error occurred. Please try again later.',
};

// Function to check if error is from Supabase
function isSupabaseError(error: any): error is PostgrestError {
  return (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    'details' in error &&
    'hint' in error &&
    'message' in error
  );
}

// Function to determine error type
function getErrorType(error: any): ErrorType {
  if (isSupabaseError(error)) {
    if (error.code === 'PGRST301' || error.code === 'PGRST302') {
      return 'auth';
    }
    return 'database';
  }

  if (error instanceof TypeError || error.name === 'NetworkError') {
    return 'network';
  }

  if (error.name === 'ValidationError') {
    return 'validation';
  }

  return 'unknown';
}

// Function to get user-friendly message
function getUserFriendlyMessage(error: any): string {
  const errorType = getErrorType(error);
  return USER_FRIENDLY_MESSAGES[errorType];
}

// Function to log error details
function logError(error: any, context?: Record<string, any>) {
  const errorDetails = {
    timestamp: new Date().toISOString(),
    type: getErrorType(error),
    message: error.message,
    stack: error.stack,
    context,
    // Include additional details for Supabase errors
    ...(isSupabaseError(error) && {
      code: error.code,
      details: error.details,
      hint: error.hint,
    }),
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('Error Details:', errorDetails);
  }

  // TODO: In production, send to error tracking service
  // This could be Sentry, LogRocket, etc.
}

// Main error handler function
export function handleError(error: any, context?: Record<string, any>) {
  // Log the error
  logError(error, context);

  // Get user-friendly message
  const userMessage = getUserFriendlyMessage(error);

  // Show message to user
  const { addMessage } = useMessageStore.getState();
  addMessage({
    type: 'error',
    text: userMessage,
    duration: 5000,
  });

  // Return the error details for optional handling
  return {
    type: getErrorType(error),
    message: userMessage,
    originalError: error,
  };
}

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Hook for try/catch blocks
export function useTryCatch() {
  return async <T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T | undefined> => {
    try {
      return await operation();
    } catch (error) {
      handleError(error, context);
      return undefined;
    }
  };
}