/**
 * @file WorkerTokenModalV8.tsx
 * @module v8/components
 * @description Worker token credential management modal for V8
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useEffect, useState } from 'react';
import { FiDownload, FiUpload } from 'react-icons/fi';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import {
	exportWorkerTokenCredentials,
	importCredentials,
	triggerFileImport,
	type WorkerTokenCredentials,
} from '@/services/credentialExportImportService';
import { environmentService } from '@/services/environmentService';
import { UnifiedTokenDisplayService } from '@/services/unifiedTokenDisplayService';
import {
	type UnifiedWorkerTokenCredentials,
	unifiedWorkerTokenService,
} from '@/services/unifiedWorkerTokenService';
import pingOneFetch from '@/utils/pingOneFetch';
import { PINGONE_WORKER_MFA_SCOPE_STRING } from '@/v8/config/constants';
import { AuthMethodServiceV8, type AuthMethodV8 } from '@/v8/services/authMethodServiceV8';
import { MFAConfigurationServiceV8 } from '@/v8/services/mfaConfigurationServiceV8';
import { workerTokenCacheServiceV8 } from '@/v8/services/workerTokenCacheServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { StandardModalSpinner, useStandardSpinner } from '../../components/ui/StandardSpinner';
import { WorkerTokenRequestModalV8 } from './WorkerTokenRequestModalV8';

const MODULE_TAG = '[🔑 WORKER-TOKEN-MODAL-V8]';

interface WorkerTokenModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	onTokenGenerated?: (token: string) => void;
	environmentId?: string;
	showTokenOnly?: boolean; // If true, show only token display, skip credential form
}

// src/v8/components/WorkerTokenModalV8.tsx
// Enhanced Worker Token Modal with silent API and show token options
// Cache bust: 2025-02-17-11:42-fixed-duplicate-scopes

const WorkerTokenModalV8: React.FC<WorkerTokenModalV8Props> = ({
	isOpen,
	onClose,
	onTokenGenerated,
	environmentId: propEnvironmentId = '',
	showTokenOnly = false,
}) => {
	const [environmentId, setEnvironmentId] = useState(propEnvironmentId);
	const [clientId, setClientId] = useState('');
	const [clientSecret, setClientSecret] = useState('');
	const [scopeInput, setScopeInput] = useState(PINGONE_WORKER_MFA_SCOPE_STRING);
	const [region, setRegion] = useState<'us' | 'eu' | 'ap' | 'ca'>('us');
	const [customDomain, setCustomDomain] = useState<string>('');
	const [authMethod, setAuthMethod] = useState<AuthMethodV8>('client_secret_basic');
	const [showSecret, setShowSecret] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [loadingMessage, _setLoadingMessage] = useState('');
	const [showRequestModal, setShowRequestModal] = useState(false);
	const [requestDetails, setRequestDetails] = useState<{
		tokenEndpoint: string;
		requestParams: {
			grant_type: string;
			client_id: string;
			client_secret: string;
			scope: string;
		};
		authMethod: AuthMethodV8;
		region: 'us' | 'eu' | 'ap' | 'ca';
		resolvedHeaders: Record<string, string>;
		resolvedBody: string;
	} | null>(null);
	const [saveCredentials, setSaveCredentials] = useState(true);
	const [currentToken, setCurrentToken] = useState<string | null>(null);
	const [showTokenDisplay, setShowTokenDisplay] = useState(false);
	const [krpCompliance, setKrpCompliance] = useState<{
		compliant: boolean;
		daysUntilDeadline: number;
		warning: string;
		recommendation: string;
	} | null>(null);

	// Standardized spinner hooks for worker token operations
	const generateSpinner = useStandardSpinner(8000); // Generate token - 8 seconds
	const validateSpinner = useStandardSpinner(4000); // Validate config - 4 seconds
	const executeSpinner = useStandardSpinner(6000); // Execute request - 6 seconds
	const importSpinner = useStandardSpinner(3000); // Import credentials - 3 seconds
	const exportSpinner = useStandardSpinner(2000); // Export credentials - 2 seconds

	// Check if we should display current token when modal opens
	useEffect(() => {
		if (isOpen) {
			const checkToken = async () => {
				const tokenStatus = await WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
				if (tokenStatus.isValid || showTokenOnly) {
					const config = MFAConfigurationServiceV8.loadConfiguration();
					if (config.workerToken.showTokenAtEnd || showTokenOnly) {
						const token = await unifiedWorkerTokenService.getToken();
						if (token) {
							setCurrentToken(token);
							setShowTokenDisplay(true);

							// Fetch KRP status
							try {
								const [, krpComplianceData] = await Promise.all([
									unifiedWorkerTokenService.getKeyRotationStatus(),
									unifiedWorkerTokenService.checkKRPCompliance(),
								]);
								setKrpCompliance(krpComplianceData);
							} catch (error) {
								console.warn(`${MODULE_TAG} Failed to fetch KRP status:`, error);
							}
						}
					}
				}
			};
			void checkToken();
		} else {
			// Reset when modal closes
			setCurrentToken(null);
			setShowTokenDisplay(false);
			setKrpCompliance(null);
		}
	}, [isOpen, showTokenOnly]);

	// Lock body scroll when modal is open
	React.useEffect(() => {
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
		return undefined;
	}, [isOpen]);

	// Handle ESC key to close modal
	React.useEffect(() => {
		if (!isOpen) return undefined;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	// Load saved credentials on mount
	React.useEffect(() => {
		if (isOpen) {
			// Load from unifiedWorkerTokenService (IndexedDB + SQLite backup)
			unifiedWorkerTokenService
				.loadCredentials()
				.then((creds: UnifiedWorkerTokenCredentials | null) => {
					if (creds) {
						setEnvironmentId(creds.environmentId || propEnvironmentId);
						setClientId(creds.clientId || '');
						setClientSecret(creds.clientSecret || '');
						setScopeInput(
							Array.isArray(creds.scopes) && creds.scopes.length ? creds.scopes.join(' ') : ''
						);
						setRegion(creds.region || 'us');
						setCustomDomain(creds.customDomain || '');
						setAuthMethod(creds.tokenEndpointAuthMethod || 'client_secret_basic');
						console.log(`${MODULE_TAG} Loaded credentials from unifiedWorkerTokenService`);
					} else {
						console.log(`${MODULE_TAG} No credentials found in unified storage`);
					}
				})
				.catch((error) => {
					console.error(
						`${MODULE_TAG} Failed to load credentials from unifiedWorkerTokenService:`,
						error
					);
				});
		}
	}, [isOpen, propEnvironmentId]);

	React.useEffect(() => {
		// NOTE: Scope event handling removed - worker token provides necessary permissions
	}, []);

	if (!isOpen) return null;

	const handleSaveCredentials = async () => {
		// Validate required fields
		if (!environmentId.trim() || !clientId.trim() || !clientSecret.trim()) {
			toastV8.error(
				'Please fill in all required fields (Environment ID, Client ID, and Client Secret)'
			);
			return;
		}

		try {
			// Normalize scopes
			const normalizedScopes = scopeInput
				.split(/\s+/)
				.map((scope) => scope.trim())
				.filter(Boolean);

			if (normalizedScopes.length === 0) {
				toastV8.error('Please provide at least one scope for the worker token');
				return;
			}

			// Prepare credentials object with all UI fields
			const credentials: UnifiedWorkerTokenCredentials = {
				environmentId: environmentId.trim(),
				clientId: clientId.trim(),
				clientSecret: clientSecret.trim(),
				scopes: normalizedScopes,
				region: region,
				tokenEndpointAuthMethod: authMethod,
				...(customDomain && { customDomain: customDomain.trim() }),
			};

			// Save to unifiedWorkerTokenService
			await unifiedWorkerTokenService.saveCredentials(credentials);

			// Also save to global environment service for compatibility
			const options: { region: 'us' | 'eu' | 'ap' | 'ca'; customDomain?: string } = {
				region: region as 'us' | 'eu' | 'ap' | 'ca',
			};
			if (customDomain?.trim()) {
				options.customDomain = customDomain.trim();
			}
			environmentService.setEnvironmentId(environmentId.trim(), options);

			// Also save credentials to MFA flow for MFA Hub compatibility
			try {
				const { CredentialsServiceV8 } = await import('@/v8/services/credentialsServiceV8');
				const stored = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
					flowKey: 'mfa-flow-v8',
					flowType: 'oidc',
					includeClientSecret: false,
					includeRedirectUri: false,
					includeLogoutUri: false,
					includeScopes: false,
				});
				CredentialsServiceV8.saveCredentials('mfa-flow-v8', {
					...stored,
					environmentId: environmentId.trim(),
					username: stored.username || '',
				});
			} catch (credError) {
				console.warn('[WorkerTokenModalV8] Failed to save credentials to MFA flow:', credError);
			}

			toastV8.success('Worker token credentials saved successfully!');
			console.log(`${MODULE_TAG} Credentials saved:`, {
				environmentId: environmentId.trim(),
				clientId: clientId.trim(),
				hasClientSecret: !!clientSecret.trim(),
				scopes: normalizedScopes,
				region,
				authMethod,
				hasCustomDomain: !!customDomain?.trim(),
			});
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save credentials:`, error);
			toastV8.error('Failed to save credentials');
		}
	};

	const handleGenerate = async () => {
		try {
			await generateSpinner.executeWithSpinner(
				async () => {
					if (!environmentId?.trim() || !clientId?.trim() || !clientSecret?.trim()) {
						toastV8.error('Please fill in all required fields');
						return; // Return instead of throwing
					}

					const normalizedScopes = scopeInput
						.split(/\s+/)
						.map((scope) => scope.trim())
						.filter(Boolean);

					if (normalizedScopes.length === 0) {
						toastV8.error('Please provide at least one scope for the worker token');
						return; // Return instead of throwing
					}

					setScopeInput(normalizedScopes.join(' '));

				// Save credentials to unifiedWorkerTokenService
				const credentials: UnifiedWorkerTokenCredentials = {
					environmentId: environmentId?.trim() || '',
					clientId: clientId?.trim() || '',
					clientSecret: clientSecret?.trim() || '',
					scopes: normalizedScopes, // Already an array
					region: region,
					tokenEndpointAuthMethod: authMethod,
					...(customDomain && { customDomain }),
				};

				await unifiedWorkerTokenService.saveCredentials(credentials);

				// Run preflight validation
				const { PreFlightValidationServiceV8 } = await import(
					'@/v8/services/preFlightValidationServiceV8'
				);

				// Try to get worker token from current or cached source
				const tokenValidation = await workerTokenCacheServiceV8.getWorkerTokenForValidation(
					environmentId.trim(),
					clientId.trim()
				);

				// If we have a valid token, use it for validation
				if (tokenValidation?.isValid) {
					console.log(`${MODULE_TAG} 🔑 Using existing token for validation`);
				} else {
					console.log(`${MODULE_TAG} 🔑 No valid token found, proceeding with validation`);
				}

				// Validate OAuth configuration
				if (tokenValidation?.isValid) {
					// Use existing token for validation
					const oauthConfigResult = await PreFlightValidationServiceV8.validateOAuthConfig({
						specVersion: 'oauth2.0' as const, // Worker tokens use OAuth 2.0
						flowType: 'client-credentials' as const, // Worker tokens use client credentials flow
						credentials: {
							environmentId: environmentId.trim(),
							clientId: clientId.trim(),
							clientSecret: clientSecret.trim(),
							redirectUri: '', // Not needed for worker tokens
							postLogoutRedirectUri: '', // Not needed for worker tokens
							scopes: normalizedScopes.join(' '), // Convert array to string
							responseType: '', // Not needed for worker tokens
							clientAuthMethod: authMethod,
						},
						workerToken: tokenValidation.token,
					});

					if (!oauthConfigResult.passed) {
						// Check if this is an OIDC scope error and provide helpful guidance
						// But allow 'openid' scope for worker tokens
						const errorString = oauthConfigResult.errors.join('; ');
						if (
							errorString.includes('Invalid OIDC Scopes') &&
							!errorString.includes('profile') &&
							!errorString.includes('email') &&
							!errorString.includes('address') &&
							!errorString.includes('phone')
						) {
							// If only 'openid' is mentioned, it might be a false positive for worker tokens
							console.warn(
								`${MODULE_TAG} Possible false positive OIDC scope validation for worker token`
							);
						}

						// Show other validation errors
						throw new Error(`Pre-flight validation failed: ${errorString}`);
					}

					// Show warnings if any
					if (oauthConfigResult.warnings.length > 0) {
						const warningMessage = oauthConfigResult.warnings.join('; ');
						toastV8.warning(`Pre-flight warnings: ${warningMessage}`);
					}
				}

				// Determine the correct domain based on region
				const domain = (() => {
					const regionDomains = {
						us: 'auth.pingone.com',
						eu: 'auth.pingone.eu',
						ap: 'auth.pingone.asia',
						ca: 'auth.pingone.ca',
					};
					return regionDomains[region];
				})();
				const tokenEndpoint = `https://${domain}/${environmentId.trim()}/as/token`;

				const params = new URLSearchParams({
					grant_type: 'client_credentials',
					client_id: clientId.trim(),
					scope: normalizedScopes.join(' '),
				});

				const headers: Record<string, string> = {
					'Content-Type': 'application/x-www-form-urlencoded',
				};

				console.log(`${MODULE_TAG} 🔍 Debug - Auth method:`, authMethod);
				console.log(`${MODULE_TAG} 🔍 Debug - Client ID:`, clientId.trim());

				if (authMethod === 'client_secret_post') {
					params.set('client_secret', clientSecret.trim());
					console.log(`${MODULE_TAG} 🔍 Using client_secret_post method`);
				} else if (authMethod === 'client_secret_basic') {
					const basicAuth = btoa(`${clientId.trim()}:${clientSecret.trim()}`);
					headers.Authorization = `Basic ${basicAuth}`;
					console.log(`${MODULE_TAG} 🔍 Using client_secret_basic method`);
				} else {
					console.warn(`${MODULE_TAG} ⚠️ Unknown auth method:`, authMethod);
				}

				const details = {
					tokenEndpoint,
					requestParams: {
						grant_type: 'client_credentials',
						client_id: clientId.trim(),
						client_secret: clientSecret.trim(),
						scope: normalizedScopes.join(' '),
					},
					authMethod,
					region,
					resolvedHeaders: headers,
					resolvedBody: params.toString(),
				};

				setRequestDetails(details);
				setShowRequestModal(true);
			},
			{
				onSuccess: () => {
					// Success handled in main function
				},
				onError: (error) => {
					console.error(`${MODULE_TAG} Pre-flight validation error:`, error);

					// Enhanced error handling for token-related issues
					let errorMessage = 'Pre-flight validation failed';
					let _showWorkerTokenButton = false;

					if (error instanceof Error) {
						const errorStr = error.message.toLowerCase();

						// Check for 401 Unauthorized or token-related errors
						if (
							errorStr.includes('401') ||
							errorStr.includes('unauthorized') ||
							errorStr.includes('invalid token') ||
							errorStr.includes('expired token') ||
							errorStr.includes('token required') ||
							errorStr.includes('worker token')
						) {
							errorMessage =
								'Worker token is invalid or expired. Please generate a new worker token.';
							_showWorkerTokenButton = true;
						} else if (errorStr.includes('unsupported authentication method')) {
							errorMessage =
								'Your PingOne Worker application authentication method doesn\'t match. Please check your Worker app settings in PingOne and ensure the "Token Endpoint Authentication Method" matches the selected method.';
							_showWorkerTokenButton = true;
						} else {
							errorMessage = error.message;
						}
					}

					// Show error with appropriate recovery options
					toastV8.error(errorMessage, { duration: 8000 });
				},
			}
		);
		} catch (error) {
			console.error(`${MODULE_TAG} Unexpected error in handleGenerate:`, error);
			toastV8.error('An unexpected error occurred. Please try again.');
		}
	};

	const handleExecuteRequest = async (): Promise<string | null> => {
		if (!requestDetails) return null;

		setIsGenerating(true);
		try {
			const scopeList = requestDetails.requestParams.scope
				.split(/\s+/)
				.map((scope) => scope.trim())
				.filter(Boolean);

			// First, save credentials to unifiedWorkerTokenService
			await unifiedWorkerTokenService.saveCredentials({
				environmentId: environmentId.trim(),
				clientId: clientId.trim(),
				clientSecret: clientSecret.trim(),
				scopes: scopeList,
				region,
				customDomain: customDomain.trim() || undefined,
				tokenEndpointAuthMethod: authMethod,
			});

			// Track the API call
			const startTime = Date.now();
			console.log(`${MODULE_TAG} 🚀 Making token request:`, {
				tokenEndpoint: requestDetails.tokenEndpoint,
				authMethod: requestDetails.authMethod,
				hasClientSecret: !!requestDetails.requestParams.client_secret,
				clientIdLength: requestDetails.requestParams.client_id?.length,
				clientSecretLength: requestDetails.requestParams.client_secret?.length,
				headers: requestDetails.resolvedHeaders,
				body: requestDetails.resolvedBody,
			});

			const callId = apiCallTrackerService.trackApiCall({
				method: 'POST',
				url: requestDetails.tokenEndpoint,
				headers: requestDetails.resolvedHeaders,
				body: requestDetails.resolvedBody,
				step: 'worker-token-request',
				flowType: 'worker-token',
				source: 'frontend',
				isProxy: false,
			});

			const response = await pingOneFetch(requestDetails.tokenEndpoint, {
				method: 'POST',
				headers: requestDetails.resolvedHeaders,
				body: requestDetails.resolvedBody,
			});

			console.log(`${MODULE_TAG} 📡 Token response:`, {
				status: response.status,
				statusText: response.statusText,
				ok: response.ok,
				headers: Object.fromEntries(response.headers.entries()),
			});

			let responseData: unknown;
			try {
				responseData = await response.json();
				console.log(`${MODULE_TAG} 📄 Response data:`, responseData);
			} catch {
				const raw = await response.text();
				responseData = raw ? { raw } : null;
				console.log(`${MODULE_TAG} 📄 Raw response:`, raw);
			}

			// Update API call tracking
			apiCallTrackerService.updateApiCallResponse(
				callId,
				{
					status: response.status,
					statusText: response.statusText,
					data: responseData ?? undefined,
				},
				Date.now() - startTime
			);

			if (!response.ok) {
				const errorJson = responseData as { error_description?: string; error?: string } | null;
				let errorMessage = `Token generation failed (HTTP ${response.status})`;
				if (errorJson) {
					errorMessage = errorJson.error_description || errorJson.error || errorMessage;
				}

				if (/client authentication failed/i.test(errorMessage)) {
					errorMessage +=
						'. Verify the client secret and make sure the token endpoint authentication method matches your PingOne app (try switching between Client Secret Post and Client Secret Basic).';
				} else if (/unsupported_grant_type/i.test(errorMessage)) {
					errorMessage += '. Double-check that the Worker app allows the client_credentials grant.';
				} else if (/unsupported authentication method/i.test(errorMessage)) {
					errorMessage +=
						'. Your PingOne Worker application is configured with a different authentication method. Please go to your PingOne Worker app settings and ensure the "Token Endpoint Authentication Method" matches the selected method (Client Secret Basic or Client Secret Post).';
				}

				throw new Error(errorMessage);
			}

			const data = responseData as { access_token?: string; expires_in?: number };
			const token = data.access_token;
			if (!token) {
				throw new Error('No access token received in response');
			}

			// Now store token using unifiedWorkerTokenService (credentials are already saved)
			const expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : undefined;
			await unifiedWorkerTokenService.saveToken(token, expiresAt);

			// Save to global environment service
			const options: { region: 'us' | 'eu' | 'ap' | 'ca'; customDomain?: string } = {
				region: region as 'us' | 'eu' | 'ap' | 'ca',
			};
			if (customDomain?.trim()) {
				options.customDomain = customDomain.trim();
			}
			environmentService.setEnvironmentId(environmentId.trim(), options);

			// Also save credentials to MFA flow for MFA Hub compatibility
			try {
				const { CredentialsServiceV8 } = await import('@/v8/services/credentialsServiceV8');
				const stored = CredentialsServiceV8.loadCredentials('mfa-flow-v8', {
					flowKey: 'mfa-flow-v8',
					flowType: 'oidc',
					includeClientSecret: false,
					includeRedirectUri: false,
					includeLogoutUri: false,
					includeScopes: false,
				});
				CredentialsServiceV8.saveCredentials('mfa-flow-v8', {
					...stored,
					environmentId: environmentId.trim(),
					username: stored.username || '',
				});
			} catch (credError) {
				console.warn('[WorkerTokenModalV8] Failed to save credentials to MFA flow:', credError);
			}

			// Cache the token for future preflight validation
			const tokenScopes = scopeInput
				.split(/\s+/)
				.map((scope) => scope.trim())
				.filter(Boolean);
			await workerTokenCacheServiceV8.updateCacheOnTokenGeneration(
				environmentId.trim(),
				clientId.trim(),
				tokenScopes
			);

			// Wait a moment to ensure token is fully saved before dispatching event
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Dispatch event for status update
			console.log(`${MODULE_TAG} 🔑 Dispatching workerTokenUpdated event`);
			window.dispatchEvent(new Event('workerTokenUpdated'));
			console.log(`${MODULE_TAG} 🔑 workerTokenUpdated event dispatched`);

			toastV8.success('Worker token generated successfully!');

			onTokenGenerated?.(token);

			// Check if we should show token at end
			const { MFAConfigurationServiceV8 } = await import('@/v8/services/mfaConfigurationServiceV8');
			const config = MFAConfigurationServiceV8.loadConfiguration();
			if (!config.workerToken.showTokenAtEnd) {
				setShowRequestModal(false);
				onClose();
			}

			return token;
		} catch (error) {
			console.error(`${MODULE_TAG} Token generation error`, error);

			// Enhanced error handling for token generation
			let errorMessage = 'Failed to generate token';

			if (error instanceof Error) {
				const errorStr = error.message.toLowerCase();

				// Check for 401 Unauthorized or token-related errors
				if (
					errorStr.includes('401') ||
					errorStr.includes('unauthorized') ||
					errorStr.includes('invalid token') ||
					errorStr.includes('expired token') ||
					errorStr.includes('token required') ||
					errorStr.includes('worker token')
				) {
					errorMessage =
						'Worker token is invalid or expired. Please check your credentials and try again.';
				} else if (errorStr.includes('400') || errorStr.includes('bad request')) {
					errorMessage = 'Invalid request. Please check your environment ID and credentials.';
				} else if (errorStr.includes('403') || errorStr.includes('forbidden')) {
					errorMessage = 'Access forbidden. Please check your permissions and credentials.';
				} else if (errorStr.includes('network') || errorStr.includes('fetch')) {
					errorMessage = 'Network error. Please check your connection and try again.';
				} else {
					errorMessage = error.message;
				}
			}

			toastV8.error(errorMessage, { duration: 8000 });
			return null;
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<>
			{/* Modal Spinners for Worker Token Operations */}
			<StandardModalSpinner
				show={generateSpinner.isLoading}
				message="Generating worker token..."
				theme="blue"
			/>
			<StandardModalSpinner
				show={validateSpinner.isLoading}
				message="Validating configuration..."
				theme="orange"
			/>
			<StandardModalSpinner
				show={executeSpinner.isLoading}
				message="Executing token request..."
				theme="purple"
			/>
			<StandardModalSpinner
				show={importSpinner.isLoading}
				message="Importing credentials..."
				theme="green"
			/>
			<StandardModalSpinner
				show={exportSpinner.isLoading}
				message="Exporting credentials..."
				theme="blue"
			/>

			{/* Backdrop */}
			<button
				type="button"
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0, 0, 0, 0.5)',
					zIndex: 999,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					border: 'none',
					cursor: 'pointer',
				}}
				onClick={onClose}
				onKeyUp={(e) => e.key === 'Enter' && onClose()}
				onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
				aria-label="Close modal"
			/>

			{/* Modal */}
			<div
				className="worker-token-modal-v8"
				style={{
					position: 'fixed',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					background: 'white',
					borderRadius: '8px',
					boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
					zIndex: 1000,
					maxWidth: '500px',
					width: '90%',
					maxHeight: '80vh',
					overflow: 'auto',
				}}
				onClick={(e) => e.stopPropagation()}
				onKeyUp={(e) => e.key === 'Escape' && onClose()}
				onKeyDown={(e) => e.key === 'Escape' && e.preventDefault()}
				role="dialog"
				tabIndex={-1}
				aria-modal="true"
				aria-labelledby="modal-title"
			>
				<style>{`
					.worker-token-modal-v8 input[type="text"],
					.worker-token-modal-v8 input[type="password"],
					.worker-token-modal-v8 select {
						box-sizing: border-box !important;
					}
					.worker-token-modal-v8 input[type="text"],
					.worker-token-modal-v8 input[type="password"] {
						overflow: hidden;
						text-overflow: ellipsis;
						white-space: nowrap;
					}
				`}</style>
				{/* Header */}
				<div
					style={{
						background: 'linear-gradient(to right, #fef3c7 0%, #fde68a 100%)',
						padding: '20px 24px',
						borderBottom: '1px solid #fcd34d',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
							<div>
								<h2
									style={{
										margin: '0 0 4px 0',
										fontSize: '18px',
										fontWeight: '700',
										color: '#92400e',
									}}
								>
									🔑 Worker Token Credentials
								</h2>
								<p style={{ margin: 0, fontSize: '13px', color: '#78350f' }}>
									Generate a worker token for API access
								</p>
							</div>
						</div>
						<button
							type="button"
							onClick={onClose}
							style={{
								background: 'none',
								border: 'none',
								fontSize: '24px',
								cursor: 'pointer',
								color: '#92400e',
								padding: '4px 8px',
							}}
							aria-label="Close modal"
						>
							×
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="end-user-nano" style={{ padding: '24px' }}>
					{/* Token Only Mode - Show only token display, skip credential form */}
					{showTokenOnly ? (
						<div>
							{currentToken ? (
								<div
									style={{
										padding: '16px',
										background: '#d1fae5',
										borderRadius: '6px',
										border: '1px solid #10b981',
										marginBottom: '20px',
									}}
								>
									<div
										style={{
											marginBottom: '12px',
											fontSize: '16px',
											fontWeight: '600',
											color: '#065f46',
										}}
									>
										✅ Worker Token
									</div>
									<div style={{ marginBottom: '16px' }}>
										{UnifiedTokenDisplayService.showTokens(
											{ access_token: currentToken },
											'oauth',
											'worker-token-current-v8',
											{
												showCopyButtons: true,
												showDecodeButtons: true,
											}
										)}
									</div>
									<div style={{ display: 'flex', gap: '8px' }}>
										<button
											type="button"
											onClick={async () => {
												if (currentToken) {
													try {
														await unifiedWorkerTokenService.saveToken(currentToken);
														toastV8.success('Token saved successfully!');
													} catch (error) {
														console.error(`${MODULE_TAG} Failed to save token:`, error);
														toastV8.error('Failed to save token');
													}
												}
											}}
											style={{
												flex: 1,
												padding: '10px 20px',
												background: '#3b82f6',
												color: 'white',
												border: 'none',
												borderRadius: '4px',
												fontSize: '14px',
												fontWeight: '600',
												cursor: 'pointer',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												gap: '6px',
											}}
										>
											💾 Save Token
										</button>
										<button
											type="button"
											onClick={onClose}
											style={{
												flex: 1,
												padding: '10px 20px',
												background: '#10b981',
												color: 'white',
												border: 'none',
												borderRadius: '4px',
												fontSize: '14px',
												fontWeight: '600',
												cursor: 'pointer',
											}}
										>
											Close
										</button>
									</div>
								</div>
							) : (
								<div
									style={{
										padding: '16px',
										textAlign: 'center',
										color: '#6b7280',
									}}
								>
									Loading token...
								</div>
							)}
						</div>
					) : (
						<>
							{/* Current Token Display (when not in token-only mode) */}
							{showTokenDisplay && currentToken && (
								<div
									style={{
										padding: '16px',
										background: '#d1fae5',
										borderRadius: '6px',
										border: '1px solid #10b981',
										marginBottom: '20px',
									}}
								>
									<div
										style={{
											marginBottom: '12px',
											fontSize: '14px',
											fontWeight: '600',
											color: '#065f46',
										}}
									>
										✅ Current Worker Token
									</div>
									<div style={{ marginBottom: '12px' }}>
										{UnifiedTokenDisplayService.showTokens(
											{ access_token: currentToken },
											'oauth',
											'worker-token-current-v8',
											true
										)}
									</div>

									{/* KRP Status Display */}
									{krpCompliance && (
										<div
											style={{
												padding: '12px',
												background: krpCompliance.compliant ? '#dbeafe' : '#fef3c7',
												borderRadius: '4px',
												border: `1px solid ${krpCompliance.compliant ? '#3b82f6' : '#f59e0b'}`,
												marginBottom: '12px',
												fontSize: '13px',
											}}
										>
											<div
												style={{
													fontWeight: '600',
													marginBottom: '4px',
													color: krpCompliance.compliant ? '#1e40af' : '#92400e',
												}}
											>
												🔑 Key Rotation Policy (KRP)
											</div>
											{krpCompliance.compliant ? (
												<div style={{ color: '#1e40af' }}>✅ Compliant - Application uses KRP</div>
											) : (
												<div>
													<div style={{ color: '#92400e', marginBottom: '4px' }}>
														{krpCompliance.warning}
													</div>
													<div style={{ color: '#92400e', fontSize: '12px' }}>
														{krpCompliance.recommendation}
													</div>
												</div>
											)}
										</div>
									)}

									<div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
										<button
											type="button"
											onClick={() => {
												navigator.clipboard.writeText(currentToken);
												toastV8.success('Worker token copied to clipboard!');
											}}
											style={{
												padding: '6px 12px',
												background: '#3b82f6',
												color: 'white',
												border: 'none',
												borderRadius: '4px',
												fontSize: '14px',
												fontWeight: '600',
												cursor: 'pointer',
											}}
										>
											Copy Token
										</button>
										<button
											type="button"
											onClick={() => setShowTokenDisplay(false)}
											style={{
												padding: '6px 12px',
												background: '#10b981',
												color: 'white',
												border: 'none',
												borderRadius: '4px',
												fontSize: '14px',
												fontWeight: '600',
												cursor: 'pointer',
											}}
										>
											Close
										</button>
									</div>
								</div>
							)}

							{/* Info Box and Form - Only show if not in token-only mode */}
							{!showTokenOnly && (
								<>
									{/* Info Box */}
									<div
										style={{
											padding: '12px',
											background: '#dbeafe',
											borderRadius: '6px',
											border: '1px solid #93c5fd',
											marginBottom: '16px',
											fontSize: '13px',
											color: '#1e40af',
											lineHeight: '1.5',
										}}
									>
										<div style={{ marginBottom: '8px' }}>
											<strong>ℹ️ What is a Worker Token?</strong>
										</div>
										<div style={{ marginBottom: '8px' }}>
											Worker tokens are used for server-to-server API calls to discover applications
											and access PingOne management APIs.
										</div>
										<div style={{ marginBottom: '8px' }}>
											<strong>Requirements:</strong> A Worker application in PingOne with
											appropriate roles (e.g., "Identity Data Read Only" or "Environment Admin").
										</div>
										<div
											style={{
												marginTop: '8px',
												padding: '8px',
												background: '#fef3c7',
												borderRadius: '4px',
												border: '1px solid #fcd34d',
												color: '#92400e',
											}}
										>
											<strong>⏰ Token Validity:</strong> Worker tokens are valid for{' '}
											<strong>1 hour</strong> after generation. You will need to generate a new
											token after it expires.
										</div>
										{(() => {
											try {
												const config = MFAConfigurationServiceV8.loadConfiguration();
												const autoRenewal = config.workerToken.autoRenewal;
												const renewalThreshold = config.workerToken.renewalThreshold;

												return (
													<div
														style={{
															marginTop: '8px',
															padding: '8px',
															background: autoRenewal ? '#d1fae5' : '#fee2e2',
															borderRadius: '4px',
															border: `1px solid ${autoRenewal ? '#86efac' : '#fca5a5'}`,
															color: autoRenewal ? '#065f46' : '#991b1b',
														}}
													>
														<strong>🔄 Auto-Renewal:</strong>{' '}
														{autoRenewal ? (
															<>
																<strong>Enabled</strong> - Tokens will automatically renew{' '}
																{renewalThreshold} seconds before expiry during MFA flows.
															</>
														) : (
															<>
																<strong>Disabled</strong> - You will need to manually generate new
																tokens when they expire.
															</>
														)}{' '}
														<a
															href="/v8/mfa-config"
															onClick={(e) => {
																e.preventDefault();
																window.location.href = '/v8/mfa-config';
															}}
															style={{
																color: 'inherit',
																textDecoration: 'underline',
																fontWeight: '600',
															}}
														>
															Configure in MFA Settings
														</a>
													</div>
												);
											} catch {
												return null;
											}
										})()}
										<div
											style={{
												marginTop: '8px',
												padding: '8px',
												background: '#fff7ed',
												borderRadius: '4px',
												border: '1px solid #fdba74',
												color: '#9a3412',
											}}
										>
											<strong>✅ Recommended MFA scopes:</strong>
											<div style={{ marginTop: '6px', fontFamily: 'monospace', fontSize: '12px' }}>
												{PINGONE_WORKER_MFA_SCOPE_STRING}
											</div>
											<p style={{ marginTop: '6px', fontSize: '12px' }}>
												You can adjust the scope list below to match your PingOne Worker
												application.
											</p>
										</div>
									</div>

									{/* How to Get Credentials */}
									<div
										style={{
											padding: '12px',
											background: '#f0fdf4',
											borderRadius: '6px',
											border: '1px solid #86efac',
											marginBottom: '20px',
											fontSize: '12px',
											color: '#166534',
											lineHeight: '1.5',
										}}
									>
										<div style={{ marginBottom: '6px', fontWeight: '600' }}>
											📝 How to get these credentials:
										</div>
										<ol style={{ margin: '0', paddingLeft: '20px' }}>
											<li>Go to PingOne Console → Connections → Applications</li>
											<li>Create or select a Worker application</li>
											<li>Copy the Environment ID, Client ID, and Client Secret</li>
											<li>Ensure the app has required roles assigned</li>
											<li>
												Set <strong>Token Endpoint Auth Method</strong> to match your Worker app. If
												you see “client authentication failed”, try switching between{' '}
												<em>Client Secret Post</em> and <em>Client Secret Basic</em>.
											</li>
										</ol>
									</div>

									{/* Form Fields */}
									<form
										onSubmit={(e) => {
											e.preventDefault();
											handleGenerate();
										}}
										style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
									>
										{/* Environment ID */}
										<div>
											<label
												htmlFor="environmentId"
												style={{
													display: 'block',
													fontWeight: '600',
													fontSize: '13px',
													color: '#374151',
													marginBottom: '6px',
												}}
											>
												Environment ID <span style={{ color: '#ef4444' }}>*</span>
											</label>
											<input
												id="environmentId"
												type="text"
												value={environmentId}
												onChange={(e) => setEnvironmentId(e.target.value)}
												placeholder="12345678-1234-1234-1234-123456789012"
												style={{
													width: '100%',
													padding: '10px 12px',
													border: '1px solid #d1d5db',
													borderRadius: '4px',
													fontSize: '14px',
													fontFamily: 'monospace',
												}}
											/>
										</div>

										{/* Client ID */}
										<div>
											<label
												htmlFor="clientId"
												style={{
													display: 'block',
													fontWeight: '600',
													fontSize: '13px',
													color: '#374151',
													marginBottom: '6px',
												}}
											>
												Client ID <span style={{ color: '#ef4444' }}>*</span>
											</label>
											<input
												id="clientId"
												type="text"
												value={clientId}
												onChange={(e) => setClientId(e.target.value)}
												placeholder="abc123def456..."
												style={{
													width: '100%',
													padding: '10px 12px',
													border: '1px solid #d1d5db',
													borderRadius: '4px',
													fontSize: '14px',
													fontFamily: 'monospace',
												}}
											/>
										</div>

										{/* Client Secret */}
										<div>
											<label
												htmlFor="clientSecret"
												style={{
													display: 'block',
													fontWeight: '600',
													fontSize: '13px',
													color: '#374151',
													marginBottom: '6px',
												}}
											>
												Client Secret <span style={{ color: '#ef4444' }}>*</span>
											</label>
											<div style={{ position: 'relative' }}>
												<input
													id="clientSecret"
													type={showSecret ? 'text' : 'password'}
													value={clientSecret}
													onChange={(e) => setClientSecret(e.target.value)}
													placeholder="••••••••••••••••"
													autoComplete="current-password"
													style={{
														width: '100%',
														padding: '10px 12px',
														paddingRight: '40px',
														border: '1px solid #d1d5db',
														borderRadius: '4px',
														fontSize: '14px',
														fontFamily: 'monospace',
													}}
												/>
												<button
													type="button"
													onClick={() => setShowSecret(!showSecret)}
													style={{
														position: 'absolute',
														right: '8px',
														top: '50%',
														transform: 'translateY(-50%)',
														background: 'none',
														border: 'none',
														cursor: 'pointer',
														color: '#6b7280',
														fontSize: '18px',
													}}
												>
													{showSecret ? '👁️' : '👁️‍🗨️'}
												</button>
											</div>
										</div>

										{/* Scopes */}
										<div>
											<label
												htmlFor="scopes"
												style={{
													display: 'block',
													fontWeight: '600',
													fontSize: '13px',
													color: '#374151',
													marginBottom: '6px',
												}}
											>
												Scopes <span style={{ color: '#ef4444' }}>*</span>
											</label>
											<textarea
												id="scopes"
												value={scopeInput}
												onChange={(e) => setScopeInput(e.target.value)}
												rows={3}
												style={{
													width: '100%',
													padding: '10px 12px',
													border: '1px solid #d1d5db',
													borderRadius: '4px',
													fontSize: '13px',
													fontFamily: 'monospace',
													resize: 'vertical',
												}}
											/>
											<small
												style={{
													display: 'block',
													marginTop: '4px',
													color: '#6b7280',
													fontSize: '12px',
												}}
											>
												Space-separated list. Leave empty for default scopes.
											</small>
										</div>

										{/* Region */}
										<div>
											<label
												htmlFor="region"
												style={{
													display: 'block',
													fontWeight: '600',
													fontSize: '13px',
													color: '#374151',
													marginBottom: '6px',
												}}
											>
												Region
											</label>
											<select
												id="region"
												value={region}
												onChange={(e) => setRegion(e.target.value as 'us' | 'eu' | 'ap' | 'ca')}
												style={{
													width: '100%',
													padding: '10px 12px',
													border: '1px solid #d1d5db',
													borderRadius: '4px',
													fontSize: '14px',
												}}
											>
												<option value="us">North America (US)</option>
												<option value="eu">Europe (EU)</option>
												<option value="ap">Asia Pacific (AP)</option>
												<option value="ca">Canada (CA)</option>
											</select>
										</div>

										{/* Custom Domain */}
										<div>
											<label
												htmlFor="customDomain"
												style={{
													display: 'block',
													fontWeight: '600',
													fontSize: '13px',
													color: '#374151',
													marginBottom: '6px',
												}}
											>
												Custom Domain (Optional)
											</label>
											<input
												id="customDomain"
												type="text"
												value={customDomain}
												onChange={(e) => setCustomDomain(e.target.value)}
												placeholder="auth.yourcompany.com"
												style={{
													width: '100%',
													padding: '10px 12px',
													border: '1px solid #d1d5db',
													borderRadius: '4px',
													fontSize: '14px',
												}}
											/>
											<small
												style={{
													display: 'block',
													marginTop: '4px',
													color: '#6b7280',
													fontSize: '12px',
												}}
											>
												Your custom PingOne domain (e.g., auth.yourcompany.com). If set, this
												overrides the region-based domain. Leave empty to use the default region
												domain.
											</small>
										</div>

										{/* Token Endpoint Authentication */}
										<div>
											<label
												htmlFor="authMethod"
												style={{
													display: 'block',
													fontWeight: '600',
													fontSize: '13px',
													color: '#374151',
													marginBottom: '6px',
												}}
											>
												Token Endpoint Authentication
											</label>
											<select
												id="authMethod"
												value={authMethod}
												onChange={(e) => setAuthMethod(e.target.value as AuthMethodV8)}
												style={{
													width: '100%',
													padding: '10px 12px',
													border: '1px solid #d1d5db',
													borderRadius: '4px',
													fontSize: '14px',
												}}
											>
												{AuthMethodServiceV8.getAvailableMethodsForFlow('client-credentials').map(
													(method) => (
														<option key={method} value={method}>
															{AuthMethodServiceV8.getDisplayLabel(method)}
														</option>
													)
												)}
											</select>
											<div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
												{AuthMethodServiceV8.getMethodConfig(authMethod).description}
											</div>
										</div>
									</form>

									{/* Save Credentials Checkbox */}
									<div
										style={{
											marginTop: '16px',
											padding: '12px',
											background: '#f9fafb',
											borderRadius: '6px',
											border: '1px solid #e5e7eb',
										}}
									>
										<label
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												cursor: 'pointer',
											}}
										>
											<input
												type="checkbox"
												checked={saveCredentials}
												onChange={(e) => setSaveCredentials(e.target.checked)}
												style={{ cursor: 'pointer' }}
											/>
											<span style={{ fontSize: '13px', color: '#374151' }}>
												💾 Save credentials for next time
											</span>
										</label>
										<small
											style={{
												display: 'block',
												marginTop: '4px',
												marginLeft: '24px',
												fontSize: '11px',
												color: '#6b7280',
											}}
										>
											Credentials are stored securely in your browser's local storage
										</small>
									</div>

									{/* Actions */}
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '12px',
											marginTop: '20px',
										}}
									>
										{/* Export/Import buttons */}
										<div style={{ display: 'flex', gap: '8px' }}>
											<button
												type="button"
												onClick={() => {
													try {
														if (!environmentId.trim() || !clientId.trim() || !clientSecret.trim()) {
															toastV8.error('Please fill in all required fields before exporting');
															return;
														}

														const normalizedScopes = scopeInput
															.split(/\s+/)
															.map((scope) => scope.trim())
															.filter(Boolean);

														const credentials: WorkerTokenCredentials = {
															environmentId: environmentId.trim(),
															clientId: clientId.trim(),
															clientSecret: clientSecret.trim(),
															scopes:
																normalizedScopes.length > 0
																	? normalizedScopes
																	: [PINGONE_WORKER_MFA_SCOPE_STRING],
															region,
															customDomain: customDomain.trim() || undefined,
															authMethod:
																authMethod === 'client_secret_basic' ||
																authMethod === 'client_secret_post'
																	? authMethod
																	: 'client_secret_basic',
														};

														exportWorkerTokenCredentials(credentials);
														toastV8.success('Worker token credentials exported successfully!');
													} catch (error) {
														console.error(`${MODULE_TAG} Export error:`, error);
														toastV8.error(
															error instanceof Error
																? error.message
																: 'Failed to export credentials'
														);
													}
												}}
												disabled={isGenerating}
												style={{
													flex: 1,
													padding: '8px 12px',
													background: 'white',
													color: '#3b82f6',
													border: '1px solid #3b82f6',
													borderRadius: '4px',
													fontSize: '13px',
													fontWeight: '500',
													cursor: isGenerating ? 'not-allowed' : 'pointer',
													opacity: isGenerating ? 0.65 : 1,
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													gap: '6px',
												}}
												title="Export credentials to JSON file"
											>
												<FiDownload size={14} />
												Export
											</button>
											<button
												type="button"
												onClick={() => {
													triggerFileImport(async (file) => {
														try {
															const imported = await importCredentials(file);

															if (imported.workerToken) {
																const wt = imported.workerToken;
																setEnvironmentId(wt.environmentId || environmentId);
																setClientId(wt.clientId || clientId);
																setClientSecret(wt.clientSecret || clientSecret);
																setScopeInput(
																	Array.isArray(wt.scopes) && wt.scopes.length > 0
																		? wt.scopes.join(' ')
																		: scopeInput
																);
																setRegion('us'); // Always default to 'us' (.com)
																setCustomDomain(wt.customDomain || '');
																if (
																	wt.authMethod &&
																	(wt.authMethod === 'client_secret_basic' ||
																		wt.authMethod === 'client_secret_post')
																) {
																	setAuthMethod(wt.authMethod);
																}
																// Also set tokenEndpointAuthMethod for consistency
																if (wt.authMethod) {
																	// Update the credentials object to include tokenEndpointAuthMethod
																	const updatedCreds = {
																		environmentId: wt.environmentId || '',
																		clientId: wt.clientId || '',
																		clientSecret: wt.clientSecret || '',
																		scopes: wt.scopes || [],
																		region: wt.region || 'us',
																		customDomain: wt.customDomain || '',
																		tokenEndpointAuthMethod: wt.authMethod,
																	};
																	// Save with correct field name
																	await unifiedWorkerTokenService.saveCredentials(updatedCreds);
																}

																toastV8.success('Worker token credentials imported successfully!');
															} else {
																toastV8.error(
																	'The selected file does not contain worker token credentials'
																);
															}
														} catch (error) {
															console.error(`${MODULE_TAG} Import error:`, error);
															toastV8.error(
																error instanceof Error
																	? error.message
																	: 'Failed to import credentials'
															);
														}
													});
												}}
												disabled={isGenerating}
												style={{
													flex: 1,
													padding: '8px 12px',
													background: 'white',
													color: '#10b981',
													border: '1px solid #10b981',
													borderRadius: '4px',
													fontSize: '13px',
													fontWeight: '500',
													cursor: isGenerating ? 'not-allowed' : 'pointer',
													opacity: isGenerating ? 0.65 : 1,
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													gap: '6px',
												}}
												title="Import credentials from JSON file"
											>
												<FiUpload size={14} />
												Import
											</button>
										</div>

										{/* Loading Message */}
										{loadingMessage && (
											<div
												style={{
													marginTop: '12px',
													padding: '8px 12px',
													background: '#f0f9ff',
													border: '1px solid #3b82f6',
													borderRadius: '4px',
													fontSize: '13px',
													color: '#1e40af',
													textAlign: 'center',
												}}
											>
												{loadingMessage}
											</div>
										)}

										{/* Main action buttons */}
										<div style={{ display: 'flex', gap: '8px' }}>
											<button type="button" className="btn btn-light-grey" onClick={onClose}>
												<i className="mdi-close me-2"></i>
												Cancel
											</button>
											<button
												type="button"
												className="btn btn-success"
												onClick={handleSaveCredentials}
												disabled={isGenerating}
												title="Save credentials without generating token"
											>
												<i className="mdi-content-save me-2"></i>
												Save Credentials
											</button>
											<button
												type="button"
												className={`btn ${isGenerating ? 'btn-secondary' : 'btn-primary'}`}
												onClick={handleGenerate}
												disabled={isGenerating}
											>
												{isGenerating ? (
													<>
														<i className="mdi-loading mdi-spin me-2"></i>
														Generating...
													</>
												) : (
													<>
														<i className="mdi-key me-2"></i>
														Generate Token
													</>
												)}
											</button>
										</div>
									</div>
								</>
							)}
						</>
					)}
				</div>
			</div>

			{/* Request Modal */}
			{showRequestModal && requestDetails && (
				<WorkerTokenRequestModalV8
					isOpen={showRequestModal}
					onClose={() => {
						setShowRequestModal(false);
						onClose(); // Always close main modal when request modal closes
					}}
					onExecute={handleExecuteRequest}
					requestDetails={requestDetails}
					isExecuting={isGenerating}
					setIsExecuting={setIsGenerating}
					showTokenAtEnd={(() => {
						try {
							const config = MFAConfigurationServiceV8.loadConfiguration();
							return config.workerToken.showTokenAtEnd;
						} catch {
							return true; // Default to true if config can't be loaded
						}
					})()}
				/>
			)}
		</>
	);
};

export { WorkerTokenModalV8 };
export default WorkerTokenModalV8;
