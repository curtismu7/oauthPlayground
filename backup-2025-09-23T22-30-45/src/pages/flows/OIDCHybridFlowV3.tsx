// src/pages/flows/OIDCHybridFlowV3.tsx - OIDC 1.0 Hybrid Flow V3
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import {
	FiKey,
	FiGlobe,
	FiShield,
	FiCheckCircle,
	FiAlertTriangle,
	FiCopy,
	FiSettings,
	FiRefreshCw,
	FiUser,
	FiEye,
	FiEyeOff,
	FiExternalLink,
	FiInfo,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import { EnhancedStepFlowV2 } from '../../components/EnhancedStepFlowV2';
import { useFlowStepManager } from '../../utils/flowStepSystem';
import { useAuthorizationFlowScroll } from '../../hooks/usePageScroll';
import { enhancedDebugger } from '../../utils/enhancedDebug';
import { usePerformanceTracking } from '../../hooks/useAnalytics';
import { logger } from '../../utils/logger';
import { copyToClipboard } from '../../utils/clipboard';
import { getCallbackUrlForFlow } from '../../utils/callbackUrls';
import {
	generateRandomString,
	generateCodeVerifier,
	generateCodeChallenge,
} from '../../utils/oauth';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import { showFlowSuccess, showFlowError } from '../../components/CentralizedSuccessMessage';
import ConfirmationModal from '../../components/ConfirmationModal';
import AuthorizationRequestModal from '../../components/AuthorizationRequestModal';
import { InfoBox, FormField, FormLabel, FormInput } from '../../components/steps/CommonSteps';
import TokenDisplay from '../../components/TokenDisplay';
import { ColorCodedURL } from '../../components/ColorCodedURL';

// Styled components
const Container = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  color: #1f2937;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: #1f2937;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #6b7280;
  margin: 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const FlowCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${(props) => {
		switch (props.variant) {
			case 'primary':
				return `
          background: #3b82f6;
          color: white;
          
          &:hover:not(:disabled) {
            background: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          }
        `;
			case 'secondary':
				return `
          background: #f3f4f6;
          color: #374151;
          
          &:hover:not(:disabled) {
            background: #e5e7eb;
          }
        `;
			case 'danger':
				return `
          background: #ef4444;
          color: white;
          
          &:hover:not(:disabled) {
            background: #dc2626;
          }
        `;
			default:
				return `
          background: #3b82f6;
          color: white;
          
          &:hover:not(:disabled) {
            background: #2563eb;
          }
        `;
		}
	}}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
`;

const ParameterBreakdown = styled.div`
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
  border: 1px solid #d1e7ff;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const ParameterItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ParameterLabel = styled.span`
  font-weight: 500;
  color: #374151;
`;

const ParameterValue = styled.span`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: #1f2937;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Types
interface OIDCHybridCredentials {
	environmentId: string;
	clientId: string;
	redirectUri: string;
	scopes: string;
	responseType: string;
	state: string;
	nonce: string;
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: string;
}

interface OIDCHybridTokens {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
}

const OIDCHybridFlowV3: React.FC = () => {
	const { config } = useAuth();
	const stepManager = useFlowStepManager({
		flowType: 'oidc-hybrid-v3',
		persistKey: 'oidc_hybrid_v3_step_manager',
		defaultStep: 0,
	});
	const { scrollToTopAfterAction } = useAuthorizationFlowScroll();

	// State
	const [credentials, setCredentials] = useState<OIDCHybridCredentials>({
		environmentId: config?.environmentId || '',
		clientId: config?.clientId || '',
		redirectUri: getCallbackUrlForFlow('oidc-hybrid-v3'),
		scopes: 'openid profile email',
		responseType: 'code id_token',
		state: '',
		nonce: '',
		codeVerifier: '',
		codeChallenge: '',
		codeChallengeMethod: 'S256',
	});

	const [tokens, setTokens] = useState<OIDCHybridTokens | null>(null);
	const [authorizationUrl, setAuthorizationUrl] = useState<string>('');
	const [showAuthorizationModal, setShowAuthorizationModal] = useState(false);
	const [showResetModal, setShowResetModal] = useState(false);
	const [isRequestingAuthorization, setIsRequestingAuthorization] = useState(false);
	const [showParameterBreakdown, setShowParameterBreakdown] = useState(false);
	const [copiedText, setCopiedText] = useState<string | null>(null);
	const [stepResults, setStepResults] = useState<Record<string, unknown>>({});

	// Load credentials from storage on mount
	useEffect(() => {
		const loadStoredCredentials = async () => {
			try {
				const stored = localStorage.getItem('oidc_hybrid_v3_credentials');
				if (stored) {
					const parsed = JSON.parse(stored);
					setCredentials((prev) => ({ ...prev, ...parsed }));
					logger.info('OIDCHybridV3', '✅ Loaded stored credentials');
				}
			} catch (error) {
				logger.error('OIDCHybridV3', 'Failed to load stored credentials', error);
			}
		};

		loadStoredCredentials();
	}, []);

	// Generate security parameters
	const generateSecurityParameters = useCallback(async () => {
		const state = generateRandomString(32);
		const nonce = generateRandomString(32);
		const codeVerifier = generateCodeVerifier();
		const codeChallenge = await generateCodeChallenge(codeVerifier);

		setCredentials((prev) => ({
			...prev,
			state,
			nonce,
			codeVerifier,
			codeChallenge,
		}));

		logger.info('OIDCHybridV3', '🔐 Generated security parameters', {
			stateLength: state.length,
			nonceLength: nonce.length,
			codeVerifierLength: codeVerifier.length,
			codeChallengeLength: codeChallenge.length,
		});

		return { state, nonce, codeVerifier, codeChallenge };
	}, []);

	// Save credentials
	const saveCredentials = useCallback(async () => {
		try {
			localStorage.setItem('oidc_hybrid_v3_credentials', JSON.stringify(credentials));
			logger.info('OIDCHybridV3', '✅ Credentials saved successfully');
			showFlowSuccess('✅ OIDC Hybrid Flow Credentials Saved', 'Configuration saved successfully.');

			// Auto-generate security parameters
			await generateSecurityParameters();

			return { success: true };
		} catch (error) {
			logger.error('OIDCHybridV3', 'Failed to save credentials', error);
			showFlowError('Failed to save credentials. Please try again.');
			throw error;
		}
	}, [credentials, generateSecurityParameters]);

	// Build authorization URL
	const buildAuthorizationUrl = useCallback(() => {
		if (!credentials.environmentId || !credentials.clientId) {
			throw new Error(
				'Missing required credentials. Please configure Environment ID and Client ID.'
			);
		}

		const baseUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
		const params = new URLSearchParams({
			client_id: credentials.clientId,
			redirect_uri: credentials.redirectUri,
			response_type: credentials.responseType,
			scope: credentials.scopes,
			state: credentials.state,
			nonce: credentials.nonce,
		});

		if (credentials.codeChallenge) {
			params.append('code_challenge', credentials.codeChallenge);
			params.append('code_challenge_method', credentials.codeChallengeMethod);
		}

		const url = `${baseUrl}?${params.toString()}`;
		setAuthorizationUrl(url);

		logger.info('OIDCHybridV3', '🔗 Built authorization URL', {
			baseUrl,
			responseType: credentials.responseType,
			scopes: credentials.scopes,
			hasPKCE: !!credentials.codeChallenge,
		});

		showFlowSuccess(
			'🔗 Authorization URL Built',
			'Security parameters generated and authorization URL created successfully.'
		);
		return url;
	}, [credentials]);

	// Request authorization
	const requestAuthorization = useCallback(async () => {
		if (!authorizationUrl) {
			throw new Error('Authorization URL not built. Please complete previous steps.');
		}

		setIsRequestingAuthorization(true);
		try {
			// Store security parameters for callback validation
			localStorage.setItem(
				'oidc_hybrid_v3_security',
				JSON.stringify({
					state: credentials.state,
					nonce: credentials.nonce,
					codeVerifier: credentials.codeVerifier,
				})
			);

			logger.info('OIDCHybridV3', '🚀 Opening authorization window', {
				url: authorizationUrl,
				responseType: credentials.responseType,
			});

			// Open authorization window
			window.open(
				authorizationUrl,
				'oidc_hybrid_authorization',
				'width=800,height=600,scrollbars=yes,resizable=yes'
			);

			// Show user feedback
			showFlowSuccess(
				'🚀 Authorization Window Opened',
				'A new window has opened for user authentication. Complete the login process in the popup window.'
			);

			return { success: true };
		} catch (error) {
			logger.error('OIDCHybridV3', 'Failed to request authorization', error);
			showFlowError('Failed to request authorization. Please try again.');
			throw error;
		} finally {
			setIsRequestingAuthorization(false);
		}
	}, [authorizationUrl, credentials]);

	// Reset flow
	const resetFlow = useCallback(async () => {
		try {
			// Clear tokens and authorization URL
			setTokens(null);
			setAuthorizationUrl('');
			setStepResults({});

			// Generate new security parameters
			await generateSecurityParameters();

			// Reset to step 0
			stepManager.setStep(0, 'flow reset');
			scrollToTopAfterAction();

			// Show user feedback
			showFlowSuccess(
				'🔄 OIDC Hybrid Flow Reset',
				'Flow has been reset successfully. Ready to start over.'
			);

			return { success: true };
		} catch (error) {
			logger.error('OIDCHybridV3', 'Failed to reset flow', error);
			showFlowError('Failed to reset flow. Please try again.');
			throw error;
		}
	}, [stepManager, scrollToTopAfterAction, generateSecurityParameters]);

	// Define flow steps
	const steps = useMemo(
		() => [
			{
				id: 'setup-credentials',
				title: 'Setup Credentials',
				description: 'Configure your PingOne application credentials for OIDC Hybrid flow',
				icon: <FiSettings />,
				category: 'preparation',
				content: (
					<div>
						<InfoBox type="info" style={{ marginBottom: '1.5rem' }}>
							<div>
								<h4
									style={{
										margin: '0 0 1rem 0',
										color: '#1e40af',
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
									}}
								>
									<FiInfo />
									OIDC Hybrid Flow Configuration
								</h4>
								<p style={{ margin: '0 0 1rem 0', color: '#1e40af' }}>
									The OIDC Hybrid Flow combines authorization code and implicit flows for enhanced
									security and flexibility. It returns both an authorization code and an ID token in
									the authorization response.
								</p>
								<p style={{ margin: '0', color: '#1e40af' }}>
									<strong>Response Type:</strong> {credentials.responseType} (code + id_token)
								</p>
							</div>
						</InfoBox>

						<FormField>
							<FormLabel>Environment ID</FormLabel>
							<FormInput
								type="text"
								value={credentials.environmentId}
								onChange={(e) =>
									setCredentials((prev) => ({ ...prev, environmentId: e.target.value }))
								}
								placeholder="e.g., 12345678-1234-1234-1234-123456789012"
							/>
						</FormField>

						<FormField>
							<FormLabel>Client ID</FormLabel>
							<FormInput
								type="text"
								value={credentials.clientId}
								onChange={(e) => setCredentials((prev) => ({ ...prev, clientId: e.target.value }))}
								placeholder="e.g., 87654321-4321-4321-4321-210987654321"
							/>
						</FormField>

						<FormField>
							<FormLabel>Redirect URI</FormLabel>
							<FormInput
								type="text"
								value={credentials.redirectUri}
								onChange={(e) =>
									setCredentials((prev) => ({ ...prev, redirectUri: e.target.value }))
								}
								placeholder="https://localhost:3000/hybrid-callback"
							/>
						</FormField>

						<FormField>
							<FormLabel>Scopes</FormLabel>
							<FormInput
								type="text"
								value={credentials.scopes}
								onChange={(e) => setCredentials((prev) => ({ ...prev, scopes: e.target.value }))}
								placeholder="openid profile email"
							/>
						</FormField>

						<FormField>
							<FormLabel>Response Type</FormLabel>
							<FormInput
								type="text"
								value={credentials.responseType}
								onChange={(e) =>
									setCredentials((prev) => ({ ...prev, responseType: e.target.value }))
								}
								placeholder="code id_token"
							/>
						</FormField>

						<div style={{ marginTop: '1.5rem' }}>
							<Button
								variant="primary"
								onClick={saveCredentials}
								disabled={
									!credentials.environmentId || !credentials.clientId || !credentials.redirectUri
								}
							>
								<FiSettings />
								Save Credentials
							</Button>
						</div>
					</div>
				),
				execute: saveCredentials,
				canExecute: Boolean(
					credentials.environmentId && credentials.clientId && credentials.redirectUri
				),
				completed: Boolean(credentials.state && credentials.nonce && credentials.codeChallenge),
			},
			{
				id: 'build-authorization-url',
				title: 'Build Authorization URL',
				description: 'Generate security parameters and build the authorization URL',
				icon: <FiGlobe />,
				category: 'authorization',
				content: (
					<div>
						<InfoBox type="info" style={{ marginBottom: '1.5rem' }}>
							<div>
								<h4
									style={{
										margin: '0 0 1rem 0',
										color: '#1e40af',
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
									}}
								>
									<FiGlobe />
									Authorization URL Construction
								</h4>
								<p style={{ margin: '0 0 1rem 0', color: '#1e40af' }}>
									This step generates security parameters (PKCE, state, nonce) and constructs the
									complete authorization URL.
								</p>
							</div>
						</InfoBox>

						<div style={{ marginBottom: '1.5rem' }}>
							<Button
								variant="primary"
								onClick={buildAuthorizationUrl}
								disabled={!credentials.state || !credentials.nonce || !credentials.codeChallenge}
							>
								<FiKey />
								Build Authorization URL
							</Button>
						</div>

						{authorizationUrl && (
							<div
								style={{
									marginTop: '1.5rem',
									padding: '1rem',
									backgroundColor: '#f0f9ff',
									border: '1px solid #bae6fd',
									borderRadius: '0.5rem',
								}}
							>
								<h4
									style={{
										color: '#0369a1',
										marginBottom: '0.75rem',
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
									}}
								>
									<FiGlobe />
									Authorization URL
								</h4>
								<ColorCodedURL url={authorizationUrl} />
								<div style={{ marginTop: '0.75rem' }}>
									<Button
										variant="secondary"
										onClick={() => {
											copyToClipboard(authorizationUrl, 'Authorization URL');
											showFlowSuccess(
												'📋 Authorization URL Copied',
												'The authorization URL has been copied to your clipboard.'
											);
										}}
										style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
									>
										<FiCopy />
										Copy URL
									</Button>
									<Button
										variant="secondary"
										onClick={() => setShowParameterBreakdown(!showParameterBreakdown)}
										style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', marginLeft: '0.5rem' }}
									>
										<FiInfo />
										{showParameterBreakdown ? 'Hide' : 'Show'} Parameters
									</Button>
								</div>

								{showParameterBreakdown && (
									<ParameterBreakdown>
										<h5 style={{ margin: '0 0 1rem 0', color: '#1e40af' }}>URL Parameters</h5>
										<ParameterItem>
											<ParameterLabel>Response Type</ParameterLabel>
											<ParameterValue>{credentials.responseType}</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterLabel>Client ID</ParameterLabel>
											<ParameterValue>{credentials.clientId}</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterLabel>Redirect URI</ParameterLabel>
											<ParameterValue>{credentials.redirectUri}</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterLabel>Scopes</ParameterLabel>
											<ParameterValue>{credentials.scopes}</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterLabel>State</ParameterLabel>
											<ParameterValue>{credentials.state}</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterLabel>Nonce</ParameterLabel>
											<ParameterValue>{credentials.nonce}</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterLabel>Code Challenge</ParameterLabel>
											<ParameterValue>{credentials.codeChallenge}</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterLabel>Code Challenge Method</ParameterLabel>
											<ParameterValue>{credentials.codeChallengeMethod}</ParameterValue>
										</ParameterItem>
									</ParameterBreakdown>
								)}
							</div>
						)}
					</div>
				),
				canExecute: Boolean(credentials.state && credentials.nonce && credentials.codeChallenge),
				completed: Boolean(authorizationUrl),
			},
			{
				id: 'request-authorization',
				title: 'Request Authorization',
				description: 'Open the authorization URL to authenticate the user',
				icon: <FiUser />,
				category: 'authorization',
				content: (
					<div>
						<InfoBox type="info" style={{ marginBottom: '1.5rem' }}>
							<div>
								<h4
									style={{
										margin: '0 0 1rem 0',
										color: '#1e40af',
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
									}}
								>
									<FiUser />
									User Authorization
								</h4>
								<p style={{ margin: '0 0 1rem 0', color: '#1e40af' }}>
									Click the button below to open a new window where the user will authenticate and
									authorize your application. The authorization server will return both an
									authorization code and an ID token.
								</p>
							</div>
						</InfoBox>

						<Button
							variant="primary"
							onClick={requestAuthorization}
							disabled={isRequestingAuthorization || !authorizationUrl}
						>
							{isRequestingAuthorization ? (
								<>
									<FiRefreshCw className="animate-spin" />
									Opening Authorization...
								</>
							) : (
								<>
									<FiExternalLink />
									Request Authorization
								</>
							)}
						</Button>

						{authorizationUrl && (
							<div style={{ marginTop: '1.5rem' }}>
								<p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
									Authorization URL is ready. Click the button above to start the authorization
									process.
								</p>
							</div>
						)}
					</div>
				),
				canExecute: Boolean(authorizationUrl),
				completed: Boolean(tokens),
			},
			{
				id: 'display-tokens',
				title: 'Display Tokens',
				description: 'View the received authorization code and ID token',
				icon: <FiCheckCircle />,
				category: 'results',
				content: (
					<div>
						{tokens ? (
							<div>
								<InfoBox type="success" style={{ marginBottom: '1.5rem' }}>
									<div>
										<h4
											style={{
												margin: '0 0 1rem 0',
												color: '#166534',
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
											}}
										>
											<FiCheckCircle />
											OIDC Hybrid Flow Completed Successfully
										</h4>
										<p style={{ margin: '0', color: '#166534' }}>
											The authorization code and ID token have been received successfully.
										</p>
									</div>
								</InfoBox>

								<TokenDisplay tokens={tokens} />

								<div style={{ marginTop: '1.5rem' }}>
									<Button variant="secondary" onClick={resetFlow}>
										<FiRefreshCw />
										Reset Flow
									</Button>
								</div>
							</div>
						) : (
							<div>
								<InfoBox type="warning" style={{ marginBottom: '1.5rem' }}>
									<div>
										<h4
											style={{
												margin: '0 0 1rem 0',
												color: '#92400e',
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
											}}
										>
											<FiAlertTriangle />
											Waiting for Authorization
										</h4>
										<p style={{ margin: '0', color: '#92400e' }}>
											Complete the authorization process in the popup window to receive tokens.
										</p>
									</div>
								</InfoBox>
							</div>
						)}
					</div>
				),
				canExecute: false,
				completed: Boolean(tokens),
			},
		],
		[
			credentials,
			authorizationUrl,
			tokens,
			isRequestingAuthorization,
			showParameterBreakdown,
			saveCredentials,
			buildAuthorizationUrl,
			requestAuthorization,
			resetFlow,
		]
	);

	return (
		<Container>
			<Header>
				<Title>OIDC Hybrid Flow V3</Title>
				<Subtitle>
					OIDC 1.0 Hybrid Flow implementation with PKCE, state, and nonce validation. Combines
					authorization code and implicit flows for enhanced security and flexibility.
				</Subtitle>
			</Header>

			<FlowCard>
				<EnhancedStepFlowV2
					steps={steps}
					stepManager={stepManager}
					flowId="oidc_hybrid_v3"
					flowTitle="OIDC Hybrid Flow V3"
					onStepComplete={(stepId, result) => {
						logger.info('OIDCHybridV3', `✅ Step completed: ${stepId}`, result);
						setStepResults((prev) => ({ ...prev, [stepId]: result }));
					}}
					onStepError={(stepId, error) => {
						logger.error('OIDCHybridV3', `❌ Step failed: ${stepId}`, error);
					}}
				/>
			</FlowCard>

			{/* Modals */}
			<AuthorizationRequestModal
				isOpen={showAuthorizationModal}
				onClose={() => setShowAuthorizationModal(false)}
				authorizationUrl={authorizationUrl}
				onComplete={(receivedTokens) => {
					setTokens(receivedTokens);
					setShowAuthorizationModal(false);
					showFlowSuccess(
						'✅ Authorization Completed',
						'Tokens received successfully from the authorization server.'
					);
				}}
			/>

			<ConfirmationModal
				isOpen={showResetModal}
				onClose={() => setShowResetModal(false)}
				onConfirm={resetFlow}
				title="Reset OIDC Hybrid Flow"
				message="Are you sure you want to reset the flow? This will clear all tokens and return to the configuration step."
				confirmText="Reset Flow"
				cancelText="Cancel"
				variant="danger"
			/>
		</Container>
	);
};

export default OIDCHybridFlowV3;
