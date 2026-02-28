import type React from 'react';
import { useEffect, useState } from 'react';
import { FiAlertCircle } from '@icons';
import styled from 'styled-components';
import AuthorizationRequestModal from '../../components/AuthorizationRequestModal';
import {
	BaseOAuthFlow,
	Container,
	getPingOneEnvVars,
	useOAuthFlowBase,
} from '../../components/BaseOAuthFlow';
import { Card, CardBody, CardHeader } from '../../components/Card';
import { ColorCodedURL } from '../../components/ColorCodedURL';
import { OAuthFlowErrorBoundary } from '../../components/OAuthFlowErrorBoundary';
import { type FlowStep, StepByStepFlow } from '../../components/StepByStepFlow';
import TokenDisplayComponent from '../../components/TokenDisplay';
import { URLParamExplainer } from '../../components/URLParamExplainer';
import { usePageScroll } from '../../hooks/usePageScroll';
import { getDefaultConfig } from '../../utils/flowConfigDefaults';
import {
	buildOAuthURL,
	generateNonce,
	generateState,
	getOAuthFlowDescription,
	getOAuthFlowUseCases,
	handleOAuthFlowError,
	logOAuthFlowEvent,
	storeOAuthTokensSafely,
} from '../../utils/flowUtils';

// Styled components specific to this flow
const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.danger}10;
  border: 1px solid ${({ theme }) => theme.colors.danger}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.9rem;
`;

const DemoSection = styled(Card)`
  margin-bottom: 2rem;
`;

// Main Implicit Grant Flow Component
const ImplicitGrantFlowContent: React.FC = () => {
	const { isLoading, error, handleError, clearError, startLoading, stopLoading } =
		useOAuthFlowBase('implicit');

	const [_demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [currentStep, setCurrentStep] = useState(0);
	const [authUrl, setAuthUrl] = useState('');
	const [tokensReceived, setTokensReceived] = useState<Record<string, unknown> | null>(null);
	const [_stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);
	const [showRedirectModal, setShowRedirectModal] = useState(false);
	const [redirectUrl, setRedirectUrl] = useState('');
	const [redirectParams, setRedirectParams] = useState<Record<string, string>>({});

	usePageScroll();

	// Initialize flow
	useEffect(() => {
		logOAuthFlowEvent('Flow initialized', 'implicit');
		setDemoStatus('idle');
		setCurrentStep(0);
		setStepsWithResults([]);
		clearError();
	}, [clearError]);

	// Handle URL parameters from redirect
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const accessToken = urlParams.get('access_token');
		const idToken = urlParams.get('id_token');
		const state = urlParams.get('state');
		const error = urlParams.get('error');
		const errorDescription = urlParams.get('error_description');

		if (error) {
			const oauthError = {
				code: error,
				message: errorDescription || 'OAuth error occurred',
				description: errorDescription,
			};
			handleError(new Error(oauthError.message), 'OAuth redirect error');
			setDemoStatus('error');
			return;
		}

		if (accessToken || idToken) {
			logOAuthFlowEvent('Tokens received from redirect', 'implicit', {
				hasAccessToken: !!accessToken,
				hasIdToken: !!idToken,
			});

			const tokens: Record<string, unknown> = {};
			if (accessToken) tokens.access_token = accessToken;
			if (idToken) tokens.id_token = idToken;
			if (state) tokens.state = state;

			setTokensReceived(tokens);
			setDemoStatus('success');
			setCurrentStep(2);

			// Store tokens
			storeOAuthTokensSafely(tokens as any, 'implicit', 'Implicit Grant Flow');

			// Update steps with results
			setStepsWithResults((prev) => [
				...prev,
				{
					id: 'redirect-complete',
					title: 'Redirect Complete',
					description: 'Tokens received from authorization server',
					status: 'completed',
					details: tokens,
				},
			]);
		}
	}, [handleError]);

	// Generate authorization URL
	const generateAuthUrl = () => {
		try {
			startLoading();
			setDemoStatus('loading');
			clearError();

			const envVars = getPingOneEnvVars();
			const flowConfig = getDefaultConfig('implicit');

			const state = generateState();
			const nonce = generateNonce();

			const oauthConfig = {
				flowType: 'implicit',
				flowName: 'Implicit Grant Flow',
				clientId: envVars.clientId,
				redirectUri: `${window.location.origin}/callback`,
				scope: flowConfig.scope,
				state,
				nonce,
				responseType: 'token id_token',
				additionalParams: {
					response_mode: 'fragment',
				},
			};

			const authUrl = buildOAuthURL(`${envVars.apiUrl}/as/authorize`, oauthConfig);

			setAuthUrl(authUrl);
			setRedirectUrl(`${window.location.origin}/callback`);
			setRedirectParams({
				access_token: '[ACCESS_TOKEN]',
				id_token: '[ID_TOKEN]',
				state: state,
				token_type: 'Bearer',
				expires_in: '3600',
			});

			setCurrentStep(1);
			setDemoStatus('idle');

			logOAuthFlowEvent('Authorization URL generated', 'implicit', {
				hasState: !!state,
				hasNonce: !!nonce,
			});

			// Update steps with results
			setStepsWithResults((prev) => [
				...prev,
				{
					id: 'url-generated',
					title: 'Authorization URL Generated',
					description: 'URL created with required parameters',
					status: 'completed',
					details: { url: authUrl, state, nonce },
				},
			]);
		} catch (err) {
			const oauthError = handleOAuthFlowError(err, 'implicit', 'Generate auth URL');
			handleError(new Error(oauthError.message), 'Generate auth URL');
			setDemoStatus('error');
		} finally {
			stopLoading();
		}
	};

	// Handle redirect simulation
	const handleRedirectSimulation = () => {
		setShowRedirectModal(true);
	};

	// Flow steps definition
	const flowSteps: FlowStep[] = [
		{
			id: 'generate-url',
			title: 'Generate Authorization URL',
			description: 'Create the authorization URL with required parameters',
			status: currentStep >= 1 ? 'completed' : 'pending',
			action: generateAuthUrl,
			actionText: 'Generate URL',
		},
		{
			id: 'redirect-user',
			title: 'Redirect User to Authorization Server',
			description: 'User is redirected to PingOne for authentication',
			status: currentStep >= 2 ? 'completed' : 'pending',
			action: handleRedirectSimulation,
			actionText: 'Simulate Redirect',
		},
		{
			id: 'receive-tokens',
			title: 'Receive Tokens',
			description: 'Tokens are returned in the URL fragment',
			status: currentStep >= 3 ? 'completed' : 'pending',
		},
	];

	return (
		<Container>
			<BaseOAuthFlow
				title="Implicit Grant Flow"
				description={getOAuthFlowDescription('implicit')}
				flowType="implicit"
				securityWarning={{
					title: 'Security Warning',
					message:
						'The Implicit Grant flow is less secure than Authorization Code flow because tokens are exposed in the URL. Use only when necessary for client-side applications.',
				}}
				useCaseHighlight={{
					title: 'Best Use Cases',
					message: getOAuthFlowUseCases('implicit').join(', '),
				}}
			>
				<DemoSection>
					<CardHeader>
						<h2>Interactive Demo</h2>
					</CardHeader>
					<CardBody>
						{error && (
							<ErrorMessage>
								<FiAlertCircle style={{ marginRight: '0.5rem' }} />
								{error}
							</ErrorMessage>
						)}

						<StepByStepFlow
							steps={flowSteps}
							currentStep={currentStep}
							onStepComplete={(stepId) => {
								logOAuthFlowEvent(`Step completed: ${stepId}`, 'implicit');
							}}
						/>

						{authUrl && (
							<div style={{ marginTop: '2rem' }}>
								<h3>Generated Authorization URL:</h3>
								<ColorCodedURL url={authUrl} />
								<URLParamExplainer url={authUrl} />
							</div>
						)}

						{tokensReceived && (
							<div style={{ marginTop: '2rem' }}>
								<h3>Received Tokens:</h3>
								<TokenDisplayComponent tokens={tokensReceived} />
							</div>
						)}
					</CardBody>
				</DemoSection>

				<AuthorizationRequestModal
					isOpen={showRedirectModal}
					onClose={() => setShowRedirectModal(false)}
					authUrl={authUrl}
					redirectUrl={redirectUrl}
					redirectParams={redirectParams}
					flowType="implicit"
				/>
			</BaseOAuthFlow>
		</Container>
	);
};

// Main component with error boundary
const ImplicitGrantFlow: React.FC = () => {
	return (
		<OAuthFlowErrorBoundary flowType="implicit">
			<ImplicitGrantFlowContent />
		</OAuthFlowErrorBoundary>
	);
};

export default ImplicitGrantFlow;
