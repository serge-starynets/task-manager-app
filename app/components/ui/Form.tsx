import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';
import Select, { type SelectOption } from './Select';

export type { SelectOption };

// Form
interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export function Form({ className, children, ...props }: FormProps) {
  return (
    <form className={cn('space-y-6', className)} {...props}>
      {children}
    </form>
  );
}

// Form Group
interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function FormGroup({ className, children, ...props }: FormGroupProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {children}
    </div>
  );
}

// Form Label
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function FormLabel({ className, children, ...props }: FormLabelProps) {
  return (
    <label
      className={cn(
        'text-sm font-medium text-gray-700 dark:text-gray-300',
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}

const inputBase =
  'flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border-medium dark:bg-dark-elevated dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500/60';

// Form Input
type FormInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(inputBase, className)}
        {...props}
      />
    );
  },
);
FormInput.displayName = 'FormInput';

// Form Textarea
type FormTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-border-medium dark:bg-dark-elevated dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-purple-500/60',
          className,
        )}
        {...props}
      />
    );
  },
);
FormTextarea.displayName = 'FormTextarea';

// Form Select — custom dropdown matching the rest of the form controls
interface FormSelectProps {
  id?: string;
  name?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  'aria-describedby'?: string;
}

export function FormSelect({ className, ...props }: FormSelectProps) {
  return <Select className={className} {...props} />;
}

// Form Error
interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function FormError({ className, children, ...props }: FormErrorProps) {
  return (
    <p className={cn('text-xs font-medium text-red-500', className)} {...props}>
      {children}
    </p>
  );
}

// Form Description
interface FormDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function FormDescription({
  className,
  children,
  ...props
}: FormDescriptionProps) {
  return (
    <p
      className={cn('text-xs text-gray-500 dark:text-gray-400', className)}
      {...props}
    >
      {children}
    </p>
  );
}
