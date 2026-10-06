import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required = false,
  helperText,
  error,
  className = '',
  children,
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={htmlFor}
          className="block text-xs font-semibold text-foreground"
        >
          {label}
          {required && <span className="ml-1 text-rose-500 font-bold" title="Required field">*</span>}
        </label>
        {required && (
          <span className="text-[10px] text-muted font-normal">Required</span>
        )}
      </div>

      <div>{children}</div>

      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-muted">{helperText}</p>
      ) : null}
    </div>
  );
};
