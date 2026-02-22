/**
 * @file WorkerTokenConfiguration.tsx
 * @module components
 * @description Worker token configuration component with consistent UI design
 * @version 1.0.0
 * @since 2025-01-XX
 */

import React, { useState } from 'react';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiSave,
	FiTrash2,
} from 'react-icons/fi';
import styled from 'styled-components';
import { unifiedWorkerTokenService } from '@/services/unifiedWorkerTokenService';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';

// Styled components (matching DomainConfiguration design)
const Container = styled.div`
	background: white;
	border-radius: 1rem;
	border: 1px solid #e2e8f0;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1.5rem;
`;

const Title = styled.h3`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
`;

const Description = styled.p`
	margin: 0 0 1.5rem 0;
	color: #6b7280;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const Form = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Label = styled.label`
	font-weight: 500;
	color: #374151;
	font-size: 0.875rem;
`;

const Input = styled.input<{ $hasError?: boolean }>`
	padding: 0.75rem;
	border: 1px solid ${(props) => (props.$hasError ? '#ef4444' : '#d1d5db')};
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: all 0.2s;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&:disabled {
		background-color: #f9fafb;
		cursor: not-allowed;
	}
`;

const Select = styled.select<{ $hasError?: boolean }>`
	padding: 0.75rem;
	border: 1px solid ${(props) => (props.$hasError ? '#ef4444' : '#d1d5db')};
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: all 0.2s;
	background-color: white;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&:disabled {
		background-color: #f9fafb;
		cursor: not-allowed;
	}
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	margin-top: 1rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 500;
	font-size: 0.875rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;
	border: 1px solid;

	${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
					background-color: #3b82f6;
					color: white;
					border-color: #3b82f6;
					&:hover:not(:disabled) {
						background-color: #2563eb;
					}
				`;
			case 'danger':
				return `
					background-color: #ef4444;
					color: white;
					border-color: #ef4444;
					&:hover:not(:disabled) {
						background-color: #dc2626;
					}
				`;
			default:
				return `
					background-color: white;
					color: #374151;
					border-color: #d1d5db;
					&:hover:not(:disabled) {
						background-color: #f9fafb;
					}
				`;
		}
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const StatusCard = styled.div<{ $type: 'success' | 'warning' | 'error' }>`
	padding: 1rem;
	border-radius: 0.5rem;
	margin-top: 1rem;
	display: flex;
	align-items: center;
	gap: 0.75rem;

	${(props) => {
		switch (props.$type) {
			case 'success':
				return `
					background-color: #f0fdf4;
					border: 1px solid #bbf7d0;
					color: #166534;
				`;
			case 'warning':
				return `
					background-color: #fffbeb;
					border: 1px solid #fed7aa;
					color: #92400e;
				`;
			case 'error':
				return `
					background-color: #fef2f2;
					border: 1px solid #fecaca;
					color: #991b1b;
				`;
		}
	}}
`;

const CurrentTokenInfo = styled.div`
	padding: 1rem;
	background: #f8fafc;
	border-radius: 0.5rem;
	border: 1px solid #e2e8f0;
	margin-bottom: 1rem;
`;

const TokenRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 0;

	&:not(:last-child) {
		border-bottom: 1px solid #e2e8f0;
	}
`;

const TokenLabel = styled.span`
	font-weight: 500;
	color: #374151;
`;

const TokenValue = styled.span`
	color: #6b7280;
	font-family: monospace;
	font-size: 0.875rem;
`;

const InputGroup = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
`;

interface WorkerTokenConfigurationProps {
	/** Optional callback when token is obtained */
	onTokenObtained?: (token: string) => void;
	/** Optional callback when token is cleared */
	onTokenCleared?: () => void;
}

/**
 * Worker Token Configuration Component
 *
 * Provides UI for configuring and managing worker tokens with the same design
 * patterns as DomainConfiguration. Includes credential input, token status,
 * and management functionality.
 */
export const WorkerTokenConfiguration: React.FC<WorkerTokenConfigurationProps> = ({
	onTokenObtained,
	onTokenCleared,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync()
	);

	// Form state
	const [environmentId, setEnvironmentId] = useState('');
	const [clientId, setClientId] = useState('');
	const [clientSecret, setClientSecret] = useState('');
	const [region, setRegion] = useState<'us' | 'eu' | 'ap' | 'ca'>('us');

	// Load existing credentials on mount
	React.useEffect(() => {
		const loadCredentials = async () => {
			try {
				const credentials = await unifiedWorkerTokenService.loadCredentials();
				if (credentials) {
					setEnvironmentId(credentials.environmentId);
					setClientId(credentials.clientId);
					setClientSecret(credentials.clientSecret);
					setRegion(credentials.region || 'us');
				}
			} catch (err) {
				console.error('Failed to load worker token credentials:', err);
			}
		};

		loadCredentials();
	}, []);

	// Check token status periodically
	React.useEffect(() => {
		const checkStatus = () => {
			const currentStatus = WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync();
			setTokenStatus(currentStatus);
		};

		// Check status every 30 seconds
		const interval = setInterval(checkStatus, 30000);

		// Listen for storage changes
		const handleStorageChange = () => checkStatus();
		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('workerTokenUpdated', handleStorageChange);

		return () => {
			clearInterval(interval);
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('workerTokenUpdated', handleStorageChange);
		};
	}, []);

	const handleSaveCredentials = async () => {
		if (!environmentId.trim() || !clientId.trim() || !clientSecret.trim()) {
			setError('All fields are required');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			await unifiedWorkerTokenService.saveCredentials({
				environmentId: environmentId.trim(),
				clientId: clientId.trim(),
				clientSecret: clientSecret.trim(),
				region,
				appId: 'worker-token-config',
				appName: 'Worker Token Configuration',
				appVersion: '1.0.0',
			});

			// Try to get a token
			const token = await unifiedWorkerTokenService.getToken();
			if (token) {
				setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync());
				onTokenObtained?.(token);
			}

			console.log('Worker token credentials saved successfully');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to save credentials';
			setError(errorMessage);
			console.error('Failed to save worker token credentials:', err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleClearCredentials = async () => {
		setIsLoading(true);
		setError(null);

		try {
			await unifiedWorkerTokenService.clearCredentials();
			await unifiedWorkerTokenService.clearToken();

			// Reset form
			setEnvironmentId('');
			setClientId('');
			setClientSecret('');
			setRegion('us');

			// Update status
			setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync());

			onTokenCleared?.();
			console.log('Worker token credentials cleared successfully');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to clear credentials';
			setError(errorMessage);
			console.error('Failed to clear worker token credentials:', err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleRefreshToken = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const token = await unifiedWorkerTokenService.getToken();
			if (token) {
				setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatusSync());
				onTokenObtained?.(token);
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to refresh token';
			setError(errorMessage);
			console.error('Failed to refresh worker token:', err);
		} finally {
			setIsLoading(false);
		}
	};

	const getStatusType = (): 'success' | 'warning' | 'error' => {
		if (error) return 'error';
		if (tokenStatus.isValid) return 'success';
		return 'warning';
	};

	const getStatusMessage = () => {
		if (error) return error;
		if (tokenStatus.isValid) {
			if (tokenStatus.status === 'expiring-soon') {
				return `Token expires in ${tokenStatus.minutesRemaining} minutes`;
			}
			return 'Worker token is valid and ready to use';
		}
		return 'No valid worker token. Configure credentials to obtain one.';
	};

	const getStatusIcon = () => {
		if (error) return <FiAlertTriangle />;
		if (tokenStatus.isValid) return <FiCheckCircle />;
		return <FiInfo />;
	};

	const formatTokenDisplay = (token?: string) => {
		if (!token) return 'None';
		return `${token.substring(0, 12)}...${token.substring(token.length - 6)}`;
	};

	return (
		<Container>
			<Header>
				<FiKey size={24} color="#3b82f6" />
				<Title>Worker Token Configuration</Title>
			</Header>

			<Description>
				Configure PingOne Management API credentials to obtain worker tokens for administrative
				operations. Worker tokens enable access to configuration checking and management features
				across all flows.
			</Description>

			<CurrentTokenInfo>
				<TokenRow>
					<TokenLabel>Token Status:</TokenLabel>
					<TokenValue>{tokenStatus.status.toUpperCase()}</TokenValue>
				</TokenRow>
				<TokenRow>
					<TokenLabel>Token Valid:</TokenLabel>
					<TokenValue>{tokenStatus.isValid ? 'Yes' : 'No'}</TokenValue>
				</TokenRow>
				{tokenStatus.token && (
					<TokenRow>
						<TokenLabel>Current Token:</TokenLabel>
						<TokenValue>{formatTokenDisplay(tokenStatus.token)}</TokenValue>
					</TokenRow>
				)}
				{tokenStatus.expiresAt && (
					<TokenRow>
						<TokenLabel>Expires At:</TokenLabel>
						<TokenValue>{new Date(tokenStatus.expiresAt).toLocaleString()}</TokenValue>
					</TokenRow>
				)}
			</CurrentTokenInfo>

			<Form>
				<InputGroup>
					<FormGroup>
						<Label htmlFor="environment-id">Environment ID</Label>
						<Input
							id="environment-id"
							type="text"
							value={environmentId}
							onChange={(e) => setEnvironmentId(e.target.value)}
							placeholder="Enter environment ID"
							$hasError={!!error}
							disabled={isLoading}
						/>
					</FormGroup>

					<FormGroup>
						<Label htmlFor="client-id">Client ID</Label>
						<Input
							id="client-id"
							type="text"
							value={clientId}
							onChange={(e) => setClientId(e.target.value)}
							placeholder="Enter client ID"
							$hasError={!!error}
							disabled={isLoading}
						/>
					</FormGroup>
				</InputGroup>

				<InputGroup>
					<FormGroup>
						<Label htmlFor="client-secret">Client Secret</Label>
						<Input
							id="client-secret"
							type="password"
							value={clientSecret}
							onChange={(e) => setClientSecret(e.target.value)}
							placeholder="Enter client secret"
							$hasError={!!error}
							disabled={isLoading}
						/>
					</FormGroup>

					<FormGroup>
						<Label htmlFor="region">Region</Label>
						<Select
							id="region"
							value={region}
							onChange={(e) => setRegion(e.target.value as 'us' | 'eu' | 'ap' | 'ca')}
							disabled={isLoading}
						>
							<option value="us">US (North America)</option>
							<option value="eu">EU (Europe)</option>
							<option value="ap">AP (Asia Pacific)</option>
							<option value="ca">CA (Canada)</option>
						</Select>
					</FormGroup>
				</InputGroup>
			</Form>

			<ButtonGroup>
				<Button
					$variant="primary"
					onClick={handleSaveCredentials}
					disabled={isLoading || !environmentId.trim() || !clientId.trim() || !clientSecret.trim()}
				>
					{isLoading ? (
						<FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
					) : (
						<FiSave />
					)}
					{isLoading ? 'Saving...' : 'Save Credentials'}
				</Button>

				{tokenStatus.isValid && (
					<Button onClick={handleRefreshToken} disabled={isLoading}>
						<FiRefreshCw />
						Refresh Token
					</Button>
				)}

				<Button onClick={handleClearCredentials} disabled={isLoading} $variant="danger">
					<FiTrash2 />
					Clear All
				</Button>
			</ButtonGroup>

			<StatusCard $type={getStatusType()}>
				{getStatusIcon()}
				<span>{getStatusMessage()}</span>
			</StatusCard>
		</Container>
	);
};

export default WorkerTokenConfiguration;
