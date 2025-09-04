import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/NewAuthContext';
import { Card, CardHeader, CardBody } from '../components/Card';
import { FiRefreshCw, FiCheckCircle, FiPlus, FiX, FiClock, FiKey, FiEye, FiTrash2, FiCopy } from 'react-icons/fi';
import styled from 'styled-components';
import PageTitle from '../components/PageTitle';
import { getOAuthTokens } from '../utils/tokenStorage';
import { getTokenHistory, clearTokenHistory, removeTokenFromHistory, getFlowDisplayName, getFlowIcon, TokenHistoryEntry } from '../utils/tokenHistory';
import JSONHighlighter from '../components/JSONHighlighter';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;



const TokenSection = styled(Card)`
  margin-bottom: 2rem;
`;

const TokenStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;

  &.valid {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
  }

  &.expired {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
  }

  &.none {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
  }

  .indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;

    &.valid { background-color: #22c55e; }
    &.expired { background-color: #ef4444; }
    &.none { background-color: #9ca3af; }
  }

  .text {
    font-weight: 500;
  }
`;

const TokenDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;

  .detail {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .label {
      font-size: 0.875rem;
      font-weight: 500;
      color: ${({ theme }) => theme.colors.gray600};
    }

    .value {
      font-family: monospace;
      font-size: 0.9rem;
      color: ${({ theme }) => theme.colors.gray900};
    }
  }
`;

const TokenTextarea = styled.textarea`
  width: 100%;
  padding: 1rem;
  border: 1px solid #374151;
  border-radius: 0.375rem;
  font-family: monospace;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 120px;
  margin-bottom: 1rem;
  background-color: #1f2937;
  color: #ffffff;
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &.primary {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;

    &:hover {
      background-color: ${({ theme }) => theme.colors.primaryDark};
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};

    &:hover {
      background-color: ${({ theme }) => theme.colors.primary}10;
    }
  }

  &.danger {
    background-color: #dc2626;
    color: white;

    &:hover {
      background-color: #b91c1c;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const JWTContent = styled.pre`
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #1f2937 !important;
  min-height: 120px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
    border-radius: 0.5rem 0.5rem 0 0;
  }
  
  &:empty::before {
    content: 'No token data';
    color: #9ca3af;
    font-style: italic;
  }
`;

const HistoryEntry = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const HistoryFlow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #374151;
`;

const HistoryTimestamp = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const HistoryTokens = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
`;

const TokenBadge = styled.span<{ $type: 'access' | 'id' | 'refresh' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${({ $type }) => {
    switch ($type) {
      case 'access': return '#dbeafe';
      case 'id': return '#fef3c7';
      case 'refresh': return '#d1fae5';
      default: return '#f3f4f6';
    }
  }};
  color: ${({ $type }) => {
    switch ($type) {
      case 'access': return '#1e40af';
      case 'id': return '#92400e';
      case 'refresh': return '#065f46';
      default: return '#374151';
    }
  }};
  border: 1px solid ${({ $type }) => {
    switch ($type) {
      case 'access': return '#93c5fd';
      case 'id': return '#fcd34d';
      case 'refresh': return '#6ee7b7';
      default: return '#d1d5db';
    }
  }};
`;

const HistoryActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const HistoryButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background-color: #3b82f6;
          color: white;
          &:hover {
            background-color: #2563eb;
          }
        `;
      case 'danger':
        return `
          background-color: #dc2626;
          color: white;
          &:hover {
            background-color: #b91c1c;
          }
        `;
      default:
        return `
          background-color: #f3f4f6;
          color: #374151;
          border-color: #d1d5db;
          &:hover {
            background-color: #e5e7eb;
          }
        `;
    }
  }}
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

const TokenManagement = () => {
  const [tokenString, setTokenString] = useState('');
  const [jwtHeader, setJwtHeader] = useState('');
  const [jwtPayload, setJwtPayload] = useState('');
  const [tokenStatus, setTokenStatus] = useState('none');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenSource, setTokenSource] = useState<any>(null);
  const [tokenHistory, setTokenHistory] = useState<TokenHistoryEntry[]>([]);

  // Mock token data for demonstration
  const mockTokenData = {
    access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'refresh-token-123',
    scope: 'openid profile email'
  };

  useEffect(() => {
    // Auto-load tokens from OAuth flows on component mount
    const loadStoredTokens = () => {
      try {
        const oauthTokens = getOAuthTokens();
        
        if (oauthTokens && oauthTokens.access_token) {
          console.log('🔄 [TokenManagement] Auto-loading tokens from OAuth flows:', oauthTokens);
          setTokenString(oauthTokens.access_token);
          setTokenSource({
            source: 'OAuth Flow',
            description: `Token from ${oauthTokens.token_type || 'Bearer'} flow`,
            timestamp: oauthTokens.timestamp ? new Date(oauthTokens.timestamp).toLocaleString() : new Date().toLocaleString()
          });
          
          // Auto-decode the token
          setTimeout(() => decodeJWT(oauthTokens.access_token), 100);
          
          // Update token status based on expiration
          if (oauthTokens.timestamp && oauthTokens.expires_in) {
            const now = Date.now();
            const expiresAt = oauthTokens.timestamp + (oauthTokens.expires_in * 1000);
            setTokenStatus(now >= expiresAt ? 'expired' : 'valid');
          } else {
            setTokenStatus('valid');
          }
        } else {
          // Fallback to old storage method for backward compatibility
          const storedToken = localStorage.getItem('pingone_token_cache');
          if (storedToken) {
            const tokenData = JSON.parse(storedToken);
            setTokenString(tokenData.token || '');
            setTokenSource({
              source: 'Legacy Storage',
              description: 'Token loaded from legacy browser storage',
              timestamp: new Date().toLocaleString()
            });
            setTimeout(() => decodeJWT(tokenData.token), 100);
          }
        }
      } catch (error) {
        console.error('❌ [TokenManagement] Error loading stored tokens:', error);
      }
    };
    
    loadStoredTokens();
    
    // Load token history and add current tokens if available
    const history = getTokenHistory();
    const currentTokens = getOAuthTokens();
    
    // Create a current token entry if we have tokens but no history
    if (currentTokens && currentTokens.access_token && history.entries.length === 0) {
      const currentEntry: TokenHistoryEntry = {
        id: 'current_tokens',
        flowType: 'authorization_code', // Default, could be enhanced to detect actual flow
        flowName: 'Current OAuth Flow',
        tokens: {
          access_token: currentTokens.access_token,
          id_token: currentTokens.id_token,
          refresh_token: currentTokens.refresh_token,
          token_type: currentTokens.token_type,
          expires_in: currentTokens.expires_in,
          scope: currentTokens.scope
        },
        timestamp: currentTokens.timestamp || Date.now(),
        timestampFormatted: new Date(currentTokens.timestamp || Date.now()).toLocaleString(),
        tokenCount: Object.keys(currentTokens).filter(key => 
          key.includes('token') && currentTokens[key]
        ).length,
        hasAccessToken: !!currentTokens.access_token,
        hasIdToken: !!currentTokens.id_token,
        hasRefreshToken: !!currentTokens.refresh_token
      };
      
      // Add current tokens to the beginning of history
      history.entries.unshift(currentEntry);
    }
    
    setTokenHistory(history.entries);
  }, []);

  const decodeJWT = (token: string) => {
    try {
      if (!token || token.trim() === '') {
        throw new Error('Please enter a JWT token');
      }

      console.log('🔍 [TokenManagement] Attempting to decode token:', token.substring(0, 50) + '...');

      const parts = token.split('.');
      console.log('🔍 [TokenManagement] Token parts count:', parts.length);
      
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format. JWT should have 3 parts separated by dots.');
      }

      // Helper function to decode JWT parts with proper base64 handling
      const parseJwtPart = (part: string) => {
        try {
          // Add padding if needed
          let base64 = part.replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          
          // Use modern base64 decoding
          let decoded;
          if (typeof window !== 'undefined' && window.btoa) {
            // Browser environment
            decoded = atob(base64);
          } else {
            // Node.js environment or fallback
            decoded = Buffer.from(base64, 'base64').toString('binary');
          }
          
          // Convert to UTF-8 string
          const jsonPayload = decodeURIComponent(
            Array.from(decoded, (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
          );
          
          const parsed = JSON.parse(jsonPayload);
          console.log('✅ [TokenManagement] Successfully parsed JWT part:', { part: part.substring(0, 20) + '...', result: parsed });
          return parsed;
        } catch (e) {
          console.error('❌ [TokenManagement] Error parsing JWT part:', e, 'Part:', part.substring(0, 20) + '...');
          throw e;
        }
      };

      // Decode header
      console.log('🔍 [TokenManagement] Decoding header part:', parts[0].substring(0, 20) + '...');
      const header = parseJwtPart(parts[0]);
      setJwtHeader(JSON.stringify(header, null, 2));

      // Decode payload
      console.log('🔍 [TokenManagement] Decoding payload part:', parts[1].substring(0, 20) + '...');
      const payload = parseJwtPart(parts[1]);
      setJwtPayload(JSON.stringify(payload, null, 2));

      console.log('✅ [TokenManagement] Successfully decoded JWT:', { header, payload });
      setTokenStatus('valid');
    } catch (error) {
      console.error('❌ [TokenManagement] JWT decode error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setJwtHeader('Error: ' + errorMessage);
      setJwtPayload('Error: ' + errorMessage);
      setTokenStatus('invalid');
    }
  };

  const handleTokenInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTokenString(e.target.value);
  };

  const handleDecodeClick = () => {
    decodeJWT(tokenString);
  };

  const handleGetToken = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to get token
      setTimeout(() => {
        setTokenString(mockTokenData.access_token);
        setTokenSource({
          source: 'API Call',
          description: 'Token obtained from mock API',
          timestamp: new Date().toLocaleString()
        });
        decodeJWT(mockTokenData.access_token);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error getting token:', error);
      setIsLoading(false);
    }
  };

  const handleCopyToken = async () => {
    if (tokenString) {
      try {
        await navigator.clipboard.writeText(tokenString);
        alert('Token copied to clipboard!');
      } catch (error) {
        console.error('Error copying token:', error);
      }
    }
  };

  const handleRefreshToken = async () => {
    setIsLoading(true);
    try {
      // Simulate token refresh
      setTimeout(() => {
        const newToken = mockTokenData.access_token.replace('1234567890', Date.now().toString().slice(-10));
        setTokenString(newToken);
        setTokenSource({
          source: 'Token Refresh',
          description: 'Token refreshed from mock API',
          timestamp: new Date().toLocaleString()
        });
        decodeJWT(newToken);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error refreshing token:', error);
      setIsLoading(false);
    }
  };

  const handleValidateToken = async () => {
    if (!tokenString) {
      alert('No token to validate');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate token validation
      setTimeout(() => {
        setTokenStatus('valid');
        alert('Token is valid!');
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error validating token:', error);
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      // Simulate connection test
      setTimeout(() => {
        alert('Connection test successful!');
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error testing connection:', error);
      setIsLoading(false);
    }
  };

  const handleRevokeToken = async () => {
    if (confirm('Are you sure you want to revoke this token?')) {
      setIsLoading(true);
      try {
        // Simulate token revocation
        setTimeout(() => {
          setTokenString('');
          setJwtHeader('');
          setJwtPayload('');
          setTokenStatus('none');
          alert('Token revoked successfully!');
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error revoking token:', error);
        setIsLoading(false);
      }
    }
  };

  const handleClearToken = () => {
    if (confirm('Are you sure you want to clear the token?')) {
      setTokenString('');
      setJwtHeader('');
      setJwtPayload('');
      setTokenStatus('none');
    }
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all token history?')) {
      clearTokenHistory();
      setTokenHistory([]);
      alert('Token history cleared successfully!');
    }
  };

  const handleRefreshHistory = () => {
    // Reload token history and current tokens
    const history = getTokenHistory();
    const currentTokens = getOAuthTokens();
    
    // Create a current token entry if we have tokens but no history
    if (currentTokens && currentTokens.access_token && history.entries.length === 0) {
      const currentEntry: TokenHistoryEntry = {
        id: 'current_tokens',
        flowType: 'authorization_code', // Default, could be enhanced to detect actual flow
        flowName: 'Current OAuth Flow',
        tokens: {
          access_token: currentTokens.access_token,
          id_token: currentTokens.id_token,
          refresh_token: currentTokens.refresh_token,
          token_type: currentTokens.token_type,
          expires_in: currentTokens.expires_in,
          scope: currentTokens.scope
        },
        timestamp: currentTokens.timestamp || Date.now(),
        timestampFormatted: new Date(currentTokens.timestamp || Date.now()).toLocaleString(),
        tokenCount: Object.keys(currentTokens).filter(key => 
          key.includes('token') && currentTokens[key]
        ).length,
        hasAccessToken: !!currentTokens.access_token,
        hasIdToken: !!currentTokens.id_token,
        hasRefreshToken: !!currentTokens.refresh_token
      };
      
      // Add current tokens to the beginning of history
      history.entries.unshift(currentEntry);
    }
    
    setTokenHistory(history.entries);
  };

  const handleRemoveHistoryEntry = (entryId: string) => {
    if (confirm('Are you sure you want to remove this token from history?')) {
      removeTokenFromHistory(entryId);
      setTokenHistory(prev => prev.filter(entry => entry.id !== entryId));
    }
  };

  const handleLoadTokenFromHistory = (entry: TokenHistoryEntry) => {
    if (entry.tokens.access_token) {
      setTokenString(entry.tokens.access_token);
      setTokenSource({
        source: 'Token History',
        description: `Token from ${entry.flowName} (${entry.timestampFormatted})`,
        timestamp: entry.timestampFormatted
      });
      setTimeout(() => decodeJWT(entry.tokens.access_token), 100);
    }
  };

  return (
    <Container>
      <PageTitle 
        title={
          <>
            <FiKey />
            Token Management
          </>
        }
        subtitle="Monitor and manage PingOne authentication tokens"
      />

      {/* Token Status Section */}
      <TokenSection>
        <CardHeader>
          <h2>Token Status</h2>
        </CardHeader>
        <CardBody>
          <TokenStatus className={tokenStatus}>
            <div className={`indicator ${tokenStatus}`}></div>
            <span className="text">
              {tokenStatus === 'valid' && 'Token is valid'}
              {tokenStatus === 'expired' && 'Token has expired'}
              {tokenStatus === 'invalid' && 'Token is invalid'}
              {tokenStatus === 'none' && 'No token available'}
            </span>
          </TokenStatus>

          <TokenDetails>
            <div className="detail">
              <div className="label">Token Type</div>
              <div className="value">Bearer</div>
            </div>
            <div className="detail">
              <div className="label">Expires In</div>
              <div className="value">1 hour</div>
            </div>
            <div className="detail">
              <div className="label">Scope</div>
              <div className="value">openid profile email</div>
            </div>
          </TokenDetails>
        </CardBody>
      </TokenSection>

      {/* Raw Token Section */}
      <TokenSection>
        <CardHeader>
          <h2>Raw Token</h2>
        </CardHeader>
        <CardBody>
          <TokenTextarea
            id="token-string"
            value={tokenString}
            onChange={handleTokenInput}
            placeholder="Paste your JWT token here or get a token using the 'Get Token' button"
          />

          <ButtonGroup>
            <ActionButton
              id="get-token-btn"
              className="primary"
              onClick={handleGetToken}
              disabled={isLoading}
            >
              <FiKey />
              {isLoading ? 'Getting...' : 'Get Token'}
            </ActionButton>

            <ActionButton
              id="copy-token-btn"
              className="secondary"
              onClick={handleCopyToken}
              disabled={!tokenString || isLoading}
            >
              <FiCopy />
              Copy Token
            </ActionButton>

            <ActionButton
              id="decode-token-btn"
              className="primary"
              onClick={handleDecodeClick}
              disabled={!tokenString || isLoading}
            >
              <FiEye />
              Decode JWT
            </ActionButton>

            <ActionButton
              className="secondary"
              onClick={() => {
                const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
                setTokenString(sampleToken);
                console.log('🧪 [TokenManagement] Loaded sample token for testing');
              }}
            >
              🧪 Load Sample Token
            </ActionButton>
          </ButtonGroup>
        </CardBody>
      </TokenSection>

      {/* Decoded Token Section */}
      <TokenSection>
        <CardHeader>
          <h2>Decoded Token</h2>
        </CardHeader>
        <CardBody>
          <div style={{ marginBottom: '1rem' }}>
            <h4>Header</h4>
            <JWTContent id="jwt-header" className="jwt-content">
              {jwtHeader ? <JSONHighlighter jsonString={jwtHeader} /> : 'No token data'}
            </JWTContent>
          </div>

          <div>
            <h4>Payload</h4>
            <JWTContent id="jwt-payload" className="jwt-content">
              {jwtPayload ? <JSONHighlighter jsonString={jwtPayload} /> : 'No token data'}
            </JWTContent>
          </div>
        </CardBody>
      </TokenSection>

      {/* Token Controls Section */}
      <TokenSection>
        <CardHeader>
          <h2>Token Actions</h2>
        </CardHeader>
        <CardBody>
          <ButtonGroup>
            <ActionButton
              id="refresh-token-btn"
              className="primary"
              onClick={handleRefreshToken}
              disabled={isLoading}
            >
              <FiRefreshCw />
              {isLoading ? 'Refreshing...' : 'Refresh Token'}
            </ActionButton>

            <ActionButton
              id="validate-token-btn"
              className="secondary"
              onClick={handleValidateToken}
              disabled={!tokenString || isLoading}
            >
              <FiCheckCircle />
              Validate Token
            </ActionButton>

            <ActionButton
              id="test-connection-btn"
              className="secondary"
              onClick={handleTestConnection}
              disabled={isLoading}
            >
              <FiPlus />
              Test Connection
            </ActionButton>

            <ActionButton
              id="revoke-token-btn"
              className="danger"
              onClick={handleRevokeToken}
              disabled={!tokenString || isLoading}
            >
              <FiX />
              Revoke Token
            </ActionButton>

            <ActionButton
              id="clear-token-btn"
              className="danger"
              onClick={handleClearToken}
              disabled={!tokenString || isLoading}
            >
              <FiTrash2 />
              Clear Token
            </ActionButton>
          </ButtonGroup>
        </CardBody>
      </TokenSection>

      {/* Token History Section */}
      <TokenSection>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Token History</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <ActionButton 
                className="secondary" 
                style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                onClick={handleRefreshHistory}
              >
                <FiRefreshCw />
                Refresh
              </ActionButton>
              {tokenHistory.length > 0 && (
                <ActionButton 
                  className="secondary" 
                  style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
                  onClick={handleClearHistory}
                >
                  <FiTrash2 />
                  Clear History
                </ActionButton>
              )}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {tokenHistory.length === 0 ? (
            <div style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
              <FiClock style={{ display: 'inline', marginRight: '0.5rem', fontSize: '1.5rem' }} />
              <div style={{ marginTop: '0.5rem' }}>No token history available</div>
              <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Complete OAuth flows to see token history here
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                {tokenHistory.length} token{tokenHistory.length !== 1 ? 's' : ''} received from OAuth flows
              </div>
              {tokenHistory.map((entry) => (
                <HistoryEntry 
                  key={entry.id}
                  onClick={() => handleLoadTokenFromHistory(entry)}
                >
                  <HistoryHeader>
                    <HistoryFlow>
                      <span>{getFlowIcon(entry.flowType)}</span>
                      {entry.flowName}
                    </HistoryFlow>
                    <HistoryTimestamp>
                      {entry.timestampFormatted}
                    </HistoryTimestamp>
                  </HistoryHeader>
                  
                  <HistoryTokens>
                    {entry.hasAccessToken && (
                      <TokenBadge $type="access">
                        🔐 Access Token
                      </TokenBadge>
                    )}
                    {entry.hasIdToken && (
                      <TokenBadge $type="id">
                        🎫 ID Token
                      </TokenBadge>
                    )}
                    {entry.hasRefreshToken && (
                      <TokenBadge $type="refresh">
                        🔄 Refresh Token
                      </TokenBadge>
                    )}
                  </HistoryTokens>
                  
                  {/* OIDC Developer Information */}
                  <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.75rem', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '0.375rem',
                    fontSize: '0.8rem',
                    color: '#4b5563'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <strong>Flow Type:</strong> {entry.flowType}
                      </div>
                      <div>
                        <strong>Token Type:</strong> {entry.tokens.token_type || 'Bearer'}
                      </div>
                      <div>
                        <strong>Scope:</strong> {entry.tokens.scope || 'Not specified'}
                      </div>
                      <div>
                        <strong>Expires In:</strong> {entry.tokens.expires_in ? `${entry.tokens.expires_in}s` : 'Not specified'}
                      </div>
                    </div>
                    {entry.tokens.access_token && (
                      <div style={{ marginTop: '0.5rem', wordBreak: 'break-all' }}>
                        <strong>Access Token:</strong> {entry.tokens.access_token.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                  
                  <HistoryActions>
                    <HistoryButton 
                      $variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadTokenFromHistory(entry);
                      }}
                    >
                      <FiEye />
                      Load Token
                    </HistoryButton>
                    <HistoryButton 
                      $variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveHistoryEntry(entry.id);
                      }}
                    >
                      <FiTrash2 />
                      Remove
                    </HistoryButton>
                  </HistoryActions>
                </HistoryEntry>
              ))}
            </div>
          )}
        </CardBody>
      </TokenSection>


    </Container>
  );
};

export default TokenManagement;
