// src/services/comprehensiveCredentialsService.tsx
// Comprehensive Credentials Service - All-in-one configuration for OAuth/OIDC flows

import React, { useCallback, useEffect, useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import styled from 'styled-components';
import ComprehensiveDiscoveryInput from '../components/ComprehensiveDiscoveryInput';
import { CredentialsInput } from '../components/CredentialsInput';
import PingOneApplicationConfig, {
	type PingOneApplicationState,
} from '../components/PingOneApplicationConfig';
import { CollapsibleHeader } from './collapsibleHeaderService';
import { DiscoveryResult } from './comprehensiveDiscoveryService';
import { oidcDiscoveryService } from './oidcDiscoveryService';

export interface ComprehensiveCredentialsProps {
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
	loginHint?: string;
	postLogoutRedirectUri?: string;
	onEnvironmentIdChange?: (newEnvId: string) => void;
	onClientIdChange?: (newClientId: string) => void;
	onClientSecretChange?: (newSecret: string) => void;
	onRedirectUriChange?: (newUri: string) => void;
	onScopesChange?: (newScopes: string) => void;
	onLoginHintChange?: (newLoginHint: string) => void;
	onPostLogoutRedirectUriChange?: (newUri: string) => void;
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
}

const ServiceContainer = styled.div`
	margin-bottom: 2rem;
`;

const AdvancedConfigSection = styled.div`
	margin-top: 2rem;
	padding-top: 2rem;
	border-top: 1px solid #e5e7eb;
`;

const ComprehensiveCredentialsService: React.FC<ComprehensiveCredentialsProps> = ({
	// Discovery props
	onDiscoveryComplete,
	initialDiscoveryInput,
	discoveryPlaceholder = 'Enter Environment ID, issuer URL, or provider...',
	showProviderInfo = true,

	// Credentials props
	environmentId = '',
	clientId = '',
	clientSecret = '',
	redirectUri = 'https://localhost:3000/oauth-implicit-callback',
	scopes = 'openid profile email',
	loginHint = '',
	postLogoutRedirectUri = 'https://localhost:3000/logout-callback',
	onEnvironmentIdChange,
	onClientIdChange,
	onClientSecretChange,
	onRedirectUriChange,
	onScopesChange,
	onLoginHintChange,
	onPostLogoutRedirectUriChange,
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
	title = 'OIDC discovery & PingOne Config',
	subtitle = 'Complete configuration for OAuth/OIDC flows with discovery and advanced settings',
	showAdvancedConfig = true,
	defaultCollapsed = false,
}) => {
	const [isAdvancedConfigCollapsed, setIsAdvancedConfigCollapsed] = useState(true);

	const handleAdvancedConfigToggle = useCallback(() => {
		setIsAdvancedConfigCollapsed((prev) => !prev);
	}, []);

	// Handle discovery completion and update environment ID
	const handleInternalDiscoveryComplete = useCallback(
		(result: DiscoveryResult) => {
			// Extract environment ID from issuer URL using the dedicated service
			if (result.issuerUrl && onEnvironmentIdChange) {
				const extractedEnvId = oidcDiscoveryService.extractEnvironmentId(result.issuerUrl);
				if (extractedEnvId) {
					console.log(
						'[ComprehensiveCredentialsService] Auto-populating environment ID:',
						extractedEnvId
					);
					onEnvironmentIdChange(extractedEnvId);

					// 🆕 CROSS-FLOW DISCOVERY PERSISTENCE
					// Save discovery results for cross-flow sharing
					try {
						const sharedConfig = {
							environmentId: extractedEnvId,
							issuerUrl: result.issuerUrl,
							discoveryResult: result.document,
							timestamp: Date.now(),
						};
						localStorage.setItem('shared-oidc-discovery', JSON.stringify(sharedConfig));
						console.log(
							'[ComprehensiveCredentialsService] ✅ Discovery saved for cross-flow sharing'
						);
					} catch (error) {
						console.error('[ComprehensiveCredentialsService] Failed to save discovery:', error);
					}
				}
			}
			// Call parent handler
			if (onDiscoveryComplete) {
				onDiscoveryComplete(result);
			}
		},
		[onDiscoveryComplete, onEnvironmentIdChange]
	);

	// 🆕 AUTO-LOAD SAVED DISCOVERY ON MOUNT
	useEffect(() => {
		// Only auto-load if we don't already have an environment ID
		if (environmentId) {
			return; // Already have environment ID, don't override
		}

		try {
			const saved = localStorage.getItem('shared-oidc-discovery');
			if (saved && onEnvironmentIdChange) {
				const config = JSON.parse(saved);

				// Check if discovery is still fresh (within 1 hour)
				const ONE_HOUR = 3600000;
				if (Date.now() - config.timestamp < ONE_HOUR) {
					onEnvironmentIdChange(config.environmentId);
					console.log(
						'[ComprehensiveCredentialsService] ✅ Auto-loaded shared discovery:',
						config.environmentId
					);
					console.log(
						'[ComprehensiveCredentialsService] Discovery age:',
						Math.round((Date.now() - config.timestamp) / 60000),
						'minutes'
					);
				} else {
					console.log(
						'[ComprehensiveCredentialsService] ⏰ Saved discovery expired, skipping auto-load'
					);
					localStorage.removeItem('shared-oidc-discovery'); // Clean up expired data
				}
			}
		} catch (error) {
			console.error('[ComprehensiveCredentialsService] Failed to load shared discovery:', error);
		}
	}, [environmentId, onEnvironmentIdChange]);

	return (
		<ServiceContainer>
			<CollapsibleHeader
				title={title}
				subtitle={subtitle}
				icon={<FiSettings />}
				defaultCollapsed={defaultCollapsed}
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
					environmentId={environmentId}
					clientId={clientId}
					clientSecret={clientSecret}
					redirectUri={redirectUri}
					scopes={scopes}
					loginHint={loginHint}
					postLogoutRedirectUri={postLogoutRedirectUri}
					onEnvironmentIdChange={onEnvironmentIdChange || (() => {})}
					onClientIdChange={onClientIdChange || (() => {})}
					onClientSecretChange={onClientSecretChange || (() => {})}
					onRedirectUriChange={onRedirectUriChange || (() => {})}
					onScopesChange={onScopesChange || (() => {})}
					onLoginHintChange={onLoginHintChange || (() => {})}
					onPostLogoutRedirectUriChange={onPostLogoutRedirectUriChange || (() => {})}
					showClientSecret={requireClientSecret}
					showRedirectUri={true}
					showPostLogoutRedirectUri={true}
					showLoginHint={true}
					onSave={onSave || (() => {})}
					hasUnsavedChanges={hasUnsavedChanges}
					isSaving={isSaving}
				/>

				{/* PingOne Advanced Configuration */}
				{showAdvancedConfig && pingOneAppState && onPingOneAppStateChange && (
					<AdvancedConfigSection>
						<CollapsibleHeader
							title="PingOne Advanced Configuration"
							subtitle="Advanced PingOne application settings and security options"
							icon={<FiSettings />}
							defaultCollapsed={isAdvancedConfigCollapsed}
							onToggle={handleAdvancedConfigToggle}
						>
							<div
								style={{
									position: 'relative',
									height: 'auto',
									minHeight: 'auto',
									overflowY: 'visible',
								}}
							>
								<PingOneApplicationConfig
									value={pingOneAppState}
									onChange={onPingOneAppStateChange}
									{...(onPingOneSave && { onSave: onPingOneSave })}
									isSaving={isSavingPingOne}
									hasUnsavedChanges={hasUnsavedPingOneChanges}
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
