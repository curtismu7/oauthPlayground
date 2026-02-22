// src/pages/flows/ClientCredentialsFlowV7_Simple.tsx
// V7.0.0 OAuth 2.0 Client Credentials Flow - Simple V7 Implementation with Step Numbers

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { useClientCredentialsFlowController } from '../../hooks/useClientCredentialsFlowController';
import { usePageScroll } from '../../hooks/usePageScroll';
import { ClientAuthMethod } from '../../services/clientCredentialsSharedService';
import { FlowUIService } from '../../services/flowUIService';

// Get UI components from FlowUIService
const Container = FlowUIService.getContainer();
const ContentWrapper = FlowUIService.getContentWrapper();

const MainCard = styled.div`
	background: white;
	border-radius: 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
`;

const StepHeader = styled.div`
	background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
	color: #ffffff;
	padding: 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const StepHeaderLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const VersionBadge = styled.div`
	background: rgba(255, 255, 255, 0.2);
	color: #ffffff;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
`;

const StepHeaderTitle = styled.h2`
	font-size: 2rem;
	font-weight: 700;
	margin: 0;
`;

const StepHeaderSubtitle = styled.p`
	font-size: 1rem;
	color: rgba(255, 255, 255, 0.85);
	margin: 0;
`;

const StepHeaderRight = styled.div`
	text-align: right;
`;

const StepNumber = styled.div`
	font-size: 2.5rem;
	font-weight: 700;
	line-height: 1;
`;

const StepTotal = styled.div`
	font-size: 0.875rem;
	color: rgba(255, 255, 255, 0.75);
	letter-spacing: 0.05em;
`;

const StepContent = styled.div`
	padding: 2rem;
`;

// Step metadata
const STEP_METADATA = [
	{
		title: 'Credentials & Configuration',
		subtitle: 'Set up your client credentials and authentication method',
	},
	{
		title: 'Authentication Method',
		subtitle: 'Choose how to authenticate with the authorization server',
	},
	{
		title: 'Token Request',
		subtitle: 'Generate and send the token request',
	},
	{
		title: 'Token Response',
		subtitle: 'Receive and validate the access token',
	},
	{
		title: 'API Call',
		subtitle: 'Use the access token to call protected APIs',
	},
	{
		title: 'Token Introspection',
		subtitle: 'Validate the access token',
	},
	{
		title: 'Flow Complete',
		subtitle: 'Review the completed flow',
	},
];

const ClientCredentialsFlowV7Simple: React.FC = () => {
	const [currentStep, setCurrentStep] = useState(0);

	// Initialize page scroll management
	usePageScroll({ pageName: 'Client Credentials V7', force: true });

	// Initialize client credentials flow controller with V7 settings
	const controller = useClientCredentialsFlowController({
		flowKey: 'client-credentials-v7',
	});

	// Set default auth method
	const [selectedAuthMethod, setSelectedAuthMethod] =
		useState<ClientAuthMethod>('client_secret_post');

	// Update local storage when auth method changes
	useEffect(() => {
		localStorage.setItem('client_credentials_v7_auth_method', selectedAuthMethod);
	}, [selectedAuthMethod]);

	const handleNext = () => {
		if (currentStep < STEP_METADATA.length - 1) {
			setCurrentStep((prev) => prev + 1);
		}
	};

	const handlePrevious = () => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	};

	const handleReset = () => {
		setCurrentStep(0);
		controller.resetFlow();
	};

	// Step validation
	const isStepValid = (step: number): boolean => {
		switch (step) {
			case 0:
				return !!(controller.credentials.environmentId && controller.credentials.clientId);
			case 1:
				return true; // Auth method selection is always valid
			case 2:
				return !!(controller.credentials.environmentId && controller.credentials.clientId);
			case 3:
				return !!controller.tokens?.access_token;
			case 4:
				return !!controller.tokens?.access_token;
			case 5:
				return !!controller.tokens?.access_token;
			case 6:
				return true; // Completion step is always valid
			default:
				return false;
		}
	};

	const canNavigateNext = isStepValid(currentStep) && currentStep < STEP_METADATA.length - 1;

	// Render step content
	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return (
					<div>
						<h3>Credentials & Configuration</h3>
						<p>Set up your client credentials and authentication method.</p>
						<div
							style={{
								padding: '1rem',
								background: '#f9fafb',
								borderRadius: '0.5rem',
								margin: '1rem 0',
							}}
						>
							<p>
								<strong>Environment ID:</strong> {controller.credentials.environmentId || 'Not set'}
							</p>
							<p>
								<strong>Client ID:</strong> {controller.credentials.clientId || 'Not set'}
							</p>
							<p>
								<strong>Client Secret:</strong>{' '}
								{controller.credentials.clientSecret ? '***' : 'Not set'}
							</p>
						</div>
					</div>
				);
			case 1:
				return (
					<div>
						<h3>Authentication Method</h3>
						<p>Choose how to authenticate with the authorization server.</p>
						<div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
							<button
								type="button"
								onClick={() => setSelectedAuthMethod('client_secret_post')}
								style={{
									padding: '0.5rem 1rem',
									background: selectedAuthMethod === 'client_secret_post' ? '#3b82f6' : '#f3f4f6',
									color: selectedAuthMethod === 'client_secret_post' ? 'white' : '#374151',
									border: 'none',
									borderRadius: '0.25rem',
									cursor: 'pointer',
								}}
							>
								Client Secret POST
							</button>
							<button
								type="button"
								onClick={() => setSelectedAuthMethod('client_secret_basic')}
								style={{
									padding: '0.5rem 1rem',
									background: selectedAuthMethod === 'client_secret_basic' ? '#3b82f6' : '#f3f4f6',
									color: selectedAuthMethod === 'client_secret_basic' ? 'white' : '#374151',
									border: 'none',
									borderRadius: '0.25rem',
									cursor: 'pointer',
								}}
							>
								Client Secret Basic
							</button>
						</div>
					</div>
				);
			case 2:
				return (
					<div>
						<h3>Token Request</h3>
						<p>Generate and send the token request.</p>
						<button
							type="button"
							onClick={controller.requestToken}
							disabled={controller.isLoading}
							style={{
								padding: '0.75rem 1.5rem',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '0.5rem',
								cursor: 'pointer',
								marginTop: '1rem',
							}}
						>
							{controller.isLoading ? 'Requesting...' : 'Request Access Token'}
						</button>
					</div>
				);
			case 3:
				return (
					<div>
						<h3>Token Response</h3>
						<p>Receive and validate the access token.</p>
						{controller.tokens ? (
							<div
								style={{
									padding: '1rem',
									background: '#dcfce7',
									borderRadius: '0.5rem',
									margin: '1rem 0',
								}}
							>
								<p>
									<strong>Access Token:</strong> {controller.tokens.access_token}
								</p>
								<p>
									<strong>Token Type:</strong> {controller.tokens.token_type}
								</p>
								<p>
									<strong>Expires In:</strong> {controller.tokens.expires_in} seconds
								</p>
							</div>
						) : (
							<div
								style={{
									padding: '1rem',
									background: '#fef3c7',
									borderRadius: '0.5rem',
									margin: '1rem 0',
								}}
							>
								<p>No token received. Complete the token request in step 2.</p>
							</div>
						)}
					</div>
				);
			case 4:
				return (
					<div>
						<h3>API Call</h3>
						<p>Use the access token to call protected APIs.</p>
						{controller.tokens?.access_token && (
							<div
								style={{
									padding: '1rem',
									background: '#f9fafb',
									borderRadius: '0.5rem',
									margin: '1rem 0',
								}}
							>
								<pre
									style={{
										background: '#1f2937',
										color: '#f9fafb',
										padding: '1rem',
										borderRadius: '0.25rem',
									}}
								>
									{`curl -H "Authorization: Bearer ${controller.tokens.access_token}" \\
  https://api.example.com/protected-resource`}
								</pre>
							</div>
						)}
					</div>
				);
			case 5:
				return (
					<div>
						<h3>Token Introspection</h3>
						<p>Validate the access token.</p>
						<button
							type="button"
							onClick={controller.introspectToken}
							disabled={controller.isLoading}
							style={{
								padding: '0.75rem 1.5rem',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '0.5rem',
								cursor: 'pointer',
								marginTop: '1rem',
							}}
						>
							{controller.isLoading ? 'Introspecting...' : 'Introspect Token'}
						</button>
						{controller.introspectionResult && (
							<div
								style={{
									padding: '1rem',
									background: '#f9fafb',
									borderRadius: '0.5rem',
									margin: '1rem 0',
								}}
							>
								<pre
									style={{
										background: '#1f2937',
										color: '#f9fafb',
										padding: '1rem',
										borderRadius: '0.25rem',
									}}
								>
									{JSON.stringify(controller.introspectionResult, null, 2)}
								</pre>
							</div>
						)}
					</div>
				);
			case 6:
				return (
					<div>
						<h3>Flow Complete</h3>
						<p>Review the completed flow.</p>
						<div
							style={{
								padding: '1rem',
								background: '#dcfce7',
								borderRadius: '0.5rem',
								margin: '1rem 0',
							}}
						>
							<p>✅ Client credentials configured</p>
							<p>✅ Authentication method selected</p>
							<p>✅ Access token obtained</p>
							<p>✅ Token validated</p>
							<p>✅ Ready for API calls</p>
						</div>
					</div>
				);
			default:
				return <div>Step not implemented</div>;
		}
	};

	return (
		<Container>
			<ContentWrapper>
				<MainCard>
					<StepHeader>
						<StepHeaderLeft>
							<VersionBadge>Client Credentials Flow · V7</VersionBadge>
							<StepHeaderTitle>
								{STEP_METADATA[currentStep]?.title || 'Client Credentials Flow'}
							</StepHeaderTitle>
							<StepHeaderSubtitle>
								{STEP_METADATA[currentStep]?.subtitle || 'Machine-to-machine authentication'}
							</StepHeaderSubtitle>
						</StepHeaderLeft>
						<StepHeaderRight>
							<StepNumber>{String(currentStep + 1).padStart(2, '0')}</StepNumber>
							<StepTotal>of 07</StepTotal>
						</StepHeaderRight>
					</StepHeader>

					<StepContent>{renderStepContent()}</StepContent>

					<StepNavigationButtons
						onNext={handleNext}
						onPrevious={handlePrevious}
						onReset={handleReset}
						canNavigateNext={canNavigateNext}
						isFirstStep={currentStep === 0}
						nextButtonText={currentStep === STEP_METADATA.length - 1 ? 'Complete' : 'Next'}
						disabledMessage={controller.error || ''}
					/>
				</MainCard>
			</ContentWrapper>
		</Container>
	);
};

export default ClientCredentialsFlowV7Simple;
