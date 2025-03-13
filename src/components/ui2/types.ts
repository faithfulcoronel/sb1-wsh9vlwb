// src/components/ui2/types.ts
import { ComponentPropsWithoutRef, ElementType } from 'react';

// Polymorphic component types
export type AsProp<C extends ElementType> = {
  as?: C;
};

export type PolymorphicRef<C extends ElementType> = ComponentPropsWithoutRef<C>['ref'];

export type PolymorphicComponentProps<C extends ElementType, Props = {}> = AsProp<C> &
  ComponentPropsWithoutRef<C> &
  Props & {
    ref?: PolymorphicRef<C>;
  };

// Common props
export type BaseProps = {
  className?: string;
  children?: React.ReactNode;
};

export type WithRef<T> = T & {
  ref?: React.Ref<HTMLElement>;
};

// Common variants
export type Size = 'sm' | 'md' | 'lg';
export type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'light';

// Form field props
export type FormFieldProps = {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
};
