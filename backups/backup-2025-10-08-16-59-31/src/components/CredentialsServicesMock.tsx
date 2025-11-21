import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { CredentialsInput } from '../components/CredentialsInput';
import EnvironmentIdInput from '../components/EnvironmentIdInput';
import PingOneApplicationConfig, {
	PingOneApplicationState,
} from '../components/PingOneApplicationConfig';
import { type DiscoveryResult, oidcDiscoveryService } from '../services/oidcDiscoveryService';
import { v4ToastManager } from '../utils/v4ToastMessages';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`;

const Section = styled.section`
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const StateCard = styled.div<{ color: string }>`
  padding: 1rem;
  background: ${(props) =>
		props.color === 'yellow' ? '#fef3c7' : props.color === 'blue' ? '#dbeafe' : '#dcfce7'};
  border: 1px solid ${(props) =>
		props.color === 'yellow' ? '#f59e0b' : props.color === 'blue' ? '#3b82f6' : '#22c55e'};
  border-radius: 8px;
`;

const StateTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600;
`;

const CodeBlock = styled.pre`
  font-size: 0.75rem;
  overflow: auto;
  max-height: 200px;
  background: rgba(255, 255, 255, 0.8);
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

const StatusText = styled.p`
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: #4b5563;
`;

const DiscoveryResult = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
`;

const FlowDiagram = styled.div`
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.6;
`;

interface MockCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
	loginHint: string;
}

const CredentialsServicesMock: React.FC = () => {
	// 1. Core Credentials State
	const [credentials, setCredentials] = useState<MockCredentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: 'https://localhost:3000/callback',
		scopes: 'openid profile email',
		loginHint: '',
	});

	// 2. OIDC Discovery State
	const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult['document'] | null>(null);
	const [isDiscovering, setIsDiscovering] = useState(false);

	// 3. PingOne Advanced Configuration State
	const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>({
		clientAuthMethod: 'client_secret_post',
		allowRedirectUriPatterns: false,
		pkceEnforcement: 'REQUIRED',
		responseTypeCode: true,
		responseTypeToken: false,
		responseTypeIdToken: true,
		grantTypeAuthorizationCode: true,
		initiateLoginUri: '',
		targetLinkUri: '',
		signoffUrls: [],
		requestParameterSignatureRequirement: 'DEFAULT',
		enableJWKS: false,
		jwksMethod: 'JWKS_URL',
		jwksUrl: '',
		jwks: '',
		requirePushedAuthorizationRequest: false,
		pushedAuthorizationRequestTimeout: 600,
		additionalRefreshTokenReplayProtection: false,
		includeX5tParameter: false,
		oidcSessionManagement: false,
		requestScopesForMultipleResources: false,
		terminateUserSessionByIdToken: false,
		corsOrigins: [],
		corsAllowAnyOrigin: false,
	});

	// Auto-save functionality
	const autoSaveCredentials = useCallback(async () => {
		if (credentials.environmentId.trim() && credentials.clientId.trim()) {
			console.log('🔄 Auto-saving credentials:', credentials);
			// Here you would call your actual save service
			// await credentialsService.save(credentials);
			v4ToastManager.showSuccess('Credentials auto-saved successfully!');
			return true;
		}
		return false;
	}, [credentials]);

	// Handle field changes with auto-save
	const handleFieldChange = useCallback(
		async (field: keyof MockCredentials, value: string) => {
			const updatedCredentials = { ...credentials, [field]: value };
			setCredentials(updatedCredentials);

			// Auto-save logic based on trigger conditions
			if (field === 'environmentId' && value.trim() && updatedCredentials.clientId.trim()) {
				const saved = await autoSaveCredentials();
				if (saved) {
					v4ToastManager.showSuccess('Auto-saved: Environment ID + Client ID combination');
				}
			} else if (field === 'clientId' && value.trim() && updatedCredentials.environmentId.trim()) {
				const saved = await autoSaveCredentials();
				if (saved) {
					v4ToastManager.showSuccess('Auto-saved: Client ID + Environment ID combination');
				}
			} else if (
				field === 'clientSecret' &&
				value.trim() &&
				updatedCredentials.environmentId.trim() &&
				updatedCredentials.clientId.trim()
			) {
				const saved = await autoSaveCredentials();
				if (saved) {
					v4ToastManager.showSuccess('Auto-saved: Client Secret completed the credential set');
				}
			}
		},
		[credentials, autoSaveCredentials]
	);

	// Handle OIDC Discovery
	const handleDiscoveryComplete = useCallback(
		async (result: DiscoveryResult) => {
			setIsDiscovering(false);
			if (result.success && result.document) {
				console.log('🎯 OIDC Discovery completed:', result.document);
				setDiscoveryResult(result.document);

				// Auto-populate environment ID if it's a PingOne issuer
				if (result.document?.issuer) {
					const envId = oidcDiscoveryService.extractEnvironmentId(result.document.issuer);
					if (envId) {
						await handleFieldChange('environmentId', envId);
						if (credentials.clientId.trim()) {
							v4ToastManager.showSuccess('Auto-saved: OIDC Discovery + Client ID combination');
						}
					}
				}

				v4ToastManager.showSuccess('OIDC Discovery completed successfully!');
			} else {
				v4ToastManager.showError('OIDC Discovery failed: ' + result.error);
			}
		},
		[credentials.clientId, handleFieldChange]
	);

	// Handle PingOne config changes
	const handlePingOneConfigChange = useCallback(
		async (config: PingOneApplicationState) => {
			setPingOneConfig(config);
			console.log('⚙️ PingOne config updated:', config);

			// Auto-save if we have essential credentials
			if (credentials.environmentId.trim() && credentials.clientId.trim()) {
				const saved = await autoSaveCredentials();
				if (saved) {
					v4ToastManager.showSuccess('Auto-saved: PingOne configuration updated');
				}
			}
		},
		[credentials, autoSaveCredentials]
	);

	// Copy functionality
	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard!`);
	}, []);

	return (
		<Container>
			<h1>🧪 OAuth Playground Credentials Services Mock</h1>
			<p>
				This mock demonstrates the integration of three key services with auto-save functionality.
			</p>

			{/* Service Integration Flow */}
			<Section>
				<SectionTitle>📊 Service Integration Flow</SectionTitle>
				<FlowDiagram>
					{`┌─ User Input ─┐     ┌─ CredentialsInput ─┐     ┌─ Auto-save Check ─┐
│              │────▶│                    │────▶│                   │
│ Field Change │     │ State Update       │     │ Trigger Logic     │
└──────────────┘     └────────────────────┘     └───────────────────┘
                                                            │
        ┌─ Environment ID ─┐     ┌─ OIDC Discovery ─┐      ▼
        │                 │────▶│                  │   ┌─ Save ─┐
        │ PingOne Issuer  │     │ Service Call     │   │        │
        └─────────────────┘     └──────────────────┘   │ Toast  │
                                                        └────────┘
        ┌─ Advanced Config ─┐    ┌─ PingOne Config ─┐      ▲
        │                  │───▶│                  │      │
        │ Security Settings│    │ Application State│──────┘
        └──────────────────┘    └──────────────────┘`}
				</FlowDiagram>
			</Section>

			{/* 1. EnvironmentIdInput with OIDC Discovery */}
			<Section>
				<SectionTitle>🌐 OIDC Discovery Service</SectionTitle>
				<p>Handles PingOne environment detection and automatic OIDC endpoint discovery.</p>

				<EnvironmentIdInput
					initialEnvironmentId={credentials.environmentId}
					onEnvironmentIdChange={(envId) => handleFieldChange('environmentId', envId)}
					onDiscoveryComplete={handleDiscoveryComplete}
					showSuggestions={true}
					autoDiscover={true}
				/>

				{discoveryResult && (
					<DiscoveryResult>
						<h4>🎯 Discovery Result:</h4>
						<CodeBlock>{JSON.stringify(discoveryResult, null, 2)}</CodeBlock>
					</DiscoveryResult>
				)}
			</Section>

			{/* 2. CredentialsInput Component */}
			<Section>
				<SectionTitle>🔑 Credentials Input Service</SectionTitle>
				<p>
					Main credential input interface with validation, copy functionality, and auto-save
					triggers.
				</p>

				<CredentialsInput
					environmentId={credentials.environmentId}
					clientId={credentials.clientId}
					clientSecret={credentials.clientSecret}
					redirectUri={credentials.redirectUri}
					scopes={credentials.scopes}
					loginHint={credentials.loginHint}
					onEnvironmentIdChange={(value) => handleFieldChange('environmentId', value)}
					onClientIdChange={(value) => handleFieldChange('clientId', value)}
					onClientSecretChange={(value) => handleFieldChange('clientSecret', value)}
					onRedirectUriChange={(value) => handleFieldChange('redirectUri', value)}
					onScopesChange={(value) => handleFieldChange('scopes', value)}
					onLoginHintChange={(value) => handleFieldChange('loginHint', value)}
					onCopy={handleCopy}
					showRedirectUri={true}
					showLoginHint={true}
					showClientSecret={true}
					showEnvironmentIdInput={false} // Using separate EnvironmentIdInput above
					onDiscoveryComplete={handleDiscoveryComplete}
				/>
			</Section>

			{/* 3. PingOne Application Configuration */}
			<Section>
				<SectionTitle>⚙️ PingOne Advanced Configuration Service</SectionTitle>
				<p>
					Advanced PingOne application settings including authentication methods, PKCE, and security
					features.
				</p>

				<PingOneApplicationConfig value={pingOneConfig} onChange={handlePingOneConfigChange} />
			</Section>

			{/* Current State Display */}
			<Section>
				<SectionTitle>📊 Current State Monitor</SectionTitle>
				<StateGrid>
					<StateCard color="yellow">
						<StateTitle>🔑 Credentials</StateTitle>
						<StatusText>Environment ID: {credentials.environmentId || 'Not set'}</StatusText>
						<StatusText>Client ID: {credentials.clientId || 'Not set'}</StatusText>
						<StatusText>
							Client Secret: {credentials.clientSecret ? '••••••••' : 'Not set'}
						</StatusText>
						<StatusText>
							Auto-save Ready:{' '}
							{credentials.environmentId.trim() && credentials.clientId.trim() ? '✅ Yes' : '❌ No'}
						</StatusText>
						<CodeBlock>{JSON.stringify(credentials, null, 2)}</CodeBlock>
					</StateCard>

					<StateCard color="blue">
						<StateTitle>🌐 Discovery Status</StateTitle>
						<StatusText>Discovering: {isDiscovering ? '🔄 Yes' : '✅ No'}</StatusText>
						<StatusText>Result: {discoveryResult ? '✅ Available' : '❌ None'}</StatusText>
						{discoveryResult && (
							<>
								<StatusText>Issuer: {discoveryResult?.issuer || 'Unknown'}</StatusText>
								<StatusText>Endpoints: {Object.keys(discoveryResult).length}</StatusText>
							</>
						)}
					</StateCard>

					<StateCard color="green">
						<StateTitle>⚙️ PingOne Config</StateTitle>
						<StatusText>Auth Method: {pingOneConfig.clientAuthMethod}</StatusText>
						<StatusText>PKCE: {pingOneConfig.pkceEnforcement}</StatusText>
						<StatusText>
							Response Types:{' '}
							{[
								pingOneConfig.responseTypeCode && 'code',
								pingOneConfig.responseTypeToken && 'token',
								pingOneConfig.responseTypeIdToken && 'id_token',
							]
								.filter(Boolean)
								.join(', ')}
						</StatusText>
						<StatusText>JWKS Enabled: {pingOneConfig.enableJWKS ? '✅ Yes' : '❌ No'}</StatusText>
						<StatusText>
							PAR Required: {pingOneConfig.requirePushedAuthorizationRequest ? '✅ Yes' : '❌ No'}
						</StatusText>
					</StateCard>
				</StateGrid>
			</Section>

			{/* Auto-save Triggers Documentation */}
			<Section>
				<SectionTitle>🎯 Auto-save Trigger Points</SectionTitle>
				<FlowDiagram>
					{`🔄 TRIGGER CONDITIONS:

1. Environment ID + Client ID
   └─ When both core identifiers are present
   └─ Enables basic OAuth flow configuration

2. OIDC Discovery + Client ID  
   └─ After successful .well-known/openid_configuration fetch
   └─ Auto-populates environment ID from PingOne issuer
   └─ Triggers save if client ID already present

3. Client Secret Addition
   └─ When completing the full credential set
   └─ Requires environment ID + client ID already present
   └─ Enables secure OAuth flows

4. PingOne Config Changes
   └─ When updating advanced application settings
   └─ Requires basic credentials (env ID + client ID) present
   └─ Saves enhanced security configuration

5. Manual Save Button
   └─ User-triggered save for confidence
   └─ Always available regardless of auto-save state`}
				</FlowDiagram>
			</Section>
		</Container>
	);
};

export default CredentialsServicesMock;
