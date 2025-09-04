import React from 'react';
import styled from 'styled-components';
import { FlowType, isOAuth2Flow, isOIDCFlow, isDeprecatedFlow } from '../types/flowTypes';

interface FlowBadgeProps {
  flow: FlowType;
  size?: 'small' | 'medium' | 'large';
}

const BadgeContainer = styled.div<{ $protocol: 'oauth2' | 'oidc'; $deprecated?: boolean; $size: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: ${({ $size }) => 
    $size === 'small' ? '0.25rem 0.5rem' : 
    $size === 'medium' ? '0.5rem 0.75rem' : 
    '0.75rem 1rem'
  };
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: ${({ $size }) => 
    $size === 'small' ? '0.75rem' : 
    $size === 'medium' ? '0.875rem' : 
    '1rem'
  };
  
  ${({ $protocol, $deprecated }) => {
    if ($deprecated) {
      return `
        background-color: #fef3c7;
        border: 1px solid #f59e0b;
        color: #92400e;
      `;
    }
    
    if ($protocol === 'oauth2') {
      return `
        background-color: #dbeafe;
        border: 1px solid #3b82f6;
        color: #1e40af;
      `;
    } else {
      return `
        background-color: #f0fdf4;
        border: 1px solid #22c55e;
        color: #15803d;
      `;
    }
  }}
`;

const ProtocolIcon = styled.span<{ $protocol: 'oauth2' | 'oidc' }>`
  font-size: ${({ $protocol }) => $protocol === 'oauth2' ? '0.875em' : '1em'};
  font-weight: bold;
`;

const DeprecatedIcon = styled.span`
  font-size: 0.875em;
`;

export const FlowBadge: React.FC<FlowBadgeProps> = ({ flow, size = 'medium' }) => {
  const isOAuth2 = isOAuth2Flow(flow);
  const isOIDC = isOIDCFlow(flow);
  const isDeprecated = isDeprecatedFlow(flow);

  return (
    <BadgeContainer $protocol={flow.protocol} $deprecated={isDeprecated} $size={size}>
      {isDeprecated && <DeprecatedIcon>⚠️</DeprecatedIcon>}
      <ProtocolIcon $protocol={flow.protocol}>
        {isOAuth2 ? 'OAuth 2.0' : isOIDC ? 'OIDC' : 'Unknown'}
      </ProtocolIcon>
      {isDeprecated && <span>Deprecated</span>}
    </BadgeContainer>
  );
};

export default FlowBadge;
