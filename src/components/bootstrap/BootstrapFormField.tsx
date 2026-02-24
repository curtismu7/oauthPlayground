/**
 * @file BootstrapFormField.tsx
 * @module components/bootstrap
 * @description PingOne UI Bootstrap Form Field component
 * @version 9.25.1
 * @since 2026-02-23
 * 
 * Enhanced form field component with PingOne UI styling, Bootstrap 5 integration,
 * and comprehensive accessibility support. Features include validation states,
 * help text, error handling, and responsive design.
 */

import React from 'react';
import BootstrapIcon from '@/components/BootstrapIcon';

interface BootstrapFormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'select';
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
  children?: React.ReactNode; // For select options
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'info';
  icon?: string;
  iconPosition?: 'start' | 'end';
  floating?: boolean;
  readonly?: boolean;
}

/**
 * PingOne UI Bootstrap Form Field Component
 * 
 * A comprehensive form field component that implements PingOne UI design standards
 * with Bootstrap 5 classes and utilities. Supports various input types, validation
 * states, and accessibility features.
 * 
 * Features:
 * - Bootstrap 5 form control styling
 * - PingOne UI color scheme integration
 * - Floating label support
 * - Icon integration (start/end positions)
 * - Comprehensive validation states
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Responsive design
 * - Help text and error messaging
 */
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
  children,
  size = 'md',
  variant = 'default',
  icon,
  iconPosition = 'start',
  floating = false,
  readonly = false,
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  
  // Build aria-describedby attribute
  const describedBy = [
    ariaDescribedBy,
    error ? `${fieldId}-error` : null,
    helpText ? `${fieldId}-help` : null,
  ]
    .filter(Boolean)
    .join(' ');

  // Build validation state classes
  const getValidationClasses = () => {
    const classes = [];
    
    if (error) {
      classes.push('is-invalid');
    } else if (variant === 'success') {
      classes.push('is-valid');
    }
    
    return classes.join(' ');
  };

  // Build size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'form-control-sm';
      case 'lg':
        return 'form-control-lg';
      default:
        return '';
    }
  };

  // Build input wrapper classes
  const getWrapperClasses = () => {
    const classes = ['mb-3', 'ping-form-field'];
    
    if (floating) {
      classes.push('form-floating');
    }
    
    if (icon) {
      classes.push('position-relative');
    }
    
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  };

  // Build input classes
  const getInputClasses = () => {
    const classes = [
      'form-control',
      'ping-form-control',
      getSizeClasses(),
      getValidationClasses()
    ].filter(Boolean).join(' ');

    return classes;
  };

  // Build select classes
  const getSelectClasses = () => {
    const classes = [
      'form-select',
      'ping-form-select',
      getSizeClasses(),
      getValidationClasses()
    ].filter(Boolean).join(' ');

    return classes;
  };

  // Build label classes
  const getLabelClasses = () => {
    const classes = ['form-label', 'ping-form-label'];
    
    if (required) {
      classes.push('required');
    }
    
    if (floating) {
      classes.push('floating-label');
    }
    
    return classes.join(' ');
  };

  // Render input with icon
  const renderInputWithIcon = (inputElement: React.ReactElement) => {
    if (!icon) return inputElement;

    if (iconPosition === 'start') {
      return (
        <div className="input-group">
          <span className="input-group-text">
            <BootstrapIcon icon={icon} size={16} aria-hidden={true} />
          </span>
          {inputElement}
        </div>
      );
    } else {
      return (
        <div className="input-group">
          {inputElement}
          <span className="input-group-text">
            <BootstrapIcon icon={icon} size={16} aria-hidden={true} />
          </span>
        </div>
      );
    }
  };

  // Render validation feedback
  const renderValidationFeedback = () => {
    if (error) {
      return (
        <div 
          id={`${fieldId}-error`} 
          className="invalid-feedback d-flex align-items-center"
          role="alert"
          aria-live="polite"
        >
          <BootstrapIcon 
            icon="exclamation-triangle" 
            size={14} 
            className="me-1" 
            aria-hidden={true}
          />
          {error}
        </div>
      );
    }

    if (variant === 'success') {
      return (
        <div 
          id={`${fieldId}-success`} 
          className="valid-feedback d-flex align-items-center"
          aria-live="polite"
        >
          <BootstrapIcon 
            icon="check-circle" 
            size={14} 
            className="me-1" 
            aria-hidden={true}
          />
          Valid
        </div>
      );
    }

    return null;
  };

  // Render help text
  const renderHelpText = () => {
    if (!helpText) return null;

    return (
      <div 
        id={`${fieldId}-help`} 
        className="form-text text-muted d-flex align-items-start"
      >
        <BootstrapIcon 
          icon="info-circle" 
          size={14} 
          className="me-1 mt-0.5 flex-shrink-0" 
          aria-hidden={true}
        />
        <span>{helpText}</span>
      </div>
    );
  };

  // Render required indicator
  const renderRequiredIndicator = () => {
    if (!required) return null;

    return (
      <span 
        className="text-danger ms-1" 
        title="This field is required"
        aria-label="required"
      >
        *
      </span>
    );
  };

  return (
    <div className={getWrapperClasses()}>
      {/* Label */}
      {!floating && (
        <label 
          htmlFor={fieldId} 
          className={getLabelClasses()}
        >
          {label}
          {renderRequiredIndicator()}
        </label>
      )}

      {/* Input/Select with Icon */}
      {type === 'select' ? (
        renderInputWithIcon(
          <select
            id={fieldId}
            className={getSelectClasses()}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-describedby={describedBy}
            aria-invalid={!!error}
          >
            {children}
          </select>
        )
      ) : (
        renderInputWithIcon(
          <input
            type={type}
            id={fieldId}
            className={getInputClasses()}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readonly}
            aria-label={ariaLabel}
            aria-describedby={describedBy}
            aria-invalid={!!error}
          />
        )
      )}

      {/* Floating Label */}
      {floating && (
        <label 
          htmlFor={fieldId} 
          className={getLabelClasses()}
        >
          {label}
          {renderRequiredIndicator()}
        </label>
      )}

      {/* Validation Feedback */}
      {renderValidationFeedback()}

      {/* Help Text */}
      {renderHelpText()}
    </div>
  );
};

export default BootstrapFormField;
