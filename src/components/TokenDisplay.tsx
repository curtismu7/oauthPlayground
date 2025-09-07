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
    [key: string]: unknown;
  };
}

const TokenContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1rem;
`;

const TokenHeaderMain = styled.div`
  text-align: center;
  margin-bottom: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

  h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  p {
    margin: 0.5rem 0 0 0;
    opacity: 0.9;
    font-size: 0.9rem;
  }
`;

const TokenSection = styled.div<{ $type?: 'access' | 'id' | 'refresh' | 'info' }>`
  background: ${({ $type }) => {
    switch ($type) {
      case 'access':
        return 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)';
      case 'id':
        return 'linear-gradient(135deg, #fef3c7 0%, #fefce8 100%)';
      case 'refresh':
        return 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)';
      case 'info':
        return 'linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%)';
      default:
        return 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)';
    }
  }};
  border: 2px solid ${({ $type }) => {
    switch ($type) {
      case 'access':
        return '#3b82f6';
      case 'id':
        return '#f59e0b';
      case 'refresh':
        return '#10b981';
      case 'info':
        return '#8b5cf6';
      default:
        return '#e2e8f0';
    }
  }};
  border-radius: 0.75rem;
  padding: 1.5rem;
  position: relative;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;

const TokenHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.6);
  position: relative;
`;

const TokenTypeLabel = styled.div<{ $type?: 'access' | 'id' | 'refresh' | 'info' }>`
  position: absolute;
  top: -0.75rem;
  right: 0;
  background: ${({ $type }) => {
    switch ($type) {
      case 'access':
        return '#3b82f6';
      case 'id':
        return '#f59e0b';
      case 'refresh':
        return '#10b981';
      case 'info':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  }};
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
`;

const TokenLabel = styled.h4<{ $type?: 'access' | 'id' | 'refresh' | 'info' }>`
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: ${({ $type }) => {
    switch ($type) {
      case 'access':
        return '#1e40af';
      case 'id':
        return '#d97706';
      case 'refresh':
        return '#059669';
      case 'info':
        return '#7c3aed';
      default:
        return '#374151';
    }
  }};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${({ $type }) => {
      switch ($type) {
        case 'access':
          return '#3b82f6';
        case 'id':
          return '#f59e0b';
        case 'refresh':
          return '#10b981';
        case 'info':
          return '#8b5cf6';
        default:
          return '#6b7280';
      }
    }};
    display: inline-block;
  }
`;

const TokenActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  background: ${({ $variant }) => $variant === 'primary' ? '#3b82f6' : '#6b7280'};
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);

  &:hover {
    background: ${({ $variant }) => $variant === 'primary' ? '#2563eb' : '#4b5563'};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const TokenValue = styled.pre<{ $isMasked?: boolean; $type?: 'access' | 'id' | 'refresh' }>`
  margin: 0;
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  color: #000000;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid ${({ $type }) => {
    switch ($type) {
      case 'access':
        return '#93c5fd';
      case 'id':
        return '#fcd34d';
      case 'refresh':
        return '#6ee7b7';
      default:
        return '#d1d5db';
    }
  }};
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-top: 0.5rem;
  overflow-x: auto;
  word-break: break-all;
  white-space: pre-wrap;
  text-indent: 0;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  position: relative;
  min-height: 4rem;
  
  /* Ensure text is always visible and readable */
  &, & *, &::before, &::after {
    color: #000000;
    background-color: transparent;
  }
  
  /* Override any inherited styles */
  * {
    color: #000000;
    background-color: transparent;
  }
`;

const TokenInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 0.5rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
    border-color: rgba(139, 92, 246, 0.4);
    transform: translateX(4px);
  }
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #7c3aed;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const InfoValue = styled.span`
  color: #1f2937;
  font-size: 0.9rem;
  font-weight: 500;
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  background: rgba(139, 92, 246, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
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
    
    // Determine the type for styling
    const getType = (key: string): 'access' | 'id' | 'refresh' | 'info' => {
      if (key === 'access_token') return 'access';
      if (key === 'id_token') return 'id';
      if (key === 'refresh_token') return 'refresh';
      return 'info';
    };

    const type = getType(key);

    return (
      <TokenSection key={key} $type={type}>
        <TokenHeader>
          <TokenLabel $type={type}>{label}</TokenLabel>
          <TokenTypeLabel $type={type}>JWT Token</TokenTypeLabel>
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
        <TokenValue $isMasked={isToken && isMasked} $type={type}>
          {displayValue}
        </TokenValue>
      </TokenSection>
    );
  };

  return (
    <TokenContainer>
      <TokenHeaderMain>
        <h3>🔐 OAuth Tokens Received</h3>
        <p>Your authentication tokens are displayed below with enhanced security features</p>
      </TokenHeaderMain>
      
      {tokens.access_token && renderTokenSection('access_token', 'Access Token', tokens.access_token, true)}
      {tokens.id_token && renderTokenSection('id_token', 'ID Token', tokens.id_token, true)}
      {tokens.refresh_token && renderTokenSection('refresh_token', 'Refresh Token', tokens.refresh_token, true)}
      
      <TokenSection $type="info">
        <TokenLabel $type="info">Token Information</TokenLabel>
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
