import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { apiCallTrackerService } from '../services/apiCallTrackerService';
import ApiCallList from '../components/ApiCallList';
import { FiSettings, FiEye, FiEyeOff } from 'react-icons/fi';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.h1`
  color: #333;
  margin-bottom: 2rem;
  font-size: 2.5rem;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 3rem;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const ExamplesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const ExampleCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }
`;

const ExampleTitle = styled.h3`
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const ExampleDescription = styled.p`
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const ExampleLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #007bff;
  color: #ffffff !important;
  padding: 0.875rem 1.75rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;

  &:hover {
    background: #0056b3;
    color: #ffffff !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const StatusBadge = styled.span<{ status: 'implemented' | 'planned' }>`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;
  
  ${(props) =>
		props.status === 'implemented'
			? `
    background: #d4edda;
    color: #155724;
  `
			: `
    background: #fff3cd;
    color: #856404;
  `}
`;

const DocumentationSection = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 2rem;
  margin-top: 3rem;
`;

const APIDisplayToggle = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #007bff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
  font-size: 0.9rem;
  font-weight: 500;

  &:hover {
    background: #f0f0f0;
  }
`;

const APIDisplayContainer = styled.div<{ isVisible: boolean }>`
  margin-top: 2rem;
  display: ${(props) => (props.isVisible ? 'block' : 'none')};
`;

const EnvironmentsSection = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const EnvironmentsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const EnvironmentsTitle = styled.h3`
  color: #333;
  font-size: 1.5rem;
  margin: 0;
`;

const RefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #28a745;
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #218838;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const EnvironmentList = styled.div`
  display: grid;
  gap: 1rem;
`;

const EnvironmentItem = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EnvironmentName = styled.div`
  font-weight: 500;
  color: #333;
`;

const EnvironmentId = styled.div`
  font-size: 0.875rem;
  color: #666;
  font-family: monospace;
`;

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-style: italic;
  justify-content: center;
  padding: 2rem;
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
`;

const DocumentationTitle = styled.h2`
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 2rem;
`;

const DocumentationList = styled.ul`
  list-style: none;
  padding: 0;
`;

const DocumentationItem = styled.li`
  margin-bottom: 1rem;
  
  a {
    color: #007bff !important;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

interface Environment {
  id: string;
  name: string;
  description?: string;
}

const SDKExamplesHome: React.FC = () => {
  const [showAPIDisplay, setShowAPIDisplay] = useState(false);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoadingEnvs, setIsLoadingEnvs] = useState(false);
  const [envError, setEnvError] = useState<string | null>(null);

  // Load environments on component mount
  useEffect(() => {
    loadEnvironments();
  }, [loadEnvironments]);

  const loadEnvironments = useCallback(async () => {
    setIsLoadingEnvs(true);
    setEnvError(null);
    
    try {
      // Track the API call
      const callId = apiCallTrackerService.trackApiCall({
        method: 'GET',
        url: '/api/environments',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await fetch('/api/environments');
      const data = await response.json();
      
      // Update the API call with response
      apiCallTrackerService.updateApiCall(callId, {
        response: {
          status: response.status,
          statusText: response.statusText,
          data: data,
        },
      });
      
      if (response.ok) {
        setEnvironments(data.environments || []);
      } else {
        throw new Error(data.error || 'Failed to load environments');
      }
    } catch (error) {
      console.error('Failed to load environments:', error);
      setEnvError(error instanceof Error ? error.message : 'Unknown error');
      // Set empty array to prevent crashes
      setEnvironments([]);
    } finally {
      setIsLoadingEnvs(false);
    }
  }, []);

  return (
    <Container>
      <APIDisplayToggle>
        <FiSettings size={18} />
        <span>API Display</span>
        <ToggleButton onClick={() => setShowAPIDisplay(!showAPIDisplay)}>
          {showAPIDisplay ? <FiEyeOff size={16} /> : <FiEye size={16} />}
          {showAPIDisplay ? 'Hide' : 'Show'}
        </ToggleButton>
      </APIDisplayToggle>

      <Header>SDK Examples</Header>
      <Description>
        Explore comprehensive SDK examples demonstrating PingOne integration patterns, including
        DaVinci flows, OIDC centralized login, and JWT authentication. Each example follows best
        practices and includes detailed documentation.
      </Description>

      <EnvironmentsSection>
        <EnvironmentsHeader>
          <EnvironmentsTitle>PingOne Environments</EnvironmentsTitle>
          <RefreshButton onClick={loadEnvironments} disabled={isLoadingEnvs}>
            {isLoadingEnvs ? 'Loading...' : 'Refresh'}
          </RefreshButton>
        </EnvironmentsHeader>
        
        {envError && <ErrorMessage>Error: {envError}</ErrorMessage>}
        
        {isLoadingEnvs ? (
          <LoadingMessage>Loading environments...</LoadingMessage>
        ) : environments.length === 0 ? (
          <LoadingMessage>No environments found. Please configure your PingOne environments.</LoadingMessage>
        ) : (
          <EnvironmentList>
            {environments.map((env) => (
              <EnvironmentItem key={env.id}>
                <div>
                  <EnvironmentName>{env.name}</EnvironmentName>
                  <EnvironmentId>ID: {env.id}</EnvironmentId>
                </div>
              </EnvironmentItem>
            ))}
          </EnvironmentList>
        )}
      </EnvironmentsSection>

      <ExamplesGrid>
        <ExampleCard>
          <StatusBadge status="implemented">Implemented</StatusBadge>
          <ExampleTitle>JWT Authentication</ExampleTitle>
          <ExampleDescription>
            Complete JWT implementation with private key and client secret JWT generation, token
            validation, and secure key management using the jose library.
          </ExampleDescription>
          <ExampleLink to="/sdk-examples/jwt-authentication">Explore JWT Examples</ExampleLink>
        </ExampleCard>

        <ExampleCard>
          <StatusBadge status="implemented">Implemented</StatusBadge>
          <ExampleTitle>OIDC Centralized Login</ExampleTitle>
          <ExampleDescription>
            Demonstrate server-side UI authentication using the PingOne OIDC SDK with redirect
            flows, background token renewal, and secure session management.
          </ExampleDescription>
          <ExampleLink to="/sdk-examples/oidc-centralized-login">Explore OIDC Examples</ExampleLink>
        </ExampleCard>

        <ExampleCard>
          <StatusBadge status="implemented">Implemented</StatusBadge>
          <ExampleTitle>DaVinci Todo App</ExampleTitle>
          <ExampleDescription>
            Complete todo application showcasing DaVinci dynamic form rendering, flow management,
            and integration with PingOne DaVinci services.
          </ExampleDescription>
          <ExampleLink to="/sdk-examples/davinci-todo-app">Explore Todo App</ExampleLink>
        </ExampleCard>

        <ExampleCard>
          <StatusBadge status="implemented">Implemented</StatusBadge>
          <ExampleTitle>SDK Documentation</ExampleTitle>
          <ExampleDescription>
            Comprehensive documentation, usage guides, and best practices for implementing PingOne
            SDKs in your applications.
          </ExampleDescription>
          <ExampleLink to="/sdk-examples/documentation">View Documentation</ExampleLink>
        </ExampleCard>
      </ExamplesGrid>

      <APIDisplayContainer isVisible={showAPIDisplay}>
        <ApiCallList />
      </APIDisplayContainer>

      <DocumentationSection>
        <DocumentationTitle>SDK Documentation</DocumentationTitle>
        <DocumentationList>
          <DocumentationItem>
            <a href="/SDK_EXAMPLES_INVENTORY.md" target="_blank" rel="noopener noreferrer">
              SDK Examples Inventory - Complete tracking of all SDK implementations
            </a>
          </DocumentationItem>
          <DocumentationItem>
            <a href="/SDK_EXAMPLES_GUIDE.md" target="_blank" rel="noopener noreferrer">
              SDK Usage Guide - Comprehensive usage examples and best practices
            </a>
          </DocumentationItem>
          <DocumentationItem>
            <a href="/SWE-15_UNIFIED_MFA_GUIDE.md" target="_blank" rel="noopener noreferrer">
              SWE-15 Development Guide - Software engineering best practices
            </a>
          </DocumentationItem>
          <DocumentationItem>
            <a
              href="https://docs.pingidentity.com/sdks/latest/"
              target="_blank"
              rel="noopener noreferrer"
            >
              PingOne SDK Documentation - Official PingOne SDK documentation
            </a>
          </DocumentationItem>
        </DocumentationList>
      </DocumentationSection>
    </Container>
  );
};

export default SDKExamplesHome;
