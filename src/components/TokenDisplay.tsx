import React, { useState } from 'react';
import styled from 'styled-components';
import { FiCopy, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';

interface TokenDisplayProps {
  tokens: {
    access_token?: string;
    id_token?: string;
    token_type?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    [key: string]: any;
  };
}

const TokenContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const TokenSection = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  position: relative;
`;

const TokenHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const TokenLabel = styled.h4`
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TokenActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  background: ${({ $variant }) => $variant === 'primary' ? '#3b82f6' : '#6b7280'};
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s;

  &:hover {
    background: ${({ $variant }) => $variant === 'primary' ? '#2563eb' : '#4b5563'};
  }

  svg {
    width: 0.875rem;
    height: 0.875rem;
  }
`;

const TokenValue = styled.pre<{ $isMasked?: boolean }>`
  margin: 0;
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #1f2937;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 0.75rem;
  overflow-x: auto;
  word-break: break-all;
  white-space: pre-wrap;
`;

const TokenInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`;

const InfoValue = styled.span`
  color: #6b7280;
  font-size: 0.875rem;
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
`;

const TokenDisplay: React.FC<TokenDisplayProps> = ({ tokens }) => {
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [maskedStates, setMaskedStates] = useState<Record<string, boolean>>({});

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const toggleMask = (key: string) => {
    setMaskedStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskToken = (token: string) => {
    if (token.length <= 20) return token;
    return token.substring(0, 10) + '...' + token.substring(token.length - 10);
  };

  const formatExpiresIn = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const renderTokenSection = (key: string, label: string, value: string | number, isToken: boolean = false) => {
    const displayValue = isToken && maskedStates[key] ? maskToken(String(value)) : String(value);
    const isCopied = copiedStates[key];
    const isMasked = maskedStates[key];

    return (
      <TokenSection key={key}>
        <TokenHeader>
          <TokenLabel>{label}</TokenLabel>
          <TokenActions>
            {isToken && (
              <ActionButton
                $variant="secondary"
                onClick={() => toggleMask(key)}
                title={isMasked ? 'Show full token' : 'Mask token'}
              >
                {isMasked ? <FiEye /> : <FiEyeOff />}
                {isMasked ? 'Show' : 'Mask'}
              </ActionButton>
            )}
            <ActionButton
              $variant="primary"
              onClick={() => copyToClipboard(String(value), key)}
              title="Copy to clipboard"
            >
              {isCopied ? <FiCheck /> : <FiCopy />}
              {isCopied ? 'Copied!' : 'Copy'}
            </ActionButton>
          </TokenActions>
        </TokenHeader>
        <TokenValue $isMasked={isToken && isMasked}>
          {displayValue}
        </TokenValue>
      </TokenSection>
    );
  };

  return (
    <TokenContainer>
      {tokens.access_token && renderTokenSection('access_token', 'Access Token', tokens.access_token, true)}
      {tokens.id_token && renderTokenSection('id_token', 'ID Token', tokens.id_token, true)}
      {tokens.refresh_token && renderTokenSection('refresh_token', 'Refresh Token', tokens.refresh_token, true)}
      
      <TokenSection>
        <TokenLabel>Token Information</TokenLabel>
        <TokenInfo>
          {tokens.token_type && (
            <InfoRow>
              <InfoLabel>Token Type</InfoLabel>
              <InfoValue>{tokens.token_type}</InfoValue>
            </InfoRow>
          )}
          {tokens.expires_in && (
            <InfoRow>
              <InfoLabel>Expires In</InfoLabel>
              <InfoValue>{formatExpiresIn(tokens.expires_in)} ({tokens.expires_in} seconds)</InfoValue>
            </InfoRow>
          )}
          {tokens.scope && (
            <InfoRow>
              <InfoLabel>Scope</InfoLabel>
              <InfoValue>{tokens.scope}</InfoValue>
            </InfoRow>
          )}
        </TokenInfo>
      </TokenSection>
    </TokenContainer>
  );
};

export default TokenDisplay;
