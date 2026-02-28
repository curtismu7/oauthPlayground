// src/components/AuthorizationCodeConfigModal.tsx
// Simple modal for configuring Authorization Code flow credentials

import React, { useEffect, useState } from 'react';
import { FiInfo, FiSave } from '@icons';
import styled from 'styled-components';
import { comprehensiveFlowDataService } from '../services/comprehensiveFlowDataService';
import { v4ToastManager } from '../utils/v4ToastMessages';
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
	color: #374151;
	font-size: 0.875rem;
`;

const FormInput = styled.input`
	padding: 0.75rem;
	border: 2px solid #e5e7eb;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: border-color 0.2s;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	&:disabled {
		background-color: #f3f4f6;
		color: #6b7280;
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
	color: #1e40af;
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
	background: ${({ $variant }) => ($variant === 'secondary' ? '#e5e7eb' : '#3b82f6')};
	color: ${({ $variant }) => ($variant === 'secondary' ? '#374151' : '#ffffff')};
	font-weight: 600;
	cursor: pointer;
	transition: background 0.2s;
	font-size: 0.875rem;
	
	&:hover {
		background: ${({ $variant }) => ($variant === 'secondary' ? '#d1d5db' : '#2563eb')};
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
			v4ToastManager.showError(
				'Please fill in all required fields (Environment ID, Client ID, and Client Secret)'
			);
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
				v4ToastManager.showSuccess('Authorization Code credentials saved successfully');
				onCredentialsSaved?.(credentials);
				onClose();
			} else {
				v4ToastManager.showError('Failed to save credentials');
			}
		} catch (error) {
			console.error('[AuthorizationCodeConfigModal] Error saving credentials:', error);
			v4ToastManager.showError('Error saving credentials');
		} finally {
			setIsSaving(false);
		}
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
				<FiInfo size={16} style={{ flexShrink: 0, color: '#3b82f6', marginTop: '0.125rem' }} />
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

			<ButtonGroup>
				<ActionButton $variant="secondary" onClick={onClose} disabled={isSaving}>
					Cancel
				</ActionButton>
				<ActionButton onClick={handleSave} disabled={isSaving}>
					<FiSave />
					{isSaving ? 'Saving...' : 'Save Credentials'}
				</ActionButton>
			</ButtonGroup>
		</DraggableModal>
	);
};
