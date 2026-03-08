
import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Card, CardBody } from '../../components/Card';
import { usePageScroll } from '../../hooks/usePageScroll';
import { FiAlertTriangle, FiArrowRight, FiCheckCircle, FiCode, FiShield } from '@icons';

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

// Responsive styled components
const Container = styled.div`
  min-height: 100vh;
  background: #f9fafb;
  padding: 1rem;
  max-width: 100vw;
  overflow-x: hidden;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 0.75rem;

  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  p {
    font-size: 0.9rem;
    line-height: 1.5;
    opacity: 0.9;
    max-width: 100%;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    margin-bottom: 1.5rem;
    
    h1 {
      font-size: 1.5rem;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    p {
      font-size: 0.8rem;
    }
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 1.5rem;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: white;
  
  &:focus {
    outline: none;
    border-color: V9_COLORS.PRIMARY.BLUE;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: V9_COLORS.TEXT.GRAY_LIGHT;
  }
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  font-size: 1rem;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.25rem;
  }
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  padding: 0.4rem 0.8rem;
  border: 2px solid ${(props) => (props.$active ? 'V9_COLORS.PRIMARY.BLUE' : 'V9_COLORS.TEXT.GRAY_LIGHTER')};
  border-radius: 0.375rem;
  background: ${(props) => (props.$active ? 'V9_COLORS.PRIMARY.BLUE' : 'white')};
  color: ${(props) => (props.$active ? 'white' : 'V9_COLORS.TEXT.GRAY_DARK')};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  
  &:hover {
    border-color: V9_COLORS.PRIMARY.BLUE;
    background: ${(props) => (props.$active ? 'V9_COLORS.PRIMARY.BLUE_DARK' : 'V9_COLORS.BG.GRAY_LIGHT')};
  }
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
`;

const FlowCard = styled(Card)`
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const FlowIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;

  &.auth-code { background-color: #dbeafe; color: V9_COLORS.PRIMARY.BLUE_DARK; }
  &.implicit { background-color: V9_COLORS.BG.WARNING; color: V9_COLORS.PRIMARY.YELLOW_DARK; }
  &.hybrid { background-color: V9_COLORS.BG.SUCCESS; color: V9_COLORS.PRIMARY.GREEN_DARK; }
  &.pkce { background-color: #f0fdf4; color: V9_COLORS.PRIMARY.GREEN_DARK; }
`;

const TableContainer = styled.div`
  background: V9_COLORS.TEXT.GRAY_DARK;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1.5rem 0;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
  min-width: 400px;
  
  th, td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid V9_COLORS.TEXT.GRAY_DARK;
  }
  
  th {
    background-color: V9_COLORS.TEXT.GRAY_DARK;
    color: #f9fafb;
    font-weight: 600;
  }
  
  td {
    color: V9_COLORS.TEXT.GRAY_LIGHTER;
  }
  
  tr:hover {
    background-color: V9_COLORS.TEXT.GRAY_DARK;
  }
`;

const TableHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  
  h2 {
    color: white;
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  svg {
    color: V9_COLORS.PRIMARY.BLUE_LIGHT;
  }
`;

const OIDCOverviewNew = () => {
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
		<Container>
			<ContentWrapper>
				{/* Compact Header */}
				<Header>
					<h1>
						<span>🛡️</span>
						OpenID Connect Overview
					</h1>
					<p>
						Comprehensive guide to OpenID Connect authentication flows, concepts, and best
						practices.
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
				<section style={{ marginBottom: '1.5rem' }}>
					<h2
						style={{
							fontSize: '1.5rem',
							fontWeight: '600',
							marginBottom: '1rem',
							color: 'V9_COLORS.TEXT.GRAY_DARK',
						}}
					>
						OpenID Connect Authentication Flows
						<span
							style={{
								fontSize: '0.8rem',
								fontWeight: '400',
								color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
								marginLeft: '0.5rem',
							}}
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
											marginBottom: '0.75rem',
										}}
									>
										<FlowIcon className={flow.color}>
											<flow.icon size={20} />
										</FlowIcon>
										{flow.deprecated && (
											<span
												style={{
													background: 'V9_COLORS.BG.WARNING',
													color: 'V9_COLORS.PRIMARY.YELLOW_DARK',
													padding: '0.125rem 0.375rem',
													borderRadius: '0.25rem',
													fontSize: '0.6rem',
													fontWeight: '500',
												}}
											>
												DEPRECATED
											</span>
										)}
									</div>

									<h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
										{flow.title}
									</h3>

									<p
										style={{
											color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
											marginBottom: '0.75rem',
											lineHeight: '1.4',
											fontSize: '0.8rem',
										}}
									>
										{flow.description}
									</p>

									{/* Enhanced Security Display */}
									<div style={{ marginBottom: '0.75rem' }}>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.25rem',
												marginBottom: '0.25rem',
											}}
										>
											<strong style={{ fontSize: '0.7rem', color: 'V9_COLORS.TEXT.GRAY_DARK' }}>Security:</strong>
											<div style={{ display: 'flex', gap: '0.125rem' }}>
												{Array.from({ length: 10 }, (_, i) => (
													<div
														key={i}
														style={{
															width: '6px',
															height: '6px',
															borderRadius: '50%',
															backgroundColor: i < flow.securityLevel ? 'V9_COLORS.PRIMARY.GREEN' : 'V9_COLORS.TEXT.GRAY_LIGHTER',
														}}
													/>
												))}
											</div>
											<span style={{ fontSize: '0.6rem', color: 'V9_COLORS.TEXT.GRAY_MEDIUM' }}>
												{flow.securityLevel}/10
											</span>
										</div>
										<span
											style={{
												padding: '0.125rem 0.375rem',
												borderRadius: '0.25rem',
												fontSize: '0.6rem',
												fontWeight: '500',
												backgroundColor:
													flow.security === 'Very High'
														? 'V9_COLORS.BG.SUCCESS'
														: flow.security === 'High'
															? '#dbeafe'
															: flow.security === 'Medium-High'
																? 'V9_COLORS.BG.SUCCESS'
																: 'V9_COLORS.BG.WARNING',
												color:
													flow.security === 'Very High'
														? 'V9_COLORS.PRIMARY.GREEN'
														: flow.security === 'High'
															? 'V9_COLORS.PRIMARY.BLUE_DARK'
															: flow.security === 'Medium-High'
																? 'V9_COLORS.PRIMARY.GREEN_DARK'
																: 'V9_COLORS.PRIMARY.YELLOW_DARK',
											}}
										>
											{flow.security}
										</span>
									</div>

									{/* Best For Tags */}
									<div style={{ marginBottom: '0.75rem' }}>
										<strong
											style={{
												fontSize: '0.7rem',
												color: 'V9_COLORS.TEXT.GRAY_DARK',
												display: 'block',
												marginBottom: '0.25rem',
											}}
										>
											Best For:
										</strong>
										<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.125rem' }}>
											{flow.bestFor.slice(0, 2).map((item, index) => (
												<span
													key={index}
													style={{
														background: '#f3f4f6',
														color: 'V9_COLORS.TEXT.GRAY_DARK',
														padding: '0.125rem 0.25rem',
														borderRadius: '0.25rem',
														fontSize: '0.6rem',
														fontWeight: '500',
													}}
												>
													{item}
												</span>
											))}
											{flow.bestFor.length > 2 && (
												<span style={{ fontSize: '0.6rem', color: 'V9_COLORS.TEXT.GRAY_MEDIUM' }}>
													+{flow.bestFor.length - 2} more
												</span>
											)}
										</div>
									</div>

									<button
										onClick={() => setExpandedFlow(expandedFlow === flow.id ? null : flow.id)}
										style={{
											width: '100%',
											padding: '0.375rem',
											backgroundColor: 'transparent',
											border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
											borderRadius: '0.25rem',
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											gap: '0.25rem',
											fontSize: '0.7rem',
										}}
									>
										{expandedFlow === flow.id ? 'Hide Details' : 'Show Details'}
										<FiArrowRight
											size={12}
											style={{
												transform: expandedFlow === flow.id ? 'rotate(90deg)' : 'rotate(0deg)',
												transition: 'transform 0.2s',
												marginLeft: '0.25rem',
											}}
										/>
									</button>

									{expandedFlow === flow.id && (
										<div
											style={{
												marginTop: '0.75rem',
												padding: '0.75rem',
												backgroundColor: '#f9fafb',
												borderRadius: '0.375rem',
												border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
											}}
										>
											{/* Flow Steps */}
											<div style={{ marginBottom: '0.75rem' }}>
												<h4
													style={{
														fontSize: '0.8rem',
														fontWeight: '600',
														marginBottom: '0.5rem',
														color: 'V9_COLORS.TEXT.GRAY_DARK',
													}}
												>
													Flow Steps:
												</h4>
												<div
													style={{
														fontFamily: 'monospace',
														fontSize: '0.7rem',
														background: 'V9_COLORS.TEXT.GRAY_DARK',
														color: '#f9fafb',
														padding: '0.5rem',
														borderRadius: '0.25rem',
														marginBottom: '0.25rem',
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
													gap: '0.5rem',
													marginBottom: '0.75rem',
												}}
											>
												<div>
													<h4
														style={{
															fontSize: '0.7rem',
															fontWeight: '600',
															marginBottom: '0.25rem',
															color: 'V9_COLORS.PRIMARY.GREEN_DARK',
														}}
													>
														✅ Pros:
													</h4>
													<ul
														style={{
															fontSize: '0.7rem',
															color: 'V9_COLORS.TEXT.GRAY_DARK',
															margin: 0,
															paddingLeft: '0.75rem',
														}}
													>
														{flow.pros.map((pro, index) => (
															<li key={index} style={{ marginBottom: '0.125rem' }}>
																{pro}
															</li>
														))}
													</ul>
												</div>
												<div>
													<h4
														style={{
															fontSize: '0.7rem',
															fontWeight: '600',
															marginBottom: '0.25rem',
															color: 'V9_COLORS.PRIMARY.RED_DARK',
														}}
													>
														❌ Cons:
													</h4>
													<ul
														style={{
															fontSize: '0.7rem',
															color: 'V9_COLORS.TEXT.GRAY_DARK',
															margin: 0,
															paddingLeft: '0.75rem',
														}}
													>
														{flow.cons.map((con, index) => (
															<li key={index} style={{ marginBottom: '0.125rem' }}>
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
														fontSize: '0.7rem',
														fontWeight: '600',
														marginBottom: '0.25rem',
														color: 'V9_COLORS.TEXT.GRAY_DARK',
													}}
												>
													🎯 Best For:
												</h4>
												<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
													{flow.bestFor.map((item, index) => (
														<span
															key={index}
															style={{
																background: '#dbeafe',
																color: 'V9_COLORS.PRIMARY.BLUE_DARK',
																padding: '0.125rem 0.25rem',
																borderRadius: '0.25rem',
																fontSize: '0.6rem',
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

				{/* Compact Comparison Table */}
				<TableContainer>
					<TableHeader>
						<span style={{ fontSize: '16px' }}>📈</span>
						<h2>Quick Comparison</h2>
					</TableHeader>

					<Table>
						<thead>
							<tr>
								<th>Flow</th>
								<th>Tokens</th>
								<th>Use Case</th>
								<th>Security</th>
							</tr>
						</thead>
						<tbody>
							{oidcFlows.map((flow) => (
								<tr key={flow.id}>
									<td>
										<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
											<flow.icon size={14} />
											{flow.title}
											{flow.deprecated && (
												<span
													style={{
														background: 'V9_COLORS.BG.WARNING',
														color: 'V9_COLORS.PRIMARY.YELLOW_DARK',
														padding: '0.125rem 0.25rem',
														borderRadius: '0.125rem',
														fontSize: '0.5rem',
														fontWeight: '500',
													}}
												>
													DEP
												</span>
											)}
										</div>
									</td>
									<td>{flow.details.split('→')[flow.details.split('→').length - 1].trim()}</td>
									<td>{flow.useCase}</td>
									<td>
										<div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
											<div style={{ display: 'flex', gap: '0.125rem' }}>
												{Array.from({ length: 5 }, (_, i) => (
													<div
														key={i}
														style={{
															width: '4px',
															height: '4px',
															borderRadius: '50%',
															backgroundColor:
																i < Math.ceil(flow.securityLevel / 2) ? 'V9_COLORS.PRIMARY.GREEN' : 'V9_COLORS.TEXT.GRAY_DARK',
														}}
													/>
												))}
											</div>
											<span style={{ fontSize: '0.6rem' }}>{flow.security}</span>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				</TableContainer>

				{/* Success Message */}
				<div
					style={{
						background: 'V9_COLORS.BG.SUCCESS',
						border: '2px solid V9_COLORS.PRIMARY.GREEN',
						borderRadius: '0.5rem',
						padding: '1rem',
						marginTop: '1.5rem',
						textAlign: 'center',
					}}
				>
					<h3 style={{ color: 'V9_COLORS.PRIMARY.GREEN', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
						✅ New Responsive OIDC Overview Successfully Loaded!
					</h3>
					<p style={{ color: 'V9_COLORS.PRIMARY.GREEN', margin: 0, fontSize: '0.8rem' }}>
						This new version is optimized to fit within the viewport and won't be covered by the
						sidebar menu.
					</p>
				</div>
			</ContentWrapper>
		</Container>
	);
};

export default OIDCOverviewNew;
