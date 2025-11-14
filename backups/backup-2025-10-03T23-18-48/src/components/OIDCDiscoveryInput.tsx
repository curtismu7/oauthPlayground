// src/components/OIDCDiscoveryInput.tsx
/**
 * OIDC Discovery Input Component
 * 
 * Provides a user-friendly interface for entering issuer URLs and automatically
 * discovering OIDC endpoints. Includes validation, suggestions, and real-time
 * feedback on discovery status.
 */

import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { FiGlobe, FiCheck, FiAlertCircle, FiLoader, FiInfo, FiRefreshCw } from 'react-icons/fi';
import { oidcDiscoveryService, type DiscoveryResult, type OIDCDiscoveryDocument } from '../services/oidcDiscoveryService';

interface OIDCDiscoveryInputProps {
  onDiscoveryComplete?: (result: DiscoveryResult) => void;
  onCredentialsGenerated?: (credentials: any) => void;
  initialIssuerUrl?: string;
  className?: string;
  disabled?: boolean;
  showSuggestions?: boolean;
  autoDiscover?: boolean;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
`;

const Description = styled.p`
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const InputGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input<{ hasError?: boolean; hasSuccess?: boolean }>`
  flex: 1;
  padding: 0.75rem 2.5rem 0.75rem 2.5rem;
  border: 1px solid ${props => 
    props.hasError ? '#ef4444' : 
    props.hasSuccess ? '#10b981' : 
    '#d1d5db'
  };
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  color: #1f2937;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => 
      props.hasError ? '#ef4444' : 
      props.hasSuccess ? '#10b981' : 
      '#3b82f6'
    };
    box-shadow: 0 0 0 3px ${props => 
      props.hasError ? 'rgba(239, 68, 68, 0.1)' : 
      props.hasSuccess ? 'rgba(16, 185, 129, 0.1)' : 
      'rgba(59, 130, 246, 0.1)'
    };
  }

  &:disabled {
    background: #f9fafb;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const InputIcon = styled.div<{ hasError?: boolean; hasSuccess?: boolean; isLoading?: boolean }>`
  position: absolute;
  left: 0.75rem;
  color: ${props => {
    if (props.isLoading) return '#3b82f6';
    if (props.hasError) return '#ef4444';
    if (props.hasSuccess) return '#10b981';
    return '#6b7280';
  }};
  z-index: 1;
`;

const DiscoverButton = styled.button<{ isLoading?: boolean }>`
  position: absolute;
  right: 0.5rem;
  padding: 0.5rem;
  background: ${props => props.isLoading ? '#f3f4f6' : '#3b82f6'};
  color: ${props => props.isLoading ? '#6b7280' : 'white'};
  border: none;
  border-radius: 4px;
  cursor: ${props => props.isLoading ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const SuggestionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SuggestionsLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const SuggestionsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const SuggestionButton = styled.button`
  padding: 0.375rem 0.75rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }
`;

const StatusContainer = styled.div<{ type: 'success' | 'error' | 'info' | 'loading' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  background: ${props => {
    switch (props.type) {
      case 'success': return '#f0fdf4';
      case 'error': return '#fef2f2';
      case 'info': return '#eff6ff';
      case 'loading': return '#f8fafc';
      default: return '#f8fafc';
    }
  }};
  border: 1px solid ${props => {
    switch (props.type) {
      case 'success': return '#bbf7d0';
      case 'error': return '#fecaca';
      case 'info': return '#bfdbfe';
      case 'loading': return '#e2e8f0';
      default: return '#e2e8f0';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'success': return '#166534';
      case 'error': return '#dc2626';
      case 'info': return '#1d4ed8';
      case 'loading': return '#475569';
      default: return '#475569';
    }
  }};
`;

const StatusText = styled.div`
  font-size: 0.875rem;
  line-height: 1.4;
`;

const EndpointsList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const EndpointItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.75rem;
`;

const EndpointLabel = styled.span`
  font-weight: 500;
  color: #374151;
  min-width: 120px;
`;

const EndpointUrl = styled.span`
  color: #6b7280;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const OIDCDiscoveryInput: React.FC<OIDCDiscoveryInputProps> = ({
  onDiscoveryComplete,
  onCredentialsGenerated,
  initialIssuerUrl = '',
  className,
  disabled = false,
  showSuggestions = true,
  autoDiscover = false
}) => {
  const [issuerUrl, setIssuerUrl] = useState(initialIssuerUrl);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggestedIssuers = oidcDiscoveryService.getSuggestedIssuers();

  const handleDiscover = useCallback(async () => {
    if (!issuerUrl.trim()) {
      setError('Please enter an issuer URL');
      return;
    }

    setIsDiscovering(true);
    setError(null);
    setDiscoveryResult(null);

    try {
      const result = await oidcDiscoveryService.discover({ issuerUrl: issuerUrl.trim() });
      setDiscoveryResult(result);

      if (result.success && result.document) {
        onDiscoveryComplete?.(result);
      } else {
        setError(result.error || 'Discovery failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Discovery failed';
      setError(errorMessage);
      setDiscoveryResult({
        success: false,
        error: errorMessage
      });
    } finally {
      setIsDiscovering(false);
    }
  }, [issuerUrl, onDiscoveryComplete]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setIssuerUrl(suggestion);
    setError(null);
    setDiscoveryResult(null);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIssuerUrl(e.target.value);
    setError(null);
    if (discoveryResult) {
      setDiscoveryResult(null);
    }
  }, [discoveryResult]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isDiscovering && !disabled) {
      handleDiscover();
    }
  }, [handleDiscover, isDiscovering, disabled]);

  // Auto-discover on mount if autoDiscover is enabled and we have an initial URL
  useEffect(() => {
    if (autoDiscover && initialIssuerUrl && !discoveryResult) {
      handleDiscover();
    }
  }, [autoDiscover, initialIssuerUrl, discoveryResult, handleDiscover]);

  const renderStatus = () => {
    if (isDiscovering) {
      return (
        <StatusContainer type="loading">
          <FiLoader className="animate-spin" />
          <StatusText>Discovering OIDC endpoints...</StatusText>
        </StatusContainer>
      );
    }

    if (discoveryResult?.success) {
      return (
        <StatusContainer type="success">
          <FiCheck />
          <StatusText>
            Successfully discovered OIDC endpoints
            {discoveryResult.cached && ' (cached)'}
          </StatusText>
        </StatusContainer>
      );
    }

    if (discoveryResult && !discoveryResult.success) {
      return (
        <StatusContainer type="error">
          <FiAlertCircle />
          <StatusText>Discovery failed: {discoveryResult.error}</StatusText>
        </StatusContainer>
      );
    }

    return null;
  };

  const renderEndpoints = () => {
    if (!discoveryResult?.success || !discoveryResult.document) {
      return null;
    }

    const doc = discoveryResult.document;
    const endpoints = [
      { label: 'Authorization', url: doc.authorization_endpoint },
      { label: 'Token', url: doc.token_endpoint },
      ...(doc.userinfo_endpoint ? [{ label: 'UserInfo', url: doc.userinfo_endpoint }] : []),
      ...(doc.end_session_endpoint ? [{ label: 'End Session', url: doc.end_session_endpoint }] : []),
      ...(doc.device_authorization_endpoint ? [{ label: 'Device Auth', url: doc.device_authorization_endpoint }] : []),
      ...(doc.pushed_authorization_request_endpoint ? [{ label: 'PAR', url: doc.pushed_authorization_request_endpoint }] : [])
    ];

    return (
      <EndpointsList>
        {endpoints.map((endpoint, index) => (
          <EndpointItem key={index}>
            <EndpointLabel>{endpoint.label}:</EndpointLabel>
            <EndpointUrl>{endpoint.url}</EndpointUrl>
          </EndpointItem>
        ))}
      </EndpointsList>
    );
  };

  return (
    <Container className={className}>
      <Header>
        <FiGlobe />
        <Title>OIDC Discovery</Title>
      </Header>
      
      <Description>
        Enter your OIDC issuer URL to automatically discover all available endpoints.
        This eliminates the need to manually configure authorization, token, and other endpoints.
      </Description>

      <InputContainer>
        <Label htmlFor="issuer-url">Issuer URL</Label>
        <InputGroup>
          <InputIcon 
            hasError={!!error} 
            hasSuccess={discoveryResult?.success} 
            isLoading={isDiscovering}
          >
            {isDiscovering ? <FiLoader className="animate-spin" /> : <FiGlobe />}
          </InputIcon>
          
          <Input
            id="issuer-url"
            type="url"
            value={issuerUrl}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="https://auth.pingone.com/your-environment-id"
            hasError={!!error}
            hasSuccess={discoveryResult?.success}
            disabled={disabled || isDiscovering}
          />
          
          <DiscoverButton
            onClick={handleDiscover}
            disabled={disabled || isDiscovering || !issuerUrl.trim()}
            isLoading={isDiscovering}
            title="Discover OIDC endpoints"
          >
            {isDiscovering ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
          </DiscoverButton>
        </InputGroup>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </InputContainer>

      {showSuggestions && (
        <SuggestionsContainer>
          <SuggestionsLabel>Suggested PingOne Issuers</SuggestionsLabel>
          <SuggestionsList>
            {suggestedIssuers.map((suggestion, index) => (
              <SuggestionButton
                key={index}
                onClick={() => handleSuggestionClick(suggestion.value)}
                disabled={disabled}
                title={`${suggestion.label} - ${suggestion.region.toUpperCase()} region`}
              >
                {suggestion.label}
              </SuggestionButton>
            ))}
          </SuggestionsList>
        </SuggestionsContainer>
      )}

      {renderStatus()}
      {renderEndpoints()}
    </Container>
  );
};

export default OIDCDiscoveryInput;
