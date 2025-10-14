// src/services/comprehensiveCredentialsService.tsx
// Comprehensive Credentials Service - All-in-one configuration for OAuth/OIDC flows

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiSettings, FiKey } from 'react-icons/fi';
import styled from 'styled-components';
import ComprehensiveDiscoveryInput from '../components/ComprehensiveDiscoveryInput';
import { CredentialsInput } from '../components/CredentialsInput';
import ClientAuthMethodSelector from '../components/ClientAuthMethodSelector';
import JwksKeySourceSelector, { JwksKeySource } from '../components/JwksKeySourceSelector';
import PingOneApplicationConfig, {
	type PingOneApplicationState,
} from '../components/PingOneApplicationConfig';
import { CollapsibleHeader } from './collapsibleHeaderService';
import { DiscoveryResult } from './comprehensiveDiscoveryService';
import { oidcDiscoveryService } from './oidcDiscoveryService';
import type { StepCredentials } from '../components/steps/CommonSteps';
import { FlowRedirectUriService } from './flowRedirectUriService';
import { ClientAuthMethod } from '../utils/clientAuthentication';
import { v4ToastManager } from '../utils/v4ToastMessages';

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

	// PingOne Advanced Configuration props
	pingOneAppState?: PingOneApplicationState;
	onPingOneAppStateChange?: (newState: PingOneApplicationState) => void;
	onPingOneSave?: () => void;
	hasUnsavedPingOneChanges?: boolean;
	isSavingPingOne?: boolean;

	// Service configuration
	title?: string;
	subtitle?: string;
	showAdvancedConfig?: boolean;
	defaultCollapsed?: boolean;
	
	// Field visibility controls
	showRedirectUri?: boolean;
	showPostLogoutRedirectUri?: boolean;
	showLoginHint?: boolean;
	showClientAuthMethod?: boolean;
	
	// JWKS Configuration (for private_key_jwt and client_secret_jwt auth methods)
	jwksKeySource?: JwksKeySource;
	jwksUrl?: string;
	privateKey?: string;
	showPrivateKey?: boolean;
	isGeneratingKey?: boolean;
	onJwksKeySourceChange?: (source: JwksKeySource) => void;
	onJwksUrlChange?: (url: string) => void;
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

const AdvancedConfigSection = styled.div`
	margin-top: 4rem;
	padding-top: 2.5rem;
	border-top: 2px solid #e5e7eb;
	margin-bottom: 2rem;
`;


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
	clientAuthMethod = 'client_secret_post',
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

	// PingOne Advanced Configuration props
	pingOneAppState,
	onPingOneAppStateChange,
	onPingOneSave,
	hasUnsavedPingOneChanges = false,
	isSavingPingOne = false,

	// Service configuration
	title = "Application Configuration & Credentials",
	subtitle = "Configure OIDC discovery, credentials, and application settings",
	showAdvancedConfig = true,
	defaultCollapsed = false,
	
	// Field visibility controls
	showRedirectUri = true,
	showPostLogoutRedirectUri = true,
	showLoginHint = true,
	showClientAuthMethod = true,
	
	// JWKS Configuration
	jwksKeySource = 'jwks-endpoint',
	jwksUrl,
	privateKey = '',
	showPrivateKey = false,
	isGeneratingKey = false,
	onJwksKeySourceChange,
	onJwksUrlChange,
	onPrivateKeyChange,
	onTogglePrivateKey,
	onGenerateKey,
	onCopyPrivateKey,
}) => {
	const [isAdvancedConfigCollapsed, setIsAdvancedConfigCollapsed] = useState(true);

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

	const resolvedCredentials = useMemo<StepCredentials>(() => {
		const fallbackScope = scopes || defaultScopes;
		return {
			environmentId: credentials?.environmentId ?? environmentId ?? '',
			clientId: credentials?.clientId ?? clientId ?? '',
			clientSecret: credentials?.clientSecret ?? clientSecret ?? '',
			// Use credentials.redirectUri if available, otherwise use actualRedirectUri
			// BUT respect empty string as a valid user input (don't force default)
			redirectUri: credentials?.redirectUri !== undefined ? credentials.redirectUri : actualRedirectUri,
			scope: credentials?.scope ?? fallbackScope,
			scopes: credentials?.scopes ?? fallbackScope,
			loginHint: credentials?.loginHint ?? loginHint ?? '',
			postLogoutRedirectUri: credentials?.postLogoutRedirectUri !== undefined ? credentials.postLogoutRedirectUri : actualPostLogoutRedirectUri,
			responseType: credentials?.responseType ?? 'code',
			grantType: credentials?.grantType ?? 'authorization_code',
			issuerUrl: credentials?.issuerUrl ?? '',
			authorizationEndpoint: credentials?.authorizationEndpoint ?? '',
			tokenEndpoint: credentials?.tokenEndpoint ?? '',
			userInfoEndpoint: credentials?.userInfoEndpoint ?? '',
			clientAuthMethod: credentials?.clientAuthMethod ?? 'client_secret_post',
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

	const handleAdvancedConfigToggle = useCallback(() => {
		setIsAdvancedConfigCollapsed(prev => !prev);
	}, []);

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

		{/* Token Endpoint Authentication Method */}
		{showClientAuthMethod && onClientAuthMethodChange && (
			<ClientAuthMethodSelector
				value={clientAuthMethod}
				onChange={onClientAuthMethodChange}
				allowedMethods={allowedAuthMethods}
				showDescription={true}
			/>
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

		{/* PingOne Advanced Configuration */}
				{showAdvancedConfig && pingOneAppState && onPingOneAppStateChange && (
					<AdvancedConfigSection>
						<CollapsibleHeader
							title="PingOne Security & Advanced Settings"
							subtitle="Configure advanced security options, client authentication, and PingOne-specific features"
							icon={<FiSettings />}
							defaultCollapsed={isAdvancedConfigCollapsed}
							onToggle={handleAdvancedConfigToggle}
						>
							<div style={{ position: 'relative', height: 'auto', minHeight: 'auto', overflowY: 'visible' }}>
								<PingOneApplicationConfig
									value={pingOneAppState}
									onChange={onPingOneAppStateChange}
									{...(onPingOneSave && { onSave: onPingOneSave })}
									isSaving={isSavingPingOne}
									hasUnsavedChanges={hasUnsavedPingOneChanges}
									flowType={flowType}
								/>
							</div>
						</CollapsibleHeader>
					</AdvancedConfigSection>
				)}
			</CollapsibleHeader>
		</ServiceContainer>
	);
};

export default ComprehensiveCredentialsService;

