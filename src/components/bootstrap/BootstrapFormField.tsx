/**
 * @file bootstrap-form-field.tsx
 * @module components/bootstrap
 * @description PingOne Bootstrap Form Field component
 * @version 1.0.0
 * @since 2026-02-23
 */

import React from 'react';

interface BootstrapFormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const BootstrapFormField: React.FC<BootstrapFormFieldProps> = ({
  label,
  type = 'text',
  id,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const describedBy = [
    ariaDescribedBy,
    error ? `${fieldId}-error` : null,
    helpText ? `${fieldId}-help` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`mb-3 ${className}`}>
      <label 
        htmlFor={fieldId} 
        className="form-label"
      >
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </label>
      <input
        type={type}
        id={fieldId}
        className={`form-control ping-form-control ${error ? 'is-invalid' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-invalid={!!error}
      />
      {error && (
        <div id={`${fieldId}-error`} className="invalid-feedback">
          {error}
        </div>
      )}
      {helpText && (
        <div id={`${fieldId}-help`} className="form-text text-muted">
          {helpText}
        </div>
      )}
    </div>
  );
};

export default BootstrapFormField;
