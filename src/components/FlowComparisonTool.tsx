import React, { useState } from 'react';
import {
	FiArrowRight,
	FiCheckCircle,
	FiClock,
	FiExternalLink,
	FiGitBranch,
	FiInfo,
	FiMinus,
	FiPlus,
	FiShield,
	FiStar,
	FiTarget,
	FiUser,
	FiXCircle,
} from '@icons';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { credentialManager } from '../utils/credentialManager';
import { Card, CardBody, CardHeader } from './Card';

interface FlowComparison {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	security: 'high' | 'medium' | 'low';
	complexity: 'low' | 'medium' | 'high';
	implementationTime: string;
	useCases: string[];
	pros: string[];
	cons: string[];
	route: string;
	recommended: boolean;
}

const ComparisonContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
`;

// Remove PageHeader since we now use FlowHeader

const FlowSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  justify-content: center;
`;

const FlowOption = styled.button<{ $selected: boolean; $added: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 2px solid ${({ $selected, $added }) =>
		$added ? '#dc2626' : $selected ? '#dc2626' : '#d1d5db'};
  border-radius: 0.5rem;
  background-color: ${({ $selected, $added }) =>
		$added ? '#fef2f2' : $selected ? '#fef2f2' : 'white'};
  color: ${({ $selected, $added }) => ($added ? '#dc2626' : $selected ? '#dc2626' : '#374151')};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #dc2626;
    background-color: #fef2f2;
    color: #dc2626;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #f9fafb;
    color: #9ca3af;
    border-color: #e5e7eb;
  }
`;

const ComparisonGrid = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ComparisonCard = styled(Card)`
  border: 2px solid ${({ theme }) => theme.colors.gray200};
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const FlowHeader = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  
  .flow-icon {
    font-size: 2.5rem;
    color: ${({ theme }) => theme.colors.primary};
    margin-bottom: 1rem;
  }
  
  .flow-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  .flow-description {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 0.875rem;
    line-height: 1.5;
  }
`;

const ComparisonSection = styled.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray700};
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const MetricItem = styled.div`
  text-align: center;
  padding: 0.75rem;
  background-color: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.5rem;
  
  .metric-label {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.gray600};
    margin-bottom: 0.25rem;
  }
  
  .metric-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

const SecurityBadge = styled.span<{ $level: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 1rem;
  
  ${({ $level }) => {
		switch ($level) {
			case 'high':
				return `
          background-color: #dcfce7;
          color: #166534;
        `;
			case 'medium':
				return `
          background-color: #fef3c7;
          color: #92400e;
        `;
			case 'low':
				return `
          background-color: #fee2e2;
          color: #991b1b;
        `;
			default:
				return `
          background-color: #f3f4f6;
          color: #374151;
        `;
		}
	}}
`;

const ComplexityBadge = styled.span<{ $level: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 1rem;
  
  ${({ $level }) => {
		switch ($level) {
			case 'low':
				return `
          background-color: #dcfce7;
          color: #166534;
        `;
			case 'medium':
				return `
          background-color: #fef3c7;
          color: #92400e;
        `;
			case 'high':
				return `
          background-color: #fee2e2;
          color: #991b1b;
        `;
			default:
				return `
          background-color: #f3f4f6;
          color: #374151;
        `;
		}
	}}
`;

const ProsConsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.5rem 0;
    font-size: 0.875rem;
    line-height: 1.4;
    
    .pros-icon {
      color: ${({ theme }) => theme.colors.success};
      font-size: 1rem;
      margin-top: 0.125rem;
      flex-shrink: 0;
    }
    
    .cons-icon {
      color: ${({ theme }) => theme.colors.error};
      font-size: 1rem;
      margin-top: 0.125rem;
      flex-shrink: 0;
    }
  }
`;

const UseCasesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  
  .use-case {
    padding: 0.25rem 0.75rem;
    background-color: ${({ theme }) => theme.colors.primary}10;
    color: ${({ theme }) => theme.colors.primary};
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
  }
`;

const ActionButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #dc2626;
  color: white !important;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
  border: 2px solid #dc2626;
  
  &:hover {
    background-color: #b91c1c;
    border-color: #b91c1c;
    color: white !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.3);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${({ theme }) => theme.colors.gray500};
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 1rem;
    line-height: 1.5;
  }
`;

const availableFlows: FlowComparison[] = [
	{
		id: 'oauth-authz-code-v5',
		title: 'OAuth 2.0 Authorization Code V5',
		description:
			'Modern OAuth 2.0 Authorization Code flow with PKCE, comprehensive token management, and educational features',
		icon: <FiTarget />,
		security: 'high',
		complexity: 'medium',
		implementationTime: '2-4 hours',
		useCases: ['Web applications', 'SPAs with backend', 'Mobile apps', 'Production integrations'],
		pros: [
			'PKCE support for enhanced security',
			'Refresh token management',
			'Comprehensive token introspection',
			'Educational step-by-step guidance',
			'Real PingOne integration',
		],
		cons: ['Requires backend token endpoint', 'More complex than implicit flow'],
		route: '/flows/oauth-authorization-code-v5',
		recommended: true,
	},
	{
		id: 'oidc-authz-code-v5',
		title: 'OIDC Authorization Code V5',
		description:
			'OpenID Connect Authorization Code flow with ID token validation, user claims, and profile management',
		icon: <FiShield />,
		security: 'high',
		complexity: 'medium',
		implementationTime: '2-4 hours',
		useCases: [
			'User authentication',
			'Profile management',
			'Identity verification',
			'Single Sign-On (SSO)',
		],
		pros: [
			'ID token validation and parsing',
			'UserInfo endpoint integration',
			'Custom claim handling',
			'JWT signature verification',
			'Complete user profile access',
		],
		cons: ['Requires OIDC configuration', 'More complex than OAuth-only flows'],
		route: '/flows/oidc-authorization-code-v5',
		recommended: true,
	},
	{
		id: 'oauth-implicit-v5',
		title: 'OAuth 2.0 Implicit Flow V5',
		description:
			'Legacy implicit flow for educational purposes and understanding security considerations',
		icon: <FiArrowRight />,
		security: 'low',
		complexity: 'low',
		implementationTime: '1-2 hours',
		useCases: ['Educational purposes', 'Understanding legacy flows', 'Security comparison'],
		pros: [
			'Simple implementation',
			'No backend required',
			'Direct token access',
			'Good for learning OAuth concepts',
		],
		cons: [
			'Deprecated by OAuth 2.1',
			'No refresh tokens',
			'Tokens in URL fragment',
			'Security vulnerabilities',
		],
		route: '/flows/oauth-implicit-v5',
		recommended: false,
	},
	{
		id: 'oidc-hybrid-v5',
		title: 'OIDC Hybrid Flow V5',
		description: 'Advanced OpenID Connect flow combining authorization code with implicit flow',
		icon: <FiShield />,
		security: 'high',
		complexity: 'high',
		implementationTime: '4-6 hours',
		useCases: ['High-security applications', 'Enterprise SSO', 'Advanced identity scenarios'],
		pros: [
			'Maximum security',
			'Multiple token types',
			'Flexible response modes',
			'Enterprise-ready',
		],
		cons: ['Very complex', 'Long implementation time', 'Overkill for most applications'],
		route: '/flows/oidc-hybrid-v5',
		recommended: false,
	},
	{
		id: 'client-credentials-v5',
		title: 'Client Credentials Flow V5',
		description: 'Machine-to-machine authentication for server-to-server communication',
		icon: <FiUser />,
		security: 'high',
		complexity: 'low',
		implementationTime: '1-2 hours',
		useCases: ['Server-to-Server', 'Background Processes', 'API Services', 'Microservices'],
		pros: [
			'Simple implementation',
			'No user interaction required',
			'Perfect for APIs',
			'Fast authentication',
			'No redirects needed',
		],
		cons: ['No user context', 'Limited to machine access', 'Requires client credentials'],
		route: '/flows/client-credentials-v5',
		recommended: true,
	},
	{
		id: 'device-code-v5',
		title: 'OIDC Device Code Flow V5',
		description: 'For devices with limited input capabilities like smart TVs and IoT devices',
		icon: <FiClock />,
		security: 'medium',
		complexity: 'medium',
		implementationTime: '3-5 hours',
		useCases: ['Smart TVs', 'IoT Devices', 'Gaming Consoles', 'Limited input devices'],
		pros: [
			'Works on limited devices',
			'User-friendly for TVs',
			'Secure authentication',
			'No complex UI required',
		],
		cons: ['More complex flow', 'Requires polling', 'User must have another device'],
		route: '/flows/oidc-device-authorization-v6',
		recommended: false,
	},
	{
		id: 'redirectless-v5',
		title: 'Redirectless Flow V5',
		description: 'PingOne-specific flow using pi.flow response mode for seamless authentication',
		icon: <FiTarget />,
		security: 'high',
		complexity: 'medium',
		implementationTime: '2-3 hours',
		useCases: ['PingOne integrations', 'Seamless authentication', 'Advanced scenarios'],
		pros: [
			'No redirects required',
			'Direct token response',
			'PingOne-specific features',
			'Enhanced user experience',
		],
		cons: ['PingOne-specific', 'Limited to PingOne platform', 'Newer flow type'],
		route: '/flows/redirectless-v5',
		recommended: false,
	},
];

const FlowComparisonTool: React.FC = () => {
	const [selectedFlows, setSelectedFlows] = useState<string[]>([]);

	const toggleFlow = (flowId: string) => {
		setSelectedFlows((prev) => {
			if (prev.includes(flowId)) {
				return prev.filter((id) => id !== flowId);
			} else if (prev.length < 4) {
				return [...prev, flowId];
			}
			return prev;
		});
	};

	const getSelectedFlowData = () => {
		return availableFlows.filter((flow) => selectedFlows.includes(flow.id));
	};

	const selectedFlowData = getSelectedFlowData();

	// Generate URL with credentials for a flow
	const generateFlowUrl = (flow: FlowComparison): string => {
		try {
			// Validate route exists, fallback to dashboard if not
			if (!flow.route || flow.route === '/dashboard') {
				return '/dashboard';
			}

			// Get current credentials from credential manager
			const credentials = credentialManager.loadAuthzFlowCredentials();

			// Only add credentials to URL if they exist
			if (credentials.environmentId || credentials.clientId) {
				const params = new URLSearchParams();

				if (credentials.environmentId) {
					params.set('env', credentials.environmentId);
				}
				if (credentials.clientId) {
					params.set('client', credentials.clientId);
				}
				if (credentials.scopes && credentials.scopes.length > 0) {
					const scopeString = Array.isArray(credentials.scopes)
						? credentials.scopes.join(' ')
						: credentials.scopes;
					params.set('scope', scopeString);
				}
				if (credentials.redirectUri) {
					params.set('redirect', credentials.redirectUri);
				}

				const paramString = params.toString();
				return paramString ? `${flow.route}?${paramString}` : flow.route;
			}

			return flow.route;
		} catch (error) {
			console.error('Error generating flow URL with credentials:', error);
			// Fallback to dashboard if there's an error
			return '/dashboard';
		}
	};

	return (
		<ComparisonContainer>
			<CollapsibleHeader
				title="Flow Selection"
				subtitle="Choose up to 4 OAuth flows to compare side by side"
				icon={<FiGitBranch />}
				defaultCollapsed={false}
			>
				<FlowSelector>
					{availableFlows.map((flow) => (
						<FlowOption
							key={flow.id}
							$selected={selectedFlows.includes(flow.id)}
							$added={selectedFlows.includes(flow.id)}
							onClick={() => toggleFlow(flow.id)}
							disabled={!selectedFlows.includes(flow.id) && selectedFlows.length >= 4}
						>
							{selectedFlows.includes(flow.id) ? <FiMinus /> : <FiPlus />}
							{flow.icon}
							{flow.title}
							{flow.recommended && <FiStar />}
						</FlowOption>
					))}
				</FlowSelector>
			</CollapsibleHeader>

			{selectedFlowData.length === 0 ? (
				<CollapsibleHeader
					title="Get Started"
					subtitle="Select flows from above to begin comparison"
					icon={<FiInfo />}
					defaultCollapsed={false}
				>
					<EmptyState>
						<div className="empty-icon">
							<FiGitBranch />
						</div>
						<h3>Select Flows to Compare</h3>
						<p>
							Choose up to 4 OAuth flows from the options above to see a detailed comparison of
							their features, security levels, and use cases.
						</p>
					</EmptyState>
				</CollapsibleHeader>
			) : (
				<CollapsibleHeader
					title="Flow Comparison"
					subtitle={`Comparing ${selectedFlows.length} OAuth flow${selectedFlows.length > 1 ? 's' : ''} side by side`}
					icon={<FiInfo />}
					defaultCollapsed={false}
				>
					<ComparisonGrid $columns={selectedFlowData.length}>
						{selectedFlowData.map((flow) => (
							<ComparisonCard key={flow.id}>
								<CardHeader>
									<FlowHeader>
										<div className="flow-icon">{flow.icon}</div>
										<h3 className="flow-title">{flow.title}</h3>
										<p className="flow-description">{flow.description}</p>
										{flow.recommended && (
											<div style={{ marginTop: '0.5rem' }}>
												<span
													style={{
														display: 'inline-flex',
														alignItems: 'center',
														gap: '0.25rem',
														padding: '0.25rem 0.75rem',
														backgroundColor: '#dbeafe',
														color: '#1e40af',
														borderRadius: '1rem',
														fontSize: '0.75rem',
														fontWeight: '500',
													}}
												>
													<FiStar />
													Recommended
												</span>
											</div>
										)}
									</FlowHeader>
								</CardHeader>

								<CardBody>
									<ComparisonSection>
										<h4>
											<FiShield />
											Security & Complexity
										</h4>
										<MetricGrid>
											<MetricItem>
												<div className="metric-label">Security</div>
												<div className="metric-value">
													<SecurityBadge $level={flow.security}>{flow.security}</SecurityBadge>
												</div>
											</MetricItem>
											<MetricItem>
												<div className="metric-label">Complexity</div>
												<div className="metric-value">
													<ComplexityBadge $level={flow.complexity}>
														{flow.complexity}
													</ComplexityBadge>
												</div>
											</MetricItem>
											<MetricItem>
												<div className="metric-label">Time</div>
												<div className="metric-value">{flow.implementationTime}</div>
											</MetricItem>
										</MetricGrid>
									</ComparisonSection>

									<ComparisonSection>
										<h4>
											<FiCheckCircle />
											Pros
										</h4>
										<ProsConsList>
											{flow.pros.map((pro, index) => (
												<li key={index}>
													<FiCheckCircle className="pros-icon" />
													{pro}
												</li>
											))}
										</ProsConsList>
									</ComparisonSection>

									<ComparisonSection>
										<h4>
											<FiXCircle />
											Cons
										</h4>
										<ProsConsList>
											{flow.cons.map((con, index) => (
												<li key={index}>
													<FiXCircle className="cons-icon" />
													{con}
												</li>
											))}
										</ProsConsList>
									</ComparisonSection>

									<ComparisonSection>
										<h4>
											<FiUser />
											Use Cases
										</h4>
										<UseCasesList>
											{flow.useCases.map((useCase, index) => (
												<span key={index} className="use-case">
													{useCase}
												</span>
											))}
										</UseCasesList>
									</ComparisonSection>

									<ActionButton to={generateFlowUrl(flow)}>
										<FiExternalLink />
										Try This Flow
									</ActionButton>
								</CardBody>
							</ComparisonCard>
						))}
					</ComparisonGrid>
				</CollapsibleHeader>
			)}
		</ComparisonContainer>
	);
};

export default FlowComparisonTool;
