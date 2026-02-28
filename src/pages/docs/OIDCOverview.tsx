import { useCallback, useMemo, useState } from 'react';
import {
	FiAlertTriangle,
	FiArrowRight,
	FiBookOpen,
	FiCheckCircle,
	FiCode,
	FiInfo,
	FiLock,
	FiSearch,
	FiShield,
	FiTrendingUp,
	FiUsers,
	FiZap,
} from '@icons';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from '../../components/Card';
import FlowConfigurationTable from '../../components/FlowConfigurationTable';
import InteractiveFlowDiagram from '../../components/InteractiveFlowDiagram';
import { usePageScroll } from '../../hooks/usePageScroll';

// Enhanced TypeScript interfaces
interface OIDCFlow {
	id: string;
	title: string;
	description: string;
	icon: React.ComponentType<any>;
	color: string;
	details: string;
	security: string;
	useCase: string;
	pros: string[];
	cons: string[];
	bestFor: string[];
	securityLevel: number;
	deprecated?: boolean;
}

interface OIDCConcept {
	title: string;
	description: string;
	icon: React.ComponentType<any>;
	examples: string[];
	importance: 'high' | 'medium' | 'low';
}

interface FlowComparison {
	flow: string;
	tokens: string;
	useCase: string;
	security: {
		type: 'recommended' | 'warning' | 'deprecated';
		text: string;
		icon: React.ComponentType<any>;
	};
	complexity: 'low' | 'medium' | 'high';
	performance: 'fast' | 'medium' | 'slow';
}

// Enhanced styled components with better accessibility and design
const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 0.75rem;
  margin: 0 0 2rem 0;

  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  p {
    font-size: 1rem;
    max-width: 100%;
    margin: 0 auto;
    line-height: 1.5;
    opacity: 0.9;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    margin-bottom: 1.5rem;
    
    h1 {
      font-size: 1.5rem;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    p {
      font-size: 0.875rem;
    }
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 2rem;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-size: 1.25rem;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  padding: 0.5rem 1rem;
  border: 2px solid ${(props) => (props.$active ? '#3b82f6' : '#e5e7eb')};
  border-radius: 0.5rem;
  background: ${(props) => (props.$active ? '#3b82f6' : 'white')};
  color: ${(props) => (props.$active ? 'white' : '#374151')};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #3b82f6;
    background: ${(props) => (props.$active ? '#2563eb' : '#f8fafc')};
  }
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  justify-items: stretch;
  align-items: start;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  
  @media (max-width: 480px) {
    gap: 1rem;
  }
`;

const FlowCard = styled(Card)`
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
  background: white;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
    border-color: #d1d5db;
  }
`;

const FlowCardBody = styled(CardBody)`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 2rem;
  
  & > :last-child {
    margin-top: auto;
  }
`;

const FlowIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  flex-shrink: 0;

  &.auth-code { background-color: #dbeafe; color: #1e40af; }
  &.implicit { background-color: #fef3c7; color: #d97706; }
  &.hybrid { background-color: #ecfdf5; color: #059669; }
  &.pkce { background-color: #f0fdf4; color: #16a34a; }
`;

const ConceptGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const ConceptCard = styled(Card)`
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
`;

const SecuritySection = styled(Card)`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px solid #cbd5e1;
`;

const _FlowDiagram = styled.div`
  background-color: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 2rem;
  margin: 2rem 0;
  text-align: center;
  font-family: monospace;
  font-size: 0.9rem;
  color: #374151;
`;

const RecommendationList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0;

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    padding: 0.75rem;
    background-color: #f8fafc;
    border-radius: 0.5rem;
    border-left: 3px solid ${({ theme }) => theme.colors.success};

    svg {
      color: ${({ theme }) => theme.colors.success};
      margin-top: 0.125rem;
      flex-shrink: 0;
    }
  }
`;

const _AIGeneratedBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ComparisonTable = styled(Card)`
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border: 2px solid #374151;
  color: white;
  margin: 2rem 0;
`;

const TableHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  
  h2 {
    color: white;
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  svg {
    color: #60a5fa;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
  min-width: 500px; /* Reduced minimum width */
  
  th, td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid #374151;
  }
  
  th {
    background-color: #374151;
    color: #f9fafb;
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  td {
    color: #e5e7eb;
    vertical-align: top;
  }
  
  tr:hover {
    background-color: rgba(55, 65, 81, 0.3);
  }
`;

const SecurityNote = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  
  &.recommended {
    color: #10b981;
  }
  
  &.warning {
    color: #f59e0b;
  }
  
  svg {
    flex-shrink: 0;
  }
`;

const OIDCOverview = () => {
	const [expandedFlow, setExpandedFlow] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedFilter, setSelectedFilter] = useState<string>('all');

	// Centralized scroll management
	usePageScroll({ pageName: 'OIDC Overview', force: true });

	// Enhanced OIDC flows with comprehensive information
	const oidcFlows: OIDCFlow[] = [
		{
			id: 'auth-code',
			title: 'Authorization Code Flow',
			description:
				'Most secure flow for applications that can maintain a client secret securely. Uses PKCE for enhanced security.',
			icon: FiShield,
			color: 'auth-code',
			details: 'User authenticates → Authorization Code → Token Exchange → ID Token + Access Token',
			security: 'High',
			useCase: 'Web applications, mobile apps with secure backend',
			pros: ['Highest security', 'Refresh token support', 'PKCE compatible', 'Industry standard'],
			cons: ['Requires backend', 'More complex implementation', 'Additional server round-trip'],
			bestFor: ['Web applications', 'Mobile apps with backend', 'Enterprise applications'],
			securityLevel: 9,
		},
		{
			id: 'implicit',
			title: 'Implicit Flow',
			description:
				'Legacy flow for browser-based applications without secure backend. Deprecated in OAuth 2.1.',
			icon: FiAlertTriangle,
			color: 'implicit',
			details: 'User authenticates → ID Token + Access Token directly in redirect',
			security: 'Low (Deprecated)',
			useCase: 'Legacy browser applications (not recommended for new apps)',
			pros: ['Simple implementation', 'No backend required', 'Direct token access'],
			cons: ['Security vulnerabilities', 'No refresh tokens', 'Tokens in URL', 'Deprecated'],
			bestFor: ['Legacy SPAs only', 'Proof of concepts'],
			securityLevel: 3,
			deprecated: true,
		},
		{
			id: 'hybrid',
			title: 'Hybrid Flow',
			description:
				'Combines Authorization Code and Implicit flows for flexibility. Provides immediate ID token access.',
			icon: FiCode,
			color: 'hybrid',
			details: 'User authenticates → ID Token + Authorization Code → Token Exchange',
			security: 'Medium-High',
			useCase: 'Applications needing immediate ID token and flexible token management',
			pros: ['Immediate ID token', 'Flexible token handling', 'Good security'],
			cons: ['Complex implementation', 'Multiple token sources', 'Requires careful handling'],
			bestFor: ['Complex applications', 'Multi-tenant apps', 'Enterprise SSO'],
			securityLevel: 7,
		},
		{
			id: 'pkce',
			title: 'PKCE Enhanced Flow',
			description:
				'Authorization Code with Proof Key for Code Exchange (PKCE). Best practice for public clients.',
			icon: FiCheckCircle,
			color: 'pkce',
			details:
				'Code Challenge → User authenticates → Authorization Code → Token Exchange with Code Verifier',
			security: 'Very High',
			useCase: 'Mobile apps, SPAs, public clients without client secret',
			pros: [
				'Highest security for public clients',
				'No client secret needed',
				'Prevents code interception',
				'Industry best practice',
			],
			cons: ['More complex setup', 'Requires code generation', 'Additional parameters'],
			bestFor: ['Mobile applications', 'Single Page Apps', 'Public clients', 'Modern applications'],
			securityLevel: 10,
		},
	];

	// Enhanced OIDC concepts with importance levels
	const oidcConcepts: OIDCConcept[] = [
		{
			title: 'ID Token',
			description:
				'JSON Web Token (JWT) signed by the OpenID Provider containing claims about user identity and authentication event. Contains user information and authentication details.',
			icon: FiUsers,
			examples: [
				'sub (subject) - unique user identifier',
				"name - user's full name",
				"email - user's email address",
				'email_verified - email verification status',
				'iss (issuer) - token issuer',
				'aud (audience) - intended audience',
				'iat (issued at) - token creation time',
				'exp (expires) - token expiration time',
			],
			importance: 'high',
		},
		{
			title: 'Relying Party (RP)',
			description:
				'The client application that requests and verifies the ID Token from the OpenID Provider. Also known as the OAuth client.',
			icon: FiShield,
			examples: [
				'Web applications',
				'Mobile apps',
				'Single Page Apps',
				'API services',
				'Desktop applications',
			],
			importance: 'high',
		},
		{
			title: 'OpenID Provider (OP)',
			description:
				'The authorization server that authenticates users and issues ID Tokens and access tokens. Handles user authentication and authorization.',
			icon: FiBookOpen,
			examples: [
				'PingOne',
				'Auth0',
				'Okta',
				'Azure AD',
				'Google Identity',
				'Keycloak',
				'AWS Cognito',
			],
			importance: 'high',
		},
		{
			title: 'Claims',
			description:
				'Pieces of information about the end user included in the ID Token. Can be standard, custom, or aggregated.',
			icon: FiInfo,
			examples: [
				'Standard claims (sub, name, email)',
				'Custom claims (organization, role)',
				'Verified claims (government ID)',
				'Aggregated claims (from multiple sources)',
			],
			importance: 'medium',
		},
		{
			title: 'Scopes',
			description: 'Permissions that define what information the client can access about the user.',
			icon: FiLock,
			examples: ['openid', 'profile', 'email', 'address', 'phone', 'offline_access'],
			importance: 'high',
		},
		{
			title: 'Discovery',
			description: 'Automatic discovery of OpenID Provider configuration and capabilities.',
			icon: FiZap,
			examples: [
				'Well-known configuration',
				'JWKS endpoint',
				'Supported scopes',
				'Supported claims',
			],
			importance: 'medium',
		},
	];

	// Enhanced filtering and search functionality
	const filteredFlows = useMemo(() => {
		let filtered = oidcFlows;

		// Apply search filter
		if (searchTerm) {
			filtered = filtered.filter(
				(flow) =>
					flow.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					flow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
					flow.useCase.toLowerCase().includes(searchTerm.toLowerCase()) ||
					flow.pros.some((pro) => pro.toLowerCase().includes(searchTerm.toLowerCase()))
			);
		}

		// Apply category filter
		if (selectedFilter !== 'all') {
			switch (selectedFilter) {
				case 'recommended':
					filtered = filtered.filter((flow) => flow.securityLevel >= 7 && !flow.deprecated);
					break;
				case 'deprecated':
					filtered = filtered.filter((flow) => flow.deprecated);
					break;
				case 'high-security':
					filtered = filtered.filter((flow) => flow.securityLevel >= 8);
					break;
				case 'simple':
					filtered = filtered.filter((flow) => flow.securityLevel <= 6);
					break;
			}
		}

		return filtered;
	}, [searchTerm, selectedFilter, oidcFlows]);

	// Memoized handlers for performance
	const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
	}, []);

	const handleFilterChange = useCallback((filter: string) => {
		setSelectedFilter(filter);
	}, []);

	const flowComparison = [
		{
			flow: 'Authorization Code',
			tokens: 'ID + Access (+Refresh)',
			useCase: 'Web, mobile apps (PKCE)',
			security: { type: 'recommended', text: 'Recommended', icon: FiCheckCircle },
		},
		{
			flow: 'Implicit',
			tokens: 'ID + Access',
			useCase: 'Legacy SPAs',
			security: { type: 'warning', text: 'Deprecated', icon: FiAlertTriangle },
		},
		{
			flow: 'Hybrid',
			tokens: 'Code + ID + Access',
			useCase: 'Mixed web apps',
			security: { type: 'warning', text: 'Rare today', icon: FiAlertTriangle },
		},
		{
			flow: 'Client Credentials',
			tokens: 'Access only',
			useCase: 'Machine-to-machine',
			security: { type: 'recommended', text: 'No user context', icon: FiCheckCircle },
		},
		{
			flow: 'Device Code',
			tokens: 'ID + Access (+Refresh)',
			useCase: 'IoT, TVs, CLI tools',
			security: { type: 'recommended', text: 'Secure', icon: FiCheckCircle },
		},
		{
			flow: 'Refresh Token',
			tokens: 'New ID + Access',
			useCase: 'Long-lived sessions',
			security: { type: 'warning', text: 'Secure storage needed', icon: FiAlertTriangle },
		},
	];

	return (
		<div
			style={{
				minHeight: '100vh',
				background: '#f9fafb',
				padding: '1rem',
				overflowX: 'hidden',
			}}
		>
			<div
				style={{
					maxWidth: '1400px',
					margin: '0 auto',
					padding: '0 1rem',
				}}
			>
				{/* Enhanced Header */}
				<Header>
					<h1>
						<FiShield />
						OpenID Connect Overview
					</h1>
					<p>
						Comprehensive guide to OpenID Connect authentication flows, concepts, and best
						practices. Learn about OIDC flows, security considerations, and implementation patterns.
					</p>
				</Header>

				{/* Search and Filter Controls */}
				<SearchContainer>
					<SearchIcon />
					<SearchInput
						type="text"
						placeholder="Search flows, concepts, or features..."
						value={searchTerm}
						onChange={handleSearchChange}
						aria-label="Search OIDC flows and concepts"
					/>
				</SearchContainer>

				<FilterContainer>
					<FilterButton
						$active={selectedFilter === 'all'}
						onClick={() => handleFilterChange('all')}
					>
						All Flows
					</FilterButton>
					<FilterButton
						$active={selectedFilter === 'recommended'}
						onClick={() => handleFilterChange('recommended')}
					>
						Recommended
					</FilterButton>
					<FilterButton
						$active={selectedFilter === 'high-security'}
						onClick={() => handleFilterChange('high-security')}
					>
						High Security
					</FilterButton>
					<FilterButton
						$active={selectedFilter === 'deprecated'}
						onClick={() => handleFilterChange('deprecated')}
					>
						Deprecated
					</FilterButton>
				</FilterContainer>

				{/* Enhanced OIDC Flows Overview */}
				<section style={{ marginBottom: '4rem' }}>
					<div style={{ textAlign: 'center', marginBottom: '3rem' }}>
						<h2
							style={{
								fontSize: '2.5rem',
								fontWeight: '700',
								marginBottom: '1rem',
								color: '#1f2937',
							}}
						>
							OIDC Authentication Flows
						</h2>
						<p
							style={{
								fontSize: '1.125rem',
								color: '#6b7280',
								maxWidth: '600px',
								margin: '0 auto',
							}}
						>
							Choose the right authentication flow for your application type and security
							requirements
						</p>
						<span
							style={{
								display: 'inline-block',
								fontSize: '0.875rem',
								fontWeight: '500',
								color: '#6b7280',
								marginTop: '0.5rem',
								padding: '0.25rem 0.75rem',
								backgroundColor: '#f3f4f6',
								borderRadius: '1rem',
							}}
						>
							{filteredFlows.length} flows available
						</span>
					</div>

					<OverviewGrid>
						{filteredFlows.map((flow) => (
							<FlowCard key={flow.id}>
								<FlowCardBody>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											marginBottom: '1rem',
										}}
									>
										<FlowIcon className={flow.color}>
											<flow.icon size={24} />
										</FlowIcon>
										{flow.deprecated && (
											<span
												style={{
													background: '#fef3c7',
													color: '#d97706',
													padding: '0.25rem 0.5rem',
													borderRadius: '0.25rem',
													fontSize: '0.75rem',
													fontWeight: '500',
												}}
											>
												DEPRECATED
											</span>
										)}
									</div>

									<h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
										{flow.title}
									</h3>

									<p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
										{flow.description}
									</p>

									{/* Enhanced Security Display */}
									<div style={{ marginBottom: '1rem' }}>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												marginBottom: '0.5rem',
											}}
										>
											<strong style={{ fontSize: '0.875rem', color: '#374151' }}>
												Security Level:
											</strong>
											<div style={{ display: 'flex', gap: '0.25rem' }}>
												{Array.from({ length: 10 }, (_, i) => (
													<div
														key={i}
														style={{
															width: '8px',
															height: '8px',
															borderRadius: '50%',
															backgroundColor: i < flow.securityLevel ? '#10b981' : '#e5e7eb',
														}}
													/>
												))}
											</div>
											<span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
												{flow.securityLevel}/10
											</span>
										</div>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.25rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor:
													flow.security === 'Very High'
														? '#dcfce7'
														: flow.security === 'High'
															? '#dbeafe'
															: flow.security === 'Medium-High'
																? '#ecfdf5'
																: '#fef3c7',
												color:
													flow.security === 'Very High'
														? '#166534'
														: flow.security === 'High'
															? '#1e40af'
															: flow.security === 'Medium-High'
																? '#059669'
																: '#d97706',
											}}
										>
											{flow.security}
										</span>
									</div>

									{/* Best For Tags */}
									<div style={{ marginBottom: '1rem' }}>
										<strong
											style={{
												fontSize: '0.875rem',
												color: '#374151',
												display: 'block',
												marginBottom: '0.5rem',
											}}
										>
											Best For:
										</strong>
										<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
											{flow.bestFor.slice(0, 2).map((item, index) => (
												<span
													key={index}
													style={{
														background: '#f3f4f6',
														color: '#374151',
														padding: '0.125rem 0.375rem',
														borderRadius: '0.25rem',
														fontSize: '0.75rem',
														fontWeight: '500',
													}}
												>
													{item}
												</span>
											))}
											{flow.bestFor.length > 2 && (
												<span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
													+{flow.bestFor.length - 2} more
												</span>
											)}
										</div>
									</div>
									<button
										onClick={() => setExpandedFlow(expandedFlow === flow.id ? null : flow.id)}
										style={{
											width: '100%',
											padding: '0.5rem',
											backgroundColor: 'transparent',
											border: '1px solid #d1d5db',
											borderRadius: '0.375rem',
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											gap: '0.5rem',
											fontSize: '0.875rem',
										}}
									>
										{expandedFlow === flow.id ? 'Hide Details' : 'Show Details'}
										<FiArrowRight
											size={14}
											style={{
												transform: expandedFlow === flow.id ? 'rotate(90deg)' : 'rotate(0deg)',
												transition: 'transform 0.2s',
												marginLeft: '0.5rem',
											}}
										/>
									</button>
									{expandedFlow === flow.id && (
										<div
											style={{
												marginTop: '1rem',
												padding: '1.5rem',
												backgroundColor: '#f9fafb',
												borderRadius: '0.5rem',
												border: '1px solid #e5e7eb',
											}}
										>
											{/* Flow Steps */}
											<div style={{ marginBottom: '1.5rem' }}>
												<h4
													style={{
														fontSize: '1rem',
														fontWeight: '600',
														marginBottom: '0.75rem',
														color: '#374151',
													}}
												>
													Flow Steps:
												</h4>
												<div
													style={{
														fontFamily: 'monospace',
														fontSize: '0.875rem',
														background: '#1f2937',
														color: '#f9fafb',
														padding: '1rem',
														borderRadius: '0.375rem',
														marginBottom: '0.5rem',
													}}
												>
													{flow.details}
												</div>
											</div>

											{/* Pros and Cons */}
											<div
												style={{
													display: 'grid',
													gridTemplateColumns: '1fr 1fr',
													gap: '1rem',
													marginBottom: '1.5rem',
												}}
											>
												<div>
													<h4
														style={{
															fontSize: '0.875rem',
															fontWeight: '600',
															marginBottom: '0.5rem',
															color: '#059669',
														}}
													>
														✅ Pros:
													</h4>
													<ul
														style={{
															fontSize: '0.875rem',
															color: '#374151',
															margin: 0,
															paddingLeft: '1rem',
														}}
													>
														{flow.pros.map((pro, index) => (
															<li key={index} style={{ marginBottom: '0.25rem' }}>
																{pro}
															</li>
														))}
													</ul>
												</div>
												<div>
													<h4
														style={{
															fontSize: '0.875rem',
															fontWeight: '600',
															marginBottom: '0.5rem',
															color: '#dc2626',
														}}
													>
														❌ Cons:
													</h4>
													<ul
														style={{
															fontSize: '0.875rem',
															color: '#374151',
															margin: 0,
															paddingLeft: '1rem',
														}}
													>
														{flow.cons.map((con, index) => (
															<li key={index} style={{ marginBottom: '0.25rem' }}>
																{con}
															</li>
														))}
													</ul>
												</div>
											</div>

											{/* Best For Applications */}
											<div>
												<h4
													style={{
														fontSize: '0.875rem',
														fontWeight: '600',
														marginBottom: '0.5rem',
														color: '#374151',
													}}
												>
													🎯 Best For:
												</h4>
												<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
													{flow.bestFor.map((item, index) => (
														<span
															key={index}
															style={{
																background: '#dbeafe',
																color: '#1e40af',
																padding: '0.25rem 0.5rem',
																borderRadius: '0.25rem',
																fontSize: '0.75rem',
																fontWeight: '500',
															}}
														>
															{item}
														</span>
													))}
												</div>
											</div>
										</div>
									)}
								</FlowCardBody>
							</FlowCard>
						))}
					</OverviewGrid>
				</section>

				{/* Quick Comparison Table */}
				<ComparisonTable>
					<CardBody>
						<TableHeader>
							<FiTrendingUp size={20} />
							<h2>Quick Comparison</h2>
						</TableHeader>

						<div style={{ overflowX: 'auto', marginTop: '1rem' }}>
							<Table>
								<thead>
									<tr>
										<th>Flow</th>
										<th>Tokens Returned</th>
										<th>Use Case</th>
										<th>Security Notes</th>
									</tr>
								</thead>
								<tbody>
									{flowComparison.map((row, index) => (
										<tr key={index}>
											<td>
												<strong>{row.flow}</strong>
											</td>
											<td>{row.tokens}</td>
											<td>{row.useCase}</td>
											<td>
												<SecurityNote className={row.security.type}>
													<row.security.icon size={16} />
													{row.security.text}
												</SecurityNote>
											</td>
										</tr>
									))}
								</tbody>
							</Table>
						</div>
					</CardBody>
				</ComparisonTable>

				{/* Key OIDC Concepts */}
				<section style={{ marginBottom: '3rem' }}>
					<h2
						style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '2rem', color: '#1f2937' }}
					>
						Key OpenID Connect Concepts
					</h2>

					<ConceptGrid>
						{oidcConcepts.map((concept, index) => (
							<ConceptCard key={index}>
								<CardBody>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.75rem',
											marginBottom: '1rem',
										}}
									>
										<concept.icon size={20} style={{ color: '#3b82f6' }} />
										<h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
											{concept.title}
										</h3>
									</div>
									<p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
										{concept.description}
									</p>
									<div>
										<strong style={{ fontSize: '0.875rem', color: '#374151' }}>Examples:</strong>
										<ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
											{concept.examples.map((example, idx) => (
												<li
													key={idx}
													style={{
														fontSize: '0.875rem',
														color: '#6b7280',
														marginBottom: '0.25rem',
													}}
												>
													{example}
												</li>
											))}
										</ul>
									</div>
								</CardBody>
							</ConceptCard>
						))}
					</ConceptGrid>
				</section>

				{/* Interactive Flow Diagrams */}
				<section style={{ marginBottom: '3rem' }}>
					<h2
						style={{
							fontSize: '2rem',
							fontWeight: '600',
							marginBottom: '2rem',
							color: '#1f2937',
							textAlign: 'center',
						}}
					>
						Interactive Flow Diagrams
					</h2>
					<p
						style={{
							textAlign: 'center',
							color: '#6b7280',
							marginBottom: '2rem',
							fontSize: '1.125rem',
						}}
					>
						Explore OAuth and OpenID Connect flows with interactive, step-by-step diagrams
					</p>
					<InteractiveFlowDiagram />
				</section>

				{/* Security Recommendations */}
				<SecuritySection>
					<CardHeader>
						<h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
							<FiShield size={24} />
							Security Recommendations
						</h2>
					</CardHeader>
					<CardBody>
						<p style={{ marginBottom: '1.5rem', color: '#6b7280', lineHeight: '1.6' }}>
							Following security best practices is crucial for protecting user data and maintaining
							trust. Here are the key recommendations for implementing OpenID Connect securely:
						</p>

						<RecommendationList>
							<li>
								<FiCheckCircle size={16} />
								<div>
									<strong>Use Authorization Code Flow with PKCE</strong>
									<p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
										Always use PKCE for enhanced security, especially for public clients without
										client secrets.
									</p>
								</div>
							</li>
							<li>
								<FiCheckCircle size={16} />
								<div>
									<strong>Validate ID Tokens Properly</strong>
									<p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
										Always validate issuer (iss), audience (aud), and expiration (exp) claims.
									</p>
								</div>
							</li>
							<li>
								<FiCheckCircle size={16} />
								<div>
									<strong>Use HTTPS Everywhere</strong>
									<p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
										Never transmit tokens over HTTP - always use HTTPS for all OAuth/OIDC endpoints.
									</p>
								</div>
							</li>
							<li>
								<FiCheckCircle size={16} />
								<div>
									<strong>Implement Proper State Parameter</strong>
									<p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
										Use cryptographically secure random state values to prevent CSRF attacks.
									</p>
								</div>
							</li>
							<li>
								<FiCheckCircle size={16} />
								<div>
									<strong>Regular Token Rotation</strong>
									<p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
										Implement refresh token rotation and regular access token expiration.
									</p>
								</div>
							</li>
						</RecommendationList>
					</CardBody>
				</SecuritySection>

				{/* Implementation Notes */}
				<section
					style={{
						marginTop: '3rem',
						padding: '2rem',
						backgroundColor: '#f8fafc',
						borderRadius: '0.75rem',
					}}
				>
					<h2
						style={{
							fontSize: '1.5rem',
							fontWeight: '600',
							marginBottom: '1rem',
							color: '#1f2937',
						}}
					>
						Implementation Notes
					</h2>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
							gap: '1.5rem',
						}}
					>
						<div>
							<h3
								style={{
									fontSize: '1.125rem',
									fontWeight: '600',
									marginBottom: '0.5rem',
									color: '#374151',
								}}
							>
								For Web Applications
							</h3>
							<p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5' }}>
								Use Authorization Code Flow with PKCE. Store tokens securely and implement proper
								logout flows.
							</p>
						</div>
						<div>
							<h3
								style={{
									fontSize: '1.125rem',
									fontWeight: '600',
									marginBottom: '0.5rem',
									color: '#374151',
								}}
							>
								For Mobile Applications
							</h3>
							<p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5' }}>
								Use Authorization Code Flow with PKCE. Implement secure token storage and
								certificate pinning.
							</p>
						</div>
						<div>
							<h3
								style={{
									fontSize: '1.125rem',
									fontWeight: '600',
									marginBottom: '0.5rem',
									color: '#374151',
								}}
							>
								For APIs
							</h3>
							<p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5' }}>
								Validate JWT tokens, implement proper scopes, and use refresh tokens for long-lived
								sessions.
							</p>
						</div>
					</div>
				</section>

				{/* Configuration Requirements Table */}
				<section style={{ marginTop: '3rem' }}>
					<FlowConfigurationTable />
				</section>
			</div>
		</div>
	);
};

export default OIDCOverview;
