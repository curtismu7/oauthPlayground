/**
 * @file CredentialsFormV8.tsx
 * @module v8/components
 * @description Full-featured credentials form with all V7 functionality
 * @version 8.0.0
 * @since 2024-11-16
 *
 * Features:
 * - OIDC Discovery integration
 * - All credential fields (environmentId, clientId, secret, redirect URIs, scopes, etc.)
 * - Advanced configuration (response type, client auth method, JWKS)
 * - Flow-specific field visibility
 * - Smart defaults to minimize user input
 * - Light blue header styling
 * - Full V7 feature parity
 *
 * @example
 * <CredentialsFormV8
 *   flowKey="oauth-authz-v8"
 *   credentials={credentials}
 *   onChange={setCredentials}
 *   flowType="oauth"
 * />
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppPickerV8, type DiscoveredApp } from '@/v8/components/AppPickerV8';
import {
	OidcDiscoveryModalV8,
	type OidcDiscoveryResult,
} from '@/v8/components/OidcDiscoveryModalV8';
import { TooltipV8 } from '@/v8/components/TooltipV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { FlowOptionsServiceV8 } from '@/v8/services/flowOptionsServiceV8';
import { OidcDiscoveryServiceV8 } from '@/v8/services/oidcDiscoveryServiceV8';
import { RedirectUriServiceV8 } from '@/v8/services/redirectUriServiceV8';
import {
	type FlowType,
	type SpecVersion,
	SpecVersionServiceV8,
} from '@/v8/services/specVersionServiceV8';
import { TooltipContentServiceV8 } from '@/v8/services/tooltipContentServiceV8';
import { UnifiedFlowOptionsServiceV8 } from '@/v8/services/unifiedFlowOptionsServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

type ClientType = 'public' | 'confidential';
type AppType = 'web' | 'spa' | 'mobile' | 'desktop' | 'cli' | 'm2m' | 'backend';

const MODULE_TAG = '[📋 CREDENTIALS-FORM-V8]';

export interface CredentialsFormV8Props {
	flowKey: string;
	flowType?: 'oauth' | 'oidc' | 'client-credentials' | 'device-code' | 'ropc' | 'hybrid' | 'pkce';
	credentials: {
		environmentId: string;
		clientId: string;
		clientSecret?: string;
		redirectUri?: string;
		postLogoutRedirectUri?: string;
		logoutUri?: string;
		scopes?: string;
		loginHint?: string;
		clientAuthMethod?:
			| 'none'
			| 'client_secret_basic'
			| 'client_secret_post'
			| 'client_secret_jwt'
			| 'private_key_jwt';
		responseType?: string;
		issuerUrl?: string;
		[key: string]: unknown;
	};
	onChange: (credentials: unknown) => void;
	appConfig?: {
		clientId?: string;
		redirectUris?: string[];
		logoutUris?: string[];
		scopes?: string[];
	};
	title?: string;
	subtitle?: string;
	showRedirectUri?: boolean;
	showPostLogoutRedirectUri?: boolean;
	showLoginHint?: boolean;
	showClientAuthMethod?: boolean;
	onRedirectUriChange?: (needsUpdate: boolean) => void;
	onLogoutUriChange?: (needsUpdate: boolean) => void;
	onDiscoveryComplete?: (result: unknown) => void;
}

export const CredentialsFormV8: React.FC<CredentialsFormV8Props> = ({
	flowKey,
	flowType: providedFlowType,
	credentials,
	onChange,
	appConfig,
	title,
	subtitle,
	showLoginHint = true,
	showClientAuthMethod = true,
	onDiscoveryComplete,
}) => {
	const [isExpanded, setIsExpanded] = useState(true);
	const [showAdvancedSection, setShowAdvancedSection] = useState(true);
	const [discoveryInput, setDiscoveryInput] = useState('');
	const [isDiscovering, setIsDiscovering] = useState(false);
	const [usePKCE, setUsePKCE] = useState(false);
	const [enableRefreshToken, setEnableRefreshToken] = useState(false);
	const [useRedirectless, setUseRedirectless] = useState(false);
	const [specVersion, setSpecVersion] = useState<SpecVersion>('oauth2.0');
	const [selectedFlowType, setSelectedFlowType] = useState<FlowType>('oauth-authz');

	// Critical UI additions
	const [clientType, setClientType] = useState<ClientType>('public');
	const [appType, setAppType] = useState<AppType>('spa');

	// OIDC Discovery Modal
	const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
	const [discoveryResult, setDiscoveryResult] = useState<OidcDiscoveryResult | null>(null);

	const config = CredentialsServiceV8.getFlowConfig(flowKey);
	const flowType = providedFlowType || config?.flowType || 'oauth';

	// Get available flows for current spec version
	const availableFlows = useMemo(
		() => SpecVersionServiceV8.getAvailableFlows(specVersion),
		[specVersion]
	);

	// Ensure selected flow is available for current spec
	const effectiveFlowType = useMemo(() => {
		if (availableFlows.includes(selectedFlowType)) {
			return selectedFlowType;
		}
		return availableFlows[0] || 'oauth-authz';
	}, [selectedFlowType, availableFlows]);

	// Determine effective flow key based on PKCE toggle
	const effectiveFlowKey =
		usePKCE && effectiveFlowType === 'oauth-authz' ? 'pkce-v8' : `${effectiveFlowType}-v8`;

	// Get unified flow options
	const flowOptions = useMemo(
		() => FlowOptionsServiceV8.getOptionsForFlow(effectiveFlowKey),
		[effectiveFlowKey]
	);
	const checkboxAvailability = useMemo(
		() => UnifiedFlowOptionsServiceV8.getCheckboxAvailability(specVersion, effectiveFlowType),
		[specVersion, effectiveFlowType]
	);
	const complianceWarnings = useMemo(
		() => UnifiedFlowOptionsServiceV8.getComplianceWarnings(specVersion, effectiveFlowType),
		[specVersion, effectiveFlowType]
	);

	if (!config) {
		console.error(`${MODULE_TAG} Unknown flow key`, { flowKey });
		return <div>Error: Unknown flow type</div>;
	}

	// Initialize redirect URIs for the flow if not already set
	useEffect(() => {
		if (!credentials.redirectUri || !credentials.postLogoutRedirectUri) {
			const { redirectUri, postLogoutRedirectUri } = RedirectUriServiceV8.initializeRedirectUris(
				flowKey,
				credentials.redirectUri,
				credentials.postLogoutRedirectUri
			);

			if (redirectUri && !credentials.redirectUri) {
				console.log(`${MODULE_TAG} Auto-setting redirect URI for flow`, { flowKey, redirectUri });
				onChange({ ...credentials, redirectUri });
			}

			if (postLogoutRedirectUri && !credentials.postLogoutRedirectUri) {
				console.log(`${MODULE_TAG} Auto-setting post-logout redirect URI for flow`, {
					flowKey,
					postLogoutRedirectUri,
				});
				onChange({ ...credentials, postLogoutRedirectUri });
			}
		}
	}, [flowKey, credentials, onChange]); // Only run when flowKey changes

	console.log(`${MODULE_TAG} Rendering credentials form`, { flowKey, flowType, flowOptions });

	const handleChange = useCallback(
		(field: string, value: string) => {
			console.log(`${MODULE_TAG} Credential changed`, { field, flowKey });
			const updated = { ...credentials, [field]: value };
			onChange(updated);

			// Note: Redirect URI and Logout URI change callbacks removed - functionality can be handled by parent via onChange
		},
		[credentials, onChange, flowKey]
	);

	const handleDiscovery = useCallback(async () => {
		if (!discoveryInput.trim()) {
			toastV8.error('Please enter an issuer URL or environment ID');
			return;
		}

		setIsDiscovering(true);
		try {
			console.log(`${MODULE_TAG} Starting OIDC discovery`, { input: discoveryInput });
			const result = await OidcDiscoveryServiceV8.discoverFromInput(discoveryInput);

			if (result.success && result.data) {
				console.log(`${MODULE_TAG} Discovery successful`, result.data);
				setDiscoveryResult(result.data);
				setShowDiscoveryModal(true);
				onDiscoveryComplete?.(result.data);
			} else {
				console.error(`${MODULE_TAG} Discovery failed`, result.error);
				toastV8.error(result.error || 'Discovery failed');
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Discovery error`, error);
			toastV8.error('Discovery failed - check the issuer URL');
		} finally {
			setIsDiscovering(false);
		}
	}, [discoveryInput, onDiscoveryComplete]);

	const handleApplyDiscovery = useCallback(
		(result: OidcDiscoveryResult) => {
			console.log(`${MODULE_TAG} Applying discovery result`, result);
			const updated = {
				...credentials,
				issuerUrl: result.issuer,
				scopes: result.scopesSupported?.join(' ') || credentials.scopes,
			};
			onChange(updated);
			toastV8.success('OIDC configuration applied!');
			setDiscoveryInput('');
		},
		[credentials, onChange]
	);

	const handleAppSelected = useCallback(
		(app: DiscoveredApp) => {
			console.log(`${MODULE_TAG} App selected`, { appId: app.id, appName: app.name });
			const updated = {
				...credentials,
				clientId: app.id,
				redirectUri: app.redirectUris?.[0] || credentials.redirectUri,
				postLogoutRedirectUri: app.logoutUris?.[0] || credentials.postLogoutRedirectUri,
			};
			onChange(updated);
		},
		[credentials, onChange]
	);

	const defaultTitle = title || 'OAuth 2.0 Configure App & Environment';
	const defaultSubtitle = subtitle || `Configure credentials for ${flowType} flow`;

	return (
		<div className="credentials-form-v8">
			<div
				role="button"
				tabIndex={0}
				className="collapsible-header"
				onClick={() => setIsExpanded(!isExpanded)}
			>
				<div className="header-content">
					<h2>{defaultTitle}</h2>
					<span className={`chevron ${isExpanded ? 'open' : ''}`}>›</span>
				</div>
				{defaultSubtitle && <p>{defaultSubtitle}</p>}
			</div>

			{isExpanded && (
				<div className="form-sections">
					{/* APP PICKER SECTION - FIRST! */}
					<div className="form-section" data-section="app-picker">
						<div className="section-header">
							<h3>📱 Discover Applications</h3>
						</div>
						<div className="section-content">
							<AppPickerV8
								environmentId={credentials.environmentId}
								onAppSelected={handleAppSelected}
							/>
						</div>
					</div>

					{/* CONFIGURATION & CREDENTIALS SECTION */}
					<div className="form-section" data-section="credentials">
						<div className="section-header">
							<h3>⚡ Configuration & Credentials</h3>
						</div>
						<div className="section-content">
							{/* Client Type */}
							<div className="form-group">
								<div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
									<label
										style={{ fontWeight: '600', fontSize: '13px', color: '#1f2937', margin: 0 }}
										htmlFor="clienttype"
									>
										Client Type
									</label>
									<TooltipV8
										title={TooltipContentServiceV8.CLIENT_TYPE.title}
										content={TooltipContentServiceV8.CLIENT_TYPE.content}
									/>
								</div>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
									<label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '6px',
											cursor: 'pointer',
											fontSize: '13px',
										}}
									>
										<input
											type="radio"
											name="clientType"
											value="public"
											checked={clientType === 'public'}
											onChange={() => setClientType('public')}
										/>
										<span>Public Client</span>
									</label>
									<label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '6px',
											cursor: 'pointer',
											fontSize: '13px',
										}}
									>
										<input
											type="radio"
											name="clientType"
											value="confidential"
											checked={clientType === 'confidential'}
											onChange={() => setClientType('confidential')}
										/>
										<span>Confidential Client</span>
									</label>
								</div>
							</div>

							{/* Application Type */}
							<div className="form-group">
								<div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
									<label
										style={{ fontWeight: '600', fontSize: '13px', color: '#1f2937', margin: 0 }}
										htmlFor="applicationtype"
									>
										Application Type
									</label>
									<TooltipV8
										title={TooltipContentServiceV8.APPLICATION_TYPE.title}
										content={TooltipContentServiceV8.APPLICATION_TYPE.content}
									/>
								</div>
								<select
									value={appType}
									onChange={(e) => setAppType(e.target.value as AppType)}
									style={{
										width: '100%',
										padding: '6px',
										border: '1px solid #d1d5db',
										borderRadius: '4px',
										fontSize: '12px',
										fontFamily: 'inherit',
									}}
								>
									<option value="web">Web Application</option>
									<option value="spa">Single Page Application (SPA)</option>
									<option value="mobile">Mobile Application</option>
									<option value="desktop">Desktop Application</option>
									<option value="cli">Command Line Interface (CLI)</option>
									<option value="m2m">Machine-to-Machine (M2M)</option>
									<option value="backend">Backend Service</option>
								</select>
							</div>

							{/* Environment ID */}
							<div className="form-group">
								<label>
									Environment ID <span className="required">*</span>
								</label>
								<input
									type="text"
									placeholder="12345678-1234-1234-1234-123456789012"
									value={credentials.environmentId}
									onChange={(e) => handleChange('environmentId', e.target.value)}
									aria-label="Environment ID"
								/>
								<small>Your PingOne environment identifier</small>
							</div>

							{/* Client ID */}
							<div className="form-group">
								<label>
									Client ID <span className="required">*</span>
								</label>
								<input
									type="text"
									placeholder="abc123def456..."
									value={credentials.clientId}
									onChange={(e) => handleChange('clientId', e.target.value)}
									aria-label="Client ID"
								/>
								<small>Public identifier for your application</small>
							</div>

							{/* Client Secret - Only if flow supports it */}
							{flowOptions.requiresClientSecret ||
							(!flowOptions.requiresClientSecret && config.includeClientSecret) ? (
								<div className="form-group">
									<label>
										Client Secret
										{flowOptions.requiresClientSecret ? (
											<span className="required">*</span>
										) : (
											<span className="optional">(optional)</span>
										)}
									</label>
									<input
										type="password"
										placeholder="••••••••••••••••"
										value={credentials.clientSecret || ''}
										onChange={(e) => handleChange('clientSecret', e.target.value)}
										aria-label="Client Secret"
									/>
									<small>Keep this secure - never expose in client-side code</small>
								</div>
							) : null}
						</div>
					</div>

					{/* Spec Version & Flow Type Selection */}
					<div className="form-section" data-section="spec">
						<div className="section-header">
							<h3>📋 Specification & Flow Type</h3>
						</div>
						<div className="section-content">
							{/* Spec Version Radio Buttons */}
							<div className="form-group" style={{ marginBottom: '16px' }}>
								<label
									style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}
									htmlFor="specificationversion"
								>
									Specification Version
								</label>
								<div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
									{UnifiedFlowOptionsServiceV8.getAllSpecVersionsWithLabels().map((spec) => (
										<label
											key={spec.type}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '6px',
												cursor: 'pointer',
											}}
										>
											<input
												type="radio"
												name="specVersion"
												value={spec.type}
												checked={specVersion === spec.type}
												onChange={(e) => {
													setSpecVersion(e.target.value as SpecVersion);
													toastV8.info(`${spec.label} selected`);
												}}
												style={{ cursor: 'pointer' }}
											/>
											<span>{spec.label}</span>
										</label>
									))}
								</div>
								<small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
									{
										UnifiedFlowOptionsServiceV8.getAllSpecVersionsWithLabels().find(
											(s) => s.type === specVersion
										)?.description
									}
								</small>
							</div>

							{/* Flow Type Dropdown */}
							<div className="form-group">
								<label
									style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}
									htmlFor="flowtype"
								>
									Flow Type
								</label>
								<select
									value={effectiveFlowType}
									onChange={(e) => setSelectedFlowType(e.target.value as FlowType)}
									style={{
										width: '100%',
										padding: '10px',
										border: '1px solid #ddd',
										borderRadius: '4px',
										fontSize: '14px',
										fontFamily: 'inherit',
									}}
									aria-label="Flow Type"
								>
									{availableFlows.map((flow) => (
										<option key={flow} value={flow}>
											{SpecVersionServiceV8.getFlowLabel(flow)}
										</option>
									))}
								</select>
								<small style={{ display: 'block', marginTop: '8px', color: '#666' }}>
									Available flows for {SpecVersionServiceV8.getSpecLabel(specVersion)}
								</small>
							</div>

							{/* Compliance Warnings */}
							{complianceWarnings.length > 0 && (
								<div
									style={{
										marginTop: '12px',
										padding: '12px',
										background: '#fef3c7',
										borderRadius: '4px',
										border: '1px solid #fcd34d',
									}}
								>
									<strong style={{ color: '#92400e' }}>⚠️ Compliance Warnings:</strong>
									<ul
										style={{
											margin: '8px 0 0 0',
											paddingLeft: '20px',
											color: '#78350f',
											fontSize: '13px',
										}}
									>
										{complianceWarnings.map((warning, idx) => (
											<li key={idx}>{warning}</li>
										))}
									</ul>
								</div>
							)}
						</div>
					</div>

					{/* OIDC Discovery Section */}
					<div className="form-section" data-section="discovery">
						<div className="section-header">
							<h3>🔍 OIDC Discovery (Optional)</h3>
						</div>
						<div className="section-content">
							<div className="form-group">
								<label htmlFor="issuerurlorenvironmentid">Issuer URL or Environment ID</label>
								<div style={{ display: 'flex', gap: '8px' }}>
									<input
										type="text"
										placeholder="https://auth.example.com or environment-id"
										value={discoveryInput}
										onChange={(e) => setDiscoveryInput(e.target.value)}
										aria-label="Discovery input"
										style={{ flex: 1 }}
									/>
									<button
										type="button"
										onClick={handleDiscovery}
										disabled={isDiscovering}
										style={{
											padding: '10px 16px',
											background: isDiscovering ? '#9ca3af' : '#3b82f6',
											color: 'white',
											border: 'none',
											borderRadius: '4px',
											fontSize: '14px',
											fontWeight: '600',
											cursor: isDiscovering ? 'not-allowed' : 'pointer',
											transition: 'background 0.2s ease',
											whiteSpace: 'nowrap',
										}}
										onMouseEnter={(e) => {
											if (!isDiscovering) {
												e.currentTarget.style.background = '#2563eb';
											}
										}}
										onMouseLeave={(e) => {
											if (!isDiscovering) {
												e.currentTarget.style.background = '#3b82f6';
											}
										}}
									>
										{isDiscovering ? '🔄 Discovering...' : '🔍 OIDC Discovery'}
									</button>
								</div>
								<small>Auto-populate configuration from OIDC metadata</small>
							</div>
						</div>
					</div>

					{/* OIDC Discovery Modal */}
					<OidcDiscoveryModalV8
						isOpen={showDiscoveryModal}
						result={discoveryResult}
						onClose={() => setShowDiscoveryModal(false)}
						onApply={handleApplyDiscovery}
					/>

					{/* Redirect URI Section - Only if flow requires it */}
					{flowOptions.requiresRedirectUri && (
						<div className="form-section" data-section="redirect">
							<div className="section-header">
								<h3>🔄 Redirect Configuration</h3>
							</div>
							<div className="section-content">
								<div className="form-group">
									<div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
										<label style={{ margin: 0 }}>
											Redirect URI <span className="required">*</span>
										</label>
										<TooltipV8
											title={TooltipContentServiceV8.REDIRECT_URI.title}
											content={TooltipContentServiceV8.REDIRECT_URI.content}
										/>
									</div>
									<input
										type="text"
										placeholder={RedirectUriServiceV8.getRedirectUriPlaceholder(flowKey)}
										value={credentials.redirectUri || ''}
										onChange={(e) => handleChange('redirectUri', e.target.value)}
										aria-label="Redirect URI"
									/>
									<small style={{ color: '#6b7280' /* Muted text on light background */ }}>
										⚠️ Must EXACTLY match PingOne app config (flow-specific endpoint)
									</small>
									{appConfig?.redirectUris &&
										!appConfig.redirectUris.includes(credentials.redirectUri || '') && (
											<small style={{ color: '#ff9800' }}>
												⚠️ Not registered in app - update app config
											</small>
										)}
								</div>
							</div>
						</div>
					)}

					{/* Redirectless Checkbox - For flows that don't require redirect URI */}
					{checkboxAvailability.showRedirectless && (
						<div className="form-section" data-section="redirectless">
							<div className="section-header">
								<h3>🔌 Redirect Configuration</h3>
							</div>
							<div className="section-content">
								<div
									className="form-group"
									style={{
										padding: '12px',
										background: '#dbeafe',
										borderRadius: '4px',
										border: '1px solid #93c5fd',
									}}
								>
									<label
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '8px',
											cursor: 'pointer',
											margin: 0,
										}}
									>
										<input
											type="checkbox"
											checked={useRedirectless}
											onChange={(e) => {
												setUseRedirectless(e.target.checked);
												if (e.target.checked) {
													toastV8.info('Redirectless mode enabled - no redirect URI needed');
												}
											}}
											style={{ cursor: 'pointer' }}
										/>
										<span style={{ fontWeight: '600', color: '#0c4a6e' }}>
											🔌 Use Redirectless Mode
										</span>
									</label>
									<small style={{ display: 'block', marginTop: '6px', color: '#0c4a6e' }}>
										{useRedirectless
											? 'Redirectless mode enabled - flow does not require a redirect URI'
											: 'Enable for flows that do not use redirect URIs (e.g., Client Credentials, Device Code)'}
									</small>
								</div>
							</div>
						</div>
					)}

					{/* Post-Logout Redirect URI Section - Only if flow supports it */}
					{flowOptions.supportsPostLogoutRedirectUri && (
						<div className="form-section" data-section="logout">
							<div className="section-header">
								<h3>🚪 Logout Configuration</h3>
							</div>
							<div className="section-content">
								<div className="form-group">
									<div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
										<label style={{ margin: 0 }}>
											Post-Logout Redirect URI <span className="optional">(optional)</span>
										</label>
										<TooltipV8
											title={TooltipContentServiceV8.POST_LOGOUT_REDIRECT_URI.title}
											content={TooltipContentServiceV8.POST_LOGOUT_REDIRECT_URI.content}
										/>
									</div>
									<input
										type="text"
										placeholder={RedirectUriServiceV8.getPostLogoutRedirectUriPlaceholder(flowKey)}
										value={credentials.postLogoutRedirectUri || ''}
										onChange={(e) => handleChange('postLogoutRedirectUri', e.target.value)}
										aria-label="Post-Logout Redirect URI"
									/>
									<small style={{ color: '#6b7280' /* Muted text on light background */ }}>
										⚠️ Must match PingOne "Sign Off URLs" (OIDC only)
									</small>
									{appConfig?.logoutUris &&
										credentials.postLogoutRedirectUri &&
										!appConfig.logoutUris.includes(credentials.postLogoutRedirectUri) && (
											<small style={{ color: '#ff9800' }}>
												⚠️ Not registered in app - update app config
											</small>
										)}
								</div>
							</div>
						</div>
					)}

					{/* Scopes Section - Only if flow uses scopes */}
					{config.includeScopes && (
						<div className="form-section" data-section="permissions">
							<div className="section-header">
								<h3>🔐 Permissions</h3>
							</div>
							<div className="section-content">
								<div className="form-group">
									<div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
										<label style={{ margin: 0 }}>
											Scopes <span className="required">*</span>
										</label>
										<TooltipV8
											title={TooltipContentServiceV8.SCOPES.title}
											content={TooltipContentServiceV8.SCOPES.content}
										/>
									</div>
									<input
										type="text"
										placeholder="openid profile email"
										value={credentials.scopes || ''}
										onChange={(e) => handleChange('scopes', e.target.value)}
										aria-label="Scopes"
									/>
									<small style={{ color: '#6b7280' /* Muted text on light background */ }}>
										Space-separated permissions (must be enabled in PingOne app)
									</small>
								</div>
							</div>
						</div>
					)}

					{/* Advanced Configuration Section */}
					<div className="form-section" data-section="advanced">
						<div
							role="button"
							tabIndex={0}
							className="section-header"
							onClick={() => setShowAdvancedSection(!showAdvancedSection)}
							style={{ cursor: 'pointer' }}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									width: '100%',
								}}
							>
								<h3>⚙️ Advanced Configuration</h3>
								<span
									style={{
										fontSize: '18px',
										transform: showAdvancedSection ? 'rotate(90deg)' : 'rotate(0deg)',
										transition: 'transform 0.3s ease',
									}}
								>
									›
								</span>
							</div>
						</div>
						{showAdvancedSection && (
							<div className="section-content">
								<div
									style={{
										padding: '12px',
										background: '#f0f9ff',
										borderRadius: '4px',
										marginBottom: '12px',
										fontSize: '13px',
										color: '#0c4a6e',
									}}
								>
									<strong>Advanced Options:</strong> Configure additional OAuth/OIDC parameters for
									your flow
								</div>

								{/* PKCE Toggle - Only for Authorization Code Flow */}
								{(flowKey.includes('oauth-authz') || flowKey.includes('authorization-code')) && (
									<div
										className="form-group"
										style={{
											marginBottom: '16px',
											padding: '12px',
											background: '#fef3c7',
											borderRadius: '4px',
											border: '1px solid #fcd34d',
										}}
									>
										<label
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												cursor: 'pointer',
												margin: 0,
											}}
										>
											<input
												type="checkbox"
												checked={usePKCE}
												onChange={(e) => {
													setUsePKCE(e.target.checked);
													if (e.target.checked) {
														toastV8.info('PKCE enabled - using public client configuration');
													}
												}}
												style={{ cursor: 'pointer' }}
											/>
											<span style={{ fontWeight: '600', color: '#92400e' }}>
												🔐 Use PKCE (Proof Key for Code Exchange)
											</span>
										</label>
										<small style={{ display: 'block', marginTop: '6px', color: '#78350f' }}>
											{usePKCE
												? 'PKCE enabled - Client Secret will be hidden and Auth Method locked to None'
												: 'Enable PKCE for enhanced security with public clients'}
										</small>
									</div>
								)}

								{/* Response Type - Only show if flow supports it */}
								{flowOptions.responseTypes.length > 0 && (
									<div className="form-group">
										<label htmlFor="responsetype">Response Type</label>
										<select
											value={credentials.responseType || flowOptions.defaultResponseType}
											onChange={(e) => handleChange('responseType', e.target.value)}
											aria-label="Response Type"
										>
											{flowOptions.responseTypes.map((type) => (
												<option key={type} value={type}>
													{FlowOptionsServiceV8.getResponseTypeLabel(type)}
												</option>
											))}
										</select>
										<small>Response type for the authorization endpoint</small>
									</div>
								)}

								{/* Token Endpoint Authentication Method - Smart filtering */}
								{showClientAuthMethod && (
									<div className="form-group">
										<label htmlFor="tokenendpointauthenticationmethod">
											Token Endpoint Authentication Method
										</label>
										<select
											value={credentials.clientAuthMethod || flowOptions.defaultAuthMethod}
											onChange={(e) => handleChange('clientAuthMethod', e.target.value)}
											aria-label="Token Endpoint Authentication Method"
										>
											{FlowOptionsServiceV8.getAllAuthMethods().map((method) => {
												const isAvailable = flowOptions.authMethods.includes(method);
												return (
													<option key={method} value={method} disabled={!isAvailable}>
														{FlowOptionsServiceV8.getAuthMethodLabel(method)}
														{!isAvailable ? ' (not available for this flow)' : ''}
													</option>
												);
											})}
										</select>
										<small>How the client authenticates with the token endpoint</small>
									</div>
								)}

								{/* PKCE Enforcement Info */}
								{flowOptions.responseTypes.length > 0 && (
									<div className="form-group">
										<label htmlFor="pkceenforcement">PKCE Enforcement</label>
										<div
											style={{
												padding: '8px 12px',
												background: '#f0f9ff',
												borderRadius: '4px',
												border: '1px solid #bfdbfe',
											}}
										>
											<strong>
												{FlowOptionsServiceV8.getPKCELabel(flowOptions.pkceEnforcement)}
											</strong>
											<small style={{ display: 'block', marginTop: '4px', color: '#0c4a6e' }}>
												{flowOptions.pkceEnforcement === 'REQUIRED' &&
													'PKCE is required for this flow'}
												{flowOptions.pkceEnforcement === 'OPTIONAL' &&
													'PKCE is optional but recommended'}
												{flowOptions.pkceEnforcement === 'NOT_REQUIRED' &&
													'PKCE is not used for this flow'}
											</small>
										</div>
									</div>
								)}

								{/* Refresh Token Support */}
								{flowOptions.supportsRefreshToken && (
									<div
										className="form-group"
										style={{
											marginTop: '16px',
											padding: '12px',
											background: '#dbeafe',
											borderRadius: '4px',
											border: '1px solid #93c5fd',
										}}
									>
										<label
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												cursor: 'pointer',
												margin: 0,
											}}
										>
											<input
												type="checkbox"
												checked={enableRefreshToken}
												onChange={(e) => setEnableRefreshToken(e.target.checked)}
												style={{ cursor: 'pointer' }}
											/>
											<span style={{ fontWeight: '600', color: '#0c4a6e' }}>
												🔄 Enable Refresh Token
											</span>
										</label>
										<small style={{ display: 'block', marginTop: '6px', color: '#0c4a6e' }}>
											{enableRefreshToken
												? 'Refresh tokens enabled - users can obtain new access tokens without re-authenticating'
												: 'Allow users to refresh access tokens without re-authenticating'}
										</small>
									</div>
								)}

								{/* Issuer URL */}
								<div className="form-group">
									<label>
										Issuer URL <span className="optional">(optional)</span>
									</label>
									<input
										type="text"
										placeholder="https://auth.example.com"
										value={credentials.issuerUrl || ''}
										onChange={(e) => handleChange('issuerUrl', e.target.value)}
										aria-label="Issuer URL"
									/>
									<small>OIDC provider issuer URL</small>
								</div>
							</div>
						)}
					</div>

					{/* Additional Options Section - Only if flow supports them */}
					{flowOptions.supportsLoginHint && (
						<div className="form-section" data-section="additional">
							<div className="section-header">
								<h3>📋 Additional Options</h3>
							</div>
							<div className="section-content">
								{flowOptions.supportsLoginHint && showLoginHint && (
									<div className="form-group">
										<label>
											Login Hint <span className="optional">(optional)</span>
										</label>
										<input
											type="text"
											placeholder="user@example.com"
											value={credentials.loginHint || ''}
											onChange={(e) => handleChange('loginHint', e.target.value)}
											aria-label="Login Hint"
										/>
										<small>Pre-fill login with user identifier</small>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Save Button */}
					<div className="form-actions">
						<button
							type="button"
							className="btn-save"
							onClick={() => {
								toastV8.credentialsSaved();
								console.log(`${MODULE_TAG} Credentials saved`, { flowKey });
							}}
						>
							💾 Save Credentials
						</button>
					</div>
				</div>
			)}

			<style>{`
				.credentials-form-v8 {
					width: 100%;
					border: 1px solid #cbd5e1;
					border-radius: 6px;
					overflow: hidden;
					background: white;
				}

				.collapsible-header {
					background: linear-gradient(to right, #dbeafe 0%, #e0f2fe 100%);
					padding: 16px 20px;
					cursor: pointer;
					user-select: none;
					border-bottom: 2px solid #3b82f6;
					transition: background 0.2s ease;
				}

				.collapsible-header:hover {
					background: linear-gradient(to right, #bfdbfe 0%, #cffafe 100%);
				}

				.header-content {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 12px;
				}

				.collapsible-header h2 {
					font-size: 16px;
					font-weight: 700;
					margin: 0;
					color: #ffffff;
				}

				.chevron {
					font-size: 24px;
					color: #3b82f6;
					transition: transform 0.3s ease;
					display: flex;
					align-items: center;
					justify-content: center;
					width: 24px;
					height: 24px;
					font-weight: bold;
				}

				.chevron.open {
					transform: rotate(90deg);
				}

				.collapsible-header p {
					font-size: 13px;
					color: #ffffff;
					margin: 4px 0 0 0;
					opacity: 0.9;
				}

				.form-sections {
					padding: 0;
					display: flex;
					flex-direction: column;
				}

				.form-section {
					border-bottom: 1px solid #e2e8f0;
				}

				.form-section:last-child {
					border-bottom: none;
				}

				/* Subtle color coding for each section */
				.form-section[data-section="app-picker"] .section-header {
					background: linear-gradient(to right, #f0fdf4 0%, #dcfce7 100%);
					border-bottom: 1px solid #bbf7d0;
				}
				.form-section[data-section="app-picker"] .section-header h3 {
					color: #166534;
				}

				.form-section[data-section="credentials"] .section-header {
					background: linear-gradient(to right, #fef3c7 0%, #fde68a 100%);
					border-bottom: 1px solid #fcd34d;
				}
				.form-section[data-section="credentials"] .section-header h3 {
					color: #92400e;
				}

				.form-section[data-section="spec"] .section-header {
					background: linear-gradient(to right, #e0e7ff 0%, #c7d2fe 100%);
					border-bottom: 1px solid #a5b4fc;
				}
				.form-section[data-section="spec"] .section-header h3 {
					color: #3730a3;
				}

				.form-section[data-section="discovery"] .section-header {
					background: linear-gradient(to right, #dbeafe 0%, #bfdbfe 100%);
					border-bottom: 1px solid #93c5fd;
				}
				.form-section[data-section="discovery"] .section-header h3 {
					color: #1e40af;
				}

				.form-section[data-section="redirect"] .section-header,
				.form-section[data-section="redirectless"] .section-header {
					background: linear-gradient(to right, #fce7f3 0%, #fbcfe8 100%);
					border-bottom: 1px solid #f9a8d4;
				}
				.form-section[data-section="redirect"] .section-header h3,
				.form-section[data-section="redirectless"] .section-header h3 {
					color: #831843;
				}

				.form-section[data-section="logout"] .section-header {
					background: linear-gradient(to right, #f3e8ff 0%, #e9d5ff 100%);
					border-bottom: 1px solid #d8b4fe;
				}
				.form-section[data-section="logout"] .section-header h3 {
					color: #6b21a8;
				}

				.form-section[data-section="permissions"] .section-header {
					background: linear-gradient(to right, #fef2f2 0%, #fee2e2 100%);
					border-bottom: 1px solid #fecaca;
				}
				.form-section[data-section="permissions"] .section-header h3 {
					color: #991b1b;
				}

				.form-section[data-section="advanced"] .section-header {
					background: linear-gradient(to right, #f5f3ff 0%, #ede9fe 100%);
					border-bottom: 1px solid #ddd6fe;
				}
				.form-section[data-section="advanced"] .section-header h3 {
					color: #5b21b6;
				}

				.form-section[data-section="additional"] .section-header {
					background: linear-gradient(to right, #ecfeff 0%, #cffafe 100%);
					border-bottom: 1px solid #a5f3fc;
				}
				.form-section[data-section="additional"] .section-header h3 {
					color: #155e75;
				}

				.section-header {
					padding: 12px 20px;
				}

				.section-header h3 {
					font-size: 14px;
					font-weight: 600;
					margin: 0;
				}

				.section-content {
					padding: 16px 20px;
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
					gap: 12px;
					background: #fafafa;
				}

				.form-actions {
					padding: 16px 20px;
					border-top: 1px solid #e2e8f0;
					background: #f8fafc;
					display: flex;
					gap: 12px;
				}

				.btn-save {
					padding: 10px 20px;
					background: #3b82f6;
					color: white;
					border: none;
					border-radius: 4px;
					font-size: 14px;
					font-weight: 600;
					cursor: pointer;
					transition: background 0.2s ease;
				}

				.btn-save:hover {
					background: #2563eb;
				}

				.btn-save:active {
					background: #1d4ed8;
				}

				.form-group {
					display: flex;
					flex-direction: column;
					gap: 4px;
				}

				.form-group label {
					font-size: 12px;
					font-weight: 500;
					color: #333;
				}

				.required {
					color: #ef5350;
					margin-left: 2px;
				}

				.optional {
					color: #999;
					font-size: 11px;
					margin-left: 2px;
				}

				.form-group input,
				.form-group select {
					padding: 8px 10px;
					border: 1px solid #ddd;
					border-radius: 4px;
					font-size: 13px;
					font-family: monospace;
					background: white;
					color: #333;
				}

				.form-group input:focus,
				.form-group select:focus {
					outline: none;
					border-color: #3b82f6;
					box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
				}

				.form-group small {
					font-size: 11px;
					color: #666;
					margin-top: 2px;
				}

				@media (max-width: 600px) {
					.credentials-grid {
						grid-template-columns: 1fr;
					}
				}
			`}</style>
		</div>
	);
};

export default CredentialsFormV8;
