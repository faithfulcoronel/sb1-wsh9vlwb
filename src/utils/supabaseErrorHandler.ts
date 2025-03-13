import { PostgrestError } from '@supabase/supabase-js';
import { handleError } from './errorHandler';

// Map of database error codes to user-friendly messages
const DB_ERROR_MESSAGES: Record<string, string> = {
  '23505': 'This record already exists.',
  '23503': 'This operation cannot be completed because the record is being used elsewhere.',
  '23502': 'Required information is missing.',
  '42P01': 'System configuration error.',
  '42501': 'You don\'t have permission to perform this action.',
};

export function handleSupabaseError(
  error: PostgrestError,
  context?: Record<string, any>
) {
  // Get user-friendly message based on error code
  const userMessage = DB_ERROR_MESSAGES[error.code] || 'Database operation failed.';

  // Log the detailed error
  const errorDetails = {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    context,
  };

  // Use the main error handler
  handleError(
    {
      ...error,
      userMessage,
    },
    errorDetails
  );
}