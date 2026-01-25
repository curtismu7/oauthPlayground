import React from 'react';
import { FiRefreshCw, FiLoader, FiActivity } from 'react-icons/fi';

interface SpinnerProps {
  size?: number;
  variant?: 'spin' | 'pulse' | 'dots';
  color?: string;
  className?: string;
  label?: string; // For accessibility
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 16,
  variant = 'spin',
  color = 'currentColor',
  className = '',
  label = 'Loading'
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'pulse':
        return <FiActivity />;
      case 'dots':
        return <FiLoader />;
      default:
        return <FiRefreshCw />;
    }
  };

  const getAnimationStyle = () => {
    switch (variant) {
      case 'spin':
        return {
          animation: 'spin 1s linear infinite',
        };
      case 'pulse':
        return {
          animation: 'pulse 1.5s ease-in-out infinite',
        };
      case 'dots':
        return {
          animation: 'dots 1.4s ease-in-out infinite',
        };
      default:
        return {
          animation: 'spin 1s linear infinite',
        };
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes dots {
          0%, 20% { opacity: 0; }
          50% { opacity: 1; }
          80%, 100% { opacity: 0; }
        }
      `}</style>
      <div
        className={`spinner spinner--${variant} ${className}`}
        style={{ 
          width: size, 
          height: size,
          color,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          ...getAnimationStyle()
        }}
        role="status"
        aria-label={label}
        aria-live="polite"
      >
        {getIcon()}
      </div>
    </>
  );
};

// Predefined spinner sizes for consistency
export const SmallSpinner = (props: Omit<SpinnerProps, 'size'>) => (
  <Spinner size={12} {...props} />
);

export const MediumSpinner = (props: Omit<SpinnerProps, 'size'>) => (
  <Spinner size={16} {...props} />
);

export const LargeSpinner = (props: Omit<SpinnerProps, 'size'>) => (
  <Spinner size={24} {...props} />
);

export const FullSpinner = (props: Omit<SpinnerProps, 'size'>) => (
  <Spinner size={32} {...props} />
);

export default Spinner;
