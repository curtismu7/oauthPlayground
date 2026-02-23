/**
 * @file TokenStatusPage.tsx
 * @description Educational page for OAuth 2.0 token status monitoring and management
 * @version 9.27.0
 */

import React, { useState, useEffect } from 'react';
import { FiActivity, FiKey, FiShield, FiCopy, FiEye, FiEyeOff, FiInfo, FiAlertTriangle, FiCheckCircle, FiDatabase, FiLock, FiUnlock, FiClock, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiPause, FiPlay } from 'react-icons/fi';
import styled from 'styled-components';
import { PageHeaderV8, PageHeaderTextColors } from '@/v8/components/shared/PageHeaderV8';
import BootstrapButton from '@/components/bootstrap/BootstrapButton';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const _MODULE_TAG = '[📊 TOKEN-STATUS]';

interface TokenStatus {
	id: string;
	type: 'access' | 'refresh' | 'id' | 'worker';
	value: string;
	status: 'active' | 'expired' | 'revoked' | 'invalid';
	issuedAt: string;
	expiresAt: string;
	issuer: string;
	audience: string;
	scopes?: string[];
	remainingTime?: number;
	lastUsed?: string;
	usageCount?: number;
}

interface TokenMetrics {
	totalTokens: number;
	activeTokens: number;
	expiredTokens: number;
	revokedTokens: number;
	averageLifetime: number;
	mostUsedToken: string;
	leastUsedToken: string;
	recentActivity: TokenActivity[];
}

interface TokenActivity {
	id: string;
	tokenId: string;
	action: 'issued' | 'refreshed' | 'revoked' | 'validated' | 'expired';
	timestamp: string;
	ipAddress?: string;
	userAgent?: string;
	location?: string;
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

const StatusBadge = styled.span<{ $status: 'active' | 'expired' | 'revoked' | 'invalid' }>`
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	${({ $status }) => {
		switch ($status) {
			case 'active':
				return 'background: #10b981; color: white;';
			case 'expired':
				return 'background: #f59e0b; color: white;';
			case 'revoked':
				return 'background: #ef4444; color: white;';
			case 'invalid':
				return 'background: #6b7280; color: white;';
			default:
				return 'background: #6b7280; color: white;';
		}
	}}
`;

const MetricCard = styled.div<{ $trend: 'up' | 'down' | 'stable' }>`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	border-left: 4px solid ${({ $trend }) => 
		$trend === 'up' ? '#10b981' : 
		$trend === 'down' ? '#ef4444' : '#6b7280'
	};
`;

const MetricValue = styled.div`
	font-size: 2rem;
	font-weight: 700;
	color: #1f2937;
	margin: 0.5rem 0;
`;

const MetricLabel = styled.div`
	font-size: 0.875rem;
	color: #6b7280;
	margin-bottom: 0.5rem;
`;

const MetricTrend = styled.div<{ $trend: 'up' | 'down' | 'stable' }>`
	display: flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: ${({ $trend }) => 
		$trend === 'up' ? '#10b981' : 
		$trend === 'down' ? '#ef4444' : '#6b7280'
	};
`;

const ActivityTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	margin: 1rem 0;
	font-size: 0.875rem;
	
	th, td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}
	
	th {
		background: #f8fafc;
		font-weight: 600;
		color: #1f2937;
	}
	
	td {
		color: #4b5563;
	}
`;

// Mock data for demonstration
const mockTokenStatuses: TokenStatus[] = [
	{
		id: 'access-token-1',
		type: 'access',
		value: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
		status: 'active',
		issuedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
		expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
		issuer: 'https://auth.pingone.com/12345678-1234-1234-1234-123456789012',
		audience: 'client-123456',
		scopes: ['openid', 'profile', 'email', 'api:read'],
		remainingTime: 1800,
		lastUsed: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
		usageCount: 15
	},
	{
		id: 'refresh-token-1',
		type: 'refresh',
		value: 'def456ghi789jkl012mno345pqr678stu901vwx234yz567890',
		status: 'active',
		issuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
		issuer: 'https://auth.pingone.com/12345678-1234-1234-1234-123456789012',
		audience: 'client-123456',
		remainingTime: 79200,
		lastUsed: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
		usageCount: 3
	},
	{
		id: 'id-token-1',
		type: 'id',
		value: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjM5MDIyfQ.abc123def456ghi789',
		status: 'active',
		issuedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
		expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
		issuer: 'https://auth.pingone.com/12345678-1234-1234-1234-123456789012',
		audience: 'client-123456',
		scopes: ['openid', 'profile', 'email'],
		remainingTime: 1800,
		lastUsed: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
		usageCount: 15
	},
	{
		id: 'worker-token-1',
		type: 'worker',
		value: 'worker_token_abc123def456ghi789jkl012mno345pqr678stu901vwx',
		status: 'active',
		issuedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
		expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
		issuer: 'https://auth.pingone.com/12345678-1234-1234-1234-123456789012',
		audience: 'worker-service',
		remainingTime: 900,
		lastUsed: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
		usageCount: 25
	},
	{
		id: 'expired-token-1',
		type: 'access',
		value: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.expired.token.signature',
		status: 'expired',
		issuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		expiresAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
		issuer: 'https://auth.pingone.com/12345678-1234-1234-1234-123456789012',
		audience: 'client-123456',
		remainingTime: 0,
		lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		usageCount: 50
	}
];

const mockMetrics: TokenMetrics = {
	totalTokens: 5,
	activeTokens: 4,
	expiredTokens: 1,
	revokedTokens: 0,
	averageLifetime: 3600,
	mostUsedToken: 'worker-token-1',
	leastUsedToken: 'refresh-token-1',
	recentActivity: [
		{
			id: 'activity-1',
			tokenId: 'access-token-1',
			action: 'validated',
			timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
			ipAddress: '192.168.1.100',
			userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
			location: 'New York, US'
		},
		{
			id: 'activity-2',
			tokenId: 'worker-token-1',
			action: 'issued',
			timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
			ipAddress: '10.0.0.1',
			userAgent: 'curl/7.68.0',
			location: 'Server Location'
		},
		{
			id: 'activity-3',
			tokenId: 'refresh-token-1',
			action: 'refreshed',
			timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
			ipAddress: '192.168.1.100',
			userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
			location: 'New York, US'
		}
	]
};

export const TokenStatusPage: React.FC = () => {
	const [tokenStatuses, setTokenStatuses] = useState<TokenStatus[]>(mockTokenStatuses);
	const [metrics, setMetrics] = useState<TokenMetrics>(mockMetrics);
	const [showTokens, setShowTokens] = useState(false);
	const [copiedText, setCopiedText] = useState('');
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [selectedToken, setSelectedToken] = useState<TokenStatus | null>(null);

	const formatTimeRemaining = (seconds: number): string => {
		if (seconds <= 0) return 'Expired';
		
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

	const getStatusTrend = (status: string): 'up' | 'down' | 'stable' => {
		switch (status) {
			case 'active':
				return 'up';
			case 'expired':
			case 'revoked':
				return 'down';
			default:
				return 'stable';
		}
	};

	const handleRefreshStatus = async () => {
		setIsRefreshing(true);
		try {
			// Simulate API call to refresh token status
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			// Update token statuses with new timestamps
			const updatedTokens = tokenStatuses.map(token => ({
				...token,
				remainingTime: token.status === 'active' ? 
					Math.max(0, token.remainingTime! - 60) : 0
			}));
			
			setTokenStatuses(updatedTokens);
			toastV8.success('Token status refreshed successfully');
		} catch (error) {
			toastV8.error('Failed to refresh token status');
		} finally {
			setIsRefreshing(false);
		}
	};

	const copyToClipboard = (text: string, type: string) => {
		navigator.clipboard.writeText(text).then(() => {
			setCopiedText(type);
			toastV8.success(`${type} copied to clipboard`);
			setTimeout(() => setCopiedText(''), 2000);
		}).catch(() => {
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

	const getActionIcon = (action: string) => {
		switch (action) {
			case 'issued':
				return <FiPlay style={{ color: '#10b981' }} />;
			case 'refreshed':
				return <FiRefreshCw style={{ color: '#3b82f6' }} />;
			case 'revoked':
				return <FiPause style={{ color: '#ef4444' }} />;
			case 'validated':
				return <FiCheckCircle style={{ color: '#10b981' }} />;
			case 'expired':
				return <FiAlertTriangle style={{ color: '#f59e0b' }} />;
			default:
				return <FiActivity style={{ color: '#6b7280' }} />;
		}
	};

	return (
		<Container>
			<PageHeaderV8
				title="Token Status Monitoring"
				subtitle="Real-time OAuth 2.0 token status monitoring and management dashboard"
				gradient="#3b82f6"
				textColor={PageHeaderTextColors.white}
			/>

			<Section>
				<SectionTitle>
					<FiActivity />
					Token Metrics Overview
				</SectionTitle>
				
				<Grid>
					<MetricCard $trend="up">
						<MetricLabel>Total Tokens</MetricLabel>
						<MetricValue>{metrics.totalTokens}</MetricValue>
						<MetricTrend $trend="up">
							<FiTrendingUp />
							Active: {metrics.activeTokens}
						</MetricTrend>
					</MetricCard>
					
					<MetricCard $trend="down">
						<MetricLabel>Expired Tokens</MetricLabel>
						<MetricValue>{metrics.expiredTokens}</MetricValue>
						<MetricTrend $trend="down">
							<FiTrendingDown />
							Revoked: {metrics.revokedTokens}
						</MetricTrend>
					</MetricCard>
					
					<MetricCard $trend="stable">
						<MetricLabel>Average Lifetime</MetricLabel>
						<MetricValue>{formatTimeRemaining(metrics.averageLifetime)}</MetricValue>
						<MetricTrend $trend="stable">
							<FiClock />
							Per Token
						</MetricTrend>
					</MetricCard>
					
					<MetricCard $trend="up">
						<MetricLabel>Most Used Token</MetricLabel>
						<MetricValue style={{ fontSize: '1.25rem' }}>
							{metrics.mostUsedToken.split('-')[0].toUpperCase()}
						</MetricValue>
						<MetricTrend $trend="up">
							<FiTrendingUp />
							{tokenStatuses.find(t => t.id === metrics.mostUsedToken)?.usageCount} uses
						</MetricTrend>
					</MetricCard>
				</Grid>
				
				<ActionButtons>
					<BootstrapButton
						variant="primary"
						onClick={handleRefreshStatus}
						disabled={isRefreshing}
					>
						{isRefreshing ? <FiRefreshCw /> : <FiRefreshCw />}
						{isRefreshing ? 'Refreshing...' : 'Refresh Status'}
					</BootstrapButton>
				</ActionButtons>
			</Section>

			<Section>
				<SectionTitle>
					<FiDatabase />
					Token Status List
				</SectionTitle>
				
				<div style={{ overflowX: 'auto' }}>
					<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
						<thead>
							<tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
								<th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>
									Type
								</th>
								<th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>
									Status
								</th>
								<th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>
									Expires In
								</th>
								<th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>
									Usage Count
								</th>
								<th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>
									Last Used
								</th>
								<th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{tokenStatuses.map((token) => (
								<tr key={token.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
									<td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
										{token.type.toUpperCase()}
									</td>
									<td style={{ padding: '0.75rem' }}>
										<StatusBadge $status={token.status}>
											{token.status}
										</StatusBadge>
									</td>
									<td style={{ padding: '0.75rem' }}>
										{formatTimeRemaining(token.remainingTime || 0)}
									</td>
									<td style={{ padding: '0.75rem' }}>
										{token.usageCount}
									</td>
									<td style={{ padding: '0.75rem' }}>
										{token.lastUsed ? new Date(token.lastUsed).toLocaleString() : 'Never'}
									</td>
									<td style={{ padding: '0.75rem' }}>
										<BootstrapButton
											variant="primary"
											onClick={() => setSelectedToken(token)}
											style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
										>
											<FiEye />
											View
										</BootstrapButton>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Section>

			{selectedToken && (
				<Section>
					<SectionTitle>
						<FiKey />
						Token Details: {selectedToken.id}
					</SectionTitle>
					
					<TokenDisplay>
						<TokenHeader>
							<div>
								<div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
									{selectedToken.type.toUpperCase()} Token
								</div>
								<div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
									Status: {selectedToken.status} | Type: {selectedToken.type}
								</div>
							</div>
							<StatusBadge $status={selectedToken.status}>
								{selectedToken.status}
							</StatusBadge>
						</TokenHeader>
						
						<TokenContent $obfuscated={!showTokens}>
							{formatTokenForDisplay(selectedToken.value)}
						</TokenContent>
					</TokenDisplay>
					
					<Grid>
						<Card>
							<CardTitle>
								<FiActivity />
								Token Information
							</CardTitle>
							<PropertyList>
								<dt>Token ID:</dt>
								<dd>{selectedToken.id}</dd>
								<dt>Type:</dt>
								<dd>{selectedToken.type.toUpperCase()}</dd>
								<dt>Status:</dt>
								<dd>
									<StatusBadge $status={selectedToken.status}>
										{selectedToken.status}
									</StatusBadge>
								</dd>
								<dt>Expires In:</dt>
								<dd>{formatTimeRemaining(selectedToken.remainingTime || 0)}</dd>
								<dt>Usage Count:</dt>
								<dd>{selectedToken.usageCount}</dd>
							</PropertyList>
						</Card>
						
						<Card>
							<CardTitle>
								<FiClock />
								Timing Information
							</CardTitle>
							<PropertyList>
								<dt>Issued At:</dt>
								<dd>{new Date(selectedToken.issuedAt).toLocaleString()}</dd>
								<dt>Expires At:</dt>
								<dd>{new Date(selectedToken.expiresAt).toLocaleString()}</dd>
								<dt>Last Used:</dt>
								<dd>{selectedToken.lastUsed ? new Date(selectedToken.lastUsed).toLocaleString() : 'Never'}</dd>
								<dt>Remaining:</dt>
								<dd>{formatTimeRemaining(selectedToken.remainingTime || 0)}</dd>
							</PropertyList>
						</Card>
						
						<Card>
							<CardTitle>
								<FiShield />
								Security Information
							</CardTitle>
							<PropertyList>
								<dt>Issuer:</dt>
								<dd>{selectedToken.issuer}</dd>
								<dt>Audience:</dt>
								<dd>{selectedToken.audience}</dd>
								<dt>Scopes:</dt>
								<dd>{selectedToken.scopes?.join(', ') || 'N/A'}</dd>
							</PropertyList>
						</Card>
					</Grid>
					
					<ActionButtons>
						<BootstrapButton
							variant="primary"
							onClick={() => setShowTokens(!showTokens)}
						>
							{showTokens ? <FiEyeOff /> : <FiEye />}
							{showTokens ? 'Hide Token' : 'Show Token'}
						</BootstrapButton>
						
						<BootstrapButton
							variant="primary"
							onClick={() => copyToClipboard(selectedToken.value, 'Token')}
						>
							{copiedText === 'Token' ? <FiRefreshCw /> : <FiCopy />}
							{copiedText === 'Token' ? 'Copied!' : 'Copy Token'}
						</BootstrapButton>
						
						<BootstrapButton
							variant="secondary"
							onClick={() => setSelectedToken(null)}
						>
							<FiX />
							Close
						</BootstrapButton>
					</ActionButtons>
				</Section>
			)}

			<Section>
				<SectionTitle>
					<FiActivity />
					Recent Token Activity
				</SectionTitle>
				
				<ActivityTable>
					<thead>
						<tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
							<th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>
								Action
							</th>
							<th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>
								Token ID
							</th>
							<th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>
								Timestamp
							</th>
							<th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>
								IP Address
							</th>
							<th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>
								Location
							</th>
						</tr>
					</thead>
					<tbody>
						{metrics.recentActivity.map((activity) => (
							<tr key={activity.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
								<td style={{ padding: '0.75rem' }}>
									<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
										{getActionIcon(activity.action)}
										<span style={{ textTransform: 'capitalize' }}>{activity.action}</span>
									</div>
								</td>
								<td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
									{activity.tokenId}
								</td>
								<td style={{ padding: '0.75rem' }}>
									{new Date(activity.timestamp).toLocaleString()}
								</td>
								<td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
									{activity.ipAddress}
								</td>
								<td style={{ padding: '0.75rem' }}>
									{activity.location}
								</td>
							</tr>
						))}
					</tbody>
				</ActivityTable>
			</Section>

			<Section>
				<SectionTitle>
					<FiShield />
					Security Best Practices
				</SectionTitle>
				
				<Grid>
					<SuccessBox>
						<h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<FiCheckCircle /> Token Monitoring
						</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534' }}>
							<li>Monitor token expiration times proactively</li>
							<li>Track token usage patterns and anomalies</li>
							<li>Implement real-time token status updates</li>
							<li>Set up alerts for token expiration events</li>
							<li>Log all token validation activities</li>
						</ul>
					</SuccessBox>
					
					<SuccessBox>
						<h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<FiCheckCircle /> Security Monitoring
						</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534' }}>
							<li>Monitor for unusual token usage patterns</li>
							<li>Track IP addresses and user agents</li>
							<li>Implement geographic location tracking</li>
							<li>Set up anomaly detection for token activities</li>
							<li>Monitor for concurrent token usage</li>
						</ul>
					</SuccessBox>
					
					<SuccessBox>
						<h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<FiCheckCircle /> Performance Optimization
						</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534' }}>
							<li>Cache token status information</li>
							<li>Implement efficient status polling</li>
							<li>Use WebSocket for real-time updates</li>
							<li>Optimize database queries for token data</li>
							<li>Implement pagination for large token lists</li>
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
							<li><strong>Token Status Not Updating:</strong> Check refresh interval and API connectivity</li>
							<li><strong>Expired Tokens Still Active:</strong> Verify token validation logic</li>
							<li><strong>Missing Token Activities:</strong> Check logging configuration</li>
							<li><strong>Performance Issues:</strong> Optimize database queries and caching</li>
						</ul>
					</WarningBox>
					
					<WarningBox>
						<h4 style={{ margin: '0 0 0.5rem 0' }}>Debugging Steps</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e' }}>
							<li>Verify token parsing and validation logic</li>
							<li>Check database connectivity and queries</li>
							<li>Review token expiration calculation</li>
							<li>Test status update mechanisms</li>
							<li>Monitor API response times and errors</li>
						</ul>
					</WarningBox>
					
					<WarningBox>
						<h4 style={{ margin: '0 0 0.5rem 0' }}>Performance Tips</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e' }}>
							<li>Implement efficient token status caching</li>
							<li>Use database indexes for token queries</li>
							<li>Optimize status update frequency</li>
							<li>Implement pagination for large token sets</li>
							<li>Use background jobs for status updates</li>
						</ul>
					</WarningBox>
				</Grid>
			</Section>
		</Container>
	);
};

export default TokenStatusPage;
