import React, { useState } from 'react';
import { FiChevronDown, FiChevronRight, FiCopy, FiCheck, FiExternalLink } from 'react-icons/fi';
import styled from 'styled-components';
import { copyToClipboard } from '../utils/clipboard';
import { credentialManager } from '../utils/credentialManager';

const Container = styled.div`
  background: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 12px;
  margin: 2rem auto;
  max-width: 1200px;
  overflow: hidden;
`;

const Header = styled.div`
  background: #fbbf24;
  padding: 1rem 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #f59e0b;
  }
`;

const HeaderTitle = styled.h3`
  color: #92400e;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChevronIcon = styled.div`
  color: #92400e;
  font-size: 1.2rem;
  transition: transform 0.2s ease;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const Content = styled.div<{ $isExpanded: boolean }>`
  max-height: ${({ $isExpanded }) => $isExpanded ? '1000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
`;

const ContentInner = styled.div`
  padding: 1.5rem;
  background: white;
`;

const WarningText = styled.p`
  color: #78350f;
  margin: 0 0 1rem 0;
  font-weight: 500;
`;

const UrlContainer = styled.div`
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  word-break: break-all;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

const UrlText = styled.span`
  flex: 1;
  min-width: 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const ActionButton = styled.button<{ $variant?: 'copy' | 'external' }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ $variant }) => 
    $variant === 'copy' ? '#10b981' : '#3b82f6'
  };
  border-radius: 6px;
  background: ${({ $variant }) => 
    $variant === 'copy' ? '#ecfdf5' : '#eff6ff'
  };
  color: ${({ $variant }) => 
    $variant === 'copy' ? '#059669' : '#2563eb'
  };
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ $variant }) => 
      $variant === 'copy' ? '#d1fae5' : '#dbeafe'
    };
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const Instructions = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #fef3c7;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
`;

const InstructionsTitle = styled.h4`
  color: #92400e;
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  font-weight: 600;
`;

const InstructionsText = styled.p`
  color: #78350f;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
`;

interface PingOneConfigSectionProps {
  callbackUrl: string;
  flowType: string;
  showOnlyOnStep?: number;
  currentStep?: number;
}

const PingOneConfigSection: React.FC<PingOneConfigSectionProps> = ({
  callbackUrl,
  flowType,
  showOnlyOnStep,
  currentStep
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Check if we have a valid Environment ID for the console button
  const credentials = credentialManager.getAllCredentials();
  const hasValidEnvironmentId = credentials.environmentId && 
                                credentials.environmentId.trim() !== '' && 
                                credentials.environmentId !== 'test-env-123';
  
  console.log('🔍 [PingOneConfigSection] Environment ID check:', {
    environmentId: credentials.environmentId,
    hasValidEnvironmentId: hasValidEnvironmentId
  });

  // Only show on specified step (default: step 1)
  const shouldShow = showOnlyOnStep === undefined || currentStep === showOnlyOnStep;
  
  if (!shouldShow) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await copyToClipboard(callbackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleOpenInNewTab = () => {
    // Don't proceed if no valid Environment ID
    if (!hasValidEnvironmentId) {
      console.log('❌ [PingOneConfigSection] Console button clicked but no valid Environment ID available');
      return;
    }
    
    // Create proper PingOne console URL with Environment ID
    const consoleUrl = `https://console.pingone.com/index.html?env=${credentials.environmentId}`;
    console.log('🌐 [PingOneConfigSection] Opening PingOne console with Environment ID:', {
      environmentId: credentials.environmentId,
      consoleUrl: consoleUrl
    });
    window.open(consoleUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Container>
      <Header onClick={() => setIsExpanded(!isExpanded)}>
        <HeaderTitle>
          ⚠️ PingOne Configuration Required
        </HeaderTitle>
        <ChevronIcon>
          {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
        </ChevronIcon>
      </Header>
      
      <Content $isExpanded={isExpanded}>
        <ContentInner>
          <WarningText>
            <strong>IMPORTANT:</strong> Add this redirect URI to your PingOne application before testing the {flowType}:
          </WarningText>
          
          <UrlContainer>
            <UrlText>{callbackUrl}</UrlText>
            <ActionButtons>
              <ActionButton $variant="copy" onClick={handleCopy} disabled={copied}>
                {copied ? <FiCheck /> : <FiCopy />}
                {copied ? 'Copied!' : 'Copy'}
              </ActionButton>
              <ActionButton 
                $variant="external" 
                onClick={handleOpenInNewTab}
                disabled={!hasValidEnvironmentId}
                title={hasValidEnvironmentId ? 
                  `Open PingOne console for environment: ${credentials.environmentId}` : 
                  'Environment ID required to open PingOne console'
                }
                style={{
                  opacity: hasValidEnvironmentId ? 1 : 0.5,
                  cursor: hasValidEnvironmentId ? 'pointer' : 'not-allowed'
                }}
              >
                <FiExternalLink />
                {hasValidEnvironmentId ? 'PingOne Console' : 'Console (No Env ID)'}
              </ActionButton>
            </ActionButtons>
          </UrlContainer>
          
          <Instructions>
            <InstructionsTitle>PingOne Application Configuration:</InstructionsTitle>
            <InstructionsText>
              <div style={{ marginBottom: '1rem' }}>
                <strong>1. Basic Application Settings:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li><strong>Application Type:</strong> Web Application</li>
                  <li><strong>Grant Type:</strong> Authorization Code</li>
                  <li><strong>Response Type:</strong> Code</li>
                  <li><strong>Token Endpoint Auth Method:</strong> client_secret_post</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong>2. Redirect URIs:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li>Add the redirect URI above: <code>{callbackUrl}</code></li>
                  <li>Ensure exact match including protocol (https) and port</li>
                  <li>No trailing slashes or additional parameters</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong>3. Required Scopes:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li><strong>openid</strong> - Required for OpenID Connect</li>
                  <li><strong>profile</strong> - Access to user profile information</li>
                  <li><strong>email</strong> - Access to user email address</li>
                  <li>Enable any additional scopes your application needs</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong>4. Security Settings:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li><strong>PKCE:</strong> Enable PKCE (Proof Key for Code Exchange)</li>
                  <li><strong>PKCE Method:</strong> S256 (SHA256)</li>
                  <li><strong>Require PKCE:</strong> Yes (recommended for security)</li>
                  <li><strong>Token Endpoint Authentication:</strong> client_secret_post</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <strong>5. Token Settings:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li><strong>Access Token Lifetime:</strong> 3600 seconds (1 hour) recommended</li>
                  <li><strong>Refresh Token Lifetime:</strong> 30 days recommended</li>
                  <li><strong>ID Token Lifetime:</strong> 3600 seconds (1 hour) recommended</li>
                  <li><strong>Refresh Token Rotation:</strong> Enable for enhanced security</li>
                </ul>
              </div>

              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#fef3c7', 
                borderRadius: '0.5rem', 
                border: '1px solid #f59e0b',
                marginTop: '1rem'
              }}>
                <strong style={{ color: '#92400e' }}>⚠️ Important:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: '#92400e' }}>
                  <li>Save all changes in PingOne console before testing</li>
                  <li>Application must be <strong>enabled</strong> in PingOne</li>
                  <li>Environment must be in <strong>production</strong> mode for external access</li>
                  <li>Test the configuration after making changes</li>
                </ul>
              </div>

              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
                <strong>Quick Path:</strong> PingOne Console → Applications → Your App → Configuration
              </div>
            </InstructionsText>
          </Instructions>
        </ContentInner>
      </Content>
    </Container>
  );
};

export default PingOneConfigSection;
