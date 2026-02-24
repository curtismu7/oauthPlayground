/**
 * @file TokenRefreshPage.tsx
 * @description Educational page for OAuth 2.0 token refresh mechanisms and best practices
 * @version 9.27.0
 */

import React, { useEffect, useState } from 'react';
import {
	FiActivity,
	FiAlertTriangle,
	FiCheckCircle,
	FiClock,
	FiCopy,
	FiDatabase,
	FiEye,
	FiEyeOff,
	FiInfo,
	FiKey,
	FiLock,
	FiRefreshCw,
	FiShield,
	FiUnlock,
} from 'react-icons/fi';
import styled from 'styled-components';
import BootstrapButton from '@/components/bootstrap/BootstrapButton';
import { PageHeaderTextColors, PageHeaderV8 } from '@/v8/components/shared/PageHeaderV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const _MODULE_TAG = '[🔄 TOKEN-REFRESH]';

interface TokenData {
	accessToken: string;
	refreshToken: string;
	tokenType: string;
	expiresIn: number;
	scope: string;
	issuedAt: string;
	expiresAt: string;
}

interface RefreshRequest {
	grantType: string;
	refreshToken: string;
	clientId: string;
	clientSecret?: string;
	scope?: string;
}

interface RefreshResponse {
	accessToken: string;
	tokenType: string;
	expiresIn: number;
	refreshToken?: string;
	scope: string;
}

const Container = styled.div`
	padding: 2rem;
	max-width: 1400px;
	margin: 0 auto;
`;

const Section = styled.div`
	background: white;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const TokenDisplay = styled.div`
	background: #1f2937;
	color: #f3f4f6;
	padding: 1.5rem;
	border-radius: 0.5rem;
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow-x: auto;
	margin: 1rem 0;
	position: relative;
`;

const TokenHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
	padding-bottom: 0.5rem;
	border-bottom: 1px solid #374151;
`;

const TokenContent = styled.div<{ $obfuscated: boolean }>`
	white-space: pre-wrap;
	word-break: break-all;
	filter: ${({ $obfuscated }) => ($obfuscated ? 'blur(8px)' : 'none')};
	transition: filter 0.3s ease;
`;

const InfoBox = styled.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: #1e40af;
`;

const WarningBox = styled.div`
	background: #fef3c7;
	border: 1px solid #fcd34d;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: #92400e;
`;

const SuccessBox = styled.div`
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: #166534;
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin: 1.5rem 0;
`;

const Card = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const CardTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const PropertyList = styled.dl`
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.75rem;
	margin: 0;
	
	dt {
		font-weight: 600;
		color: #374151;
	}
	
	dd {
		color: #6b7280;
		word-break: break-all;
	}
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 1rem;
	flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $status: 'valid' | 'expiring' | 'expired' }>`
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	${({ $status }) => {
		switch ($status) {
			case 'valid':
				return 'background: #10b981; color: white;';
			case 'expiring':
				return 'background: #f59e0b; color: white;';
			case 'expired':
				return 'background: #ef4444; color: white;';
			default:
				return 'background: #6b7280; color: white;';
		}
	}}
`;

const CountdownTimer = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
`;

const ProgressBar = styled.div<{ $progress: number }>`
	width: 100%;
	height: 0.5rem;
	background: #e5e7eb;
	border-radius: 0.25rem;
	overflow: hidden;
	margin: 0.5rem 0;
	
	&::after {
		content: '';
		display: block;
		height: 100%;
		width: ${({ $progress }) => $progress}%;
		background: ${({ $progress }) =>
			$progress > 60 ? '#10b981' : $progress > 30 ? '#f59e0b' : '#ef4444'};
		transition: width 1s linear, background 0.3s ease;
	}
`;

// Mock token data for demonstration
const mockTokenData: TokenData = {
	accessToken:
		'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
	refreshToken: 'def456ghi789jkl012mno345pqr678stu901vwx234yz',
	tokenType: 'Bearer',
	expiresIn: 3600,
	scope: 'openid profile email api:read api:write',
	issuedAt: new Date().toISOString(),
	expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
};

const mockRefreshRequest: RefreshRequest = {
	grantType: 'refresh_token',
	refreshToken: 'def456ghi789jkl012mno345pqr678stu901vwx234yz',
	clientId: 'your-client-id',
	clientSecret: 'your-client-secret',
	scope: 'openid profile email api:read api:write',
};

const mockRefreshResponse: RefreshResponse = {
	accessToken:
		'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
	tokenType: 'Bearer',
	expiresIn: 3600,
	refreshToken: 'ghi789jkl012mno345pqr678stu901vwx234yz567',
	scope: 'openid profile email api:read api:write',
};

export const TokenRefreshPage: React.FC = () => {
	const [currentToken, setCurrentToken] = useState<TokenData>(mockTokenData);
	const [refreshRequest, setRefreshRequest] = useState<RefreshRequest>(mockRefreshRequest);
	const [refreshResponse, setRefreshResponse] = useState<RefreshResponse | null>(null);
	const [showTokens, setShowTokens] = useState(false);
	const [copiedText, setCopiedText] = useState('');
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [timeRemaining, setTimeRemaining] = useState(3600);
	const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

	// Countdown timer effect
	useEffect(() => {
		const interval = setInterval(() => {
			const now = Date.now();
			const expiresAt = new Date(currentToken.expiresAt).getTime();
			const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
			setTimeRemaining(remaining);

			// Auto-refresh when token is about to expire (5 minutes before)
			if (autoRefreshEnabled && remaining === 300 && !isRefreshing) {
				handleTokenRefresh();
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [currentToken.expiresAt, autoRefreshEnabled, isRefreshing]);

	const getTokenStatus = (expiresAt: string): 'valid' | 'expiring' | 'expired' => {
		const now = Date.now();
		const expiry = new Date(expiresAt).getTime();
		const remaining = (expiry - now) / 1000;

		if (remaining <= 0) {
			return 'expired';
		} else if (remaining <= 300) {
			// 5 minutes
			return 'expiring';
		}
		return 'valid';
	};

	const formatTimeRemaining = (seconds: number): string => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}h ${minutes}m ${secs}s`;
		} else if (minutes > 0) {
			return `${minutes}m ${secs}s`;
		}
		return `${secs}s`;
	};

	const getProgressPercentage = (): number => {
		const totalLifetime = 3600; // 1 hour in seconds
		const elapsed = totalLifetime - timeRemaining;
		return Math.min(100, Math.max(0, (elapsed / totalLifetime) * 100));
	};

	const handleTokenRefresh = async () => {
		setIsRefreshing(true);
		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Update token with new data
			const newTokenData: TokenData = {
				...currentToken,
				accessToken: mockRefreshResponse.accessToken,
				refreshToken: mockRefreshResponse.refreshToken || currentToken.refreshToken,
				expiresIn: mockRefreshResponse.expiresIn,
				issuedAt: new Date().toISOString(),
				expiresAt: new Date(Date.now() + mockRefreshResponse.expiresIn * 1000).toISOString(),
			};

			setCurrentToken(newTokenData);
			setRefreshResponse(mockRefreshResponse);
			setRefreshRequest((prev) => ({
				...prev,
				refreshToken: newTokenData.refreshToken,
			}));

			toastV8.success('Token refreshed successfully!');
		} catch (error) {
			toastV8.error('Failed to refresh token');
		} finally {
			setIsRefreshing(false);
		}
	};

	const copyToClipboard = (text: string, type: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				setCopiedText(type);
				toastV8.success(`${type} copied to clipboard`);
				setTimeout(() => setCopiedText(''), 2000);
			})
			.catch(() => {
				toastV8.error('Failed to copy to clipboard');
			});
	};

	const formatTokenForDisplay = (token: string): string => {
		// Split token into parts for better readability
		const parts = token.split('.');
		if (parts.length === 3) {
			return `${parts[0]}.${parts[1]}.${parts[2]}`;
		}
		return token;
	};

	return (
		<Container>
			<PageHeaderV8
				title="Token Refresh Management"
				subtitle="OAuth 2.0 token refresh mechanisms and automatic renewal strategies"
				gradient="#059669"
				textColor={PageHeaderTextColors.white}
			/>

			<Section>
				<SectionTitle>
					<FiClock />
					Current Token Status
				</SectionTitle>

				<div>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '1rem',
						}}
					>
						<div>
							<div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
								Token expires in
							</div>
							<CountdownTimer>
								<FiClock />
								{formatTimeRemaining(timeRemaining)}
							</CountdownTimer>
						</div>
						<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<StatusBadge $status={getTokenStatus(currentToken.expiresAt)}>
								{getTokenStatus(currentToken.expiresAt)}
							</StatusBadge>
							<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
								{Math.round(getProgressPercentage())}% used
							</span>
						</div>
					</div>

					<ProgressBar $progress={getProgressPercentage()} />

					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
						<input
							type="checkbox"
							id="auto-refresh"
							checked={autoRefreshEnabled}
							onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
							style={{ marginRight: '0.5rem' }}
						/>
						<label htmlFor="auto-refresh" style={{ fontSize: '0.875rem', color: '#374151' }}>
							Enable auto-refresh 5 minutes before expiry
						</label>
					</div>
				</div>
			</Section>

			<Section>
				<SectionTitle>
					<FiKey />
					Access Token
				</SectionTitle>

				<TokenDisplay>
					<TokenHeader>
						<div>
							<div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
								Access Token (JWT)
							</div>
							<div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
								Type: {currentToken.tokenType} | Scope: {currentToken.scope}
							</div>
						</div>
						<StatusBadge $status={getTokenStatus(currentToken.expiresAt)}>
							{getTokenStatus(currentToken.expiresAt)}
						</StatusBadge>
					</TokenHeader>

					<TokenContent $obfuscated={!showTokens}>
						{formatTokenForDisplay(currentToken.accessToken)}
					</TokenContent>
				</TokenDisplay>

				<ActionButtons>
					<BootstrapButton variant="primary" onClick={() => setShowTokens(!showTokens)}>
						{showTokens ? <FiEyeOff /> : <FiEye />}
						{showTokens ? 'Hide Token' : 'Show Token'}
					</BootstrapButton>

					<BootstrapButton
						variant="primary"
						onClick={() => copyToClipboard(currentToken.accessToken, 'Access Token')}
					>
						{copiedText === 'Access Token' ? <FiRefreshCw /> : <FiCopy />}
						{copiedText === 'Access Token' ? 'Copied!' : 'Copy Token'}
					</BootstrapButton>
				</ActionButtons>
			</Section>

			<Section>
				<SectionTitle>
					<FiRefreshCw />
					Refresh Token
				</SectionTitle>

				<TokenDisplay>
					<TokenHeader>
						<div>
							<div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
								Refresh Token
							</div>
							<div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
								Long-lived token for obtaining new access tokens
							</div>
						</div>
					</TokenHeader>

					<TokenContent $obfuscated={!showTokens}>{currentToken.refreshToken}</TokenContent>
				</TokenDisplay>

				<ActionButtons>
					<BootstrapButton variant="success" onClick={handleTokenRefresh} disabled={isRefreshing}>
						{isRefreshing ? <FiRefreshCw /> : <FiRefreshCw />}
						{isRefreshing ? 'Refreshing...' : 'Refresh Token'}
					</BootstrapButton>

					<BootstrapButton
						variant="primary"
						onClick={() => copyToClipboard(currentToken.refreshToken, 'Refresh Token')}
					>
						{copiedText === 'Refresh Token' ? <FiRefreshCw /> : <FiCopy />}
						{copiedText === 'Refresh Token' ? 'Copied!' : 'Copy Token'}
					</BootstrapButton>
				</ActionButtons>
			</Section>

			{refreshResponse && (
				<Section>
					<SectionTitle>
						<FiCheckCircle />
						Latest Refresh Response
					</SectionTitle>

					<TokenDisplay>
						<TokenHeader>
							<div>
								<div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
									Refresh Response
								</div>
								<div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
									New token obtained successfully
								</div>
							</div>
						</TokenHeader>

						<TokenContent $obfuscated={!showTokens}>
							{JSON.stringify(refreshResponse, null, 2)}
						</TokenContent>
					</TokenDisplay>
				</Section>
			)}

			<Section>
				<SectionTitle>
					<FiDatabase />
					Token Details
				</SectionTitle>

				<Grid>
					<Card>
						<CardTitle>
							<FiActivity />
							Token Information
						</CardTitle>
						<PropertyList>
							<dt>Token Type:</dt>
							<dd>{currentToken.tokenType}</dd>
							<dt>Expires In:</dt>
							<dd>{currentToken.expiresIn} seconds</dd>
							<dt>Scope:</dt>
							<dd>{currentToken.scope}</dd>
							<dt>Issued At:</dt>
							<dd>{new Date(currentToken.issuedAt).toLocaleString()}</dd>
							<dt>Expires At:</dt>
							<dd>{new Date(currentToken.expiresAt).toLocaleString()}</dd>
						</PropertyList>
					</Card>

					<Card>
						<CardTitle>
							<FiShield />
							Security Information
						</CardTitle>
						<PropertyList>
							<dt>Algorithm:</dt>
							<dd>RS256</dd>
							<dt>Token Type:</dt>
							<dd>JWT</dd>
							<dt>Header:</dt>
							<dd>{'{"alg":"RS256","typ":"JWT"}'}</dd>
							<dt>Refresh Token:</dt>
							<dd>Available and valid</dd>
							<dt>Auto-Refresh:</dt>
							<dd>{autoRefreshEnabled ? 'Enabled' : 'Disabled'}</dd>
						</PropertyList>
					</Card>
				</Grid>
			</Section>

			<Section>
				<SectionTitle>
					<FiShield />
					Refresh Request Example
				</SectionTitle>

				<TokenDisplay>
					<TokenHeader>
						<div>
							<div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
								POST /oauth2/token
							</div>
							<div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
								Content-Type: application/x-www-form-urlencoded
							</div>
						</div>
					</TokenHeader>

					<TokenContent $obfuscated={!showTokens}>
						{JSON.stringify(refreshRequest, null, 2)}
					</TokenContent>
				</TokenDisplay>

				<ActionButtons>
					<BootstrapButton
						variant="primary"
						onClick={() =>
							copyToClipboard(
								`curl -X POST https://auth.pingone.com/${refreshRequest.clientId}/as/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=refresh_token" \\
  -d "refresh_token=${refreshRequest.refreshToken}" \\
  -d "client_id=${refreshRequest.clientId}" \\
  -d "client_secret=${refreshRequest.clientSecret}"`,
								'cURL Command'
							)
						}
					>
						{copiedText === 'cURL Command' ? <FiRefreshCw /> : <FiCopy />}
						{copiedText === 'cURL Command' ? 'Copied!' : 'Copy cURL'}
					</BootstrapButton>
				</ActionButtons>
			</Section>

			<Section>
				<SectionTitle>
					<FiShield />
					Security Best Practices
				</SectionTitle>

				<Grid>
					<SuccessBox>
						<h4
							style={{
								margin: '0 0 0.5rem 0',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiCheckCircle /> Token Storage
						</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534' }}>
							<li>Store refresh tokens in secure, HTTP-only cookies</li>
							<li>Use short-lived access tokens (1 hour or less)</li>
							<li>Implement proper token rotation strategies</li>
							<li>Never store tokens in localStorage for production</li>
							<li>Use secure storage mechanisms like Keychain/Keystore</li>
						</ul>
					</SuccessBox>

					<SuccessBox>
						<h4
							style={{
								margin: '0 0 0.5rem 0',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiCheckCircle /> Refresh Strategy
						</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534' }}>
							<li>Refresh tokens before they expire (5-10 minutes buffer)</li>
							<li>Implement silent refresh in background</li>
							<li>Handle refresh token rotation properly</li>
							<li>Fallback to re-authentication if refresh fails</li>
							<li>Monitor refresh token usage and anomalies</li>
						</ul>
					</SuccessBox>

					<SuccessBox>
						<h4
							style={{
								margin: '0 0 0.5rem 0',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
							}}
						>
							<FiCheckCircle /> Error Handling
						</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534' }}>
							<li>Handle invalid_grant errors gracefully</li>
							<li>Implement retry logic with exponential backoff</li>
							<li>Log refresh failures for monitoring</li>
							<li>Provide user feedback for refresh issues</li>
							<li>Redirect to login when refresh tokens expire</li>
						</ul>
					</SuccessBox>
				</Grid>
			</Section>

			<Section>
				<SectionTitle>
					<FiAlertTriangle />
					Troubleshooting
				</SectionTitle>

				<Grid>
					<WarningBox>
						<h4 style={{ margin: '0 0 0.5rem 0' }}>Common Issues</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e' }}>
							<li>
								<strong>invalid_grant:</strong> Refresh token expired or revoked
							</li>
							<li>
								<strong>invalid_client:</strong> Client authentication failed
							</li>
							<li>
								<strong>unauthorized_client:</strong> Client not allowed to use grant type
							</li>
							<li>
								<strong>unsupported_grant_type:</strong> Refresh token grant not supported
							</li>
						</ul>
					</WarningBox>

					<WarningBox>
						<h4 style={{ margin: '0 0 0.5rem 0' }}>Debugging Steps</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e' }}>
							<li>Check refresh token expiration time</li>
							<li>Verify client credentials are correct</li>
							<li>Ensure token endpoint URL is correct</li>
							<li>Check network connectivity to auth server</li>
							<li>Review OAuth configuration settings</li>
						</ul>
					</WarningBox>

					<WarningBox>
						<h4 style={{ margin: '0 0 0.5rem 0' }}>Performance Tips</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e' }}>
							<li>Refresh tokens proactively before expiry</li>
							<li>Implement token caching strategies</li>
							<li>Use connection pooling for token requests</li>
							<li>Monitor refresh token performance metrics</li>
							<li>Optimize refresh timing based on usage patterns</li>
						</ul>
					</WarningBox>
				</Grid>
			</Section>
		</Container>
	);
};

export default TokenRefreshPage;
