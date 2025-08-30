import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Card, CardHeader, CardBody } from '../components/Card';
import { FiRefreshCw, FiCheckCircle, FiPlus, FiX, FiClock, FiKey, FiEye, FiTrash2, FiCopy, FiShield } from 'react-icons/fi';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.1rem;
    line-height: 1.6;
  }
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
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const TokenManagement = () => {
  const [tokenString, setTokenString] = useState('');
  const [jwtHeader, setJwtHeader] = useState('');
  const [jwtPayload, setJwtPayload] = useState('');
  const [tokenStatus, setTokenStatus] = useState('none');
  const [isLoading, setIsLoading] = useState(false);

  // Mock token data for demonstration
  const mockTokenData = {
    access_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'refresh-token-123',
    scope: 'openid profile email'
  };

  useEffect(() => {
    // Check for stored token on component mount
    const storedToken = localStorage.getItem('pingone_token_cache');
    if (storedToken) {
      try {
        const tokenData = JSON.parse(storedToken);
        setTokenString(tokenData.token || '');
        // Auto-decode if token exists
        setTimeout(() => decodeJWT(tokenData.token), 100);
      } catch (error) {
        console.error('Error loading stored token:', error);
      }
    }
  }, []);

  const decodeJWT = (token: string) => {
    try {
      if (!token || token.trim() === '') {
        throw new Error('Please enter a JWT token');
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format. JWT should have 3 parts separated by dots.');
      }

      // Decode header
      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      setJwtHeader(JSON.stringify(header, null, 2));

      // Decode payload
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      setJwtPayload(JSON.stringify(payload, null, 2));

      setTokenStatus('valid');
    } catch (error) {
      console.error('JWT decode error:', error);
      setJwtHeader('Error: ' + error.message);
      setJwtPayload('Error: ' + error.message);
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
      <Header>
        <FiKey />
        <div>
          <h1>Token Management</h1>
          <p>Monitor and manage PingOne authentication tokens</p>
        </div>
      </Header>

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

      {/* Security Audit Section */}
      <TokenSection>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Security Audit</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <ActionButton className="secondary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                <FiShield />
                View Security Log
              </ActionButton>
              <ActionButton className="danger" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                <FiTrash2 />
                Clear Security Log
              </ActionButton>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>0</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Security Events</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>0</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>CSRF Tokens</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#374151' }}>0</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Warnings</div>
            </div>
          </div>
        </CardBody>
      </TokenSection>
    </Container>
  );
};

export default TokenManagement;
