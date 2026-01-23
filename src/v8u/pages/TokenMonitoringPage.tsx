import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiEye, FiRefreshCw, FiTrash2, FiDownload, FiClock, FiCheckCircle, FiAlertTriangle, FiX, FiInfo, FiDatabase, FiSettings, FiLogOut, FiUsers, FiShield } from 'react-icons/fi';
import { TokenMonitoringService, type TokenInfo, type RevocationMethod } from '../services/tokenMonitoringService';
import { workerTokenManager } from '../../services/workerTokenManager';
import { WorkerTokenModalV8 } from '../../v8/components/WorkerTokenModalV8';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const PageTitle = styled.h1`
  color: #1e293b;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const PageSubtitle = styled.p`
  color: #64748b;
  font-size: 1rem;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div<{ $color?: string }>`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: ${props => props.$color || '#64748b'};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const TokenGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const TokenCard = styled.div<{ $status: 'active' | 'expiring' | 'expired' | 'error' }>`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid ${props => {
    switch (props.$status) {
      case 'active': return '#10b981';
      case 'expiring': return '#f59e0b';
      case 'expired': return '#ef4444';
      case 'error': return '#ef4444';
      default: return '#e2e8f0';
    }
  }};
`;

const TokenHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const TokenType = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TokenStatus = styled.span<{ $status: 'active' | 'expiring' | 'expired' | 'error' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch (props.$status) {
      case 'active':
        return `
          background: #dcfce7;
          color: #166534;
        `;
      case 'expiring':
        return `
          background: #fef3c7;
          color: #92400e;
        `;
      case 'expired':
        return `
          background: #fee2e2;
          color: #991b1b;
        `;
      case 'error':
        return `
          background: #fee2e2;
          color: #991b1b;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #4b5563;
        `;
    }
  }}
`;

const TokenValue = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #374151;
  background: #f8fafc;
  padding: 0.5rem;
  border-radius: 4px;
  margin: 0.5rem 0;
  word-break: break-all;
`;

const TokenInfoContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin: 1rem 0;
`;

const InfoItem = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  
  strong {
    color: #374151;
  }
`;

const TokenActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  ${props => {
    switch (props.$variant) {
      case 'primary':
        return `
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
          
          &:hover {
            background: #2563eb;
            border-color: #2563eb;
          }
        `;
      case 'danger':
        return `
          background: #ef4444;
          border-color: #ef4444;
          color: white;
          
          &:hover {
            background: #dc2626;
            border-color: #dc2626;
          }
        `;
      default:
        return `
          background: white;
          border-color: #e2e8f0;
          color: #64748b;
          
          &:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
            color: #475569;
          }
        `;
    }
  }}
`;

const TestButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #3b82f6;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #2563eb;
    border-color: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  }
`;

const SectionContainer = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
`;

const SectionTitle = styled.h2`
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

const SectionIcon = styled.div`
  font-size: 1.25rem;
  color: #3b82f6;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #64748b;
  
  svg {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #cbd5e1;
  }
`;

export const TokenMonitoringPage: React.FC = () => {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
  const [revocationMethod, setRevocationMethod] = useState<RevocationMethod>('oauth_revoke');
  const [showRevocationOptions, setShowRevocationOptions] = useState<string | null>(null);

  // Subscribe to token monitoring service
  useEffect(() => {
    // Reset service instance to ensure clean initialization on refresh
    TokenMonitoringService.resetInstance();
    
    // Get fresh instance
    const freshService = TokenMonitoringService.getInstance();
    
    // Get initial tokens immediately
    const initialTokens = freshService.getAllTokens();
    setTokens(initialTokens);
    console.log(`[TokenMonitoringPage] Loaded ${initialTokens.length} initial tokens after reset`);

    // Subscribe to future updates
    const unsubscribe = freshService.subscribe((newTokens: TokenInfo[]) => {
      setTokens(newTokens);
      console.log(`[TokenMonitoringPage] Updated tokens: ${newTokens.length} tokens`);
    });

    // Also try to sync worker tokens if they exist
    freshService.manualSyncWorkerToken();
    
    // Add a delay and try again to ensure worker token is picked up
    setTimeout(() => {
      console.log('[TokenMonitoringPage] Attempting second worker token sync...');
      freshService.manualSyncWorkerToken();
    }, 1000);

    return unsubscribe;
  }, []);

  // Token actions
  const handleRefreshToken = async (tokenId: string) => {
    try {
      const service = TokenMonitoringService.getInstance();
      await service.refreshToken(tokenId);
      setMessage('Token refreshed successfully');
      setMessageType('success');
    } catch (error) {
      console.error('Failed to refresh token:', error);
      setMessage('Failed to refresh token');
      setMessageType('error');
    }
  };

  const handleRevokeToken = async (tokenId: string, method: RevocationMethod = 'oauth_revoke') => {
    try {
      const service = TokenMonitoringService.getInstance();
      const options = { method };
      
      // For session deletion, we need additional parameters
      if (method === 'session_delete') {
        // In a real implementation, you'd get these from user input or token introspection
        const userId = prompt('Enter User ID for session deletion:');
        const sessionId = prompt('Enter Session ID for session deletion:');
        
        if (!userId || !sessionId) {
          setMessage('User ID and Session ID required for session deletion');
          setMessageType('error');
          return;
        }
        
        (options as any).userId = userId;
        (options as any).sessionId = sessionId;
      }
      
      // For ID token hint
      if (method === 'sso_signoff') {
        const token = tokens.find(t => t.id === tokenId);
        if (token?.type === 'id_token') {
          (options as any).idTokenHint = token.value;
        }
      }
      
      await service.revokeToken(tokenId, options);
      
      const methodNames = {
        oauth_revoke: 'OAuth token revocation',
        sso_signoff: 'SSO sign-off',
        session_delete: 'Session deletion'
      };
      
      setMessage(`Token revoked successfully via ${methodNames[method]}`);
      setMessageType('success');
      setShowRevocationOptions(null);
    } catch (error) {
      console.error('Failed to revoke token:', error);
      setMessage('Failed to revoke token');
      setMessageType('error');
    }
  };

  const handleIntrospectToken = async (tokenId: string) => {
    try {
      const service = TokenMonitoringService.getInstance();
      await service.introspectToken(tokenId);
      setMessage('Token introspection completed');
      setMessageType('success');
    } catch (error) {
      console.error('Failed to introspect token:', error);
      setMessage('Failed to introspect token');
      setMessageType('error');
    }
  };

  const handleToggleVisibility = (tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    if (token) {
      const service = TokenMonitoringService.getInstance();
      service.updateToken(tokenId, { isVisible: !token.isVisible });
    }
  };

  const handleExportTokens = () => {
    const tokenData = tokens.map(token => ({
      type: token.type,
      value: token.value,
      expiresAt: token.expiresAt,
      issuedAt: token.issuedAt,
      scope: token.scope,
      status: token.status,
    }));

    const blob = new Blob([JSON.stringify(tokenData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tokens-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setMessage('Tokens exported successfully');
    setMessageType('success');
  };

  const handleClearAllTokens = () => {
    const service = TokenMonitoringService.getInstance();
    service.clearAllTokens();
    setMessage('All tokens cleared');
    setMessageType('info');
  };

  const handleRefreshWorkerToken = async () => {
    try {
      await workerTokenManager.refreshToken();
      setMessage('Worker token refreshed successfully');
      setMessageType('success');
    } catch (error) {
      console.error('Failed to refresh worker token:', error);
      setMessage('Failed to refresh worker token');
      setMessageType('error');
    }
  };

  const handleGetWorkerToken = async () => {
    try {
      console.log('🔧 [TokenMonitoringPage] Opening V8 worker token modal...');
      
      // Open V8 worker token modal directly
      setShowWorkerTokenModal(true);
      
      setMessage('Opening V8 worker token configuration...');
      setMessageType('info');
    } catch (error) {
      console.error('❌ [TokenMonitoringPage] Failed to open worker token modal:', error);
      setMessage('Failed to open worker token modal');
      setMessageType('error');
    }
  };

  const handleImplicitLogin = async () => {
    try {
      console.log('🔧 [TokenMonitoringPage] Starting unified implicit flow...');
      
      // Navigate to unified implicit flow instead of old implicit flow
      window.location.href = '/v8u/unified/implicit';
    } catch (error) {
      console.error('❌ [TokenMonitoringPage] Failed to start implicit login:', error);
      setMessage('Failed to start implicit login');
      setMessageType('error');
    }
  };

  // Calculate statistics
  const stats = {
    total: tokens.length,
    active: tokens.filter(t => t.status === 'active').length,
    expiring: tokens.filter(t => t.status === 'expiring').length,
    expired: tokens.filter(t => t.status === 'expired').length,
    error: tokens.filter(t => t.status === 'error').length,
  };

  // Debug logging
  console.log(`[TokenMonitoringPage] Render state:`, {
    tokensCount: tokens.length,
    tokens: tokens.map(t => ({ id: t.id, type: t.type, status: t.status })),
    stats
  });

  return (
    <>
      <PageContainer>
      <PageHeader>
        <PageTitle>🔍 Token Monitoring Dashboard</PageTitle>
        <PageSubtitle>
          Real-time token monitoring with countdowns, introspection, and management
        </PageSubtitle>
      </PageHeader>

      {/* Debug Section */}
      <div style={{ 
        background: '#f0f9ff', 
        border: '1px solid #0ea5e9', 
        borderRadius: '8px', 
        padding: '1rem', 
        marginBottom: '1rem' 
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#0c4a6e' }}>Debug Info</h4>
        <p style={{ margin: '0', fontSize: '0.875rem', color: '#075985' }}>
          Tokens: {tokens.length} | Active: {stats.active} | Expiring: {stats.expiring}
        </p>
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <TestButton onClick={handleGetWorkerToken}>
            <FiDatabase /> Get WorkerToken
          </TestButton>
          <TestButton onClick={handleImplicitLogin}>
            <FiShield /> Implicit Login
          </TestButton>
        </div>
      </div>

      {message && (
        <div style={{
          marginBottom: '1rem',
        }}>
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            background: messageType === 'success' ? '#f0fdf4' : messageType === 'error' ? '#fef2f2' : '#eff6ff',
            border: `1px solid ${messageType === 'success' ? '#86efac' : messageType === 'error' ? '#fecaca' : '#bfdbfe'}`,
            color: messageType === 'success' ? '#166534' : messageType === 'error' ? '#991b1b' : '#1e40af',
            textAlign: 'center',
          }}>
            {message}
          </div>
        </div>
      )}

      {/* Statistics */}
      <StatsGrid>
        <StatCard>
          <StatIcon $color="#3b82f6">
            <FiDatabase />
          </StatIcon>
          <StatValue>{stats.total}</StatValue>
          <StatLabel>Total Tokens</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon $color="#10b981">
            <FiCheckCircle />
          </StatIcon>
          <StatValue>{stats.active}</StatValue>
          <StatLabel>Active</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon $color="#f59e0b">
            <FiClock />
          </StatIcon>
          <StatValue>{stats.expiring}</StatValue>
          <StatLabel>Expiring Soon</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatIcon $color="#ef4444">
            <FiAlertTriangle />
          </StatIcon>
          <StatValue>{stats.expired}</StatValue>
          <StatLabel>Expired</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Token Management Actions */}
      <SectionContainer>
        <SectionHeader>
          <SectionIcon>
            <FiSettings />
          </SectionIcon>
          <SectionTitle>Token Management</SectionTitle>
        </SectionHeader>
        
        <ActionButtons>
          <ActionButton onClick={handleExportTokens}>
            <FiDownload /> Export Tokens
          </ActionButton>
          <ActionButton onClick={handleClearAllTokens} $variant="danger">
            <FiTrash2 /> Clear All Tokens
          </ActionButton>
        </ActionButtons>
      </SectionContainer>

      {/* Tokens List */}
      {tokens.length > 0 ? (
        <TokenGrid>
          {tokens.map((token) => (
            <TokenCard key={token.id} $status={token.status}>
              <TokenHeader>
                <TokenType>{token.type.replace('_', ' ').toUpperCase()}</TokenType>
                <TokenStatus $status={token.status}>
                  {token.status}
                  {token.source === 'worker_token' && <span style={{ marginLeft: '0.5rem', fontSize: '0.6rem' }}>🏭 WORKER</span>}
                </TokenStatus>
              </TokenHeader>
              
              <TokenValue>
                {token.isVisible ? token.value : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
              </TokenValue>
              
              <TokenInfoContainer>
                <InfoItem>
                  <strong>Expires:</strong> {token.expiresAt ? new Date(token.expiresAt).toLocaleString() : 'Never'}
                </InfoItem>
                <InfoItem>
                  <strong>Issued:</strong> {token.issuedAt ? new Date(token.issuedAt).toLocaleString() : 'Unknown'}
                </InfoItem>
                <InfoItem>
                  <strong>Scope:</strong> {token.scope.join(', ')}
                </InfoItem>
                <InfoItem>
                  <strong>ID:</strong> {token.id}
                </InfoItem>
              </TokenInfoContainer>
              
              <TokenActions>
                <ActionButton onClick={() => handleToggleVisibility(token.id)}>
                  {token.isVisible ? <FiEye /> : <FiEye />} {token.isVisible ? 'Hide' : 'Show'}
                </ActionButton>
                <ActionButton onClick={() => handleIntrospectToken(token.id)}>
                  <FiInfo /> Introspect
                </ActionButton>
                {(token.status === 'expired' || token.status === 'expiring') && token.type !== 'worker_token' && (
                  <ActionButton onClick={() => handleRefreshToken(token.id)}>
                    <FiRefreshCw /> Refresh
                  </ActionButton>
                )}
                {token.type !== 'worker_token' && (
                  <div style={{ position: 'relative' }}>
                    <ActionButton 
                      onClick={() => setShowRevocationOptions(showRevocationOptions === token.id ? null : token.id)} 
                      $variant="danger"
                    >
                      <FiX /> Revoke
                    </ActionButton>
                    
                    {showRevocationOptions === token.id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '0.5rem',
                        marginTop: '0.25rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        zIndex: 1000,
                        minWidth: '200px'
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                          Revocation Method:
                        </div>
                        <button
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '0.25rem 0.5rem',
                            textAlign: 'left',
                            border: 'none',
                            background: 'transparent',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            marginBottom: '0.25rem'
                          }}
                          onClick={() => handleRevokeToken(token.id, 'oauth_revoke')}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          🔄 OAuth Token Revocation
                        </button>
                        <button
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '0.25rem 0.5rem',
                            textAlign: 'left',
                            border: 'none',
                            background: 'transparent',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            marginBottom: '0.25rem'
                          }}
                          onClick={() => handleRevokeToken(token.id, 'sso_signoff')}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          🚪 SSO Sign-off
                        </button>
                        <button
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '0.25rem 0.5rem',
                            textAlign: 'left',
                            border: 'none',
                            background: 'transparent',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            borderRadius: '4px'
                          }}
                          onClick={() => handleRevokeToken(token.id, 'session_delete')}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          👥 Delete Session
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {token.type === 'worker_token' && (
                  <ActionButton onClick={() => handleRefreshWorkerToken()} $variant="primary">
                    <FiRefreshCw /> Refresh Worker Token
                  </ActionButton>
                )}
              </TokenActions>
            </TokenCard>
          ))}
        </TokenGrid>
      ) : (
        <SectionContainer>
          <EmptyState>
            <FiDatabase />
            <h3>No Tokens Found</h3>
            <p>Start adding tokens to monitor their status and expiration</p>
            
            {/* Test Buttons */}
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <TestButton onClick={handleGetWorkerToken}>
                <FiDatabase /> Get WorkerToken
              </TestButton>
              <TestButton onClick={handleImplicitLogin}>
                <FiShield /> Implicit Login
              </TestButton>
            </div>
          </EmptyState>
        </SectionContainer>
      )}
    </PageContainer>
    
    {/* V8 Worker Token Modal */}
    <WorkerTokenModalV8
      isOpen={showWorkerTokenModal}
      onClose={() => {
        console.log('[TokenMonitoringPage] V8 WorkerTokenModal closed');
        setShowWorkerTokenModal(false);
        // Force a sync to update the display
        const service = TokenMonitoringService.getInstance();
        service.manualSyncWorkerToken();
      }}
      onTokenGenerated={() => {
        console.log('[TokenMonitoringPage] V8 WorkerTokenModal token generated');
        setShowWorkerTokenModal(false);
        // Force a sync to update the display
        const service = TokenMonitoringService.getInstance();
        service.manualSyncWorkerToken();
      }}
      flowType="token-monitoring"
      environmentId=""
    />
    </>
  );
};

export default TokenMonitoringPage;
