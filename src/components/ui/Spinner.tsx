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

  return (
    <div
      className={`spinner spinner--${variant} ${className}`}
      style={{ 
        width: size, 
        height: size,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent'
      }}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      {getIcon()}
    </div>
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
