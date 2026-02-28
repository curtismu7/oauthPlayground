import React, { useCallback, useMemo, useState } from 'react';
import {
	FiAlertTriangle,
	FiArrowRight,
	FiCheckCircle,
	FiCode,
	FiSearch,
	FiShield,
} from '@icons';
import styled from 'styled-components';
import { Card, CardBody } from '../../components/Card';
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

// Enhanced styled components
const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 1rem;
  margin: 0 -2rem 3rem -2rem;
  padding: 3rem 2rem;

  h1 {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  p {
    font-size: 1.25rem;
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
    opacity: 0.9;
  }

  @media (max-width: 768px) {
    margin: 0 -1rem 2rem -1rem;
    padding: 2rem 1rem;
    
    h1 {
      font-size: 2rem;
    }
    
    p {
      font-size: 1rem;
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.25rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  @media (max-width: 480px) {
    gap: 0.75rem;
  }
`;

const FlowCard = styled(Card)`
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
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

  &.auth-code { background-color: #dbeafe; color: #1e40af; }
  &.implicit { background-color: #fef3c7; color: #d97706; }
  &.hybrid { background-color: #ecfdf5; color: #059669; }
  &.pkce { background-color: #f0fdf4; color: #16a34a; }
`;

const OIDCOverviewEnhancedSimple = () => {
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

	return (
		<div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
			<div style={{ maxWidth: '87.5rem', margin: '0 auto' }}>
				{/* Enhanced Header */}
				<Header>
					<h1>
						<FiShield />
						OpenID Connect Overview - Enhanced
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
				<section style={{ marginBottom: '3rem' }}>
					<h2
						style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '2rem', color: '#1f2937' }}
					>
						OpenID Connect Authentication Flows
						<span
							style={{ fontSize: '1rem', fontWeight: '400', color: '#6b7280', marginLeft: '1rem' }}
						>
							({filteredFlows.length} flows)
						</span>
					</h2>

					<OverviewGrid>
						{filteredFlows.map((flow) => (
							<FlowCard key={flow.id}>
								<CardBody>
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
								</CardBody>
							</FlowCard>
						))}
					</OverviewGrid>
				</section>

				{/* Success Message */}
				<div
					style={{
						background: '#dcfce7',
						border: '3px solid #10b981',
						borderRadius: '0.5rem',
						padding: '2rem',
						marginBottom: '2rem',
						textAlign: 'center',
						boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
					}}
				>
					<h2
						style={{ color: '#166534', margin: '0 0 1rem 0', fontSize: '2rem', fontWeight: 'bold' }}
					>
						🎉 ENHANCED OIDC OVERVIEW V2.0 - SUCCESSFULLY LOADED! 🎉
					</h2>
					<p
						style={{
							color: '#166534',
							margin: '0 0 1rem 0',
							fontSize: '1.25rem',
							fontWeight: '600',
						}}
					>
						This is the NEW ENHANCED version with interactive search, filtering, detailed flow
						information, security indicators, and comprehensive educational content.
					</p>
					<div
						style={{
							background: '#10b981',
							color: 'white',
							padding: '0.5rem 1rem',
							borderRadius: '0.25rem',
							display: 'inline-block',
							fontWeight: 'bold',
							fontSize: '1.1rem',
						}}
					>
						✅ ENHANCED VERSION ACTIVE ✅
					</div>
				</div>
			</div>
		</div>
	);
};

export default OIDCOverviewEnhancedSimple;
