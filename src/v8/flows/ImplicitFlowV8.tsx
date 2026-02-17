/**
 * @file ImplicitFlowV8.tsx
 * @module v8/flows
 * @description OAuth 2.0 Implicit Flow with OIDC support
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useEffect, useState } from 'react';
import { ButtonSpinner } from '@/components/ui/ButtonSpinner';
import CredentialsFormV8 from '@/v8/components/CredentialsFormV8';
import StepActionButtonsV8 from '@/v8/components/StepActionButtonsV8';
import StepValidationFeedbackV8 from '@/v8/components/StepValidationFeedbackV8';
import { useStepNavigationV8 } from '@/v8/hooks/useStepNavigationV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { FlowResetServiceV8 } from '@/v8/services/flowResetServiceV8';
import { ImplicitFlowIntegrationServiceV8 } from '@/v8/services/implicitFlowIntegrationServiceV8';
import { RedirectlessServiceV8 } from '@/v8/services/redirectlessServiceV8';
import { StandardModalSpinner, useStandardSpinner } from '../../components/ui/StandardSpinner';
import { PingOneAppConfigForm } from '../components/PingOneAppConfigForm';
import { usePingOneAppConfig } from '../hooks/usePingOneAppConfig';
import { ValidationServiceV8 } from '../services/validationServiceV8';

const MODULE_TAG = '[🔓 IMPLICIT-FLOW-V8]';
const FLOW_KEY = 'implicit-flow-v8';

interface Credentials {
	environmentId: string;
	clientId: string;
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
	environmentId: string;
	clientId: string;
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

interface ImplicitFlowState {
	authorizationUrl: string;
	state: string;
	nonce: string;
	accessToken: string;
	idToken?: string;
	tokenType: string;
	expiresIn: number;
	scope?: string;
}

export const ImplicitFlowV8: React.FC = () => {
	console.log(`${MODULE_TAG} Initializing flow`);

	const nav = useStepNavigationV8(4, {
		onStepChange: (step) => console.log(`${MODULE_TAG} Step changed to`, { step }),
	});

	const [credentials, setCredentials] = useState<Credentials>(() => {
		return CredentialsServiceV8.loadCredentials('implicit-flow-v8', {
			flowKey: 'implicit-flow-v8',
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: true,
			includeLogoutUri: false,
			includeScopes: true,
			defaultScopes: 'openid profile email',
			defaultRedirectUri: 'http://localhost:3000/implicit-callback',
		});
	});

	const [flowState, setFlowState] = useState<ImplicitFlowState>({
		authorizationUrl: '',
		state: '',
		nonce: '',
		accessToken: '',
		idToken: '',
		tokenType: 'Bearer',
		expiresIn: 3600,
		scope: '',
	});

	const [useRedirectless, setUseRedirectless] = useState<boolean>(() => {
		const stored = sessionStorage.getItem(`${FLOW_KEY}_use_redirectless`);
		return stored === 'true';
	});

	const [redirectlessCredentials, setRedirectlessCredentials] = useState({
		username: '',
		password: '',
	});

	// Standardized spinner hooks for implicit flow operations
	const authUrlSpinner = useStandardSpinner(3000); // Generate auth URL - 3 seconds
	const redirectlessSpinner = useStandardSpinner(7000); // Redirectless flow - 7 seconds
	const tokenSpinner = useStandardSpinner(4000); // Token processing - 4 seconds

	// Action button hooks for button state management
	const { config: appConfig } = usePingOneAppConfig();

	useEffect(() => {
		const result = ValidationServiceV8.validateCredentials(credentials, 'oauth', {
			allowRedirectUriPatterns: appConfig.allowRedirectUriPatterns,
			oauthVersion: appConfig.oauthVersion,
		});
		nav.setValidationErrors(result.errors.map((e) => e.message));
		nav.setValidationWarnings(result.warnings.map((w) => w.message));
		CredentialsServiceV8.saveCredentials('implicit-flow-v8', credentials);
		// biome-ignore lint/correctness/useExhaustiveDependencies: nav functions are stable from hook
	}, [credentials, nav.setValidationErrors, nav.setValidationWarnings, appConfig]);

	useEffect(() => {
		sessionStorage.setItem(`${FLOW_KEY}_use_redirectless`, useRedirectless.toString());
	}, [useRedirectless]);

	// Check URL fragment for tokens on mount only (prevent infinite loop)
	useEffect(() => {
		const fragment = window.location.hash.substring(1);
		if (fragment?.includes('access_token')) {
			console.log(`${MODULE_TAG} Tokens found in URL fragment`);
			const params = new URLSearchParams(fragment);
			const accessToken = params.get('access_token');
			if (accessToken) {
				setFlowState((prev) => ({
					...prev,
					accessToken: accessToken,
					idToken: params.get('id_token') || '',
					tokenType: params.get('token_type') || 'Bearer',
					expiresIn: params.get('expires_in') ? parseInt(params.get('expires_in')!, 10) : 3600,
					state: params.get('state') || '',
				}));
				nav.goToStep(2);
				nav.markStepComplete();
			}
		}
		// biome-ignore lint/correctness/useExhaustiveDependencies: Only run once on mount to prevent infinite loop
	}, [nav.goToStep, nav.markStepComplete]);

	const renderStep0 = () => (
		<div className="step-content">
			<CredentialsFormV8
				flowKey="implicit-flow-v8"
				credentials={credentials}
				onChange={(updated: unknown) => {
					setCredentials(updated as Credentials);
				}}
				title="OAuth 2.0 Configure App & Environment"
				subtitle="ID token + Access token - Authentication + Authorization"
			/>

			<PingOneAppConfigForm />

			<div className="redirectless-option">
				<div className="checkbox-wrapper">
					<input
						type="checkbox"
						id="use-redirectless-implicit"
						checked={useRedirectless}
						onChange={(e) => setUseRedirectless(e.target.checked)}
						aria-label="Use redirectless authentication"
					/>
					<label htmlFor="use-redirectless-implicit" className="checkbox-label">
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
						<label htmlFor="redirectless-username-implicit">
							Username <span className="required">*</span>
						</label>
						<input
							id="redirectless-username-implicit"
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
						<label htmlFor="redirectless-password-implicit">
							Password <span className="required">*</span>
						</label>
						<input
							id="redirectless-password-implicit"
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
			<h2>{useRedirectless ? 'Authenticate with PingOne' : 'Generate Authorization URL'}</h2>
			<p>
				{useRedirectless
					? 'Authenticate using PingOne redirectless flow to receive tokens directly.'
					: 'Redirect user to authenticate and authorize'}
			</p>
			<ButtonSpinner
				loading={redirectlessSpinner.isLoading || authUrlSpinner.isLoading}
				onClick={async () => {
					const spinner = useRedirectless ? redirectlessSpinner : authUrlSpinner;

					await spinner.executeWithSpinner(
						async () => {
							console.log(
								`${MODULE_TAG} ${useRedirectless ? 'Starting redirectless flow' : 'Generating authorization URL'}`
							);

							if (!credentials.redirectUri) {
								nav.setValidationErrors(['Redirect URI is required']);
								throw new Error('Redirect URI is required');
							}

							if (useRedirectless) {
								// Validate redirectless credentials
								if (!redirectlessCredentials.username || !redirectlessCredentials.password) {
									nav.setValidationErrors([
										'Username and password are required for redirectless authentication',
									]);
									throw new Error(
										'Username and password are required for redirectless authentication'
									);
								}

								// Start redirectless flow for implicit
								const flowResult = await RedirectlessServiceV8.completeFlow({
									credentials: {
										environmentId: credentials.environmentId,
										clientId: credentials.clientId,
										redirectUri: credentials.redirectUri,
										scopes: credentials.scopes || 'openid profile email',
									},
									flowType: 'implicit',
									flowKey: FLOW_KEY,
									responseType: 'id_token token',
									username: redirectlessCredentials.username,
									password: redirectlessCredentials.password,
									onTokensReceived: (tokens) => {
										console.log(`${MODULE_TAG} Received tokens via redirectless`, {
											accessToken: tokens.accessToken,
											idToken: tokens.idToken,
										});
										setFlowState({
											...flowState,
											accessToken: tokens.accessToken,
											idToken: tokens.idToken,
											tokenType: tokens.tokenType,
											expiresIn: tokens.expiresIn,
											scope: tokens.scope,
										});
									},
								});

								if (flowResult.tokens) {
									setFlowState({
										...flowState,
										accessToken: flowResult.tokens.accessToken,
										idToken: flowResult.tokens.idToken,
										tokenType: flowResult.tokens.tokenType,
										expiresIn: flowResult.tokens.expiresIn,
										scope: flowResult.tokens.scope,
									});
									nav.nextStep();
								}
							} else {
								// Standard flow - generate authorization URL
								const result = await ImplicitFlowIntegrationServiceV8.generateAuthorizationUrl({
									environmentId: credentials.environmentId,
									clientId: credentials.clientId,
									redirectUri: credentials.redirectUri,
									scopes: credentials.scopes || 'openid profile email',
								});
								setFlowState({
									...flowState,
									authorizationUrl: result.authorizationUrl,
									state: result.state,
									nonce: result.nonce,
								});
								nav.markStepComplete();
							}
						},
						{
							onError: (error) => {
								console.error(`${MODULE_TAG} Error in step 1`, error);
								nav.setValidationErrors([
									`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
								]);
							},
						}
					);
				}}
				spinnerSize={16}
				spinnerPosition="left"
				loadingText={useRedirectless ? 'Authenticating...' : 'Generating...'}
				className="btn btn-next"
			>
				{useRedirectless ? 'Authenticate with PingOne' : 'Generate Authorization URL'}
			</ButtonSpinner>
			{!useRedirectless && flowState.authorizationUrl && (
				<div className="code-block">
					<pre>{flowState.authorizationUrl}</pre>
					<ButtonSpinner
						loading={false}
						onClick={() => {
							navigator.clipboard.writeText(flowState.authorizationUrl);
							console.log(`${MODULE_TAG} URL copied to clipboard`);
						}}
						spinnerSize={12}
						spinnerPosition="left"
						loadingText="Copying..."
						className="btn btn-secondary"
					>
						Copy URL
					</ButtonSpinner>
					<ButtonSpinner
						loading={false}
						onClick={() => {
							window.open(flowState.authorizationUrl, '_blank');
						}}
						spinnerSize={12}
						spinnerPosition="left"
						loadingText="Opening..."
						className="btn btn-secondary"
					>
						Open in Browser
					</ButtonSpinner>
				</div>
			)}

			{useRedirectless && flowState.accessToken && (
				<div className="success-message">
					<p>✅ Authentication successful! Tokens received.</p>
					<p className="code-preview">Access Token: {flowState.accessToken.substring(0, 30)}...</p>
				</div>
			)}
		</div>
	);

	const renderStep2 = () => (
		<div className="step-content">
			<h2>Handle Callback</h2>
			<p>After authenticating, you'll be redirected back here with tokens in the URL fragment.</p>

			<div className="form-group">
				<label htmlFor="implicit-callback-url">Callback URL</label>
				<input
					id="implicit-callback-url"
					type="text"
					placeholder="http://localhost:3000/implicit-callback#access_token=...&id_token=..."
					value={flowState.authorizationUrl}
					onChange={(e) => setFlowState({ ...flowState, authorizationUrl: e.target.value })}
					aria-label="Callback URL"
				/>
				<small>Paste the full callback URL here (tokens in fragment)</small>
			</div>

			<ButtonSpinner
				loading={false}
				onClick={() => {
					console.log(`${MODULE_TAG} Parsing callback URL`);
					try {
						const fragment = flowState.authorizationUrl.split('#')[1];
						if (!fragment) {
							throw new Error('No fragment found in URL');
						}
						const params = new URLSearchParams(fragment);
						const accessToken = params.get('access_token');
						const idToken = params.get('id_token');
						const tokenType = params.get('token_type') || 'Bearer';
						const expiresIn = params.get('expires_in');
						const scope = params.get('scope');
						const state = params.get('state');

						if (!accessToken) {
							throw new Error('Access token not found in URL');
						}

						setFlowState({
							...flowState,
							accessToken,
							idToken: idToken || undefined,
							tokenType,
							expiresIn: expiresIn ? parseInt(expiresIn) : 3600,
							scope: scope || undefined,
							state: params.get('state') || '',
						});
						nav.markStepComplete();
					} catch (error) {
						console.error(`${MODULE_TAG} Error parsing callback URL`, error);
						nav.setValidationErrors([
							`Failed to parse callback URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
						]);
					}
				}}
				spinnerSize={16}
				spinnerPosition="left"
				loadingText="Parsing..."
				className="btn btn-primary"
			>
				Parse Callback URL
			</ButtonSpinner>
		</div>
	);

	const renderStep3 = () => (
		<div className="step-content">
			<h2>Tokens Received</h2>
			<p>Tokens extracted from URL fragment</p>

			{flowState.accessToken && (
				<div className="token-display">
					<div className="token-section">
						<h3>🎫 Access Token</h3>
						<div className="code-block">
							<pre>{flowState.accessToken}</pre>
							<ButtonSpinner
								loading={false}
								onClick={() => {
									navigator.clipboard.writeText(flowState.accessToken);
									console.log(`${MODULE_TAG} Token copied to clipboard`);
								}}
								spinnerSize={12}
								spinnerPosition="left"
								loadingText="Copying..."
								className="btn btn-secondary"
							>
								Copy
							</ButtonSpinner>
							<ButtonSpinner
								loading={false}
								onClick={() => {
									try {
										const decoded = ImplicitFlowIntegrationServiceV8.decodeToken(
											flowState.accessToken
										);
										console.log(`${MODULE_TAG} Decoded token:`, decoded.payload);
									} catch (error) {
										console.error(
											`${MODULE_TAG} Error decoding token:`,
											error instanceof Error ? error.message : 'Unknown error'
										);
									}
								}}
								spinnerSize={12}
								spinnerPosition="left"
								loadingText="Decoding..."
								className="btn btn-secondary"
							>
								Decode
							</ButtonSpinner>
						</div>
						<small>
							Type: {flowState.tokenType} | Expires: {flowState.expiresIn}s
						</small>
					</div>

					{flowState.idToken && (
						<div className="token-section">
							<h3>🆔 ID Token</h3>
							<div className="code-block">
								<pre>{flowState.idToken}</pre>
								<ButtonSpinner
									loading={false}
									onClick={() => {
										navigator.clipboard.writeText(flowState.idToken || '');
										console.log(`${MODULE_TAG} Token copied to clipboard`);
									}}
									spinnerSize={12}
									spinnerPosition="left"
									loadingText="Copying..."
									className="btn btn-secondary"
								>
									Copy
								</ButtonSpinner>
								<ButtonSpinner
									loading={false}
									onClick={() => {
										try {
											const decoded = ImplicitFlowIntegrationServiceV8.decodeToken(
												flowState.idToken || ''
											);
											console.log(`${MODULE_TAG} Decoded token:`, decoded.payload);
										} catch (error) {
											console.error(
												`${MODULE_TAG} Error decoding token:`,
												error instanceof Error ? error.message : 'Unknown error'
											);
										}
									}}
									spinnerSize={12}
									spinnerPosition="left"
									loadingText="Decoding..."
									className="btn btn-secondary"
								>
									Decode
								</ButtonSpinner>
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
		<>
			{/* Modal Spinners for Implicit Flow Operations */}
			<StandardModalSpinner
				show={authUrlSpinner.isLoading}
				message="Generating authorization URL..."
				theme="blue"
			/>
			<StandardModalSpinner
				show={redirectlessSpinner.isLoading}
				message="Processing redirectless flow..."
				theme="purple"
			/>
			<StandardModalSpinner
				show={tokenSpinner.isLoading}
				message="Processing tokens..."
				theme="green"
			/>

			<div className="implicit-flow-v8">
				<div className="flow-header">
					<div className="header-content">
						<div className="header-left">
							<span className="version-tag">V8</span>
							<div className="header-text">
								<h1>OAuth 2.0 Implicit Flow</h1>
								<p>Complete OAuth 2.0 Implicit Flow with OIDC support</p>
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

					<StepValidationFeedbackV8
						errors={nav.validationErrors}
						warnings={nav.validationWarnings}
					/>

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
							setCredentials(CredentialsServiceV8.getSmartDefaults('implicit-flow-v8'));
							setFlowState({
								authorizationUrl: '',
								state: '',
								nonce: '',
								accessToken: '',
								idToken: '',
								tokenType: 'Bearer',
								expiresIn: 3600,
								scope: '',
							});
						}}
					/>

					<ButtonSpinner
						loading={false}
						onClick={() => {
							console.log(`${MODULE_TAG} Resetting flow`);
							FlowResetServiceV8.resetFlow('implicit-flow-v8');
							// Reload credentials from storage (preserves credentials)
							const reloaded = CredentialsServiceV8.loadCredentials('implicit-flow-v8', {
								flowKey: 'implicit-flow-v8',
								flowType: 'oidc',
								includeClientSecret: false,
								includeRedirectUri: true,
								includeLogoutUri: false,
								includeScopes: true,
								defaultScopes: 'openid profile email',
								defaultRedirectUri: 'http://localhost:3000/implicit-callback',
							});
							setCredentials(reloaded);
							nav.reset();
						}}
						spinnerSize={12}
						spinnerPosition="left"
						loadingText="Resetting..."
						className="btn btn-reset"
					>
						Reset Flow
					</ButtonSpinner>
				</div>

				<style>{`
				.implicit-flow-v8 {
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
					margin-right: 8px;
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
					margin: 0 0 8px 0;
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

				.token-section small {
					display: block;
					font-size: 11px;
					color: #999;
					margin-top: 8px;
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
					.implicit-flow-v8 {
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
		</>
	);
};

export default ImplicitFlowV8;
