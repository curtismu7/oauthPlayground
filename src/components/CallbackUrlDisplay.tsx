import React, { useState } from 'react';
import styled from 'styled-components';
import { FiCopy, FiExternalLink, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { getCallbackUrlForFlow, getCallbackDescription, flowRequiresRedirectUri } from '../utils/callbackUrls';
import { logger } from '../utils/logger';

const CallbackUrlContainer = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
`;

const CallbackUrlHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const CallbackUrlTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CallbackUrlContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const UrlDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.75rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
`;

const UrlText = styled.code`
  flex: 1;
  color: #374151;
  word-break: break-all;
`;

const ActionButton = styled.button<{ $variant?: 'copy' | 'external' }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 1px solid ${({ $variant }) => $variant === 'copy' ? '#d1d5db' : '#3b82f6'};
  border-radius: 0.375rem;
  background: ${({ $variant }) => $variant === 'copy' ? '#ffffff' : '#3b82f6'};
  color: ${({ $variant }) => $variant === 'copy' ? '#374151' : '#ffffff'};
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${({ $variant }) => $variant === 'copy' ? '#f9fafb' : '#2563eb'};
    border-color: ${({ $variant }) => $variant === 'copy' ? '#9ca3af' : '#1d4ed8'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Description = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
`;

const WarningBox = styled.div`
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const WarningIcon = styled.div`
  color: #d97706;
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const WarningContent = styled.div`
  flex: 1;
`;

const WarningTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 0.25rem 0;
`;

const WarningText = styled.p`
  font-size: 0.875rem;
  color: #92400e;
  margin: 0;
  line-height: 1.5;
`;

const SetupInstructions = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
`;

const SetupTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 0.5rem 0;
`;

const SetupList = styled.ol`
  font-size: 0.875rem;
  color: #1e40af;
  margin: 0;
  padding-left: 1.25rem;
  line-height: 1.5;
`;

const SetupListItem = styled.li`
  margin-bottom: 0.25rem;
`;

interface CallbackUrlDisplayProps {
  flowType: string;
  baseUrl?: string;
}

const CallbackUrlDisplay: React.FC<CallbackUrlDisplayProps> = ({ flowType, baseUrl }) => {
  const [copied, setCopied] = useState(false);
  
  const callbackUrl = getCallbackUrlForFlow(flowType, baseUrl);
  const description = getCallbackDescription(flowType);
  const requiresRedirect = flowRequiresRedirectUri(flowType);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(callbackUrl);
      setCopied(true);
      logger.oauth('CallbackUrlDisplay', 'Callback URL copied to clipboard', { flowType, callbackUrl });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('CallbackUrlDisplay', 'Failed to copy callback URL', error);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(callbackUrl, '_blank');
    logger.oauth('CallbackUrlDisplay', 'Callback URL opened in new tab', { flowType, callbackUrl });
  };

  if (!requiresRedirect) {
    return (
      <CallbackUrlContainer>
        <CallbackUrlHeader>
          <CallbackUrlTitle>Redirect URI Configuration</CallbackUrlTitle>
        </CallbackUrlHeader>
        <WarningBox>
          <WarningIcon>
            <FiAlertTriangle />
          </WarningIcon>
          <WarningContent>
            <WarningTitle>No Redirect URI Required</WarningTitle>
            <WarningText>
              The {flowType} flow does not require a redirect URI. This flow uses direct token endpoint communication.
            </WarningText>
          </WarningContent>
        </WarningBox>
      </CallbackUrlContainer>
    );
  }

  return (
    <CallbackUrlContainer>
      <CallbackUrlHeader>
        <CallbackUrlTitle>Configure in PingOne</CallbackUrlTitle>
      </CallbackUrlHeader>
      <CallbackUrlContent>
        <Description>{description}</Description>
        
        <UrlDisplay>
          <UrlText>{callbackUrl}</UrlText>
          <ActionButton $variant="copy" onClick={handleCopy} disabled={copied}>
            {copied ? <FiCheck /> : <FiCopy />}
            {copied ? 'Copied!' : 'Copy'}
          </ActionButton>
          <ActionButton $variant="external" onClick={handleOpenInNewTab}>
            <FiExternalLink />
            Open
          </ActionButton>
        </UrlDisplay>

        <SetupInstructions>
          <SetupTitle>Setup Instructions:</SetupTitle>
          <SetupList>
            <SetupListItem>Copy the redirect URI above</SetupListItem>
            <SetupListItem>Go to your PingOne application settings</SetupListItem>
            <SetupListItem>Navigate to "Redirect URIs" section</SetupListItem>
            <SetupListItem>Add the copied URI to your allowed redirect URIs</SetupListItem>
            <SetupListItem>Save your configuration</SetupListItem>
          </SetupList>
        </SetupInstructions>
      </CallbackUrlContent>
    </CallbackUrlContainer>
  );
};

export default CallbackUrlDisplay;
