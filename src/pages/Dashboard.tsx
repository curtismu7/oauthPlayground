import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, CardFooter } from '../components/Card';
import { FiCode, FiLock, FiUser, FiSettings, FiInfo, FiCheckCircle, FiPlay, FiBook, FiShield, FiClock, FiActivity, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../contexts/NewAuthContext';
import { getOAuthTokens } from '../utils/tokenStorage';
import { getRecentActivity } from '../utils/activityTracker';


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

const ActivityList = styled.div`
  .activity-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f3f4f6;
    
    &:last-child {
      border-bottom: none;
    }
    
    svg {
      font-size: 1rem;
      color: #6b7280;
    }
    
    .activity-content {
      flex: 1;
      
      .activity-title {
        font-size: 0.875rem;
        font-weight: 500;
        color: #1f2937;
        margin: 0 0 0.25rem 0;
      }
      
      .activity-time {
        font-size: 0.75rem;
        color: #6b7280;
        margin: 0;
      }
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

const Dashboard = () => {
  const { isAuthenticated, config } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const infoMessage = (location.state as any)?.message as string | undefined;
  const infoType = ((location.state as any)?.type as 'success' | 'error' | 'warning' | 'info' | undefined) || 'info';

  // Check if there are saved credentials
  const hasSavedCredentials = config && config.environmentId && config.clientId;

  useEffect(() => {
    // Load tokens and recent activity
    const loadDashboardData = async () => {
      try {
        const storedTokens = getOAuthTokens();
        setTokens(storedTokens);
        
        // Load recent activity using the activity tracker
        const activity = getRecentActivity();
        setRecentActivity(activity.slice(0, 5)); // Show last 5 activities
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    loadDashboardData();
  }, []);

  const refreshDashboard = async () => {
    setIsRefreshing(true);
    try {
      const storedTokens = getOAuthTokens();
      setTokens(storedTokens);
      
      const activity = getRecentActivity();
      setRecentActivity(activity.slice(0, 5));
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
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
      description: 'Explore different OAuth 2.0 authorization flows including Authorization Code, Implicit, Client Credentials, and more.',
      link: '/flows',
    },
    {
      icon: <FiUser />,
      title: 'OpenID Connect',
      description: 'Learn about OpenID Connect and how it extends OAuth 2.0 with authentication and identity features.',
      link: '/oidc',
    },
    {
      icon: <FiBook />,
      title: 'Documentation',
      description: 'Comprehensive guides and tutorials for OAuth 2.0 and OpenID Connect implementation.',
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

      {/* Status Overview */}
      <StatusCard>
        <CardBody>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>System Status</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={refreshDashboard}
                disabled={isRefreshing}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#6b7280',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
              >
                <FiRefreshCw style={{ 
                  fontSize: '1rem', 
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                }} />
              </button>
              <FiActivity style={{ fontSize: '1.5rem', color: '#3b82f6' }} />
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
              {feature.icon}
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <Link 
                to={feature.link}
                className="mt-auto inline-flex items-center text-sm font-medium text-primary hover:text-primary-dark"
              >
                Learn more
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
    </DashboardContainer>
  );
};

export default Dashboard;
