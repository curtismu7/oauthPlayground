// src/pages/sdk-examples/SDKExamplesHome.tsx
// SDK Examples Home Page - Main landing page for SDK examples
// Cache bust: 2025-02-17-12:45 - Fixed API Display with SuperSimpleApiDisplayV8

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useGlobalWorkerToken } from '@/hooks/useGlobalWorkerToken';
import { ShowTokenConfigCheckboxV8 } from '@/v8/components/ShowTokenConfigCheckboxV8';
import { SilentApiConfigCheckboxV8 } from '@/v8/components/SilentApiConfigCheckboxV8';
import {
	ApiDisplayCheckbox,
	SuperSimpleApiDisplayV8,
} from '@/v8/components/SuperSimpleApiDisplayV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';

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

const _APIDisplayToggle = styled.div`
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

const _ToggleButton = styled.button`
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

const _APIDisplayContainer = styled.div<{ isVisible: boolean }>`
  margin-top: 2rem;
  display: ${(props) => (props.isVisible ? 'block' : 'none')};
`;

const _EnvironmentsSection = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const _EnvironmentsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const _EnvironmentsTitle = styled.h3`
  color: #333;
  font-size: 1.5rem;
  margin: 0;
`;

const _RefreshButton = styled.button`
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

const _EnvironmentList = styled.div`
  display: grid;
  gap: 1rem;
`;

const _EnvironmentItem = styled.div`
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const _EnvironmentName = styled.div`
  font-weight: 500;
  color: #333;
`;

const _EnvironmentId = styled.div`
  font-size: 0.875rem;
  color: #666;
  font-family: monospace;
`;

const _LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-style: italic;
  justify-content: center;
  padding: 2rem;
`;

const _ErrorMessage = styled.div`
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
	// Worker token management
	const globalTokenStatus = useGlobalWorkerToken();
	const _workerToken = globalTokenStatus.token || '';
	const hasValidToken = globalTokenStatus.isValid;
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	return (
		<Container>
			<Header>SDK Examples</Header>
			<Description>
				Explore comprehensive SDK examples demonstrating PingOne integration patterns, including
				DaVinci flows, OIDC centralized login, and JWT authentication. Each example follows best
				practices and includes detailed documentation.
			</Description>

			{/* Worker Token Management */}
			<div style={{ marginBottom: '2rem' }}>
				<SilentApiConfigCheckboxV8 />
				<ShowTokenConfigCheckboxV8 />
				<ApiDisplayCheckbox />
				{!hasValidToken && (
					<button
						onClick={() => setShowWorkerTokenModal(true)}
						style={{
							background: '#3b82f6',
							color: 'white',
							border: 'none',
							padding: '0.75rem 1.5rem',
							borderRadius: '0.5rem',
							cursor: 'pointer',
							fontSize: '1rem',
							marginTop: '1rem',
							marginRight: '1rem',
						}}
					>
						Get Worker Token
					</button>
				)}
				{hasValidToken && (
					<div
						style={{
							background: '#10b981',
							color: 'white',
							padding: '0.75rem 1rem',
							borderRadius: '0.5rem',
							marginTop: '1rem',
							display: 'inline-block',
						}}
					>
						✅ Worker Token Active
					</div>
				)}
			</div>

			<ExamplesGrid>
				<ExampleCard>
					<StatusBadge status="implemented">Implemented</StatusBadge>
					<ExampleTitle>DaVinci Todo App</ExampleTitle>
					<ExampleDescription>
						Complete DaVinci flow implementation demonstrating user registration, login, MFA, and
						application management with the PingOne DaVinci SDK.
					</ExampleDescription>
					<ExampleLink to="/sdk-examples/davinci-todo-app">Explore Todo App</ExampleLink>
				</ExampleCard>

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
					<ExampleTitle>SDK Documentation</ExampleTitle>
					<ExampleDescription>
						Comprehensive documentation, usage guides, and best practices for implementing PingOne
						SDKs in your applications.
					</ExampleDescription>
					<ExampleLink to="/sdk-examples/documentation">View Documentation</ExampleLink>
				</ExampleCard>
			</ExamplesGrid>

			{/* API Display - Using the unified service */}
			<SuperSimpleApiDisplayV8 flowFilter="all" reserveSpace={true} />

			<DocumentationSection>
				<DocumentationTitle>SDK Documentation</DocumentationTitle>
				<DocumentationList>
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

			{/* Worker Token Modal */}
			{showWorkerTokenModal && (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => setShowWorkerTokenModal(false)}
				/>
			)}
		</Container>
	);
};

export default SDKExamplesHome;
