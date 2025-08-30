import React from 'react';
import styled from 'styled-components';
import { useLocation, Link } from 'react-router-dom';
import { Card, CardHeader, CardBody, CardFooter } from '../components/Card';
import { FiCode, FiLock, FiUser, FiSettings, FiInfo, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useOAuth } from '../contexts/OAuthContext';

const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
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

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const { config } = useOAuth();
  const location = useLocation();
  const infoMessage = (location.state as any)?.message as string | undefined;
  const infoType = ((location.state as any)?.type as 'success' | 'error' | 'warning' | 'info' | undefined) || 'info';

  // Check if there are saved credentials
  const hasSavedCredentials = config && config.environmentId && config.clientId;

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
      icon: <FiLock />,
      title: 'Configuration',
      description: 'Configure your PingOne environment and security settings for testing OAuth flows.',
      link: '/configuration',
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

      {isAuthenticated && hasSavedCredentials && (
        <Card accent="success" className="mb-6">
          <CardBody>
            <div className="flex items-start">
              <FiCheckCircle className="text-green-500 text-xl mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900">Configuration Loaded</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Your PingOne environment is configured and ready. You can now explore OAuth 2.0 flows and OpenID Connect features.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div style={{ paddingBottom: '1rem' }}></div>

      <h2 className="text-xl font-semibold mb-4">Available Features</h2>
      <div style={{ paddingBottom: '1rem' }}></div>
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

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <ol className="list-decimal pl-5 space-y-3">
              <li>Configure your PingOne environment in the Settings page</li>
              <li>Select an OAuth 2.0 flow from the navigation menu</li>
              <li>Follow the interactive guide to understand each step of the flow</li>
              <li>Inspect the requests and responses in real-time</li>
              <li>Review the documentation for detailed explanations</li>
            </ol>
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
};

export default Dashboard;
