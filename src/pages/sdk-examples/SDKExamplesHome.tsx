import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

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
  display: inline-block;
  background: #007bff;
  color: #ffffff !important;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s ease;

  &:hover {
    background: #0056b3;
    color: #ffffff !important;
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

const SDKExamplesHome: React.FC = () => {
	return (
		<Container>
			<Header>SDK Examples</Header>
			<Description>
				Explore comprehensive SDK examples demonstrating PingOne integration patterns, including
				DaVinci flows, OIDC centralized login, and JWT authentication. Each example follows best
				practices and includes detailed documentation.
			</Description>

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
					<StatusBadge status="planned">Planned</StatusBadge>
					<ExampleTitle>DaVinci Todo App</ExampleTitle>
					<ExampleDescription>
						Complete todo application showcasing DaVinci dynamic form rendering, flow management,
						and integration with PingOne DaVinci services.
					</ExampleDescription>
					<ExampleLink to="/sdk-examples/davinci-todo-app">Coming Soon</ExampleLink>
				</ExampleCard>

				<ExampleCard>
					<StatusBadge status="planned">Planned</StatusBadge>
					<ExampleTitle>SDK Documentation</ExampleTitle>
					<ExampleDescription>
						Comprehensive documentation, usage guides, and best practices for implementing PingOne
						SDKs in your applications.
					</ExampleDescription>
					<ExampleLink to="/sdk-examples/documentation">View Documentation</ExampleLink>
				</ExampleCard>
			</ExamplesGrid>

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
