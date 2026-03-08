// src/components/AuthorizationCodeConfigModal.tsx
// Simple modal for configuring Authorization Code flow credentials


import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { comprehensiveFlowDataService } from '../services/comprehensiveFlowDataService';
import {
	type AuthzCredentials,
	exportAuthzCredentials,
	importCredentials,
	triggerFileImport,
} from '../services/credentialExportImportService';
import { createModuleLogger } from '../utils/consoleMigrationHelper';
import { DraggableModal } from './DraggableModal';
import type { StepCredentials } from './steps/CommonSteps';

const FormSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin: 1rem 0;
`;

const FormField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const FormLabel = styled.label`
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	font-size: 0.875rem;
`;

const FormInput = styled.input`
	padding: 0.75rem;
	border: 2px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: border-color 0.2s;
	
	&:focus {
		outline: none;
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	&:disabled {
		background-color: #f3f4f6;
		color: V9_COLORS.TEXT.GRAY_MEDIUM;
		cursor: not-allowed;
	}
`;

const InfoBox = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	padding: 0.75rem;
	border-radius: 0.375rem;
	background: rgba(59, 130, 246, 0.1);
	border: 1px solid rgba(59, 130, 246, 0.3);
	margin-bottom: 1rem;
`;

const InfoText = styled.div`
	font-size: 0.8125rem;
	color: V9_COLORS.PRIMARY.BLUE_DARK;
	line-height: 1.5;
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	margin-top: 1.5rem;
	justify-content: flex-end;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.375rem;
	border: none;
	background: ${({ $variant }) => ($variant === 'secondary' ? 'V9_COLORS.TEXT.GRAY_LIGHTER' : 'V9_COLORS.PRIMARY.BLUE')};
	color: ${({ $variant }) => ($variant === 'secondary' ? 'V9_COLORS.TEXT.GRAY_DARK' : 'V9_COLORS.TEXT.WHITE')};
	font-weight: 600;
	cursor: pointer;
	transition: background 0.2s;
	font-size: 0.875rem;
	
	&:hover {
		background: ${({ $variant }) => ($variant === 'secondary' ? 'V9_COLORS.TEXT.GRAY_LIGHTER' : 'V9_COLORS.PRIMARY.BLUE_DARK')};
	}
	
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

interface AuthorizationCodeConfigModalProps {
	isOpen: boolean;
	onClose: () => void;
	flowType: string;
	initialCredentials?: StepCredentials;
	onCredentialsSaved?: (credentials: StepCredentials) => void;
}

export const AuthorizationCodeConfigModal: React.FC<AuthorizationCodeConfigModalProps> = ({
	isOpen,
	onClose,
	flowType,
	initialCredentials,
	onCredentialsSaved,
}) => {
	const [credentials, setCredentials] = useState<StepCredentials>({
		environmentId: initialCredentials?.environmentId || '',
		clientId: initialCredentials?.clientId || '',
		clientSecret: initialCredentials?.clientSecret || '',
		redirectUri: initialCredentials?.redirectUri || 'https://localhost:3000/callback',
		scopes: initialCredentials?.scopes || 'openid profile email',
	});
	const [isSaving, setIsSaving] = useState(false);

	// Load saved Authorization Code credentials when modal opens (prioritize saved over initialCredentials)
	useEffect(() => {
		if (isOpen) {
			console.log(
				`[AuthorizationCodeConfigModal] 🔄 Modal opened - loading saved credentials for flowType: ${flowType}`
			);

			// Load from flow-specific storage (Authorization Code credentials only)
			// Storage key: pingone_flow_data:{flowType} (e.g., pingone_flow_data:kroger-grocery-store-mfa)
			// This is separate from worker token credentials which use: pingone_worker_token_credentials_{flowType}
			const saved = comprehensiveFlowDataService.loadFlowCredentialsIsolated(flowType);

			if (saved?.environmentId && saved.clientId && saved.clientSecret) {
				console.log(
					`[AuthorizationCodeConfigModal] ✅ Found saved credentials for ${flowType}, using them`
				);
				// Prioritize saved credentials - only use initialCredentials as fallback for missing fields
				setCredentials({
					environmentId: saved.environmentId || initialCredentials?.environmentId || '',
					clientId: saved.clientId || initialCredentials?.clientId || '',
					clientSecret: saved.clientSecret || initialCredentials?.clientSecret || '',
					redirectUri:
						saved.redirectUri ||
						initialCredentials?.redirectUri ||
						'https://localhost:3000/callback',
					scopes: Array.isArray(saved.scopes)
						? saved.scopes.join(' ')
						: saved.scopes || initialCredentials?.scopes || 'openid profile email',
				});
			} else if (initialCredentials) {
				console.log(
					`[AuthorizationCodeConfigModal] ⚠️ No saved credentials found for ${flowType}, using initialCredentials`
				);
				setCredentials(initialCredentials);
			} else {
				console.log(
					`[AuthorizationCodeConfigModal] ⚠️ No saved credentials or initialCredentials for ${flowType}`
				);
			}
		}
	}, [isOpen, flowType, initialCredentials]);

	const handleSave = async () => {
		if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message:
					'Please fill in all required fields (Environment ID, Client ID, and Client Secret)',
				dismissible: true,
			});
			return;
		}

		setIsSaving(true);
		try {
			const credentialsToSave = {
				...credentials,
				scopes:
					typeof credentials.scopes === 'string'
						? credentials.scopes.split(/\s+/).filter(Boolean)
						: credentials.scopes || ['openid', 'profile', 'email'],
				lastUpdated: Date.now(),
			};

			// Save to flow-specific storage with unique key: pingone_flow_data:{flowType}
			// This ensures Authorization Code credentials are isolated per flow and separate from worker token credentials
			const success = comprehensiveFlowDataService.saveFlowCredentialsIsolated(
				flowType,
				credentialsToSave
			);

			if (success) {
				modernMessaging.showFooterMessage({
					type: 'status',
					message: 'Authorization Code credentials saved successfully',
					duration: 4000,
				});
				onCredentialsSaved?.(credentials);
				onClose();
			} else {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'Failed to save credentials',
					dismissible: true,
				});
			}
		} catch (error) {
			log.error(
				'AuthorizationCodeConfigModal',
				'[AuthorizationCodeConfigModal] Error saving credentials:',
				undefined,
				error as Error
			);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Error saving credentials',
				dismissible: true,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleExport = () => {
		try {
			if (!credentials.environmentId || !credentials.clientId || !credentials.clientSecret) {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'Please fill in all required fields before exporting',
					dismissible: true,
				});
				return;
			}

			const authzCredentials: AuthzCredentials = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: credentials.redirectUri || 'https://localhost:3000/callback',
				scopes:
					typeof credentials.scopes === 'string'
						? credentials.scopes.split(/\s+/).filter(Boolean)
						: credentials.scopes || ['openid', 'profile', 'email'],
			};

			exportAuthzCredentials(authzCredentials);
			modernMessaging.showFooterMessage({
				type: 'status',
				message: 'Authorization Code credentials exported successfully!',
				duration: 4000,
			});
		} catch (error) {
			log.error(
				'AuthorizationCodeConfigModal',
				'[AuthorizationCodeConfigModal] Export error:',
				undefined,
				error as Error
			);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: error instanceof Error ? error.message : 'Failed to export credentials',
				dismissible: true,
			});
		}
	};

	const handleImport = () => {
		triggerFileImport(async (file) => {
			try {
				const imported = await importCredentials(file);

				if (imported.authz) {
					const authz = imported.authz;
					const updatedCredentials = {
						environmentId: authz.environmentId || credentials.environmentId || '',
						clientId: authz.clientId || credentials.clientId,
						clientSecret: authz.clientSecret || credentials.clientSecret,
						redirectUri: authz.redirectUri || credentials.redirectUri,
						scopes: authz.scopes ? authz.scopes.join(' ') : credentials.scopes || '',
					};

					setCredentials(updatedCredentials);

					// Also save to flow-specific storage
					const credentialsToSave = {
						...updatedCredentials,
						scopes: authz.scopes || ['openid', 'profile', 'email'],
						lastUpdated: Date.now(),
					};

					comprehensiveFlowDataService.saveFlowCredentialsIsolated(flowType, credentialsToSave);

					modernMessaging.showFooterMessage({
						type: 'status',
						message: 'Authorization Code credentials imported successfully!',
						duration: 4000,
					});
				} else {
					modernMessaging.showBanner({
						type: 'error',
						title: 'Error',
						message: 'The selected file does not contain Authorization Code credentials',
						dismissible: true,
					});
				}
			} catch (error) {
				log.error(
					'AuthorizationCodeConfigModal',
					'[AuthorizationCodeConfigModal] Import error:',
					undefined,
					error as Error
				);
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: error instanceof Error ? error.message : 'Failed to import credentials',
					dismissible: true,
				});
			}
		});
	};

	return (
		<DraggableModal
			isOpen={isOpen}
			onClose={onClose}
			title="Configure Authorization Code Flow"
			width="min(600px, calc(100vw - 2rem))"
			maxHeight="calc(100vh - 4rem)"
		>
			<InfoBox>
				<FiInfo
					size={16}
					style={{ flexShrink: 0, color: 'V9_COLORS.PRIMARY.BLUE', marginTop: '0.125rem' }}
				/>
				<InfoText>
					<strong>Authorization Code Flow Configuration</strong>
					<br />
					Enter your PingOne application credentials for the Authorization Code flow. These
					credentials are used for user authentication (login).
				</InfoText>
			</InfoBox>

			<FormSection>
				<FormField>
					<FormLabel>Environment ID *</FormLabel>
					<FormInput
						type="text"
						placeholder="e.g., b9817c16-9910-4415-b67e-4ac687da74d9"
						value={credentials.environmentId}
						onChange={(e) => setCredentials((prev) => ({ ...prev, environmentId: e.target.value }))}
					/>
				</FormField>

				<FormField>
					<FormLabel>Client ID *</FormLabel>
					<FormInput
						type="text"
						placeholder="e.g., 5ac8ccd7-7ebc-4684-b0d9-233705e87a7c"
						value={credentials.clientId}
						onChange={(e) => setCredentials((prev) => ({ ...prev, clientId: e.target.value }))}
					/>
				</FormField>

				<FormField>
					<FormLabel>Client Secret *</FormLabel>
					<FormInput
						type="password"
						placeholder="Enter your client secret"
						value={credentials.clientSecret}
						onChange={(e) => setCredentials((prev) => ({ ...prev, clientSecret: e.target.value }))}
					/>
				</FormField>

				<FormField>
					<FormLabel>Redirect URI</FormLabel>
					<FormInput
						type="text"
						placeholder="https://localhost:3000/callback"
						value={credentials.redirectUri}
						onChange={(e) => setCredentials((prev) => ({ ...prev, redirectUri: e.target.value }))}
					/>
				</FormField>

				<FormField>
					<FormLabel>Scopes</FormLabel>
					<FormInput
						type="text"
						placeholder="openid profile email"
						value={
							typeof credentials.scopes === 'string'
								? credentials.scopes
								: credentials.scopes?.join(' ') || ''
						}
						onChange={(e) => setCredentials((prev) => ({ ...prev, scopes: e.target.value }))}
					/>
				</FormField>
			</FormSection>

			{/* Import/Export buttons */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					gap: '8px',
					marginTop: '1rem',
					marginBottom: '1rem',
				}}
			>
				<button
					type="button"
					onClick={handleExport}
					onFocus={(e) => {
						e.currentTarget.style.background = '#f3f4f6';
						e.currentTarget.style.borderColor = 'V9_COLORS.TEXT.GRAY_LIGHT';
					}}
					onBlur={(e) => {
						e.currentTarget.style.background = '#f9fafb';
						e.currentTarget.style.borderColor = 'V9_COLORS.TEXT.GRAY_LIGHTER';
					}}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '6px',
						padding: '8px 16px',
						border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
						borderRadius: '6px',
						background: '#f9fafb',
						color: 'V9_COLORS.TEXT.GRAY_DARK',
						fontSize: '0.875rem',
						cursor: 'pointer',
						transition: 'all 0.2s',
					}}
					onMouseOver={(e) => {
						e.currentTarget.style.background = '#f3f4f6';
						e.currentTarget.style.borderColor = 'V9_COLORS.TEXT.GRAY_LIGHT';
					}}
					onMouseOut={(e) => {
						e.currentTarget.style.background = '#f9fafb';
						e.currentTarget.style.borderColor = 'V9_COLORS.TEXT.GRAY_LIGHTER';
					}}
					title="Export credentials to JSON file"
				>
					<span style={{ fontSize: '14px' }}>📥</span>
					Export
				</button>
				<button
					type="button"
					onClick={handleImport}
					onFocus={(e) => {
						e.currentTarget.style.background = '#f3f4f6';
						e.currentTarget.style.borderColor = 'V9_COLORS.TEXT.GRAY_LIGHT';
					}}
					onBlur={(e) => {
						e.currentTarget.style.background = '#f9fafb';
						e.currentTarget.style.borderColor = 'V9_COLORS.TEXT.GRAY_LIGHTER';
					}}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '6px',
						padding: '8px 16px',
						border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
						borderRadius: '6px',
						background: '#f9fafb',
						color: 'V9_COLORS.TEXT.GRAY_DARK',
						fontSize: '0.875rem',
						cursor: 'pointer',
						transition: 'all 0.2s',
					}}
					onMouseOver={(e) => {
						e.currentTarget.style.background = '#f3f4f6';
						e.currentTarget.style.borderColor = 'V9_COLORS.TEXT.GRAY_LIGHT';
					}}
					onMouseOut={(e) => {
						e.currentTarget.style.background = '#f9fafb';
						e.currentTarget.style.borderColor = 'V9_COLORS.TEXT.GRAY_LIGHTER';
					}}
					title="Import credentials from JSON file"
				>
					<span style={{ fontSize: '14px' }}>📤</span>
					Import
				</button>
			</div>

			<ButtonGroup>
				<ActionButton $variant="secondary" onClick={onClose} disabled={isSaving}>
					Cancel
				</ActionButton>
				<ActionButton onClick={handleSave} disabled={isSaving}>
					<span>💾</span>
					{isSaving ? 'Saving...' : 'Save Credentials'}
				</ActionButton>
			</ButtonGroup>
		</DraggableModal>
	);
};
