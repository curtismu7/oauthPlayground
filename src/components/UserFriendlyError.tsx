// src/components/UserFriendlyError.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { FiChevronDown, FiChevronRight, FiExternalLink, FiCopy, FiCheck } from 'react-icons/fi';
import { formatErrorForDisplay, type ErrorDetails } from '../utils/errorHandler';

interface UserFriendlyErrorProps {
  error: any;
  onRetry?: () => void;
  showTechnicalDetails?: boolean;
  className?: string;
}

const ErrorContainer = styled.div<{ severity: ErrorDetails['severity'] }>`
  background-color: ${({ severity }) => {
    switch (severity) {
      case 'critical': return '#fef2f2';
      case 'high': return '#fff7ed';
      case 'medium': return '#fffbeb';
      case 'low': return '#f0fdf4';
      default: return '#f9fafb';
    }
  }};
  border: 1px solid ${({ severity }) => {
    switch (severity) {
      case 'critical': return '#fecaca';
      case 'high': return '#fed7aa';
      case 'medium': return '#fde68a';
      case 'low': return '#bbf7d0';
      default: return '#e5e7eb';
    }
  }};
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
`;

const ErrorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const ErrorIcon = styled.div<{ color: string }>`
  color: ${({ color }) => color};
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const ErrorTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  flex: 1;
`;

const ErrorMessage = styled.p`
  color: #374151;
  margin: 0.5rem 0 1rem 0;
  line-height: 1.5;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  transition: color 0.2s;

  &:hover {
    color: #374151;
    background-color: #f3f4f6;
  }
`;

const DetailsSection = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const List = styled.ul`
  margin: 0;
  padding-left: 1.25rem;
  color: #374151;
  line-height: 1.6;
`;

const ListItem = styled.li`
  margin-bottom: 0.5rem;
`;

const CodeBlock = styled.pre`
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin: 0.5rem 0;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  position: relative;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;

  &:hover {
    background-color: #f9fafb;
    color: #374151;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${({ variant = 'secondary' }) => {
    if (variant === 'primary') {
      return `
        background-color: #3b82f6;
        color: white;
        border: 1px solid #3b82f6;
        
        &:hover {
          background-color: #2563eb;
          border-color: #2563eb;
        }
      `;
    } else {
      return `
        background-color: #ffffff;
        color: #374151;
        border: 1px solid #d1d5db;
        
        &:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }
      `;
    }
  }}
`;

const PingOneLink = styled.a`
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const UserFriendlyError: React.FC<UserFriendlyErrorProps> = ({
  error,
  onRetry,
  showTechnicalDetails = false,
  className
}) => {
  const [expanded, setExpanded] = useState(showTechnicalDetails);
  const [copied, setCopied] = useState(false);
  
  const { details, icon: Icon, color } = formatErrorForDisplay(error);

  const handleCopyError = async () => {
    try {
      await navigator.clipboard.writeText(details.originalError);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <ErrorContainer severity={details.severity} className={className}>
      <ErrorHeader>
        <ErrorIcon color={color}>
          <Icon />
        </ErrorIcon>
        <ErrorTitle>{details.userFriendlyMessage}</ErrorTitle>
        <ToggleButton onClick={() => setExpanded(!expanded)}>
          {expanded ? <FiChevronDown /> : <FiChevronRight />}
          {expanded ? 'Hide Details' : 'Show Details'}
        </ToggleButton>
      </ErrorHeader>

      <ErrorMessage>
        {details.category === 'authentication' && (
          <>This is an authentication error. Check your PingOne application configuration.</>
        )}
        {details.category === 'authorization' && (
          <>This is an authorization error. Your application may not be configured for this flow.</>
        )}
        {details.category === 'configuration' && (
          <>This is a configuration error. Check your PingOne application settings.</>
        )}
        {details.category === 'network' && (
          <>This is a network error. Check your connection and server status.</>
        )}
        {details.category === 'token' && (
          <>This is a token-related error. Your token may be expired or invalid.</>
        )}
        {details.category === 'unknown' && (
          <>An unexpected error occurred. Try the suggestions below or contact support.</>
        )}
      </ErrorMessage>

      {expanded && (
        <DetailsSection>
          <SectionTitle>Possible Causes</SectionTitle>
          <List>
            {details.possibleCauses.map((cause, index) => (
              <ListItem key={index}>{cause}</ListItem>
            ))}
          </List>

          <SectionTitle>Solutions</SectionTitle>
          <List>
            {details.solutions.map((solution, index) => (
              <ListItem key={index}>{solution}</ListItem>
            ))}
          </List>

          <SectionTitle>Technical Details</SectionTitle>
          <CodeBlock>
            <CopyButton onClick={handleCopyError}>
              {copied ? <FiCheck /> : <FiCopy />}
              {copied ? 'Copied!' : 'Copy'}
            </CopyButton>
            {details.originalError}
          </CodeBlock>

          {details.category === 'authentication' && (
            <div>
              <SectionTitle>PingOne Configuration Help</SectionTitle>
              <p style={{ color: '#374151', marginBottom: '0.5rem' }}>
                Check your PingOne Admin console:
              </p>
              <List>
                <ListItem>
                  <PingOneLink href="https://admin.pingone.com" target="_blank" rel="noopener noreferrer">
                    Open PingOne Admin <FiExternalLink />
                  </PingOneLink>
                </ListItem>
                <ListItem>Navigate to your application settings</ListItem>
                <ListItem>Verify Client ID and Client Secret</ListItem>
                <ListItem>Check application type (SPA vs Confidential)</ListItem>
                <ListItem>Enable required grant types and response types</ListItem>
              </List>
            </div>
          )}
        </DetailsSection>
      )}

      <ActionButtons>
        {onRetry && (
          <ActionButton variant="primary" onClick={handleRetry}>
            Try Again
          </ActionButton>
        )}
        <ActionButton onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide Details' : 'Show Details'}
        </ActionButton>
      </ActionButtons>
    </ErrorContainer>
  );
};

export default UserFriendlyError;
