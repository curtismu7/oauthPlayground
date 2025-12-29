/**
 * @file UserLoginModalV8.tsx
 * @module v8/components
 * @description User login modal for obtaining access token via Authorization Code Flow
 * @version 8.4.0
 * @since 2025-02-05
 * 
 * This modal allows users to authenticate with PingOne using Authorization Code Flow
 * to obtain an access token that can be used as a "User Token" in MFA flows.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FiEye, FiEyeOff, FiInfo } from 'react-icons/fi';
import { OAuthIntegrationServiceV8 } from '@/v8/services/oauthIntegrationServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { AuthMethodServiceV8, type AuthMethodV8 } from '@/v8/services/authMethodServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { UserAuthenticationSuccessPageV8, type SessionInfo } from './UserAuthenticationSuccessPageV8';

const MODULE_TAG = '[👤 USER-LOGIN-MODAL-V8]';

interface UserLoginModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	onTokenReceived?: (token: string) => void;
	onCredentialsSaved?: () => void;
	environmentId?: string;
}

export const UserLoginModalV8: React.FC<UserLoginModalV8Props> = ({
	isOpen,
	onClose,
	onTokenReceived,
	onCredentialsSaved,
	environmentId: propEnvironmentId = '',
}) => {
	const location = useLocation();
	const [environmentId, setEnvironmentId] = useState(propEnvironmentId);
	const [clientId, setClientId] = useState('');
	const [clientSecret, setClientSecret] = useState('');
	const [redirectUri, setRedirectUri] = useState('');
	// Check if we're in an MFA flow context (for adding p1:create:device scope)
	const isMfaFlow = location.pathname.startsWith('/v8/mfa');
	
	// Default scopes: include p1:create:device for MFA flows
	const defaultScopesForMfa = 'openid profile email p1:create:device';
	const defaultScopesForOther = 'openid profile email';
	const [scopes, setScopes] = useState(isMfaFlow ? defaultScopesForMfa : defaultScopesForOther);
	const [isRedirecting, setIsRedirecting] = useState(false);
	const [showClientSecret, setShowClientSecret] = useState(false);
	const [, setShowConfigModal] = useState(false);
	const [authMethod, setAuthMethod] = useState<AuthMethodV8>('client_secret_post');
	const [isUpdatingApp, setIsUpdatingApp] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [showSuccessPage, setShowSuccessPage] = useState(false);
	const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
	const defaultRedirectUri = 'https://localhost:3000/user-login-callback';
	const previousRedirectUriRef = useRef<string>(defaultRedirectUri);

	// Reset success page state when modal closes
	useEffect(() => {
		if (!isOpen) {
			setShowSuccessPage(false);
			setSessionInfo(null);
		}
	}, [isOpen]);

	// Lock body scroll when modal is open
	useEffect(() => {
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
	useEffect(() => {
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
	useEffect(() => {
		if (isOpen) {
			const FLOW_KEY = 'user-login-v8';
			const saved = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
				flowKey: FLOW_KEY,
				flowType: 'oauth',
				includeClientSecret: true,
				includeRedirectUri: true,
				includeScopes: true,
			});
			
			// Default scopes: include p1:create:device for MFA flows
			const defaultScopes = isMfaFlow 
				? 'openid profile email p1:create:device'
				: 'openid profile email';
			
			if (saved.environmentId || saved.clientId || saved.redirectUri) {
				setEnvironmentId(saved.environmentId || propEnvironmentId);
				setClientId(saved.clientId || '');
				setClientSecret(saved.clientSecret || '');
				setAuthMethod(saved.authMethod || saved.tokenEndpointAuthMethod || 'client_secret_post');
				// Use saved redirect URI or default to hardcoded value
				const savedRedirectUri = saved.redirectUri || defaultRedirectUri;
				// If saved URI is implicit-callback or authz-callback, migrate to default
				const finalRedirectUri = savedRedirectUri.includes('implicit-callback') || savedRedirectUri.includes('authz-callback')
					? defaultRedirectUri 
					: savedRedirectUri;
				setRedirectUri(finalRedirectUri);
				// eslint-disable-next-line require-atomic-updates
				previousRedirectUriRef.current = finalRedirectUri;
				
				// If saved scopes don't include p1:create:device and we're in MFA flow, add it
				const savedScopes = saved.scopes || defaultScopes;
				const finalScopes = isMfaFlow && !savedScopes.includes('p1:create:device')
					? `${savedScopes} p1:create:device`.trim()
					: savedScopes || defaultScopes;
				setScopes(finalScopes);
				
				console.log(`${MODULE_TAG} Loaded saved credentials`, { 
					originalRedirectUri: savedRedirectUri,
					finalRedirectUri,
					isMfaFlow,
					finalScopes,
				});
			} else {
				// Set default redirect URI for User Login Flow (hardcoded)
				setRedirectUri(defaultRedirectUri);
				// eslint-disable-next-line require-atomic-updates
				previousRedirectUriRef.current = defaultRedirectUri;
				// Set default scopes with p1:create:device for MFA flows
				setScopes(defaultScopes);
			}
		}
	}, [isOpen, propEnvironmentId, isMfaFlow]);

	const handleTokenReceived = useCallback((token: string) => {
		console.log(`${MODULE_TAG} Token received, storing and notifying`);
		onTokenReceived?.(token);
		toastV8.success('Access token received successfully!');
		onClose();
	}, [onTokenReceived, onClose]);

	// Track processed codes to prevent duplicate processing (authorization codes are single-use)
	const processedCodesRef = useRef<Set<string>>(new Set());
	const isProcessingRef = useRef<boolean>(false);

	// Check for callback authorization code on mount and when URL changes
	useEffect(() => {
		// Check if we're returning from a callback (check both when modal opens and on URL change)
		const checkCallback = async () => {
			// Prevent concurrent processing
			if (isProcessingRef.current) {
				console.log(`${MODULE_TAG} Already processing a callback, skipping...`);
				return;
			}

			const urlParams = new URLSearchParams(window.location.search);
			const code = urlParams.get('code');
			const error = urlParams.get('error');
			const state = urlParams.get('state');

			// Only process if we have a stored state (confirms this is from our user login flow)
			const storedState = sessionStorage.getItem('user_login_state_v8');
			if (!storedState && code) {
				// Not our callback, ignore it
				return;
			}

			// Validate state if we stored one
			if (storedState && state && storedState !== state) {
				console.warn(`${MODULE_TAG} State mismatch - possible CSRF attack`);
				toastV8.error('Security validation failed. Please try again.');
				window.history.replaceState({}, document.title, window.location.pathname);
				return;
			}

			if (code && storedState) {
			// CRITICAL: Check if this code has already been processed
			// eslint-disable-next-line require-atomic-updates
			if (processedCodesRef.current.has(code)) {
					console.log(`${MODULE_TAG} Authorization code already processed, skipping duplicate attempt`);
					// Clean up URL and session storage
					window.history.replaceState({}, document.title, window.location.pathname);
					sessionStorage.removeItem('user_login_state_v8');
					sessionStorage.removeItem('user_login_code_verifier_v8');
					sessionStorage.removeItem('user_login_credentials_temp_v8');
					sessionStorage.removeItem('user_login_redirect_uri_v8');
					return;
				}

				// Mark as processing
				// eslint-disable-next-line require-atomic-updates
				isProcessingRef.current = true;
				// Mark code as processed immediately to prevent duplicate attempts
				processedCodesRef.current.add(code);
				
				// CRITICAL: Clean up URL immediately to prevent re-processing on re-renders
				window.history.replaceState({}, document.title, window.location.pathname);
				
				console.log(`${MODULE_TAG} Authorization code received from callback`);
				
				// Get stored credentials and PKCE verifier
				const storedCodeVerifier = sessionStorage.getItem('user_login_code_verifier_v8');
				const storedCredentials = sessionStorage.getItem('user_login_credentials_temp_v8');
				
				if (!storedCodeVerifier || !storedCredentials) {
					toastV8.error('Missing PKCE verifier or credentials. Please try logging in again.');
					sessionStorage.removeItem('user_login_state_v8');
					sessionStorage.removeItem('user_login_code_verifier_v8');
					sessionStorage.removeItem('user_login_credentials_temp_v8');
					sessionStorage.removeItem('user_login_redirect_uri_v8');
					isProcessingRef.current = false;
					return;
				}

				try {
					const credentials = JSON.parse(storedCredentials);
					
					// Exchange authorization code for tokens
					const tokenResponse = await OAuthIntegrationServiceV8.exchangeCodeForTokens(
						{
							environmentId: credentials.environmentId,
							clientId: credentials.clientId,
							clientSecret: credentials.clientSecret,
							redirectUri: credentials.redirectUri,
							scopes: credentials.scopes,
							clientAuthMethod: credentials.clientAuthMethod || credentials.tokenEndpointAuthMethod || 'client_secret_post',
						},
						code,
						storedCodeVerifier
					);

					// Clean up session storage
					sessionStorage.removeItem('user_login_state_v8');
					sessionStorage.removeItem('user_login_code_verifier_v8');
					sessionStorage.removeItem('user_login_credentials_temp_v8');
					sessionStorage.removeItem('user_login_redirect_uri_v8');
					
					// Store session info for success page
					setSessionInfo({
						accessToken: tokenResponse.access_token,
						idToken: tokenResponse.id_token || undefined,
						tokenType: tokenResponse.token_type || 'Bearer',
						expiresIn: tokenResponse.expires_in,
						scope: tokenResponse.scope || undefined, // Granted scopes from token response
						requestedScopes: credentials.scopes || undefined, // Scopes that were requested in authorization URL
						environmentId: credentials.environmentId,
					});
					
					// Show success page
					setShowSuccessPage(true);
					
					// Use access token (callback for parent components)
					handleTokenReceived(tokenResponse.access_token);
				} catch (error) {
					console.error(`${MODULE_TAG} Failed to exchange code for tokens`, error);
					
					// Remove from processed set so user can retry with a new code
					processedCodesRef.current.delete(code);
					
					// Provide more helpful error message for expired/invalid codes
					const errorMessage = error instanceof Error ? error.message : 'Failed to exchange authorization code for tokens';
					if (errorMessage.includes('invalid_grant') || errorMessage.includes('expired')) {
						toastV8.error('Authorization code expired or already used. Please try logging in again.');
					} else {
						toastV8.error(errorMessage);
					}
					
					// Clean up session storage
					sessionStorage.removeItem('user_login_state_v8');
					sessionStorage.removeItem('user_login_code_verifier_v8');
					sessionStorage.removeItem('user_login_credentials_temp_v8');
					sessionStorage.removeItem('user_login_redirect_uri_v8');
				} finally {
					isProcessingRef.current = false;
				}
			} else if (error && storedState) {
				const errorDescription = urlParams.get('error_description') || '';
				toastV8.error(`Login failed: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
				// Clean up session storage
				sessionStorage.removeItem('user_login_state_v8');
				sessionStorage.removeItem('user_login_code_verifier_v8');
				sessionStorage.removeItem('user_login_credentials_temp_v8');
				sessionStorage.removeItem('user_login_redirect_uri_v8');
				// Clean up URL
				window.history.replaceState({}, document.title, window.location.pathname);
			}
		};

		// Only check if we have a code or error in the URL
		const urlParams = new URLSearchParams(window.location.search);
		const hasCode = urlParams.get('code');
		const hasError = urlParams.get('error');
		const hasStoredState = sessionStorage.getItem('user_login_state_v8');
		
		// Only process if we have a code/error AND stored state (to avoid processing other OAuth flows)
		if ((hasCode || hasError) && hasStoredState) {
			checkCallback();
		}

		// Also listen for popstate (when returning from redirect)
		const handlePopState = () => {
			const urlParams = new URLSearchParams(window.location.search);
			const hasCode = urlParams.get('code');
			const hasError = urlParams.get('error');
			const hasStoredState = sessionStorage.getItem('user_login_state_v8');
			
			if ((hasCode || hasError) && hasStoredState) {
				checkCallback();
			}
		};

		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, [handleTokenReceived]);

	// Process callback even when modal is not open (for auto-processing on page load)
	// This ensures callbacks are handled even if the modal wasn't explicitly opened
	useEffect(() => {
		// Only process if modal is not open (when open, the above useEffect handles it)
		if (isOpen) return;
		
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const hasStoredState = sessionStorage.getItem('user_login_state_v8');
		
		// If we have a callback code and stored state, process it even if modal is closed
		// eslint-disable-next-line require-atomic-updates
		if (code && hasStoredState && !isProcessingRef.current) {
				console.log(`${MODULE_TAG} Processing callback even though modal is closed`);
				// The checkCallback logic from above will handle it
				// We just need to trigger it by checking the URL
				const checkCallback = async () => {
					// eslint-disable-next-line require-atomic-updates
					if (isProcessingRef.current) return;
				
				const state = urlParams.get('state');
				const storedState = sessionStorage.getItem('user_login_state_v8');
				
				if (!storedState) return;
				
				if (storedState && state && storedState !== state) {
					console.warn(`${MODULE_TAG} State mismatch - possible CSRF attack`);
					window.history.replaceState({}, document.title, window.location.pathname);
					return;
				}
				
				if (code && storedState) {
					if (processedCodesRef.current.has(code)) {
						window.history.replaceState({}, document.title, window.location.pathname);
						return;
					}
					
					// eslint-disable-next-line require-atomic-updates
					isProcessingRef.current = true;
					processedCodesRef.current.add(code);
					window.history.replaceState({}, document.title, window.location.pathname);
					
					const storedCodeVerifier = sessionStorage.getItem('user_login_code_verifier_v8');
					const storedCredentials = sessionStorage.getItem('user_login_credentials_temp_v8');
					
					if (!storedCodeVerifier || !storedCredentials) {
						isProcessingRef.current = false;
						return;
					}
					
					try {
						const credentials = JSON.parse(storedCredentials);
						const tokenResponse = await OAuthIntegrationServiceV8.exchangeCodeForTokens(
							{
								environmentId: credentials.environmentId,
								clientId: credentials.clientId,
								clientSecret: credentials.clientSecret,
								redirectUri: credentials.redirectUri,
								scopes: credentials.scopes,
								clientAuthMethod: credentials.clientAuthMethod || credentials.tokenEndpointAuthMethod || 'client_secret_post',
							},
							code,
							storedCodeVerifier
						);
						
						sessionStorage.removeItem('user_login_state_v8');
						sessionStorage.removeItem('user_login_code_verifier_v8');
						sessionStorage.removeItem('user_login_credentials_temp_v8');
						sessionStorage.removeItem('user_login_redirect_uri_v8');
						
						handleTokenReceived(tokenResponse.access_token);
					} catch (error) {
						console.error(`${MODULE_TAG} Failed to exchange code for tokens`, error);
						processedCodesRef.current.delete(code);
						isProcessingRef.current = false;
					}
				}
			};
			
			checkCallback();
		}
	}, [isOpen, handleTokenReceived]);

	// Handle redirect URI changes - update PingOne app if needed
	const handleRedirectUriChange = useCallback(async (newRedirectUri: string) => {
		setRedirectUri(newRedirectUri);
		
		// Only update if URI actually changed and we have required credentials
		if (newRedirectUri === previousRedirectUriRef.current || !environmentId.trim() || !clientId.trim()) {
			// eslint-disable-next-line require-atomic-updates
			previousRedirectUriRef.current = newRedirectUri;
			return;
		}

		// Check if we should update PingOne app
		if (newRedirectUri.trim() && newRedirectUri !== defaultRedirectUri) {
			try {
				// Get worker token
				const workerToken = await workerTokenServiceV8.getToken();
				if (!workerToken) {
					console.warn(`${MODULE_TAG} No worker token available to update PingOne app`);
					// eslint-disable-next-line require-atomic-updates
					previousRedirectUriRef.current = newRedirectUri;
					return;
				}

				// Import and initialize PingOneAppCreationService
				const { PingOneAppCreationService } = await import('@/services/pingOneAppCreationService');
				const pingOneService = new PingOneAppCreationService();
				await pingOneService.initialize(workerToken, environmentId.trim(), 'us'); // Default to 'us' region

				// Find application by client ID
				const applications = await pingOneService.getApplications();
				const app = applications.find((app: { clientId?: string }) => app.clientId === clientId.trim());

				if (!app) {
					console.warn(`${MODULE_TAG} Application not found with client ID: ${clientId.trim()}`);
					// eslint-disable-next-line require-atomic-updates
					previousRedirectUriRef.current = newRedirectUri;
					return;
				}

				// Get current redirect URIs and add new one if not present
				const currentRedirectUris = app.redirectUris || [];
				const newUri = newRedirectUri.trim();
				
				if (!currentRedirectUris.includes(newUri)) {
					setIsUpdatingApp(true);
					const updatedRedirectUris = [...currentRedirectUris, newUri];
					
					// Update application
					const result = await pingOneService.updateApplication(app.id, {
						redirectUris: updatedRedirectUris,
					});

					if (result.success) {
						toastV8.success(`Redirect URI updated in PingOne application: ${newUri}`);
						console.log(`${MODULE_TAG} PingOne app updated with new redirect URI`, { appId: app.id, newUri });
					} else {
						toastV8.warning(`Failed to update PingOne app: ${result.error || 'Unknown error'}. Please add ${newUri} manually.`);
						console.error(`${MODULE_TAG} Failed to update PingOne app`, result.error);
					}
					setIsUpdatingApp(false);
				}
			} catch (error) {
				console.error(`${MODULE_TAG} Error updating PingOne app redirect URI`, error);
				toastV8.warning(`Could not automatically update PingOne app. Please add ${newRedirectUri.trim()} manually to your application's redirect URIs.`);
				setIsUpdatingApp(false);
			}
		}

		// eslint-disable-next-line require-atomic-updates
		previousRedirectUriRef.current = newRedirectUri;
	}, [environmentId, clientId]);

	// Handle saving credentials without logging in
	const handleSaveCredentials = useCallback(() => {
		if (!environmentId.trim() || !clientId.trim() || !clientSecret.trim() || !redirectUri.trim()) {
			toastV8.error('Please fill in all required fields before saving');
			return;
		}

		setIsSaving(true);
		try {
			// Ensure redirect URI is valid (use default if empty or old URIs)
			const finalRedirectUri = redirectUri.trim() && !redirectUri.trim().includes('implicit-callback') && !redirectUri.trim().includes('authz-callback')
				? redirectUri.trim() 
				: defaultRedirectUri;

			// Save credentials using CredentialsServiceV8
			const FLOW_KEY = 'user-login-v8';
			const credsToSave = {
				environmentId: environmentId.trim(),
				clientId: clientId.trim(),
				clientSecret: clientSecret.trim(),
				redirectUri: finalRedirectUri,
				scopes: scopes.trim(),
				authMethod: authMethod,
				tokenEndpointAuthMethod: authMethod,
			};
			CredentialsServiceV8.saveCredentials(FLOW_KEY, credsToSave);
			console.log(`${MODULE_TAG} Credentials saved`, { flowKey: FLOW_KEY, redirectUri: finalRedirectUri, authMethod });
			toastV8.success('Credentials saved successfully!');
			
			// Notify parent that credentials were saved (so it can refresh/update state)
			onCredentialsSaved?.();
			
			// Modal stays open so user can continue editing or login
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save credentials:`, error);
			toastV8.error('Failed to save credentials. Please try again.');
		} finally {
			setIsSaving(false);
		}
	}, [environmentId, clientId, clientSecret, redirectUri, scopes, authMethod, onCredentialsSaved]);

	const handleLogin = async () => {
		if (!environmentId.trim() || !clientId.trim() || !clientSecret.trim() || !redirectUri.trim()) {
			toastV8.error('Please fill in all required fields');
			return;
		}

		// Validate that p1:create:device scope is included for MFA flows
		if (isMfaFlow && !scopes.includes('p1:create:device')) {
			toastV8.error('For MFA user flow, the access token must include the p1:create:device scope. Please add it to the scopes field.');
			return;
		}

		// Ensure redirect URI is valid (use default if empty or old URIs)
		const finalRedirectUri = redirectUri.trim() && !redirectUri.trim().includes('implicit-callback') && !redirectUri.trim().includes('authz-callback')
			? redirectUri.trim() 
			: defaultRedirectUri;

		// Save credentials using CredentialsServiceV8 (always use user-login-callback for User Login Flow)
		const FLOW_KEY = 'user-login-v8';
		const credsToSave = {
			environmentId: environmentId.trim(),
			clientId: clientId.trim(),
			clientSecret: clientSecret.trim(),
			redirectUri: finalRedirectUri,
			scopes: scopes.trim(),
			authMethod: authMethod,
			tokenEndpointAuthMethod: authMethod,
		};
		CredentialsServiceV8.saveCredentials(FLOW_KEY, credsToSave);
		console.log(`${MODULE_TAG} Credentials saved using CredentialsServiceV8`, { flowKey: FLOW_KEY, redirectUri: finalRedirectUri, authMethod });

		try {
			// Generate authorization URL with PKCE
			const { authorizationUrl, state, codeVerifier } = await OAuthIntegrationServiceV8.generateAuthorizationUrl({
				environmentId: environmentId.trim(),
				clientId: clientId.trim(),
				clientSecret: clientSecret.trim(),
				redirectUri: finalRedirectUri,
				scopes: scopes.trim(),
				clientAuthMethod: authMethod,
			});

			// Store state, code verifier, and credentials for validation and token exchange
			sessionStorage.setItem('user_login_state_v8', state);
			sessionStorage.setItem('user_login_code_verifier_v8', codeVerifier);
			sessionStorage.setItem('user_login_credentials_temp_v8', JSON.stringify({
				environmentId: environmentId.trim(),
				clientId: clientId.trim(),
				clientSecret: clientSecret.trim(),
				redirectUri: finalRedirectUri,
				scopes: scopes.trim(),
				clientAuthMethod: authMethod,
				tokenEndpointAuthMethod: authMethod,
			}));
			sessionStorage.setItem('user_login_redirect_uri_v8', finalRedirectUri);
			
			// Store current path to return to after authentication (if we're in an MFA flow)
			// Include query params if present (e.g., for device registration flows)
			const currentPath = location.pathname;
			const currentSearch = location.search;
			const fullPath = currentSearch ? `${currentPath}${currentSearch}` : currentPath;
			
			if (currentPath.startsWith('/v8/mfa')) {
				// Store path directly as a string (no need for JSON.stringify on a string)
				sessionStorage.setItem('user_login_return_to_mfa', fullPath);
				console.log(`${MODULE_TAG} ✅ Stored return path: ${fullPath}`, {
					pathname: currentPath,
					search: currentSearch,
					fullPath,
					timestamp: new Date().toISOString(),
				});
				
				// DEBUG: Verify it was stored correctly
				const verifyStored = sessionStorage.getItem('user_login_return_to_mfa');
				console.log(`${MODULE_TAG} 🔍 DEBUG: Verified stored return path:`, verifyStored);
			} else {
				console.warn(`${MODULE_TAG} ⚠️ Not storing return path - current path does not start with /v8/mfa:`, currentPath);
			}

			console.log(`${MODULE_TAG} Redirecting to authorization URL`);
			setIsRedirecting(true);
			toastV8.info('Redirecting to PingOne for authentication...');

			// Redirect to PingOne
			window.location.href = authorizationUrl;
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to generate authorization URL`, error);
			toastV8.error(error instanceof Error ? error.message : 'Failed to start login flow');
			setIsRedirecting(false);
		}
	};

	if (!isOpen) return null;

	// Show success page if authentication was successful
	if (showSuccessPage && sessionInfo) {
		return (
			<div
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0, 0, 0, 0.5)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 2000,
				}}
			>
				<div
					style={{
						width: '100%',
						height: '100%',
						overflow: 'auto',
					}}
				>
					<UserAuthenticationSuccessPageV8
						sessionInfo={sessionInfo}
						onClose={() => {
							setShowSuccessPage(false);
							setSessionInfo(null);
							onClose();
						}}
					/>
				</div>
			</div>
		);
	}

	return (
		<>
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
					padding: 0,
					cursor: 'pointer',
				}}
				onClick={onClose}
				aria-label="Close modal"
			/>

			{/* Modal */}
			<div
				className="user-login-modal-v8"
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
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						onClose();
					}
				}}
				role="dialog"
				tabIndex={-1}
				aria-modal="true"
				aria-labelledby="modal-title"
			>
				<style>{`
					.user-login-modal-v8 input[type="text"],
					.user-login-modal-v8 textarea {
						box-sizing: border-box !important;
					}
					.user-login-modal-v8 input[type="text"],
					.user-login-modal-v8 textarea {
						overflow: hidden;
						text-overflow: ellipsis;
					}
				`}</style>
				{/* Header with PingOne branding */}
				<div
					style={{
						background: 'linear-gradient(to right, #3b82f6 0%, #2563eb 100%)',
						padding: '20px 24px',
						borderBottom: '1px solid #1e40af',
						borderTopLeftRadius: '8px',
						borderTopRightRadius: '8px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
							{/* Ping Identity Logo */}
							<div
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: 40,
									height: 40,
									borderRadius: '8px',
									background: '#ffffff',
									boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
								}}
							>
								<svg
									width={30}
									height={30}
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									aria-hidden="true"
								>
									<path d="M12 2l7 3v5c0 5.25-3.5 9.75-7 11-3.5-1.25-7-5.75-7-11V5l7-3z" fill="#E31837" />
									<path d="M12 5l4 1.7V10.5c0 3.2-2.1 6.1-4 7-1.9-.9-4-3.8-4-7V6.7L12 5z" fill="#ffffff" />
								</svg>
							</div>
							<div>
								<h2
									id="modal-title"
									style={{
										margin: '0 0 4px 0',
										fontSize: '18px',
										fontWeight: '700',
										color: '#ffffff',
									}}
								>
									👤 User Login
								</h2>
								<p style={{ margin: 0, fontSize: '13px', color: '#dbeafe' }}>
									Authenticate with PingOne to get access token
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
								color: '#ffffff',
								padding: '4px 8px',
							}}
							aria-label="Close modal"
						>
							×
						</button>
					</div>
				</div>

				{/* Content */}
				<div style={{ padding: '24px' }}>
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
						<div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<strong>ℹ️ What is User Login?</strong>
							<button
								type="button"
								onClick={() => setShowConfigModal(true)}
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '4px',
									padding: '4px 10px',
									background: '#3b82f6',
									border: 'none',
									borderRadius: '4px',
									fontSize: '12px',
									color: '#ffffff',
									fontWeight: '600',
									cursor: 'pointer',
									transition: 'all 0.2s ease',
								}}
								onMouseEnter={(e) => {
									(e.currentTarget as HTMLElement).style.background = '#2563eb';
								}}
								onMouseLeave={(e) => {
									(e.currentTarget as HTMLElement).style.background = '#3b82f6';
								}}
							>
								<FiInfo size={14} />
								Required Config!
							</button>
						</div>
						<p style={{ margin: 0 }}>
							This flow uses OAuth 2.0 Authorization Code Flow with PKCE to authenticate you with PingOne and obtain an access token.
							The access token can be used as a "User Token" in MFA flows for client-side operations.
						</p>
					</div>

					{/* Form Fields */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{/* Environment ID */}
						<div>
							<label
								htmlFor="user-login-env-id"
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '600',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Environment ID <span style={{ color: '#ef4444' }}>*</span>
							</label>
							<input
								id="user-login-env-id"
								type="text"
								value={environmentId}
								onChange={(e) => setEnvironmentId(e.target.value)}
								placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
								}}
							/>
							<small style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
								Your PingOne environment ID
							</small>
						</div>

						{/* Client ID */}
						<div>
							<label
								htmlFor="user-login-client-id"
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '600',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Client ID <span style={{ color: '#ef4444' }}>*</span>
							</label>
							<input
								id="user-login-client-id"
								type="text"
								value={clientId}
								onChange={(e) => setClientId(e.target.value)}
								placeholder="Your OAuth client ID"
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
								}}
							/>
							<small style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
								OAuth client ID configured for Authorization Code Flow
							</small>
						</div>

						{/* Client Secret */}
						<div>
							<label
								htmlFor="user-login-client-secret"
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '600',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Client Secret <span style={{ color: '#ef4444' }}>*</span>
							</label>
							<div style={{ position: 'relative' }}>
								<input
									id="user-login-client-secret"
									type={showClientSecret ? 'text' : 'password'}
									value={clientSecret}
									onChange={(e) => setClientSecret(e.target.value)}
									placeholder="Your OAuth client secret"
									style={{
										width: '100%',
										padding: '10px 40px 10px 12px',
										border: '1px solid #d1d5db',
										borderRadius: '6px',
										fontSize: '14px',
									}}
								/>
								<button
									type="button"
									onClick={() => setShowClientSecret(!showClientSecret)}
									style={{
										position: 'absolute',
										right: '8px',
										top: '50%',
										transform: 'translateY(-50%)',
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										padding: '4px',
										color: '#6b7280',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
									aria-label={showClientSecret ? 'Hide client secret' : 'Show client secret'}
								>
									{showClientSecret ? <FiEyeOff size={18} /> : <FiEye size={18} />}
								</button>
							</div>
							<small style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
								Required for token exchange in Authorization Code Flow
							</small>
						</div>

						{/* Token Endpoint Authentication Method */}
						<div>
							<label
								htmlFor="user-login-auth-method"
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '600',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Token Endpoint Authentication Method
							</label>
							<select
								id="user-login-auth-method"
								value={authMethod}
								onChange={(e) => setAuthMethod(e.target.value as AuthMethodV8)}
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
								}}
							>
								{AuthMethodServiceV8.getAvailableMethodsForFlow('authorization-code').map(
									(method) => (
										<option key={method} value={method}>
											{AuthMethodServiceV8.getDisplayLabel(method)}
										</option>
									)
								)}
							</select>
							<small style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
								{AuthMethodServiceV8.getMethodConfig(authMethod).description}
							</small>
						</div>

						{/* Redirect URI */}
						<div>
							<label
								htmlFor="user-login-redirect-uri"
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '600',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Redirect URI <span style={{ color: '#ef4444' }}>*</span>
								{isUpdatingApp && (
									<span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: '400', color: '#3b82f6' }}>
										⏳ Updating PingOne app...
									</span>
								)}
							</label>
							<input
								id="user-login-redirect-uri"
								type="text"
								value={redirectUri}
								onChange={(e) => handleRedirectUriChange(e.target.value)}
								placeholder="https://localhost:3000/user-login-callback"
								disabled={isUpdatingApp}
								style={{
									width: '100%',
									padding: '10px 12px',
									border: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
									opacity: isUpdatingApp ? 0.6 : 1,
									cursor: isUpdatingApp ? 'not-allowed' : 'text',
								}}
							/>
							<small style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
								{redirectUri === defaultRedirectUri 
									? 'Default redirect URI. If you change it, we will automatically update your PingOne application.'
									: 'If changed, we will automatically add this URI to your PingOne application\'s redirect URIs list.'
								}
							</small>
						</div>

						{/* Scopes */}
						<div>
							<label
								htmlFor="user-login-scopes"
								style={{
									display: 'block',
									fontSize: '14px',
									fontWeight: '600',
									color: '#374151',
									marginBottom: '6px',
								}}
							>
								Scopes <span style={{ color: '#ef4444' }}>*</span>
							</label>
							<input
								id="user-login-scopes"
								type="text"
								value={scopes}
								onChange={(e) => setScopes(e.target.value)}
								placeholder={isMfaFlow ? "openid profile email p1:create:device" : "openid profile email"}
								style={{
									width: '100%',
									padding: '10px 12px',
									border: isMfaFlow && !scopes.includes('p1:create:device') 
										? '2px solid #f59e0b' 
										: '1px solid #d1d5db',
									borderRadius: '6px',
									fontSize: '14px',
									background: isMfaFlow && !scopes.includes('p1:create:device') 
										? '#fffbeb' 
										: 'white',
								}}
							/>
							{isMfaFlow && !scopes.includes('p1:create:device') ? (
								<div style={{ 
									marginTop: '8px', 
									padding: '10px 12px',
									background: '#fef3c7',
									border: '1px solid #f59e0b',
									borderRadius: '6px',
									fontSize: '12px',
									color: '#92400e',
								}}>
									<strong>⚠️ Required Scope Missing:</strong> For MFA user flow (self-service device registration), 
									the access token must include the <code style={{ 
										background: '#fbbf24', 
										padding: '2px 6px', 
										borderRadius: '3px',
										fontWeight: '600',
									}}>p1:create:device</code> scope.
									<br />
									<button
										type="button"
										onClick={() => {
											const currentScopes = scopes.trim();
											const hasScope = currentScopes.includes('p1:create:device');
											if (!hasScope) {
												setScopes(`${currentScopes} p1:create:device`.trim());
											}
										}}
										style={{
											marginTop: '6px',
											padding: '4px 12px',
											background: '#f59e0b',
											color: 'white',
											border: 'none',
											borderRadius: '4px',
											fontSize: '12px',
											fontWeight: '600',
											cursor: 'pointer',
										}}
									>
										+ Add p1:create:device scope
									</button>
								</div>
							) : (
								<small style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>
									{isMfaFlow 
										? 'Space-separated list of OAuth scopes. Must include p1:create:device for MFA user flow.'
										: 'Space-separated list of OAuth scopes (openid is required for OIDC)'
									}
								</small>
							)}
						</div>
					</div>

					{/* Actions */}
					<div
						style={{
							display: 'flex',
							gap: '12px',
							marginTop: '24px',
							paddingTop: '20px',
							borderTop: '1px solid #e5e7eb',
						}}
					>
						<button
							type="button"
							onClick={onClose}
							style={{
								flex: 1,
								padding: '12px 20px',
								background: '#f3f4f6',
								color: '#374151',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
							}}
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleSaveCredentials}
							disabled={isSaving || !environmentId.trim() || !clientId.trim() || !clientSecret.trim() || !redirectUri.trim()}
							style={{
								padding: '12px 20px',
								background:
									isSaving || !environmentId.trim() || !clientId.trim() || !clientSecret.trim() || !redirectUri.trim()
										? '#d1d5db'
										: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '600',
								cursor:
									isSaving || !environmentId.trim() || !clientId.trim() || !clientSecret.trim() || !redirectUri.trim()
										? 'not-allowed'
										: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '8px',
								minWidth: '140px',
							}}
						>
							{isSaving ? (
								<>
									<span>⏳</span>
									<span>Saving...</span>
								</>
							) : (
								<>
									<span>💾</span>
									<span>Save</span>
								</>
							)}
						</button>
						<button
							type="button"
							onClick={handleLogin}
							disabled={isRedirecting || !environmentId.trim() || !clientId.trim() || !clientSecret.trim() || !redirectUri.trim()}
							style={{
								flex: 1,
								padding: '12px 20px',
								background:
									isRedirecting || !environmentId.trim() || !clientId.trim() || !clientSecret.trim() || !redirectUri.trim()
										? '#d1d5db'
										: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '600',
								cursor:
									isRedirecting || !environmentId.trim() || !clientId.trim() || !clientSecret.trim() || !redirectUri.trim()
										? 'not-allowed'
										: 'pointer',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '8px',
							}}
						>
							{isRedirecting ? (
								<>
									<span>⏳</span>
									<span>Redirecting...</span>
								</>
							) : (
								<>
									<span>🔐</span>
									<span>Login with PingOne</span>
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

