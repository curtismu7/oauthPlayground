// src/components/LogoutUriReference.tsx
import React, { useState } from 'react';
import { FiX, FiCopy, FiCheck, FiLogOut, FiAlertTriangle, FiBook, FiGlobe } from 'react-icons/fi';
import styled from 'styled-components';
import { callbackUriService } from '../services/callbackUriService';

interface LogoutUriReferenceProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  margin: 1rem;
`;

const ModalHeader = styled.div`
  padding: 1.5rem 1.5rem 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  
  &:hover {
    background-color: #f3f4f6;
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const IntroSection = styled.div`
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
`;

const IntroTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #0369a1;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const IntroText = styled.p`
  color: #0369a1;
  margin: 0;
  line-height: 1.5;
`;

const FlowGrid = styled.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const FlowCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background: white;
`;

const FlowHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const FlowIcon = styled.span`
  font-size: 1.25rem;
  margin-right: 0.5rem;
`;

const FlowName = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const UriContainer = styled.div`
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 0.75rem;
`;

const UriCode = styled.code`
  color: #1e40af;
  background-color: #dbeafe;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  display: block;
  word-break: break-all;
  margin-bottom: 0.5rem;
`;

const CopyButton = styled.button<{ copied?: boolean }>`
  background-color: ${props => props.copied ? '#10b981' : '#3b82f6'};
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.copied ? '#059669' : '#2563eb'};
  }
`;

const FlowDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
`;

const PingOneSection = styled.div`
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
`;

const PingOneTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #92400e;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PingOneText = styled.p`
  color: #92400e;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
`;

const UriList = styled.div`
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  padding: 0.75rem;
  border-radius: 0.375rem;
`;

const UriListItem = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #dc2626;
  margin-bottom: 0.25rem;
  word-break: break-all;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const WarningSection = styled.div`
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
`;

const WarningTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #dc2626;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const WarningText = styled.p`
  color: #dc2626;
  margin: 0;
  line-height: 1.5;
`;

const LogoutUriReference: React.FC<LogoutUriReferenceProps> = ({ isOpen, onClose }) => {
  const [copiedUris, setCopiedUris] = useState<Set<string>>(new Set());

  const flows = [
    'authorization_code',
    'implicit', 
    'hybrid',
    'device',
    'client_credentials',
    'pingone_auth',
    'dashboard'
  ] as const;

  const handleCopyUri = async (uri: string) => {
    try {
      await navigator.clipboard.writeText(uri);
      setCopiedUris(prev => new Set(prev).add(uri));
      setTimeout(() => {
        setCopiedUris(prev => {
          const newSet = new Set(prev);
          newSet.delete(uri);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy URI:', err);
    }
  };

  const getAllLogoutUris = () => {
    return flows.map(flow => callbackUriService.getRedirectUriForFlow(flow).logoutUri);
  };

  const handleCopyAllUris = async () => {
    const allUris = getAllLogoutUris().join('\n');
    try {
      await navigator.clipboard.writeText(allUris);
    } catch (err) {
      console.error('Failed to copy all URIs:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FiLogOut />
            Logout URIs Reference
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <IntroSection>
            <IntroTitle>
              <FiGlobe />
              Why Flow-Specific Logout URIs?
            </IntroTitle>
            <IntroText>
              Each OAuth/OIDC flow requires its own unique logout URI to ensure proper logout handling, 
              prevent cross-flow conflicts, and maintain security isolation. This prevents logout from 
              one flow from interfering with another flow's state.
            </IntroText>
          </IntroSection>

          <FlowGrid>
            {flows.map(flow => {
              const uriInfo = callbackUriService.getRedirectUriForFlow(flow);
              const isCopied = copiedUris.has(uriInfo.logoutUri);
              
              return (
                <FlowCard key={flow}>
                  <FlowHeader>
                    <FlowIcon>🚪</FlowIcon>
                    <FlowName>{uriInfo.description}</FlowName>
                  </FlowHeader>
                  
                  <UriContainer>
                    <UriCode>{uriInfo.logoutUri}</UriCode>
                    <CopyButton 
                      copied={isCopied}
                      onClick={() => handleCopyUri(uriInfo.logoutUri)}
                    >
                      {isCopied ? <FiCheck /> : <FiCopy />}
                      {isCopied ? 'Copied!' : 'Copy URI'}
                    </CopyButton>
                  </UriContainer>
                  
                  <FlowDescription>{uriInfo.logoutNote}</FlowDescription>
                </FlowCard>
              );
            })}
          </FlowGrid>

          <PingOneSection>
            <PingOneTitle>
              <FiAlertTriangle />
              PingOne Application Configuration
            </PingOneTitle>
            <PingOneText>
              Add these URIs to your PingOne application's <strong>"Post Logout Redirect URIs"</strong> list:
            </PingOneText>
            <UriList>
              {getAllLogoutUris().map((uri, index) => (
                <UriListItem key={index}>{uri}</UriListItem>
              ))}
            </UriList>
            <CopyButton onClick={handleCopyAllUris} style={{ marginTop: '0.75rem' }}>
              <FiCopy />
              Copy All URIs
            </CopyButton>
          </PingOneSection>

          <WarningSection>
            <WarningTitle>
              <FiAlertTriangle />
              Important Security Notes
            </WarningTitle>
            <WarningText>
              • All logout URIs must use HTTPS in production<br/>
              • URIs must match exactly (no wildcards)<br/>
              • Each flow should use its own unique logout URI<br/>
              • Remove unused logout URIs from your PingOne applications<br/>
              • Regularly audit your logout URI configurations
            </WarningText>
          </WarningSection>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default LogoutUriReference;
