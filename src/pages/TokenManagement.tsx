import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/NewAuthContext';
import { Card, CardHeader, CardBody } from '../components/Card';
import { FiRefreshCw, FiCheckCircle, FiPlus, FiX, FiClock, FiKey, FiEye, FiTrash2, FiCopy } from 'react-icons/fi';
import styled from 'styled-components';
import PageTitle from '../components/PageTitle';
import { getOAuthTokens } from '../utils/tokenStorage';

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
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-family: monospace;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 120px;
  margin-bottom: 1rem;
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
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px solid #cbd5e1;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #1e293b !important;
  min-height: 120px;
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
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

const TokenManagement = () => {
  const [tokenString, setTokenString] = useState('');
  const [jwtHeader, setJwtHeader] = useState('');
  const [jwtPayload, setJwtPayload] = useState('');
  const [tokenStatus, setTokenStatus] = useState('none');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenSource, setTokenSource] = useState<any>(null);

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
              {jwtHeader || 'No token data'}
            </JWTContent>
          </div>

          <div>
            <h4>Payload</h4>
            <JWTContent id="jwt-payload" className="jwt-content">
              {jwtPayload || 'No token data'}
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
            <ActionButton className="secondary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
              <FiTrash2 />
              Clear History
            </ActionButton>
          </div>
        </CardHeader>
        <CardBody>
          <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
            <FiClock style={{ display: 'inline', marginRight: '0.5rem' }} />
            No token history available
          </div>
        </CardBody>
      </TokenSection>


    </Container>
  );
};

export default TokenManagement;
