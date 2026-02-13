/**
 * @file OAuthAuthorizationCodeFlowV8.tsx
 * @module v8/flows
 * @description OAuth 2.0 Authorization Code Flow with PKCE
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useEffect, useRef, useState } from 'react';
import CredentialsFormV8 from '@/v8/components/CredentialsFormV8';
import StepActionButtonsV8 from '@/v8/components/StepActionButtonsV8';
import StepValidationFeedbackV8 from '@/v8/components/StepValidationFeedbackV8';
import {
	DangerButton,
	PrimaryButton,
	SecondaryButton,
} from '@/v8/components/shared/ActionButtonV8';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { FlowResetServiceV8 } from '@/v8/services/flowResetServiceV8';
import { OAuthIntegrationServiceV8 } from '@/v8/services/oauthIntegrationServiceV8';
import { RedirectlessServiceV8 } from '@/v8/services/redirectlessServiceV8';
import { PKCEStorageServiceV8U } from '@/v8u/services/pkceStorageServiceV8U';

const MODULE_TAG = '[🔐 OAUTH-AUTHZ-CODE-V8]';
const FLOW_KEY = 'oauth-authz-v8';

interface Credentials {
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
	[key: string]: unknown;
}

interface AuthorizationState {
	authorizationUrl: string;
	state: string;
	codeChallenge: string;
	codeChallengeMethod: string;
	authorizationCode: string;
	tokens: {
		accessToken: string;
		idToken?: string;
		refreshToken?: string;
		expiresIn?: number;
	};
}

export const OAuthAuthorizationCodeFlowV8: React.FC = () => {
	console.log(`${MODULE_TAG} Initializing flow`);

	const nav = useStepNavigationV8(4, {
		onStepChange: (step) => console.log(`${MODULE_TAG} Step changed to`, { step }),
	});

	const [credentials, setCredentials] = useState<Credentials>(() => {
		return CredentialsServiceV8.loadCredentials('oauth', {
			flowKey: 'oauth',
			flowType: 'oauth',
			includeClientSecret: true,
			includeRedirectUri: true,
			includeLogoutUri: false,
			includeScopes: true,
			defaultScopes: 'openid profile email',
			defaultRedirectUri: 'https://localhost:3000/authz-callback',
		});
	});

	const [useRedirectless, setUseRedirectless] = useState<boolean>(() => {
		const stored = sessionStorage.getItem(`${FLOW_KEY}_use_redirectless`);
		return stored === 'true';
	});

	const [redirectlessCredentials, setRedirectlessCredentials] = useState({
		username: '',
		password: '',
	});

	const [isActionInProgress, setIsActionInProgress] = useState<boolean>(false);

	// Initialize auth state and restore PKCE codes from bulletproof storage if available
	const [authState, setAuthState] = useState<AuthorizationState>(() => {
		const initialState: AuthorizationState = {
			authorizationUrl: '',
			state: '',
			codeChallenge: '',
			codeChallengeMethod: 'S256',
			authorizationCode: '',
			tokens: {
				accessToken: '',
				idToken: '',
				refreshToken: '',
				expiresIn: 3600,
			},
		};

		// Restore PKCE codes from bulletproof storage
		const storedPKCE = PKCEStorageServiceV8U.loadPKCECodes(FLOW_KEY);
		if (storedPKCE) {
			console.log(`${MODULE_TAG} Restored PKCE codes from bulletproof storage`, {
				hasChallenge: !!storedPKCE.codeChallenge,
				hasVerifier: !!storedPKCE.codeVerifier,
			});
			initialState.codeChallenge = storedPKCE.codeChallenge;
			initialState.codeChallengeMethod = storedPKCE.codeChallengeMethod || 'S256';
		}

		return initialState;
	});

	// Store codeVerifier when authorization URL is generated (it's returned but not stored in state)
	// Also restore from bulletproof storage on mount
	const storedPKCEInitial = PKCEStorageServiceV8U.loadPKCECodes(FLOW_KEY);
	const codeVerifierRef = useRef<string>(storedPKCEInitial?.codeVerifier || '');

	// Button state management with global flow state
	// TODO: Replace remaining manual loading states with useActionButton()
	// const step1Action = useActionButton();
	// const step2Action = useActionButton();
	// const step3Action = useActionButton();

	// Persist PKCE codes to bulletproof storage whenever they change
	useEffect(() => {
		if (authState.codeChallenge && codeVerifierRef.current) {
			PKCEStorageServiceV8U.savePKCECodes(FLOW_KEY, {
				codeVerifier: codeVerifierRef.current,
				codeChallenge: authState.codeChallenge,
				codeChallengeMethod: authState.codeChallengeMethod,
			});
		}
	}, [authState.codeChallenge, authState.codeChallengeMethod]);

	useEffect(() => {
		const result = CredentialsServiceV8.validateCredentials(credentials, 'oauth');
		nav.setValidationErrors(result.errors.map((e) => e.message));
		nav.setValidationWarnings(result.warnings.map((w) => w.message));
		CredentialsServiceV8.saveCredentials('oauth-authz-v8', credentials);
	}, [credentials, nav.setValidationErrors, nav.setValidationWarnings]);

	useEffect(() => {
		sessionStorage.setItem(`${FLOW_KEY}_use_redirectless`, useRedirectless.toString());
	}, [useRedirectless]);

	const renderStep0 = () => (
		<div className="step-content">
			<CredentialsFormV8
				flowKey="oauth-authz-v8"
				credentials={credentials}
				onChange={(updated: unknown) => {
					setCredentials(updated as Credentials);
				}}
				title="OAuth 2.0 Configure App & Environment"
				subtitle="API Authorization with Access token only"
			/>

			<div className="redirectless-option">
				<div className="checkbox-wrapper">
					<input
						type="checkbox"
						id="use-redirectless-oauth"
						checked={useRedirectless}
						onChange={(e) => setUseRedirectless(e.target.checked)}
						aria-label="Use redirectless authentication"
					/>
					<label htmlFor="use-redirectless-oauth" className="checkbox-label">
						<span className="checkbox-text">
							Use Redirectless Authentication (response_mode=pi.flow)
						</span>
					</label>
				</div>
				<p className="checkbox-description">
					Authenticate without browser redirects using PingOne's pi.flow response mode
				</p>
			</div>

			{useRedirectless && (
				<div className="redirectless-credentials">
					<h3>Test User Credentials</h3>
					<div className="form-group">
						<label htmlFor="redirectless-username-oauth">
							Username <span className="required">*</span>
						</label>
						<input
							id="redirectless-username-oauth"
							type="text"
							value={redirectlessCredentials.username}
							onChange={(e) =>
								setRedirectlessCredentials({
									...redirectlessCredentials,
									username: e.target.value,
								})
							}
							placeholder="user@example.com"
							aria-label="Username for redirectless authentication"
						/>
					</div>
					<div className="form-group">
						<label htmlFor="redirectless-password-oauth">
							Password <span className="required">*</span>
						</label>
						<input
							id="redirectless-password-oauth"
							type="password"
							value={redirectlessCredentials.password}
							onChange={(e) =>
								setRedirectlessCredentials({
									...redirectlessCredentials,
									password: e.target.value,
								})
							}
							placeholder="Password"
							aria-label="Password for redirectless authentication"
						/>
					</div>
				</div>
			)}
		</div>
	);

	const renderStep1 = () => (
		<div className="step-content">
			<h2>
				Step 1: {useRedirectless ? 'Authenticate with PingOne' : 'Generate Authorization URL'}
			</h2>
			<p>
				{useRedirectless
					? 'Authenticate using PingOne redirectless flow without browser redirects.'
					: 'Generate the authorization URL to redirect the user to the authorization server.'}
			</p>

			<PrimaryButton
				onClick={async () => {
					setIsActionInProgress(true);
					console.log(
						`${MODULE_TAG} ${useRedirectless ? 'Starting redirectless flow' : 'Generating authorization URL'}`
					);
					try {
						if (!credentials.redirectUri) {
							nav.setValidationErrors(['Redirect URI is required']);
							return;
						}

						if (useRedirectless) {
							// Validate redirectless credentials
							if (!redirectlessCredentials.username || !redirectlessCredentials.password) {
								nav.setValidationErrors([
									'Username and password are required for redirectless authentication',
								]);
								return;
							}

							// Generate PKCE codes
							const result = await OAuthIntegrationServiceV8.generateAuthorizationUrl({
								environmentId: credentials.environmentId,
								clientId: credentials.clientId,
								redirectUri: credentials.redirectUri,
								scopes: credentials.scopes || 'openid profile email',
								...(credentials.clientSecret && { clientSecret: credentials.clientSecret }),
							});

							codeVerifierRef.current = result.codeVerifier;
							PKCEStorageServiceV8U.savePKCECodes(FLOW_KEY, {
								codeVerifier: result.codeVerifier,
								codeChallenge: result.codeChallenge,
								codeChallengeMethod: result.codeChallengeMethod,
							});

							// Start redirectless flow
							const flowResult = await RedirectlessServiceV8.completeFlow({
								flowKey: FLOW_KEY,
								credentials: {
									environmentId: credentials.environmentId,
									clientId: credentials.clientId,
									clientSecret: credentials.clientSecret || '',
									redirectUri: credentials.redirectUri,
									scopes: credentials.scopes || 'openid profile email',
								},
								flowType: 'authorization_code',
								codeChallenge: result.codeChallenge,
								codeChallengeMethod: result.codeChallengeMethod,
								username: redirectlessCredentials.username,
								password: redirectlessCredentials.password,
								onAuthCodeReceived: () => {
									console.log(`${MODULE_TAG} Received authorization code via redirectless`);
								},
							});

							if (flowResult.code) {
								setAuthState({
									...authState,
									authorizationCode: flowResult.code,
									state: flowResult.state,
									codeChallenge: result.codeChallenge,
									codeChallengeMethod: result.codeChallengeMethod,
								});
								nav.markStepComplete();
								// Auto-advance to next step
								nav.goToNext();
							} else {
								nav.setValidationErrors([
									'Failed to obtain authorization code via redirectless flow',
								]);
							}
						} else {
							// Standard flow
							const oauthCredentials = {
								environmentId: credentials.environmentId,
								clientId: credentials.clientId,
								redirectUri: credentials.redirectUri,
								scopes: credentials.scopes || 'openid profile email',
								...(credentials.clientSecret && { clientSecret: credentials.clientSecret }),
							};
							const result =
								await OAuthIntegrationServiceV8.generateAuthorizationUrl(oauthCredentials);
							codeVerifierRef.current = result.codeVerifier;
							PKCEStorageServiceV8U.savePKCECodes(FLOW_KEY, {
								codeVerifier: result.codeVerifier,
								codeChallenge: result.codeChallenge,
								codeChallengeMethod: result.codeChallengeMethod,
							});
							setAuthState({
								...authState,
								authorizationUrl: result.authorizationUrl,
								state: result.state,
								codeChallenge: result.codeChallenge,
								codeChallengeMethod: result.codeChallengeMethod,
							});
							nav.markStepComplete();
						}
					} catch (error) {
						console.error(`${MODULE_TAG} Error in step 1`, error);
						nav.setValidationErrors([
							`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
						]);
					} finally {
						setIsActionInProgress(false);
					}
				}}
				isLoading={isActionInProgress}
				disabled={isActionInProgress}
			>
				{useRedirectless ? 'Authenticate with PingOne' : 'Generate Authorization URL'}
			</PrimaryButton>

			{!useRedirectless && authState.authorizationUrl && (
				<div className="code-block">
					<pre>{authState.authorizationUrl}</pre>
					<SecondaryButton
						onClick={() => {
							navigator.clipboard.writeText(authState.authorizationUrl);
							console.log(`${MODULE_TAG} URL copied to clipboard`);
						}}
						disabled={isActionInProgress}
					>
						Copy URL
					</SecondaryButton>
					<SecondaryButton
						onClick={() => {
							window.location.href = authState.authorizationUrl;
						}}
						disabled={isActionInProgress}
					>
						Open Authorization URL
					</SecondaryButton>
				</div>
			)}

			{useRedirectless && authState.authorizationCode && (
				<div className="success-message">
					<p>✅ Authentication successful! Authorization code received.</p>
					<p className="code-preview">{`Code: ${authState.authorizationCode.substring(0, 30)}...`}</p>
				</div>
			)}
		</div>
	);

	const renderStep2 = () => (
		<div className="step-content">
			<h2>Step 2: Handle Callback</h2>
			<p>After authenticating, you'll be redirected back here with an authorization code.</p>

			<div className="form-group">
				<label htmlFor="oauth-callback-url">Callback URL</label>
				<input
					id="oauth-callback-url"
					type="text"
					placeholder="https://localhost:3000/callback?code=...&state=..."
					value={authState.authorizationCode}
					onChange={(e) => setAuthState({ ...authState, authorizationCode: e.target.value })}
					aria-label="Callback URL"
				/>
				<small>Paste the full callback URL here</small>
			</div>

			<PrimaryButton
				onClick={() => {
					console.log(`${MODULE_TAG} Parsing callback URL`);
					setIsActionInProgress(true);
					try {
						const parsed = OAuthIntegrationServiceV8.parseCallbackUrl(
							authState.authorizationCode,
							authState.state
						);
						setAuthState({
							...authState,
							authorizationCode: parsed.code,
						});
						nav.markStepComplete();
					} catch (error) {
						console.error(`${MODULE_TAG} Error parsing callback URL`, error);
						nav.setValidationErrors([
							`Failed to parse callback URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
						]);
					} finally {
						setIsActionInProgress(false);
					}
				}}
				isLoading={isActionInProgress}
				disabled={isActionInProgress}
			>
				Parse Callback URL
			</PrimaryButton>
		</div>
	);

	const renderStep3 = () => (
		<div className="step-content">
			<h2>Step 3: Tokens Received</h2>
			<p>Successfully exchanged authorization code for tokens.</p>

			{authState.tokens.accessToken && (
				<div className="token-display">
					<div className="token-section">
						<h3>🎫 Access Token</h3>
						<div className="code-block">
							<pre>{authState.tokens.accessToken}</pre>
							<SecondaryButton
								onClick={() => {
									navigator.clipboard.writeText(authState.tokens.accessToken);
									console.log(`${MODULE_TAG} Token copied to clipboard`);
								}}
								disabled={isActionInProgress}
							>
								Copy
							</SecondaryButton>
							<SecondaryButton
								onClick={() => {
									try {
										const decoded = OAuthIntegrationServiceV8.decodeToken(
											authState.tokens.accessToken
										);
										console.log(`${MODULE_TAG} Decoded token:`, decoded.payload);
									} catch (error) {
										console.error(
											`${MODULE_TAG} Error decoding token:`,
											error instanceof Error ? error.message : 'Unknown error'
										);
									}
								}}
								disabled={isActionInProgress}
							>
								Decode
							</SecondaryButton>
						</div>
					</div>

					{authState.tokens.idToken && (
						<div className="token-section">
							<h3>🆔 ID Token</h3>
							<div className="code-block">
								<pre>{authState.tokens.idToken}</pre>
								<SecondaryButton
									onClick={() => {
										navigator.clipboard.writeText(authState.tokens.idToken || '');
										console.log(`${MODULE_TAG} Token copied to clipboard`);
									}}
									disabled={isActionInProgress}
								>
									Copy
								</SecondaryButton>
								<SecondaryButton
									onClick={() => {
										try {
											const decoded = OAuthIntegrationServiceV8.decodeToken(
												authState.tokens.idToken || ''
											);
											console.log(`${MODULE_TAG} Decoded token:`, decoded.payload);
										} catch (error) {
											console.error(
												`${MODULE_TAG} Error decoding token:`,
												error instanceof Error ? error.message : 'Unknown error'
											);
										}
									}}
									disabled={isActionInProgress}
								>
									Decode
								</SecondaryButton>
							</div>
						</div>
					)}

					{authState.tokens.refreshToken && (
						<div className="token-section">
							<h3>🔄 Refresh Token</h3>
							<div className="code-block">
								<pre>{authState.tokens.refreshToken}</pre>
								<SecondaryButton
									onClick={() => {
										navigator.clipboard.writeText(authState.tokens.refreshToken || '');
										console.log(`${MODULE_TAG} Token copied to clipboard`);
									}}
									disabled={isActionInProgress}
								>
									Copy
								</SecondaryButton>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);

	const renderStepContent = () => {
		switch (nav.currentStep) {
			case 0:
				return renderStep0();
			case 1:
				return renderStep1();
			case 2:
				return renderStep2();
			case 3:
				return renderStep3();
			default:
				return null;
		}
	};

	return (
		<div className="oauth-authz-code-flow-v8">
			<div className="flow-header">
				<div className="header-content">
					<div className="header-left">
						<span className="version-tag">V8</span>
						<div className="header-text">
							<h1>OAuth 2.0 Authorization Code Flow</h1>
							<p>Complete OAuth 2.0 Authorization Code flow with PKCE support</p>
						</div>
					</div>
					<div className="header-right">
						<div className="step-badge">
							<span className="step-number">{nav.currentStep + 1}</span>
							<span className="step-divider">of</span>
							<span className="step-total">4</span>
						</div>
					</div>
				</div>
			</div>

			<div className="flow-container">
				<div className="step-breadcrumb">
					{['Configure', 'Auth URL', 'Callback', 'Tokens'].map((label, idx) => (
						<div key={idx} className="breadcrumb-item">
							<span
								className={`breadcrumb-text ${idx === nav.currentStep ? 'active' : ''} ${nav.completedSteps.includes(idx) ? 'completed' : ''}`}
							>
								{label}
							</span>
							{idx < 3 && <span className="breadcrumb-arrow">→</span>}
						</div>
					))}
				</div>

				<div className="step-content-wrapper">{renderStepContent()}</div>

				<StepValidationFeedbackV8 errors={nav.validationErrors} warnings={nav.validationWarnings} />

				<StepActionButtonsV8
					currentStep={nav.currentStep}
					totalSteps={4}
					isNextDisabled={!nav.canGoNext}
					nextDisabledReason={nav.getErrorMessage()}
					onPrevious={nav.goToPrevious}
					onNext={nav.goToNext}
					onFinal={() => {
						console.log(`${MODULE_TAG} Starting new flow`);
						nav.reset();
						// Clear PKCE codes from bulletproof storage
						PKCEStorageServiceV8U.clearPKCECodes(FLOW_KEY).catch((err) => {
							console.error(`${MODULE_TAG} Failed to clear PKCE codes`, err);
						});
						codeVerifierRef.current = '';
						// Reload credentials from storage (preserves credentials)
						const reloaded = CredentialsServiceV8.loadCredentials('oauth-authz-v8', {
							flowKey: 'oauth-authz-v8',
							flowType: 'oauth',
							includeClientSecret: true,
							includeRedirectUri: true,
							includeLogoutUri: false,
							includeScopes: true,
							defaultScopes: 'openid profile email',
							defaultRedirectUri: 'https://localhost:3000/authz-callback',
						});
						setCredentials(reloaded);
						setAuthState({
							authorizationUrl: '',
							state: '',
							codeChallenge: '',
							codeChallengeMethod: 'S256',
							authorizationCode: '',
							tokens: {
								accessToken: '',
								idToken: '',
								refreshToken: '',
								expiresIn: 3600,
							},
						});
					}}
				/>

				<DangerButton
					onClick={() => {
						console.log(`${MODULE_TAG} Resetting flow`);
						FlowResetServiceV8.resetFlow('oauth-authz-v8');
						// Clear PKCE codes from bulletproof storage
						PKCEStorageServiceV8U.clearPKCECodes(FLOW_KEY).catch((err) => {
							console.error(`${MODULE_TAG} Failed to clear PKCE codes`, err);
						});
						codeVerifierRef.current = '';
						// Reload credentials from storage (preserves credentials)
						const reloaded = CredentialsServiceV8.loadCredentials('oauth-authz-v8', {
							flowKey: 'oauth-authz-v8',
							flowType: 'oauth',
							includeClientSecret: true,
							includeRedirectUri: true,
							includeLogoutUri: false,
							includeScopes: true,
							defaultScopes: 'openid profile email',
							defaultRedirectUri: 'https://localhost:3000/authz-callback',
						});
						setCredentials(reloaded);
						nav.reset();
					}}
					disabled={isActionInProgress}
					title="Reset flow and clear all data"
				>
					Reset Flow
				</DangerButton>
			</div>

			<style>{`
				.oauth-authz-code-flow-v8 {
					max-width: 1000px;
					margin: 0 auto;
					background: #f8f9fa;
					min-height: 100vh;
				}

				.flow-header {
					background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
					padding: 28px 40px;
					margin-bottom: 0;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
				}

				.header-content {
					display: flex;
					align-items: center;
					justify-content: space-between;
				}

				.header-left {
					display: flex;
					align-items: flex-start;
					gap: 20px;
					flex: 1;
				}

				.version-tag {
					font-size: 11px;
					font-weight: 700;
					color: rgba(26, 26, 26, 0.7);
					letter-spacing: 1.5px;
					text-transform: uppercase;
					padding-top: 2px;
				}

				.header-text {
					margin: 0;
				}

				.flow-header h1 {
					font-size: 26px;
					font-weight: 700;
					margin: 0 0 4px 0;
					color: #1a1a1a;
				}

				.flow-header p {
					font-size: 13px;
					color: rgba(26, 26, 26, 0.75);
					margin: 0;
				}

				.header-right {
					display: flex;
					align-items: center;
				}

				.step-badge {
					background: rgba(255, 255, 255, 0.95);
					padding: 12px 20px;
					border-radius: 24px;
					display: flex;
					align-items: center;
					gap: 8px;
					box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
				}

				.step-number {
					font-size: 18px;
					font-weight: 700;
					color: #f5a623;
				}

				.step-divider {
					font-size: 12px;
					color: #999;
					font-weight: 500;
				}

				.step-total {
					font-size: 14px;
					font-weight: 600;
					color: #666;
				}

				.step-breadcrumb {
					background: linear-gradient(to bottom, #f0f9ff, #e0f2fe);
					padding: 28px 40px;
					border-bottom: 2px solid #3b82f6;
					display: flex;
					align-items: center;
					gap: 16px;
					flex-wrap: wrap;
				}

				.breadcrumb-item {
					display: flex;
					align-items: center;
					gap: 16px;
				}

				.breadcrumb-text {
					font-size: 15px;
					font-weight: 500;
					color: #b0b0b0;
					padding: 10px 16px;
					border-radius: 6px;
					background: white;
					border: 1px solid #e8e8e8;
					transition: all 0.3s ease;
					cursor: default;
				}

				.breadcrumb-text.completed {
					color: white;
					background: #4caf50;
					border-color: #4caf50;
					font-weight: 700;
					box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
				}

				.breadcrumb-text.active {
					color: white;
					background: #3b82f6;
					border-color: #3b82f6;
					font-weight: 700;
					box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
					transform: scale(1.05);
				}

				.breadcrumb-arrow {
					color: #3b82f6;
					font-size: 20px;
					font-weight: 700;
					opacity: 0.6;
				}

				.flow-container {
					display: flex;
					flex-direction: column;
					gap: 16px;
				}

				.step-content-wrapper {
					background: white;
					border: 1px solid #ddd;
					border-radius: 8px;
					padding: 20px;
					min-height: auto;
				}

				.step-header-compact {
					margin-bottom: 16px;
				}

				.step-header-compact h2 {
					font-size: 16px;
					font-weight: 600;
					margin: 0 0 4px 0;
					color: #333;
				}

				.step-header-compact p {
					font-size: 12px;
					color: #999;
					margin: 0;
				}

				.credentials-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
					gap: 12px;
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

				.form-group input {
					padding: 8px 10px;
					border: 1px solid #ddd;
					border-radius: 4px;
					font-size: 13px;
					font-family: monospace;
				}

				.form-group input:focus {
					outline: none;
					border-color: #2196f3;
					box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
				}

				.btn {
					padding: 8px 14px;
					border: none;
					border-radius: 4px;
					font-size: 13px;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;
				}

				.btn-primary {
					background: #2196f3;
					color: white;
				}

				.btn-primary:hover {
					background: #1976d2;
				}

				.btn-secondary {
					background: #f5f5f5;
					color: #333;
					border: 1px solid #ddd;
				}

				.btn-secondary:hover {
					background: #e8e8e8;
				}

				.btn-reset {
					background: #ff9800;
					color: white;
					align-self: flex-start;
				}

				.btn-reset:hover {
					background: #f57c00;
				}

				.code-block {
					background: #f5f5f5;
					border: 1px solid #ddd;
					border-radius: 4px;
					padding: 10px;
					margin: 8px 0;
					overflow-x: auto;
				}

				.code-block pre {
					margin: 0;
					font-size: 11px;
					font-family: monospace;
					color: #333;
					word-break: break-all;
					white-space: pre-wrap;
				}

				.token-display {
					display: flex;
					flex-direction: column;
					gap: 12px;
				}

				.token-section {
					border: 1px solid #ddd;
					border-radius: 4px;
					padding: 12px;
					background: #f9f9f9;
				}

				.token-section h3 {
					margin: 0 0 8px 0;
					font-size: 13px;
					font-weight: 600;
					color: #333;
				}

				.step-content h2 {
					font-size: 16px;
					font-weight: 600;
					margin: 0 0 8px 0;
					color: #333;
				}

				.step-content > p {
					font-size: 13px;
					color: #666;
					margin: 0 0 12px 0;
				}

				.redirectless-option {
					margin-top: 20px;
					padding: 16px;
					background: #f0f9ff; /* Light blue background */
					border: 1px solid #bae6fd;
					border-radius: 6px;
				}

				.checkbox-wrapper {
					display: flex;
					align-items: center;
					gap: 10px;
				}

				.checkbox-wrapper input[type="checkbox"] {
					width: 18px;
					height: 18px;
					cursor: pointer;
				}

				.checkbox-label {
					cursor: pointer;
					font-size: 14px;
					font-weight: 500;
					color: #1f2937; /* Dark text on light background */
					margin: 0;
				}

				.checkbox-text {
					color: #1f2937; /* Dark text on light background */
				}

				.checkbox-description {
					font-size: 12px;
					color: #374151; /* Dark text on light background */
					margin: 8px 0 0 28px;
				}

				.redirectless-credentials {
					margin-top: 16px;
					padding: 16px;
					background: #fef3c7; /* Light yellow background */
					border: 1px solid #fde68a;
					border-radius: 6px;
				}

				.redirectless-credentials h3 {
					font-size: 14px;
					font-weight: 600;
					margin: 0 0 12px 0;
					color: #92400e; /* Dark brown text on light yellow */
				}

				.success-message {
					margin-top: 16px;
					padding: 16px;
					background: #d1fae5; /* Light green background */
					border: 1px solid #6ee7b7;
					border-radius: 6px;
				}

				.success-message p {
					margin: 0 0 8px 0;
					font-size: 14px;
					font-weight: 500;
					color: #065f46; /* Dark green text on light green */
				}

				.success-message p:last-child {
					margin-bottom: 0;
				}

				.code-preview {
					font-family: monospace;
					font-size: 12px;
					color: #047857; /* Dark green text on light green */
				}

				@media (max-width: 600px) {
					.oauth-authz-code-flow-v8 {
						padding: 12px;
					}

					.flow-header h1 {
						font-size: 18px;
					}

					.credentials-grid {
						grid-template-columns: 1fr;
					}

					.btn {
						width: 100%;
					}
				}
			`}</style>
		</div>
	);
};

export default OAuthAuthorizationCodeFlowV8;
