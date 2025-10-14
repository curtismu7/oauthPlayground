// src/services/copyButtonService.tsx
// Standardized copy button service with black popup and green checkmark

import React, { useState, useCallback } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';
import styled, { keyframes } from 'styled-components';

export interface CopyButtonProps {
	text: string;
	label?: string;
	size?: 'sm' | 'md' | 'lg';
	variant?: 'primary' | 'secondary' | 'outline';
	showLabel?: boolean;
	className?: string;
}

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Container for the copy button and tooltip
const CopyButtonContainer = styled.div`
  position: relative;
  display: inline-block;
`;

// Tooltip that appears above the button
const CopyTooltip = styled.div<{ $visible: boolean; $copied: boolean }>`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 8px 12px;
  background-color: ${({ $copied }) => ($copied ? '#10b981' : '#1f2937')};
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  z-index: 1000;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
  transition: all 0.2s ease;
  animation: ${({ $visible }) => ($visible ? fadeIn : 'none')} 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  /* Arrow pointing down to button */
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid ${({ $copied }) => ($copied ? '#10b981' : '#1f2937')};
  }
`;

// The actual copy button
const CopyButton = styled.button<{
	$size: 'sm' | 'md' | 'lg';
	$variant: 'primary' | 'secondary' | 'outline';
	$copied: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  background-color: ${({ $copied, $variant }) => {
    if ($copied) return '#10b981';
    if ($variant === 'primary') return '#3b82f6';
    if ($variant === 'secondary') return '#6b7280';
    return 'transparent';
  }};
  color: ${({ $copied, $variant }) => {
    if ($copied) return 'white';
    if ($variant === 'outline') return '#374151';
    return 'white';
  }};
  border: ${({ $variant, $copied }) => {
    if ($copied) return '1px solid #10b981';
    if ($variant === 'outline') return '1px solid #d1d5db';
    return 'none';
  }};

  ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return `
          padding: 0.375rem 0.5rem;
          font-size: 0.75rem;
        `;
      case 'lg':
        return `
          padding: 0.75rem 1rem;
          font-size: 1rem;
        `;
      default: // md
        return `
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        `;
    }
  }}

  &:hover {
    background-color: ${({ $copied, $variant }) => {
      if ($copied) return '#059669';
      if ($variant === 'primary') return '#2563eb';
      if ($variant === 'secondary') return '#4b5563';
      return '#f9fafb';
    }};
    transform: ${({ $copied }) => ($copied ? 'none' : 'translateY(-1px)')};
    box-shadow: ${({ $copied }) =>
      $copied
        ? '0 2px 4px rgba(16, 185, 129, 0.3)'
        : '0 4px 8px rgba(0, 0, 0, 0.1)'};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: ${({ $size }) => {
      switch ($size) {
        case 'sm':
          return '14px';
        case 'lg':
          return '18px';
        default:
          return '16px';
      }
    }};
    height: ${({ $size }) => {
      switch ($size) {
        case 'sm':
          return '14px';
        case 'lg':
          return '18px';
        default:
          return '16px';
      }
    }};
  }
`;

// Icon component that switches between copy and check
const CopyIcon: React.FC<{ copied: boolean }> = ({ copied }) => {
  return copied ? <FiCheck /> : <FiCopy />;
};

// Main copy button component
export const CopyButtonService: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  size = 'md',
  variant = 'primary',
  showLabel = true,
  className,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setShowTooltip(true);

      // Reset after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
        setShowTooltip(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        setShowTooltip(true);
        setTimeout(() => {
          setIsCopied(false);
          setShowTooltip(false);
        }, 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  }, [text]);

  const handleMouseEnter = useCallback(() => {
    if (!isCopied) {
      setShowTooltip(true);
    }
  }, [isCopied]);

  const handleMouseLeave = useCallback(() => {
    if (!isCopied) {
      setShowTooltip(false);
    }
  }, [isCopied]);

  	return (
		<CopyButtonContainer className={className}>
			<CopyTooltip $visible={showTooltip} $copied={isCopied}>
				{isCopied ? 'Copied!' : `${label} item`}
			</CopyTooltip>
			<CopyButton
				type="button"
				$size={size}
				$variant={variant}
				$copied={isCopied}
				onClick={handleCopy}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				aria-label={isCopied ? 'Copied!' : `Copy ${label}`}
			>
				<CopyIcon copied={isCopied} />
				{showLabel && !isCopied && label}
				{showLabel && isCopied && 'Copied'}
			</CopyButton>
		</CopyButtonContainer>
	);
};

// Utility function to create copy buttons for common use cases
export const createCopyButton = (
	text: string,
	label: string,
	options: Partial<CopyButtonProps> = {}
) => {
	return (
		<CopyButtonService
			text={text}
			label={label}
			size="sm"
			variant="outline"
			showLabel={false}
			{...options}
		/>
	);
};

// Pre-configured copy buttons for common scenarios
export const CopyButtonVariants = {
	identifier: (text: string, label: string) => (
		<CopyButtonService
			text={text}
			label={label}
			size="sm"
			variant="outline"
			showLabel={false}
		/>
	),

	url: (text: string, label: string) => (
		<CopyButtonService
			text={text}
			label={label}
			size="md"
			variant="primary"
			showLabel={true}
		/>
	),

	token: (text: string, label: string) => (
		<CopyButtonService
			text={text}
			label={label}
			size="sm"
			variant="secondary"
			showLabel={false}
		/>
	),
};











