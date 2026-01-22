import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiEye, FiRefreshCw, FiTrash2, FiDownload, FiUpload, FiClock, FiActivity, FiCheckCircle, FiAlertTriangle, FiX, FiInfo, FiZap, FiDatabase, FiSettings } from 'react-icons/fi';
import { useUnifiedFlowState, stateUtils } from '../services/enhancedStateManagementV2';
import { tokenMonitoringService, type TokenInfo } from '../services/tokenMonitoringService';

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

const TokenInfo = styled.div`
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
  const { state, actions } = useUnifiedFlowState();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // Subscribe to token monitoring service
  useEffect(() => {
    const unsubscribe = tokenMonitoringService.subscribe((newTokens) => {
      setTokens(newTokens);
    });

    // Add sample tokens if none exist
    if (tokens.length === 0) {
      const sampleAccessToken = tokenMonitoringService.addToken({
        type: 'access_token',
        value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour from now
        issuedAt: Date.now() - (30 * 60 * 1000), // 30 minutes ago
        scope: ['openid', 'profile', 'email', 'read'],
      });

      const sampleRefreshToken = tokenMonitoringService.addToken({
        type: 'refresh_token',
        value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
        issuedAt: Date.now() - (1 * 60 * 60 * 1000), // 1 hour ago
        scope: ['openid', 'profile', 'email', 'read'],
      });

      const sampleExpiringToken = tokenMonitoringService.addToken({
        type: 'access_token',
        value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes from now
        issuedAt: Date.now() - (55 * 60 * 1000), // 55 minutes ago
        scope: ['openid', 'profile', 'email'],
      });
    }

    return unsubscribe;
  }, []);

  // Token actions
  const handleRefreshToken = async (tokenId: string) => {
    try {
      await tokenMonitoringService.refreshToken(tokenId);
      setMessage('Token refreshed successfully');
      setMessageType('success');
    } catch (error) {
      console.error('Failed to refresh token:', error);
      setMessage('Failed to refresh token');
      setMessageType('error');
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    try {
      await tokenMonitoringService.revokeToken(tokenId);
      setMessage('Token revoked successfully');
      setMessageType('success');
    } catch (error) {
      console.error('Failed to revoke token:', error);
      setMessage('Failed to revoke token');
      setMessageType('error');
    }
  };

  const handleIntrospectToken = async (tokenId: string) => {
    try {
      await tokenMonitoringService.introspectToken(tokenId);
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
      tokenMonitoringService.updateToken(tokenId, { isVisible: !token.isVisible });
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
    tokenMonitoringService.clearAllTokens();
    setMessage('All tokens cleared');
    setMessageType('info');
  };

  // Calculate statistics
  const stats = {
    total: tokens.length,
    active: tokens.filter(t => t.status === 'active').length,
    expiring: tokens.filter(t => t.status === 'expiring').length,
    expired: tokens.filter(t => t.status === 'expired').length,
    error: tokens.filter(t => t.status === 'error').length,
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>🔍 Token Monitoring Dashboard</PageTitle>
        <PageSubtitle>
          Real-time token monitoring with countdowns, introspection, and management
        </PageSubtitle>
      </PageHeader>

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
                <TokenType>{token.type}</TokenType>
                <TokenStatus $status={token.status}>
                  {token.status}
                </TokenStatus>
              </TokenHeader>
              
              <TokenValue>
                {token.isVisible ? token.value : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
              </TokenValue>
              
              <TokenInfo>
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
              </TokenInfo>
              
              <TokenActions>
                <ActionButton onClick={() => handleToggleVisibility(token.id)}>
                  {token.isVisible ? <FiEye /> : <FiEye />} {token.isVisible ? 'Hide' : 'Show'}
                </ActionButton>
                <ActionButton onClick={() => handleIntrospectToken(token.id)}>
                  <FiInfo /> Introspect
                </ActionButton>
                <ActionButton onClick={() => handleRefreshToken(token.id)}>
                  <FiRefreshCw /> Refresh
                </ActionButton>
                <ActionButton onClick={() => handleRevokeToken(token.id)} $variant="danger">
                  <FiX /> Revoke
                </ActionButton>
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
          </EmptyState>
        </SectionContainer>
      )}
    </PageContainer>
  );
};

export default TokenMonitoringPage;
