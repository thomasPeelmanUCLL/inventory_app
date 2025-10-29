'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { validateFormData, formatValidationErrors } from '../lib/validation';

interface ValidatedFormProps<T> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void> | void;
  children: (props: {
    errors: { field: string; message: string }[] | null;
    isSubmitting: boolean;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    getFieldError: (field: string) => string | undefined;
  }) => React.ReactNode;
  className?: string;
}

/**
 * Validated form wrapper with Zod schema validation
 */
export function ValidatedForm<T>({
  schema,
  onSubmit,
  children,
  className = '',
}: ValidatedFormProps<T>) {
  const [errors, setErrors] = useState<{ field: string; message: string }[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());

      // Convert form data to appropriate types
      const processedData = Object.keys(data).reduce((acc, key) => {
        const value = data[key] as string;
        
        // Try to convert numbers
        if (!isNaN(Number(value)) && value !== '') {
          acc[key] = Number(value);
        } else if (value === 'true' || value === 'false') {
          // Convert boolean strings
          acc[key] = value === 'true';
        } else {
          acc[key] = value;
        }
        
        return acc;
      }, {} as any);

      const validation = validateFormData(schema, processedData);
      
      if (!validation.success) {
        setErrors(validation.errors);
        return;
      }

      await onSubmit(validation.data);
    } catch (error: any) {
      console.error('Form submission error:', error);
      setErrors([{ field: 'general', message: error.message || 'An error occurred' }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return errors?.find(err => err.field === field)?.message;
  };

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {children({ errors, isSubmitting, handleSubmit, getFieldError })}
    </form>
  );
}

/**
 * Input field with validation error display
 */
interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
}

export function ValidatedInput({ 
  label, 
  name, 
  error, 
  required = false, 
  className = '',
  ...props 
}: ValidatedInputProps) {
  const baseInputClasses = "mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const errorClasses = error 
    ? "border-red-300 text-red-900 placeholder-red-300" 
    : "border-gray-300";
  
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        {...props}
        id={name}
        name={name}
        className={`${baseInputClasses} ${errorClasses}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Textarea field with validation
 */
interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
}

export function ValidatedTextarea({ 
  label, 
  name, 
  error, 
  required = false,
  className = '',
  ...props 
}: ValidatedTextareaProps) {
  const baseClasses = "mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const errorClasses = error ? "border-red-300" : "border-gray-300";
  
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        {...props}
        id={name}
        name={name}
        className={`${baseClasses} ${errorClasses}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Select field with validation
 */
interface ValidatedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  options: { value: string | number; label: string }[];
}

export function ValidatedSelect({ 
  label, 
  name, 
  error, 
  required = false,
  options,
  className = '',
  ...props 
}: ValidatedSelectProps) {
  const baseClasses = "mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const errorClasses = error ? "border-red-300" : "border-gray-300";
  
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        {...props}
        id={name}
        name={name}
        className={`${baseClasses} ${errorClasses}`}
        aria-invalid={error ? 'true' : 'false'}
      >
        <option value="">Select {label.toLowerCase()}...</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
