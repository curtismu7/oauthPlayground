import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../components/Card';
import { FiCode, FiUser, FiSettings, FiInfo, FiCheckCircle, FiPlay, FiBook, FiShield, FiClock, FiActivity, FiRefreshCw, FiTool, FiKey, FiGlobe, FiEye, FiCopy } from 'react-icons/fi';
import { useAuth } from '../contexts/NewAuthContext';
import { getRecentActivity } from '../utils/activityTracker';
import { interpretPingOneError } from '../utils/pingoneErrorInterpreter';
import { useTokenRefresh } from '../hooks/useTokenRefresh';
import { TokenDebugger } from '../utils/tokenDebug';

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const Header = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #666;
    font-size: 1.1rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const StatIcon = styled.div<{ $variant: 'flows' | 'tokens' | 'success' | 'security' }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  color: white;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'flows':
        return 'background: linear-gradient(135deg, #667eea, #764ba2);';
      case 'tokens':
        return 'background: linear-gradient(135deg, #f093fb, #f5576c);';
      case 'success':
        return 'background: linear-gradient(135deg, #4facfe, #00f2fe);';
      case 'security':
        return 'background: linear-gradient(135deg, #43e97b, #38f9d7);';
      default:
        return 'background: linear-gradient(135deg, #667eea, #764ba2);';
    }
  }}
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ContentCard = styled.div<{ $shaded?: boolean }>`
  background: ${({ $shaded }) => $shaded ? 'linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%)' : '#ffffff'};
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid ${({ $shaded }) => $shaded ? '#d1e7ff' : '#e5e7eb'};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ActionButton = styled(Link)`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    color: white;
    text-decoration: none;
  }
`;

const RefreshButton = styled.button`
  background: #f8f9fa;
  color: #667eea;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #e9ecef;
    border-color: #667eea;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const RecentActivity = styled.div`
  margin-top: 1.5rem;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  transition: background 0.3s ease;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const ActivityIcon = styled.div<{ $type: 'success' | 'warning' | 'info' }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  
  ${({ $type }) => {
    switch ($type) {
      case 'success':
        return 'background: rgba(67, 233, 123, 0.1); color: #43e97b;';
      case 'warning':
        return 'background: rgba(255, 193, 7, 0.1); color: #ffc107;';
      case 'info':
        return 'background: rgba(102, 126, 234, 0.1); color: #667eea;';
      default:
        return 'background: rgba(102, 126, 234, 0.1); color: #667eea;';
    }
  }}
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
`;

const ActivityTime = styled.div`
  font-size: 0.85rem;
  color: #666;
`;

const FlowStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const StatusBadge = styled.span<{ $status: 'active' | 'pending' | 'error' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  
  ${({ $status }) => {
    switch ($status) {
      case 'active':
        return 'background: rgba(67, 233, 123, 0.1); color: #43e97b;';
      case 'pending':
        return 'background: rgba(255, 193, 7, 0.1); color: #ffc107;';
      case 'error':
        return 'background: rgba(245, 87, 108, 0.1); color: #f5576c;';
      default:
        return 'background: rgba(67, 233, 123, 0.1); color: #43e97b;';
    }
  }}
`;

const TokenInfo = styled.div`
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const TokenRow = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const TokenLabel = styled.span`
  font-weight: 500;
  color: #333;
`;

const TokenValue = styled.span`
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.8rem;
  color: #2d3748;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border: 1px solid #cbd5e0;
  padding: 0.75rem;
  border-radius: 6px;
  word-break: break-all;
  white-space: pre-wrap;
  line-height: 1.4;
  margin-top: 0.25rem;
  display: block;
  position: relative;
`;

const TokenRowContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  position: relative;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const TokenRowWithCopy = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CopyButton = styled.button`
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-top: 0.25rem;
  
  &:hover {
    background: #5a67d8;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.copied {
    background: #48bb78;
  }
`;

const Dashboard = () => {
  console.log('🔧 [Dashboard] Component rendering');
  const { config, error, tokens: authTokens, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<Record<string, unknown> | null>(null);
  const [recentActivity, setRecentActivity] = useState<Record<string, unknown>[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

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
    onRefreshError: (error) => {
      console.error('❌ [Dashboard] Token refresh failed', error);
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
        console.log('🔍 [Dashboard] Loading dashboard data...', {
          hasAuthTokens: !!authTokens,
          isAuthenticated,
          authTokens: authTokens ? {
            hasAccessToken: !!authTokens.access_token,
            hasRefreshToken: !!authTokens.refresh_token,
            hasIdToken: !!authTokens.id_token,
            tokenType: authTokens.token_type,
            expiresIn: authTokens.expires_in
          } : null
        });

        // Use tokens from auth context instead of storage
        setTokens(authTokens);

        // Load recent activity
        let activity = getRecentActivity();
        
        // If no activity exists, create some sample data for demonstration
        if (activity.length === 0) {
          const sampleActivities = [
            {
              id: 'sample_1',
              action: 'Completed Authorization Code Flow',
              flowType: 'authorization-code',
              timestamp: Date.now() - 300000, // 5 minutes ago
              success: true,
              details: 'Successfully obtained access token'
            },
            {
              id: 'sample_2',
              action: 'Updated Configuration: Environment ID',
              flowType: 'configuration',
              timestamp: Date.now() - 600000, // 10 minutes ago
              success: true,
              details: 'Environment ID configured'
            },
            {
              id: 'sample_3',
              action: 'Completed PKCE Flow',
              flowType: 'pkce',
              timestamp: Date.now() - 900000, // 15 minutes ago
              success: true,
              details: 'PKCE flow completed successfully'
            }
          ];
          
          // Store sample activities
          localStorage.setItem('pingone_playground_recent_activity', JSON.stringify(sampleActivities));
          activity = sampleActivities;
        }
        
        setRecentActivity(activity);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadDashboardData();
  }, [authTokens, isAuthenticated]);

  // Refresh dashboard data
  const refreshDashboard = async () => {
    setIsRefreshing(true);
    try {
      // Use tokens from auth context instead of storage
      setTokens(authTokens);

      // Reload recent activity
      const activity = getRecentActivity();
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate real stats
  const stats = {
    flows: 6, // Actual OAuth flows available: Authorization Code, PKCE, Implicit, Hybrid, Client Credentials, Device Code
    tokens: tokens ? (tokens.access_token ? 1 : 0) : 0, // Current active tokens
    success: calculateSuccessRate(), // Real success rate based on recent activity
    security: calculateSecurityScore() // Real security score based on configuration
  };

  // Calculate success rate based on recent activity
  function calculateSuccessRate(): number {
    if (recentActivity.length === 0) return 0;
    
    const successfulActivities = recentActivity.filter(activity => 
      activity.type === 'success' || 
      (activity.title && activity.title.toLowerCase().includes('success'))
    ).length;
    
    return Math.round((successfulActivities / recentActivity.length) * 100);
  }

  // Calculate security score based on configuration
  function calculateSecurityScore(): number {
    let score = 0;
    
    // Check if credentials are configured
    if (config?.clientId && config?.environmentId) score += 25;
    
    // Check if client secret is configured
    if (config?.clientSecret) score += 25;
    
    // Check if PKCE is being used (indicated by code_verifier in sessionStorage)
    if (sessionStorage.getItem('code_verifier')) score += 25;
    
    // Check if state parameter is being used
    if (sessionStorage.getItem('oauth_state')) score += 25;
    
    return score;
  }

  // Get recent activity items
  const activityItems = recentActivity.slice(0, 4).map((activity, index) => ({
    id: activity.id || index,
    type: activity.success ? 'success' : 'warning' as 'success' | 'warning' | 'info',
    title: activity.action,
    time: new Date(activity.timestamp).toLocaleString(),
    icon: activity.success ? '✅' : '⚠️'
  }));

  // Get token expiration time
  const getTokenExpiration = () => {
    if (!tokens || !tokens.expires_in) return 'N/A';
    const expiresIn = tokens.expires_in as number;
    const hours = Math.floor(expiresIn / 3600);
    const minutes = Math.floor((expiresIn % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleCopyToken = async (tokenType: string, tokenValue: string) => {
    try {
      await navigator.clipboard.writeText(tokenValue);
      setCopiedStates(prev => ({ ...prev, [tokenType]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [tokenType]: false }));
      }, 2000);
    } catch (error) {
      console.error('Error copying token:', error);
    }
  };

  return (
    <DashboardContainer>
      {/* Header */}
      <Header>
        <h1>OAuth/OIDC Playground</h1>
        <p>Your comprehensive OAuth 2.0 and OpenID Connect testing environment</p>
      </Header>

      {/* Stats Grid */}
      <StatsGrid>
        <StatCard>
          <StatIcon $variant="flows">🔐</StatIcon>
          <StatValue>{stats.flows}</StatValue>
          <StatLabel>OAuth Flows</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon $variant="tokens">🎫</StatIcon>
          <StatValue>{stats.tokens}</StatValue>
          <StatLabel>Active Tokens</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon $variant="success">✅</StatIcon>
          <StatValue>{stats.success}%</StatValue>
          <StatLabel>Success Rate</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon $variant="security">🛡️</StatIcon>
          <StatValue>{stats.security}%</StatValue>
          <StatLabel>Security Score</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* System Status Card */}
      <ContentCard style={{ marginBottom: '2rem' }}>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <RefreshButton onClick={handleRefresh} disabled={isRefreshing}>
              <FiRefreshCw style={{ 
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
              }} />
            </RefreshButton>
            <RefreshButton style={{ background: '#e3f2fd', color: '#1976d2', borderColor: '#bbdefb' }}>
              <FiActivity />
            </RefreshButton>
          </div>
        </CardHeader>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <StatusBadge 
            $status={tokens ? 'active' : 'error'}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              fontSize: '0.9rem'
            }}
          >
            <FiClock />
            {tokens ? 'Active Tokens' : 'No Active Tokens'}
          </StatusBadge>
          
          <StatusBadge 
            $status={hasSavedCredentials ? 'active' : 'error'}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              fontSize: '0.9rem'
            }}
          >
            <FiCheckCircle />
            {hasSavedCredentials ? 'Environment Configured' : 'Environment Not Configured'}
          </StatusBadge>
        </div>
      </ContentCard>

      {/* Main Content - Full Width */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Quick Actions */}
        <ContentCard>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          
          <QuickActions>
            <ActionButton to="/flows/enhanced-authorization-code-v2">
              <span>🔑</span>
              Authorization Code Flow
            </ActionButton>
            <ActionButton to="/flows/enhanced-authorization-code-v2">
              <span>🔐</span>
              PKCE Flow
            </ActionButton>
            <ActionButton to="/oidc/client-credentials">
              <span>👤</span>
              Client Credentials
            </ActionButton>
            <ActionButton to="/oidc/device-code">
              <span>📱</span>
              Device Code Flow
            </ActionButton>
            <ActionButton to="/auto-discover">
              <span>🔍</span>
              Discovery
            </ActionButton>
            <ActionButton to="/configuration">
              <span>⚙️</span>
              Configuration
            </ActionButton>
          </QuickActions>
        </ContentCard>

        {/* Recent Activity */}
        <ContentCard>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          
          <RecentActivity>
            {activityItems.length > 0 ? (
              activityItems.map((item) => (
                <ActivityItem key={item.id}>
                  <ActivityIcon $type={item.type}>{item.icon}</ActivityIcon>
                  <ActivityContent>
                    <ActivityTitle>{item.title}</ActivityTitle>
                    <ActivityTime>{item.time}</ActivityTime>
                  </ActivityContent>
                </ActivityItem>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: '2rem', fontStyle: 'italic' }}>
                No recent activity
              </div>
            )}
          </RecentActivity>
        </ContentCard>
      </div>

      {/* Bottom Section - Current Session and Environment Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Current Session */}
        <ContentCard $shaded={true}>
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
          </CardHeader>

          <FlowStatus>
            <StatusBadge $status="active">Active</StatusBadge>
            <span>Authorization Code Flow</span>
          </FlowStatus>

          {tokens ? (
            <TokenInfo style={{ marginTop: '1rem' }}>
              <TokenRowWithCopy>
                <TokenRowContainer>
                  <TokenLabel>Access Token:</TokenLabel>
                  <TokenValue>
                    {tokens.access_token ? (tokens.access_token as string) : 'N/A'}
                  </TokenValue>
                </TokenRowContainer>
                {tokens.access_token && (
                  <CopyButton
                    className={copiedStates.access_token ? 'copied' : ''}
                    onClick={() => handleCopyToken('access_token', tokens.access_token as string)}
                  >
                    <FiCopy size={12} />
                    {copiedStates.access_token ? 'Copied!' : 'Copy'}
                  </CopyButton>
                )}
              </TokenRowWithCopy>
              
              <TokenRowWithCopy>
                <TokenRowContainer>
                  <TokenLabel>Refresh Token:</TokenLabel>
                  <TokenValue>
                    {tokens.refresh_token ? (tokens.refresh_token as string) : 'N/A'}
                  </TokenValue>
                </TokenRowContainer>
                {tokens.refresh_token && (
                  <CopyButton
                    className={copiedStates.refresh_token ? 'copied' : ''}
                    onClick={() => handleCopyToken('refresh_token', tokens.refresh_token as string)}
                  >
                    <FiCopy size={12} />
                    {copiedStates.refresh_token ? 'Copied!' : 'Copy'}
                  </CopyButton>
                )}
              </TokenRowWithCopy>
              
              <TokenRowWithCopy>
                <TokenRowContainer>
                  <TokenLabel>ID Token:</TokenLabel>
                  <TokenValue>
                    {tokens.id_token ? (tokens.id_token as string) : 'N/A'}
                  </TokenValue>
                </TokenRowContainer>
                {tokens.id_token && (
                  <CopyButton
                    className={copiedStates.id_token ? 'copied' : ''}
                    onClick={() => handleCopyToken('id_token', tokens.id_token as string)}
                  >
                    <FiCopy size={12} />
                    {copiedStates.id_token ? 'Copied!' : 'Copy'}
                  </CopyButton>
                )}
              </TokenRowWithCopy>
              
              <TokenRow>
                <TokenLabel>Expires:</TokenLabel>
                <TokenValue>{getTokenExpiration()}</TokenValue>
              </TokenRow>
            </TokenInfo>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
              No active tokens
            </div>
          )}
        </ContentCard>

        {/* Environment Status */}
        <ContentCard>
          <CardHeader>
            <CardTitle>Environment Status</CardTitle>
          </CardHeader>

          <FlowStatus>
            <StatusBadge $status={hasSavedCredentials ? 'active' : 'error'}>
              {hasSavedCredentials ? 'Connected' : 'Not Configured'}
            </StatusBadge>
            <span>PingOne Environment</span>
          </FlowStatus>

          {hasSavedCredentials && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#666', 
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                Environment ID:
              </div>
              <div style={{ 
                fontFamily: 'Monaco, Menlo, monospace',
                fontSize: '0.85rem',
                color: '#333',
                background: '#f8f9fa',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #e5e7eb',
                wordBreak: 'break-all'
              }}>
                {config?.environmentId}
              </div>
            </div>
          )}
        </ContentCard>
      </div>
    </DashboardContainer>
  );
};

export default Dashboard;