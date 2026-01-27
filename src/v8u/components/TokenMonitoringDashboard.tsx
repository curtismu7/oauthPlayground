import React, { useEffect, useState } from 'react';
import {
	FiActivity,
	FiAlertTriangle,
	FiCheck,
	FiClock,
	FiDownload,
	FiEye,
	FiEyeOff,
	FiInfo,
	FiRefreshCw,
	FiTrash2,
	FiX,
} from 'react-icons/fi';
import styled from 'styled-components';
import { type TokenInfo } from '../services/tokenMonitoringService';

const DashboardContainer = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const DashboardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
`;

const DashboardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const DashboardHeading = styled.h3`
  color: #1e293b;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
`;

const DashboardActions = styled.div`
  display: flex;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: stretch;
  }
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
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
  
  @media (max-width: 768px) {
    flex: 1;
    justify-content: center;
  }
`;

const TokenGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const TokenCard = styled.div<{ $status: 'active' | 'expiring' | 'expired' | 'error' }>`
  background: white;
  border: 2px solid ${(props) => {
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
  border-radius: 8px;
  padding: 1rem;
  position: relative;
  overflow: hidden;
`;

const TokenHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const TokenType = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const TokenStatus = styled.div<{ $status: 'active' | 'expiring' | 'expired' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${(props) => {
		switch (props.$status) {
			case 'active':
				return '#059669';
			case 'expiring':
				return '#d97706';
			case 'expired':
				return '#dc2626';
			case 'error':
				return '#dc2626';
			default:
				return '#64748b';
		}
	}};
`;

const CountdownTimer = styled.div<{ $status: 'active' | 'expiring' | 'expired' | 'error' }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props) => {
		switch (props.$status) {
			case 'active':
				return '#059669';
			case 'expiring':
				return '#d97706';
			case 'expired':
				return '#dc2626';
			case 'error':
				return '#dc2626';
			default:
				return '#64748b';
		}
	}};
  margin: 0.5rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const TokenDetails = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.4;
`;

const TokenActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
`;

const TokenActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
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
          background: transparent;
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

const IntrospectionModal = styled.div<{ $isOpen: boolean }>`
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const ModalClose = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  padding: 0.25rem;
  
  &:hover {
    color: #1e293b;
  }
`;

const IntrospectionContent = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
`;

const StatusIndicator = styled.div<{ $status: 'active' | 'expiring' | 'expired' | 'error' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => {
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
				return '#6b7280';
		}
	}};
  animation: ${(props) => (props.$status === 'active' ? 'pulse 2s infinite' : 'none')};
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

interface TokenMonitoringDashboardProps {
	tokens?: TokenInfo[];
	onTokenRefresh?: (tokenId: string) => void;
	onTokenRevoke?: (tokenId: string) => void;
	onTokenIntrospect?: (tokenId: string) => void;
}

export const TokenMonitoringDashboard: React.FC<TokenMonitoringDashboardProps> = ({
	tokens = [],
	onTokenRefresh,
	onTokenRevoke,
	onTokenIntrospect,
}) => {
	const [tokenStates, setTokenStates] = useState<TokenInfo[]>(tokens);
	const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
	const [showIntrospection, setShowIntrospection] = useState(false);
	const [currentTime, setCurrentTime] = useState(Date.now());

	// Update current time every second for countdown
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(Date.now());
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	// Update token states based on expiry
	useEffect(() => {
		const updatedTokens = tokenStates.map((token) => {
			if (!token.expiresAt) return token;

			const timeUntilExpiry = token.expiresAt - currentTime;
			const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

			let status: TokenInfo['status'] = 'active';
			if (timeUntilExpiry <= 0) {
				status = 'expired';
			} else if (timeUntilExpiry <= fiveMinutes) {
				status = 'expiring';
			}

			return { ...token, status };
		});

		setTokenStates(updatedTokens);
	}, [currentTime, tokenStates.length]);

	const formatTimeRemaining = (expiresAt: number | null): string => {
		if (!expiresAt) return 'No expiry';

		const timeUntilExpiry = expiresAt - currentTime;

		if (timeUntilExpiry <= 0) return 'Expired';

		const hours = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
		const minutes = Math.floor((timeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((timeUntilExpiry % (1000 * 60)) / 1000);

		if (hours > 0) {
			return `${hours}h ${minutes}m ${seconds}s`;
		} else if (minutes > 0) {
			return `${minutes}m ${seconds}s`;
		} else {
			return `${seconds}s`;
		}
	};

	const getStatusIcon = (status: TokenInfo['status']) => {
		switch (status) {
			case 'active':
				return <FiCheck />;
			case 'expiring':
				return <FiAlertTriangle />;
			case 'expired':
				return <FiX />;
			case 'error':
				return <FiX />;
			default:
				return <FiInfo />;
		}
	};

	const toggleTokenVisibility = (tokenId: string) => {
		setTokenStates((prev) =>
			prev.map((token) =>
				token.id === tokenId ? { ...token, isVisible: !token.isVisible } : token
			)
		);
	};

	const handleIntrospect = (token: TokenInfo) => {
		setSelectedToken(token);
		setShowIntrospection(true);
		onTokenIntrospect?.(token.id);
	};

	const maskToken = (token: string): string => {
		if (token.length <= 8) return '****';
		return token.substring(0, 4) + '****' + token.substring(token.length - 4);
	};

	const exportTokenData = () => {
		const exportData = tokenStates.map((token) => ({
			type: token.type,
			status: token.status,
			expiresAt: token.expiresAt ? new Date(token.expiresAt).toISOString() : null,
			issuedAt: token.issuedAt ? new Date(token.issuedAt).toISOString() : null,
			scope: token.scope,
			timeRemaining: formatTimeRemaining(token.expiresAt),
		}));

		const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `token-monitoring-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const refreshAllTokens = () => {
		tokenStates.forEach((token) => {
			if (token.status === 'expired' || token.status === 'expiring') {
				onTokenRefresh?.(token.id);
			}
		});
	};

	const activeTokens = tokenStates.filter((t) => t.status === 'active').length;
	const expiringTokens = tokenStates.filter((t) => t.status === 'expiring').length;
	const expiredTokens = tokenStates.filter((t) => t.status === 'expired').length;

	return (
		<DashboardContainer>
			<DashboardHeader>
				<DashboardTitle>
					<FiActivity style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
					<DashboardHeading>Token Monitoring Dashboard</DashboardHeading>
				</DashboardTitle>

				<DashboardActions>
					<ActionButton onClick={refreshAllTokens} $variant="secondary">
						<FiRefreshCw />
						Refresh All
					</ActionButton>
					<ActionButton onClick={exportTokenData} $variant="secondary">
						<FiDownload />
						Export
					</ActionButton>
				</DashboardActions>
			</DashboardHeader>

			<div
				style={{
					display: 'flex',
					gap: '1rem',
					marginBottom: '1.5rem',
					flexWrap: 'wrap',
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						padding: '0.5rem 1rem',
						background: '#f0fdf4',
						border: '1px solid #86efac',
						borderRadius: '6px',
						fontSize: '0.875rem',
						color: '#166534',
					}}
				>
					<StatusIndicator $status="active" />
					<span>{activeTokens} Active</span>
				</div>

				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						padding: '0.5rem 1rem',
						background: '#fef3c7',
						border: '1px solid #fbbf24',
						borderRadius: '6px',
						fontSize: '0.875rem',
						color: '#92400e',
					}}
				>
					<StatusIndicator $status="expiring" />
					<span>{expiringTokens} Expiring</span>
				</div>

				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						padding: '0.5rem 1rem',
						background: '#fef2f2',
						border: '1px solid #fecaca',
						borderRadius: '6px',
						fontSize: '0.875rem',
						color: '#991b1b',
					}}
				>
					<StatusIndicator $status="expired" />
					<span>{expiredTokens} Expired</span>
				</div>
			</div>

			<TokenGrid>
				{tokenStates.map((token) => (
					<TokenCard key={token.id} $status={token.status}>
						<TokenHeader>
							<TokenType>{token.type.replace('_', ' ').toUpperCase()}</TokenType>
							<TokenStatus $status={token.status}>
								<StatusIndicator $status={token.status} />
								{getStatusIcon(token.status)}
								<span>{token.status}</span>
							</TokenStatus>
						</TokenHeader>

						<CountdownTimer $status={token.status}>
							{formatTimeRemaining(token.expiresAt)}
						</CountdownTimer>

						<TokenDetails>
							<div>
								<strong>Scope:</strong> {token.scope.join(', ') || 'None'}
							</div>
							{token.issuedAt && (
								<div>
									<strong>Issued:</strong> {new Date(token.issuedAt).toLocaleString()}
								</div>
							)}
							{token.expiresAt && (
								<div>
									<strong>Expires:</strong> {new Date(token.expiresAt).toLocaleString()}
								</div>
							)}
							<div style={{ marginTop: '0.5rem', wordBreak: 'break-all' }}>
								<strong>Token:</strong> {token.isVisible ? token.value : maskToken(token.value)}
							</div>
						</TokenDetails>

						<TokenActions>
							<TokenActionButton onClick={() => toggleTokenVisibility(token.id)}>
								{token.isVisible ? <FiEyeOff /> : <FiEye />}
								{token.isVisible ? 'Hide' : 'Show'}
							</TokenActionButton>

							<TokenActionButton onClick={() => handleIntrospect(token)} $variant="primary">
								<FiEye />
								Introspect
							</TokenActionButton>

							{(token.status === 'expired' || token.status === 'expiring') && (
								<TokenActionButton onClick={() => onTokenRefresh?.(token.id)} $variant="primary">
									<FiRefreshCw />
									Refresh
								</TokenActionButton>
							)}

							<TokenActionButton onClick={() => onTokenRevoke?.(token.id)} $variant="danger">
								<FiTrash2 />
								Revoke
							</TokenActionButton>
						</TokenActions>
					</TokenCard>
				))}
			</TokenGrid>

			{tokenStates.length === 0 && (
				<div
					style={{
						textAlign: 'center',
						padding: '3rem 1rem',
						color: '#64748b',
						fontSize: '0.875rem',
					}}
				>
					<FiClock
						style={{
							fontSize: '2rem',
							marginBottom: '1rem',
							display: 'block',
							margin: '0 auto 1rem',
						}}
					/>
					No tokens currently monitored. Complete an OAuth flow to see token information here.
				</div>
			)}

			<IntrospectionModal $isOpen={showIntrospection}>
				<ModalContent>
					<ModalHeader>
						<ModalTitle>Token Introspection</ModalTitle>
						<ModalClose onClick={() => setShowIntrospection(false)}>×</ModalClose>
					</ModalHeader>

					{selectedToken && (
						<div>
							<div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
								<strong>Type:</strong> {selectedToken.type.replace('_', ' ').toUpperCase()}
								<br />
								<strong>Status:</strong> {selectedToken.status}
							</div>

							<IntrospectionContent>
								{selectedToken.introspectionData
									? JSON.stringify(selectedToken.introspectionData, null, 2)
									: 'Introspection data not available. Click "Introspect" to fetch token information.'}
							</IntrospectionContent>
						</div>
					)}
				</ModalContent>
			</IntrospectionModal>
		</DashboardContainer>
	);
};

export default TokenMonitoringDashboard;
