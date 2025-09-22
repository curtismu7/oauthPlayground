import React from 'react';
import styled from 'styled-components';

interface FlowBadgeProps {
  type: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

const Badge = styled.span<{ $type: FlowBadgeProps['type'] }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${({ $type }) => {
    switch ($type) {
      case 'success':
        return `
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        `;
      case 'warning':
        return `
          background-color: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        `;
      case 'error':
        return `
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        `;
      case 'info':
        return `
          background-color: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        `;
      default:
        return `
          background-color: #e9ecef;
          color: #495057;
          border: 1px solid #dee2e6;
        `;
    }
  }}
`;

export const FlowBadge: React.FC<FlowBadgeProps> = ({ type, children }) => {
  return <Badge $type={type}>{children}</Badge>;
};

export default FlowBadge;
