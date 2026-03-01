import {
	FiAlertTriangle,
	FiArrowRight,
	FiCheckCircle,
	FiChevronDown,
	FiChevronRight,
	FiClock,
	FiCode,
	FiShield,
	FiStar,
	FiTool,
	FiUser,
} from '@icons';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from './Card';

interface FlowCategory {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	useCases: string[];
	flows: OAuthFlow[];
	color: string;
}

interface OAuthFlow {
	id: string;
	title: string;
	description: string;
	icon: React.ReactNode;
	security: 'high' | 'medium' | 'low';
	recommended: boolean;
	complexity: 'low' | 'medium' | 'high';
	implementationTime: string;
	useCases: string[];
	route: string;
}

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 1rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const CategoryCard = styled(Card)<{ $color: string }>`
  border-left: 4px solid ${({ $color }) => $color};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  
  .category-icon {
    font-size: 2rem;
    color: ${({ theme }) => theme.colors.primary};
  }
  
  .category-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin: 0;
  }
`;

const DifficultyBadge = styled.span<{ $level: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 1rem;
  margin-bottom: 1rem;
  
  ${({ $level }) => {
		switch ($level) {
			case 'beginner':
				return `
          background-color: #dcfce7;
          color: #166534;
        `;
			case 'intermediate':
				return `
          background-color: #fef3c7;
          color: #92400e;
        `;
			case 'advanced':
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

const UseCasesList = styled.div`
  margin-bottom: 1.5rem;
  
  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray700};
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .use-cases {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .use-case {
    padding: 0.25rem 0.75rem;
    background-color: ${({ theme }) => theme.colors.gray100};
    color: ${({ theme }) => theme.colors.gray700};
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
  }
`;

const FlowsList = styled.div`
  .flows-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.gray100};
    }
    
    h3 {
      font-size: 1rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.gray900};
      margin: 0;
    }
    
    .flow-count {
      font-size: 0.875rem;
      color: ${({ theme }) => theme.colors.gray500};
    }
  }
  
  .flows-list {
    display: grid;
    gap: 0.75rem;
  }
`;

const FlowItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.5rem;
  text-decoration: none;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary}05;
  }
  
  .flow-icon {
    font-size: 1.25rem;
    color: ${({ theme }) => theme.colors.primary};
  }
  
  .flow-content {
    flex: 1;
    
    .flow-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.gray900};
      margin: 0 0 0.25rem 0;
    }
    
    .flow-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: ${({ theme }) => theme.colors.gray500};
    }
  }
  
  .flow-badges {
    display: flex;
    gap: 0.25rem;
  }
`;

const SecurityBadge = styled.span<{ $level: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.125rem 0.5rem;
  font-size: 0.625rem;
  font-weight: 500;
  border-radius: 0.25rem;
  
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

const RecommendedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.125rem 0.5rem;
  font-size: 0.625rem;
  font-weight: 500;
  border-radius: 0.25rem;
  background-color: #dbeafe;
  color: #1e40af;
`;

const QuickStartSection = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 3rem;
  color: white;
  text-align: center;
  
  h2 {
    font-size: 1.875rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.125rem;
    margin-bottom: 2rem;
    opacity: 0.9;
  }
  
  .quick-start-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    background-color: white;
    color: #667eea;
    border-radius: 0.5rem;
    text-decoration: none;
    font-weight: 600;
    font-size: 1.125rem;
    transition: all 0.2s;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }
  }
`;

const flowCategories: FlowCategory[] = [
	{
		id: 'essential',
		title: 'Essential Flows',
		description: 'The most commonly used OAuth flows for modern applications',
		icon: <FiStar />,
		difficulty: 'beginner',
		useCases: ['Web Apps', 'Mobile Apps', 'SPAs', 'Server-to-Server'],
		color: '#10b981',
		flows: [
			{
				id: 'authorization-code-v7',
				title: 'Authorization Code Flow V7',
				description: 'Unified OAuth/OIDC authorization code experience with enhanced features',
				icon: <FiCode />,
				security: 'high',
				recommended: true,
				complexity: 'medium',
				implementationTime: '2-4 hours',
				useCases: ['Web Apps', 'Mobile Apps', 'SPAs', 'Modern Applications'],
				route: '/flows/oauth-authorization-code-v7',
			},
			// Hidden: Authorization Code Flow V3 options
			// {
			// 	id: 'authorization-code-v3-oauth',
			// 	title: 'Authorization Code Flow V3 (OAuth)',
			// 	description: 'Detailed OAuth-only experience with deep debugging tools',
			// 	icon: <FiZap />,
			// 	security: 'high',
			// 	recommended: true,
			// 	complexity: 'medium',
			// 	implementationTime: '2-3 hours',
			// 	useCases: ['Learning', 'Debugging', 'API-Only Integrations'],
			// 	route: '/flows/oauth-authorization-code-v3',
			// },
			// {
			// 	id: 'authorization-code-v3-oidc',
			// 	title: 'Authorization Code Flow V3 (OIDC)',
			// 	description: 'Educational OIDC variant with token validation and user info',
			// 	icon: <FiZap />,
			// 	security: 'high',
			// 	recommended: true,
			// 	complexity: 'medium',
			// 	implementationTime: '2-3 hours',
			// 	useCases: ['Learning', 'OIDC Workshops', 'Token Debugging'],
			// 	route: '/flows/enhanced-authorization-code-v3',
			// },
			{
				id: 'pkce',
				title: 'PKCE Flow',
				description: 'Authorization Code flow with enhanced security',
				icon: <FiShield />,
				security: 'high',
				recommended: true,
				complexity: 'medium',
				implementationTime: '2-4 hours',
				useCases: ['Mobile Apps', 'SPAs', 'Native Apps'],
				route: '/flows/pkce',
			},
			{
				id: 'client-credentials',
				title: 'Client Credentials',
				description: 'Machine-to-machine authentication',
				icon: <FiUser />,
				security: 'high',
				recommended: true,
				complexity: 'low',
				implementationTime: '1-2 hours',
				useCases: ['Server-to-Server', 'Background Processes', 'API Services'],
				route: '/flows/client-credentials',
			},
			{
				id: 'device-code',
				title: 'Device Code Flow',
				description: 'For devices with limited input capabilities',
				icon: <FiClock />,
				security: 'medium',
				recommended: true,
				complexity: 'medium',
				implementationTime: '3-5 hours',
				useCases: ['Smart TVs', 'IoT Devices', 'Gaming Consoles'],
				route: '/flows/device-code',
			},
		],
	},
	{
		id: 'advanced',
		title: 'Advanced Flows',
		description: 'Specialized flows for specific use cases and requirements',
		icon: <FiTool />,
		difficulty: 'intermediate',
		useCases: ['IoT Devices', 'Smart TVs', 'High Security Apps'],
		color: '#3b82f6',
		flows: [
			{
				id: 'hybrid',
				title: 'Hybrid Flow',
				description: 'Combines authorization code and implicit flows',
				icon: <FiCode />,
				security: 'high',
				recommended: false,
				complexity: 'high',
				implementationTime: '4-6 hours',
				useCases: ['High Security Apps', 'Enterprise Applications'],
				route: '/flows/hybrid',
			},
			{
				id: 'jwt-bearer',
				title: 'JWT Bearer Flow',
				description: 'Uses JWT assertions for authentication',
				icon: <FiShield />,
				security: 'high',
				recommended: false,
				complexity: 'high',
				implementationTime: '4-6 hours',
				useCases: ['Enterprise SSO', 'Federated Identity'],
				route: '/flows/jwt-bearer',
			},
			{
				id: 'worker-token',
				title: 'Worker Token Flow',
				description: 'Admin-level access for machine-to-machine',
				icon: <FiUser />,
				security: 'high',
				recommended: false,
				complexity: 'medium',
				implementationTime: '2-3 hours',
				useCases: ['Admin Operations', 'System Integration'],
				route: '/flows/worker-token',
			},
		],
	},
	{
		id: 'legacy',
		title: 'Legacy Flows',
		description: 'Deprecated flows - use only for migration or legacy support',
		icon: <FiAlertTriangle />,
		difficulty: 'advanced',
		useCases: ['Legacy Systems', 'Migration Scenarios'],
		color: '#ef4444',
		flows: [
			{
				id: 'implicit',
				title: 'Implicit Grant Flow',
				description: 'Simplified flow for client-side applications (deprecated)',
				icon: <FiCode />,
				security: 'low',
				recommended: false,
				complexity: 'low',
				implementationTime: '1-2 hours',
				useCases: ['Legacy SPAs', 'Client-side only apps'],
				route: '/flows/implicit',
			},
		],
	},
	{
		id: 'utilities',
		title: 'Token Management',
		description: 'Tools for managing and validating OAuth tokens',
		icon: <FiTool />,
		difficulty: 'intermediate',
		useCases: ['Token Validation', 'Session Management', 'Security Auditing'],
		color: '#22c55e',
		flows: [
			{
				id: 'token-management',
				title: 'Token Management',
				description: 'Comprehensive token lifecycle management',
				icon: <FiShield />,
				security: 'high',
				recommended: true,
				complexity: 'medium',
				implementationTime: '2-3 hours',
				useCases: ['Token Validation', 'Session Management'],
				route: '/token-management',
			},
			{
				id: 'userinfo',
				title: 'UserInfo Flow',
				description: 'Retrieve user information using access tokens',
				icon: <FiUser />,
				security: 'high',
				recommended: true,
				complexity: 'low',
				implementationTime: '1-2 hours',
				useCases: ['User Profile', 'User Data'],
				route: '/flows/userinfo',
			},
		],
	},
	{
		id: 'pingone',
		title: 'PingOne Flows',
		description: 'PingOne-specific authentication and authorization flows',
		icon: <FiShield />,
		difficulty: 'intermediate',
		useCases: ['PingOne Integration', 'MFA Authentication', 'Admin Operations'],
		color: '#8b5cf6',
		flows: [
			{
				id: 'mfa-v7',
				title: 'PingOne MFA V7',
				description: 'Enhanced Multi-Factor Authentication flow with modern services',
				icon: <FiShield />,
				security: 'high',
				recommended: true,
				complexity: 'medium',
				implementationTime: '2-3 hours',
				useCases: ['Enhanced Security', 'PingOne Integration', 'MFA Authentication'],
				route: '/flows/pingone-complete-mfa-v7',
			},
			{
				id: 'worker-token-v7',
				title: 'Worker Token Flow V7',
				description: 'Enhanced PingOne admin access and management operations',
				icon: <FiTool />,
				security: 'high',
				recommended: true,
				complexity: 'medium',
				implementationTime: '1-2 hours',
				useCases: ['Admin Operations', 'PingOne Management', 'System Integration'],
				route: '/flows/worker-token-v7',
			},
		],
	},
];

const FlowCategories: React.FC = () => {
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		new Set(['essential']) // Start with essential flows expanded
	);

	const toggleCategory = (categoryId: string) => {
		const newExpanded = new Set(expandedCategories);
		if (newExpanded.has(categoryId)) {
			newExpanded.delete(categoryId);
		} else {
			newExpanded.add(categoryId);
		}
		setExpandedCategories(newExpanded);
	};

	return (
		<Container>
			<PageHeader>
				<h1>OAuth Flows</h1>
				<p>
					Choose the right OAuth flow for your application. Start with Essential Flows if you're new
					to OAuth, or explore Advanced Flows for specialized use cases.
				</p>
			</PageHeader>

			<QuickStartSection>
				<h2> Quick Start</h2>
				<p>
					New to OAuth? Start with the Authorization Code Flow with PKCE - it's the most secure and
					widely supported flow for modern applications.
				</p>
				<div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
					<Link to="/flows/authorization-code" className="quick-start-button">
						<FiStar />
						Start with Authorization Code Flow
					</Link>
					<Link
						to="/flows/compare"
						className="quick-start-button"
						style={{
							background: 'rgba(255, 255, 255, 0.2)',
							border: '1px solid rgba(255, 255, 255, 0.3)',
						}}
					>
						<FiCode />
						Compare Flows
					</Link>
					<Link
						to="/flows/diagrams"
						className="quick-start-button"
						style={{
							background: 'rgba(255, 255, 255, 0.2)',
							border: '1px solid rgba(255, 255, 255, 0.3)',
						}}
					>
						<FiArrowRight />
						Interactive Diagrams
					</Link>
				</div>
			</QuickStartSection>

			<CategoryGrid>
				{flowCategories.map((category) => (
					<CategoryCard key={category.id} $color={category.color}>
						<CardHeader>
							<CategoryHeader>
								<div className="category-icon">{category.icon}</div>
								<h2 className="category-title">{category.title}</h2>
							</CategoryHeader>

							<DifficultyBadge $level={category.difficulty}>
								{category.difficulty === 'beginner' && <FiCheckCircle />}
								{category.difficulty === 'intermediate' && <FiClock />}
								{category.difficulty === 'advanced' && <FiAlertTriangle />}
								{category.difficulty}
							</DifficultyBadge>

							<p style={{ color: '#6b7280', marginBottom: '1rem' }}>{category.description}</p>

							<UseCasesList>
								<h4>Best for:</h4>
								<div className="use-cases">
									{category.useCases.map((useCase) => (
										<span key={useCase} className="use-case">
											{useCase}
										</span>
									))}
								</div>
							</UseCasesList>
						</CardHeader>

						<CardBody>
							<FlowsList>
								<div className="flows-header" onClick={() => toggleCategory(category.id)}>
									<h3>Available Flows</h3>
									<div className="flow-count">
										{category.flows.length} flow{category.flows.length !== 1 ? 's' : ''}
										{expandedCategories.has(category.id) ? <FiChevronDown /> : <FiChevronRight />}
									</div>
								</div>

								{expandedCategories.has(category.id) && (
									<div className="flows-list">
										{category.flows.map((flow) => (
											<FlowItem key={flow.id} to={flow.route}>
												<div className="flow-icon">{flow.icon}</div>
												<div className="flow-content">
													<h4 className="flow-title">{flow.title}</h4>
													<div className="flow-meta">
														<span>{flow.implementationTime}</span>
														<span></span>
														<span>{flow.complexity} complexity</span>
													</div>
												</div>
												<div className="flow-badges">
													<SecurityBadge $level={flow.security}>
														{flow.security} security
													</SecurityBadge>
													{flow.recommended && (
														<RecommendedBadge>
															<FiStar />
															Recommended
														</RecommendedBadge>
													)}
												</div>
											</FlowItem>
										))}
									</div>
								)}
							</FlowsList>
						</CardBody>
					</CategoryCard>
				))}
			</CategoryGrid>
		</Container>
	);
};

export default FlowCategories;
