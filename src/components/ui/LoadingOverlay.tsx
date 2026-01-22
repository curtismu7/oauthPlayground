import React from 'react';
import { Spinner } from './Spinner';

interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  message?: string;
  spinnerSize?: number;
  backgroundColor?: string;
  opacity?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  children,
  message = 'Loading...',
  spinnerSize = 24,
  backgroundColor = '#ffffff',
  opacity = 0.75
}) => {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor, opacity }}
        >
          <div className="flex flex-col items-center gap-2">
            <Spinner size={spinnerSize} />
            <span className="text-sm text-gray-600">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;
