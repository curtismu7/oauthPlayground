// Worker Token Display component for token visualization and management

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FiCopy, FiRefreshCw, FiEye, FiEyeOff, FiClock, FiShield, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { logger } from '../../utils/logger';
import { parseJWTPayload, formatScopes } from '../../utils/workerToken';
import { WorkerTokenResponse, TokenIntrospectionResponse, JWTPayload } from '../../types/workerToken';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  
  h3 {
    margin: 0;
    color: #1f2937;
    font-size: 1.125rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const TokenSection = styled.div`
  margin-bottom: 2rem;
`;

const TokenLabel = styled.label`
  display: block;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

const TokenContainer = styled.div`
  position: relative;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  word-break: break-all;
  line-height: 1.5;
`;

const TokenText = styled.span<{ showFull: boolean }>`
  color: ${props => props.showFull ? '#1f2937' : '#6b7280'};
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #2563eb;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const InfoCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 600;
`;

const ScopeList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const ScopeTag = styled.span`
  background: #dbeafe;
  color: #1e40af;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${props => props.variant === 'primary' ? `
    background-color: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #2563eb;
    }
  ` : `
    background-color: #f3f4f6;
    color: #374151;
    
    &:hover:not(:disabled) {
      background-color: #e5e7eb;
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Modal = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  
  h4 {
    margin: 0;
    color: #1f2937;
    font-size: 1.125rem;
    font-weight: 600;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  
  &:hover {
    color: #374151;
  }
`;

const JsonDisplay = styled.pre`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const StatusIndicator = styled.div<{ status: 'active' | 'expired' | 'invalid' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'active':
        return 'background: #d1fae5; color: #065f46;';
      case 'expired':
        return 'background: #fee2e2; color: #991b1b;';
      case 'invalid':
        return 'background: #fef3c7; color: #92400e;';
      default:
        return 'background: #f3f4f6; color: #374151;';
    }
  }}
`;

interface WorkerTokenDisplayProps {
  token: WorkerTokenResponse;
  introspection?: TokenIntrospectionResponse;
  showIntrospection?: boolean;
  showJWTDecode?: boolean;
  onRefresh?: () => void;
  onCopy?: (token: string) => void;
}

export const WorkerTokenDisplay: React.FC<WorkerTokenDisplayProps> = ({
  token,
  introspection,
  showIntrospection = true,
  showJWTDecode = true,
  onRefresh,
  onCopy
}) => {
  const [showFullToken, setShowFullToken] = useState(false);
  const [showJWTModal, setShowJWTModal] = useState(false);
  const [jwtPayload, setJwtPayload] = useState<JWTPayload | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Parse JWT payload if token appears to be a JWT
  useEffect(() => {
    if (token.access_token && showJWTDecode) {
      const payload = parseJWTPayload(token.access_token);
      setJwtPayload(payload);
    }
  }, [token.access_token, showJWTDecode]);

  const handleCopyToken = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(token.access_token);
      setCopySuccess(true);
      onCopy?.(token.access_token);
      
      logger.success('TOKEN-DISPLAY', 'Token copied to clipboard');
      
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      logger.error('TOKEN-DISPLAY', 'Failed to copy token', error);
    }
  }, [token.access_token, onCopy]);

  const handleCopyValue = useCallback(async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      logger.success('TOKEN-DISPLAY', `${label} copied to clipboard`);
    } catch (error) {
      logger.error('TOKEN-DISPLAY', `Failed to copy ${label}`, error);
    }
  }, []);

  const formatExpiryTime = useCallback((expiresIn: number) => {
    const hours = Math.floor(expiresIn / 3600);
    const minutes = Math.floor((expiresIn % 3600) / 60);
    const seconds = expiresIn % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  const getTokenStatus = useCallback((): 'active' | 'expired' | 'invalid' => {
    if (introspection) {
      if (!introspection.active) return 'invalid';
      if (introspection.exp && Date.now() >= introspection.exp * 1000) return 'expired';
      return 'active';
    }
    
    // Fallback to token expiry_in if no introspection
    if (token.expires_in && token.issued_at) {
      const expiryTime = token.issued_at + (token.expires_in * 1000);
      if (Date.now() >= expiryTime) return 'expired';
      return 'active';
    }
    
    return 'active';
  }, [token, introspection]);

  const getScopes = useCallback(() => {
    if (introspection?.scope) {
      return formatScopes(introspection.scope);
    }
    if (token.scope) {
      return formatScopes(token.scope);
    }
    return [];
  }, [token.scope, introspection?.scope]);

  const tokenStatus = getTokenStatus();
  const scopes = getScopes();

  return (
    <Container>
      <Header>
        <h3>
          <FiShield size={20} color="#3b82f6" />
          Worker Token
          <StatusIndicator status={tokenStatus}>
            {tokenStatus === 'active' && <FiCheck size={12} />}
            {tokenStatus === 'expired' && <FiClock size={12} />}
            {tokenStatus === 'invalid' && <FiAlertCircle size={12} />}
            {tokenStatus.toUpperCase()}
          </StatusIndicator>
        </h3>
        <ButtonGroup>
          <Button onClick={() => setShowFullToken(!showFullToken)} variant="secondary">
            {showFullToken ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            {showFullToken ? 'Hide' : 'Show'} Token
          </Button>
          {onRefresh && (
            <Button onClick={onRefresh} variant="secondary">
              <FiRefreshCw size={16} />
              Refresh
            </Button>
          )}
        </ButtonGroup>
      </Header>

      <TokenSection>
        <TokenLabel>Access Token</TokenLabel>
        <TokenContainer>
          <TokenText showFull={showFullToken}>
            {showFullToken 
              ? token.access_token 
              : `${token.access_token.substring(0, 50)}...`
            }
          </TokenText>
          <CopyButton onClick={handleCopyToken}>
            <FiCopy size={12} />
            {copySuccess ? 'Copied!' : 'Copy'}
          </CopyButton>
        </TokenContainer>
      </TokenSection>

      <InfoGrid>
        <InfoCard>
          <InfoLabel>Token Type</InfoLabel>
          <InfoValue>{token.token_type || 'Bearer'}</InfoValue>
        </InfoCard>

        <InfoCard>
          <InfoLabel>Expires In</InfoLabel>
          <InfoValue>{formatExpiryTime(token.expires_in)}</InfoValue>
        </InfoCard>

        {introspection?.client_id && (
          <InfoCard>
            <InfoLabel>Client ID</InfoLabel>
            <InfoValue>{introspection.client_id}</InfoValue>
          </InfoCard>
        )}

        {introspection?.iss && (
          <InfoCard>
            <InfoLabel>Issuer</InfoLabel>
            <InfoValue>{introspection.iss}</InfoValue>
          </InfoCard>
        )}

        {introspection?.aud && (
          <InfoCard>
            <InfoLabel>Audience</InfoLabel>
            <InfoValue>{Array.isArray(introspection.aud) ? introspection.aud.join(', ') : introspection.aud}</InfoValue>
          </InfoCard>
        )}

        {introspection?.sub && (
          <InfoCard>
            <InfoLabel>Subject</InfoLabel>
            <InfoValue>{introspection.sub}</InfoValue>
          </InfoCard>
        )}
      </InfoGrid>

      {scopes.length > 0 && (
        <InfoCard>
          <InfoLabel>Granted Scopes</InfoLabel>
          <ScopeList>
            {scopes.map(scope => (
              <ScopeTag key={scope}>{scope}</ScopeTag>
            ))}
          </ScopeList>
        </InfoCard>
      )}

      {showJWTDecode && jwtPayload && (
        <ButtonGroup>
          <Button onClick={() => setShowJWTModal(true)} variant="secondary">
            <FiEye size={16} />
            View JWT Payload
          </Button>
        </ButtonGroup>
      )}

      {showJWTModal && jwtPayload && (
        <Modal isOpen={showJWTModal}>
          <ModalContent>
            <ModalHeader>
              <h4>JWT Token Payload</h4>
              <CloseButton onClick={() => setShowJWTModal(false)}>
                ×
              </CloseButton>
            </ModalHeader>
            <JsonDisplay>
              {JSON.stringify(jwtPayload, null, 2)}
            </JsonDisplay>
            <ButtonGroup>
              <Button onClick={() => handleCopyValue(JSON.stringify(jwtPayload, null, 2), 'JWT payload')} variant="secondary">
                <FiCopy size={16} />
                Copy Payload
              </Button>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {showIntrospection && introspection && (
        <InfoCard>
          <InfoLabel>Introspection Details</InfoLabel>
          <JsonDisplay>
            {JSON.stringify(introspection, null, 2)}
          </JsonDisplay>
          <ButtonGroup>
            <Button onClick={() => handleCopyValue(JSON.stringify(introspection, null, 2), 'Introspection data')} variant="secondary">
              <FiCopy size={16} />
              Copy Introspection
            </Button>
          </ButtonGroup>
        </InfoCard>
      )}
    </Container>
  );
};

export default WorkerTokenDisplay;
