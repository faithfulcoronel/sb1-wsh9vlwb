import { useQueryClient } from '@tanstack/react-query';
import { handleError } from './errorHandler';

export function useQueryErrorHandler() {
  const queryClient = useQueryClient();

  return {
    onError: (error: any, context?: Record<string, any>) => {
      // Handle the error
      handleError(error, {
        ...context,
        queryCache: queryClient.getQueryCache().getAll(),
      });

      // Optionally invalidate queries or perform other cleanup
      if (context?.invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: context.invalidateQueries });
      }
    },
  };
}