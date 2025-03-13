// src/providers/SnackbarProvider.tsx
import { SolidSnackbar } from '@/components/snackbar';
import { SnackbarProvider as CustomSnackbarProvider } from 'notistack';
import { type PropsWithChildren } from 'react';

const SnackbarProvider = ({ children }: PropsWithChildren) => {
  return (
    <CustomSnackbarProvider
      autoHideDuration={2000}
      maxSnack={3}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      Components={{
        default: SolidSnackbar,
        success: SolidSnackbar,
        error: SolidSnackbar,
        warning: SolidSnackbar,
        info: SolidSnackbar
      }}
    >
      {children}
    </CustomSnackbarProvider>
  );
};

export { SnackbarProvider };
