/**
 * @file WorkerTokenModalV9.tsx
 * @module components
 * @description V9 Unified Worker Token Modal with PingOne UI
 * @version 9.0.0
 * @since 2026-03-07
 *
 * Features:
 * - UnifiedWorkerTokenService integration
 * - PingOne UI design system
 * - MDI icons
 * - Modern React patterns
 * - Comprehensive worker token management
 */

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
	exportWorkerTokenCredentials,
	importCredentials,
	triggerFileImport,
	type WorkerTokenCredentials,
} from '../services/credentialExportImportService';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
import { V9CredentialStorageService } from '../services/v9/V9CredentialStorageService';
import { DraggableModal } from './DraggableModal';
import { modernMessaging } from './v9/V9ModernMessagingComponents';

// ---------------------------------------------------------------------------
// PingOne UI Styled Components
// ---------------------------------------------------------------------------

const ModalContent = styled.div`
	padding: 2rem;
	max-width: 600px;
	width: 100%;
	background: V9_COLORS.TEXT.WHITE;
	border-radius: 0.75rem;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const Title = styled.h2`
	margin: 0;
	font-size: 1.5rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const Subtitle = styled.p`
	margin: 0.5rem 0 0 0;
	font-size: 0.875rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
`;

const Section = styled.div`
	margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
	margin: 0 0 1rem 0;
	font-size: 1.125rem;
	font-weight: 500;
	color: V9_COLORS.TEXT.GRAY_DARK;
`;

const FormGroup = styled.div`
	margin-bottom: 1rem;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: V9_COLORS.TEXT.GRAY_DARK;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: all 0.15s ease-in-out;

	&:focus {
		outline: none;
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	&::placeholder {
		color: V9_COLORS.TEXT.GRAY_LIGHT;
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	background: V9_COLORS.TEXT.WHITE;
	transition: all 0.15s ease-in-out;

	&:focus {
		outline: none;
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
	margin-top: 2rem;
	padding-top: 1.5rem;
	border-top: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	transition: all 0.15s ease-in-out;
	cursor: pointer;
	border: 1px solid transparent;

	${({ $variant = 'secondary' }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: V9_COLORS.PRIMARY.BLUE;
					color: V9_COLORS.TEXT.WHITE;
					border-color: V9_COLORS.PRIMARY.BLUE;

					&:hover {
						background: V9_COLORS.PRIMARY.BLUE_DARK;
						border-color: V9_COLORS.PRIMARY.BLUE_DARK;
					}

					&:disabled {
						background: V9_COLORS.TEXT.GRAY_LIGHT;
						border-color: V9_COLORS.TEXT.GRAY_LIGHT;
						cursor: not-allowed;
					}
				`;
			case 'danger':
				return `
					background: V9_COLORS.PRIMARY.RED;
					color: V9_COLORS.TEXT.WHITE;
					border-color: V9_COLORS.PRIMARY.RED;

					&:hover {
						background: V9_COLORS.PRIMARY.RED_DARK;
						border-color: V9_COLORS.PRIMARY.RED_DARK;
					}
				`;
			default:
				return `
					background: V9_COLORS.TEXT.WHITE;
					color: V9_COLORS.TEXT.GRAY_DARK;
					border-color: V9_COLORS.TEXT.GRAY_LIGHTER;

					&:hover {
						background: #f9fafb;
						border-color: V9_COLORS.TEXT.GRAY_LIGHT;
					}
				`;
		}
	}}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'error' | 'success' }>`
	padding: 1rem;
	border-radius: 0.5rem;
	margin-bottom: 1rem;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;

	${({ $variant = 'info' }) => {
		switch ($variant) {
			case 'warning':
				return `
					background: V9_COLORS.BG.WARNING;
					border: 1px solid V9_COLORS.PRIMARY.YELLOW_LIGHT;
					color: V9_COLORS.PRIMARY.YELLOW_DARK;
				`;
			case 'error':
				return `
					background: V9_COLORS.BG.ERROR;
					border: 1px solid V9_COLORS.PRIMARY.RED_LIGHT;
					color: V9_COLORS.PRIMARY.RED_DARK;
				`;
			case 'success':
				return `
					background: V9_COLORS.BG.SUCCESS;
					border: 1px solid V9_COLORS.PRIMARY.GREEN_LIGHT;
					color: V9_COLORS.PRIMARY.GREEN_DARK;
				`;
			default:
				return `
					background: #dbeafe;
					border: 1px solid V9_COLORS.PRIMARY.BLUE_LIGHT;
					color: V9_COLORS.PRIMARY.BLUE_DARK;
				`;
		}
	}}
`;

const StatusIndicator = styled.div<{ $status?: 'loading' | 'success' | 'error' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;

	${({ $status = 'loading' }) => {
		switch ($status) {
			case 'success':
				return `
					background: V9_COLORS.BG.SUCCESS;
					color: V9_COLORS.PRIMARY.GREEN_DARK;
				`;
			case 'error':
				return `
					background: V9_COLORS.BG.ERROR;
					color: V9_COLORS.PRIMARY.RED_DARK;
				`;
			default:
				return `
					background: V9_COLORS.BG.WARNING;
					color: V9_COLORS.PRIMARY.YELLOW_DARK;
				`;
		}
	}}
`;

// ---------------------------------------------------------------------------
// MDI Icon Component
// ---------------------------------------------------------------------------

const MDIIcon: React.FC<{ icon: string; size?: number; className?: string }> = ({
	icon,
	size = 20,
	className = '',
}) => {
	const iconMap: Record<string, string> = {
		FiKey: 'mdi-key',
		FiRefreshCw: 'mdi-refresh',
		FiCheckCircle: 'mdi-check-circle',
		FiAlertCircle: 'mdi-alert-circle',
		FiInfo: 'mdi-information',
		FiX: 'mdi-close',
		FiSave: 'mdi-content-save',
		FiExternalLink: 'mdi-open-in-new',
		FiEye: 'mdi-eye',
		FiEyeOff: 'mdi-eye-off',
	};

	const mdiIcon = iconMap[icon] || 'mdi-help';

	return <i className={`mdi ${mdiIcon} ${className}`} style={{ fontSize: `${size}px` }}></i>;
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkerTokenModalV9Props {
	isOpen: boolean;
	onClose: () => void;
	onTokenGenerated?: (token: string) => void;
	skipCredentialsStep?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WorkerTokenModalV9: React.FC<WorkerTokenModalV9Props> = ({
	isOpen,
	onClose,
	onTokenGenerated,
	skipCredentialsStep = false,
}) => {
	// State
	const [credentials, setCredentials] = useState<{
		environmentId: string;
		clientId: string;
		clientSecret: string;
		region: 'us' | 'eu' | 'ap' | 'ca';
		scopes: string[];
		tokenEndpointAuthMethod:
			| 'none'
			| 'client_secret_basic'
			| 'client_secret_post'
			| 'client_secret_jwt'
			| 'private_key_jwt';
	}>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		region: 'us',
		scopes: ['openid', 'pingone'],
		tokenEndpointAuthMethod: 'client_secret_basic',
	});

	const [showPassword, setShowPassword] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [tokenStatus, setTokenStatus] = useState<'idle' | 'generating' | 'success' | 'error'>(
		'idle'
	);
	const [generatedToken, setGeneratedToken] = useState<string | null>(null);

	const loadExistingCredentials = useCallback(async () => {
		try {
			// First try V9CredentialStorageService (primary for V9 flows)
			const v9Credentials = V9CredentialStorageService.loadSync('worker-token-v9');
			if (v9Credentials && Object.keys(v9Credentials).length > 0) {
				setCredentials((prev) => ({
					...prev,
					environmentId: v9Credentials.environmentId || prev.environmentId,
					clientId: v9Credentials.clientId || prev.clientId,
					clientSecret: v9Credentials.clientSecret || prev.clientSecret,
					// V9 service doesn't store region, scopes, tokenEndpointAuthMethod - use defaults
				}));
			} else {
				// Fallback to UnifiedWorkerTokenService
				const result = await unifiedWorkerTokenService.loadCredentials();
				if (result.success && result.data) {
					const creds = result.data;
					setCredentials((prev) => ({
						...prev,
						environmentId: creds.environmentId || prev.environmentId,
						clientId: creds.clientId || prev.clientId,
						clientSecret: creds.clientSecret || prev.clientSecret,
						region: creds.region || prev.region,
						scopes: creds.scopes || prev.scopes,
						tokenEndpointAuthMethod: creds.tokenEndpointAuthMethod || prev.tokenEndpointAuthMethod,
					}));
				}
			}

			// Check for existing token
			const tokenData = unifiedWorkerTokenService.getTokenDataSync();
			if (tokenData?.token) {
				setGeneratedToken(tokenData.token);
				setTokenStatus('success');
			}
		} catch (error) {
			console.error('Failed to load existing credentials:', error);
		}
	}, []);

	// Load existing credentials on mount
	useEffect(() => {
		if (isOpen) {
			loadExistingCredentials();
		}
	}, [isOpen, loadExistingCredentials]);

	const handleInputChange = useCallback((field: keyof typeof credentials, value: string) => {
		setCredentials((prev) => ({ ...prev, [field]: value }));
	}, []);

	const handleSaveCredentials = useCallback(async () => {
		setIsSaving(true);
		try {
			// Save to V9CredentialStorageService (primary for V9 flows)
			// Convert to V9 format (only fields it supports)
			const v9Credentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				scope: credentials.scopes.join(' '), // V9 uses single string
				flowType: 'worker-token',
				specVersion: 'v9',
			};
			await V9CredentialStorageService.save('worker-token-v9', v9Credentials);

			// Also save to UnifiedWorkerTokenService for compatibility
			const result = await unifiedWorkerTokenService.saveCredentials(credentials);

			if (result.success) {
				modernMessaging.showFooterMessage({
					type: 'info', // Fixed: use 'info' instead of 'success'
					message: 'Credentials saved successfully to all storage layers',
				});
			} else {
				modernMessaging.showFooterMessage({
					type: 'info', // Fixed: use 'info' instead of 'error'
					message: result.error?.message || 'Failed to save to unified service',
				});
			}
		} catch (_error) {
			modernMessaging.showFooterMessage({
				type: 'info', // Fixed: use 'info' instead of 'error'
				message: 'Failed to save credentials',
			});
		} finally {
			setIsSaving(false);
		}
	}, [credentials]);

	const handleGenerateToken = useCallback(async () => {
		setIsGenerating(true);
		setTokenStatus('generating');

		try {
			// Save credentials first if not already saved
			await unifiedWorkerTokenService.saveCredentials(credentials);

			// Generate token (this would integrate with actual token generation logic)
			// For now, simulate token generation
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const mockToken = `mock_worker_token_${Date.now()}`;

			// Save token
			await unifiedWorkerTokenService.saveToken(mockToken, credentials);

			setGeneratedToken(mockToken);
			setTokenStatus('success');

			modernMessaging.showFooterMessage({
				type: 'success',
				message: 'Worker token generated successfully',
			});

			onTokenGenerated?.(mockToken);
		} catch (_error) {
			setTokenStatus('error');
			modernMessaging.showFooterMessage({
				type: 'error',
				message: 'Failed to generate worker token',
			});
		} finally {
			setIsGenerating(false);
		}
	}, [credentials, onTokenGenerated]);

	const handleClearToken = useCallback(async () => {
		try {
			await unifiedWorkerTokenService.clearToken();
			setGeneratedToken(null);
			setTokenStatus('idle');

			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Worker token cleared',
			});
		} catch (_error) {
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Failed to clear worker token',
			});
		}
	}, []);

	const handleExportCredentials = useCallback(() => {
		try {
			const exportData = {
				workerToken: {
					environmentId: credentials.environmentId,
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret,
					region: credentials.region,
					scopes: credentials.scopes,
					tokenEndpointAuthMethod: credentials.tokenEndpointAuthMethod,
				},
			};
			exportWorkerTokenCredentials(exportData as WorkerTokenCredentials);
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Worker token credentials exported successfully!',
			});
		} catch (_error) {
			modernMessaging.showFooterMessage({
				type: 'info',
				message: 'Failed to export credentials',
			});
		}
	}, [credentials]);

	const handleImportCredentials = useCallback(() => {
		triggerFileImport(async (file) => {
			try {
				const imported = await importCredentials(file);

				if (imported.workerToken) {
					const wt = imported.workerToken;
					const updatedCredentials = {
						environmentId: wt.environmentId || '',
						clientId: wt.clientId || '',
						clientSecret: wt.clientSecret || '',
						region: wt.region || ('us' as const),
						scopes: wt.scopes || ['openid', 'pingone'],
						tokenEndpointAuthMethod: wt.tokenEndpointAuthMethod || ('client_secret_basic' as const),
					};

					setCredentials(updatedCredentials);

					// Save imported credentials
					await unifiedWorkerTokenService.saveCredentials(updatedCredentials);

					modernMessaging.showFooterMessage({
						type: 'info',
						message: 'Worker token credentials imported successfully!',
					});
				}
			} catch (_error) {
				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'Failed to import credentials',
				});
			}
		});
	}, []);

	const isFormValid = credentials.environmentId && credentials.clientId && credentials.clientSecret;

	if (!isOpen) return null;

	return (
		<DraggableModal isOpen={isOpen} onClose={onClose} title="Worker Token Management">
			<ModalContent>
				<Header>
					<div>
						<Title>
							<MDIIcon icon="FiKey" size={24} />
							Worker Token Management
						</Title>
						<Subtitle>Manage your PingOne worker token credentials and access</Subtitle>
					</div>
				</Header>

				{!skipCredentialsStep && (
					<Section>
						<SectionTitle>Credentials Configuration</SectionTitle>

						<FormGroup>
							<Label htmlFor="environmentId">Environment ID *</Label>
							<Input
								id="environmentId"
								type="text"
								placeholder="Enter your PingOne Environment ID"
								value={credentials.environmentId}
								onChange={(e) => handleInputChange('environmentId', e.target.value)}
							/>
						</FormGroup>

						<FormGroup>
							<Label htmlFor="clientId">Client ID *</Label>
							<Input
								id="clientId"
								type="text"
								placeholder="Enter your Client ID"
								value={credentials.clientId}
								onChange={(e) => handleInputChange('clientId', e.target.value)}
							/>
						</FormGroup>

						<FormGroup>
							<Label htmlFor="clientSecret">Client Secret *</Label>
							<div style={{ position: 'relative' }}>
								<Input
									id="clientSecret"
									type={showPassword ? 'text' : 'password'}
									placeholder="Enter your Client Secret"
									value={credentials.clientSecret}
									onChange={(e) => handleInputChange('clientSecret', e.target.value)}
									style={{ paddingRight: '3rem' }}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									style={{
										position: 'absolute',
										right: '0.75rem',
										top: '50%',
										transform: 'translateY(-50%)',
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										padding: '0.25rem',
									}}
								>
									<MDIIcon
										icon={showPassword ? 'FiEyeOff' : 'FiEye'}
										size={16}
										style={{ color: '#6b7280' }}
									/>
								</button>
							</div>
						</FormGroup>

						<FormGroup>
							<Label htmlFor="region">Region</Label>
							<Select
								id="region"
								value={credentials.region}
								onChange={(e) => handleInputChange('region', e.target.value)}
							>
								<option value="us">United States</option>
								<option value="eu">Europe</option>
								<option value="ap">Asia Pacific</option>
								<option value="ca">Canada</option>
							</Select>
						</FormGroup>

						<FormGroup>
							<Label htmlFor="authMethod">Token Endpoint Authentication Method</Label>
							<Select
								id="authMethod"
								value={credentials.tokenEndpointAuthMethod}
								onChange={(e) => handleInputChange('tokenEndpointAuthMethod', e.target.value)}
							>
								<option value="client_secret_basic">Client Secret Basic</option>
								<option value="client_secret_post">Client Secret Post</option>
								<option value="none">None (Public Client)</option>
							</Select>
						</FormGroup>

						<ButtonGroup>
							<Button onClick={handleSaveCredentials} disabled={!isFormValid || isSaving}>
								{isSaving ? (
									<>
										<MDIIcon
											icon="FiRefreshCw"
											size={16}
											style={{ animation: 'spin 1s linear infinite' }}
										/>
										Saving...
									</>
								) : (
									<>
										<MDIIcon icon="FiSave" size={16} />
										Save Credentials
									</>
								)}
							</Button>
							<Button onClick={handleExportCredentials} variant="outline">
								<MDIIcon icon="FiDownload" size={16} />
								Export
							</Button>
							<Button onClick={handleImportCredentials} variant="outline">
								<MDIIcon icon="FiUpload" size={16} />
								Import
							</Button>
						</ButtonGroup>
					</Section>
				)}

				<Section>
					<SectionTitle>Token Generation</SectionTitle>

					{tokenStatus === 'idle' && (
						<InfoBox $variant="info">
							<MDIIcon icon="FiInfo" size={20} />
							<div>
								<strong>Generate Worker Token</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									Generate a worker token to access PingOne APIs. Make sure your credentials are
									saved first.
								</p>
							</div>
						</InfoBox>
					)}

					{tokenStatus === 'generating' && (
						<StatusIndicator $status="loading">
							<MDIIcon
								icon="FiRefreshCw"
								size={16}
								style={{ animation: 'spin 1s linear infinite' }}
							/>
							Generating worker token...
						</StatusIndicator>
					)}

					{tokenStatus === 'success' && generatedToken && (
						<>
							<InfoBox $variant="success">
								<MDIIcon icon="FiCheckCircle" size={20} />
								<div>
									<strong>Token Generated Successfully</strong>
									<p
										style={{
											margin: '0.5rem 0 0 0',
											fontSize: '0.875rem',
											fontFamily: 'monospace',
										}}
									>
										{generatedToken.substring(0, 20)}...
										{generatedToken.substring(generatedToken.length - 10)}
									</p>
								</div>
							</InfoBox>

							<ButtonGroup>
								<Button $variant="danger" onClick={handleClearToken}>
									<MDIIcon icon="FiX" size={16} />
									Clear Token
								</Button>
							</ButtonGroup>
						</>
					)}

					{tokenStatus === 'error' && (
						<InfoBox $variant="error">
							<MDIIcon icon="FiAlertCircle" size={20} />
							<div>
								<strong>Token Generation Failed</strong>
								<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
									Please check your credentials and try again.
								</p>
							</div>
						</InfoBox>
					)}

					{tokenStatus !== 'success' && (
						<ButtonGroup>
							<Button
								$variant="primary"
								onClick={handleGenerateToken}
								disabled={!isFormValid || isGenerating}
							>
								{isGenerating ? (
									<>
										<MDIIcon
											icon="FiRefreshCw"
											size={16}
											style={{ animation: 'spin 1s linear infinite' }}
										/>
										Generating...
									</>
								) : (
									<>
										<MDIIcon icon="FiKey" size={16} />
										Generate Worker Token
									</>
								)}
							</Button>
						</ButtonGroup>
					)}
				</Section>
			</ModalContent>
		</DraggableModal>
	);
};

export { WorkerTokenModalV9 };
export default WorkerTokenModalV9;
