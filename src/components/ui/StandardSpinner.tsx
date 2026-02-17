/**
 * @file StandardSpinner.tsx
 * @module components/ui
 * @description Standardized spinner system with 2 types: Button and Modal
 * @version 1.0.0
 */

import React from 'react';
import { ButtonSpinner } from './ButtonSpinner';
import { LoadingSpinnerModalV8U } from '@/v8u/components/LoadingSpinnerModalV8U';

// Standard spinner types
export type SpinnerType = 'button' | 'modal';

// Standard spinner configurations
export const SPINNER_CONFIGS = {
  button: {
    spinnerSize: 16,
    spinnerPosition: 'left' as const,
    loadingText: 'Loading...',
  },
  modal: {
    theme: 'blue' as const,
    message: 'Loading...',
  }
} as const;

// Standard spinner durations (in milliseconds)
export const SPINNER_DURATIONS = {
  quick: 1000,      // < 1 second - use button spinner
  medium: 3000,     // 1-3 seconds - use button spinner  
  long: 5000,       // 3-5 seconds - use modal spinner
  extended: 10000,  // > 5 seconds - use modal spinner
} as const;

/**
 * Determine spinner type based on operation duration
 */
export const getSpinnerType = (durationMs: number): SpinnerType => {
  if (durationMs <= SPINNER_DURATIONS.medium) {
    return 'button';
  }
  return 'modal';
};

/**
 * Standardized Button Spinner
 */
export interface StandardButtonSpinnerProps {
  loading: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  loadingText?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const StandardButtonSpinner: React.FC<StandardButtonSpinnerProps> = ({
  loading,
  children,
  disabled,
  loadingText = SPINNER_CONFIGS.button.loadingText,
  className = '',
  style,
  onClick,
  ...props
}) => {
  return (
    <ButtonSpinner
      loading={loading}
      disabled={disabled}
      spinnerSize={SPINNER_CONFIGS.button.spinnerSize}
      spinnerPosition={SPINNER_CONFIGS.button.spinnerPosition}
      loadingText={loadingText}
      className={className}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </ButtonSpinner>
  );
};

/**
 * Standardized Modal Spinner
 */
export interface StandardModalSpinnerProps {
  show: boolean;
  message?: string;
  theme?: 'blue' | 'green' | 'orange' | 'purple';
}

export const StandardModalSpinner: React.FC<StandardModalSpinnerProps> = ({
  show,
  message = SPINNER_CONFIGS.modal.message,
  theme = SPINNER_CONFIGS.modal.theme
}) => {
  return (
    <LoadingSpinnerModalV8U
      show={show}
      message={message}
      theme={theme}
    />
  );
};

/**
 * Hook to manage spinner state with automatic type selection
 */
export const useStandardSpinner = (estimatedDuration?: number) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [startTime, setStartTime] = React.useState<number | null>(null);
  
  const spinnerType = estimatedDuration 
    ? getSpinnerType(estimatedDuration)
    : 'button'; // Default to button for unknown duration
  
  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setStartTime(Date.now());
  }, []);
  
  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
    setStartTime(null);
  }, []);
  
  const executeWithSpinner = React.useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    options?: {
      estimatedDuration?: number;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<T> => {
    const duration = options?.estimatedDuration || estimatedDuration;
    const type = duration ? getSpinnerType(duration) : spinnerType;
    
    startLoading();
    
    try {
      const result = await asyncFn();
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      options?.onError?.(errorObj);
      throw errorObj;
    } finally {
      stopLoading();
    }
  }, [estimatedDuration, spinnerType, startLoading, stopLoading]);
  
  return {
    isLoading,
    spinnerType,
    startLoading,
    stopLoading,
    executeWithSpinner,
    duration: startTime ? Date.now() - startTime : null
  };
};

/**
 * Component that automatically chooses the right spinner type
 */
export interface AutoSpinnerProps {
  loading: boolean;
  estimatedDuration?: number;
  children?: React.ReactNode;
  message?: string;
  theme?: 'blue' | 'green' | 'orange' | 'purple';
  buttonProps?: Omit<StandardButtonSpinnerProps, 'loading'>;
  modalProps?: Omit<StandardModalSpinnerProps, 'show'>;
}

export const AutoSpinner: React.FC<AutoSpinnerProps> = ({
  loading,
  estimatedDuration,
  children,
  message,
  theme,
  buttonProps,
  modalProps
}) => {
  const spinnerType = estimatedDuration 
    ? getSpinnerType(estimatedDuration)
    : 'button';
  
  if (!loading) {
    return <>{children}</>;
  }
  
  if (spinnerType === 'modal') {
    return (
      <StandardModalSpinner
        show={true}
        message={message}
        theme={theme}
        {...modalProps}
      />
    );
  }
  
  // For button spinner, we need a button element
  if (buttonProps) {
    return (
      <StandardButtonSpinner
        loading={true}
        {...buttonProps}
      >
        {children}
      </StandardButtonSpinner>
    );
  }
  
  // Fallback to basic spinner if no button props provided
  return (
    <StandardButtonSpinner
      loading={true}
      onClick={() => {}}
      disabled={true}
    >
      {children || 'Loading...'}
    </StandardButtonSpinner>
  );
};
