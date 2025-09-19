/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState} from 'react';
import styled from 'styled-components';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../components/Card';
import { useAuth } from '../contexts/NewAuthContext';
import { getOAuthTokens } from '../utils/tokenStorage';
import { getRecentActivity } from '../utils/activityTracker';
import { interpretPingOneError } from '../utils/pingoneErrorInterpreter';
import { useTokenRefresh } from '../hooks/useTokenRefresh';
import { TokenDebugger } from '../utils/tokenDebug';


const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.1rem;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const FeatureCard = styled(Card)`
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
  
  svg {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: ${({ theme }) => theme.colors.primary};
  }
  
  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    margin-bottom: 1.5rem;
    flex-grow: 1;
  }
`;

const StatusCard = styled(Card)`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #cbd5e1;
  margin-bottom: 1.5rem;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const QuickActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  
  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  svg {
    font-size: 1.5rem;
    color: #3b82f6;
  }
  
  div {
    h4 {
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
      color: #1f2937;
    }
    
    p {
      font-size: 0.75rem;
      color: #6b7280;
      margin: 0;
    }
  }
`;


const TokenStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${({ $hasTokens }: { $hasTokens: boolean }) => 
    $hasTokens ? '#f0fdf4' : '#fef2f2'};
  border: 1px solid ${({ $hasTokens }: { $hasTokens: boolean }) => 
    $hasTokens ? '#bbf7d0' : '#fecaca'};
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  
  svg {
    color: ${({ $hasTokens }: { $hasTokens: boolean }) => 
      $hasTokens ? '#16a34a' : '#dc2626'};
  }
  
  span {
    font-size: 0.875rem;
    font-weight: 500;
    color: ${({ $hasTokens }: { $hasTokens: boolean }) => 
      $hasTokens ? '#166534' : '#991b1b'};
  }
`;

const IconButton = styled.button`
  background: none !important;
  border: none !important;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  color: #6b7280;
  transition: color 0.2s;
  
  &:hover {
    color: #3b82f6 !important;
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  color: #6b7280;
  font-size: 1.5rem;
  line-height: 1;
  
  &:hover {
    color: #374151;
    background: #f3f4f6;
  }
`;

const ActivityList = styled.div`
  .activity-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e5e7eb;
    
    &:last-child {
      border-bottom: none;
    }
    
    .activity-icon {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
    }
    
    .activity-content {
      flex: 1;
      
      .activity-type {
        font-weight: 500;
        color: #1f2937;
        margin-bottom: 0.25rem;
      }
      
      .activity-timestamp {
        font-size: 0.875rem;
        color: #6b7280;
      }
    }
  }
  
  .no-activity {
    text-align: center;
    color: #6b7280;
    padding: 2rem;
    font-style: italic;
  }
`;

const Dashboard = () => {
  const { config, _error } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [recentActivity, setRecentActivity] = useState<Record<string, unknown>[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

  // Token refresh automation for Dashboard login
  const {
    isRefreshing: isTokenRefreshing,
    lastRefreshAt,
    nextRefreshAt,
    refreshError,
    refreshTokens,
    stopAutoRefresh,
    startAutoRefresh,
    status: refreshStatus
  } = useTokenRefresh({
    autoRefresh: true,
    refreshThreshold: 300, // 5 minutes before expiry
    onRefreshSuccess: (newTokens) => {
      console.log('✅ [Dashboard] Token refresh successful', newTokens);
      setTokens(newTokens);
    },
    onRefreshError: (_error) => {
      console.error('❌ [Dashboard] Token refresh failed', _error);
    }
  });
  
  const infoMessage = (location.state as { message?: string })?.message;
  const infoType = ((location.state as { type?: 'success' | 'error' | 'warning' | 'info' })?.type) || 'info';

  // Check if there are saved credentials
  const hasSavedCredentials = config && config.environmentId && config.clientId;
  
  // Debug logging for configuration status
  useEffect(() => {
    console.log('🔍 [Dashboard] Config status check:', {
      hasConfig: !!config,
      environmentId: config?.environmentId,
      clientId: config?.clientId,
      hasSavedCredentials
    });
  }, [config, hasSavedCredentials]);

  // Handle refresh button click
  const handleRefresh = async () => {
    await refreshDashboard();
  };

  // Handle activity button click
  const handleActivity = () => {
    console.log('Activity button clicked - showing recent activity:', recentActivity);
    setShowActivityModal(true);
  };

  // Load initial dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const storedTokens = getOAuthTokens();
        setTokens(storedTokens);
        
        // Load recent activity using the activity tracker
        const activity = getRecentActivity();
        setRecentActivity(activity.slice(0, 5)); // Show last 5 activities
      } catch (_error) {
        console.error('Failed to load dashboard data:', _error);
      }
    };

    loadDashboardData();
  }, []); // Empty dependency array - only run once on mount

  // Set up interval to check for new tokens
  useEffect(() => {
    const tokenCheckInterval = setInterval(() => {
      const storedTokens = getOAuthTokens();
      if (storedTokens && (!tokens || storedTokens.access_token !== tokens.access_token)) {
        setTokens(storedTokens);
        console.log('🔄 [Dashboard] New tokens detected:', storedTokens);
      }
    }, 2000);

    return () => clearInterval(tokenCheckInterval);
  }, [tokens]); // This effect only runs when tokens change

  const refreshDashboard = async () => {
    setIsRefreshing(true);
    try {
      const storedTokens = getOAuthTokens();
      setTokens(storedTokens);
      
      const activity = getRecentActivity();
      setRecentActivity(activity.slice(0, 5));
    } catch (_error) {
      console.error('Failed to refresh dashboard:', _error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const quickActions = [
    {
      icon: <FiPlay />,
      title: 'Start Authorization Code Flow',
      description: 'Most common OAuth flow',
      action: () => navigate('/flows/authorization-code'),
    },
    {
      icon: <FiShield />,
      title: 'Test PKCE Flow',
      description: 'Enhanced security flow',
      action: () => navigate('/flows/pkce'),
    },
    {
      icon: <FiUser />,
      title: 'Get User Info',
      description: 'Retrieve user profile',
      action: () => navigate('/flows/userinfo'),
    },
    {
      icon: <FiSettings />,
      title: 'Configure Settings',
      description: 'Setup environment',
      action: () => navigate('/configuration'),
    },
  ];

  const features = [
    {
      icon: <FiCode />,
      title: 'OAuth 2.0 Flows',
      description: 'Interactive demonstrations of Authorization Code, PKCE, Client Credentials, Device Code, and more.',
      link: '/flows',
    },
    {
      icon: <FiShield />,
      title: 'Token Management',
      description: 'Comprehensive token operations including exchange, refresh, introspection, and revocation.',
      link: '/token-management',
    },
    {
      icon: <FiUser />,
      title: 'OpenID Connect',
      description: 'ID Tokens, UserInfo endpoint, and authentication flows with identity features.',
      link: '/flows/id-tokens',
    },
    {
      icon: <FiTool />,
      title: 'Developer Tools',
      description: 'JWT decoder, PKCE generator, and utilities for OAuth development.',
      link: '/documentation',
    },
  ];

  return (
    <DashboardContainer>
      <PageHeader>
        <h1>PingOne OAuth 2.0 & OIDC Playground</h1>
        <p>Learn, test, and master OAuth 2.0 and OpenID Connect with interactive examples</p>
      </PageHeader>

      {infoMessage && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: '0.375rem',
          backgroundColor: infoType === 'success' ? '#f0fdf4' : infoType === 'error' ? '#fef2f2' : infoType === 'warning' ? '#fffbeb' : '#eff6ff',
          border: `1px solid ${infoType === 'success' ? '#bbf7d0' : infoType === 'error' ? '#fecaca' : infoType === 'warning' ? '#fde68a' : '#bfdbfe'}`,
          color: infoType === 'success' ? '#166534' : infoType === 'error' ? '#991b1b' : infoType === 'warning' ? '#92400e' : '#1e40af'
        }}>
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
            {infoType === 'success' ? 'Success' : infoType === 'error' ? 'Error' : infoType === 'warning' ? 'Warning' : 'Information'}
          </strong>
          <div>{infoMessage}</div>
        </div>
      )}

      {error && (() => {
        const errorInfo = interpretPingOneError(_error);
        return (
          <div style={{
            padding: '1.5rem',
            marginBottom: '1.5rem',
            borderRadius: '0.5rem',
            backgroundColor: errorInfo.severity === 'error' ? '#fef2f2' : errorInfo.severity === 'warning' ? '#fffbeb' : '#eff6ff',
            border: `1px solid ${errorInfo.severity === 'error' ? '#fecaca' : errorInfo.severity === 'warning' ? '#fde68a' : '#bfdbfe'}`,
            color: errorInfo.severity === 'error' ? '#991b1b' : errorInfo.severity === 'warning' ? '#92400e' : '#1e40af'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ 
                padding: '0.5rem', 
                borderRadius: '0.375rem', 
                backgroundColor: errorInfo.severity === 'error' ? '#fecaca' : errorInfo.severity === 'warning' ? '#fde68a' : '#bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '2.5rem',
                height: '2.5rem'
              }}>
                {errorInfo.severity === 'error' ? <FiSettings style={{ fontSize: '1.25rem', color: '#dc2626' }} /> : 
                 errorInfo.severity === 'warning' ? <FiInfo style={{ fontSize: '1.25rem', color: '#d97706' }} /> :
                 <FiInfo style={{ fontSize: '1.25rem', color: '#2563eb' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  margin: '0 0 0.5rem 0',
                  color: errorInfo.severity === 'error' ? '#991b1b' : errorInfo.severity === 'warning' ? '#92400e' : '#1e40af'
                }}>
                  {errorInfo.title}
                </h3>
                <p style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '0.875rem',
                  lineHeight: '1.5'
                }}>
                  {errorInfo.message}
                </p>
                {errorInfo.suggestion && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: errorInfo.severity === 'error' ? '#fef7f7' : errorInfo.severity === 'warning' ? '#fffbeb' : '#f0f9ff',
                    border: `1px solid ${errorInfo.severity === 'error' ? '#fecaca' : errorInfo.severity === 'warning' ? '#fde68a' : '#bfdbfe'}`,
                    borderRadius: '0.375rem',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '600', 
                      margin: '0 0 0.5rem 0',
                      color: errorInfo.severity === 'error' ? '#991b1b' : errorInfo.severity === 'warning' ? '#92400e' : '#1e40af'
                    }}>
                      💡 How to Fix:
                    </h4>
                    <div style={{ 
                      margin: 0, 
                      fontSize: '0.875rem',
                      lineHeight: '1.6'
                    }}>
                      {errorInfo.suggestion.split('\n').map((line, index) => (
                        <div key={index} style={{ marginBottom: '0.5rem' }}>
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <Link to="/configuration" style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: errorInfo.severity === 'error' ? '#dc2626' : errorInfo.severity === 'warning' ? '#d97706' : '#2563eb',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}>
                    <FiSettings style={{ fontSize: '1rem' }} />
                    Configure PingOne Settings
                  </Link>
                  <Link to="/documentation" style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'transparent',
                    color: errorInfo.severity === 'error' ? '#dc2626' : errorInfo.severity === 'warning' ? '#d97706' : '#2563eb',
                    textDecoration: 'none',
                    border: `1px solid ${errorInfo.severity === 'error' ? '#dc2626' : errorInfo.severity === 'warning' ? '#d97706' : '#2563eb'}`,
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}>
                    <FiBook style={{ fontSize: '1rem' }} />
                    View Documentation
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Status Overview */}
      <StatusCard>
        <CardBody>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>System Status</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconButton
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <FiRefreshCw style={{ 
                  fontSize: '1rem', 
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                }} />
              </IconButton>
              <IconButton
                onClick={handleActivity}
                style={{ color: '#3b82f6' }}
              >
                <FiActivity style={{ fontSize: '1.5rem' }} />
              </IconButton>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <TokenStatus $hasTokens={!!tokens}>
              {tokens ? <FiCheckCircle /> : <FiClock />}
              <span>{tokens ? 'Tokens Available' : 'No Active Tokens'}</span>
            </TokenStatus>
            
            <TokenStatus $hasTokens={hasSavedCredentials}>
              {hasSavedCredentials ? <FiCheckCircle /> : <FiSettings />}
              <span>{hasSavedCredentials ? 'Environment Configured' : 'Setup Required'}</span>
            </TokenStatus>
          </div>

          {/* Token Details */}
          {tokens && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Token Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', fontSize: '0.75rem' }}>
                {tokens.access_token && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FiCheckCircle style={{ color: '#10b981', fontSize: '0.75rem' }} />
                    <span>Access Token</span>
                  </div>
                )}
                {tokens.id_token && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FiCheckCircle style={{ color: '#10b981', fontSize: '0.75rem' }} />
                    <span>ID Token</span>
                  </div>
                )}
                {tokens.refresh_token && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FiCheckCircle style={{ color: '#10b981', fontSize: '0.75rem' }} />
                    <span>Refresh Token</span>
                  </div>
                )}
                {tokens.token_type && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FiInfo style={{ color: '#6b7280', fontSize: '0.75rem' }} />
                    <span>Type: {tokens.token_type}</span>
                  </div>
                )}
                {tokens.expires_in && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FiClock style={{ color: '#6b7280', fontSize: '0.75rem' }} />
                    <span>Expires: {tokens.expires_in}s</span>
                  </div>
                )}
              </div>
              {/* Token Refresh Status */}
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: refreshStatus.isInitialized ? '#f0f9ff' : '#fef3c7', borderRadius: '0.375rem', border: `1px solid ${refreshStatus.isInitialized ? '#bfdbfe' : '#fbbf24'}` }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: refreshStatus.isInitialized ? '#1e40af' : '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiRefreshCw style={{ fontSize: '0.875rem' }} />
                  Token Refresh Status
                </h4>
                {refreshStatus.isInitialized ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <div style={{ 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%', 
                          backgroundColor: refreshStatus.autoRefreshEnabled ? '#10b981' : '#6b7280' 
                        }} />
                        <span>Auto Refresh: {refreshStatus.autoRefreshEnabled ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      {isTokenRefreshing && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FiRefreshCw style={{ color: '#3b82f6', fontSize: '0.75rem', animation: 'spin 1s linear infinite' }} />
                          <span>Refreshing...</span>
                        </div>
                      )}
                      {lastRefreshAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FiCheckCircle style={{ color: '#10b981', fontSize: '0.75rem' }} />
                          <span>Last: {lastRefreshAt.toLocaleTimeString()}</span>
                        </div>
                      )}
                      {nextRefreshAt && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FiClock style={{ color: '#6b7280', fontSize: '0.75rem' }} />
                          <span>Next: {nextRefreshAt.toLocaleTimeString()}</span>
                        </div>
                      )}
                      {refreshError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#dc2626' }}>
                          <FiInfo style={{ fontSize: '0.75rem' }} />
                          <span>Error: {refreshError}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={refreshTokens}
                      disabled={isTokenRefreshing}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: isTokenRefreshing ? 'not-allowed' : 'pointer',
                        opacity: isTokenRefreshing ? 0.5 : 1
                      }}
                    >
                      <FiRefreshCw style={{ marginRight: '0.25rem', fontSize: '0.75rem' }} />
                      Refresh Now
                    </button>
                    <button
                      onClick={refreshStatus.autoRefreshEnabled ? stopAutoRefresh : startAutoRefresh}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        backgroundColor: refreshStatus.autoRefreshEnabled ? '#6b7280' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                    >
                      {refreshStatus.autoRefreshEnabled ? 'Stop Auto' : 'Start Auto'}
                    </button>
                    <button
                      onClick={async () => {
                        try {

                          if (result.success) {
                            console.log('✅ [Dashboard] Cleared all tokens from storage');
                            window.location.reload(); // Reload to refresh status
                          } else {
                            console.error('❌ [Dashboard] Failed to clear tokens:', result.error);
                            alert(`Failed to clear tokens: ${result.error}`);
                          }
                        } catch (_error) {
                          console.error('❌ [Dashboard] Failed to clear tokens:', _error);
                          alert(`Failed to clear tokens: ${error}`);
                        }
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                      title="Clear all tokens from storage and reload page"
                    >
                      Clear Tokens
                    </button>
                  </div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: '#92400e' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                      <FiInfo style={{ fontSize: '0.75rem' }} />
                      <span>No refresh token available</span>
                    </div>
                    <p style={{ margin: '0', fontSize: '0.7rem', color: '#a16207' }}>
                      Token refresh requires a valid refresh token. Complete an OAuth flow that provides refresh tokens to enable automatic token refresh.
                    </p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <Link 
                  to="/token-management" 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                  <FiTool size={16} />
                  View Token Details
                </Link>
              </div>
            </div>
          )}
        </CardBody>
      </StatusCard>

      {/* Quick Actions */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Quick Actions</h2>
      <QuickActions>
        {quickActions.map((action, index) => (
          <QuickActionButton key={index} onClick={action.action}>
            {action.icon}
            <div>
              <h4>{action.title}</h4>
              <p>{action.description}</p>
            </div>
          </QuickActionButton>
        ))}
      </QuickActions>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card style={{ marginBottom: '2rem' }}>
          <CardBody>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Recent Activity</h2>
            <ActivityList>
              {recentActivity.map((activity, index) => (
                <div key={activity.id || index} className="activity-item">
                  {activity.success ? <FiCheckCircle style={{ color: '#16a34a' }} /> : <FiClock style={{ color: '#dc2626' }} />}
                  <div className="activity-content">
                    <div className="activity-title">{activity.action || 'OAuth Flow Executed'}</div>
                    <p className="activity-time">
                      {new Date(activity.timestamp).toLocaleString()}
                      {activity.flowType && ` • ${activity.flowType}`}
                    </p>
                  </div>
                </div>
              ))}
            </ActivityList>
          </CardBody>
        </Card>
      )}

      {/* Available Features */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Available Features</h2>
      <Grid>
        {features.map((feature, index) => (
          <FeatureCard key={index}>
            <CardBody className="flex flex-col h-full">
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem', color: '#3b82f6' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>{feature.title}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '1rem' }}>
                {feature.description}
              </p>
              <Link 
                to={feature.link}
                className="mt-auto inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Explore feature
                <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </CardBody>
          </FeatureCard>
        ))}
      </Grid>

      {/* Getting Started */}
      <Card style={{ marginTop: '2rem' }}>
        <CardBody>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Getting Started</h2>
          <ol style={{ listStyle: 'decimal', paddingLeft: '1.25rem', lineHeight: '1.75' }}>
            <li style={{ marginBottom: '0.5rem' }}>Configure your PingOne environment in the Settings page</li>
            <li style={{ marginBottom: '0.5rem' }}>Use Quick Actions above to start common OAuth flows</li>
            <li style={{ marginBottom: '0.5rem' }}>Follow the interactive guide to understand each step</li>
            <li style={{ marginBottom: '0.5rem' }}>Inspect requests and responses in real-time</li>
            <li>Review the documentation for detailed explanations</li>
          </ol>
        </CardBody>
      </Card>

      {/* Activity Modal */}
      {showActivityModal && (
        <ModalOverlay onClick={() => setShowActivityModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Recent Activity</h2>
              <CloseButton onClick={() => setShowActivityModal(false)}>
                ×
              </CloseButton>
            </ModalHeader>
            <ActivityList>
              {recentActivity.length > 0 ? (
                recentActivity.map((item, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      <FiActivity />
                    </div>
                    <div className="activity-content">
                      <div className="activity-type">
                        {item.type || 'Unknown Activity'}
                      </div>
                      <div className="activity-timestamp">
                        {item.timestamp || 'No timestamp available'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-activity">
                  No recent activity to display
                </div>
              )}
            </ActivityList>
          </ModalContent>
        </ModalOverlay>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;
