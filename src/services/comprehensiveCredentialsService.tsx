// src/services/comprehensiveCredentialsService.tsx
// Comprehensive Credentials Service - All-in-one configuration for OAuth/OIDC flows

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiSettings, FiKey } from 'react-icons/fi';
import styled from 'styled-components';
import ComprehensiveDiscoveryInput from '../components/ComprehensiveDiscoveryInput';
import { CredentialsInput } from '../components/CredentialsInput';
import ClientAuthMethodSelector from '../components/ClientAuthMethodSelector';
import JwksKeySourceSelector, { JwksKeySource } from '../components/JwksKeySourceSelector';
// import PingOneApplicationConfig, {
// 	type PingOneApplicationState,
// } from '../components/PingOneApplicationConfig';
import { CollapsibleHeader } from './collapsibleHeaderService';
import { DiscoveryResult } from './comprehensiveDiscoveryService';
import { oidcDiscoveryService } from './oidcDiscoveryService';
import type { StepCredentials } from '../components/steps/CommonSteps';
import { FlowRedirectUriService } from './flowRedirectUriService';
import { ClientAuthMethod } from '../utils/clientAuthentication';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { ConfigCheckerButtons } from '../components/ConfigCheckerButtons';
import { WorkerTokenModal } from '../components/WorkerTokenModal';

// Flow-specific authentication method configuration
const getFlowAuthMethods = (flowType?: string): ClientAuthMethod[] => {
	switch (flowType) {
		case 'implicit-oauth-v7':
		case 'implicit-oidc-v7':
			return ['none'];
		case 'authorization-code-v7':
		case 'oauth-authorization-code-v7':
		case 'oidc-authorization-code-v7':
		case 'oidc-hybrid-v7':
			return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
		case 'device-authorization-v7':
		case 'device-authorization-v6':
			return ['none', 'client_secret_basic', 'client_secret_post'];
		case 'client-credentials-v7':
		case 'worker-token-v7':
			return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
		default:
			return ['client_secret_basic', 'client_secret_post', 'client_secret_jwt', 'private_key_jwt'];
	}
};

// Flow-specific grant types configuration
const getFlowGrantTypes = (flowType?: string): string[] => {
	if (!flowType) return ['authorization_code'];
	
	const normalizedFlowType = flowType.toLowerCase().replace(/[-_]/g, '-');
	
	console.log('[CONFIG-CHECKER] getFlowGrantTypes called:', {
		flowType,
		normalizedFlowType,
		includesClientCredentials: normalizedFlowType.includes('client-credentials'),
		includesClientCredentialsUnderscore: normalizedFlowType.includes('client_credentials')
	});
	
	// Check for specific patterns
	if (normalizedFlowType.includes('client-credentials') || normalizedFlowType.includes('client_credentials')) {
		console.log('[CONFIG-CHECKER] Matched client-credentials pattern, returning client_credentials');
		return ['client_credentials'];
	}
		if (normalizedFlowType.includes('worker-token') || normalizedFlowType.includes('worker_token')) {
			console.log('[CONFIG-CHECKER] Matched worker-token pattern, returning client_credentials');
			return ['client_credentials'];
		}
		if (normalizedFlowType.includes('par-v7') || normalizedFlowType.includes('par_v7')) {
			console.log('[CONFIG-CHECKER] Matched PAR V7 pattern, returning authorization_code');
			return ['authorization_code'];
		}
	if (normalizedFlowType.includes('implicit')) {
		console.log('[CONFIG-CHECKER] Matched implicit pattern, returning implicit');
		return ['implicit'];
	}
	if (normalizedFlowType.includes('device') || normalizedFlowType.includes('device-authorization')) {
		console.log('[CONFIG-CHECKER] Matched device pattern, returning device_code');
		return ['urn:ietf:params:oauth:grant-type:device_code'];
	}
	if (normalizedFlowType.includes('hybrid')) {
		console.log('[CONFIG-CHECKER] Matched hybrid pattern, returning authorization_code');
		return ['authorization_code'];
	}
	if (normalizedFlowType.includes('authorization-code') || normalizedFlowType.includes('authorization_code')) {
		console.log('[CONFIG-CHECKER] Matched authorization-code pattern, returning authorization_code');
		return ['authorization_code'];
	}
	
	// Default fallback
	console.log('[CONFIG-CHECKER] No pattern matched, returning default authorization_code');
	return ['authorization_code'];
};

// Flow-specific response types configuration
const getFlowResponseTypes = (flowType?: string): string[] => {
	if (!flowType) return ['code'];
	
	const normalizedFlowType = flowType.toLowerCase().replace(/[-_]/g, '-');
	
	// Check for specific patterns
	if (normalizedFlowType.includes('client-credentials') || normalizedFlowType.includes('client_credentials')) {
		return []; // Client credentials flow doesn't use response_type
	}
	if (normalizedFlowType.includes('device') || normalizedFlowType.includes('device-authorization')) {
		return []; // Device authorization flow doesn't use response_type
	}
	if (normalizedFlowType.includes('implicit') && normalizedFlowType.includes('oidc')) {
		return ['token', 'id_token'];
	}
	if (normalizedFlowType.includes('implicit')) {
		return ['token'];
	}
	if (normalizedFlowType.includes('hybrid')) {
		return ['code', 'token', 'id_token'];
	}
	if (normalizedFlowType.includes('authorization-code') || normalizedFlowType.includes('authorization_code')) {
		return ['code'];
	}
	
	// Default fallback
	return ['code'];
};

export interface ComprehensiveCredentialsProps {
	// Flow identification
	flowType?: string; // Flow type for determining default redirect URI

	// Unified credentials API (preferred)
	credentials?: StepCredentials;
	onCredentialsChange?: (updated: StepCredentials) => void;
	onSaveCredentials?: () => void | Promise<void>;

	// Discovery props
	onDiscoveryComplete?: (result: DiscoveryResult) => void;
	initialDiscoveryInput?: string;
	discoveryPlaceholder?: string;
	showProviderInfo?: boolean;

	// Credentials props
	environmentId?: string;
	clientId?: string;
	clientSecret?: string;
	redirectUri?: string;
	scopes?: string;
	defaultScopes?: string;
	loginHint?: string;
	postLogoutRedirectUri?: string;
	clientAuthMethod?: ClientAuthMethod;
	allowedAuthMethods?: ClientAuthMethod[];
	onEnvironmentIdChange?: (newEnvId: string) => void;
	onClientIdChange?: (newClientId: string) => void;
	onClientSecretChange?: (newSecret: string) => void;
	onRedirectUriChange?: (newUri: string) => void;
	onScopesChange?: (newScopes: string) => void;
	onLoginHintChange?: (newLoginHint: string) => void;
	onPostLogoutRedirectUriChange?: (newUri: string) => void;
	onClientAuthMethodChange?: (method: ClientAuthMethod) => void;
	requireClientSecret?: boolean;
	onSave?: () => void;
	hasUnsavedChanges?: boolean;
	isSaving?: boolean;

	// PingOne Advanced Configuration props (commented out for now)
	// pingOneAppState?: PingOneApplicationState;
	// onPingOneAppStateChange?: (newState: PingOneApplicationState) => void;
	// onPingOneSave?: () => void;
	// hasUnsavedPingOneChanges?: boolean;
	// isSavingPingOne?: boolean;

	// Service configuration
	title?: string;
	subtitle?: string;
	// showAdvancedConfig?: boolean;
	defaultCollapsed?: boolean;

	// Config Checker props
	showConfigChecker?: boolean;
	workerToken?: string;
	region?: string;
	
	// Field visibility controls
	showRedirectUri?: boolean;
	showPostLogoutRedirectUri?: boolean;
	showLoginHint?: boolean;
	// showClientAuthMethod?: boolean;
	
	// JWKS Configuration (for private_key_jwt and client_secret_jwt auth methods)
	jwksKeySource?: JwksKeySource;
	jwksUrl?: string;
	privateKey?: string;
	showPrivateKey?: boolean;
	isGeneratingKey?: boolean;
	// onJwksKeySourceChange?: (source: JwksKeySource) => void;
	// onJwksUrlChange?: (url: string) => void;
	onPrivateKeyChange?: (key: string) => void;
	onTogglePrivateKey?: () => void;
	onGenerateKey?: () => void;
	onCopyPrivateKey?: () => void;
}

const ServiceContainer = styled.div`
	margin-bottom: 2rem;
	padding-bottom: 1rem;
	position: relative;
	z-index: 1;
`;

// const AdvancedConfigSection = styled.div`
// 	margin-top: 4rem;
// 	padding-top: 2.5rem;
// 	border-top: 2px solid #e5e7eb;
// 	margin-bottom: 2rem;
// `;


const ComprehensiveCredentialsService: React.FC<ComprehensiveCredentialsProps> = ({
	// Flow identification
	flowType,
	credentials,
	onCredentialsChange,
	onSaveCredentials,

	// Discovery props
	onDiscoveryComplete,
	initialDiscoveryInput,
	discoveryPlaceholder = "Enter Environment ID, issuer URL, or provider...",
	showProviderInfo = true,

	// Credentials props
	environmentId = '',
	clientId = '',
	clientSecret = '',
	redirectUri,
	scopes,
	defaultScopes = 'openid profile email',
	loginHint = '',
	postLogoutRedirectUri,
	clientAuthMethod = 'none',
	allowedAuthMethods,
	onEnvironmentIdChange,
	onClientIdChange,
	onClientSecretChange,
	onRedirectUriChange,
	onScopesChange,
	onLoginHintChange,
	onPostLogoutRedirectUriChange,
	onClientAuthMethodChange,
	requireClientSecret = true,
	onSave,
	hasUnsavedChanges = false,
	isSaving = false,

	// Service configuration
	title = "Application Configuration & Credentials",
	subtitle = "Configure OIDC discovery, credentials, and application settings",
	defaultCollapsed = false,
	
	// Field visibility controls
	showRedirectUri = true,
	showPostLogoutRedirectUri = true,
	showLoginHint = true,
	
	// JWKS Configuration
	jwksKeySource = 'jwks-endpoint',
	jwksUrl,
	privateKey = '',
	showPrivateKey = false,
	isGeneratingKey = false,
	// onJwksKeySourceChange,
	// onJwksUrlChange,
	onPrivateKeyChange,
	onTogglePrivateKey,
	onGenerateKey,
	onCopyPrivateKey,

	// Config Checker props
	showConfigChecker = false,
	workerToken = '',
	region = 'NA',
}) => {
	// const [isAdvancedConfigCollapsed, setIsAdvancedConfigCollapsed] = useState(true);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	
	// Retrieve worker token from localStorage if not provided
	const [retrievedWorkerToken, setRetrievedWorkerToken] = useState<string>('');
	
	// Function to check and retrieve worker token from localStorage
	const checkWorkerToken = useCallback(() => {
		const storedWorkerToken = localStorage.getItem('worker_token');
		const expiresAt = localStorage.getItem('worker_token_expires_at');
		
		if (storedWorkerToken && expiresAt) {
			const expirationTime = parseInt(expiresAt, 10);
			const now = Date.now();
			
			// Check if token is expired (with 5 minute buffer)
			const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
			if (now < (expirationTime - bufferTime)) {
				const minutesRemaining = Math.floor((expirationTime - now) / 60000);
				console.log(`[COMPREHENSIVE-CREDENTIALS] Worker token valid, expires in ${minutesRemaining} minutes`);
				setRetrievedWorkerToken(storedWorkerToken);
			} else {
				console.log('[COMPREHENSIVE-CREDENTIALS] Worker token expired, clearing from storage');
				localStorage.removeItem('worker_token');
				localStorage.removeItem('worker_token_expires_at');
				setRetrievedWorkerToken('');
			}
		} else if (storedWorkerToken) {
			// Token exists but no expiration data - assume it might be expired
			console.log('[COMPREHENSIVE-CREDENTIALS] Worker token found but no expiration data, using it anyway');
			setRetrievedWorkerToken(storedWorkerToken);
		} else {
			setRetrievedWorkerToken('');
		}
	}, []);
	
	// Check worker token on mount and when component becomes visible
	useEffect(() => {
		checkWorkerToken();
		
		// Listen for storage events (when token is updated in another tab/window)
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'worker_token' || e.key === 'worker_token_expires_at') {
				console.log('[COMPREHENSIVE-CREDENTIALS] Worker token changed in storage, re-checking');
				checkWorkerToken();
			}
		};
		
		// Listen for custom event when token is generated in the same tab
		const handleWorkerTokenUpdate = () => {
			console.log('[COMPREHENSIVE-CREDENTIALS] Worker token update event received, re-checking');
			checkWorkerToken();
		};
		
		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('workerTokenUpdated', handleWorkerTokenUpdate);
		
		// Also check periodically every 30 seconds in case user navigates between flows
		const intervalId = setInterval(() => {
			checkWorkerToken();
		}, 30000); // 30 seconds
		
		return () => {
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('workerTokenUpdated', handleWorkerTokenUpdate);
			clearInterval(intervalId);
		};
	}, [checkWorkerToken]);
	
	// Use provided workerToken or retrieved one
	const effectiveWorkerToken = workerToken || retrievedWorkerToken;

	// Determine default redirect URI based on flowType
	// Note: This is only used for initial value, not during editing
	const getDefaultRedirectUri = useCallback(() => {
		// ALWAYS return the current redirectUri if provided (even if empty - user is editing)
		if (redirectUri !== undefined) {
			return redirectUri;
		}

		// Only use defaults if redirectUri was never set (undefined, not empty string)
		if (flowType) {
			const resolved = FlowRedirectUriService.getDefaultRedirectUri(flowType);
			if (resolved) {
				return resolved;
			}
		}

		// Flow-aware fallback based on flowType
		if (flowType?.includes('implicit')) {
			return `${window.location.origin}/implicit-callback`;
		}
		if (flowType?.includes('hybrid')) {
			return `${window.location.origin}/hybrid-callback`;
		}
		if (flowType?.includes('device')) {
			return ''; // Device flows don't use redirect URIs
		}
		
		// Default fallback to authz-callback for authorization code flows
		return `${window.location.origin}/authz-callback`;
	}, [flowType, redirectUri]);

	// Determine default post-logout redirect URI
	const getDefaultPostLogoutRedirectUri = useCallback(() => {
		if (postLogoutRedirectUri && postLogoutRedirectUri.trim()) {
			return postLogoutRedirectUri; // Use provided post-logout redirect URI
		}
		
		// Default post-logout redirect URI
		return `${window.location.origin}/logout-callback`;
	}, [postLogoutRedirectUri]);

	// Get the actual redirect URIs to use
	const actualRedirectUri = getDefaultRedirectUri();
	const actualPostLogoutRedirectUri = getDefaultPostLogoutRedirectUri();

	const saveHandler = onSaveCredentials ?? onSave;

	// Normalize scopes to be space-separated
	const normalizeScopes = (scopeValue: string | undefined): string => {
		if (!scopeValue) return defaultScopes;
		
		// Convert comma-separated to space-separated if needed
		if (scopeValue.includes(',') && !scopeValue.includes(' ')) {
			return scopeValue.split(',').map(s => s.trim()).join(' ');
		}
		
		return scopeValue;
	};

	const resolvedCredentials = useMemo<StepCredentials>(() => {
		const fallbackScope = scopes || defaultScopes;
		const normalizedScope = normalizeScopes(credentials?.scope ?? credentials?.scopes ?? fallbackScope);
		
		return {
			environmentId: credentials?.environmentId ?? environmentId ?? '',
			clientId: credentials?.clientId ?? clientId ?? '',
			clientSecret: credentials?.clientSecret ?? clientSecret ?? '',
			// Use credentials.redirectUri if available, otherwise use actualRedirectUri
			// BUT respect empty string as a valid user input (don't force default)
			redirectUri: credentials?.redirectUri !== undefined ? credentials.redirectUri : actualRedirectUri,
			scope: normalizedScope,
			scopes: normalizedScope,
			loginHint: credentials?.loginHint ?? loginHint ?? '',
			postLogoutRedirectUri: credentials?.postLogoutRedirectUri !== undefined ? credentials.postLogoutRedirectUri : actualPostLogoutRedirectUri,
			responseType: credentials?.responseType ?? 'code',
			grantType: credentials?.grantType ?? 'authorization_code',
			issuerUrl: credentials?.issuerUrl ?? '',
			authorizationEndpoint: credentials?.authorizationEndpoint ?? '',
			tokenEndpoint: credentials?.tokenEndpoint ?? '',
			userInfoEndpoint: credentials?.userInfoEndpoint ?? '',
			clientAuthMethod: credentials?.clientAuthMethod ?? 'client_secret_post',
			tokenEndpointAuthMethod: credentials?.tokenEndpointAuthMethod ?? (typeof credentials?.clientAuthMethod === 'string' ? credentials.clientAuthMethod : credentials?.clientAuthMethod?.value) ?? 'client_secret_post',
		};
	}, [
		credentials,
		environmentId,
		clientId,
		clientSecret,
		actualRedirectUri,
		actualPostLogoutRedirectUri,
		scopes,
		defaultScopes,
		loginHint,
	]);

	// 🔧 CRITICAL FIX: Initialize redirect URI with default value on mount if not set
	// This ensures the authorization request uses the same redirect_uri as shown in the UI
	useEffect(() => {
		// Only initialize if:
		// 1. redirectUri is not already set in the parent's credentials
		// 2. We have a default redirect URI computed
		// 3. We have an onChange handler to call
		if (!redirectUri || !redirectUri.trim()) {
			if (actualRedirectUri && actualRedirectUri.trim()) {
				console.log('🔧 [ComprehensiveCredentialsService] Initializing redirect URI with default:', actualRedirectUri);
				
				// Use onRedirectUriChange if available (preferred)
				if (onRedirectUriChange) {
					onRedirectUriChange(actualRedirectUri);
				}
				// Fallback to onCredentialsChange
				else if (onCredentialsChange) {
					onCredentialsChange({
						...resolvedCredentials,
						redirectUri: actualRedirectUri,
					});
				}
			}
		}
	}, []); // Run only on mount - we want to set defaults once, not on every change

	const applyCredentialUpdates = useCallback(
		(updates: Partial<StepCredentials>, { shouldSave } = { shouldSave: false }) => {
			const merged: StepCredentials = {
				...resolvedCredentials,
				...updates,
			};

			if (onCredentialsChange) {
				onCredentialsChange(merged);
			} else {
				if (updates.environmentId !== undefined) {
					onEnvironmentIdChange?.(updates.environmentId);
				}
				if (updates.clientId !== undefined) {
					onClientIdChange?.(updates.clientId);
				}
				if (updates.clientSecret !== undefined) {
					onClientSecretChange?.(updates.clientSecret);
				}
				if (updates.redirectUri !== undefined) {
					onRedirectUriChange?.(updates.redirectUri);
				}
				if (updates.scope !== undefined || updates.scopes !== undefined) {
					const scopedValue = updates.scope ?? updates.scopes ?? '';
					onScopesChange?.(scopedValue);
				}
				if (updates.loginHint !== undefined) {
					onLoginHintChange?.(updates.loginHint);
				}
			if (updates.postLogoutRedirectUri !== undefined) {
				onPostLogoutRedirectUriChange?.(updates.postLogoutRedirectUri);
			}
			if (updates.clientAuthMethod !== undefined && onClientAuthMethodChange) {
				onClientAuthMethodChange(updates.clientAuthMethod as ClientAuthMethod);
			}
		}

		if (shouldSave && saveHandler) {
			void Promise.resolve(saveHandler());
		}
	},
	[
		resolvedCredentials,
		onCredentialsChange,
		onEnvironmentIdChange,
		onClientIdChange,
		onClientSecretChange,
		onRedirectUriChange,
		onScopesChange,
		onLoginHintChange,
		onPostLogoutRedirectUriChange,
		onClientAuthMethodChange,
		saveHandler,
	]
);

	// const handleAdvancedConfigToggle = useCallback(() => {
	// 	setIsAdvancedConfigCollapsed(prev => !prev);
	// }, []);

	// Handle discovery completion and update environment ID
	const handleInternalDiscoveryComplete = useCallback(
		(result: DiscoveryResult) => {
			const issuerUrl = result.issuerUrl;
			let extractedEnvId: string | null = null;
			let updates: Partial<StepCredentials> | null = null;

			if (issuerUrl) {
				extractedEnvId = oidcDiscoveryService.extractEnvironmentId(issuerUrl);
			}

			if (result.document) {
				const discovered = oidcDiscoveryService.documentToCredentials(
					result.document,
					resolvedCredentials.clientId,
					resolvedCredentials.clientSecret,
					resolvedCredentials.redirectUri
				);
				updates = {
					environmentId: discovered.environmentId || extractedEnvId || resolvedCredentials.environmentId,
					issuerUrl: discovered.issuerUrl || issuerUrl || resolvedCredentials.issuerUrl,
					authorizationEndpoint: discovered.authorizationEndpoint || resolvedCredentials.authorizationEndpoint,
					tokenEndpoint: discovered.tokenEndpoint || resolvedCredentials.tokenEndpoint,
					userInfoEndpoint: discovered.userInfoEndpoint || resolvedCredentials.userInfoEndpoint,
				};
			} else if (extractedEnvId) {
				updates = { environmentId: extractedEnvId };
			}

			if (updates) {
				console.log('[ComprehensiveCredentialsService] Auto-populating credentials from discovery:', updates);
				applyCredentialUpdates(updates, { shouldSave: true });
			}

			if (onDiscoveryComplete) {
				onDiscoveryComplete(result);
			}
		},
		[resolvedCredentials, applyCredentialUpdates, onDiscoveryComplete]
	);

	return (
		<>
			{/* Worker Token Modal - moved above main content */}
			<WorkerTokenModal
				isOpen={showWorkerTokenModal}
				onClose={() => {
					setShowWorkerTokenModal(false);
					// Re-check worker token when modal closes
					checkWorkerToken();
				}}
				onContinue={() => {
					// Re-check worker token immediately after generation
					checkWorkerToken();
					setShowWorkerTokenModal(false);
				}}
				flowType={flowType || 'flow'}
				environmentId={resolvedCredentials.environmentId || ''}
			/>
			
			<ServiceContainer>
				<CollapsibleHeader
					title={title}
				subtitle={subtitle}
				icon={<FiSettings />}
				defaultCollapsed={defaultCollapsed}
				theme="orange"
			>
				{/* OIDC Discovery */}
				<ComprehensiveDiscoveryInput
					onDiscoveryComplete={handleInternalDiscoveryComplete}
					initialInput={initialDiscoveryInput || ''}
					placeholder={discoveryPlaceholder}
					showProviderInfo={showProviderInfo}
				/>

			{/* Advanced Configuration */}
			<CollapsibleHeader
				title="Advanced Configuration"
				subtitle="Advanced OIDC and OAuth configuration options"
				icon={<FiSettings />}
				defaultCollapsed={true}
				theme="orange"
			>
				<div style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
					gap: '1.5rem',
					padding: '1.5rem',
					background: '#f8fafc',
					borderRadius: '0.75rem',
					border: '1px solid #e2e8f0'
				}}>
					{/* Req Object Policy */}
					<div>
						<label style={{
							display: 'block',
							fontSize: '0.875rem',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '0.5rem'
						}}>
							Req Object Policy
						</label>
						<select
							style={{
								width: '100%',
								padding: '0.75rem',
								border: '1px solid #d1d5db',
								borderRadius: '0.5rem',
								background: 'white',
								fontSize: '0.875rem',
								color: '#374151'
							}}
							defaultValue="default"
						>
							<option value="default">default</option>
							<option value="required">required</option>
							<option value="optional">optional</option>
						</select>
					</div>

					{/* x5t (JWT hdr) */}
					<div>
						<label style={{
							display: 'block',
							fontSize: '0.875rem',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '0.5rem'
						}}>
							x5t (JWT hdr)
						</label>
						<input
							type="text"
							placeholder="Base64URL thumbprint"
							style={{
								width: '100%',
								padding: '0.75rem',
								border: '1px solid #d1d5db',
								borderRadius: '0.5rem',
								fontSize: '0.875rem',
								color: '#374151'
							}}
						/>
					</div>

					{/* OIDC Session Management */}
					<div>
						<label style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							fontSize: '0.875rem',
							fontWeight: '600',
							color: '#374151',
							cursor: 'pointer'
						}}>
							<input
								type="checkbox"
								style={{
									width: '1rem',
									height: '1rem',
									accentColor: '#3b82f6'
								}}
							/>
							<span>Enable OP iframe monitoring</span>
						</label>
					</div>

					{/* Resource Scopes */}
					<div>
						<label style={{
							display: 'block',
							fontSize: '0.875rem',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '0.5rem'
						}}>
							Resource Scopes
						</label>
						<input
							type="text"
							defaultValue="openid profile email"
							style={{
								width: '100%',
								padding: '0.75rem',
								border: '1px solid #d1d5db',
								borderRadius: '0.5rem',
								fontSize: '0.875rem',
								color: '#374151'
							}}
						/>
					</div>

					{/* Logout via ID Token */}
					<div>
						<label style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							fontSize: '0.875rem',
							fontWeight: '600',
							color: '#374151',
							cursor: 'pointer'
						}}>
							<input
								type="checkbox"
								defaultChecked
								style={{
									width: '1rem',
									height: '1rem',
									accentColor: '#3b82f6'
								}}
							/>
							<span>Use RP-initiated logout with id_token_hint</span>
						</label>
					</div>
				</div>
			</CollapsibleHeader>

			{/* Basic Credentials */}
			<CredentialsInput
				environmentId={resolvedCredentials.environmentId}
				clientId={resolvedCredentials.clientId}
				clientSecret={resolvedCredentials.clientSecret}
				redirectUri={resolvedCredentials.redirectUri}
				scopes={resolvedCredentials.scope || resolvedCredentials.scopes || defaultScopes}
				loginHint={resolvedCredentials.loginHint}
				postLogoutRedirectUri={resolvedCredentials.postLogoutRedirectUri || actualPostLogoutRedirectUri}
				onEnvironmentIdChange={(value) => applyCredentialUpdates({ environmentId: value }, { shouldSave: false })}
				onClientIdChange={(value) => applyCredentialUpdates({ clientId: value }, { shouldSave: false })}
				onClientSecretChange={(value) => applyCredentialUpdates({ clientSecret: value }, { shouldSave: false })}
				onRedirectUriChange={(value) => applyCredentialUpdates({ redirectUri: value }, { shouldSave: false })}
				onScopesChange={(value) => applyCredentialUpdates({ scope: value, scopes: value }, { shouldSave: false })}
				onLoginHintChange={(value) => applyCredentialUpdates({ loginHint: value }, { shouldSave: false })}
				onPostLogoutRedirectUriChange={(value) => applyCredentialUpdates({ postLogoutRedirectUri: value }, { shouldSave: false })}
				showClientSecret={requireClientSecret}
				showRedirectUri={showRedirectUri}
				showPostLogoutRedirectUri={showPostLogoutRedirectUri}
				showLoginHint={showLoginHint}
				onSave={saveHandler || (() => {})}
				hasUnsavedChanges={hasUnsavedChanges}
				isSaving={isSaving}
			/>

			{/* Token Endpoint Authentication Method - Inside Basic Credentials section */}
			<div style={{ 
				marginTop: '1rem', 
				padding: '1rem 1.5rem', 
				background: '#f8fafc', 
				border: '1px solid #e2e8f0', 
				borderRadius: '0.75rem',
				marginBottom: '1.5rem'
			}}>
				<ClientAuthMethodSelector
					value={clientAuthMethod}
					onChange={(method) => {
						applyCredentialUpdates({ clientAuthMethod: method }, { shouldSave: false });
						onClientAuthMethodChange?.(method);
					}}
					allowedMethods={allowedAuthMethods || getFlowAuthMethods(flowType)}
					showDescription={true}
				/>
			</div>

			{/* Worker Token Generation - Always show when no token */}
			{!effectiveWorkerToken && (
				<div style={{
					background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
					border: '1px solid #f59e0b',
					borderRadius: '0.75rem',
					padding: '1.5rem',
					marginBottom: '1.5rem',
					textAlign: 'center'
				}}>
					<div style={{
						fontSize: '1rem',
						color: '#92400e',
						fontWeight: '600',
						marginBottom: '0.75rem'
					}}>
						🔑 Worker Token Required for Config Checker
					</div>
					<div style={{
						fontSize: '0.875rem',
						color: '#92400e',
						marginBottom: '1rem',
						lineHeight: '1.5'
					}}>
						Generate a worker token to use Config Checker and create PingOne applications.
					</div>
					<button
						onClick={() => setShowWorkerTokenModal(true)}
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: '0.5rem',
							padding: '0.75rem 1.5rem',
							borderRadius: '0.5rem',
							border: 'none',
							background: '#2563eb',
							color: '#ffffff',
							fontWeight: '600',
							cursor: 'pointer',
							transition: 'background 120ms ease',
							fontSize: '0.875rem'
						}}
						onMouseOver={(e) => e.currentTarget.style.background = '#1e40af'}
						onMouseOut={(e) => e.currentTarget.style.background = '#2563eb'}
					>
						<FiKey />
						Generate Worker Token
					</button>
				</div>
			)}

			{/* Config Checker - Show for all flows when enabled */}
			{showConfigChecker && (
				<>
					{effectiveWorkerToken ? (
					<ConfigCheckerButtons
						formData={(() => {
							// Helper: Determine if flow uses redirects
							const flowUsesRedirects = !flowType?.toLowerCase().includes('client-credentials') && 
								!flowType?.toLowerCase().includes('ropc');
							
							// Load worker credentials for Config Checker (needed for PingOne Management API)
							let workerCredentials = null;
							try {
								const saved = localStorage.getItem('worker_credentials');
								if (saved) {
									workerCredentials = JSON.parse(saved);
									console.log('[CONFIG-CHECKER] Loaded worker credentials:', {
										clientId: workerCredentials.clientId,
										clientSecret: workerCredentials.clientSecret ? `${workerCredentials.clientSecret.substring(0, 10)}...` : 'undefined',
										environmentId: workerCredentials.environmentId
									});
								}
							} catch (error) {
								console.warn('[CONFIG-CHECKER] Failed to load worker credentials:', error);
							}
							
							// Base form data - use application credentials for comparison, worker credentials for authentication
							const baseFormData: Record<string, unknown> = {
								name: resolvedCredentials.clientId || `${flowType || 'Flow'} App`,
								clientId: resolvedCredentials.clientId, // Use application's clientId for comparison
								clientSecret: resolvedCredentials.clientSecret, // Use application's clientSecret for comparison
								environmentId: workerCredentials?.environmentId || resolvedCredentials.environmentId,
								scopes: (() => {
									const scopeData = resolvedCredentials.scope || resolvedCredentials.scopes;
									if (Array.isArray(scopeData)) return scopeData;
									if (typeof scopeData === 'string') return scopeData.split(' ').filter(Boolean);
									return ['openid', 'profile', 'email'];
								})(),
								grantTypes: getFlowGrantTypes(flowType),
								responseTypes: getFlowResponseTypes(flowType),
								tokenEndpointAuthMethod: resolvedCredentials.clientAuthMethod || 'client_secret_basic',
							};
							
							// Debug logging to see what flowType and grantTypes are being used
							console.log('[CONFIG-CHECKER] Form data construction:', {
								flowType,
								grantTypes: getFlowGrantTypes(flowType),
								responseTypes: getFlowResponseTypes(flowType),
								clientAuthMethod,
								resolvedCredentialsClientAuthMethod: resolvedCredentials.clientAuthMethod,
								clientSecret: resolvedCredentials.clientSecret ? `${resolvedCredentials.clientSecret.substring(0, 10)}...` : 'undefined',
								baseFormData,
								normalizedFlowType: flowType?.toLowerCase().replace(/[-_]/g, '-'),
								includesClientCredentials: flowType?.toLowerCase().includes('client-credentials'),
								includesClientCredentialsUnderscore: flowType?.toLowerCase().includes('client_credentials')
							});
							
							// Only include redirectUris for flows that use them
							if (flowUsesRedirects && resolvedCredentials.redirectUri) {
								baseFormData.redirectUris = [resolvedCredentials.redirectUri];
							}
							
							return baseFormData;
						})()}
						selectedAppType={(() => {
							if (flowType?.toLowerCase().includes('client-credentials')) return 'WORKER';
							if (flowType?.toLowerCase().includes('implicit')) return 'SINGLE_PAGE_APP';
							return 'OIDC_WEB_APP';
						})()}
						workerToken={effectiveWorkerToken}
						environmentId={resolvedCredentials.environmentId || ''}
						region={region}
							isCreating={isSaving}
							onGenerateWorkerToken={() => setShowWorkerTokenModal(true)}
							onImportConfig={(importedConfig) => {
								// Update credentials with imported PingOne configuration
								const updatedCredentials = {
									...resolvedCredentials,
									redirectUri: importedConfig.redirectUris?.[0] || resolvedCredentials.redirectUri,
									scopes: importedConfig.scopes || resolvedCredentials.scopes,
									clientAuthMethod: importedConfig.tokenEndpointAuthMethod || resolvedCredentials.clientAuthMethod,
									// Note: grantTypes and responseTypes are flow-specific, not imported
								};
								
								// Update the credentials
								onCredentialsChange(updatedCredentials);
								
								// Show success message
								import('../utils/v4ToastMessages').then(({ v4ToastManager }) => {
									v4ToastManager.showSuccess('Configuration imported from PingOne!');
								});
							}}
							onCreateApplication={async (appData?: { name: string; description: string; redirectUri?: string; tokenEndpointAuthMethod?: string; responseTypes?: string[]; grantTypes?: string[] }) => {
								// Create a new PingOne application using the current flow configuration
								try {
									const { pingOneAppCreationService } = await import('../services/pingOneAppCreationService');
									
									// Initialize the service with worker token
									await pingOneAppCreationService.initialize(effectiveWorkerToken, resolvedCredentials.environmentId || '', region);
									
									// Determine app type based on flow type
									const appType = flowType?.includes('implicit') ? 'OIDC_NATIVE_APP' : 'OIDC_WEB_APP';
									
									// Generate app name with PingOne and flow type
									const generateAppName = (flowType: string | undefined) => {
										// Extract the actual flow name from flowType (e.g., "implicit-oidc-v7" -> "implicit")
										let flowName = flowType?.replace(/[-_]/g, '-').toLowerCase() || 'oauth-flow';
										
										// For specific flow types, use the main flow name
										if (flowName.includes('implicit')) {
											flowName = 'implicit';
										} else if (flowName.includes('par-v7') || flowName.includes('par_v7')) {
											flowName = 'par'; // Use PAR instead of authorization-code for PAR flows
										} else if (flowName.includes('authorization-code')) {
											flowName = 'authorization-code';
										} else if (flowName.includes('device-authorization')) {
											flowName = 'device-authorization';
										} else if (flowName.includes('client-credentials')) {
											flowName = 'client-credentials';
										} else if (flowName.includes('hybrid')) {
											flowName = 'hybrid';
										}
										
										const uniqueId = Math.floor(Math.random() * 900) + 100; // 3-digit number (100-999)
										return `pingone-${flowName}-${uniqueId}`;
									};
									
									// Use provided app data or fallback to generated name
									const appName = appData?.name || generateAppName(flowType);
									const appDescription = appData?.description || `Created via OAuth Playground - ${flowType || 'Flow'}`;
									
									// Use provided redirect URI or generate one
									const redirectUri = appData?.redirectUri || (() => {
										// Generate redirect URI with flow name and unique 3-digit number
										let flowName = flowType?.replace(/[-_]/g, '-').toLowerCase() || 'oauth-flow';
										
										// For specific flow types, use the main flow name
										if (flowName.includes('implicit')) {
											flowName = 'implicit';
										} else if (flowName.includes('par-v7') || flowName.includes('par_v7')) {
											flowName = 'par'; // Use PAR instead of authorization-code for PAR flows
										} else if (flowName.includes('authorization-code')) {
											flowName = 'authorization-code';
										} else if (flowName.includes('device-authorization')) {
											flowName = 'device-authorization';
										} else if (flowName.includes('client-credentials')) {
											flowName = 'client-credentials';
										} else if (flowName.includes('hybrid')) {
											flowName = 'hybrid';
										}
										
										const uniqueId = Math.floor(Math.random() * 900) + 100; // 3-digit number (100-999)
										return `https://localhost:3000/callback/${flowName}-${uniqueId}`;
									})();
									
									// Use provided values or fallback to flow defaults
									const grantTypes = appData?.grantTypes || getFlowGrantTypes(flowType) as string[];
									const responseTypes = appData?.responseTypes || getFlowResponseTypes(flowType) as string[];
									const tokenAuthMethod = appData?.tokenEndpointAuthMethod || clientAuthMethod || 'none';
									
									// Helper function to safely get scopes array
									const getScopesArray = (scopeOrScopes: string | string[] | undefined): string[] => {
										if (Array.isArray(scopeOrScopes)) {
											return scopeOrScopes;
										}
										if (typeof scopeOrScopes === 'string') {
											return scopeOrScopes.split(' ').filter(Boolean);
										}
										// Fallback to default scopes
										return ['openid', 'profile', 'email'];
									};
									
									const scopesArray = getScopesArray(resolvedCredentials.scope || resolvedCredentials.scopes);
									
									// Create the application based on type
									let result;
									if (appType === 'OIDC_WEB_APP') {
										result = await pingOneAppCreationService.createOIDCWebApp({
											type: 'OIDC_WEB_APP',
											name: appName,
											description: appDescription,
											redirectUris: [redirectUri],
											postLogoutRedirectUris: resolvedCredentials.postLogoutRedirectUri ? [resolvedCredentials.postLogoutRedirectUri] : [],
											grantTypes: grantTypes,
											responseTypes: responseTypes,
											tokenEndpointAuthMethod: tokenAuthMethod,
											scopes: scopesArray,
											pkceEnforcement: 'OPTIONAL',
										});
									} else {
										result = await pingOneAppCreationService.createOIDCNativeApp({
											type: 'OIDC_NATIVE_APP',
											name: appName,
											description: appDescription,
											redirectUris: [redirectUri],
											grantTypes: grantTypes,
											responseTypes: responseTypes,
											tokenEndpointAuthMethod: tokenAuthMethod,
											scopes: scopesArray,
											pkceEnforcement: 'OPTIONAL',
										});
									}
									
									// Update credentials with the new application details
									if (result.success && result.app) {
										const updates: Record<string, string> = {
											clientId: result.app.clientId,
											redirectUri: redirectUri, // Update with the provided or generated redirect URI
										};
										
										// Only include client secret if it exists (confidential clients)
										if (result.app.clientSecret) {
											updates.clientSecret = result.app.clientSecret;
										}
										
										console.log('[COMPREHENSIVE-CREDENTIALS] Updating credentials with new app details:', {
											clientId: result.app.clientId,
											redirectUri: redirectUri,
											hasSecret: !!result.app.clientSecret
										});
										
										// Update the UI immediately
										applyCredentialUpdates(updates, { shouldSave: true });
										
										v4ToastManager.showSuccess(`Application "${result.app.name}" created successfully! Credentials updated.`);
									} else {
										v4ToastManager.showSuccess('PingOne application created successfully!');
									}
									
									// Return the result for the modal
									return result;
								} catch (error) {
									console.error('Failed to create PingOne application:', error);
									v4ToastManager.showError(`Failed to create application: ${error instanceof Error ? error.message : 'Unknown error'}`);
									throw error;
								}
							}}
						/>
					) : null}
				</>
			)}



		{/* JWKS Configuration - Only show for JWT-based auth methods */}
		{(clientAuthMethod === 'private_key_jwt' || clientAuthMethod === 'client_secret_jwt') && (
			<CollapsibleHeader
				title="JSON Web Key Set (JWKS) Configuration"
				subtitle="Configure JWKS endpoint or provide a private key for JWT-based client authentication"
				icon={<FiKey />}
				defaultCollapsed={false}
			>
				<JwksKeySourceSelector
					value={jwksKeySource}
					jwksUrl={jwksUrl}
					environmentId={resolvedCredentials.environmentId}
					issuer={resolvedCredentials.issuerUrl}
					onCopyJwksUrlSuccess={(url) => {
						v4ToastManager.showSuccess(`JWKS URL copied: ${url}`);
					}}
					onCopyJwksUrlError={(error) => {
						v4ToastManager.showError(`Failed to copy JWKS URL: ${error}`);
					}}
					privateKey={privateKey}
					onPrivateKeyChange={(key) => {
						onPrivateKeyChange?.(key);
					}}
					onGenerateKey={() => {
						onGenerateKey?.();
					}}
					isGeneratingKey={isGeneratingKey}
					showPrivateKey={showPrivateKey}
					onTogglePrivateKey={() => {
						onTogglePrivateKey?.();
					}}
					onCopyPrivateKey={() => {
						onCopyPrivateKey?.();
					}}
					jwksInstructions={
						<div style={{ marginBottom: '1rem', padding: '1rem', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
							<p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>
								<strong>JWKS Endpoint Mode:</strong> Your application will expose a public JWKS endpoint that PingOne can fetch to verify JWT signatures. 
								This is the recommended approach for production environments.
							</p>
						</div>
					}
					privateKeyHelper={
						<div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
							<strong>Private Key Mode:</strong> Use this for testing. The private key is used to sign JWTs for client authentication. 
							In production, keys should be stored securely (e.g., HSM, key vault).
						</div>
					}
					configurationWarning={
						<div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '6px', border: '1px solid #fbbf24', marginBottom: '1rem' }}>
							<p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
								<strong>⚠️ Configuration Mismatch:</strong> Make sure your PingOne application is configured to use <code>{clientAuthMethod}</code> as the token endpoint authentication method.
							</p>
						</div>
					}
					showConfigurationWarning={true}
					copyButtonLabel="Copy JWKS URL"
					generateKeyLabel="Generate RSA Key Pair"
					privateKeyLabel="Private Key (PEM Format)"
				/>
			</CollapsibleHeader>
		)}

			</CollapsibleHeader>

		</ServiceContainer>
		</>
	);
};

export default ComprehensiveCredentialsService;

