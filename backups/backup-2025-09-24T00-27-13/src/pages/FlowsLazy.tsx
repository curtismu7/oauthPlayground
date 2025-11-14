import React, { Suspense } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useLazyLoading, usePreloadFlows } from '../hooks/useLazyLoading';
import { LazyLoadingFallback, CompactLoadingFallback } from '../components/LazyLoadingFallback';
import { logger } from '../utils/logger';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
`;

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.gray600};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const CardTitle = styled.h2`
  font-size: 1.2rem;
  margin: 0;
`;

const CardDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray600};
  margin: 0;
  line-height: 1.5;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ButtonLink = styled(Link)`
  display: inline-block;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-weight: 600;
  border: 1px solid ${({ theme }) => theme.colors.primaryDark};
  transition: all 0.15s ease;
  text-decoration: none;

  &:hover { 
    background: ${({ theme }) => theme.colors.primaryDark}; 
    text-decoration: none;
    transform: translateY(-1px);
  }
`;

const SecondaryLink = styled(Link)`
  display: inline-block;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.gray200};
  color: ${({ theme }) => theme.colors.gray900};
  font-weight: 600;
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  transition: all 0.15s ease;
  text-decoration: none;

  &:hover { 
    background: ${({ theme }) => theme.colors.gray300}; 
    text-decoration: none;
    transform: translateY(-1px);
  }
`;

const PerformanceInfo = styled.div`
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
`;

const PerformanceTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray700};
  font-weight: 600;
`;

const PerformanceStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray600};
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StatValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
`;

// OAuth Flow Registry for lazy loading
const oauthFlowRoutes = {
	'authorization-code': '/flows/authorization-code',
	'authorization-code-pkce': '/flows/authorization-code-pkce',
	'implicit-grant': '/flows/implicit',
	'client-credentials': '/flows/client-credentials',
	password: '/flows/password',
	'device-code': '/flows/device-code',
	'jwt-bearer': '/flows/jwt-bearer',
	'saml-bearer': '/flows/saml-bearer',
	'refresh-token': '/flows/refresh-token',
	'token-exchange': '/flows/token-exchange',
	ciba: '/flows/ciba',
	par: '/flows/par',
	dpop: '/flows/dpop',
	'mutual-tls': '/flows/mutual-tls',
};

const FlowsLazy: React.FC = () => {
	const location = useLocation();

	// Preload common flows for better performance
	const commonFlows = ['authorization-code', 'implicit-grant', 'client-credentials'];
	const { preloadedFlows, isPreloading } = usePreloadFlows(commonFlows);

	// Get current flow type from location
	const getCurrentFlowType = (): string | null => {
		const path = location.pathname;
		const flowEntry = Object.entries(oauthFlowRoutes).find(([, route]) => path.startsWith(route));
		return flowEntry ? flowEntry[0] : null;
	};

	const currentFlowType = getCurrentFlowType();

	// Lazy load current flow if needed
	const { isLoading, error, progress, component, loadTime, retry } = useLazyLoading({
		flowType: currentFlowType || 'authorization-code',
		preload: false,
		retryOnError: true,
		onLoadStart: () => {
			logger.info(`[FlowsLazy] Starting to load flow: ${currentFlowType}`);
		},
		onLoadComplete: (loadedComponent) => {
			logger.info(`[FlowsLazy] Successfully loaded flow: ${currentFlowType}`);
		},
		onLoadError: (error) => {
			logger.error(`[FlowsLazy] Failed to load flow: ${currentFlowType}`, error);
		},
	});

	return (
		<Page>
			<Header>
				<div>
					<Title>OAuth Flows</Title>
					<Sub>
						Explore OAuth 2.0 and OpenID Connect flows with lazy loading for optimal performance.
						{isPreloading && ' (Preloading common flows...)'}
					</Sub>
				</div>
			</Header>

			<Grid>
				<Card>
					<CardTitle>OAuth 2.0 Core Flows</CardTitle>
					<CardDescription>
						Standards-based authorization flows. Recommended: Authorization Code with PKCE for
						public clients.
					</CardDescription>
					<Actions>
						<ButtonLink to="/flows/authorization-code">Authorization Code</ButtonLink>
						<ButtonLink to="/flows/authorization-code-pkce">Auth Code + PKCE</ButtonLink>
						<SecondaryLink to="/flows/client-credentials">Client Credentials</SecondaryLink>
						<SecondaryLink to="/flows/device-code">Device Code</SecondaryLink>
						<SecondaryLink to="/flows/implicit">Implicit (Legacy)</SecondaryLink>
					</Actions>
				</Card>

				<Card>
					<CardTitle>Advanced OAuth Flows</CardTitle>
					<CardDescription>
						Specialized flows for specific use cases and security requirements.
					</CardDescription>
					<Actions>
						<SecondaryLink to="/flows/jwt-bearer">JWT Bearer</SecondaryLink>
						<SecondaryLink to="/flows/saml-bearer">SAML Bearer</SecondaryLink>
						<SecondaryLink to="/flows/refresh-token">Refresh Token</SecondaryLink>
						<SecondaryLink to="/flows/token-exchange">Token Exchange</SecondaryLink>
						<SecondaryLink to="/flows/ciba">CIBA</SecondaryLink>
						<SecondaryLink to="/flows/par">PAR</SecondaryLink>
						<SecondaryLink to="/flows/dpop">DPoP</SecondaryLink>
						<SecondaryLink to="/flows/mutual-tls">Mutual TLS</SecondaryLink>
					</Actions>
				</Card>

				<Card>
					<CardTitle>OpenID Connect</CardTitle>
					<CardDescription>
						Identity layer on top of OAuth 2.0 for authentication and user information.
					</CardDescription>
					<Actions>
						<ButtonLink to="/oidc/id-tokens">ID Tokens</ButtonLink>
						<SecondaryLink to="/oidc/userinfo">UserInfo</SecondaryLink>
						<SecondaryLink to="/oidc/session-management">Session Management</SecondaryLink>
					</Actions>
				</Card>

				<Card>
					<CardTitle>Performance & Loading</CardTitle>
					<CardDescription>Lazy loading and performance optimization features.</CardDescription>
					<Actions>
						<SecondaryLink to="/flows/performance">Performance Dashboard</SecondaryLink>
						<SecondaryLink to="/flows/loading-demo">Loading Demo</SecondaryLink>
					</Actions>
				</Card>
			</Grid>

			{/* Performance Information */}
			<PerformanceInfo>
				<PerformanceTitle>Performance Metrics</PerformanceTitle>
				<PerformanceStats>
					<StatItem>
						<span>Preloaded Flows</span>
						<StatValue>{preloadedFlows.size}</StatValue>
					</StatItem>
					<StatItem>
						<span>Current Flow</span>
						<StatValue>{currentFlowType || 'None'}</StatValue>
					</StatItem>
					<StatItem>
						<span>Load Time</span>
						<StatValue>{loadTime ? `${loadTime}ms` : 'N/A'}</StatValue>
					</StatItem>
					<StatItem>
						<span>Loading Status</span>
						<StatValue>{isLoading ? 'Loading...' : 'Ready'}</StatValue>
					</StatItem>
				</PerformanceStats>
			</PerformanceInfo>

			{/* Lazy Loading Fallback for Outlet */}
			<Suspense
				fallback={
					<LazyLoadingFallback
						flowType={currentFlowType || 'OAuth Flow'}
						message="Loading OAuth flow components..."
						progress={progress}
					/>
				}
			>
				<Outlet />
			</Suspense>

			{/* Error Fallback */}
			{error && (
				<div
					style={{
						background: '#fee2e2',
						border: '1px solid #fecaca',
						borderRadius: '8px',
						padding: '1rem',
						marginTop: '1rem',
					}}
				>
					<h4 style={{ margin: '0 0 0.5rem 0', color: '#dc2626' }}>Failed to Load Flow</h4>
					<p style={{ margin: '0 0 1rem 0', color: '#7f1d1d' }}>{error.message}</p>
					<button
						onClick={retry}
						style={{
							padding: '0.5rem 1rem',
							background: '#dc2626',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							cursor: 'pointer',
						}}
					>
						Retry Loading
					</button>
				</div>
			)}
		</Page>
	);
};

export default FlowsLazy;
