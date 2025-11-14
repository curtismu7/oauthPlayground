// src/components/FieldTooltip.tsx
/**
 * FieldTooltip Component
 * 
 * Displays helpful tooltips on credential field labels with
 * field purpose and specification references.
 */

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FiHelpCircle } from 'react-icons/fi';

export interface FieldTooltipProps {
  content: string;
  specReference?: string;
  children?: React.ReactNode;
}

const TooltipWrapper = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

const TooltipTrigger = styled.span`
  display: inline-flex;
  align-items: center;
  cursor: help;
  color: #6b7280;
  margin-left: 0.25rem;
  
  &:hover {
    color: #3b82f6;
  }
`;

const TooltipContent = styled.div<{ $visible: boolean }>`
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: white;
  padding: 0.625rem 0.875rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  line-height: 1.4;
  white-space: normal;
  max-width: 280px;
  width: max-content;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  pointer-events: none;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  visibility: ${({ $visible }) => ($visible ? 'visible' : 'hidden')};
  transition: opacity 0.2s ease, visibility 0.2s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: #1f2937;
  }
`;

const TooltipLink = styled.a`
  color: #93c5fd;
  text-decoration: none;
  font-weight: 500;
  display: block;
  margin-top: 0.375rem;
  
  &:hover {
    text-decoration: underline;
    color: #bfdbfe;
  }
`;

/**
 * FieldTooltip Component
 * Shows helpful information on hover with 300ms delay
 */
export const FieldTooltip: React.FC<FieldTooltipProps> = ({
  content,
  specReference,
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    // 300ms delay before showing tooltip
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    // Clear timeout and hide immediately
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  };

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <TooltipWrapper>
      <TooltipTrigger
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="tooltip"
        aria-label={content}
      >
        {children || <FiHelpCircle size={14} />}
      </TooltipTrigger>
      <TooltipContent $visible={visible} role="tooltip">
        {content}
        {specReference && (
          <TooltipLink href={specReference} target="_blank" rel="noopener noreferrer">
            View Specification →
          </TooltipLink>
        )}
      </TooltipContent>
    </TooltipWrapper>
  );
};

export default FieldTooltip;
