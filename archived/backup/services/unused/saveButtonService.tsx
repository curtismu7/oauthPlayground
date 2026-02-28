// src/services/saveButtonService.tsx
// Centralized Save Button Service with Flow-Specific Storage

import React, { useCallback, useState } from 'react';
import { FiCheck, FiSave } from 'react-icons/fi';
import styled from 'styled-components';
import type { StepCredentials } from '../components/steps/CommonSteps';
import { credentialManager } from '../utils/credentialManager';
import { v4ToastManager } from '../utils/v4ToastMessages';

// Styled Save Button Component
const SaveButtonStyled = styled.button<{ $saved?: boolean }>`
	background: ${(props) => (props.$saved ? '#10b981' : '#10b981')};
	color: white;
	border: 1px solid ${(props) => (props.$saved ? '#059669' : '#10b981')};
	border-radius: 0.5rem;
	padding: 0.75rem 1.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s ease;
	min-width: 140px;
	justify-content: center;

	&:hover:not(:disabled) {
		background: ${(props) => (props.$saved ? '#059669' : '#059669')};
		border-color: ${(props) => (props.$saved ? '#047857' : '#059669')};
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	svg {
		transition: transform 0.2s ease;
	}

	${(props) =>
		props.$saved &&
		`
    svg {
      transform: scale(1.2);
    }
  `}
`;

// Storage Service
export class FlowStorageService {
	/**
	 * Get flow-specific storage key
	 */
	static getFlowKey(flowType: string): string {
		return `flow_credentials_${flowType}`;
	}

	/**
	 * Save credentials with flow-specific key
	 */
	static saveCredentials(flowType: string, credentials: StepCredentials): void {
		try {
			// 1. Save to global credentialManager using the generic flow method
			credentialManager.saveFlowCredentials(flowType, {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: credentials.redirectUri,
				scopes: Array.isArray(credentials.scopes)
					? credentials.scopes
					: (credentials.scopes || credentials.scope || '').split(' ').filter(Boolean),
				region: credentials.region,
				responseType: credentials.responseType,
				grantType: credentials.grantType,
				tokenEndpointAuthMethod:
					credentials.tokenEndpointAuthMethod || credentials.clientAuthMethod,
				authorizationEndpoint: credentials.authorizationEndpoint,
				tokenEndpoint: credentials.tokenEndpoint,
				userInfoEndpoint: credentials.userInfoEndpoint,
				issuerUrl: credentials.issuerUrl,
				loginHint: credentials.loginHint,
				postLogoutRedirectUri: credentials.postLogoutRedirectUri,
			});

			// 2. Save to flow-specific storage (isolation) - save ALL fields
			const flowKey = FlowStorageService.getFlowKey(flowType);
			const completeCredentials = {
				...credentials,
				// Ensure all fields are included
				timestamp: Date.now(),
				flowType: flowType,
			};
			localStorage.setItem(flowKey, JSON.stringify(completeCredentials));

			console.log(`[FlowStorageService] Saved credentials for flow: ${flowType}`, {
				flowKey,
				fields: Object.keys(completeCredentials),
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
			});
		} catch (error) {
			console.error(`[FlowStorageService] Failed to save credentials for ${flowType}:`, error);
			throw error;
		}
	}

	/**
	 * Load credentials from flow-specific key
	 */
	static loadCredentials(flowType: string): StepCredentials | null {
		try {
			const flowKey = FlowStorageService.getFlowKey(flowType);
			const stored = localStorage.getItem(flowKey);

			if (stored) {
				const parsed = JSON.parse(stored);
				console.log(`[FlowStorageService] Loaded credentials for flow: ${flowType}`, {
					flowKey,
					fields: Object.keys(parsed),
					environmentId: parsed.environmentId,
					clientId: parsed.clientId,
				});
				return parsed;
			}

			// Fallback to credentialManager flow-specific credentials
			const flowCreds = credentialManager.loadFlowCredentials(flowType);
			if (flowCreds?.environmentId) {
				console.log(
					`[FlowStorageService] Using credentialManager flow credentials for: ${flowType}`
				);
				return flowCreds as StepCredentials;
			}

			// Final fallback to global credentials
			const globalCreds = credentialManager.getAllCredentials();
			if (globalCreds.environmentId) {
				console.log(`[FlowStorageService] Using global credentials for flow: ${flowType}`);
				return globalCreds as StepCredentials;
			}

			return null;
		} catch (error) {
			console.error(`[FlowStorageService] Failed to load credentials for ${flowType}:`, error);
			return null;
		}
	}

	/**
	 * Clear credentials for specific flow
	 */
	static clearCredentials(flowType: string): void {
		try {
			const flowKey = FlowStorageService.getFlowKey(flowType);
			localStorage.removeItem(flowKey);
			console.log(`[FlowStorageService] Cleared credentials for flow: ${flowType}`);
		} catch (error) {
			console.error(`[FlowStorageService] Failed to clear credentials for ${flowType}:`, error);
		}
	}

	/**
	 * Get all flow-specific keys
	 */
	static getAllFlowKeys(): string[] {
		const keys: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith('flow_credentials_')) {
				keys.push(key);
			}
		}
		return keys;
	}
}

// Worker Token Service
export class WorkerTokenService {
	private static readonly STORAGE_KEY = 'worker_token';
	private static readonly ENV_KEY = 'worker_token_env';
	private static readonly EXPIRES_KEY = 'worker_token_expires_at';

	/**
	 * Save worker token
	 */
	static saveToken(token: string, environmentId: string, expiresAt?: number): void {
		try {
			localStorage.setItem(WorkerTokenService.STORAGE_KEY, token);
			localStorage.setItem(WorkerTokenService.ENV_KEY, environmentId);
			if (expiresAt) {
				localStorage.setItem(WorkerTokenService.EXPIRES_KEY, expiresAt.toString());
			}
			console.log(`[WorkerTokenService] Saved worker token for env: ${environmentId}`);
		} catch (error) {
			console.error('[WorkerTokenService] Failed to save token:', error);
			throw error;
		}
	}

	/**
	 * Load worker token
	 */
	static loadToken(environmentId?: string): string | null {
		try {
			const token = localStorage.getItem(WorkerTokenService.STORAGE_KEY);
			const savedEnv = localStorage.getItem(WorkerTokenService.ENV_KEY);
			const expiresAt = localStorage.getItem(WorkerTokenService.EXPIRES_KEY);

			// Check if token is for the correct environment
			if (environmentId && savedEnv !== environmentId) {
				console.log(`[WorkerTokenService] Token env mismatch: ${savedEnv} !== ${environmentId}`);
				return null;
			}

			// Check if token is expired
			if (expiresAt) {
				const expiresAtNum = parseInt(expiresAt, 10);
				if (Date.now() > expiresAtNum) {
					console.log('[WorkerTokenService] Token expired');
					WorkerTokenService.clearToken();
					return null;
				}
			}

			if (token) {
				console.log('[WorkerTokenService] Loaded worker token');
			}

			return token;
		} catch (error) {
			console.error('[WorkerTokenService] Failed to load token:', error);
			return null;
		}
	}

	/**
	 * Clear worker token
	 */
	static clearToken(): void {
		try {
			localStorage.removeItem(WorkerTokenService.STORAGE_KEY);
			localStorage.removeItem(WorkerTokenService.ENV_KEY);
			localStorage.removeItem(WorkerTokenService.EXPIRES_KEY);
			console.log('[WorkerTokenService] Cleared worker token');
		} catch (error) {
			console.error('[WorkerTokenService] Failed to clear token:', error);
		}
	}

	/**
	 * Check if token exists and is valid
	 */
	static hasValidToken(environmentId?: string): boolean {
		const token = WorkerTokenService.loadToken(environmentId);
		return !!token;
	}

	/**
	 * Get token expiration time
	 */
	static getExpiresAt(): number | null {
		try {
			const expiresAt = localStorage.getItem(WorkerTokenService.EXPIRES_KEY);
			return expiresAt ? parseInt(expiresAt, 10) : null;
		} catch (_error) {
			return null;
		}
	}
}

// Save Button Component Props
interface SaveButtonProps {
	flowType: string;
	credentials: StepCredentials;
	additionalData?: Record<string, unknown>;
	onSave?: () => void | Promise<void>;
	disabled?: boolean;
	style?: React.CSSProperties;
	className?: string;
}

/**
 * Reusable Save Button Component
 * - Green styling
 * - Shows "Saved!" for 10 seconds after save
 * - Uses flow-specific storage
 * - Handles errors with toast notifications
 */
export const SaveButton: React.FC<SaveButtonProps> = ({
	flowType,
	credentials,
	additionalData,
	onSave,
	disabled = false,
	style,
	className,
}) => {
	const [isSaving, setIsSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	const handleSave = useCallback(async () => {
		if (isSaving || disabled) return;

		setIsSaving(true);

		try {
			// Save credentials with flow-specific key
			FlowStorageService.saveCredentials(flowType, credentials);

			// Save additional data if provided
			if (additionalData) {
				const additionalKey = `flow_additional_${flowType}`;
				localStorage.setItem(additionalKey, JSON.stringify(additionalData));
			}

			// Call custom save handler if provided
			if (onSave) {
				await onSave();
			}

			// Show success state
			setSaved(true);
			v4ToastManager.showSuccess('Configuration saved successfully!');

			// Reset after 10 seconds
			setTimeout(() => {
				setSaved(false);
			}, 10000);
		} catch (error) {
			console.error('[SaveButton] Save failed:', error);
			v4ToastManager.showError('Failed to save configuration');
		} finally {
			setIsSaving(false);
		}
	}, [flowType, credentials, additionalData, onSave, isSaving, disabled]);

	return (
		<SaveButtonStyled
			onClick={handleSave}
			disabled={disabled || isSaving}
			$saved={saved}
			style={style}
			className={className}
		>
			{saved ? (
				<>
					<FiCheck size={16} />
					Saved!
				</>
			) : (
				<>
					<FiSave size={16} />
					{isSaving ? 'Saving...' : 'Save Configuration'}
				</>
			)}
		</SaveButtonStyled>
	);
};

/**
 * Hook for using save functionality
 */
export const useSaveButton = (flowType: string) => {
	const [isSaving, setIsSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	const save = useCallback(
		async (credentials: StepCredentials, additionalData?: Record<string, unknown>) => {
			if (isSaving) return;

			setIsSaving(true);

			try {
				// Save credentials
				FlowStorageService.saveCredentials(flowType, credentials);

				// Save additional data if provided
				if (additionalData) {
					const additionalKey = `flow_additional_${flowType}`;
					localStorage.setItem(additionalKey, JSON.stringify(additionalData));
				}

				// Show success state
				setSaved(true);
				v4ToastManager.showSuccess('Configuration saved successfully!');

				// Reset after 10 seconds
				setTimeout(() => {
					setSaved(false);
				}, 10000);

				return true;
			} catch (error) {
				console.error('[useSaveButton] Save failed:', error);
				v4ToastManager.showError('Failed to save configuration');
				return false;
			} finally {
				setIsSaving(false);
			}
		},
		[flowType, isSaving]
	);

	const load = useCallback(() => {
		return FlowStorageService.loadCredentials(flowType);
	}, [flowType]);

	const clear = useCallback(() => {
		FlowStorageService.clearCredentials(flowType);
	}, [flowType]);

	return {
		save,
		load,
		clear,
		isSaving,
		saved,
	};
};

/**
 * Export services and components
 */
export default {
	SaveButton,
	useSaveButton,
	FlowStorageService,
	WorkerTokenService,
};
