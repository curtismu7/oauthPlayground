// src/components/LogoutUriInfoPanel.tsx
import React from 'react';
import { FiLogOut, FiAlertTriangle, FiBook, FiCopy, FiCheck } from 'react-icons/fi';
import styled from 'styled-components';
import { callbackUriService } from '../services/callbackUriService';

interface LogoutUriInfoPanelProps {
  flowKey?: 'authorization_code' | 'implicit' | 'hybrid' | 'device' | 'client_credentials' | 'pingone_auth' | 'dashboard';
  className?: string;
  showCopyButton?: boolean;
  compact?: boolean;
}

const PanelContainer = styled.div<{ $compact?: boolean }>`
  padding: ${props => props.$compact ? '0.75rem' : '1rem'};
  background-color: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #92400e;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  margin: ${props => props.$compact ? '0.5rem 0' : '0.75rem 0'};
`;

const Header = styled.div<{ $compact?: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: ${props => props.$compact ? '0.25rem' : '0.5rem'};
`;

const Icon = styled.span<{ $compact?: boolean }>`
  font-size: ${props => props.$compact ? '1rem' : '1.25rem'};
  margin-right: 0.5rem;
`;

const Title = styled.strong<{ $compact?: boolean }>`
  font-size: ${props => props.$compact ? '0.875rem' : '1rem'};
  color: #92400e;
`;

const UriContainer = styled.div<{ $compact?: boolean }>`
  background-color: #eff6ff;
  padding: ${props => props.$compact ? '0.5rem' : '0.75rem'};
  border-radius: 0.375rem;
  margin-bottom: ${props => props.$compact ? '0.5rem' : '0.75rem'};
  border: 1px solid #dbeafe;
`;

const UriLabel = styled.div<{ $compact?: boolean }>`
  font-size: ${props => props.$compact ? '0.75rem' : '0.8rem'};
  color: #1e40af;
  margin-bottom: 0.25rem;
  font-weight: 500;
`;

const UriCode = styled.code<{ $compact?: boolean }>`
  color: #1e40af;
  background-color: #dbeafe;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: ${props => props.$compact ? '0.8rem' : '0.875rem'};
  font-weight: 600;
  display: block;
  word-break: break-all;
`;

const PurposeText = styled.div<{ $compact?: boolean }>`
  font-size: ${props => props.$compact ? '0.75rem' : '0.8rem'};
  color: #92400e;
  margin-bottom: ${props => props.$compact ? '0.25rem' : '0.5rem'};
  line-height: 1.4;
`;

const WarningBox = styled.div<{ $compact?: boolean }>`
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  padding: ${props => props.$compact ? '0.5rem' : '0.75rem'};
  border-radius: 0.375rem;
  margin-top: ${props => props.$compact ? '0.5rem' : '0.75rem'};
`;

const WarningHeader = styled.div<{ $compact?: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: ${props => props.$compact ? '0.25rem' : '0.5rem'};
`;

const WarningIcon = styled.span<{ $compact?: boolean }>`
  font-size: ${props => props.$compact ? '0.875rem' : '1rem'};
  margin-right: 0.5rem;
  color: #dc2626;
`;

const WarningTitle = styled.strong<{ $compact?: boolean }>`
  font-size: ${props => props.$compact ? '0.8rem' : '0.875rem'};
  color: #dc2626;
`;

const WarningText = styled.div<{ $compact?: boolean }>`
  font-size: ${props => props.$compact ? '0.75rem' : '0.8rem'};
  color: #dc2626;
  line-height: 1.4;
`;

const DocBox = styled.div<{ $compact?: boolean }>`
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  padding: ${props => props.$compact ? '0.5rem' : '0.75rem'};
  border-radius: 0.375rem;
  margin-top: ${props => props.$compact ? '0.5rem' : '0.75rem'};
`;

const DocHeader = styled.div<{ $compact?: boolean }>`
  display: flex;
  align-items: center;
  margin-bottom: ${props => props.$compact ? '0.25rem' : '0.5rem'};
`;

const DocIcon = styled.span<{ $compact?: boolean }>`
  font-size: ${props => props.$compact ? '0.875rem' : '1rem'};
  margin-right: 0.5rem;
  color: #0369a1;
`;

const DocTitle = styled.strong<{ $compact?: boolean }>`
  font-size: ${props => props.$compact ? '0.8rem' : '0.875rem'};
  color: #0369a1;
`;

const DocText = styled.div<{ $compact?: boolean }>`
  font-size: ${props => props.$compact ? '0.75rem' : '0.8rem'};
  color: #0369a1;
  line-height: 1.4;
`;

const CopyButton = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2563eb;
  }

  &:active {
    background-color: #1d4ed8;
  }
`;

const LogoutUriInfoPanel: React.FC<LogoutUriInfoPanelProps> = ({
  flowKey = 'authorization_code',
  className,
  showCopyButton = true,
  compact = false
}) => {
  const uriInfo = callbackUriService.getRedirectUriForFlow(flowKey);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uriInfo.logoutUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy logout URI:', err);
    }
  };

  return (
    <PanelContainer className={className} $compact={compact}>
      <Header $compact={compact}>
        <Icon $compact={compact}>🚪</Icon>
        <Title $compact={compact}>{uriInfo.description} Logout URI</Title>
      </Header>
      
      <UriContainer $compact={compact}>
        <UriLabel $compact={compact}>Flow-Specific Logout URI:</UriLabel>
        <UriCode $compact={compact}>{uriInfo.logoutUri}</UriCode>
        {showCopyButton && (
          <CopyButton onClick={handleCopy}>
            {copied ? <FiCheck /> : <FiCopy />}
            {copied ? 'Copied!' : 'Copy URI'}
          </CopyButton>
        )}
      </UriContainer>
      
      <PurposeText $compact={compact}>
        <strong>Purpose:</strong> {uriInfo.logoutNote}
      </PurposeText>
      
      <WarningBox $compact={compact}>
        <WarningHeader $compact={compact}>
          <WarningIcon $compact={compact}>⚠️</WarningIcon>
          <WarningTitle $compact={compact}>PingOne Configuration Required</WarningTitle>
        </WarningHeader>
        <WarningText $compact={compact}>
          Add this exact URI to your PingOne application's <strong>"Post Logout Redirect URIs"</strong> list. 
          Each flow requires its own unique logout URI to prevent conflicts.
        </WarningText>
      </WarningBox>
      
      <DocBox $compact={compact}>
        <DocHeader $compact={compact}>
          <DocIcon $compact={compact}>📖</DocIcon>
          <DocTitle $compact={compact}>Documentation</DocTitle>
        </DocHeader>
        <DocText $compact={compact}>
          For complete logout URI documentation and troubleshooting, see the 
          <strong> Logout URIs Reference</strong> in the project documentation.
        </DocText>
      </DocBox>
    </PanelContainer>
  );
};

export default LogoutUriInfoPanel;
