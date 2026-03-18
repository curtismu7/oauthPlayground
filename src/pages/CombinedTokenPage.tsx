import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { UnifiedTokenDisplayService } from '../services/unifiedTokenDisplayService';
import { unifiedTokenStorage } from '../services/unifiedTokenStorageService';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
import { V9_COLORS } from '../services/v9/V9ColorStandards';
import { logger } from '../utils/logger';
import { TokenMonitoringPage } from '../v8u/pages/TokenMonitoringPage';
import TokenIntrospectionFlow from './flows/TokenIntrospectionFlow';
import TokenRevocationFlow from './flows/TokenRevocationFlow';
import TokenMonitoringTab from './TokenMonitoringTab';

const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
	background: ${V9_COLORS.BG.WHITE};
	border-radius: 12px;
	box-shadow: 0 2px 16px rgba(31, 41, 55, 0.08);
`;

const Title = styled.h2`
	font-size: 2rem;
	font-weight: 700;
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	margin-bottom: 24px;
`;

const TabBar = styled.div`
	display: flex;
	border-bottom: 2px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	margin-bottom: 24px;
`;

const TabButton = styled.button<{ $active: boolean; $color: string }>`
	padding: 12px 24px;
	border: none;
	background: ${({ $active, $color }) => ($active ? $color : 'transparent')};
	color: ${({ $active }) => ($active ? V9_COLORS.TEXT.WHITE : V9_COLORS.TEXT.GRAY_DARK)};
	font-weight: 600;
	border-bottom: ${({ $active, $color }) => ($active ? `3px solid ${$color}` : 'none')};
	cursor: pointer;
	font-size: 1rem;
	transition:
		background 0.2s,
		color 0.2s;
`;

const CombinedTokenPage: React.FC = () => {
	const [activeTab, setActiveTab] = useState<
		'management' | 'introspection' | 'revocation' | 'monitoring'
	>('management');

	// Enhanced token management display using UltimateTokenDisplay
	const TokenManagementDisplay = () => {
		const [currentTokens, setCurrentTokens] = useState<Record<string, unknown> | null>(null);
		const [loading, setLoading] = useState(true);
		const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
		const [timeUntilRefresh, setTimeUntilRefresh] = useState<number>(15 * 60 * 1000); // 15 minutes in ms

		// Load tokens function
		const loadTokens = useCallback(async () => {
			try {
				setLoading(true);

				// Get worker token
				const workerAccessToken = await unifiedWorkerTokenService.getToken();

				// Get most recent OAuth access token
				const oauthTokens = await unifiedTokenStorage.getTokens({
					type: 'access_token',
				});

				// Get most recent ID token
				const idTokens = await unifiedTokenStorage.getTokens({
					type: 'id_token',
				});

				// Combine only the most recent tokens
				const tokens: Record<string, unknown> = {};

				// Prioritize worker token if available
				if (workerAccessToken) {
					tokens.access_token = workerAccessToken;
					tokens.token_type = 'Bearer';
					// Get worker token data for additional info
					const tokenData = unifiedWorkerTokenService.getTokenDataSync();
					if (tokenData) {
						if (tokenData.expiresIn) {
							tokens.expires_in = Math.floor((tokenData.expiresIn * 1000 - Date.now()) / 1000);
						}
						if (tokenData.scope) {
							tokens.scope = Array.isArray(tokenData.scope)
								? tokenData.scope.join(' ')
								: String(tokenData.scope || '');
						}
					}
				}
				// Fall back to most recent OAuth token if no worker token
				else if (oauthTokens.success && oauthTokens.data && oauthTokens.data.length > 0) {
					// Sort by updatedAt to get the most recent
					const sortedTokens = oauthTokens.data.sort(
						(a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0)
					);
					const latestToken = sortedTokens[0];

					tokens.access_token = latestToken.value;
					tokens.token_type = 'Bearer';
					if (latestToken.expiresAt) {
						tokens.expires_in = Math.floor((latestToken.expiresAt - Date.now()) / 1000);
					}
					if (latestToken.metadata?.scope) {
						tokens.scope = Array.isArray(latestToken.metadata.scope)
							? latestToken.metadata.scope.join(' ')
							: String(latestToken.metadata.scope || '');
					}
				}

				// Add most recent ID token if available
				if (idTokens.success && idTokens.data && idTokens.data.length > 0) {
					const sortedIdTokens = idTokens.data.sort(
						(a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0)
					);
					const latestIdToken = sortedIdTokens[0];
					tokens.id_token = latestIdToken.value;
				}

				setCurrentTokens(Object.keys(tokens).length > 0 ? tokens : null);
				setLastUpdated(Date.now());
				setTimeUntilRefresh(15 * 60 * 1000); // Reset to 15 minutes
			} catch (error) {
				logger.error('[TokenOperations] Failed to load tokens', error);
			} finally {
				setLoading(false);
			}
		}, []);

		// Manual refresh function
		const handleRefreshNow = () => {
			loadTokens();
		};

		// Auto-refresh every 15 minutes
		useEffect(() => {
			const interval = setInterval(
				() => {
					loadTokens();
				},
				15 * 60 * 1000
			); // 15 minutes

			return () => clearInterval(interval);
		}, [loadTokens]);

		// Countdown timer
		useEffect(() => {
			const countdownInterval = setInterval(() => {
				const elapsed = Date.now() - lastUpdated;
				const remaining = Math.max(0, 15 * 60 * 1000 - elapsed);
				setTimeUntilRefresh(remaining);
			}, 1000); // Update every second

			return () => clearInterval(countdownInterval);
		}, [lastUpdated]);

		// Initial load
		useEffect(() => {
			loadTokens();
		}, [loadTokens]);

		const formatTimeRemaining = (ms: number) => {
			const minutes = Math.floor(ms / (60 * 1000));
			const seconds = Math.floor((ms % (60 * 1000)) / 1000);
			return `${minutes}:${seconds.toString().padStart(2, '0')}`;
		};

		if (loading) {
			return (
				<div style={{ textAlign: 'center', padding: '2rem' }}>
					<p>Loading tokens...</p>
				</div>
			);
		}

		return (
			<div>
				{/* Auto-refresh banner */}
				<div
					style={{
						background: '#f0f9ff',
						border: '1px solid #0ea5e9',
						borderRadius: '8px',
						padding: '1rem',
						marginBottom: '2rem',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						flexWrap: 'wrap',
						gap: '1rem',
					}}
				>
					<div>
						<h4
							style={{
								margin: '0 0 0.5rem 0',
								color: '#0c4a6e',
								fontSize: '0.875rem',
								fontWeight: 600,
							}}
						>
							🔄 Auto-refresh Enabled
						</h4>
						<p
							style={{
								margin: 0,
								color: '#0284c7',
								fontSize: '0.75rem',
							}}
						>
							Tokens update automatically every 15 minutes. Next refresh in{' '}
							{formatTimeRemaining(timeUntilRefresh)}
						</p>
					</div>
					<button
						type="button"
						onClick={handleRefreshNow}
						onFocus={(e) => {
							e.currentTarget.style.background = '#0284c7';
							e.currentTarget.style.transform = 'translateY(-1px)';
						}}
						onBlur={(e) => {
							e.currentTarget.style.background = '#0ea5e9';
							e.currentTarget.style.transform = 'translateY(0)';
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.background = '#0284c7';
							e.currentTarget.style.transform = 'translateY(-1px)';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.background = '#0ea5e9';
							e.currentTarget.style.transform = 'translateY(0)';
						}}
						style={{
							background: '#0ea5e9',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							padding: '0.5rem 1rem',
							fontSize: '0.875rem',
							fontWeight: 500,
							cursor: 'pointer',
							transition: 'all 0.2s ease',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
						}}
					>
						<span>🔄</span>
						Refresh Now
					</button>
				</div>

				{currentTokens ? (
					UnifiedTokenDisplayService.showTokens(
						currentTokens,
						'oauth',
						'token-operations-management',
						{
							showCopyButtons: true,
							showDecodeButtons: true,
							showFullToken: false, // Keep tokens masked by default for security
						}
					)
				) : (
					<div
						style={{
							textAlign: 'center',
							padding: '2rem',
							background: '#f8fafc',
							border: '1px solid #e2e8f0',
							borderRadius: '8px',
							marginBottom: '2rem',
						}}
					>
						<h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>No Tokens Available</h3>
						<p style={{ color: '#94a3b8', margin: 0 }}>
							Get a worker token or complete an OAuth flow to see tokens here.
						</p>
					</div>
				)}

				<div style={{ marginTop: '2rem' }}>
					<TokenMonitoringPage />
				</div>
			</div>
		);
	};

	return (
		<Container>
			<Title>Token Operations</Title>
			<TabBar>
				<TabButton
					$active={activeTab === 'management'}
					$color={V9_COLORS.PRIMARY.RED}
					onClick={() => setActiveTab('management')}
				>
					Token Management
				</TabButton>
				<TabButton
					$active={activeTab === 'introspection'}
					$color={V9_COLORS.PRIMARY.BLUE}
					onClick={() => setActiveTab('introspection')}
				>
					Token Introspection
				</TabButton>
				<TabButton
					$active={activeTab === 'revocation'}
					$color={V9_COLORS.PRIMARY.GREEN}
					onClick={() => setActiveTab('revocation')}
				>
					Token Revocation
				</TabButton>
				<TabButton
					$active={activeTab === 'monitoring'}
					$color={V9_COLORS.PRIMARY.PURPLE}
					onClick={() => setActiveTab('monitoring')}
				>
					Token Monitoring
				</TabButton>
			</TabBar>
			{activeTab === 'management' && <TokenManagementDisplay />}
			{activeTab === 'introspection' && <TokenIntrospectionFlow />}
			{activeTab === 'revocation' && <TokenRevocationFlow />}
			{activeTab === 'monitoring' && <TokenMonitoringTab />}
		</Container>
	);
};

export default CombinedTokenPage;
