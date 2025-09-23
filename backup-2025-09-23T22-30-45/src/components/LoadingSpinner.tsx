import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const SpinnerContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
`;

const SpinnerIcon = styled.div`
  width: 1rem;
  height: 1rem;
  border: 2px solid ${({ theme }) => theme.colors.gray300};
  border-top: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Minimum delay for consistent UX feedback
const MIN_SPINNER_DELAY = 2000; // 2 seconds

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
  className
}) => {
  return (
    <SpinnerContainer className={className}>
      <SpinnerIcon />
      <span>{message}</span>
    </SpinnerContainer>
  );
};

// Utility function to ensure minimum spinner delay
export const withMinimumDelay = async <T,>(
  asyncOperation: () => Promise<T>,
  minDelayMs: number = MIN_SPINNER_DELAY
): Promise<T> => {
  const startTime = Date.now();

  try {
    const result = await asyncOperation();
    const elapsedTime = Date.now() - startTime;

    // If the operation completed faster than minimum delay, wait for the remaining time
    if (elapsedTime < minDelayMs) {
      await new Promise(resolve => setTimeout(resolve, minDelayMs - elapsedTime));
    }

    return result;
  } catch (error) {
    const elapsedTime = Date.now() - startTime;

    // Still wait for minimum delay even if operation failed
    if (elapsedTime < minDelayMs) {
      await new Promise(resolve => setTimeout(resolve, minDelayMs - elapsedTime));
    }

    throw error;
  }
};

// Hook for consistent loading states
export const useLoadingState = (initialLoading = false) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');

  const startLoading = (message = 'Loading...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const withLoading = async <T,>(
    asyncOperation: () => Promise<T>,
    loadingMessage = 'Loading...'
  ): Promise<T> => {
    startLoading(loadingMessage);
    try {
      const result = await withMinimumDelay(asyncOperation);
      return result;
    } finally {
      stopLoading();
    }
  };

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading
  };
};

export default LoadingSpinner;
