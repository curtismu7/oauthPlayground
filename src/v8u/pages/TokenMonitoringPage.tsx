import React, { useEffect, useRef, useState } from 'react';
import {
	FiAlertTriangle,
	FiCheck,
	FiCheckCircle,
	FiChevronDown,
	FiChevronUp,
	FiClock,
	FiCopy,
	FiDatabase,
	FiEye,
	FiEyeOff,
	FiInfo,
	FiRefreshCw,
	FiSettings,
	FiShield,
	FiTrash2,
} from 'react-icons/fi';
import styled from 'styled-components';
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';
import TokenDisplayService from '../../services/tokenDisplayService';
import { WorkerTokenModalV8 } from '../../v8/components/WorkerTokenModalV8';
import { useUnifiedFlowState } from '../services/enhancedStateManagement';
import {
	type RevocationMethod,
	type TokenInfo,
	TokenMonitoringService,
} from '../services/tokenMonitoringService';

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const PageTitle = styled.h1`
  color: #1e293b;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const PageSubtitle = styled.p`
  color: #64748b;
  font-size: 1rem;
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div<{ $color?: string }>`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: ${(props) => props.$color || '#64748b'};
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const TokenGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const TokenCard = styled.div<{ $status: 'active' | 'expiring' | 'expired' | 'error' }>`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid ${(props) => {
		switch (props.$status) {
			case 'active':
				return '#10b981';
			case 'expiring':
				return '#f59e0b';
			case 'expired':
				return '#ef4444';
			case 'error':
				return '#ef4444';
			default:
				return '#e2e8f0';
		}
	}};
`;

const TokenHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const TokenType = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
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
          background: #dcfce7;
          color: #166534;
        `;
			case 'expiring':
				return `
          background: #fef3c7;
          color: #92400e;
        `;
			case 'expired':
				return `
          background: #fecaca;
          color: #991b1b;
        `;
			case 'error':
				return `
          background: #fecaca;
          color: #991b1b;
        `;
			default:
				return `
          background: #f1f5f9;
          color: #64748b';
        `;
		}
	}}
`;

const TokenContent = styled.div`
  margin-bottom: 1rem;
`;

const TokenValue = styled.div`
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  word-break: break-all;
  color: #475569;
`;

const TokenMetadata = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.75rem;
  color: #64748b;
`;

const TokenActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
          
          &:hover {
            background: #2563eb;
            border-color: #2563eb;
          }
        `;
			case 'danger':
				return `
          background: #ef4444;
          border-color: #ef4444;
          color: white;
          
          &:hover {
            background: #dc2626;
            border-color: #dc2626;
          }
        `;
			default:
				return `
          background: white;
          border-color: #e2e8f0;
          color: #64748b;
          
          &:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
            color: #475569;
          }
        `;
		}
	}}
`;

const DropdownContainer = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
`;

const DropdownButton = styled.button`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 200px;
  color: #1e293b;
  
  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-top: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: ${(props) => (props.$isOpen ? 'block' : 'none')};
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  font-size: 0.875rem;
  color: #1e293b;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: #f8fafc;
  }
  
  &:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 8px 8px;
  }
`;

const TokenDecodedContent = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 0.5rem;
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
`;

const DecodedSection = styled.div`
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DecodedHeader = styled.div`
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
`;

const DecodedJson = styled.pre`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0.5rem;
  margin: 0;
  overflow-x: auto;
  color: #475569;
  font-size: 0.7rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #64748b;
  
  svg {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #cbd5e1;
  }
`;

const MessageContainer = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  ${(props) => {
		switch (props.$type) {
			case 'success':
				return `
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
			case 'error':
				return `
          background: #fecaca;
          border: 1px solid #fca5a5;
          color: #991b1b;
        `;
			default:
				return `
          background: #dbeafe;
          border: 1px solid #bfdbfe;
          color: #1e40af;
        `;
		}
	}}
`;

export const TokenMonitoringPage: React.FC = () => {
	const [tokens, setTokens] = useState<TokenInfo[]>([]);
	const [message, setMessage] = useState<string>('');
	const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [selectedFlowType, setSelectedFlowType] = useState<string>('all');
	const [selectedTokenType, setSelectedTokenType] = useState<string>('all');
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isFlowDropdownOpen, setIsFlowDropdownOpen] = useState(false);
	const [decodedTokens, setDecodedTokens] = useState<Record<string, unknown>>({});
	const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

	const { actions: enhancedStateActions } = useUnifiedFlowState();
	const setTokenMetricsRef = useRef(enhancedStateActions.setTokenMetrics);

	useEffect(() => {
		setTokenMetricsRef.current = enhancedStateActions.setTokenMetrics;
	}, [enhancedStateActions]);

	// Subscribe to token monitoring service
	useEffect(() => {
		TokenMonitoringService.resetInstance();
		const freshService = TokenMonitoringService.getInstance();

		const initialTokens = freshService.getAllTokens();
		setTokens(initialTokens);
		logger.debug(`[TokenMonitoringPage] Loaded ${initialTokens.length} initial tokens after reset`);

		const unsubscribe = freshService.subscribe((newTokens: TokenInfo[]) => {
			setTokens(newTokens);
			logger.debug(`[TokenMonitoringPage] Updated tokens: ${newTokens.length} tokens`);

			try {
				const tokenCount = newTokens.length;
				const featureCount = tokenCount > 0 ? 1 : 0;

				setTokenMetricsRef.current({
					tokenCount,
					featureCount,
					lastApiCall: Date.now(),
				});
				logger.debug(
					`[TokenMonitoringPage] Enhanced state management updated: ${tokenCount} tokens`
				);
			} catch (enhancedErr) {
				logger.warn('[TokenMonitoringPage] Failed to update enhanced state management', {
					error: enhancedErr instanceof Error ? enhancedErr.message : String(enhancedErr),
				});
			}
		});

		freshService.manualSyncWorkerToken();

		setTimeout(() => {
			logger.debug('[TokenMonitoringPage] Attempting second worker token sync...');
			freshService.manualSyncWorkerToken();
		}, 1000);

		return unsubscribe;
	}, []);

	// Auto-decode JWT tokens so decoded content is visible in the token list
	useEffect(() => {
		const nextDecoded: Record<string, unknown> = {};
		tokens.forEach((token) => {
			if (TokenDisplayService.isJWT(token.value)) {
				const decoded = TokenDisplayService.decodeJWT(token.value);
				if (decoded) {
					nextDecoded[token.id] = decoded;
				}
			}
		});
		setDecodedTokens(nextDecoded);
	}, [tokens]);

	// Auto-expand decoded content for JWT tokens by default
	useEffect(() => {
		const autoExpanded: Record<string, unknown> = {};
		tokens.forEach((token) => {
			if (TokenDisplayService.isJWT(token.value) && decodedTokens[token.id]) {
				autoExpanded[token.id] = decodedTokens[token.id];
			}
		});
		if (Object.keys(autoExpanded).length > 0) {
			setDecodedTokens((prev) => ({ ...prev, ...autoExpanded }));
		}
	}, [tokens, decodedTokens]);

	// Token actions
	const handleRefreshToken = async (tokenId: string) => {
		try {
			const service = TokenMonitoringService.getInstance();
			await service.refreshToken(tokenId);
			setMessage('Token refreshed successfully');
			setMessageType('success');
		} catch (error) {
			logger.error('Failed to refresh token:', {
				error: error instanceof Error ? error.message : String(error),
			});
			setMessage('Failed to refresh token');
			setMessageType('error');
		}
	};

	const getFlowTypeLabel = (type: string) => {
		switch (type) {
			case 'oauth_flow':
				return 'OAuth Flow';
			case 'worker_token':
				return 'Worker Token Flow';
			default:
				return 'ALL Flows';
		}
	};

	const handleRevokeToken = async (tokenId: string, method: RevocationMethod = 'oauth_revoke') => {
		try {
			const service = TokenMonitoringService.getInstance();
			await service.revokeToken(tokenId, { method });
			setMessage('Token revoked successfully');
			setMessageType('success');
		} catch (error) {
			logger.error('Failed to revoke token:', {
				error: error instanceof Error ? error.message : String(error),
			});
			setMessage('Failed to revoke token');
			setMessageType('error');
		}
	};

	const handleCopyToken = async (token: string, tokenId: string) => {
		try {
			const success = await TokenDisplayService.copyToClipboard(token);
			if (success) {
				setCopiedTokenId(tokenId);
				setTimeout(() => setCopiedTokenId(null), 2000);
				setMessage('Token copied to clipboard');
				setMessageType('success');
			}
		} catch (error) {
			logger.error('Failed to copy token:', {
				error: error instanceof Error ? error.message : String(error),
			});
			setMessage('Failed to copy token');
			setMessageType('error');
		}
	};

	const handleDecodeToken = (token: TokenInfo) => {
		const decoded = TokenDisplayService.decodeJWT(token.value);
		if (decoded) {
			setDecodedTokens((prev) => ({
				...prev,
				[token.id]: decoded,
			}));
		} else {
			setMessage('Token cannot be decoded (not a valid JWT)');
			setMessageType('info');
		}
	};

	const handleToggleDecoded = (tokenId: string) => {
		setDecodedTokens((prev) => {
			const newState = { ...prev };
			if (newState[tokenId]) {
				delete newState[tokenId];
			}
			return newState;
		});
	};

	// Filter tokens based on selected flow type and token type
	const filteredTokens = tokens.filter((token) => {
		const tokenTypeMatches = selectedTokenType === 'all' || token.type === selectedTokenType;
		const flowTypeMatches = selectedFlowType === 'all' || token.source === selectedFlowType;
		return tokenTypeMatches && flowTypeMatches;
	});

	// Calculate stats
	const activeTokens = filteredTokens.filter((t) => t.status === 'active').length;
	const expiringTokens = filteredTokens.filter((t) => t.status === 'expiring').length;
	const expiredTokens = filteredTokens.filter((t) => t.status === 'expired').length;

	const getTokenTypeLabel = (type: string) => {
		switch (type) {
			case 'access_token':
				return 'Access Token';
			case 'refresh_token':
				return 'Refresh Token';
			case 'id_token':
				return 'ID Token';
			case 'worker_token':
				return 'Worker Token';
			default:
				return type;
		}
	};

	const formatExpiry = (expiresAt: number | null) => {
		if (!expiresAt) return 'No expiry';
		const date = new Date(expiresAt);
		return date.toLocaleString();
	};

	return (
		<PageContainer>
			<PageHeader>
				<PageTitle>🔐 Token Monitoring</PageTitle>
				<PageSubtitle>Real-time monitoring and management of OAuth tokens</PageSubtitle>
			</PageHeader>

			{message && (
				<MessageContainer $type={messageType}>
					{messageType === 'success' && <FiCheckCircle />}
					{messageType === 'error' && <FiAlertTriangle />}
					{messageType === 'info' && <FiInfo />}
					{message}
				</MessageContainer>
			)}

			<StatsGrid>
				<StatCard>
					<StatIcon $color="#10b981">
						<FiCheckCircle />
					</StatIcon>
					<StatValue>{activeTokens}</StatValue>
					<StatLabel>Active Tokens</StatLabel>
				</StatCard>
				<StatCard>
					<StatIcon $color="#f59e0b">
						<FiClock />
					</StatIcon>
					<StatValue>{expiringTokens}</StatValue>
					<StatLabel>Expiring Soon</StatLabel>
				</StatCard>
				<StatCard>
					<StatIcon $color="#ef4444">
						<FiAlertTriangle />
					</StatIcon>
					<StatValue>{expiredTokens}</StatValue>
					<StatLabel>Expired</StatLabel>
				</StatCard>
				<StatCard>
					<StatIcon $color="#3b82f6">
						<FiDatabase />
					</StatIcon>
					<StatValue>{filteredTokens.length}</StatValue>
					<StatLabel>Total Tokens</StatLabel>
				</StatCard>
			</StatsGrid>

			<div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
				<DropdownContainer>
					<DropdownButton onClick={() => setIsFlowDropdownOpen(!isFlowDropdownOpen)}>
						<span>{getFlowTypeLabel(selectedFlowType)}</span>
						{isFlowDropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
					</DropdownButton>
					<DropdownMenu $isOpen={isFlowDropdownOpen}>
						<DropdownItem
							onClick={() => {
								setSelectedFlowType('all');
								setIsFlowDropdownOpen(false);
							}}
						>
							<FiDatabase /> ALL Flows
						</DropdownItem>
						<DropdownItem
							onClick={() => {
								setSelectedFlowType('oauth_flow');
								setIsFlowDropdownOpen(false);
							}}
						>
							<FiShield /> OAuth Flow
						</DropdownItem>
						<DropdownItem
							onClick={() => {
								setSelectedFlowType('worker_token');
								setIsFlowDropdownOpen(false);
							}}
						>
							<FiSettings /> Worker Token Flow
						</DropdownItem>
					</DropdownMenu>
				</DropdownContainer>

				<DropdownContainer>
					<DropdownButton onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
						<span>
							{selectedTokenType === 'all'
								? 'ALL Token Types'
								: getTokenTypeLabel(selectedTokenType)}
						</span>
						{isDropdownOpen ? <FiChevronUp /> : <FiChevronDown />}
					</DropdownButton>
					<DropdownMenu $isOpen={isDropdownOpen}>
						<DropdownItem
							onClick={() => {
								setSelectedTokenType('all');
								setIsDropdownOpen(false);
							}}
						>
							<FiDatabase /> ALL Token Types
						</DropdownItem>
						<DropdownItem
							onClick={() => {
								setSelectedTokenType('access_token');
								setIsDropdownOpen(false);
							}}
						>
							<FiShield /> Access Tokens
						</DropdownItem>
						<DropdownItem
							onClick={() => {
								setSelectedTokenType('refresh_token');
								setIsDropdownOpen(false);
							}}
						>
							<FiRefreshCw /> Refresh Tokens
						</DropdownItem>
						<DropdownItem
							onClick={() => {
								setSelectedTokenType('id_token');
								setIsDropdownOpen(false);
							}}
						>
							<FiInfo /> ID Tokens
						</DropdownItem>
						<DropdownItem
							onClick={() => {
								setSelectedTokenType('worker_token');
								setIsDropdownOpen(false);
							}}
						>
							<FiSettings /> Worker Tokens
						</DropdownItem>
					</DropdownMenu>
				</DropdownContainer>
			</div>

			{filteredTokens.length === 0 ? (
				<EmptyState>
					<FiDatabase />
					<h3>No tokens found</h3>
					<p>Complete an OAuth flow to see tokens here</p>
				</EmptyState>
			) : (
				<TokenGrid>
					{filteredTokens.map((token) => (
						<TokenCard key={token.id} $status={token.status}>
							<TokenHeader>
								<TokenType>{getTokenTypeLabel(token.type)}</TokenType>
								<TokenStatus $status={token.status}>{token.status}</TokenStatus>
							</TokenHeader>

							<TokenContent>
								<TokenValue>{TokenDisplayService.maskToken(token.value)}</TokenValue>
								<TokenMetadata>
									<span>ID: {token.id}</span>
									{token.expiresAt && <span>Expires: {formatExpiry(token.expiresAt)}</span>}
									{token.source && <span>Source: {token.source}</span>}
								</TokenMetadata>
							</TokenContent>

							{Boolean(decodedTokens[token.id]) && (
								<TokenDecodedContent>
									<DecodedSection>
										<DecodedHeader>Header</DecodedHeader>
										<DecodedJson>
											{JSON.stringify(
												(decodedTokens[token.id] as { header: unknown }).header,
												null,
												2
											)}
										</DecodedJson>
									</DecodedSection>
									<DecodedSection>
										<DecodedHeader>Payload</DecodedHeader>
										<DecodedJson>
											{JSON.stringify(
												(decodedTokens[token.id] as { payload: unknown }).payload,
												null,
												2
											)}
										</DecodedJson>
									</DecodedSection>
								</TokenDecodedContent>
							)}

							<TokenActions>
								<ActionButton
									onClick={() => handleCopyToken(token.value, token.id)}
									$variant="secondary"
								>
									{copiedTokenId === token.id ? <FiCheck /> : <FiCopy />}
									{copiedTokenId === token.id ? 'Copied!' : 'Copy'}
								</ActionButton>

								{TokenDisplayService.isJWT(token.value) && (
									<ActionButton
										onClick={() =>
											decodedTokens[token.id]
												? handleToggleDecoded(token.id)
												: handleDecodeToken(token)
										}
										$variant="secondary"
									>
										{decodedTokens[token.id] ? <FiEyeOff /> : <FiEye />}
										{decodedTokens[token.id] ? 'Hide' : 'Decode'}
									</ActionButton>
								)}

								<ActionButton onClick={() => handleRefreshToken(token.id)} $variant="primary">
									<FiRefreshCw />
									Refresh
								</ActionButton>

								<ActionButton onClick={() => handleRevokeToken(token.id)} $variant="danger">
									<FiTrash2 />
									Revoke
								</ActionButton>
							</TokenActions>
						</TokenCard>
					))}
				</TokenGrid>
			)}

			{showWorkerTokenModal && (
				<WorkerTokenModalV8
					isOpen={showWorkerTokenModal}
					onClose={() => setShowWorkerTokenModal(false)}
				/>
			)}
		</PageContainer>
	);
};
