// src/components/WorkerTokenModal.tsx
// Modal for configuring worker token when not available

import { FiAlertTriangle, FiInfo } from '../../../../icons';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { logger } from '../../../../utils/logger';
import { showTokenSuccessMessage } from '../services/tokenExpirationService';
import { trackedFetch } from '../utils/trackedFetch';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { workerTokenServiceV8 } from '../v8/services/workerTokenServiceV8';
import { DraggableModal } from './DraggableModal';
import { WorkerTokenRequestModal } from './WorkerTokenRequestModal';

type RequestDetails = {
	tokenEndpoint: string;
	requestParams: {
		grant_type: string;
		client_id: string;
		client_secret: string;
		scope?: string;
	};
	authMethod: string;
	region: string;
};

// Note: Worker tokens use roles, not scopes. Scopes are optional and not used for authorization.

const InfoBox = styled.div<{ $variant: 'info' | 'warning' }>`
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	padding: 0.625rem;
	border-radius: 0.375rem;
	background: ${({ $variant }) =>
		$variant === 'warning' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
	border: 1px solid
		${({ $variant }) =>
			$variant === 'warning' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(59, 130, 246, 0.3)'};
`;

const InfoContent = styled.div`
	flex: 1;
`;

const InfoTitle = styled.div`
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.25rem;
`;

const InfoText = styled.div`
	font-size: 0.8125rem;
	color: #6b7280;
	line-height: 1.4;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.5rem 1rem;
	border-radius: 0.375rem;
	border: none;
	background: ${({ $variant }) =>
		$variant === 'secondary' ? '#e5e7eb' : $variant === 'success' ? '#10b981' : '#2563eb'};
	color: ${({ $variant }) => ($variant === 'secondary' ? '#1f2937' : '#ffffff')};
	font-weight: 600;
	cursor: pointer;
	transition: background 120ms ease;
	font-size: 0.8125rem;
	text-decoration: none;

	&:hover {
		background: ${({ $variant }) =>
			$variant === 'secondary' ? '#d1d5db' : $variant === 'success' ? '#059669' : '#1e40af'};
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
	margin-top: 0.5rem;
`;

const StickyFooter = styled.div`
	position: sticky;
	bottom: -1.5rem;
	margin: 1rem -1.5rem 0;
	padding: 1rem 1.5rem 1.5rem;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #ffffff 40%, #ffffff 100%);
	border-top: 1px solid #e2e8f0;
	box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.05);
	z-index: 5;
`;

const FormSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	margin: 0.75rem 0;
`;

const FormField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
`;

const FormLabel = styled.label`
	font-weight: 600;
	color: #374151;
	font-size: 0.8125rem;
`;

const FormInput = styled.input`
	width: 100%;
	padding: 0.5rem 0.625rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const FormSelect = styled.select`
	width: 100%;
	padding: 0.5rem 0.625rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background-color: #ffffff;
	transition: border-color 0.2s ease;
	cursor: pointer;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	option:disabled {
		color: #9ca3af;
	}
`;

const PasswordInput = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	width: 100%;

	input {
		width: 100%;
		padding-right: 2.5rem; /* Make room for the toggle button */
	}
`;

const PasswordToggle = styled.button`
	position: absolute;
	right: 0.75rem;
	background: none;
	border: none;
	color: #6b7280;
	cursor: pointer;
	padding: 0.25rem;

	&:hover {
		color: #374151;
	}
`;

const LoadingSpinner = styled.div`
	display: inline-block;
	width: 16px;
	height: 16px;
	border: 2px solid #e5e7eb;
	border-radius: 50%;
	border-top-color: #3b82f6;
	animation: spin 1s ease-in-out infinite;

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
`;

// Removed normalizeScopes - scope filtering is now handled inline with OIDC scope detection
// const normalizeScopes = (scopes?: string) => {
// 	if (!scopes) return '';
// 	// Remove openid scope (not valid for worker tokens)
// 	return scopes
// 		.replace(/\bopenid\b/gi, '')
// 		.replace(/\bopneid\b/gi, '')
// 		.replace(/\s+/g, ' ')
// 		.trim();
// };

// Removed ensureRequiredScopes - scopes are now optional to prevent 401 errors
// const ensureRequiredScopes = (scopes?: string) => {
// 	const normalized = normalizeScopes(scopes);
// 	const parts = normalized.split(/\s+/).filter(Boolean);
// 	const scopeSet = new Set(parts);
// 	// Note: 'openid' is NOT valid for worker tokens (client_credentials grant)
// 	// Worker tokens only use management API scopes like p1:read:*, p1:write:*, etc.
// 	// Ensure at least one scope exists
// 	if (scopeSet.size === 0) {
// 		scopeSet.add('p1:read:user');
// 	}
// 	return Array.from(scopeSet).join(' ');
// };

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onContinue: () => void;
	flowType?: string;
	environmentId?: string;
	skipCredentialsStep?: boolean; // If true, skip to token generation form directly
	prefillCredentials?: {
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
		region?: string;
		scopes?: string;
	}; // Pre-fill credentials when skipping step 1
	tokenStorageKey?: string; // Custom localStorage key for the token (default: 'worker_token')
	tokenExpiryKey?: string; // Custom localStorage key for token expiry (default: 'worker_token_expires_at')
	educationalMode?: boolean; // Default true, provides educational copy when requesting token
}

export const WorkerTokenModal: React.FC<Props> = ({
	isOpen,
	onClose,
	onContinue,
	flowType = 'flow',
	environmentId = '',
	skipCredentialsStep = false,
	prefillCredentials,
	tokenStorageKey = 'worker_token',
	tokenExpiryKey = 'worker_token_expires_at',
	educationalMode = true,
}) => {
	const navigate = useNavigate();
	const [isNavigating, setIsNavigating] = useState(false);
	const [showForm, setShowForm] = useState(skipCredentialsStep); // Start with form if skipping credentials
	const [isGenerating, setIsGenerating] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showRequestModal, setShowRequestModal] = useState(false);
	const [pendingRequestDetails, setPendingRequestDetails] = useState<RequestDetails | null>(null);

	// Worker credentials state - ONLY use prefillCredentials or defaults (never localStorage)
	// Note: prefillCredentials are the current form values from the parent component
	const [workerCredentials, setWorkerCredentials] = useState(() => {
		// If prefillCredentials provided, use them (these are the CURRENT credentials)
		if (prefillCredentials) {
			logger.info('[WorkerTokenModal] 🎯 Using prefillCredentials (CURRENT form values):', {
				environmentId: `${prefillCredentials.environmentId?.substring(0, 20)}...`,
				clientId: `${prefillCredentials.clientId?.substring(0, 20)}...`,
				clientSecretLength: prefillCredentials.clientSecret?.length || 0,
				clientSecretPreview: prefillCredentials.clientSecret?.substring(0, 20) || 'none',
				scopes: prefillCredentials.scopes,
			});

			// Clean and trim all credential fields to prevent authentication issues
			const cleanedClientId = (prefillCredentials.clientId || '').trim();
			const cleanedClientSecret = (prefillCredentials.clientSecret || '').trim();
			const cleanedEnvironmentId = (prefillCredentials.environmentId || '').trim();

			// For worker tokens, scopes are not used for authorization (roles are used)
			// Scopes are optional - only use if user provided one
			let finalScopes = prefillCredentials.scopes || '';
			// Strip OIDC scopes and normalize to single scope if provided
			if (finalScopes) {
				const scopeArray = finalScopes
					.split(/\s+/)
					.filter(
						(s) => s?.trim() && s !== 'openid' && s !== 'opneid' && s !== 'profile' && s !== 'email'
					);
				finalScopes = scopeArray.length > 0 ? scopeArray[0] : ''; // Use first scope only, or empty
			}

			logger.info('[WorkerTokenModal] ✅ Using cleaned prefilled credentials:', {
				clientIdLength: cleanedClientId.length,
				clientSecretLength: cleanedClientSecret.length,
				clientSecretPreview: cleanedClientSecret.substring(0, 20),
			});

			// Validate environment ID format
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			const effectiveEnvId = (prefillCredentials.environmentId || environmentId || '').trim();
			const isValidEnvId = effectiveEnvId && uuidRegex.test(effectiveEnvId);

			if (!isValidEnvId && effectiveEnvId) {
				logger.warn(
					'[WorkerTokenModal] ⚠️ prefillCredentials environmentId is not valid UUID format:',
					effectiveEnvId
				);
			}

			return {
				environmentId: isValidEnvId ? effectiveEnvId : cleanedEnvironmentId || '',
				clientId: cleanedClientId || '',
				clientSecret: cleanedClientSecret || '',
				region: prefillCredentials.region || 'us',
				scopes: finalScopes || '', // Empty by default - scopes are optional for worker tokens
				authMethod: 'client_secret_post' as
					| 'none'
					| 'client_secret_basic'
					| 'client_secret_post'
					| 'client_secret_jwt'
					| 'private_key_jwt',
			};
		}

		// No prefillCredentials - try to load from saved credentials first
		const savedCredentials = workerTokenServiceV8.loadCredentialsSync();
		if (savedCredentials) {
			// Validate that environmentId is actually an environment ID (UUID format)
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			const savedEnvId = savedCredentials.environmentId?.trim() || '';
			const isValidEnvId = savedEnvId && uuidRegex.test(savedEnvId);

			if (isValidEnvId) {
				logger.info(
					'[WorkerTokenModal] 🔄 Initial state: Using saved credentials from flow-specific storage',
					'Logger info'
				);
				return {
					environmentId: savedEnvId,
					clientId: savedCredentials.clientId || '',
					clientSecret: savedCredentials.clientSecret || '',
					region: savedCredentials.region || 'us',
					scopes: (() => {
						// Worker tokens use roles, not scopes - scopes are optional
						const savedScopes = Array.isArray(savedCredentials.scopes)
							? savedCredentials.scopes.join(' ')
							: savedCredentials.scopes || '';
						// Use first scope only if provided, otherwise empty
						if (savedScopes) {
							const scopeArray = savedScopes.split(/\s+/).filter(Boolean);
							return scopeArray.length > 0 ? scopeArray[0] : '';
						}
						return ''; // Empty - scopes are optional for worker tokens
					})(),
					authMethod:
						savedCredentials.tokenEndpointAuthMethod ||
						('client_secret_post' as
							| 'none'
							| 'client_secret_basic'
							| 'client_secret_post'
							| 'client_secret_jwt'
							| 'private_key_jwt'),
				};
			} else {
				logger.warn(
					'[WorkerTokenModal] ⚠️ Saved credentials have invalid environment ID, using defaults'
				);
			}
		}

		// Use defaults - validate environmentId prop if provided
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		const propEnvId = environmentId?.trim() || '';
		const isValidPropEnvId = propEnvId && uuidRegex.test(propEnvId);

		logger.info('[WorkerTokenModal] ⚠️ No prefillCredentials provided, using defaults');
		return {
			environmentId: isValidPropEnvId ? propEnvId : '', // Only use prop if valid UUID
			clientId: '',
			clientSecret: '',
			region: 'us',
			scopes: '', // Empty by default - worker tokens use roles, not scopes. Scopes are optional.
			authMethod: 'client_secret_post' as
				| 'none'
				| 'client_secret_basic'
				| 'client_secret_post'
				| 'client_secret_jwt'
				| 'private_key_jwt',
		};
	});

	// Track if we've already initialized credentials for this modal session
	const hasInitializedRef = React.useRef(false);

	// Reset initialization flag when modal closes
	useEffect(() => {
		if (!isOpen) {
			hasInitializedRef.current = false;
		}
	}, [isOpen]);

	// Load saved credentials on mount (if no prefillCredentials) or when modal opens
	useEffect(() => {
		if (isOpen && !hasInitializedRef.current) {
			hasInitializedRef.current = true;

			// If prefillCredentials are provided, use them (they are the current form values)
			if (prefillCredentials) {
				logger.info('[WorkerTokenModal] 🔍 Modal opened, using prefillCredentials:', {
					prefillEnvironmentId: prefillCredentials.environmentId || 'missing',
					propEnvironmentId: environmentId || 'missing',
					prefillClientIdLength: prefillCredentials.clientId?.length || 0,
					prefillClientSecretLength: prefillCredentials.clientSecret?.length || 0,
					flowType,
				});

				// Determine the correct environment ID - prioritize prefillCredentials.environmentId, then prop
				const effectiveEnvId = (prefillCredentials.environmentId || environmentId || '').trim();

				// ALWAYS use prefillCredentials - they represent the current form state
				// But ensure scopes are cleaned (worker tokens use roles, not scopes)
				// Scopes are optional - only use if user provided one
				let prefillScopes = prefillCredentials.scopes || '';
				// Strip OIDC scopes and normalize to single scope if provided
				if (prefillScopes) {
					const scopeArray = prefillScopes
						.split(/\s+/)
						.filter(
							(s) =>
								s?.trim() && s !== 'openid' && s !== 'opneid' && s !== 'profile' && s !== 'email'
						);
					prefillScopes = scopeArray.length > 0 ? scopeArray[0] : ''; // Use first scope only, or empty
				}

				setWorkerCredentials({
					environmentId: effectiveEnvId,
					clientId: (prefillCredentials.clientId || '').trim(),
					clientSecret: (prefillCredentials.clientSecret || '').trim(),
					region: prefillCredentials.region || 'us',
					scopes: prefillScopes, // Clean scopes (worker tokens use roles, not scopes)
					authMethod: 'client_secret_post' as
						| 'none'
						| 'client_secret_basic'
						| 'client_secret_post'
						| 'client_secret_jwt'
						| 'private_key_jwt',
				});

				logger.info('[WorkerTokenModal] ✅ Credentials updated from prefillCredentials:', {
					environmentId: effectiveEnvId,
					environmentIdLength: effectiveEnvId.length,
					clientIdLength: (prefillCredentials.clientId || '').trim().length,
					clientSecretLength: (prefillCredentials.clientSecret || '').trim().length,
				});
			} else {
				// No prefillCredentials - try to load from global storage FIRST
				// NEVER use environmentId prop as it might be from authorization code flow credentials
				const savedCredentials = workerTokenServiceV8.loadCredentialsSync();
				if (savedCredentials) {
					// Validate that environmentId is actually an environment ID (UUID format)
					const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
					const savedEnvId = savedCredentials.environmentId?.trim() || '';
					const isValidEnvId = savedEnvId && uuidRegex.test(savedEnvId);

					logger.info(
						'[WorkerTokenModal] 🔄 Loading saved credentials from flow-specific storage:',
						{
							flowType,
							savedEnvironmentId: savedEnvId ? `${savedEnvId.substring(0, 20)}...` : 'MISSING',
							isValidEnvironmentId: isValidEnvId,
							propEnvironmentId: environmentId ? `${environmentId.substring(0, 20)}...` : 'MISSING',
							clientId: `${savedCredentials.clientId?.substring(0, 20)}...`,
							hasClientSecret: !!savedCredentials.clientSecret,
						}
					);

					if (!isValidEnvId) {
						logger.error(
							'[WorkerTokenModal] ❌ Saved environment ID is invalid (not UUID format):',
							savedEnvId
						);
						// Don't use invalid saved credentials
						return;
					}

					// Use saved credentials ONLY - ignore environmentId prop completely
					setWorkerCredentials({
						environmentId: savedEnvId, // Use saved environment ID only
						clientId: savedCredentials.clientId || '',
						clientSecret: savedCredentials.clientSecret || '',
						region: savedCredentials.region || 'us',
						scopes: (() => {
							// Worker tokens use roles, not scopes - we may need 1 scope for API compatibility
							const savedScopes = Array.isArray(savedCredentials.scopes)
								? savedCredentials.scopes.join(' ')
								: savedCredentials.scopes || '';
							// Use first scope only if provided (scopes aren't used for authorization)
							if (savedScopes) {
								const scopeArray = savedScopes.split(/\s+/).filter(Boolean);
								return scopeArray.length > 0 ? scopeArray[0] : '';
							}
							return ''; // Empty - scopes are optional for worker tokens
						})(),
						authMethod:
							savedCredentials.tokenEndpointAuthMethod ||
							('client_secret_post' as
								| 'none'
								| 'client_secret_basic'
								| 'client_secret_post'
								| 'client_secret_jwt'
								| 'private_key_jwt'),
					});

					logger.info(
						'[WorkerTokenModal] ✅ Loaded credentials from flow-specific storage (ignoring environmentId prop)'
					);
				} else {
					// No saved credentials - use defaults but validate environmentId prop if provided
					const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
					const propEnvId = environmentId?.trim() || '';
					const isValidPropEnvId = propEnvId && uuidRegex.test(propEnvId);

					logger.info('[WorkerTokenModal] ℹ️ No saved credentials found for flowType:', flowType);
					logger.info('[WorkerTokenModal] ℹ️ Environment ID prop validation:', {
						propEnvironmentId: propEnvId ? `${propEnvId.substring(0, 20)}...` : 'MISSING',
						isValid: isValidPropEnvId,
					});

					// Only use prop environmentId if it's valid UUID format
					if (isValidPropEnvId) {
						setWorkerCredentials((prev) => ({
							...prev,
							environmentId: propEnvId,
						}));
					} else if (propEnvId) {
						logger.warn(
							'[WorkerTokenModal] ⚠️ Ignoring invalid environmentId prop (not UUID format):',
							propEnvId
						);
					}
				}
			}
		}
	}, [prefillCredentials, environmentId, isOpen, flowType]);

	// Update environmentId when prop changes (if not using prefillCredentials and prop is valid)
	// Only update if prop is a valid UUID format (to avoid using user IDs or invalid values)
	useEffect(() => {
		if (environmentId && !prefillCredentials && !hasInitializedRef.current) {
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			const trimmedEnvId = environmentId.trim();
			if (uuidRegex.test(trimmedEnvId)) {
				// Only update if current environmentId is empty or invalid
				setWorkerCredentials((prev) => {
					const currentEnvId = prev.environmentId.trim();
					if (!currentEnvId || !uuidRegex.test(currentEnvId)) {
						return { ...prev, environmentId: trimmedEnvId };
					}
					return prev; // Keep existing valid environment ID
				});
			} else {
				logger.warn(
					'[WorkerTokenModal] ⚠️ Ignoring invalid environmentId prop (not UUID format):',
					trimmedEnvId
				);
			}
		}
	}, [environmentId, prefillCredentials]);

	// Reset showForm when modal opens/closes if skipCredentialsStep is true
	useEffect(() => {
		if (isOpen && skipCredentialsStep) {
			setShowForm(true);
		} else if (!isOpen) {
			setShowForm(false);
		}
	}, [isOpen, skipCredentialsStep]);

	// Note: Removed autosave - credentials only save when user clicks "Save Credentials" button

	const handleGetWorkerToken = () => {
		setIsNavigating(true);
		v4ToastManager.showInfo('Navigating to get worker token...');
		navigate('/client-generator');
	};

	// Reload credentials from storage when modal opens (prioritize saved credentials over prefillCredentials)
	useEffect(() => {
		if (isOpen) {
			const loadCredentials = async () => {
				const savedCredentials = await workerTokenServiceV8.loadCredentials();
				if (
					savedCredentials?.environmentId &&
					savedCredentials.clientId &&
					savedCredentials.clientSecret
				) {
					logger.info(
						'[WorkerTokenModal] 🔄 Modal opened - reloading saved credentials from global storage',
						'Logger info'
					);
					const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
					const savedEnvId = savedCredentials.environmentId?.trim() || '';
					const isValidEnvId = savedEnvId && uuidRegex.test(savedEnvId);

					if (isValidEnvId) {
						const savedScopes = Array.isArray(savedCredentials.scopes)
							? savedCredentials.scopes.join(' ')
							: savedCredentials.scopes || '';
						const scopeArray = savedScopes.split(/\s+/).filter(Boolean);
						const finalScope = scopeArray.length > 0 ? scopeArray[0] : '';

						// Only update if we have valid saved credentials (prioritize saved over prefill)
						setWorkerCredentials((prev) => {
							// Only update if current credentials are empty or different from saved
							if (!prev.clientId || !prev.clientSecret || prev.environmentId !== savedEnvId) {
								logger.info(
									'[WorkerTokenModal] ✅ Updating credentials from saved storage',
									'Logger info'
								);
								return {
									environmentId: savedEnvId,
									clientId: savedCredentials.clientId || '',
									clientSecret: savedCredentials.clientSecret || '',
									region: savedCredentials.region || 'us',
									scopes: finalScope,
									authMethod: (savedCredentials.tokenEndpointAuthMethod || 'client_secret_post') as
										| 'none'
										| 'client_secret_basic'
										| 'client_secret_post'
										| 'client_secret_jwt'
										| 'private_key_jwt',
								};
							}
							return prev;
						});
					}
				} else {
					logger.info(
						'[WorkerTokenModal] ⚠️ No saved credentials found in global storage',
						'Logger info'
					);
				}
			};
			loadCredentials();
		}
	}, [isOpen]);

	const handleClearSavedCredentials = () => {
		// Clear all saved worker token data using service (with flowType-specific key)
		workerTokenServiceV8.clearCredentials();
		localStorage.removeItem('worker_credentials'); // Legacy key for backward compatibility
		localStorage.removeItem(tokenStorageKey);
		localStorage.removeItem(tokenExpiryKey);

		// Reset the form to defaults
		setWorkerCredentials({
			environmentId: environmentId || '',
			clientId: '',
			clientSecret: '',
			region: 'us',
			scopes: 'p1:read:users p1:read:environments p1:read:applications p1:read:connections',
			authMethod: 'client_secret_post',
		});

		v4ToastManager.showSuccess('Saved credentials cleared successfully');
		logger.info('[WorkerTokenModal] Cleared all saved credentials via service', 'Logger info');
	};

	const handleSaveCredentials = async () => {
		// Validate required fields
		if (
			!workerCredentials.environmentId ||
			!workerCredentials.clientId ||
			!workerCredentials.clientSecret
		) {
			v4ToastManager.showError('Please fill in all required fields before saving');
			return;
		}

		// Clean and trim scopes - remove OIDC scopes for worker tokens
		// Scopes are optional - only save if user provided one
		const cleanedScopes = workerCredentials.scopes
			.split(/\s+/)
			.filter(
				(s: string) =>
					s?.trim() && s !== 'openid' && s !== 'opneid' && s !== 'profile' && s !== 'email'
			);

		// If no scopes after cleaning, use empty array (scopes are optional for worker tokens)
		const finalScopesArray =
			cleanedScopes.length > 0
				? [cleanedScopes[0]] // Use first scope only if provided
				: []; // Empty - scopes are optional

		// Prepare credentials for service (convert scopes string to array)
		const credentialsToSave = {
			environmentId: workerCredentials.environmentId.trim(),
			clientId: workerCredentials.clientId.trim(),
			clientSecret: workerCredentials.clientSecret.trim(),
			region: workerCredentials.region as 'us' | 'eu' | 'ap' | 'ca',
			scopes: finalScopesArray, // Use cleaned scopes (user's input + defaults if needed)
			tokenEndpointAuthMethod: workerCredentials.authMethod,
		};

		// Validate credentials using service
		// Basic validation
		const validation = {
			isValid: !!(
				credentialsToSave.environmentId &&
				credentialsToSave.clientId &&
				credentialsToSave.clientSecret
			),
			errors: [] as string[],
		};
		if (!credentialsToSave.environmentId?.trim())
			validation.errors.push('Environment ID is required');
		if (!credentialsToSave.clientId?.trim()) validation.errors.push('Client ID is required');
		if (!credentialsToSave.clientSecret?.trim())
			validation.errors.push('Client Secret is required');
		if (!validation.isValid) {
			v4ToastManager.showError(`Invalid credentials: ${validation.errors.join(', ')}`);
			return;
		}

		// Save credentials using global service
		try {
			await workerTokenServiceV8.saveCredentials(credentialsToSave);
		} catch (error) {
			logger.error('[WorkerTokenModal] Failed to save credentials:', error);
			v4ToastManager.showError('Failed to save credentials');
			return;
		}

		// Also save to legacy key for backward compatibility
		localStorage.setItem(
			'worker_credentials',
			JSON.stringify({
				environmentId: credentialsToSave.environmentId,
				clientId: credentialsToSave.clientId,
				clientSecret: credentialsToSave.clientSecret,
				region: credentialsToSave.region,
				authMethod: credentialsToSave.tokenEndpointAuthMethod,
				scopes: finalScopesArray.join(' '),
			})
		);

		logger.info('[WorkerTokenModal] Credentials saved via service (cleaned & trimmed):', {
			environmentId: credentialsToSave.environmentId,
			clientId: credentialsToSave.clientId ? '***' : 'missing',
			clientIdLength: credentialsToSave.clientId.length,
			clientSecretLength: credentialsToSave.clientSecret.length,
			hasClientSecret: !!credentialsToSave.clientSecret,
			scopes: finalScopesArray,
			authMethod: credentialsToSave.tokenEndpointAuthMethod,
		});

		v4ToastManager.showSuccess('Credentials saved successfully');
	};

	// Prepare request details and show educational modal
	const handleGenerateWorkerToken = async () => {
		if (
			!workerCredentials.environmentId ||
			!workerCredentials.clientId ||
			!workerCredentials.clientSecret
		) {
			v4ToastManager.showError('Please fill in all required fields');
			return;
		}

		// Save credentials first before generating token
		try {
			// Clean and trim scopes - remove OIDC scopes for worker tokens, but preserve user-added Management API scopes
			const userScopesForToken = workerCredentials.scopes || '';
			const cleanedScopesForToken = userScopesForToken
				.split(/\s+/)
				.filter((s: string) => s?.trim() && s !== 'openid' && s !== 'opneid');

			// If no scopes after cleaning, use empty array (scopes are optional for worker tokens)
			const finalScopesArrayForToken =
				cleanedScopesForToken.length > 0
					? [cleanedScopesForToken[0]] // Use first scope only if provided
					: []; // Empty - scopes are optional

			const credentialsToSave = {
				environmentId: workerCredentials.environmentId.trim(),
				clientId: workerCredentials.clientId.trim(),
				clientSecret: workerCredentials.clientSecret.trim(),
				region: workerCredentials.region as 'us' | 'eu' | 'ap' | 'ca',
				scopes: finalScopesArrayForToken,
				tokenEndpointAuthMethod: workerCredentials.authMethod,
			};

			// Basic validation
			const validation = {
				isValid: !!(
					credentialsToSave.environmentId &&
					credentialsToSave.clientId &&
					credentialsToSave.clientSecret
				),
				errors: [] as string[],
			};
			if (!credentialsToSave.environmentId?.trim())
				validation.errors.push('Environment ID is required');
			if (!credentialsToSave.clientId?.trim()) validation.errors.push('Client ID is required');
			if (!credentialsToSave.clientSecret?.trim())
				validation.errors.push('Client Secret is required');
			if (!validation.isValid) {
				v4ToastManager.showError(`Invalid credentials: ${validation.errors.join(', ')}`);
				return;
			}

			try {
				await workerTokenServiceV8.saveCredentials(credentialsToSave);
				logger.info(
					'[WorkerTokenModal] ✅ Credentials saved automatically before token generation',
					'Logger info'
				);
			} catch (error) {
				logger.warn(
					'[WorkerTokenModal] ⚠️ Failed to save credentials, but continuing with token generation',
					error
				);
			}
		} catch (error) {
			logger.error('[WorkerTokenModal] Error saving credentials:', error);
			// Continue with token generation even if save fails
		}

		// Note: Identity Metrics API uses ROLES, not scopes
		// Any token will work as long as the Worker App has the correct role assigned in PingOne
		if (flowType === 'pingone-identity-metrics') {
			logger.info(
				'[WorkerTokenModal] ℹ️ Note: Metrics API uses roles, not scopes. Ensure your Worker App has "Identity Data Read Only" or "Environment Admin" role assigned.'
			);
		}

		// Trim environment ID before building endpoint URL
		// Prioritize prefillCredentials.environmentId if available (most current), then prop, then state
		let effectiveEnvironmentId = '';
		if (prefillCredentials?.environmentId?.trim()) {
			effectiveEnvironmentId = prefillCredentials.environmentId.trim();
			logger.info(
				'[WorkerTokenModal] 🎯 Using environmentId from prefillCredentials:',
				`${effectiveEnvironmentId.substring(0, 20)}...`
			);
		} else if (environmentId?.trim()) {
			effectiveEnvironmentId = environmentId.trim();
			logger.info(
				'[WorkerTokenModal] 🎯 Using environmentId from prop:',
				`${effectiveEnvironmentId.substring(0, 20)}...`
			);
		} else {
			effectiveEnvironmentId = workerCredentials.environmentId.trim();
			logger.info(
				'[WorkerTokenModal] ⚠️ Using environmentId from workerCredentials state:',
				`${effectiveEnvironmentId.substring(0, 20)}...`
			);
		}

		if (!effectiveEnvironmentId) {
			v4ToastManager.showError('Environment ID is required');
			return;
		}

		// Validate that environmentId looks like a UUID (not a user ID)
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(effectiveEnvironmentId)) {
			logger.error(
				'[WorkerTokenModal] ❌ Environment ID does not look like a valid UUID:',
				effectiveEnvironmentId
			);
			v4ToastManager.showError(
				`Invalid Environment ID format. Expected UUID format, got: ${effectiveEnvironmentId.substring(0, 20)}...`
			);
			return;
		}

		// Build token endpoint URL based on selected region
		const regionDomains: Record<string, string> = {
			us: 'auth.pingone.com',
			eu: 'auth.pingone.eu',
			ap: 'auth.pingone.asia',
			ca: 'auth.pingone.ca',
			na: 'auth.pingone.com',
		};
		const domain = regionDomains[workerCredentials.region] || 'auth.pingone.com';
		const tokenEndpoint = `https://${domain}/${effectiveEnvironmentId}/as/token`;

		// Process scopes - NOTE: Worker tokens use ROLES for authorization, not scopes
		// Scopes are optional - only send if user provides one. If empty, no scope parameter will be sent.
		let finalScopes = workerCredentials.scopes || '';

		// List of OIDC scopes that are NOT valid for worker tokens
		const oidcScopes = ['openid', 'opneid', 'profile', 'email', 'address', 'phone'];

		// Remove OIDC scopes (not valid for worker tokens) and normalize
		finalScopes = finalScopes
			.split(/\s+/)
			.filter((s: string) => s?.trim() && !oidcScopes.includes(s.toLowerCase()))
			.join(' ')
			.trim();

		// If user provided scopes, use the first one (some APIs may only accept one)
		// If no scopes provided, leave empty (no scope parameter will be sent in request)
		if (finalScopes && finalScopes !== '') {
			const scopeArray = finalScopes.split(/\s+/).filter(Boolean);
			if (scopeArray.length > 1) {
				logger.info(
					'[WorkerTokenModal] ℹ️ Multiple scopes provided - using first one. Note: Scopes are NOT used for authorization.',
					'Logger info'
				);
				finalScopes = scopeArray[0];
			}
			logger.info(
				'[WorkerTokenModal] ℹ️ User provided scope:',
				finalScopes,
				'- will be sent in request (but not used for authorization)'
			);
		} else {
			logger.info(
				'[WorkerTokenModal] ℹ️ No scopes provided - no scope parameter will be sent. Worker tokens use ROLES for authorization, not scopes.'
			);
			finalScopes = ''; // Empty - no scope will be sent
		}

		logger.info(
			'[WorkerTokenModal] 📝 REMINDER: Worker token authorization is based on ROLES (e.g., Identity Data Admin), not scopes. Scopes are optional and do not grant permissions.'
		);

		logger.info('[WorkerTokenModal] 🔍 SCOPES DEBUG - Token Request:', {
			original: workerCredentials.scopes,
			afterProcessing: finalScopes,
			willIncludeInRequest: finalScopes !== '',
			scopesArray: finalScopes ? finalScopes.split(/\s+/) : [],
		});

		// Trim credentials to prevent authentication failures from whitespace
		const trimmedClientId = workerCredentials.clientId.trim();
		const trimmedClientSecret = workerCredentials.clientSecret.trim();
		const trimmedEnvironmentId = effectiveEnvironmentId;

		if (!trimmedClientId || !trimmedClientSecret || !trimmedEnvironmentId) {
			v4ToastManager.showError(
				'Please fill in all required fields (Environment ID, Client ID, and Client Secret)'
			);
			return;
		}

		logger.info('[WorkerTokenModal] 🔍 CREDENTIALS BEING USED FOR REQUEST:', {
			clientIdLength: trimmedClientId.length,
			clientIdPreview: `${trimmedClientId.substring(0, 20)}...`,
			clientSecretLength: trimmedClientSecret.length,
			clientSecretPreview: `${trimmedClientSecret.substring(0, 20)}...`,
			environmentId: trimmedEnvironmentId,
			environmentIdLength: trimmedEnvironmentId.length,
			environmentIdSource: prefillCredentials?.environmentId
				? 'prefillCredentials'
				: environmentId
					? 'prop'
					: 'state',
			authMethod: workerCredentials.authMethod,
			region: workerCredentials.region,
			scopes: finalScopes,
		});

		// Prepare request params for modal display (ensure all values are trimmed)
		const requestParams: {
			grant_type: string;
			client_id: string;
			client_secret: string;
			scope?: string;
		} = {
			grant_type: 'client_credentials',
			client_id: trimmedClientId,
			client_secret: trimmedClientSecret,
		};

		// Scope is optional - only include if we have valid scopes
		// Empty or invalid scopes can cause 401 errors if the application doesn't support them
		if (finalScopes?.trim() && finalScopes.trim() !== '') {
			requestParams.scope = finalScopes.trim();
		} else {
			// No scope - will let PingOne use default scopes for the application
			logger.info(
				'[WorkerTokenModal] ℹ️ No scopes specified - PingOne will use default scopes for this application',
				'Logger info'
			);
		}

		// Store request details and show educational modal
		logger.info('[WorkerTokenModal] 🎯 Showing educational modal with request details:', {
			tokenEndpoint,
			clientIdLength: trimmedClientId.length,
			clientSecretLength: trimmedClientSecret.length,
			authMethod: workerCredentials.authMethod,
			region: workerCredentials.region || 'us',
		});

		if (educationalMode) {
			setPendingRequestDetails({
				tokenEndpoint,
				requestParams,
				authMethod: workerCredentials.authMethod,
				region: workerCredentials.region || 'us',
			});
			setShowRequestModal(true);
			logger.info('[WorkerTokenModal] ✅ Educational modal state set to true', 'Logger info');
			return;
		}

		// Minimal mode: execute request immediately
		setPendingRequestDetails({
			tokenEndpoint,
			requestParams,
			authMethod: workerCredentials.authMethod,
			region: workerCredentials.region || 'us',
		});
		executeTokenRequest();
	};

	// Execute the actual token request (called from educational modal)
	const executeTokenRequest = async () => {
		if (!pendingRequestDetails) {
			v4ToastManager.showError('Request details not available');
			return;
		}

		setShowRequestModal(false);
		setIsGenerating(true);

		try {
			const { tokenEndpoint, requestParams, authMethod } = pendingRequestDetails;

			// Prepare headers and body based on authentication method
			const headers: Record<string, string> = {
				'Content-Type': 'application/x-www-form-urlencoded',
			};

			const bodyParams: Record<string, string> = {
				grant_type: requestParams.grant_type,
				scope: requestParams.scope || '',
			};

			logger.info('[WorkerTokenModal] Using auth method:', authMethod);
			logger.info('[WorkerTokenModal] Credential lengths:', {
				clientId: requestParams.client_id.length,
				clientSecret: requestParams.client_secret.length,
			});

			switch (authMethod) {
				case 'client_secret_basic':
					// Use Basic authentication in Authorization header
					headers['Authorization'] =
						`Basic ${btoa(`${requestParams.client_id}:${requestParams.client_secret}`)}`;
					// Still need client_id in body for token endpoint (PingOne requirement)
					bodyParams.client_id = requestParams.client_id;
					logger.info(
						'[WorkerTokenModal] Using Basic auth in header with client_id in body',
						'Logger info'
					);
					break;
				case 'client_secret_post':
					// Send client credentials in request body
					bodyParams.client_id = requestParams.client_id;
					bodyParams.client_secret = requestParams.client_secret;
					logger.info('[WorkerTokenModal] Using client credentials in body', 'Logger info');
					break;
				case 'client_secret_jwt':
				case 'private_key_jwt':
					// For JWT-based authentication, we'd need to generate a JWT assertion
					// For now, fall back to client_secret_post
					bodyParams.client_id = requestParams.client_id;
					bodyParams.client_secret = requestParams.client_secret;
					logger.info(
						'[WorkerTokenModal] JWT auth not implemented, falling back to client_secret_post'
					);
					break;
				case 'none':
					// No authentication - just send client_id
					bodyParams.client_id = requestParams.client_id;
					logger.info('[WorkerTokenModal] Using no authentication', 'Logger info');
					break;
				default:
					// Default to client_secret_post
					bodyParams.client_id = requestParams.client_id;
					bodyParams.client_secret = requestParams.client_secret;
					logger.info('[WorkerTokenModal] Default to client_secret_post', 'Logger info');
			}

			// Build URLSearchParams from bodyParams (ensures proper encoding and handles empty values)
			// IMPORTANT: Don't include scope parameter if it's empty or undefined - PingOne may reject requests with empty/invalid scopes
			const body = new URLSearchParams();
			Object.entries(bodyParams).forEach(([key, value]) => {
				// Skip scope if it's empty, undefined, or null - let PingOne use default scopes
				if (key === 'scope' && (!value || value.trim() === '')) {
					logger.info(
						'[WorkerTokenModal] ⚠️ Skipping empty scope parameter - PingOne will use default scopes',
						'Logger info'
					);
					return;
				}
				if (value !== undefined && value !== null && value !== '') {
					body.append(key, String(value));
				}
			});

			logger.info('[WorkerTokenModal] ===== TOKEN REQUEST DETAILS =====', 'Logger info');
			logger.info('[WorkerTokenModal] Endpoint:', tokenEndpoint);
			logger.info('[WorkerTokenModal] Region:', pendingRequestDetails.region);
			logger.info('[WorkerTokenModal] Headers:', headers);
			logger.info('[WorkerTokenModal] Body params:', bodyParams);
			logger.info('[WorkerTokenModal] Body string:', body.toString());
			logger.info('[WorkerTokenModal] Scopes being sent:', bodyParams.scope);
			logger.info('[WorkerTokenModal] ===============================', 'Logger info');

			// Use trackedFetch to automatically track this API call in the API calls table
			const response = await trackedFetch(tokenEndpoint, {
				method: 'POST',
				headers,
				body: body.toString(),
			});

			if (!response.ok) {
				const errorText = await response.text();
				let errorData: Record<string, unknown> = {};
				try {
					errorData = JSON.parse(errorText) as Record<string, unknown>;
				} catch {
					errorData = { raw: errorText };
				}

				// Trim credentials here for use in error messages
				const trimmedClientId = workerCredentials.clientId.trim();
				const trimmedClientSecret = workerCredentials.clientSecret.trim();
				// Use the same effectiveEnvironmentId that was used to build the token endpoint
				const trimmedEnvId =
					prefillCredentials?.environmentId?.trim() ||
					environmentId?.trim() ||
					workerCredentials.environmentId.trim();

				logger.error('[WorkerTokenModal] ❌ TOKEN REQUEST FAILED:', {
					status: response.status,
					statusText: response.statusText,
					endpoint: tokenEndpoint,
					region: pendingRequestDetails.region || 'us',
					scopesRequested: bodyParams.scope,
					authMethod: authMethod,
					requestHeaders: {
						...headers,
						Authorization: headers.Authorization ? '[REDACTED]' : undefined,
					},
					requestBody: body.toString().replace(/client_secret=[^&]*/, 'client_secret=[REDACTED]'),
					error: errorData,
					rawErrorText: errorText,
				});

				// Log detailed error information for debugging
				logger.error('[WorkerTokenModal] Error Details:', {
					errorType: errorData.error,
					errorDescription: errorData.error_description,
					errorUri: errorData.error_uri,
					fullErrorResponse: errorData,
					responseHeaders: Object.fromEntries(response.headers.entries()),
				});

				// Parse error response for user-friendly messages
				let userMessage = 'Unknown error occurred';
				const errorType = (errorData.error as string) || '';
				const errorDesc = (errorData.error_description as string) || '';

				// Build verification checklist for credential errors
				const verificationChecklist =
					'\n\nPlease verify:\n' +
					`• Environment ID: ${trimmedEnvId || 'MISSING'}\n` +
					`• Client ID: ${trimmedClientId ? `${trimmedClientId.substring(0, 20)}...` : 'MISSING'}\n` +
					`• Client Secret: ${trimmedClientSecret ? `***${trimmedClientSecret.substring(trimmedClientSecret.length - 4)}` : 'MISSING'}\n` +
					`• Token Auth Method: ${authMethod}`;

				if (errorType === 'invalid_client') {
					userMessage =
						'Your Client ID or Client Secret is incorrect, or the authentication method is not supported by this application.' +
						verificationChecklist;
				} else if (errorType === 'invalid_scope') {
					userMessage =
						'The scopes you requested are not valid or not granted to this application. Note: Worker tokens require management API scopes (e.g., p1:read:users), not OIDC scopes (e.g., profile, email, openid).' +
						verificationChecklist;
				} else if (errorType === 'unauthorized_client') {
					userMessage =
						'This client is not authorized to use the client_credentials grant type.' +
						verificationChecklist;
				} else if (response.status === 400 || response.status === 401) {
					// For 400/401 errors, always include the verification checklist
					userMessage =
						(errorDesc || `HTTP ${response.status}: ${errorText}`) + verificationChecklist;
				} else if (errorDesc) {
					userMessage = errorDesc + verificationChecklist;
				} else if (errorData.raw) {
					userMessage = `HTTP ${response.status}: ${String(errorData.raw)}${verificationChecklist}`;
				} else {
					userMessage = `HTTP ${response.status}: ${errorText}${verificationChecklist}`;
				}

				// Show user-friendly error message (don't throw to avoid stack trace)
				v4ToastManager.showError(userMessage);
				setIsGenerating(false);
				return;
			}

			const tokenData = await response.json();

			const requestedScopesStr = requestParams.scope || '';

			// Try to get granted scopes from token response first, then try JWT decoding
			let grantedScopes: string[] = [];
			if (tokenData.scope) {
				// Use scopes from token response (most reliable)
				grantedScopes = tokenData.scope.split(' ').filter(Boolean);
			} else {
				// Try to decode JWT as fallback
				try {
					const tokenParts = tokenData.access_token.split('.');
					if (tokenParts.length === 3) {
						const payload = JSON.parse(atob(tokenParts[1]));
						grantedScopes = payload.scope ? payload.scope.split(' ').filter(Boolean) : [];
					}
				} catch (e) {
					logger.debug(
						'[WorkerTokenModal] Token is not a JWT or could not decode (this is OK for opaque tokens):',
						e
					);
				}
			}

			logger.info('[WorkerTokenModal] ✅ TOKEN RECEIVED FROM PINGONE:', {
				hasAccessToken: !!tokenData.access_token,
				expiresIn: tokenData.expires_in,
				tokenType: tokenData.token_type,
				scopesInResponse: tokenData.scope,
				scopesGranted: grantedScopes,
				scopesRequested: requestedScopesStr.split(/\s+/).filter(Boolean),
				tokenFormat: tokenData.access_token.split('.').length === 3 ? 'JWT' : 'Opaque',
			});

			// Only check scopes if we could determine what was granted
			if (grantedScopes.length > 0) {
				const requestedScopes = requestedScopesStr.split(/\s+/).filter(Boolean);
				const missingScopes = requestedScopes.filter(
					(scope: string) => !grantedScopes.includes(scope)
				);

				if (missingScopes.length > 0) {
					logger.warn('[WorkerTokenModal] ⚠️ Some requested scopes may not have been granted:', {
						requested: requestedScopes,
						granted: grantedScopes,
						missing: missingScopes,
					});

					// For Identity Metrics, remind about role requirements (not scope requirements)
					if (flowType === 'pingone-identity-metrics') {
						logger.info(
							'[WorkerTokenModal] ℹ️ Reminder: Metrics API uses roles. If you get 403, assign "Identity Data Read Only" role to your Worker App.'
						);
					}
				} else {
					logger.info('[WorkerTokenModal] ✅ All requested scopes were granted:', grantedScopes);
				}
			} else {
				logger.debug(
					'[WorkerTokenModal] 📝 Could not verify granted scopes (token may be opaque). If you encounter 403 errors, check roles in PingOne.'
				);
			}

			// Calculate expiration time (default to 1 hour if not provided)
			const expiresIn = tokenData.expires_in || 3600; // seconds
			const expiresAt = Date.now() + expiresIn * 1000; // convert to milliseconds

			// Store the worker token with expiration metadata (legacy keys for backwards compatibility)
			localStorage.setItem(tokenStorageKey, tokenData.access_token);
			localStorage.setItem(tokenExpiryKey, expiresAt.toString());

			logger.info('[WorkerTokenModal] ✅ Token stored successfully:', {
				tokenKey: tokenStorageKey,
				tokenPreview: `${tokenData.access_token.substring(0, 20)}...`,
				expiresIn: `${Math.floor(expiresIn / 60)} minutes`,
				scopesGranted: tokenData.scope,
				scopesRequested: requestedScopesStr,
			});

			// Save credentials with clean scopes (no openid) and trim all fields
			// Preserve user's scopes from workerCredentials state (which they can edit)
			const userScopes = workerCredentials.scopes || '';
			const cleanScopes = userScopes
				.split(/\s+/)
				.filter((s: string) => s?.trim() && s !== 'openid' && s !== 'opneid');

			// If no scopes after cleaning, use empty array (scopes are optional for worker tokens)
			const finalScopesForSave =
				cleanScopes.length > 0
					? [cleanScopes[0]] // Use first scope only if provided
					: []; // Empty - scopes are optional

			const credentialsToSave = {
				environmentId: workerCredentials.environmentId.trim(),
				clientId: workerCredentials.clientId.trim(),
				clientSecret: workerCredentials.clientSecret.trim(),
				region: workerCredentials.region as 'us' | 'eu' | 'ap' | 'ca',
				scopes: finalScopesForSave, // Use cleaned user scopes or defaults
				tokenEndpointAuthMethod: workerCredentials.authMethod,
			};

			let persistedViaService = true;
			try {
				await workerTokenServiceV8.saveCredentials(credentialsToSave);
				await workerTokenServiceV8.saveToken(tokenData.access_token, expiresAt);
			} catch (error) {
				persistedViaService = false;
				logger.error('[WorkerTokenModal] Failed to persist worker token via service:', error);
			}

			// Also save to legacy key for backward compatibility
			localStorage.setItem(
				'worker_credentials',
				JSON.stringify({
					environmentId: credentialsToSave.environmentId,
					clientId: credentialsToSave.clientId,
					clientSecret: credentialsToSave.clientSecret,
					region: credentialsToSave.region,
					authMethod: credentialsToSave.tokenEndpointAuthMethod,
					scopes: cleanScopes.join(' '),
				})
			);

			if (persistedViaService) {
				logger.info('[WorkerTokenModal] Token and credentials saved successfully:', {
					expiresIn: `${expiresIn} seconds`,
					expiresAt: new Date(expiresAt).toISOString(),
					savedCredentials: {
						environmentId: credentialsToSave.environmentId,
						clientId: credentialsToSave.clientId ? '***' : 'missing',
						hasClientSecret: !!credentialsToSave.clientSecret,
						scopes: credentialsToSave.scopes,
						authMethod: credentialsToSave.tokenEndpointAuthMethod,
					},
				});
			} else {
				logger.warn(
					'[WorkerTokenModal] Token saved to legacy storage only; V8 service persistence failed.',
					'Logger warning'
				);
			}

			// Dispatch custom event to notify other components that worker token was updated
			// Use custom event name based on token storage key
			let eventName = 'workerTokenUpdated';
			if (tokenStorageKey === 'worker_token_metrics') {
				eventName = 'workerTokenMetricsUpdated';
			} else if (tokenStorageKey === 'worker_token_audit') {
				eventName = 'workerTokenAuditUpdated';
			}
			window.dispatchEvent(
				new CustomEvent(eventName, {
					detail: {
						token: tokenData.access_token,
						expiresAt,
					},
				})
			);

			showTokenSuccessMessage(expiresIn);
			onContinue();
		} catch (error) {
			logger.error('Worker token generation failed:', error);
			v4ToastManager.showError(
				`Failed to generate worker token: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleContinueWithoutToken = () => {
		v4ToastManager.showWarning('Config Checker will be disabled without worker token');
		onContinue();
	};

	if (!isOpen) {
		logger.info('[WorkerTokenModal] Modal is closed (isOpen = false)');
		return null;
	}

	logger.info('[WorkerTokenModal] ✅ Rendering modal (isOpen = true)', {
		skipCredentialsStep,
		showForm,
		hasCredentials: !!(workerCredentials.clientId && workerCredentials.clientSecret),
	});

	return (
		<>
			<DraggableModal
				isOpen={isOpen}
				onClose={onClose}
				title={skipCredentialsStep ? 'Get Worker Token' : 'Worker Token Required'}
				maxHeight="calc(100vh - 4rem)"
				width="min(900px, calc(100vw - 2rem))"
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
					{!skipCredentialsStep && (
						<InfoBox $variant="warning">
							<FiAlertTriangle
								size={16}
								style={{ flexShrink: 0, color: '#f59e0b', marginTop: '0.125rem' }}
							/>
							<InfoContent>
								<InfoTitle style={{ fontSize: '0.875rem', marginBottom: '0.125rem' }}>
									Worker Token Required
								</InfoTitle>
								<InfoText>
									Generate a PingOne worker token to unlock Config Checker features.
								</InfoText>
							</InfoContent>
						</InfoBox>
					)}

					{!showForm ? (
						<>
							<InfoBox $variant="info">
								<FiInfo
									size={16}
									style={{ flexShrink: 0, color: '#3b82f6', marginTop: '0.125rem' }}
								/>
								<InfoContent>
									<InfoTitle style={{ fontSize: '0.875rem', marginBottom: '0.125rem' }}>
										Get Worker Token
									</InfoTitle>
									<InfoText>
										Enter your PingOne worker app credentials, then generate a token. You can also
										jump to Client Generator if you prefer.
									</InfoText>
								</InfoContent>
							</InfoBox>

							<ButtonGroup>
								<ActionButton onClick={() => setShowForm(true)}>
									<span>🔑</span>
									Generate Worker Token Here
								</ActionButton>
								<ActionButton onClick={handleGetWorkerToken} disabled={isNavigating}>
									<span>🔗</span>
									Use Client Generator
								</ActionButton>
								<ActionButton $variant="secondary" onClick={handleContinueWithoutToken}>
									Continue Without Config Checker
								</ActionButton>
							</ButtonGroup>
						</>
					) : (
						<>
							{skipCredentialsStep && (
								<InfoBox $variant="info">
									<FiInfo
										size={16}
										style={{ flexShrink: 0, color: '#3b82f6', marginTop: '0.125rem' }}
									/>
									<InfoContent>
										<InfoTitle style={{ fontSize: '0.875rem', marginBottom: '0.125rem' }}>
											Enter Credentials
										</InfoTitle>
										<InfoText>Provide worker app credentials, then generate your token.</InfoText>
									</InfoContent>
								</InfoBox>
							)}
							{!skipCredentialsStep && (
								<InfoBox $variant="info">
									<FiInfo
										size={16}
										style={{ flexShrink: 0, color: '#3b82f6', marginTop: '0.125rem' }}
									/>
									<InfoContent>
										<InfoTitle style={{ fontSize: '0.875rem', marginBottom: '0.125rem' }}>
											Enter Credentials
										</InfoTitle>
										<InfoText>Provide worker app credentials, then generate your token.</InfoText>
									</InfoContent>
								</InfoBox>
							)}

							<FormSection>
								<FormField>
									<FormLabel>
										Environment ID <span style={{ color: '#ef4444' }}>*</span>
									</FormLabel>
									<FormInput
										type="text"
										placeholder="e.g., b9817c16-9910-4415-b67e-4ac687da74d9"
										value={workerCredentials.environmentId || ''}
										onChange={(e) =>
											setWorkerCredentials((prev) => ({
												...prev,
												environmentId: e.target.value.trim(),
											}))
										}
										style={{
											borderColor: !workerCredentials.environmentId ? '#ef4444' : undefined,
										}}
									/>
									{!workerCredentials.environmentId && (
										<div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
											Environment ID is required
										</div>
									)}
								</FormField>

								<FormField>
									<FormLabel>Region</FormLabel>
									<FormInput
										as="select"
										value={workerCredentials.region}
										onChange={(e) =>
											setWorkerCredentials((prev) => ({ ...prev, region: e.target.value }))
										}
									>
										<option value="us">US (auth.pingone.com)</option>
										<option value="eu">Europe (auth.pingone.eu)</option>
										<option value="ap">Asia Pacific (auth.pingone.asia)</option>
										<option value="ca">Canada (auth.pingone.ca)</option>
									</FormInput>
								</FormField>

								<FormField>
									<FormLabel>Client ID *</FormLabel>
									<FormInput
										type="text"
										placeholder="e.g., 5ac8ccd7-7ebc-4684-b0d9-233705e87a7c"
										value={workerCredentials.clientId}
										onChange={(e) =>
											setWorkerCredentials((prev) => ({ ...prev, clientId: e.target.value }))
										}
									/>
								</FormField>

								<FormField>
									<FormLabel>Client Secret *</FormLabel>
									<PasswordInput>
										<FormInput
											type={showPassword ? 'text' : 'password'}
											placeholder="Enter your client secret"
											value={workerCredentials.clientSecret}
											onChange={(e) =>
												setWorkerCredentials((prev) => ({ ...prev, clientSecret: e.target.value }))
											}
										/>
										<PasswordToggle onClick={() => setShowPassword(!showPassword)}>
											{showPassword ? (
												<span style={{ fontSize: '16px' }}>🙈</span>
											) : (
												<span style={{ fontSize: '16px' }}>👁️</span>
											)}
										</PasswordToggle>
									</PasswordInput>
								</FormField>

								<FormField>
									<FormLabel>Token Endpoint Authentication Method</FormLabel>
									<FormSelect
										value={workerCredentials.authMethod}
										onChange={(e) =>
											setWorkerCredentials((prev) => ({
												...prev,
												authMethod: e.target.value as
													| 'none'
													| 'client_secret_basic'
													| 'client_secret_post'
													| 'client_secret_jwt'
													| 'private_key_jwt',
											}))
										}
									>
										<option value="none" disabled>
											None
										</option>
										<option value="client_secret_basic">Client Secret Basic</option>
										<option value="client_secret_post">Client Secret Post</option>
										<option value="client_secret_jwt">Client Secret JWT</option>
										<option value="private_key_jwt">Private Key JWT</option>
									</FormSelect>
									<div
										style={{
											fontSize: '0.75rem',
											color: '#6b7280',
											marginTop: '0.125rem',
											lineHeight: '1.3',
										}}
									>
										💡 Use "Client Secret Post" for most PingOne applications.
									</div>
								</FormField>

								<FormField>
									<FormLabel>Scopes</FormLabel>
									<FormInput
										type="text"
										placeholder="Leave empty or enter scope (e.g., p1:read:users)"
										value={workerCredentials.scopes || ''}
										onChange={(e) =>
											setWorkerCredentials((prev) => ({ ...prev, scopes: e.target.value }))
										}
									/>
									{!educationalMode && (
										<div
											style={{
												fontSize: '0.75rem',
												color: '#6b7280',
												marginTop: '0.125rem',
												lineHeight: '1.3',
											}}
										>
											Scopes are optional and not used for authorization. Worker tokens use roles.
										</div>
									)}
								</FormField>
							</FormSection>

							<StickyFooter>
								<ButtonGroup>
									<ActionButton
										onClick={handleGenerateWorkerToken}
										disabled={
											isGenerating ||
											!workerCredentials.environmentId ||
											!workerCredentials.clientId ||
											!workerCredentials.clientSecret
										}
									>
										{isGenerating ? <LoadingSpinner /> : <span>🔄</span>}
										{isGenerating ? 'Generating...' : 'Generate Worker Token'}
									</ActionButton>
									<ActionButton
										$variant="success"
										onClick={handleSaveCredentials}
										disabled={
											isGenerating ||
											!workerCredentials.environmentId ||
											!workerCredentials.clientId ||
											!workerCredentials.clientSecret
										}
									>
										<span>💾</span>
										Save Credentials
									</ActionButton>
									<ActionButton
										$variant="secondary"
										onClick={handleClearSavedCredentials}
										disabled={isGenerating}
									>
										🗑️ Clear Saved Credentials
									</ActionButton>
									<ActionButton $variant="secondary" onClick={() => setShowForm(false)}>
										Cancel
									</ActionButton>
								</ButtonGroup>
							</StickyFooter>
						</>
					)}
				</div>
			</DraggableModal>

			{/* Educational modal showing request details */}
			{pendingRequestDetails && educationalMode && (
				<WorkerTokenRequestModal
					isOpen={showRequestModal}
					onClose={() => setShowRequestModal(false)}
					onProceed={executeTokenRequest}
					tokenEndpoint={pendingRequestDetails.tokenEndpoint}
					requestParams={pendingRequestDetails.requestParams}
					authMethod={pendingRequestDetails.authMethod}
					region={pendingRequestDetails.region}
				/>
			)}
		</>
	);
};
