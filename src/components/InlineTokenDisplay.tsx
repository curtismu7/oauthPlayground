// src/components/InlineTokenDisplay.tsx
// Inline Token Display Component with In-Place Decoding

import React, { useState } from 'react';
import styled from 'styled-components';
import { FiCopy, FiEye, FiEyeOff, FiKey, FiShield, FiExternalLink } from 'react-icons/fi';
import { v4ToastManager } from '../utils/v4ToastMessages';
import TokenDisplayService, { type DecodedJWT, type TokenInfo } from '../services/tokenDisplayService';

interface InlineTokenDisplayProps {
  label: string;
  token?: string;
  tokenType: 'access' | 'id' | 'refresh';
  isOIDC?: boolean;
  flowKey?: string;
  className?: string;
  defaultMasked?: boolean;
  allowMaskToggle?: boolean;
}

const TokenContainer = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  overflow: hidden;
  max-width: 100%;
  width: 100%;
`;

const TokenHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
`;

const TokenLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
`;

const TokenBadge = styled.span<{ $type: 'access' | 'id' | 'refresh' }>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${({ $type }) => {
    switch ($type) {
      case 'access': return '#dbeafe';
      case 'id': return '#dcfce7';
      case 'refresh': return '#fef3c7';
      default: return '#f3f4f6';
    }
  }};
  color: ${({ $type }) => {
    switch ($type) {
      case 'access': return '#1e40af';
      case 'id': return '#166534';
      case 'refresh': return '#92400e';
      default: return '#374151';
    }
  }};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'management' }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  border: 1px solid ${({ $variant }) => {
    switch ($variant) {
      case 'primary': return '#3b82f6';
      case 'management': return '#059669';
      default: return '#d1d5db';
    }
  }};
  background: ${({ $variant }) => {
    switch ($variant) {
      case 'primary': return '#3b82f6';
      case 'management': return '#059669';
      default: return 'white';
    }
  }};
  color: ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
      case 'management': return 'white';
      default: return '#374151';
    }
  }};
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $variant }) => {
      switch ($variant) {
        case 'primary': return '#2563eb';
        case 'management': return '#047857';
        default: return '#f9fafb';
      }
    }};
    border-color: ${({ $variant }) => {
      switch ($variant) {
        case 'primary': return '#2563eb';
        case 'management': return '#047857';
        default: return '#9ca3af';
      }
    }};
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TokenContent = styled.div`
  padding: 1rem;
`;

const TokenPreview = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
  background: #f0fdf4;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-bottom: 1rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: anywhere;
  max-width: 100%;
`;

const DecodedContent = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: anywhere;
  max-width: 100%;
`;

const OpaqueMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
  font-size: 0.875rem;
`;

export const InlineTokenDisplay: React.FC<InlineTokenDisplayProps> = ({
  label,
  token = '',
  tokenType,
  isOIDC = false,
  flowKey = '',
  className,
  defaultMasked = false,
  allowMaskToggle = true
}) => {
  const [masked, setMasked] = useState(defaultMasked);
  const [showDecoded, setShowDecoded] = useState(false);
  const [decodedContent, setDecodedContent] = useState<DecodedJWT | null>(null);
  const [isOpaque, setIsOpaque] = useState(false);

  const tokenInfo = TokenDisplayService.getTokenInfo(token, tokenType, flowKey);

  const getTokenIcon = () => {
    switch (tokenType) {
      case 'access': return <FiKey size={16} />;
      case 'id': return <FiShield size={16} />;
      case 'refresh': return <FiShield size={16} />;
      default: return <FiShield size={16} />;
    }
  };

  const handleToggleMask = () => {
    setMasked(!masked);
  };

  const handleToggleDecode = () => {
    if (!showDecoded) {
      try {
        const decoded = TokenDisplayService.decodeJWT(token);
        if (decoded) {
          setDecodedContent(decoded);
          setIsOpaque(false);
        } else {
          setIsOpaque(true);
        }
      } catch (error) {
        setIsOpaque(true);
      }
    }
    setShowDecoded(!showDecoded);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      v4ToastManager.showSuccess('Token copied to clipboard');
    } catch (error) {
      v4ToastManager.showError('Failed to copy token');
    }
  };

  const handleSendToTokenManagement = () => {
    const tokenManagementUrl = `/token-management?token=${encodeURIComponent(token)}&type=${tokenType}`;
    window.open(tokenManagementUrl, '_blank');
  };

  const preview = masked ? TokenDisplayService.maskToken(token) : token;
  const displayLabel = label || TokenDisplayService.getTokenLabel(tokenType, isOIDC);

  return (
    <TokenContainer className={className}>
      <TokenHeader>
        <TokenLabel>
          {getTokenIcon()}
          {displayLabel}
          <TokenBadge $type={tokenType}>
            {tokenType.toUpperCase()}
          </TokenBadge>
        </TokenLabel>
        <ActionButtons>
          {allowMaskToggle && (
            <ActionButton
              onClick={handleToggleMask}
              title={masked ? 'Show token' : 'Hide token'}
            >
              {masked ? <FiEye size={14} /> : <FiEyeOff size={14} />}
              {masked ? 'Show' : 'Hide'}
            </ActionButton>
          )}
          <ActionButton
            onClick={handleToggleDecode}
            title={showDecoded ? 'Hide decoded content' : 'Show decoded content'}
          >
            <FiKey size={14} />
            {showDecoded ? 'Hide Decode' : 'Decode'}
          </ActionButton>
          <ActionButton
            onClick={handleCopy}
            title="Copy token"
            $variant="primary"
            disabled={!token}
          >
            <FiCopy size={14} />
            Copy
          </ActionButton>
          <ActionButton
            onClick={handleSendToTokenManagement}
            title="Send to Token Management"
            $variant="management"
            disabled={!token}
          >
            <FiExternalLink size={14} />
            Token Management
          </ActionButton>
        </ActionButtons>
      </TokenHeader>
      <TokenContent>
        <TokenPreview>
          {preview}
        </TokenPreview>
        
        {showDecoded && (
          <div>
            {isOpaque ? (
              <OpaqueMessage>
                <FiShield size={20} />
                {TokenDisplayService.getOpaqueTokenMessage(tokenType)}
              </OpaqueMessage>
            ) : decodedContent ? (
              <div>
                <h4 style={{ marginBottom: '0.5rem', color: '#374151', fontSize: '0.875rem' }}>Header:</h4>
                <DecodedContent>
                  {JSON.stringify(decodedContent.header, null, 2)}
                </DecodedContent>
                
                <h4 style={{ marginBottom: '0.5rem', marginTop: '1rem', color: '#374151', fontSize: '0.875rem' }}>Payload:</h4>
                <DecodedContent>
                  {JSON.stringify(decodedContent.payload, null, 2)}
                </DecodedContent>
              </div>
            ) : (
              <OpaqueMessage>
                <FiShield size={20} />
                Unable to decode token content.
              </OpaqueMessage>
            )}
          </div>
        )}
      </TokenContent>
    </TokenContainer>
  );
};

export default InlineTokenDisplay;
