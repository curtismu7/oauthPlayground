/**
 * @file ApiKeyConfiguration.tsx
 * @module components
 * @description API key configuration component for secure storage management
 * @version 1.0.0
 * @since 2026-03-11
 */

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useApiKeyManager } from '../hooks/useApiKeyManager';
import { type BackupStatus } from '../services/apiKeyBackupService';
import { type ApiKeyConfig, type ApiKeyInfo, apiKeyService } from '../services/apiKeyService';
import { V9_COLORS } from '../services/v9/V9ColorStandards';
import { logger } from '../utils/logger';

const Container = styled.div`
	background: ${V9_COLORS.BG.WHITE};
	border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	border-radius: 12px;
	padding: 24px;
	margin-bottom: 24px;
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
`;

const Title = styled.h3`
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	font-size: 18px;
	font-weight: 600;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const Description = styled.p`
	color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
	font-size: 14px;
	line-height: 1.5;
	margin: 0 0 20px 0;
`;

const ApiKeyList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

const BackupSection = styled.div`
	margin-top: 24px;
	padding-top: 20px;
	border-top: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
`;

const BackupHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 16px;
`;

const BackupTitle = styled.h4`
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	font-size: 16px;
	font-weight: 600;
	margin: 0;
`;

const BackupStatusStyled = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 16px;
`;

const BackupItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px 12px;
	background: ${V9_COLORS.BG.GRAY_LIGHT};
	border-radius: 6px;
	font-size: 13px;
`;

const ServiceName = styled.span`
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	font-weight: 500;
`;

const StatusIndicators = styled.div`
	display: flex;
	gap: 8px;
`;

const StatusIndicator = styled.span<{ $hasBackup: boolean }>`
	padding: 2px 6px;
	border-radius: 4px;
	font-size: 11px;
	font-weight: 500;
	background: ${(props) => (props.$hasBackup ? V9_COLORS.BG.SUCCESS : V9_COLORS.BG.ERROR)};
	color: ${(props) => (props.$hasBackup ? V9_COLORS.PRIMARY.GREEN_DARK : V9_COLORS.PRIMARY.RED_DARK)};
`;

const BackupActions = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
`;

const ApiKeyItem = styled.div`
	background: ${V9_COLORS.BG.GRAY_LIGHT};
	border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	border-radius: 8px;
	padding: 16px;
`;

const ApiKeyHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 12px;
`;

const ApiKeyInfoStyled = styled.div`
	flex: 1;
`;

const ApiKeyName = styled.h4`
	color: ${V9_COLORS.TEXT.GRAY_DARK};
	font-size: 16px;
	font-weight: 600;
	margin: 0 0 4px 0;
`;

const ApiKeyDescription = styled.p`
	color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
	font-size: 13px;
	line-height: 1.4;
	margin: 0;
`;

const ApiKeyStatus = styled.div<{ $hasKey: boolean }>`
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 4px 12px;
	border-radius: 20px;
	font-size: 12px;
	font-weight: 600;
	background: ${(props) => (props.$hasKey ? V9_COLORS.BG.SUCCESS : V9_COLORS.BG.WARNING)};
	color: ${(props) => (props.$hasKey ? V9_COLORS.PRIMARY.GREEN : V9_COLORS.PRIMARY.YELLOW)};
`;

const ApiKeyActions = styled.div`
	display: flex;
	gap: 8px;
	margin-top: 12px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	padding: 8px 16px;
	border: 1px solid;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.15s ease-in-out;
	display: inline-flex;
	align-items: center;
	gap: 6px;

	${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
					background: ${V9_COLORS.BUTTON.PRIMARY.background};
					border-color: ${V9_COLORS.BUTTON.PRIMARY.border};
					color: ${V9_COLORS.BUTTON.PRIMARY.color};
					&:hover {
						background: ${V9_COLORS.BUTTON.PRIMARY.backgroundHover};
					}
				`;
			case 'danger':
				return `
					background: ${V9_COLORS.BUTTON.DANGER.background};
					border-color: ${V9_COLORS.BUTTON.DANGER.border};
					color: ${V9_COLORS.BUTTON.DANGER.color};
					&:hover {
						background: ${V9_COLORS.BUTTON.DANGER.backgroundHover};
					}
				`;
			default:
				return `
					background: ${V9_COLORS.BG.WHITE};
					border: 1px solid ${V9_COLORS.PRIMARY.BLUE};
					color: ${V9_COLORS.PRIMARY.BLUE};
					&:hover {
						background: ${V9_COLORS.BG.GRAY_LIGHT};
						border-color: ${V9_COLORS.PRIMARY.BLUE_DARK};
						color: ${V9_COLORS.PRIMARY.BLUE_DARK};
					}
				`;
		}
	}}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const InputGroup = styled.div`
	display: flex;
	gap: 8px;
	margin-top: 12px;
	align-items: center;
`;

const InputWrapper = styled.div`
	position: relative;
	flex: 1;
	display: flex;
	align-items: center;
`;

const EyeButton = styled.button`
	position: absolute;
	right: 8px;
	background: none;
	border: none;
	cursor: pointer;
	padding: 2px 4px;
	color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
	font-size: 16px;
	line-height: 1;
	&:hover {
		color: ${V9_COLORS.TEXT.GRAY_DARK};
	}
`;

const KeyValueRow = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: ${V9_COLORS.TEXT.GRAY_MEDIUM};
	margin-bottom: 8px;
	font-family: monospace;
	word-break: break-all;
`;

const Input = styled.input`
	flex: 1;
	padding: 8px 12px;
	border: 1px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
	border-radius: 6px;
	font-size: 13px;
	outline: none;
	transition: border-color 0.15s ease-in-out;

	&:focus {
		border-color: ${V9_COLORS.PRIMARY.BLUE};
		box-shadow: 0 0 0 2px ${V9_COLORS.PRIMARY.BLUE}20;
	}

	&::placeholder {
		color: ${V9_COLORS.TEXT.GRAY_LIGHT};
	}
`;

const ErrorMessage = styled.div`
	background: ${V9_COLORS.BG.ERROR};
	border: 1px solid ${V9_COLORS.BG.ERROR_BORDER};
	color: ${V9_COLORS.PRIMARY.RED};
	padding: 12px;
	border-radius: 6px;
	font-size: 13px;
	margin-top: 12px;
`;

const SuccessMessage = styled.div`
	background: ${V9_COLORS.BG.SUCCESS};
	border: 1px solid ${V9_COLORS.BG.SUCCESS_BORDER};
	color: ${V9_COLORS.PRIMARY.GREEN};
	padding: 12px;
	border-radius: 6px;
	font-size: 13px;
	margin-top: 12px;
`;

interface ApiKeyConfigurationProps {
	className?: string;
}

export const ApiKeyConfiguration: React.FC<ApiKeyConfigurationProps> = ({ className }) => {
	const {
		apiKeys,
		loading,
		error,
		storeApiKey,
		deleteApiKey,
		getAllServiceConfigs,
		validateApiKey,
	} = useApiKeyManager({ autoLoad: true });

	const [editingService, setEditingService] = useState<string | null>(null);
	const [apiKeyInput, setApiKeyInput] = useState('');
	const [showInputKey, setShowInputKey] = useState(false);
	const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
	const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
	const [backupStatus, setBackupStatus] = useState<BackupStatus[]>([]);
	const [loadingBackup, setLoadingBackup] = useState(false);

	const loadBackupStatus = useCallback(async () => {
		try {
			setLoadingBackup(true);

			// First, migrate any existing API keys to ensure they have isActive set correctly
			await apiKeyService.migrateExistingApiKeys();

			// Then load the backup status
			const status = await apiKeyService.getBackupStatus();
			setBackupStatus(status);
		} catch (error) {
			logger.error(
				'ApiKeyConfiguration',
				'Failed to load backup status',
				undefined,
				error instanceof Error ? error : undefined
			);
		} finally {
			setLoadingBackup(false);
		}
	}, []);

	// Load backup status on mount and when API keys change
	useEffect(() => {
		loadBackupStatus();
	}, [loadBackupStatus]);

	const handleCreateBackup = async () => {
		try {
			setLoadingBackup(true);
			await apiKeyService.syncBackups();
			setMessage({ type: 'success', text: 'Backup created successfully' });
			await loadBackupStatus(); // Refresh status
		} catch (_error) {
			setMessage({ type: 'error', text: 'Failed to create backup' });
		} finally {
			setLoadingBackup(false);
			setTimeout(clearMessage, 3000);
		}
	};

	const handleRestoreBackup = async () => {
		try {
			setLoadingBackup(true);
			await apiKeyService.restoreFromBackup();
			setMessage({ type: 'success', text: 'Backup restored successfully' });
			await loadBackupStatus(); // Refresh status
		} catch (_error) {
			setMessage({ type: 'error', text: 'Failed to restore backup' });
		} finally {
			setLoadingBackup(false);
			setTimeout(clearMessage, 3000);
		}
	};

	const toggleShowKey = (service: string) =>
		setShowKeys((prev) => ({ ...prev, [service]: !prev[service] }));

	const serviceConfigs = getAllServiceConfigs();
	const clearMessage = () => setMessage(null);

	const handleStoreApiKey = async (service: string) => {
		if (!apiKeyInput.trim()) {
			setMessage({ type: 'error', text: 'Please enter an API key' });
			return;
		}

		if (!validateApiKey(service, apiKeyInput)) {
			const config = apiKeyService.getServiceConfig(service);
			setMessage({
				type: 'error',
				text: `Invalid API key format${config ? ` for ${config.name}` : ''}`,
			});
			return;
		}

		const success = await storeApiKey(service, apiKeyInput.trim());

		if (success) {
			setMessage({ type: 'success', text: 'API key stored successfully' });
			setApiKeyInput('');
			setEditingService(null);
		} else {
			setMessage({ type: 'error', text: 'Failed to store API key' });
		}

		// Clear message after 3 seconds
		setTimeout(clearMessage, 3000);
	};

	const handleDeleteApiKey = async (service: string) => {
		const success = await deleteApiKey(service);

		if (success) {
			setMessage({ type: 'success', text: 'API key deleted successfully' });
		} else {
			setMessage({ type: 'error', text: 'Failed to delete API key' });
		}

		// Clear message after 3 seconds
		setTimeout(clearMessage, 3000);
	};

	const getApiKeyInfo = (service: string): ApiKeyInfo | undefined => {
		return apiKeys.find((key: ApiKeyInfo) => key.service === service);
	};

	return (
		<Container className={className}>
			<Header>
				<Title>🔑 API Keys Configuration</Title>
			</Header>

			<Description>
				Manage API keys for external services. Keys are stored securely and used by MCP servers and
				application features.
			</Description>

			{message &&
				(message.type === 'error' ? (
					<ErrorMessage>{message.text}</ErrorMessage>
				) : (
					<SuccessMessage>{message.text}</SuccessMessage>
				))}

			{error && <ErrorMessage>Error loading API keys: {error}</ErrorMessage>}

			<ApiKeyList>
				{serviceConfigs.map((config: ApiKeyConfig) => {
					const apiKeyInfo = getApiKeyInfo(config.service);
					const isEditing = editingService === config.service;
					const hasKey = !!apiKeyInfo?.isActive;

					return (
						<ApiKeyItem key={config.service}>
							<ApiKeyHeader>
								<ApiKeyInfoStyled>
									<ApiKeyName>{config.name}</ApiKeyName>
									<ApiKeyDescription>{config.description}</ApiKeyDescription>
								</ApiKeyInfoStyled>
								<ApiKeyStatus $hasKey={hasKey}>{hasKey ? '✓ Configured' : 'Not Set'}</ApiKeyStatus>
							</ApiKeyHeader>

							{apiKeyInfo && (
								<KeyValueRow>
									<span>Key:</span>
									<span>
										{showKeys[config.service]
											? apiKeyInfo.value
											: `${apiKeyInfo.value?.slice(0, 6) ?? ''}${'•'.repeat(Math.max(0, (apiKeyInfo.value?.length ?? 0) - 6))}`}
									</span>
									<button
										type="button"
										onClick={() => toggleShowKey(config.service)}
										style={{
											background: 'none',
											border: 'none',
											cursor: 'pointer',
											padding: '0 2px',
											fontSize: '14px',
										}}
										title={showKeys[config.service] ? 'Hide key' : 'Show key'}
										aria-label={showKeys[config.service] ? 'Hide key' : 'Show key'}
									>
										{showKeys[config.service] ? '🙈' : '👁️'}
									</button>
									{apiKeyInfo.lastUsedAt && (
										<span style={{ marginLeft: '8px', fontFamily: 'sans-serif' }}>
											Last used: {new Date(apiKeyInfo.lastUsedAt).toLocaleDateString()}
										</span>
									)}
								</KeyValueRow>
							)}

							{isEditing ? (
								<InputGroup>
									<InputWrapper>
										<Input
											type={showInputKey ? 'text' : 'password'}
											placeholder={`Enter ${config.name}...`}
											value={apiKeyInput}
											style={{ paddingRight: '36px', width: '100%' }}
											onChange={(e) => setApiKeyInput(e.target.value)}
											onKeyPress={(e) => {
												if (e.key === 'Enter') {
													handleStoreApiKey(config.service);
												}
											}}
										/>
										<EyeButton
											type="button"
											onClick={() => setShowInputKey((v) => !v)}
											title={showInputKey ? 'Hide' : 'Show'}
											aria-label={showInputKey ? 'Hide key' : 'Show key'}
										>
											{showInputKey ? '🙈' : '👁️'}
										</EyeButton>
									</InputWrapper>
									<Button
										$variant="primary"
										onClick={() => handleStoreApiKey(config.service)}
										disabled={loading}
									>
										Save
									</Button>
									<Button
										onClick={() => {
											setEditingService(null);
											setApiKeyInput('');
											setShowInputKey(false);
										}}
									>
										Cancel
									</Button>
								</InputGroup>
							) : (
								<ApiKeyActions>
									{hasKey ? (
										<>
											<Button onClick={() => setEditingService(config.service)} disabled={loading}>
												🔄 Update
											</Button>
											<Button
												$variant="danger"
												onClick={() => handleDeleteApiKey(config.service)}
												disabled={loading}
											>
												🗑️ Delete
											</Button>
										</>
									) : (
										<Button
											$variant="primary"
											onClick={() => setEditingService(config.service)}
											disabled={loading}
										>
											➕ Add Key
										</Button>
									)}
								</ApiKeyActions>
							)}
						</ApiKeyItem>
					);
				})}
			</ApiKeyList>

			{/* Backup Section */}
			<BackupSection>
				<BackupHeader>
					<BackupTitle>🔄 API Key Backup</BackupTitle>
				</BackupHeader>

				<BackupStatusStyled>
					{backupStatus.map((status) => (
						<BackupItem key={status.service}>
							<ServiceName>{status.service}</ServiceName>
							<StatusIndicators>
								<StatusIndicator $hasBackup={status.hasPrimary}>
									Primary: {status.hasPrimary ? '✅' : '❌'}
								</StatusIndicator>
								<StatusIndicator $hasBackup={status.hasLocalStorage}>
									Local: {status.hasLocalStorage ? '✅' : '❌'}
								</StatusIndicator>
								<StatusIndicator $hasBackup={status.hasFilesystem}>
									File: {status.hasFilesystem ? '✅' : '❌'}
								</StatusIndicator>
							</StatusIndicators>
						</BackupItem>
					))}
				</BackupStatusStyled>

				<BackupActions>
					<Button onClick={handleCreateBackup} disabled={loadingBackup} $variant="primary">
						💾 Create Backup
					</Button>
					<Button onClick={handleRestoreBackup} disabled={loadingBackup}>
						🔄 Restore from Backup
					</Button>
				</BackupActions>
			</BackupSection>
		</Container>
	);
};
