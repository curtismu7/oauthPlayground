/**
 * @file WorkerTokenModal.tsx
 * @module components
 * @description Simplified Worker Token Modal - Single page with all essentials
 * @version 1.0.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
import { V9_COLORS } from '../services/v9/V9ColorStandards';
import { V9CredentialStorageService } from '../services/v9/V9CredentialStorageService';
import { logger } from '../utils/logger';
import { trackedFetch } from '../utils/trackedFetch';
import { DraggableModal } from './DraggableModal';
import { RegionSelect } from './RegionSelect';
import { modernMessaging } from './v9/V9ModernMessagingComponents';

const ModalContent = styled.div`
	padding: 2rem;
	max-width: 550px;
	width: 100%;
	background: white;
	border-radius: 0.75rem;
`;

const Header = styled.div`
	margin-bottom: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h2`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
`;

const FormGrid = styled.div`
	display: grid;
	gap: 1rem;
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
`;

const Label = styled.label`
	font-size: 0.875rem;
	font-weight: 500;
	color: #1f2937;
	margin-bottom: 0.5rem;
`;

const Input = styled.input`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: all 0.15s ease-in-out;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: #9ca3af;
	}
`;

const Select = styled.select`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	background: white;
	transition: all 0.15s ease-in-out;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
	margin-top: 1.5rem;
	padding-top: 1rem;
	border-top: 1px solid #e5e7eb;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	border: none;
	transition: all 0.15s ease-in-out;

	${({ $variant = 'secondary' }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: #3b82f6;
					color: white;
					&:hover {
						background: #2563eb;
					}
					&:disabled {
						background: #d1d5db;
						cursor: not-allowed;
					}
				`;
			default:
				return `
					background: white;
					color: #3b82f6;
					border: 1px solid #3b82f6;
					&:hover {
						background: #f3f4f6;
					}
				`;
		}
	}}
`;

const StatusMessage = styled.div<{ $type?: 'success' | 'error' | 'info' }>`
	padding: 0.75rem 1rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	margin-bottom: 1rem;

	${({ $type = 'info' }) => {
		switch ($type) {
			case 'success':
				return `
					background: #d1fae5;
					color: #065f46;
					border: 1px solid #6ee7b7;
				`;
			case 'error':
				return `
					background: #fee2e2;
					color: #991b1b;
					border: 1px solid #fca5a5;
				`;
			default:
				return `
					background: #dbeafe;
					color: #1e40af;
					border: 1px solid #93c5fd;
				`;
		}
	}}
`;

const TwoColumn = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
`;

export interface WorkerTokenModalProps {
	isOpen: boolean;
	onClose: () => void;
	onTokenGenerated?: (token: string) => void;
}

const WorkerTokenModal: React.FC<WorkerTokenModalProps> = ({
	isOpen,
	onClose,
	onTokenGenerated,
}) => {
	const [credentials, setCredentials] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		region: 'us' as const,
	});

	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [token, setToken] = useState<string | null>(null);
	const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
	const [message, setMessage] = useState('');

	useEffect(() => {
		if (isOpen) {
			try {
				const stored = V9CredentialStorageService.loadSync('worker-token-v9');
				if (stored?.environmentId) {
					setCredentials((prev) => ({
						...prev,
						environmentId: stored.environmentId || prev.environmentId,
						clientId: stored.clientId || prev.clientId,
						clientSecret: stored.clientSecret || prev.clientSecret,
					}));
				}

				const tokenData = unifiedWorkerTokenService.getTokenDataSync();
				if (tokenData?.token) {
					setToken(tokenData.token);
					setStatus('success');
				}
			} catch (error) {
				logger.error('WorkerTokenModal', 'Failed to load credentials:', error);
			}
		}
	}, [isOpen]);

	const handleInputChange = useCallback(
		(field: keyof typeof credentials, value: string) => {
			setCredentials((prev) => ({ ...prev, [field]: value }));
		},
		[]
	);

	const handleGenerateToken = useCallback(async () => {
		if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
			setStatus('error');
			setMessage('Missing required fields');
			return;
		}

		setIsLoading(true);
		setStatus('idle');

		try {
			const bodyParams = {
				grant_type: 'client_credentials',
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
			};

			const urlEncodedBody = new URLSearchParams(bodyParams).toString();
			const response = await trackedFetch('/api/pingone/token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					environment_id: credentials.environmentId,
					region: credentials.region,
					body: urlEncodedBody,
					auth_method: 'client_secret_post',
				}),
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(error);
			}

			const data = await response.json();
			const realToken = data.access_token;

			if (!realToken) throw new Error('No access token received');

			await unifiedWorkerTokenService.saveCredentials(credentials);
			await unifiedWorkerTokenService.saveToken(realToken, {
				expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
				expiresIn: data.expires_in,
			});

			setToken(realToken);
			setStatus('success');
			setMessage('✓ Token generated successfully');
			onTokenGenerated?.(realToken);
		} catch (error) {
			setStatus('error');
			setMessage(error instanceof Error ? error.message : 'Failed to generate token');
			logger.error('WorkerTokenModal', 'Token generation failed', error);
		} finally {
			setIsLoading(false);
		}
	}, [credentials, onTokenGenerated]);

	const handleClearToken = useCallback(async () => {
		try {
			await unifiedWorkerTokenService.clearToken();
			setToken(null);
			setStatus('idle');
		} catch (error) {
			logger.error('WorkerTokenModal', 'Failed to clear token', error);
		}
	}, []);

	if (!isOpen) return null;

	return (
		<DraggableModal isOpen={isOpen} onClose={onClose} title="Worker Token">
			<ModalContent>
				<Header>
					<Title>🔑 Worker Token</Title>
				</Header>

				{message && <StatusMessage $type={status}>{message}</StatusMessage>}

				<FormGrid>
					<FormGroup>
						<Label htmlFor="envId">Environment ID *</Label>
						<Input
							id="envId"
							type="text"
							placeholder="e.g., d02d2305-..."
							value={credentials.environmentId}
							onChange={(e) => handleInputChange('environmentId', e.target.value)}
							disabled={isLoading}
						/>
					</FormGroup>

					<TwoColumn>
						<FormGroup>
							<Label htmlFor="clientId">Client ID *</Label>
							<Input
								id="clientId"
								type="text"
								placeholder="Client ID"
								value={credentials.clientId}
								onChange={(e) => handleInputChange('clientId', e.target.value)}
								disabled={isLoading}
							/>
						</FormGroup>

						<FormGroup>
							<Label htmlFor="region">Region</Label>
							<RegionSelect
								id="region"
								as={Select}
								value={credentials.region}
								onChange={(r) => handleInputChange('region', r)}
								variant="compact"
								disabled={isLoading}
							/>
						</FormGroup>
					</TwoColumn>

					<FormGroup>
						<Label htmlFor="secret">Client Secret *</Label>
						<Input
							id="secret"
							type={showPassword ? 'text' : 'password'}
							placeholder="Client Secret"
							value={credentials.clientSecret}
							onChange={(e) => handleInputChange('clientSecret', e.target.value)}
							disabled={isLoading}
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							style={{
								marginTop: '0.5rem',
								background: 'none',
								border: 'none',
								color: '#3b82f6',
								cursor: 'pointer',
								fontSize: '0.75rem',
								padding: 0,
							}}
						>
							{showPassword ? 'Hide' : 'Show'}
						</button>
					</FormGroup>

					{token && (
						<FormGroup>
							<Label>Generated Token</Label>
							<Input
								type="text"
								value={`${token.substring(0, 20)}...${token.substring(token.length - 10)}`}
								disabled
								style={{ background: '#f3f4f6', color: '#6b7280' }}
							/>
						</FormGroup>
					)}
				</FormGrid>

				<ButtonGroup>
					{token ? (
						<>
							<Button onClick={handleClearToken}>Clear Token</Button>
							<Button $variant="primary" onClick={handleGenerateToken} disabled={isLoading}>
								{isLoading ? 'Refreshing...' : 'Refresh Token'}
							</Button>
						</>
					) : (
						<>
							<Button onClick={onClose}>Cancel</Button>
							<Button
								$variant="primary"
								onClick={handleGenerateToken}
								disabled={isLoading || !credentials.environmentId || !credentials.clientId}
							>
								{isLoading ? 'Generating...' : 'Get Token'}
							</Button>
						</>
					)}
				</ButtonGroup>
			</ModalContent>
		</DraggableModal>
	);
};

export { WorkerTokenModal };
export default WorkerTokenModal;
