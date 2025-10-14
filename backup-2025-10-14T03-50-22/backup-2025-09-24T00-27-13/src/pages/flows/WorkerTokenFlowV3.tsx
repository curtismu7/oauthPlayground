// Worker Token Flow V3 - Machine-to-machine authentication using client credentials

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import {
	FiSettings,
	FiKey,
	FiShield,
	FiServer,
	FiRefreshCw,
	FiCheckCircle,
	FiAlertCircle,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/NewAuthContext';
import { logger } from '../../utils/logger';
import { showFlowSuccess, showFlowError } from '../../components/CentralizedSuccessMessage';
import { storeOAuthTokens } from '../../utils/tokenStorage';
import { EnhancedStepFlowV2 } from '../../components/EnhancedStepFlowV2';
import { useFlowStepManager } from '../../utils/flowStepSystem';
import { WorkerTokenDisplay } from '../../components/worker/WorkerTokenDisplay';
import { createCredentialsStep, StepCredentials } from '../../components/steps/CommonSteps';
import {
	requestClientCredentialsToken,
	introspectToken,
	validateWorkerCredentials,
	generateTokenEndpoint,
	generateIntrospectionEndpoint,
	createTokenCacheKey,
	getDefaultWorkerScopes,
	validateEnvironmentId,
} from '../../utils/workerToken';
import {
	secureStore,
	secureRetrieve,
	validateCredentialFormat,
	clearCredentials as clearStoredCredentials,
	loadCredentialsFromEnv,
} from '../../utils/clientCredentials';
import {
	createPingOneClient,
	discoverWorkerApp,
	getEnvironmentInfo,
	testApiAccess,
} from '../../utils/apiClient';
import {
	getCachedToken,
	setCachedToken,
	shouldRefreshToken,
	autoRefreshTokenIfNeeded,
} from '../../utils/tokenCache';
import {
	WorkerTokenFlowState,
	WorkerTokenCredentials,
	WorkerTokenStep,
} from '../../types/workerToken';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 1.125rem;
  opacity: 0.9;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SuccessMessage = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const WorkerTokenFlowV3: React.FC = () => {
	const authContext = useAuth();
	const { config } = authContext;

	const stepManager = useFlowStepManager({
		flowType: 'worker-token',
		persistKey: 'worker_token_flow_step_manager',
		defaultStep: 0,
		enableAutoAdvance: true,
	});

	const [flowState, setFlowState] = useState<WorkerTokenFlowState>({
		config: {
			environmentId: '',
			tokenEndpoint: '',
			introspectionEndpoint: '',
			clientId: '',
			clientSecret: '',
			scopes: getDefaultWorkerScopes(),
		},
	});

	const [credentials, setCredentials] = useState<StepCredentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: '',
		scopes: getDefaultWorkerScopes(),
	});

	const [showSecret, setShowSecret] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	// Load initial credentials from environment or stored data
	useEffect(() => {
		const loadInitialCredentials = async () => {
			try {
				// Load from environment variables
				const envCredentials = loadCredentialsFromEnv();

				// Load from stored credentials
				const storedCredentials = await secureRetrieve();

				// Merge credentials (manual > stored > env)
				const initialCredentials: StepCredentials = {
					environmentId: envCredentials.environment_id || storedCredentials?.environment_id || '',
					clientId: envCredentials.client_id || storedCredentials?.client_id || '',
					clientSecret: envCredentials.client_secret || storedCredentials?.client_secret || '',
					redirectUri: '', // Worker tokens don't need redirect URI
					scopes: envCredentials.scopes || storedCredentials?.scopes || getDefaultWorkerScopes(),
				};

				setCredentials(initialCredentials);

				// Auto-generate endpoints
				if (
					initialCredentials.environmentId &&
					validateEnvironmentId(initialCredentials.environmentId)
				) {
					const tokenEndpoint = generateTokenEndpoint(initialCredentials.environmentId);
					const introspectionEndpoint = generateIntrospectionEndpoint(
						initialCredentials.environmentId
					);

					setFlowState((prev) => ({
						...prev,
						config: {
							environmentId: initialCredentials.environmentId,
							tokenEndpoint,
							introspectionEndpoint,
							clientId: initialCredentials.clientId,
							clientSecret: initialCredentials.clientSecret,
							scopes: initialCredentials.scopes,
						},
					}));
				}

				logger.info('WORKER-FLOW-V3', 'Initial credentials loaded', {
					hasClientId: !!initialCredentials.clientId,
					hasSecret: !!initialCredentials.clientSecret,
					hasEnvironmentId: !!initialCredentials.environmentId,
					scopes: initialCredentials.scopes.length,
				});
			} catch (error) {
				logger.error('WORKER-FLOW-V3', 'Failed to load initial credentials', error);
			}
		};

		loadInitialCredentials();
	}, []);

	// Save credentials
	const saveCredentials = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			// Validate credentials
			const validation = validateCredentialFormat(credentials.clientId, credentials.clientSecret);
			if (!validation.isValid) {
				throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
			}

			// Validate environment ID
			if (!validateEnvironmentId(credentials.environmentId)) {
				throw new Error('Invalid environment ID format');
			}

			// Auto-generate endpoints
			const tokenEndpoint = generateTokenEndpoint(credentials.environmentId);
			const introspectionEndpoint = generateIntrospectionEndpoint(credentials.environmentId);

			// Update flow state
			setFlowState((prev) => ({
				...prev,
				config: {
					environmentId: credentials.environmentId,
					tokenEndpoint,
					introspectionEndpoint,
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret,
					scopes: credentials.scopes,
				},
			}));

			// Store credentials securely (convert to WorkerTokenCredentials format)
			const workerCredentials: WorkerTokenCredentials = {
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
				environment_id: credentials.environmentId,
				scopes: credentials.scopes,
			};
			await secureStore(workerCredentials);

			showFlowSuccess(
				'✅ Worker Credentials Saved',
				'Configuration saved successfully. Ready to request token.'
			);
			setSuccess('Credentials saved successfully!');

			logger.success('WORKER-FLOW-V3', 'Credentials saved', {
				clientId: credentials.clientId.substring(0, 8) + '...',
				environmentId: credentials.environmentId,
				scopes: credentials.scopes.length,
			});

			// Auto-advance to token request step
			stepManager.setStep(1, 'credentials saved, ready for token request');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to save credentials';
			setError(errorMessage);
			showFlowError(errorMessage);
			logger.error('WORKER-FLOW-V3', 'Failed to save credentials', error);
		} finally {
			setIsLoading(false);
		}
	}, [credentials, stepManager, showFlowSuccess, showFlowError]);

	// Request access token
	const requestAccessToken = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			showFlowSuccess(
				'🚀 Requesting Worker Token',
				'Sending client credentials request to PingOne...'
			);

			// Check cache first
			const cacheKey = createTokenCacheKey(credentials.clientId, credentials.scopes);
			const cachedToken = getCachedToken(cacheKey);

			if (cachedToken && !shouldRefreshToken(cachedToken)) {
				logger.info('WORKER-FLOW-V3', 'Using cached token', { cacheKey });
				setFlowState((prev) => ({
					...prev,
					tokens: cachedToken.token,
					lastRequestTime: Date.now(),
				}));

				showFlowSuccess('✅ Cached Token Retrieved', 'Using previously cached worker token.');
				stepManager.setStep(2, 'token retrieved from cache');
				return cachedToken.token;
			}

			// Request new token
			const tokenResponse = await requestClientCredentialsToken(
				flowState.config.tokenEndpoint,
				credentials.clientId,
				credentials.clientSecret,
				credentials.scopes
			);

			// Cache the token
			setCachedToken(cacheKey, tokenResponse);

			// Update flow state
			setFlowState((prev) => ({
				...prev,
				tokens: tokenResponse,
				lastRequestTime: Date.now(),
			}));

			// Store tokens for the app
			const tokensToStore = {
				access_token: tokenResponse.access_token,
				token_type: tokenResponse.token_type,
				expires_in: tokenResponse.expires_in,
				scope: tokenResponse.scope,
			};

			await storeOAuthTokens(tokensToStore, 'worker_token');

			showFlowSuccess(
				'✅ Worker Token Received',
				`Successfully obtained worker token. Expires in ${tokenResponse.expires_in} seconds.`
			);

			logger.success('WORKER-FLOW-V3', 'Worker token received', {
				tokenType: tokenResponse.token_type,
				expiresIn: tokenResponse.expires_in,
				scopes: tokenResponse.scope,
			});

			// Auto-advance to validation step
			stepManager.setStep(2, 'token received, ready for validation');

			return tokenResponse;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to obtain worker token';
			setError(errorMessage);
			showFlowError(errorMessage);
			logger.error('WORKER-FLOW-V3', 'Token request failed', error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, [credentials, flowState.config.tokenEndpoint, stepManager, showFlowSuccess, showFlowError]);

	// Validate token
	const validateToken = useCallback(async () => {
		if (!flowState.tokens) {
			throw new Error('No token to validate');
		}

		setIsLoading(true);
		setError(null);

		try {
			showFlowSuccess('🔍 Validating Token', 'Introspecting worker token...');

			// Introspect token
			const introspection = await introspectToken(
				flowState.config.introspectionEndpoint,
				flowState.tokens.access_token,
				{
					client_id: credentials.clientId,
					client_secret: credentials.clientSecret,
					environment_id: credentials.environmentId,
					scopes: credentials.scopes,
				}
			);

			// Update flow state
			setFlowState((prev) => ({
				...prev,
				introspection,
			}));

			if (introspection.active) {
				showFlowSuccess('✅ Token Valid', 'Worker token is active and valid.');
				stepManager.setStep(3, 'token validated successfully');
			} else {
				showFlowError('Token is not active or has expired');
				setError('Token validation failed: token is not active');
			}

			logger.success('WORKER-FLOW-V3', 'Token introspection completed', {
				active: introspection.active,
				scopes: introspection.scope,
				clientId: introspection.client_id,
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Token validation failed';
			setError(errorMessage);
			showFlowError(errorMessage);
			logger.error('WORKER-FLOW-V3', 'Token validation failed', error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, [
		flowState.tokens,
		flowState.config.introspectionEndpoint,
		credentials,
		stepManager,
		showFlowSuccess,
		showFlowError,
	]);

	// Test API access
	const testApiAccess = useCallback(async () => {
		if (!flowState.tokens) {
			throw new Error('No token available for API testing');
		}

		setIsLoading(true);
		setError(null);

		try {
			showFlowSuccess(
				'🧪 Testing API Access',
				'Testing worker token with PingOne Management API...'
			);

			// Create API client
			const apiClient = createPingOneClient(
				flowState.tokens.access_token,
				credentials.environmentId
			);

			// Test API access
			const scopesArray = credentials.scopes ? credentials.scopes.split(' ') : [];
			const apiAccessResult = await testApiAccess(apiClient, scopesArray);

			// Discover worker app
			const workerApp = await discoverWorkerApp(apiClient, credentials.clientId);

			// Get environment info
			const environment = await getEnvironmentInfo(apiClient);

			// Update flow state
			setFlowState((prev) => ({
				...prev,
				apiAccess: {
					...apiAccessResult,
					testedAt: Date.now(),
				},
				workerApp,
				environment,
			}));

			if (apiAccessResult.success) {
				showFlowSuccess(
					'✅ API Access Confirmed',
					`Successfully accessed ${apiAccessResult.accessibleEndpoints.length} API endpoints.`
				);
				stepManager.setStep(4, 'API access confirmed, flow complete');
			} else {
				showFlowError('API access failed. Check your scopes and permissions.');
				setError('API access test failed');
			}

			logger.success('WORKER-FLOW-V3', 'API access test completed', {
				success: apiAccessResult.success,
				accessibleEndpoints: apiAccessResult.accessibleEndpoints.length,
				errors: apiAccessResult.errors.length,
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'API access test failed';
			setError(errorMessage);
			showFlowError(errorMessage);
			logger.error('WORKER-FLOW-V3', 'API access test failed', error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, [flowState.tokens, credentials, stepManager, showFlowSuccess, showFlowError]);

	// Clear credentials
	const clearCredentials = useCallback(() => {
		clearStoredCredentials();
		setCredentials({
			environmentId: '',
			clientId: '',
			clientSecret: '',
			redirectUri: '',
			scopes: getDefaultWorkerScopes(),
		});
		setFlowState((prev) => ({
			...prev,
			tokens: null,
			introspection: null,
			workerApp: null,
			environment: null,
			apiAccess: null,
		}));
		setError(null);
		setSuccess(null);
		stepManager.resetFlow();

		logger.info('WORKER-FLOW-V3', 'Credentials and flow state cleared');
	}, [stepManager]);

	// Define steps
	const steps = useMemo(
		(): WorkerTokenStep[] => [
			{
				...createCredentialsStep(
					credentials,
					setCredentials,
					saveCredentials,
					'PingOne Worker Token Flow',
					undefined,
					'worker_token_v3',
					showSecret,
					setShowSecret
				),
				id: 'configure',
				title: 'Setup Worker Credentials',
				description: `Configure your PingOne client credentials for worker token authentication.

🤖 Worker Tokens are designed for machine-to-machine (M2M) communication - no user interaction required.

🎯 Perfect for: Background services, server-to-server APIs, data synchronization, monitoring, and integration workflows.

🔧 How it works: Your application authenticates using client credentials, receives an access token, and can call PingOne Management API endpoints.

⚠️ Security: Worker Tokens have broad permissions - use only trusted applications and store secrets securely.`,
				category: 'preparation',
				canExecute: Boolean(
					credentials.environmentId && credentials.clientId && credentials.clientSecret
				),
				completed: Boolean(
					credentials.environmentId && credentials.clientId && credentials.clientSecret
				),
				execute: saveCredentials,
				// Hide Sign On button for Worker Tokens (no user interaction needed)
				hideDefaultButton: true,
			},
			{
				id: 'request-token',
				title: 'Request Worker Token',
				description: 'Obtain access token using client credentials grant',
				category: 'token-exchange',
				canExecute:
					!!flowState.config.tokenEndpoint &&
					!!credentials.client_id &&
					!!credentials.client_secret,
				completed: !!flowState.tokens,
				execute: requestAccessToken,
			},
			{
				id: 'validate-token',
				title: 'Validate Token',
				description: 'Introspect and validate the worker token',
				category: 'validation',
				canExecute: !!flowState.tokens,
				completed: !!flowState.introspection?.active,
				execute: validateToken,
			},
			{
				id: 'test-api',
				title: 'Test API Access',
				description: 'Test worker token with PingOne Management API',
				category: 'validation',
				canExecute: !!flowState.tokens && !!flowState.introspection?.active,
				completed: !!flowState.apiAccess?.success,
				execute: testApiAccess,
			},
		],
		[credentials, flowState, saveCredentials, requestAccessToken, validateToken, testApiAccess]
	);

	return (
		<Container>
			<Header>
				<Title>🚀 PingOne Worker Token V3</Title>
				<Subtitle>Machine-to-machine authentication using client credentials</Subtitle>
				<div style={{ marginTop: '1rem', fontSize: '1rem', opacity: 0.95 }}>
					<p style={{ margin: '0.5rem 0' }}>
						<strong>No User Interaction Required</strong> - Worker Tokens are designed for automated
						systems, background services, and server-to-server communication.
					</p>
					<p style={{ margin: '0.5rem 0' }}>
						Perfect for: API integrations, data synchronization, monitoring, and automated
						workflows.
					</p>
				</div>
			</Header>

			{error && (
				<ErrorMessage>
					<FiAlertCircle size={20} />
					{error}
				</ErrorMessage>
			)}

			{success && (
				<SuccessMessage>
					<FiCheckCircle size={20} />
					{success}
				</SuccessMessage>
			)}

			<EnhancedStepFlowV2
				steps={steps.map((step) => ({
					id: step.id,
					title: step.title,
					description: step.description,
					icon:
						step.id === 'configure' ? (
							<FiSettings />
						) : step.id === 'request-token' ? (
							<FiKey />
						) : step.id === 'validate-token' ? (
							<FiShield />
						) : step.id === 'test-api' ? (
							<FiServer />
						) : (
							<FiCheckCircle />
						),
					category: step.category as 'preparation' | 'token-exchange' | 'validation' | 'cleanup',
					content:
						step.id !== 'configure' ? (
							<div>
								{step.id === 'request-token' && flowState.tokens && (
									<WorkerTokenDisplay
										token={flowState.tokens}
										introspection={flowState.introspection}
										onRefresh={requestAccessToken}
									/>
								)}

								{step.id === 'validate-token' && flowState.introspection && (
									<div>
										<h4>Token Introspection Results</h4>
										<pre>{JSON.stringify(flowState.introspection, null, 2)}</pre>
									</div>
								)}

								{step.id === 'test-api' && flowState.apiAccess && (
									<div>
										<h4>API Access Test Results</h4>
										<p>
											Accessible Endpoints: {flowState.apiAccess.accessibleEndpoints.join(', ')}
										</p>
										{flowState.apiAccess.errors.length > 0 && (
											<div>
												<h5>Errors:</h5>
												<ul>
													{flowState.apiAccess.errors.map((error, index) => (
														<li key={index}>{error}</li>
													))}
												</ul>
											</div>
										)}
									</div>
								)}
							</div>
						) : undefined,
					execute: step.execute,
					canExecute: step.canExecute,
					completed: step.completed,
				}))}
				stepManager={stepManager}
				onStepComplete={() => {}}
				showDebugInfo={false}
			/>
		</Container>
	);
};

export default WorkerTokenFlowV3;
