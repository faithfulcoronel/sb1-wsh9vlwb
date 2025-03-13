import React, { createContext, useContext, useState } from 'react';
import { FormMetadata } from '../types/form';

interface FormContextType {
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  metadata: FormMetadata | null;
  setMetadata: (metadata: FormMetadata) => void;
  currentPath: string;
  setCurrentPath: (path: string) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [metadata, setMetadata] = useState<FormMetadata | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');

  return (
    <FormContext.Provider
      value={{
        formData,
        setFormData,
        errors,
        setErrors,
        metadata,
        setMetadata,
        currentPath,
        setCurrentPath,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};

export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};