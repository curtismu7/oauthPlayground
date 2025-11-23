// src/v8/flows/PingOnePARFlowV8/PingOnePARFlowV8.tsx
//
// PAR Flow V8 - Redesigned to match Authorization Code Flow pattern
//
// DEBUGGING NOTES:
// ================
// 1. PAR (Pushed Authorization Request):
//    - PAR requests push authorization parameters to server first
//    - Server returns a request_uri (e.g., urn:ietf:params:oauth:request_uri:xyz)
//    - Authorization URL only contains request_uri (not individual params)
//    - Reduces URL length and improves security
//
// 2. STATE MANAGEMENT:
//    - Uses usePARFlowState hook for flow state
//    - Uses usePAROperations hook for PAR-specific operations
//    - Step state: Tracked in hook (see usePARFlowState.ts)
//
// 3. FLOW STEPS:
//    - Step 1: Configure credentials
//    - Step 2: Generate PAR request -> Get request_uri
//    - Step 3: Build authorization URL with request_uri
//    - Step 4: User authenticates
//    - Step 5: Exchange code for tokens
//
// 4. STORAGE:
//    - Check usePARFlowState.ts and usePAROperations.ts for storage keys
//    - PAR request URIs may be cached temporarily
//
// 5. COMMON DEBUGGING POINTS:
//    - PAR request requires valid credentials (client secret/private key)
//    - request_uri has limited lifetime (typically 60 seconds)
//    - Authorization URL should only contain request_uri (no other params)
//    - Check PAR service logs for request generation errors
//
import React, { useCallback, useEffect } from 'react';
import { FiCheckCircle, FiInfo, FiLock, FiSettings } from 'react-icons/fi';
import styled from 'styled-components';
import { LearningTooltip } from '../../../components/LearningTooltip';
import { StepNavigationButtons } from '../../../components/StepNavigationButtons';
import { PAR_FLOW_CONSTANTS, STEP_METADATA } from './constants/parFlowConstants';
import { usePARFlowState } from './hooks/usePARFlowState';
import { usePAROperations } from './hooks/usePAROperations';

// Styled Components
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
	background: #f8fafc;
	min-height: 100vh;
`;

const MainCard = styled.div`
	background: white;
	border-radius: 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
	margin-bottom: 2rem;
`;

const Header = styled.div<{ $variant: 'oauth' | 'oidc' }>`
	background: ${(props) =>
		props.$variant === 'oidc'
			? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
			: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'};
	color: white;
	padding: 2rem;
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const HeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const VersionBadge = styled.span`
	background: rgba(255, 255, 255, 0.2);
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	align-self: flex-start;
`;

const Title = styled.h1`
	font-size: 2rem;
	font-weight: 700;
	margin: 0;
`;

const Subtitle = styled.p`
	font-size: 1rem;
	opacity: 0.9;
	margin: 0;
`;

const HeaderRight = styled.div`
	text-align: right;
`;

const StepNumber = styled.div`
	font-size: 2.5rem;
	font-weight: 700;
	line-height: 1;
`;

const StepTotal = styled.div`
	font-size: 0.875rem;
	opacity: 0.75;
`;

const Content = styled.div`
	padding: 2rem;
`;

const Section = styled.div`
	margin-bottom: 1.5rem;
`;

const SectionTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	color: #1e293b;
`;

const VariantSelector = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 1.5rem;
`;

const VariantButton = styled.button<{ $selected: boolean }>`
	flex: 1;
	padding: 1rem;
	border-radius: 0.5rem;
	border: 2px solid ${(props) => (props.$selected ? '#3b82f6' : '#cbd5e1')};
	background: ${(props) => (props.$selected ? '#eff6ff' : 'white')};
	color: ${(props) => (props.$selected ? '#1e40af' : '#64748b')};
	font-weight: ${(props) => (props.$selected ? '600' : '500')};
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		border-color: #3b82f6;
		background: #eff6ff;
	}
`;

const InfoBox = styled.div<{ $type: 'info' | 'success' | 'warning' }>`
	padding: 1rem;
	border-radius: 0.5rem;
	margin-bottom: 1rem;
	background: ${(props) =>
		props.$type === 'success' ? '#f0fdf4' : props.$type === 'warning' ? '#fef3c7' : '#eff6ff'};
	border: 1px solid
		${(props) =>
			props.$type === 'success' ? '#16a34a' : props.$type === 'warning' ? '#f59e0b' : '#3b82f6'};
	color: ${(props) =>
		props.$type === 'success' ? '#166534' : props.$type === 'warning' ? '#92400e' : '#1e40af'};
	font-size: 0.875rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'next' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	border: none;
	background: ${(props) => {
		if (props.$variant === 'secondary') return '#64748b';
		if (props.$variant === 'next') return '#10b981';
		return '#3b82f6';
	}};
	color: white;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	&:hover:not(:disabled) {
		background: ${(props) => {
			if (props.$variant === 'secondary') return '#475569';
			if (props.$variant === 'next') return '#059669';
			return '#2563eb';
		}};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const CodeBlock = styled.pre`
	background: #1e293b;
	color: #f1f5f9;
	padding: 1rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	font-size: 0.875rem;
	margin: 1rem 0;
`;

const FormGroup = styled.div`
	margin-bottom: 1rem;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 500;
	color: #1e293b;
	font-size: 0.875rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	border: 1px solid #cbd5e1;
	border-radius: 0.5rem;
	font-size: 0.875rem;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

export const PingOnePARFlowV8: React.FC = () => {
	const state = usePARFlowState();
	const operations = usePAROperations();

	// Detect auth code from URL on mount only (prevent infinite loop)
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const code = params.get('code');
		if (code && !state.flowState.authCode) {
			state.setAuthCode(code);
			state.markStepCompleted(3);
			state.setCurrentStep(4);
		}
		// biome-ignore lint/correctness/useExhaustiveDependencies: Only run once on mount to prevent infinite loop
	}, []);

	// Handle PKCE generation
	const handleGeneratePKCE = useCallback(async () => {
		try {
			const codes = await operations.generatePKCE();
			state.updatePKCE(codes);
			state.markStepCompleted(1);
		} catch (error) {
			console.error('PKCE generation failed:', error);
		}
	}, [operations, state]);

	// Handle PAR request
	const handlePushAuthRequest = useCallback(async () => {
		try {
			const response = await operations.pushAuthorizationRequest(
				state.credentials,
				state.pkceCodes
			);
			state.setPARRequestUri(response.request_uri, response.expires_in);
			state.markStepCompleted(2);
		} catch (error) {
			console.error('PAR request failed:', error);
		}
	}, [operations, state]);

	// Handle authorization
	const handleAuthorize = useCallback(() => {
		if (state.flowState.parRequestUri) {
			const authUrl = operations.generateAuthorizationUrl(
				state.credentials,
				state.flowState.parRequestUri
			);
			window.location.href = authUrl;
		}
	}, [operations, state]);

	// Handle token exchange
	const handleExchangeTokens = useCallback(async () => {
		if (!state.flowState.authCode) return;

		try {
			const tokens = await operations.exchangeCodeForTokens(
				state.credentials,
				state.flowState.authCode,
				state.pkceCodes
			);
			state.updateTokens(tokens);
			state.markStepCompleted(4);

			// Fetch user info for OIDC
			if (state.flowState.flowVariant === 'oidc' && tokens.access_token) {
				const userInfo = await operations.fetchUserInfo(state.credentials, tokens.access_token);
				state.updateUserInfo(userInfo);
			}
		} catch (error) {
			console.error('Token exchange failed:', error);
		}
	}, [operations, state]);

	// Render step content
	const renderStepContent = () => {
		switch (state.flowState.currentStep) {
			case 0:
				return (
					<>
						<Section>
							<SectionTitle>
								<FiSettings />
								Flow Variant
								<LearningTooltip
									variant="info"
									title="OAuth vs OIDC"
									content="OAuth 2.0 provides authorization (API access), while OIDC adds authentication (user identity)"
									placement="right"
								>
									<FiInfo size={16} />
								</LearningTooltip>
							</SectionTitle>
							<VariantSelector>
								<VariantButton
									$selected={state.flowState.flowVariant === 'oauth'}
									onClick={() => state.setFlowVariant('oauth')}
								>
									<div style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>OAuth 2.0 PAR</div>
									<div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
										Authorization only (access token)
									</div>
								</VariantButton>
								<VariantButton
									$selected={state.flowState.flowVariant === 'oidc'}
									onClick={() => state.setFlowVariant('oidc')}
								>
									<div style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>OIDC PAR</div>
									<div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
										Authentication + Authorization (ID token + access token)
									</div>
								</VariantButton>
							</VariantSelector>
						</Section>

						<InfoBox $type="info">
							<div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
								<FiLock size={20} style={{ flexShrink: 0, marginTop: '0.125rem' }} />
								<div>
									<strong>What is PAR?</strong>
									<LearningTooltip
										variant="learning"
										title="Pushed Authorization Requests (RFC 9126)"
										content="PAR sends authorization parameters via secure back-channel POST instead of URL parameters, preventing tampering and reducing URL length"
										placement="right"
									>
										<FiInfo size={14} style={{ marginLeft: '0.25rem', cursor: 'help' }} />
									</LearningTooltip>
									<div style={{ marginTop: '0.5rem' }}>
										PAR enhances security by pushing authorization parameters to a secure endpoint
										before redirecting the user. This prevents parameter tampering and keeps
										sensitive data out of browser URLs.
									</div>
								</div>
							</div>
						</InfoBox>

						<Section>
							<FormGroup>
								<Label>
									Environment ID
									<LearningTooltip
										variant="info"
										title="PingOne Environment"
										content="Your PingOne environment identifier"
										placement="right"
									>
										<FiInfo size={14} style={{ marginLeft: '0.25rem' }} />
									</LearningTooltip>
								</Label>
								<Input
									type="text"
									value={state.credentials.environmentId}
									onChange={(e) => state.updateCredentials({ environmentId: e.target.value })}
									placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
								/>
							</FormGroup>

							<FormGroup>
								<Label>Client ID</Label>
								<Input
									type="text"
									value={state.credentials.clientId}
									onChange={(e) => state.updateCredentials({ clientId: e.target.value })}
									placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
								/>
							</FormGroup>

							<FormGroup>
								<Label>Client Secret</Label>
								<Input
									type="password"
									value={state.credentials.clientSecret}
									onChange={(e) => state.updateCredentials({ clientSecret: e.target.value })}
									placeholder="Enter client secret"
								/>
							</FormGroup>

							<FormGroup>
								<Label>Redirect URI</Label>
								<Input
									type="text"
									value={state.credentials.redirectUri}
									onChange={(e) => state.updateCredentials({ redirectUri: e.target.value })}
									placeholder="https://localhost:3000/par-callback"
								/>
							</FormGroup>

							<FormGroup>
								<Label>Scope</Label>
								<Input
									type="text"
									value={state.credentials.scope}
									onChange={(e) => state.updateCredentials({ scope: e.target.value })}
									placeholder={
										state.flowState.flowVariant === 'oidc'
											? 'openid profile email'
											: 'api.read api.write'
									}
								/>
							</FormGroup>
						</Section>
					</>
				);

			case 1:
				return (
					<>
						<InfoBox $type="info">
							<strong>PKCE (Proof Key for Code Exchange)</strong>
							<LearningTooltip
								variant="security"
								title="PKCE Security"
								content="PKCE prevents authorization code interception attacks by binding the code to the client that requested it"
								placement="right"
							>
								<FiInfo size={14} style={{ marginLeft: '0.25rem' }} />
							</LearningTooltip>
							<div style={{ marginTop: '0.5rem' }}>
								PKCE adds an extra security layer by ensuring only the client that initiated the
								request can exchange the authorization code for tokens.
							</div>
						</InfoBox>

						<Button onClick={handleGeneratePKCE} disabled={operations.isLoading}>
							{operations.isLoading ? 'Generating...' : 'Generate PKCE Parameters'}
						</Button>

						{state.pkceCodes.codeVerifier && (
							<InfoBox $type="success">
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginBottom: '0.5rem',
									}}
								>
									<FiCheckCircle />
									<strong>PKCE Parameters Generated</strong>
								</div>
								<div style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
									<div>Verifier: {state.pkceCodes.codeVerifier.substring(0, 20)}...</div>
									<div>Challenge: {state.pkceCodes.codeChallenge.substring(0, 20)}...</div>
									<div>Method: {state.pkceCodes.codeChallengeMethod}</div>
								</div>
							</InfoBox>
						)}
					</>
				);

			case 2:
				return (
					<>
						<InfoBox $type="info">
							<strong>Push Authorization Request</strong>
							<div style={{ marginTop: '0.5rem' }}>
								Send all authorization parameters to the PAR endpoint. You'll receive a short-lived
								request_uri to use in the authorization request.
							</div>
						</InfoBox>

						{state.pkceCodes.codeVerifier && (
							<>
								<CodeBlock>
									{`POST https://auth.pingone.com/${state.credentials.environmentId}/as/par

response_type=code
client_id=${state.credentials.clientId}
redirect_uri=${state.credentials.redirectUri}
scope=${state.credentials.scope}
code_challenge=${state.pkceCodes.codeChallenge}
code_challenge_method=S256`}
								</CodeBlock>

								<Button onClick={handlePushAuthRequest} disabled={operations.isLoading}>
									{operations.isLoading ? 'Pushing Request...' : 'Push Authorization Request'}
								</Button>
							</>
						)}

						{state.flowState.parRequestUri && (
							<InfoBox $type="success">
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginBottom: '0.5rem',
									}}
								>
									<FiCheckCircle />
									<strong>PAR Request Successful</strong>
								</div>
								<div style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
									<div>Request URI: {state.flowState.parRequestUri}</div>
									<div>Expires in: {state.flowState.parExpiresIn} seconds</div>
								</div>
							</InfoBox>
						)}
					</>
				);

			case 3:
				return (
					<>
						<InfoBox $type="info">
							<strong>User Authorization</strong>
							<div style={{ marginTop: '0.5rem' }}>
								Redirect the user to the authorization endpoint with the request_uri. Notice how the
								URL is short and doesn't contain sensitive parameters.
							</div>
						</InfoBox>

						{state.flowState.parRequestUri && (
							<>
								<CodeBlock>
									{operations.generateAuthorizationUrl(
										state.credentials,
										state.flowState.parRequestUri
									)}
								</CodeBlock>

								<Button onClick={handleAuthorize}>Authorize with PingOne</Button>
							</>
						)}

						{state.flowState.authCode && (
							<InfoBox $type="success">
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginBottom: '0.5rem',
									}}
								>
									<FiCheckCircle />
									<strong>Authorization Code Received</strong>
								</div>
								<div style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
									Code: {state.flowState.authCode.substring(0, 20)}...
								</div>
							</InfoBox>
						)}
					</>
				);

			case 4:
				return (
					<>
						<InfoBox $type="info">
							<strong>Token Exchange</strong>
							<div style={{ marginTop: '0.5rem' }}>
								Exchange the authorization code for tokens. The PKCE verifier proves you're the same
								client that initiated the request.
							</div>
						</InfoBox>

						{state.flowState.authCode && (
							<Button
								$variant="next"
								onClick={handleExchangeTokens}
								disabled={operations.isLoading}
							>
								{operations.isLoading ? 'Exchanging...' : 'Exchange Code for Tokens'}
							</Button>
						)}

						{state.tokens && (
							<>
								<InfoBox $type="success">
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											marginBottom: '0.5rem',
										}}
									>
										<FiCheckCircle />
										<strong>Tokens Received</strong>
									</div>
								</InfoBox>

								<CodeBlock>{JSON.stringify(state.tokens, null, 2)}</CodeBlock>

								{state.userInfo && (
									<>
										<h4>User Info</h4>
										<CodeBlock>{JSON.stringify(state.userInfo, null, 2)}</CodeBlock>
									</>
								)}
							</>
						)}
					</>
				);

			case 5:
				return (
					<>
						<InfoBox $type="success">
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '1rem',
								}}
							>
								<FiCheckCircle size={24} />
								<strong style={{ fontSize: '1.1rem' }}>PAR Flow Complete!</strong>
							</div>
							<div>
								You've successfully completed the {state.flowState.flowVariant.toUpperCase()} PAR
								flow with enhanced security.
							</div>
						</InfoBox>

						<Section>
							<h4>What You Accomplished:</h4>
							<ul style={{ lineHeight: 1.8 }}>
								<li>✅ Generated secure PKCE parameters</li>
								<li>✅ Pushed authorization request to secure endpoint</li>
								<li>✅ Received short-lived request_uri</li>
								<li>✅ Completed user authorization</li>
								<li>✅ Exchanged code for tokens with PKCE verification</li>
								{state.flowState.flowVariant === 'oidc' && <li>✅ Retrieved user information</li>}
							</ul>
						</Section>

						<Section>
							<h4>Next Steps:</h4>
							<ul style={{ lineHeight: 1.8 }}>
								<li>Use the access token to call protected APIs</li>
								{state.flowState.flowVariant === 'oidc' && <li>Verify the ID token signature</li>}
								<li>Implement token refresh flow</li>
								<li>Explore other OAuth/OIDC flows</li>
							</ul>
						</Section>
					</>
				);

			default:
				return null;
		}
	};

	const currentStepMeta = STEP_METADATA[state.flowState.currentStep];

	return (
		<Container>
			<MainCard>
				<Header $variant={state.flowState.flowVariant}>
					<HeaderLeft>
						<VersionBadge>V8 · PAR Flow</VersionBadge>
						<Title>{currentStepMeta.title}</Title>
						<Subtitle>{currentStepMeta.subtitle}</Subtitle>
					</HeaderLeft>
					<HeaderRight>
						<StepNumber>{String(state.flowState.currentStep + 1).padStart(2, '0')}</StepNumber>
						<StepTotal>of {String(PAR_FLOW_CONSTANTS.TOTAL_STEPS).padStart(2, '0')}</StepTotal>
					</HeaderRight>
				</Header>

				<Content>{renderStepContent()}</Content>

				<div style={{ padding: '0 2rem 2rem' }}>
					<StepNavigationButtons
						currentStep={state.flowState.currentStep}
						totalSteps={PAR_FLOW_CONSTANTS.TOTAL_STEPS}
						onNext={() => state.setCurrentStep(state.flowState.currentStep + 1)}
						onPrevious={() => state.setCurrentStep(state.flowState.currentStep - 1)}
						onReset={state.resetFlow}
						canNavigateNext={state.isStepCompleted(state.flowState.currentStep)}
						isFirstStep={state.flowState.currentStep === 0}
					/>
				</div>
			</MainCard>
		</Container>
	);
};

export default PingOnePARFlowV8;
