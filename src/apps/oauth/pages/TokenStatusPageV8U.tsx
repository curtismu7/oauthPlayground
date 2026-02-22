/**
 * @file TokenStatusPageV8U.tsx
 * @module apps/oauth/pages
 * @description Token Status Monitoring Page for OAuth flows
 * @version 8.0.0
 * @since 2024-11-16
 *
 * This page provides a comprehensive token status monitoring interface for OAuth flows.
 * Features include:
 * - Worker token status monitoring with configuration
 * - User token monitoring (Access, ID, and Refresh tokens)
 * - Real-time token status updates
 * - OAuth configuration management
 * - Token refresh and validation
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { UserTokenStatusDisplayV8U } from '@/apps/user-management/components/UserTokenStatusDisplayV8U';
import { WorkerTokenButton } from '@/components/WorkerTokenButton';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import WorkerTokenStatusDisplayV8 from '@/v8/components/WorkerTokenStatusDisplayV8';
import {
	type TokenStatusInfo,
	WorkerTokenStatusServiceV8,
} from '@/v8/services/workerTokenStatusServiceV8';
import { logger } from '../services/unifiedFlowLoggerServiceV8U';

const _MODULE_TAG = '[🔍 TOKEN-STATUS-V8U]';

// Styled components
const PageContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 24px;
	padding: 24px;
	max-width: 1200px;
	margin: 0 auto;
`;

const HeaderSection = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
	margin-bottom: 8px;

	h1 {
		margin: 0;
		color: #333;
		font-size: 28px;
		font-weight: 600;
	}

	.icon {
		color: #007bff;
		font-size: 32px;
	}
`;

const Description = styled.p`
	margin: 0 0 24px 0;
	color: #666;
	font-size: 16px;
	line-height: 1.5;
`;

const Section = styled.div`
	background: white;
	border-radius: 8px;
	padding: 24px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	border: 1px solid #e0e0e0;

	h2 {
		margin: 0 0 16px 0;
		color: #333;
		font-size: 20px;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.section-icon {
		color: #007bff;
	}
`;

const GridContainer = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
	gap: 24px;
`;

const StatusCard = styled.div`
	background: #f8f9fa;
	border-radius: 6px;
	padding: 16px;
	border-left: 4px solid #007bff;

	.status-title {
		font-weight: 600;
		color: #333;
		margin-bottom: 8px;
	}

	.status-description {
		color: #666;
		font-size: 14px;
		margin-bottom: 12px;
	}

	.status-actions {
		display: flex;
		gap: 12px;
	}
`;

const Button = styled.button`
	padding: 8px 16px;
	border: none;
	border-radius: 4px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&.primary {
		background: #007bff;
		color: white;

		&:hover {
			background: #0056b3;
		}
	}

	&.secondary {
		background: #6c757d;
		color: white;

		&:hover {
			background: #545b62;
		}
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const StatusIndicator = styled.div<{ status: 'success' | 'warning' | 'error' | 'info' }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 4px 12px;
	border-radius: 16px;
	font-size: 12px;
	font-weight: 500;

	${({ status }) => {
		switch (status) {
			case 'success':
				return `
					background: #d4edda;
					color: #155724;
					border: 1px solid #c3e6cb;
				`;
			case 'warning':
				return `
					background: #fff3cd;
					color: #856404;
					border: 1px solid #ffeaa7;
				`;
			case 'error':
				return `
					background: #f8d7da;
					color: #721c24;
					border: 1px solid #f5c6cb;
				`;
			default:
				return `
					background: #d1ecf1;
					color: #0c5460;
					border: 1px solid #bee5eb;
				`;
		}
	}}
`;

type TokenStatusPageProps = {};

export const TokenStatusPageV8U: React.FC<TokenStatusPageProps> = () => {
	const [_workerTokenStatus, setWorkerTokenStatus] = useState<TokenStatusInfo | null>(null);
	const [_userTokenStatus, setUserTokenStatus] = useState<any>(null);

	const _loadTokenStatuses = async () => {
		try {
			logger.info('Loading token statuses...');

			// Load worker token status
			const workerStatus = await WorkerTokenStatusServiceV8.getStatus();
			setWorkerTokenStatus(workerStatus);

			// Load user token status (placeholder for now)
			setUserTokenStatus({
				accessToken: 'placeholder',
				idToken: 'placeholder',
				refreshToken: 'placeholder',
						email: 'test@example.com',
					},
				}
		,
				refreshToken:
		valid: true, expiresIn
		: 2592000, // 30 days
		,
	};
	)

	logger.info('Token statuses loaded successfully')
};
catch (error)
{
	logger.error('Failed to load token statuses', error);
}
finally
{
	setIsLoading(false);
}
}

useEffect(() =>
{
	loadTokenStatuses();
}
, [])

const handleRefreshTokens = async () => {
	try {
		logger.info('Refreshing all tokens...');
		await loadTokenStatuses();
		logger.info('Tokens refreshed successfully');
	} catch (error) {
		logger.error('Failed to refresh tokens', error);
	}
};

const getWorkerTokenStatusIndicator = () => {
	if (!workerTokenStatus) return { status: 'info' as const, text: 'Unknown' };

	if (workerTokenStatus.hasCredentials && workerTokenStatus.tokenValid) {
		return { status: 'success' as const, text: 'Active' };
	} else if (workerTokenStatus.hasCredentials && !workerTokenStatus.tokenValid) {
		return { status: 'warning' as const, text: 'Expired' };
	} else {
		return { status: 'error' as const, text: 'Not Configured' };
	}
};

const workerStatusIndicator = getWorkerTokenStatusIndicator();

return (
		<PageContainer>
			<HeaderSection>
				<FiCode className="icon" />
				<h1>Token Status Monitor</h1>
			</HeaderSection>

			<Description>
				Comprehensive monitoring of OAuth tokens including worker tokens, access tokens, 
				ID tokens, and refresh tokens. Configure and manage your token lifecycle.
			</Description>

			<GridContainer>
				{/* Worker Token Status */}
				<Section>
					<h2>
						<FiShield className="section-icon" />
						Worker Token Status
					</h2>
					<StatusCard>
						<div className="status-title">Current Status</div>
						<div className="status-description">
							Worker tokens are used for backend-to-backend communication with PingOne APIs.
						</div>
						<StatusIndicator status={workerStatusIndicator.status}>
							{workerStatusIndicator.text}
						</StatusIndicator>
						<div className="status-actions">
							{/* Standardized Worker Token Button - matching MFA flow */}
							<WorkerTokenButton 
								onTokenObtained={(token) => {
									console.log('TokenStatusPageV8U: Worker token obtained:', token);
									loadTokenStatuses(); // Refresh status after token obtained
								}}
								onModalClose={() => {
									console.log('TokenStatusPageV8U: Worker token modal closed');
								}}
								environmentId={(() => {
									try {
										const stored = localStorage.getItem('unified_worker_token');
										if (stored) {
											const data = JSON.parse(stored);
											return data.credentials?.environmentId || '';
										}
									} catch (error) {
										console.log('Failed to load environment ID from unified worker token:', error);
									}
									return '';
								})()}
								buttonText="Configure Token"
								loadingText="Configuring..."
							/>
							<Button 
								className="secondary" 
								onClick={handleRefreshTokens}
							>
								Refresh Status
							</Button>
						</div>
					</StatusCard>
					{workerTokenStatus && (
						<WorkerTokenStatusDisplayV8 status={workerTokenStatus} />
					)}
				</Section>

				{/* User Token Status */}
				<Section>
					<h2>
						<FiCode className="section-icon" />
						User Token Status
					</h2>
					{userTokenStatus && (
						<UserTokenStatusDisplayV8U tokenStatus={userTokenStatus} />
					)}
				</Section>
			</GridContainer>

			{/* API Display */}
			<Section>
				<h2>Token API Endpoints</h2>
				<SuperSimpleApiDisplayV8
					title="Token Status API"
					description="API endpoints for checking token status and performing token operations"
					endpoints={[
						{
							method: 'GET',
							path: '/api/token/status',
							description: 'Get current token status information',
							parameters: [],
							responses: {
								200: 'Token status object',
								401: 'Unauthorized',
							},
						},
						{
							method: 'POST',
							path: '/api/token/refresh',
							description: 'Refresh expired tokens',
							parameters: [
								{
									name: 'refresh_token',
									type: 'string',
									required: true,
									description: 'Refresh token to use',
								},
							],
							responses: {
								200: 'New token pair',
								400: 'Invalid refresh token',
							},
						},
						{
							method: 'POST',
							path: '/api/token/introspect',
							description: 'Introspect access token',
							parameters: [
								{
									name: 'token',
									type: 'string',
									required: true,
									description: 'Access token to introspect',
								},
							],
							responses: {
								200: 'Token information',
								400: 'Invalid token',
							},
						},
					]}
					showHeaders={true}
					showTryIt={true}
				/>
			</Section>

			</PageContainer>
	);
}

export default TokenStatusPageV8U;
