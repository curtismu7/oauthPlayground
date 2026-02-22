import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';
import { useStandardSpinner } from '../../components/ui/StandardSpinner';
import { WorkerTokenModalV8 } from '../../v8/components/WorkerTokenModalV8';
import { useUnifiedFlowState } from '../services/enhancedStateManagement';
import {
	type RevocationMethod,
	type TokenInfo,
	TokenMonitoringService,
} from '../services/tokenMonitoringService';

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '', style }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<span
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			title={ariaLabel}
			aria-hidden={ariaHidden}
		/>
	);
};

// MDI Icon mapping function
const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiAlertTriangle: 'mdi-alert',
		FiCheck: 'mdi-check',
		FiCheckCircle: 'mdi-check-circle',
		FiChevronDown: 'mdi-chevron-down',
		FiChevronUp: 'mdi-chevron-up',
		FiClock: 'mdi-clock',
		FiCopy: 'mdi-content-copy',
		FiDatabase: 'mdi-database',
		FiEye: 'mdi-eye',
		FiEyeOff: 'mdi-eye-off',
		FiInfo: 'mdi-information',
		FiRefreshCw: 'mdi-refresh',
		FiSettings: 'mdi-cog',
		FiShield: 'mdi-shield',
		FiTrash2: 'mdi-delete',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

const PageContainer = styled.div`
  padding: var(--ping-spacing-xl, 2rem);
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: var(--ping-spacing-xl, 2rem);
  text-align: center;
`;

const PageTitle = styled.h1`
  color: var(--ping-text-primary, #1e293b);
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: var(--ping-spacing-sm, 0.5rem);
`;

const PageSubtitle = styled.p`
  color: var(--ping-text-secondary, #64748b);
  font-size: 1rem;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--ping-spacing-xl, 1.5rem);
  margin-bottom: var(--ping-spacing-xl, 2rem);
`;

const StatCard = styled.div`
  background: var(--ping-surface-primary, white);
  border: 1px solid var(--ping-border-default, #e2e8f0);
  border-radius: var(--ping-border-radius-md, 8px);
  padding: var(--ping-spacing-lg, 1.5rem);
  text-align: center;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
  
  &:hover {
    box-shadow: var(--ping-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div<{ $color?: string }>`
  font-size: 2rem;
  margin-bottom: var(--ping-spacing-xs, 0.5rem);
  color: ${(props) => props.$color || 'var(--ping-text-secondary, #64748b)'};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--ping-text-primary, #1e293b);
  margin-bottom: var(--ping-spacing-xs, 0.25rem);
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: var(--ping-text-secondary, #64748b);
`;

const TokenGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--ping-spacing-xl, 1.5rem);
  margin-bottom: var(--ping-spacing-xl, 2rem);
`;

const TokenCard = styled.div<{ $status: 'active' | 'expiring' | 'expired' | 'error' }>`
  background: var(--ping-surface-primary, white);
  border: 1px solid var(--ping-border-default, #e2e8f0);
  border-radius: var(--ping-border-radius-lg, 12px);
  padding: var(--ping-spacing-lg, 1.5rem);
  border-left: 4px solid ${(props) => {
		switch (props.$status) {
			case 'active':
				return 'var(--ping-success-color, #10b981)';
			case 'expiring':
				return 'var(--ping-warning-color, #f59e0b)';
			case 'expired':
				return 'var(--ping-error-color, #ef4444)';
			case 'error':
				return 'var(--ping-error-color, #ef4444)';
			default:
				return 'var(--ping-border-default, #e2e8f0)';
		}
	}};
`;

const TokenHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--ping-spacing-md, 1rem);
`;

const TokenType = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ping-text-secondary, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TokenStatus = styled.span<{ $status: 'active' | 'expiring' | 'expired' | 'error' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${(props) => {
		switch (props.$status) {
			case 'active':
				return `
          background: var(--ping-success-light, #dcfce7);
          color: var(--ping-success-dark, #166534);
        `;
			case 'expiring':
				return `
          background: var(--ping-warning-light, #fef3c7);
          color: var(--ping-warning-dark, #92400e);
        `;
			case 'expired':
				return `
          background: var(--ping-error-light, #fee2e2);
          color: var(--ping-error-dark, #991b1b);
        `;
			case 'error':
				return `
          background: var(--ping-error-light, #fee2e2);
          color: var(--ping-error-dark, #991b1b);
        `;
			default:
				return `
          background: var(--ping-surface-secondary, #f8fafc);
          color: var(--ping-text-secondary, #64748b);
        `;
		}
	}}
`;

const TokenInfoContainer = styled.div`
  margin-bottom: var(--ping-spacing-md, 1rem);
`;

const TokenField = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--ping-border-light, #f1f5f9);
  
  &:last-child {
    border-bottom: none;
  }
`;

const FieldLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ping-text-secondary, #64748b);
`;

const FieldValue = styled.div`
  font-size: 0.875rem;
  color: var(--ping-text-primary, #1e293b);
  font-family: monospace;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TokenActions = styled.div`
  display: flex;
  gap: var(--ping-spacing-sm, 0.5rem);
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.5rem 1rem;
  border-radius: var(--ping-border-radius-sm, 6px);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-xs, 0.25rem);
  
  ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
          background: var(--ping-primary-color, #3b82f6);
          border-color: var(--ping-primary-color, #3b82f6);
          color: white;
          
          &:hover {
            background: var(--ping-primary-hover, #2563eb);
            border-color: var(--ping-primary-hover, #2563eb);
          }
        `;
			case 'danger':
				return `
          background: var(--ping-error-color, #ef4444);
          border-color: var(--ping-error-color, #ef4444);
          color: white;
          
          &:hover {
            background: var(--ping-error-hover, #dc2626);
            border-color: var(--ping-error-hover, #dc2626);
          }
        `;
			default:
				return `
          background: var(--ping-surface-primary, white);
          border-color: var(--ping-border-default, #e2e8f0);
          color: var(--ping-text-secondary, #64748b);
          
          &:hover {
            background: var(--ping-surface-secondary, #f8fafc);
            border-color: var(--ping-border-hover, #cbd5e1);
            color: var(--ping-text-primary, #475569);
          }
        `;
		}
	}}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MessageContainer = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: var(--ping-spacing-md, 1rem);
  border-radius: var(--ping-border-radius-md, 8px);
  margin-bottom: var(--ping-spacing-lg, 1.5rem);
  border: 1px solid;
  
  ${(props) => {
		switch (props.$type) {
			case 'success':
				return `
          background: var(--ping-success-light, #dcfce7);
          border-color: var(--ping-success-color, #10b981);
          color: var(--ping-success-dark, #166534);
        `;
			case 'error':
				return `
          background: var(--ping-error-light, #fee2e2);
          border-color: var(--ping-error-color, #ef4444);
          color: var(--ping-error-dark, #991b1b);
        `;
			default:
				return `
          background: var(--ping-info-light, #eff6ff);
          border-color: var(--ping-info-color, #3b82f6);
          color: var(--ping-info-dark, #1e40af);
        `;
		}
	}}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--ping-spacing-xxl, 4rem);
  color: var(--ping-text-secondary, #64748b);
`;

export const TokenMonitoringPagePingUI: React.FC = () => {
	const [tokens, setTokens] = useState<TokenInfo[]>([]);
	const [message, setMessage] = useState<string>('');
	const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
	const [showWorkerModal, setShowWorkerModal] = useState(false);
	const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());
	const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());
	const [selectedMethod] = useState<RevocationMethod>('oauth_revoke');

	const { actions: enhancedStateActions } = useUnifiedFlowState();
	const setTokenMetricsRef = useRef(enhancedStateActions.setTokenMetrics);

	// Standardized spinner hooks for different operation types
	const syncSpinner = useStandardSpinner(5000); // Manual sync - 5 seconds
	const revokeSpinner = useStandardSpinner(4000); // Token revoke - 4 seconds
	const copySpinner = useStandardSpinner(1000); // Copy operation - 1 second

	useEffect(() => {
		setTokenMetricsRef.current = enhancedStateActions.setTokenMetrics;
	});

	// Subscribe to token monitoring service
	useEffect(() => {
		TokenMonitoringService.resetInstance();
		const freshService = TokenMonitoringService.getInstance();

		const initialTokens = freshService.getAllTokens();
		setTokens(initialTokens);
		logger.debug(`[TokenMonitoringPage] Loaded ${initialTokens.length} initial tokens after reset`);

		const unsubscribe = freshService.subscribe((newTokens: TokenInfo[]) => {
			setTokens(newTokens);

			// Auto-expand tokens with issues
			const tokensToExpand = new Set<string>();
			newTokens.forEach((token) => {
				if (token.status === 'expiring' || token.status === 'expired' || token.status === 'error') {
					tokensToExpand.add(token.id);
				}
			});
			setExpandedTokens(tokensToExpand);
		});

		return () => {
			unsubscribe();
		};
	}, []);

	const handleRefresh = async () => {
		await syncSpinner.executeWithSpinner(async () => {
			await TokenMonitoringService.getInstance().manualSyncWorkerToken();
		});
		setMessage('Token list refreshed successfully.');
		setMessageType('success');
		setTimeout(() => setMessage(''), 3000);
	};

	const handleRevoke = async (tokenId: string) => {
		await revokeSpinner.executeWithSpinner(async () => {
			await TokenMonitoringService.getInstance().revokeToken(tokenId, { method: selectedMethod });
		});
		setMessage('Token revoked successfully.');
		setMessageType('success');
		setTimeout(() => setMessage(''), 3000);
	};

	const handleCopyToken = async (token: string) => {
		await copySpinner.executeWithSpinner(async () => {
			await navigator.clipboard.writeText(token);
		});
		setMessage('Token copied to clipboard.');
		setMessageType('success');
		setTimeout(() => setMessage(''), 2000);
	};

	const toggleTokenExpansion = (tokenId: string) => {
		const newExpanded = new Set(expandedTokens);
		if (newExpanded.has(tokenId)) {
			newExpanded.delete(tokenId);
		} else {
			newExpanded.add(tokenId);
		}
		setExpandedTokens(newExpanded);
	};

	const toggleTokenVisibility = (tokenId: string) => {
		const newVisible = new Set(visibleTokens);
		if (newVisible.has(tokenId)) {
			newVisible.delete(tokenId);
		} else {
			newVisible.add(tokenId);
		}
		setVisibleTokens(newVisible);
	};

	const getTokenStats = () => {
		const active = tokens.filter((t) => t.status === 'active').length;
		const expiring = tokens.filter((t) => t.status === 'expiring').length;
		const expired = tokens.filter((t) => t.status === 'expired').length;
		const errors = tokens.filter((t) => t.status === 'error').length;

		return { active, expiring, expired, errors, total: tokens.length };
	};

	const stats = getTokenStats();
	const hasWorkerToken = stats.total > 0 && tokens.some((t) => t.type === 'worker_token');

	return (
		<div className="end-user-nano">
			<PageContainer>
				<PageHeader>
					<PageTitle>
						<MDIIcon icon="FiDatabase" size={28} ariaLabel="Token Database" />
						Token Monitoring
					</PageTitle>
					<PageSubtitle>Manage and monitor OAuth tokens across all flows</PageSubtitle>
				</PageHeader>

				{message && <MessageContainer $type={messageType}>{message}</MessageContainer>}

				<StatsGrid>
					<StatCard>
						<StatIcon $color="var(--ping-success-color, #10b981)">
							<MDIIcon icon="FiCheckCircle" size={32} ariaLabel="Active Tokens" />
						</StatIcon>
						<StatValue>{stats.active}</StatValue>
						<StatLabel>Active Tokens</StatLabel>
					</StatCard>

					<StatCard>
						<StatIcon $color="var(--ping-warning-color, #f59e0b)">
							<MDIIcon icon="FiClock" size={32} ariaLabel="Expiring Tokens" />
						</StatIcon>
						<StatValue>{stats.expiring}</StatValue>
						<StatLabel>Expiring Soon</StatLabel>
					</StatCard>

					<StatCard>
						<StatIcon $color="var(--ping-error-color, #ef4444)">
							<MDIIcon icon="FiAlertTriangle" size={32} ariaLabel="Expired Tokens" />
						</StatIcon>
						<StatValue>{stats.expired}</StatValue>
						<StatLabel>Expired</StatLabel>
					</StatCard>

					<StatCard>
						<StatIcon $color="var(--ping-primary-color, #3b82f6)">
							<MDIIcon icon="FiShield" size={32} ariaLabel="Total Tokens" />
						</StatIcon>
						<StatValue>{stats.total}</StatValue>
						<StatLabel>Total Tokens</StatLabel>
					</StatCard>
				</StatsGrid>

				<TokenActions style={{ marginBottom: 'var(--ping-spacing-lg, 1.5rem)' }}>
					<ActionButton $variant="primary" onClick={handleRefresh} disabled={syncSpinner.isLoading}>
						<MDIIcon icon="FiRefreshCw" size={14} ariaLabel="Refresh" />
						{syncSpinner.isLoading ? 'Refreshing...' : 'Refresh'}
					</ActionButton>

					<ActionButton $variant="secondary" onClick={() => setShowWorkerModal(true)}>
						<MDIIcon icon="FiSettings" size={14} ariaLabel="Worker Settings" />
						Worker Settings
					</ActionButton>

					{hasWorkerToken && (
						<ActionButton
							$variant="secondary"
							onClick={() => {
								const workerToken = tokens.find((t) => t.type === 'worker_token');
								if (workerToken) {
									handleCopyToken(workerToken.value);
								}
							}}
						>
							<MDIIcon icon="FiCopy" size={14} ariaLabel="Copy Worker Token" />
							Copy Worker Token
						</ActionButton>
					)}
				</TokenActions>

				{tokens.length === 0 ? (
					<EmptyState>
						<MDIIcon icon="FiDatabase" size={48} ariaLabel="No Tokens" />
						<h3>No tokens found</h3>
						<p>Start an OAuth flow to see tokens here, or check your worker settings.</p>
					</EmptyState>
				) : (
					<TokenGrid>
						{tokens.map((token) => (
							<TokenCard key={token.id} $status={token.status}>
								<TokenHeader>
									<TokenType>{token.type}</TokenType>
									<TokenStatus $status={token.status}>{token.status}</TokenStatus>
								</TokenHeader>

								<TokenInfoContainer>
									<TokenField>
										<FieldLabel>Status</FieldLabel>
										<FieldValue>{token.status}</FieldValue>
									</TokenField>

									{token.issuedAt && (
										<TokenField>
											<FieldLabel>Created</FieldLabel>
											<FieldValue>{new Date(token.issuedAt).toLocaleString()}</FieldValue>
										</TokenField>
									)}

									{token.expiresAt && (
										<TokenField>
											<FieldLabel>Expires</FieldLabel>
											<FieldValue>{new Date(token.expiresAt).toLocaleString()}</FieldValue>
										</TokenField>
									)}

									{token.scope && token.scope.length > 0 && (
										<TokenField>
											<FieldLabel>Scope</FieldLabel>
											<FieldValue title={token.scope.join(', ')}>
												{token.scope.join(', ')}
											</FieldValue>
										</TokenField>
									)}

									{expandedTokens.has(token.id) && (
										<>
											<TokenField>
												<FieldLabel>Source</FieldLabel>
												<FieldValue>{token.source || 'Unknown'}</FieldValue>
											</TokenField>

											{token.value && (
												<TokenField>
													<FieldLabel>Token Value</FieldLabel>
													<FieldValue>
														{visibleTokens.has(token.id)
															? token.value
															: '••••••••••••••••••••••••••••••••'}
													</FieldValue>
												</TokenField>
											)}
										</>
									)}
								</TokenInfoContainer>

								<TokenActions>
									<ActionButton $variant="secondary" onClick={() => toggleTokenExpansion(token.id)}>
										<MDIIcon
											icon={expandedTokens.has(token.id) ? 'FiChevronUp' : 'FiChevronDown'}
											size={14}
											ariaLabel={expandedTokens.has(token.id) ? 'Collapse' : 'Expand'}
										/>
										{expandedTokens.has(token.id) ? 'Collapse' : 'Expand'}
									</ActionButton>

									{token.value && (
										<ActionButton
											$variant="secondary"
											onClick={() => toggleTokenVisibility(token.id)}
										>
											<MDIIcon
												icon={visibleTokens.has(token.id) ? 'FiEyeOff' : 'FiEye'}
												size={14}
												ariaLabel={visibleTokens.has(token.id) ? 'Hide Token' : 'Show Token'}
											/>
											{visibleTokens.has(token.id) ? 'Hide' : 'Show'}
										</ActionButton>
									)}

									{token.value && (
										<ActionButton $variant="secondary" onClick={() => handleCopyToken(token.value)}>
											<MDIIcon icon="FiCopy" size={14} ariaLabel="Copy Token" />
											Copy
										</ActionButton>
									)}

									{token.status === 'active' && (
										<ActionButton $variant="danger" onClick={() => handleRevoke(token.id)}>
											<MDIIcon icon="FiTrash2" size={14} ariaLabel="Revoke Token" />
											Revoke
										</ActionButton>
									)}
								</TokenActions>
							</TokenCard>
						))}
					</TokenGrid>
				)}

				{showWorkerModal && (
					<WorkerTokenModalV8 isOpen={showWorkerModal} onClose={() => setShowWorkerModal(false)} />
				)}
			</PageContainer>
		</div>
	);
};

export default TokenMonitoringPagePingUI;
