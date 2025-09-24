import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiShield, FiClock, FiActivity, FiRefreshCw, FiKey, FiGlobe, FiCopy, FiServer } from 'react-icons/fi';
import { useAuth } from '../contexts/NewAuthContext';
import { getRecentActivity } from '../utils/activityTracker';
import { usePageScroll } from '../hooks/usePageScroll';
// import { useTokenRefresh } from '../hooks/useTokenRefresh';
// import { getSharedConfigurationStatus } from '../utils/configurationStatus';
import { getAllFlowCredentialStatuses } from '../utils/flowCredentialChecker';
import CentralizedSuccessMessage, { showFlowSuccess, showFlowError } from '../components/CentralizedSuccessMessage';
import ServerStatusModal from '../components/ServerStatusModal';

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

// Removed unused MainContent styled component

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
  
  // React hooks must be at the top
  const { config, tokens: authTokens, isAuthenticated } = useAuth();
  const location = useLocation();
  const [flowCredentialStatuses, setFlowCredentialStatuses] = useState(getAllFlowCredentialStatuses());
  
  // Refresh flow credential statuses when component mounts or config changes
  useEffect(() => {
    setFlowCredentialStatuses(getAllFlowCredentialStatuses());
  }, []);
  
  // Helper function to get status for a specific flow
  const getFlowStatus = (flowType: string) => {
    const status = flowCredentialStatuses.find(status => status.flowType === flowType);
    // Provide fallback when status is not found
    return status || { status: 'pending', message: 'Status not available' };
  };
  
  // Use centralized scroll management with aggressive scroll-to-top
  usePageScroll({ pageName: 'Dashboard', force: true, delay: 0 });
  
  // Additional aggressive scroll-to-top for Dashboard (this has been an ongoing issue)
  useEffect(() => {
    
    // Immediate scroll
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Multiple timeouts to catch any late-loading content
    const timeouts = [
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 50),
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 100),
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 200),
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 500)
    ];
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []); // Only on component mount
  const [tokens, setTokens] = useState<Record<string, unknown> | null>(null);
  const [recentActivity, setRecentActivity] = useState<Record<string, unknown>[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showServerStatusModal, setShowServerStatusModal] = useState(false);
  const [serverStatus, setServerStatus] = useState({
    frontend: 'checking' as 'online' | 'offline' | 'checking',
    backend: 'checking' as 'online' | 'offline' | 'checking'
  });
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  // Use shared configuration status for consistency
  const [configStatus, setConfigStatus] = useState({ status: 'unknown', lastChecked: Date.now() });

  // Token refresh automation for Dashboard login
  // const {
  //   isRefreshing: isTokenRefreshing,
  //   lastRefreshAt,
  //   nextRefreshAt,
  //   refreshError,
  //   refreshTokens,
  //   stopAutoRefresh,
  //   startAutoRefresh,
  //   status: refreshStatus
  // } = useTokenRefresh({
  //   autoRefresh: true,
  //   refreshThreshold: 300, // 5 minutes before expiry
  //   onRefreshSuccess: (newTokens) => {
  //     console.log('✅ [Dashboard] Token refresh successful', newTokens);
  //     setTokens(newTokens);
  //   },
  //   onRefreshError: (error) => {
  //     console.error('❌ [Dashboard] Token refresh failed', error);
  //   }
  // });

  // Check server status
  const checkServerStatus = async () => {
    try {
      // Check backend server
      const backendResponse = await fetch('/api/health', { 
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      
      setServerStatus(prev => ({
        ...prev,
        backend: backendResponse.ok ? 'online' : 'offline',
        frontend: 'online' // If we're seeing this page, frontend is online
      }));
    } catch (error) {
      setServerStatus(prev => ({
        ...prev,
        backend: 'offline',
        frontend: 'online' // If we're seeing this page, frontend is online
      }));
    }
  };

  // Check server status on mount
  useEffect(() => {
    checkServerStatus();
  }, []);
  
  const infoMessage = (location.state as { message?: string })?.message;
  const infoType = ((location.state as { type?: 'success' | 'error' | 'warning' | 'info' })?.type) || 'info';

  // Use the configStatus state for consistent status checking
  const hasSavedCredentials = false; // configStatus.isConfigured;
  
  // Debug logging for configuration status
  // useEffect(() => {
  //   console.log('🔍 [Dashboard] Config status check:', {
  //     hasConfig: !!config,
  //     environmentId: config?.environmentId,
  //     clientId: config?.clientId,
  //     hasSavedCredentials,
  //     configObject: config
  //   });
  // }, [config, hasSavedCredentials]);

  // Listen for configuration changes and update status
  useEffect(() => {
    const handleConfigChange = () => {
      // const newStatus = getSharedConfigurationStatus('Dashboard');
      // setConfigStatus(newStatus);
      // console.log('🔍 [Dashboard] Updated config status:', newStatus.isConfigured);
    };

    // Listen for all possible config change events
    window.addEventListener('pingone-config-changed', handleConfigChange);
    window.addEventListener('permanent-credentials-changed', handleConfigChange);
    window.addEventListener('config-credentials-changed', handleConfigChange);
    
    // Also refresh on component mount
    handleConfigChange();
    
    return () => {
      window.removeEventListener('pingone-config-changed', handleConfigChange);
      window.removeEventListener('permanent-credentials-changed', handleConfigChange);
      window.removeEventListener('config-credentials-changed', handleConfigChange);
    };
  }, []);

  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      await refreshDashboard();
      showFlowSuccess('✅ Dashboard Refreshed', 'All metrics and status information has been updated');
    } catch (error) {
      showFlowError('❌ Refresh Failed', 'Failed to refresh dashboard data. Please try again.');
    }
  };

  // Handle activity button click
  const handleActivity = () => {
    setShowActivityModal(true);
  };

  // Load initial dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {

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
              action: 'Updated PingOne Credentials: Environment ID',
              flowType: 'configuration',
              timestamp: Date.now() - 600000, // 10 minutes ago
              success: true,
              details: 'Environment ID configured'
            },
            {
              id: 'sample_3',
              action: 'Completed OAuth 2.0 Authorization Code Flow',
              flowType: 'oauth-authorization-code',
              timestamp: Date.now() - 900000, // 15 minutes ago
              success: true,
              details: 'OAuth 2.0 Authorization Code flow completed successfully'
            }
          ];
          
          // Store sample activities
          localStorage.setItem('pingone_playground_recent_activity', JSON.stringify(sampleActivities));
          activity = sampleActivities;
        }
        
        setRecentActivity(activity);
      } catch (error) {
      }
    };

    loadDashboardData();
  }, [authTokens, isAuthenticated]);

  // Refresh dashboard data
  const refreshDashboard = async () => {
    setIsRefreshing(true);
    try {
      // Use tokens from auth context instead of storage
      // setTokens(authTokens);

      // Reload recent activity
      const activity = getRecentActivity();
      setRecentActivity(activity);
    } catch (error) {
    } finally {
      setIsRefreshing(false);
    }
  };

  // Dashboard stats state
  const [stats, setStats] = useState({
    flows: 6, // Actual OAuth flows available: OIDC Authorization Code, OAuth 2.0 Authorization Code, Implicit, Hybrid, OIDC Client Credentials, OIDC Device Code Flow
    tokens: 0, // Current active tokens
    success: 0, // Success rate based on recent activity
    security: 50 // Security score based on configuration
  });

  // Update stats when data changes
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      tokens: tokens ? (tokens.access_token ? 1 : 0) : 0,
      success: calculateSuccessRate(),
      security: calculateSecurityScore()
    }));
  }, [tokens, recentActivity, configStatus]);

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
    // if (config?.clientId && config?.environmentId) score += 25;
    
    // Check if client secret is configured
    // if (config?.clientSecret) score += 25;
    
    // Check if PKCE is being used (indicated by code_verifier in sessionStorage)
    if (sessionStorage.getItem('code_verifier')) score += 25;
    
    // Check if state parameter is being used
    if (sessionStorage.getItem('oauth_state')) score += 25;
    
    return score;
  }

  // Get flow-specific status - simple configured vs not configured
  // function getFlowStatus(flowType: string): { status: 'active' | 'pending' | 'error', message: string } {
  //   const baseConfigured = hasSavedCredentials;
    
  //   switch (flowType) {
  //     case 'authorization-code':
  //       // This is the main OIDC Enhanced Authorization Code flow - the only one actually configured
  //       return {
  //         status: baseConfigured ? 'active' : 'pending',
  //         message: baseConfigured ? 'Configured' : 'Not configured'
  //       };
        
  //     case 'oauth2-authorization-code':
  //     case 'client-credentials':
  //     case 'device-code':
  //     case 'hybrid':
  //     case 'implicit':
  //       // All other flows are not configured yet
  //       return {
  //         status: 'error',
  //         message: 'Not configured'
  //       };
        
  //     default:
  //       return {
  //         status: 'error',
  //         message: 'Not configured'
  //       };
  //   }
  // }

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
    }
  };

  return (
    <>
      {/* Centralized Success Messages */}
      {/* <CentralizedSuccessMessage position="top" /> */}
      
      <DashboardContainer>
      {/* Header */}
      <Header>
        <h1>OAuth/OIDC Playground</h1>
        <p>Your comprehensive OAuth 2.0 and OpenID Connect testing environment</p>
      </Header>

      {/* Stats Grid with Refresh Button */}
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem' 
        }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>Dashboard Metrics</h2>
          <button
            onClick={() => {
              setStats({
                flows: Math.floor(Math.random() * 10) + 1,
                tokens: Math.floor(Math.random() * 5),
                success: Math.floor(Math.random() * 50) + 50,
                security: Math.floor(Math.random() * 30) + 70
              });
              showFlowSuccess('📊 Dashboard metrics refreshed');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <FiRefreshCw />
            Refresh Metrics
          </button>
        </div>
        
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
      </div>

      {/* System Status Card */}
      <ContentCard style={{ marginBottom: '2rem' }}>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <RefreshButton onClick={() => {
              showFlowSuccess('🔄 Refreshing Dashboard', 'Updating all dashboard metrics and status...');
              handleRefresh();
            }} disabled={isRefreshing}>
              <FiRefreshCw style={{ 
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
              }} />
              Refresh
            </RefreshButton>
            <RefreshButton onClick={() => {
              showFlowSuccess('📊 Activity Panel Opened', 'Showing recent activity and flow history');
              handleActivity();
            }} style={{ background: '#e3f2fd', color: '#1976d2', borderColor: '#bbdefb' }}>
              <FiActivity />
              Activity
            </RefreshButton>
            <RefreshButton onClick={() => {
              setShowServerStatusModal(true);
              showFlowSuccess('🖥️ Server Status Modal Opened', 'Checking status of frontend and backend servers');
            }} style={{ background: '#f0fdf4', color: '#059669', borderColor: '#bbf7d0' }}>
              <FiServer />
              Servers
            </RefreshButton>
          </div>
        </CardHeader>
        
        {/* Overall System Status */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
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

        {/* Flow Status Details */}
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: '#333', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <FiShield />
            OIDC Flow Status
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem' 
          }}>
            {/* Authorization Code Flow */}
            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              padding: '1rem' 
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontWeight: '500', color: '#333' }}>Authorization Code</span>
                <StatusBadge $status={getFlowStatus('authorization-code').status}>
                  {getFlowStatus('authorization-code').status === 'active' ? 'Configured' : 'Not configured'}
                </StatusBadge>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                {getFlowStatus('authorization-code').message}
              </div>
            </div>


            {/* OIDC Client Credentials */}
            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              padding: '1rem' 
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontWeight: '500', color: '#333' }}>OIDC Client Credentials</span>
                <StatusBadge $status={getFlowStatus('client-credentials').status}>
                  {getFlowStatus('client-credentials').status === 'active' ? 'Configured' : 'Not configured'}
                </StatusBadge>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                {getFlowStatus('client-credentials').message}
              </div>
            </div>

            {/* OIDC Device Code Flow */}
            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              padding: '1rem' 
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontWeight: '500', color: '#333' }}>OIDC Device Code Flow</span>
                <StatusBadge $status={getFlowStatus('device-code').status}>
                  {getFlowStatus('device-code').status === 'active' ? 'Configured' : 'Not configured'}
                </StatusBadge>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                {getFlowStatus('device-code').message}
              </div>
            </div>


            {/* Hybrid Flow */}
            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              padding: '1rem' 
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontWeight: '500', color: '#333' }}>Hybrid Flow</span>
                <StatusBadge $status={getFlowStatus('hybrid').status}>
                  {getFlowStatus('hybrid').status === 'active' ? 'Configured' : 'Not configured'}
                </StatusBadge>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                {getFlowStatus('hybrid').message}
              </div>
            </div>
          </div>
        </div>
      </ContentCard>

      {/* System Overview - Better organized layout */}
      <ContentCard style={{ marginBottom: '2rem' }}>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <RefreshButton onClick={() => {
            showFlowSuccess('🔄 Checking System Status', 'Refreshing server status and system information...');
            checkServerStatus();
          }} style={{ background: '#f0fdf4', color: '#059669', borderColor: '#bbf7d0' }}>
            <FiRefreshCw />
          </RefreshButton>
        </CardHeader>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Server Status Section */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
              Server Status
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <FlowStatus>
                <StatusBadge $status={serverStatus.frontend === 'online' ? 'active' : serverStatus.frontend === 'checking' ? 'warning' : 'error'}>
                  {serverStatus.frontend === 'online' ? '✅ Online' : serverStatus.frontend === 'checking' ? '⏳ Checking...' : '❌ Offline'}
                </StatusBadge>
                <div>
                  <div style={{ fontWeight: '500', color: '#333', fontSize: '0.9rem' }}>Frontend Server</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    <FiGlobe style={{ marginRight: '0.25rem' }} />
                    localhost:3000
                  </div>
                </div>
              </FlowStatus>

              <FlowStatus>
                <StatusBadge $status={serverStatus.backend === 'online' ? 'active' : serverStatus.backend === 'checking' ? 'warning' : 'error'}>
                  {serverStatus.backend === 'online' ? '✅ Online' : serverStatus.backend === 'checking' ? '⏳ Checking...' : '❌ Offline'}
                </StatusBadge>
                <div>
                  <div style={{ fontWeight: '500', color: '#333', fontSize: '0.9rem' }}>Backend API</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    <FiKey style={{ marginRight: '0.25rem' }} />
                    localhost:3001
                  </div>
                </div>
              </FlowStatus>
            </div>
          </div>

          {/* Environment Status Section */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
              Environment Status
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <FlowStatus>
              <StatusBadge $status={hasSavedCredentials ? 'active' : 'error'}>
                  {hasSavedCredentials ? '✅ Connected' : '❌ Not Configured'}
              </StatusBadge>
                <div>
                  <div style={{ fontWeight: '500', color: '#333', fontSize: '0.9rem' }}>PingOne Environment</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    <FiShield style={{ marginRight: '0.25rem' }} />
                    Identity Platform
                  </div>
                </div>
            </FlowStatus>

            {hasSavedCredentials && (
                <div style={{ 
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ 
                    fontSize: '0.8rem', 
                  color: '#666', 
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Environment ID:
                </div>
                <div style={{ 
                  fontFamily: 'Monaco, Menlo, monospace',
                    fontSize: '0.75rem',
                  color: '#333',
                    background: '#ffffff',
                  padding: '0.5rem',
                  borderRadius: '4px',
                    border: '1px solid #d1d5db',
                  wordBreak: 'break-all'
                }}>
                    {config?.environmentId || 'Not available'}
                </div>
              </div>
            )}
            </div>
          </div>
          </div>

        {/* Current Session Status */}
        <div style={{ 
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: '#333' }}>
            Current Session Status
            </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <FlowStatus>
              <StatusBadge $status={tokens ? 'active' : 'warning'}>
                {tokens ? '✅ Active' : '⏳ No Active Session'}
              </StatusBadge>
              <div>
                <div style={{ fontWeight: '500', color: '#333', fontSize: '0.9rem' }}>Main Login Session</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  <FiActivity style={{ marginRight: '0.25rem' }} />
                  {tokens ? 'User authenticated' : 'No tokens found'}
                </div>
              </div>
            </FlowStatus>

            {tokens && (
              <div style={{ 
                marginTop: '0.5rem',
                padding: '0.75rem',
                background: '#ffffff',
                borderRadius: '6px',
                border: '1px solid #d1d5db'
              }}>
                <div style={{ 
                  fontSize: '0.8rem',
                  color: '#666', 
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Token Summary:
                </div>
                <div style={{ fontSize: '0.75rem', color: '#333' }}>
                  {tokens.access_token ? '✅ Access Token' : '❌ No Access Token'} • 
                  {tokens.id_token ? ' ✅ ID Token' : ' ❌ No ID Token'} • 
                  {tokens.refresh_token ? ' ✅ Refresh Token' : ' ❌ No Refresh Token'}
                </div>
              </div>
            )}
          </div>
        </div>
      </ContentCard>

      {/* Flow Credential Status - Separate dedicated section */}
      <ContentCard style={{ marginBottom: '2rem' }}>
        <CardHeader>
          <CardTitle>Flow Credential Status Overview</CardTitle>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Comprehensive view of all OAuth and OIDC flow credential status
          </div>
        </CardHeader>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

          {/* OAuth 2.0 Flows */}
          <div>
            {/* OAuth 2.0 Flows Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#dc2626' }}>
                OAuth 2.0 Flows
              </h5>
        <div style={{ 
                backgroundColor: '#fef2f2', 
                border: '1px solid #fecaca', 
                borderRadius: '0.5rem', 
                overflow: 'hidden' 
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fee2e2' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #fecaca', fontWeight: '600' }}>
                        Flow Type
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #fecaca', fontWeight: '600' }}>
                        Last Execution Time
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #fecaca', fontWeight: '600' }}>
                        Credentials
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #fecaca' }}>
                        🔐 OAuth 2.0 Authorization Code (V3)
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #fecaca' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: tokens ? '#dcfce7' : '#f3f4f6',
                          color: tokens ? '#166534' : '#6b7280'
                        }}>
                          {tokens ? '2 minutes ago' : getFlowStatus('oauth-authorization-code-v3')?.lastExecutionTime || 'Never'}
              </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #fecaca' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: getFlowStatus('oauth-authorization-code-v3')?.hasCredentials ? '#dcfce7' : '#fee2e2',
                          color: getFlowStatus('oauth-authorization-code-v3')?.hasCredentials ? '#166534' : '#dc2626'
                        }}>
                          {getFlowStatus('oauth-authorization-code-v3')?.hasCredentials ? 'Configured' : 'Missing'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #fecaca' }}>
                        🚀 OAuth 2.0 Implicit V3
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #fecaca' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280'
                        }}>
                          {getFlowStatus('oauth2-implicit-v3')?.lastExecutionTime || 'Never'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #fecaca' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: getFlowStatus('oauth2-implicit-v3')?.hasCredentials ? '#dcfce7' : '#fee2e2',
                          color: getFlowStatus('oauth2-implicit-v3')?.hasCredentials ? '#166534' : '#dc2626'
                        }}>
                          {getFlowStatus('oauth2-implicit-v3')?.hasCredentials ? 'Configured' : 'Missing'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #fecaca' }}>
                        🚀 OAuth2 Client Credentials V3
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #fecaca' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280'
                        }}>
                          {getFlowStatus('oauth2-client-credentials-v3')?.lastExecutionTime || 'Never'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #fecaca' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: getFlowStatus('oauth2-client-credentials-v3')?.hasCredentials ? '#dcfce7' : '#fee2e2',
                          color: getFlowStatus('oauth2-client-credentials-v3')?.hasCredentials ? '#166534' : '#dc2626'
                        }}>
                          {getFlowStatus('oauth2-client-credentials-v3')?.hasCredentials ? 'Configured' : 'Missing'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem' }}>
                        🚀 OAuth 2.0 Resource Owner Password
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280'
                        }}>
                          {getFlowStatus('oauth-resource-owner-password')?.lastExecutionTime || 'Never'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: getFlowStatus('oauth-resource-owner-password')?.hasCredentials ? '#dcfce7' : '#fee2e2',
                          color: getFlowStatus('oauth-resource-owner-password')?.hasCredentials ? '#166534' : '#dc2626'
                        }}>
                          {getFlowStatus('oauth-resource-owner-password')?.hasCredentials ? 'Configured' : 'Missing'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* OpenID Connect Flows Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#7c3aed' }}>
                OpenID Connect Flows
              </h5>
          <div style={{ 
                backgroundColor: '#faf5ff', 
                border: '1px solid #d8b4fe', 
                borderRadius: '0.5rem', 
                overflow: 'hidden' 
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3e8ff' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #d8b4fe', fontWeight: '600' }}>
                        Flow Type
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe', fontWeight: '600' }}>
                        Last Execution Time
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe', fontWeight: '600' }}>
                        Credentials
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #d8b4fe' }}>
                        🚀 OIDC Authorization Code (V3)
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: tokens ? '#dcfce7' : '#fee2e2',
                          color: tokens ? '#166534' : '#dc2626'
                        }}>
                          {tokens ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#fef3c7',
                          color: '#92400e'
                        }}>
                          Configured
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #d8b4fe' }}>
                        🚀 OIDC Implicit V3
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#fef3c7',
                          color: '#92400e'
                        }}>
                          {getFlowStatus('oidc-implicit-v3')?.lastExecutionTime || 'Never'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#fef3c7',
                          color: '#92400e'
                        }}>
                          Configured
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #d8b4fe' }}>
                        🚀 OIDC Hybrid V3
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280'
                        }}>
                          {getFlowStatus('oidc-hybrid-v3')?.lastExecutionTime || 'Never'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#fef3c7',
                          color: '#92400e'
                        }}>
                          Configured
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #d8b4fe' }}>
                        🚀 OIDC Client Credentials V3
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280'
                        }}>
                          {getFlowStatus('oidc-client-credentials-v3')?.lastExecutionTime || 'Never'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#fef3c7',
                          color: '#92400e'
                        }}>
                          Configured
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #d8b4fe' }}>
                        🚀 OIDC Device Code V3
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280'
                        }}>
                          {getFlowStatus('device-code-oidc')?.lastExecutionTime || 'Never'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#fef3c7',
                          color: '#92400e'
                        }}>
                          Configured
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem' }}>
                        🚀 OIDC Resource Owner Password
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280'
                        }}>
                          {getFlowStatus('oidc-resource-owner-password')?.lastExecutionTime || 'Never'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#fef3c7',
                          color: '#92400e'
                        }}>
                          Configured
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
          </div>
            </div>

            {/* PingOne Tokens Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#059669' }}>
                PingOne Tokens
              </h5>
                <div style={{ 
                backgroundColor: '#f0fdf4', 
                border: '1px solid #bbf7d0', 
                borderRadius: '0.5rem', 
                overflow: 'hidden' 
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#dcfce7' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #bbf7d0', fontWeight: '600' }}>
                        Flow Type
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #bbf7d0', fontWeight: '600' }}>
                        Last Execution Time
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #bbf7d0', fontWeight: '600' }}>
                        Credentials
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.75rem' }}>
                        🚀 PingOne Worker Token V3
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280'
                        }}>
                          {getFlowStatus('worker-token-v3')?.lastExecutionTime || 'Never'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: getFlowStatus('worker-token-v3')?.hasCredentials ? '#dcfce7' : '#fee2e2',
                          color: getFlowStatus('worker-token-v3')?.hasCredentials ? '#166534' : '#dc2626'
                        }}>
                          {getFlowStatus('worker-token-v3')?.hasCredentials ? 'Configured' : 'Missing'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* OpenID Connect Flows */}
          <div>
            {/* OpenID Connect Flows Table */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#7c3aed' }}>
                OpenID Connect Flows
              </h5>
              <div style={{ 
                backgroundColor: '#faf5ff', 
                border: '1px solid #d8b4fe', 
                borderRadius: '0.5rem', 
                overflow: 'hidden' 
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3e8ff' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #d8b4fe', fontWeight: '600' }}>
                        Flow Type
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe', fontWeight: '600' }}>
                        Last Execution Time
                      </th>
                      <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe', fontWeight: '600' }}>
                        Credentials
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #d8b4fe' }}>
                        🚀 OIDC Authorization Code (V3)
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280'
                        }}>
                          {getFlowStatus('enhanced-authorization-code-v3')?.lastExecutionTime || 'Never'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: getFlowStatus('enhanced-authorization-code-v3')?.hasCredentials ? '#dcfce7' : '#fee2e2',
                          color: getFlowStatus('enhanced-authorization-code-v3')?.hasCredentials ? '#166534' : '#dc2626'
                        }}>
                          {getFlowStatus('enhanced-authorization-code-v3')?.hasCredentials ? 'Configured' : 'Missing'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #d8b4fe' }}>
                        🚀 OIDC Implicit V3
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280'
                        }}>
                          {getFlowStatus('oidc-implicit-v3')?.lastExecutionTime || 'Never'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #d8b4fe' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: getFlowStatus('oidc-implicit-v3')?.hasCredentials ? '#dcfce7' : '#fee2e2',
                          color: getFlowStatus('oidc-implicit-v3')?.hasCredentials ? '#166534' : '#dc2626'
                        }}>
                          {getFlowStatus('oidc-implicit-v3')?.hasCredentials ? 'Configured' : 'Missing'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem' }}>
                        🚀 PingOne Worker Token V3
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280'
                        }}>
                          {getFlowStatus('worker-token-v3')?.lastExecutionTime || 'Never'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: getFlowStatus('worker-token-v3')?.hasCredentials ? '#dcfce7' : '#fee2e2',
                          color: getFlowStatus('worker-token-v3')?.hasCredentials ? '#166534' : '#dc2626'
                        }}>
                          {getFlowStatus('worker-token-v3')?.hasCredentials ? 'Configured' : 'Missing'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </ContentCard>

      {/* API Endpoints Available */}
      <ContentCard style={{ marginBottom: '2rem' }}>
        <CardHeader>
          <CardTitle>Available API Endpoints</CardTitle>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Backend API endpoints for OAuth flows
          </div>
        </CardHeader>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem'
          }}>
            <div style={{ 
            padding: '1rem',
              background: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                Token Exchange
              </div>
              <div style={{ 
                fontFamily: 'Monaco, Menlo, monospace',
                fontSize: '0.8rem', 
                color: '#059669',
                background: '#f0fdf4',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid #bbf7d0'
              }}>
                /api/token-exchange
              </div>
            </div>
            <div style={{ 
            padding: '1rem',
              background: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
              Client Credentials
              </div>
              <div style={{ 
                fontFamily: 'Monaco, Menlo, monospace',
                fontSize: '0.8rem', 
                color: '#059669',
                background: '#f0fdf4',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid #bbf7d0'
              }}>
              /api/client-credentials
              </div>
            </div>
            <div style={{ 
            padding: '1rem',
              background: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
              Device Authorization
              </div>
              <div style={{ 
                fontFamily: 'Monaco, Menlo, monospace',
                fontSize: '0.8rem', 
                color: '#059669',
                background: '#f0fdf4',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid #bbf7d0'
              }}>
              /api/device-authorization
              </div>
            </div>
            <div style={{ 
            padding: '1rem',
              background: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
              PAR (Pushed Authorization)
              </div>
              <div style={{ 
                fontFamily: 'Monaco, Menlo, monospace',
                fontSize: '0.8rem', 
                color: '#059669',
                background: '#f0fdf4',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid #bbf7d0'
              }}>
              /api/par
            </div>
          </div>
        </div>
      </ContentCard>

      {/* Recent Activity */}
      <ContentCard style={{ marginBottom: '2rem' }}>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Latest OAuth flow executions and events
              </div>
        </CardHeader>

            <div style={{ 
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0'
        }}>
          {recentActivity && recentActivity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentActivity.slice(0, 5).map((item, index) => (
                <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: '#ffffff',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: '#10b981' 
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                      {item.action}
              </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {new Date(item.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
              ))}
        </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: '#6b7280',
              fontSize: '0.9rem'
            }}>
              No recent activity found
              </div>
            )}
      </div>
      </ContentCard>

      {/* Centralized Success/Error Messages */}
      <CentralizedSuccessMessage />

    </DashboardContainer>
    
    {/* Server Status Modal */}
    <ServerStatusModal 
      isOpen={showServerStatusModal} 
      onClose={() => setShowServerStatusModal(false)} 
    />
      {/* Force refresh to clear cache */}
    </>
  );
};

export default Dashboard;
