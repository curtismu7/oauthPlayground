import type React from 'react';
import { useEffect, useState } from 'react';
import {
	FiCheckCircle,
	FiClock,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiShield,
	FiXCircle,
} from '@icons';
import styled from 'styled-components';
import { Card, CardBody, CardHeader } from '../../components/Card';
import PageTitle from '../../components/PageTitle';
import { SpecCard } from '../../components/SpecCard';
import { TokenSurface } from '../../components/TokenSurface';
import { type PingOneConfig, pingOneConfigService } from '../../services/pingoneConfigService';
import { logger } from '../../utils/logger';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const FlowSection = styled(Card)`
  margin-bottom: 2rem;
`;

const StepContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const StepCard = styled(Card)<{ $isActive?: boolean; $isCompleted?: boolean; $isError?: boolean }>`
  border-left: 4px solid ${({ $isActive, $isCompleted, $isError }) =>
		$isError ? '#dc2626' : $isCompleted ? '#059669' : $isActive ? '#0070cc' : '#e5e7eb'};
  background-color: ${({ $isActive, $isCompleted, $isError }) =>
		$isError ? '#fef2f2' : $isCompleted ? '#f0fdf4' : $isActive ? '#eff6ff' : '#ffffff'};
  transition: all 0.2s ease;
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const StepNumber = styled.div<{ $isActive?: boolean; $isCompleted?: boolean; $isError?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  background-color: ${({ $isActive, $isCompleted, $isError }) =>
		$isError ? '#dc2626' : $isCompleted ? '#059669' : $isActive ? '#0070cc' : '#e5e7eb'};
  color: ${({ $isActive, $isCompleted, $isError }) =>
		$isError || $isCompleted || $isActive ? '#ffffff' : '#6b7280'};
`;

const StepTitle = styled.h3`
  margin: 0;
  color: #111827;
  font-size: 1.125rem;
  font-weight: 600;
`;

const StepContent = styled.div`
  color: #6b7280;
  line-height: 1.6;
`;

const InfoBox = styled.div`
  background-color: #eff6ff;
  border: 1px solid #3b82f6;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const WarningBox = styled.div`
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const ErrorBox = styled.div`
  background-color: #fef2f2;
  border: 1px solid #dc2626;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const CodeBlock = styled.pre`
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 1rem 0;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background-color: ${({ $variant }) =>
		$variant === 'danger' ? '#dc2626' : $variant === 'secondary' ? '#6b7280' : '#0070cc'};
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background-color: ${({ $variant }) =>
			$variant === 'danger' ? '#b91c1c' : $variant === 'secondary' ? '#4b5563' : '#0056b3'};
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #0070cc;
    box-shadow: 0 0 0 3px rgba(0, 112, 204, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #0070cc;
    box-shadow: 0 0 0 3px rgba(0, 112, 204, 0.1);
  }
`;

const ConfigDisplay = styled.div`
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
`;

interface PARRequest {
	response_type: string;
	client_id: string;
	redirect_uri: string;
	scope: string;
	state: string;
	nonce?: string;
	code_challenge?: string;
	code_challenge_method?: string;
	acr_values?: string;
	prompt?: string;
	max_age?: string;
	ui_locales?: string;
	claims?: string;
}

interface PARResponse {
	request_uri: string;
	expires_in: number;
}

const _PingOnePARFlow: React.FC = () => {
	const [currentStep, setCurrentStep] = useState(0);
	const [config, setConfig] = useState<PingOneConfig | null>(null);
	const [parRequest, setPARRequest] = useState<PARRequest>({
		response_type: 'code',
		client_id: '',
		redirect_uri: '',
		scope: 'openid profile email',
		state: '',
		nonce: '',
		code_challenge: '',
		code_challenge_method: 'S256',
	});
	const [parResponse, setPARResponse] = useState<PARResponse | null>(null);
	const [authorizationUrl, setAuthorizationUrl] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const steps = [
		{
			id: 'config',
			title: 'Load PingOne Configuration',
			description: 'Load and validate PingOne configuration from environment or localStorage',
		},
		{
			id: 'setup',
			title: 'Setup PAR Request Parameters',
			description: 'Configure the parameters for the Pushed Authorization Request',
		},
		{
			id: 'push',
			title: 'Push Authorization Request',
			description: 'Send the authorization request to PingOne PAR endpoint',
		},
		{
			id: 'authorize',
			title: 'Generate Authorization URL',
			description: 'Create authorization URL using the returned request_uri',
		},
		{
			id: 'complete',
			title: 'Complete PAR Flow',
			description: 'Test the complete PAR flow with PingOne',
		},
	];

	// Load configuration on mount
	useEffect(() => {
		const loadConfig = () => {
			try {
				const loadedConfig = pingOneConfigService.loadConfig();
				setConfig(loadedConfig);

				// Update form with config values
				setPARRequest((prev) => ({
					...prev,
					client_id: loadedConfig.clientId,
					redirect_uri: loadedConfig.redirectUri,
				}));

				if (!pingOneConfigService.isConfigValid()) {
					setError(
						'PingOne configuration is incomplete. Please check environment variables or configuration settings.'
					);
				}
				// Keep currentStep at 0 to show the configuration step first
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load configuration');
				logger.error('PingOnePARFlow', 'Failed to load configuration', err);
			}
		};

		loadConfig();
	}, []);

	const generateRandomString = (length: number): string => {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
		let result = '';
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	};

	const generatePKCE = () => {
		const codeVerifier = generateRandomString(64);
		const codeChallenge = btoa(codeVerifier)
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');

		setPARRequest((prev) => ({
			...prev,
			code_challenge: codeChallenge,
			state: generateRandomString(32),
			nonce: generateRandomString(32),
		}));
	};

	const pushAuthorizationRequest = async () => {
		if (!config) {
			setError('Configuration not loaded');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			logger.info('PingOnePARFlow', 'Pushing authorization request', {
				parEndpoint: config.parEndpoint,
				clientId: config.clientId,
			});

			// Use the backend proxy to avoid CORS issues
			const response = await fetch('/api/par', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
				},
				body: JSON.stringify({
					environment_id: config.environmentId,
					client_id: config.clientId,
					client_secret: config.clientSecret,
					...parRequest,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(`PAR request failed: ${response.status} - ${JSON.stringify(errorData)}`);
			}

			const parData: PARResponse = await response.json();
			setPARResponse(parData);
			setCurrentStep(3);

			logger.success('PingOnePARFlow', 'PAR request successful', {
				requestUri: parData.request_uri,
				expiresIn: parData.expires_in,
			});
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			setError(errorMessage);
			logger.error('PingOnePARFlow', 'PAR request failed', err);
		} finally {
			setIsLoading(false);
		}
	};

	const generateAuthorizationUrl = () => {
		if (!config || !parResponse) {
			setError('Configuration or PAR response not available');
			return;
		}

		const url = new URL(config.authorizationEndpoint);
		url.searchParams.set('request_uri', parResponse.request_uri);
		url.searchParams.set('response_type', parRequest.response_type);

		setAuthorizationUrl(url.toString());
		setCurrentStep(4);

		logger.info('PingOnePARFlow', 'Generated authorization URL', {
			url: url.toString(),
			requestUri: parResponse.request_uri,
		});
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	const openAuthorizationUrl = () => {
		if (authorizationUrl) {
			window.open(authorizationUrl, '_blank');
		}
	};

	return (
		<Container>
			<PageTitle
				title="PingOne PAR Flow"
				subtitle="Pushed Authorization Request (RFC 9126) with PingOne Integration"
				icon={<FiShield />}
			/>

			<InfoBox>
				<FiInfo style={{ color: '#3b82f6', fontSize: '1.25rem', marginTop: '0.125rem' }} />
				<div>
					<strong>PingOne PAR Integration</strong>
					<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
						This flow demonstrates Pushed Authorization Request (PAR) using your PingOne
						configuration. PAR enhances security by pushing authorization parameters to the server
						before redirecting the user.
					</p>
				</div>
			</InfoBox>

			<FlowSection>
				<CardHeader>
					<h2>PAR Flow Steps</h2>
				</CardHeader>
				<CardBody>
					<StepContainer>
						{steps.map((step, index) => (
							<StepCard
								key={step.id}
								$isActive={currentStep === index}
								$isCompleted={currentStep > index}
								$isError={error && currentStep === index}
							>
								<CardBody>
									<StepHeader>
										<StepNumber
											$isActive={currentStep === index}
											$isCompleted={currentStep > index}
											$isError={error && currentStep === index}
										>
											{error && currentStep === index ? (
												<FiXCircle />
											) : currentStep > index ? (
												<FiCheckCircle />
											) : (
												index + 1
											)}
										</StepNumber>
										<StepTitle>{step.title}</StepTitle>
									</StepHeader>
									<StepContent>{step.description}</StepContent>

									{step.id === 'config' && currentStep === 0 && (
										<div>
											{config ? (
												<div>
													<InfoBox>
														<FiCheckCircle
															style={{
																color: '#059669',
																fontSize: '1.25rem',
																marginTop: '0.125rem',
															}}
														/>
														<div>
															<strong>Configuration Loaded Successfully</strong>
															<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
																PingOne configuration loaded from{' '}
																{config.environmentId ? 'environment variables' : 'localStorage'}.
															</p>
														</div>
													</InfoBox>

													<ConfigDisplay>
														{JSON.stringify(
															{
																environmentId: config.environmentId,
																clientId: config.clientId,
																parEndpoint: config.parEndpoint,
																authorizationEndpoint: config.authorizationEndpoint,
															},
															null,
															2
														)}
													</ConfigDisplay>

													<Button onClick={() => setCurrentStep(1)}>
														Next: Setup PAR Parameters
													</Button>
												</div>
											) : error ? (
												<div>
													<ErrorBox>
														<FiXCircle
															style={{
																color: '#dc2626',
																fontSize: '1.25rem',
																marginTop: '0.125rem',
															}}
														/>
														<div>
															<strong>Configuration Error</strong>
															<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
																{error}
															</p>
														</div>
													</ErrorBox>
													<Button onClick={() => window.location.reload()} $variant="secondary">
														Reload Page
													</Button>
												</div>
											) : (
												<div>
													<WarningBox>
														<FiClock
															style={{
																color: '#f59e0b',
																fontSize: '1.25rem',
																marginTop: '0.125rem',
															}}
														/>
														<div>
															<strong>Loading Configuration...</strong>
															<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
																Loading PingOne configuration from environment variables or
																localStorage.
															</p>
														</div>
													</WarningBox>
												</div>
											)}
										</div>
									)}

									{step.id === 'setup' && currentStep === 1 && (
										<div>
											<InputGroup>
												<Label>Response Type</Label>
												<Select
													value={parRequest.response_type}
													onChange={(e) =>
														setPARRequest((prev) => ({ ...prev, response_type: e.target.value }))
													}
												>
													<option value="code">code</option>
													<option value="code id_token">code id_token</option>
													<option value="code token">code token</option>
													<option value="code id_token token">code id_token token</option>
												</Select>
											</InputGroup>

											<InputGroup>
												<Label>Scope</Label>
												<Input
													value={parRequest.scope}
													onChange={(e) =>
														setPARRequest((prev) => ({ ...prev, scope: e.target.value }))
													}
													placeholder="openid profile email"
												/>
											</InputGroup>

											<InputGroup>
												<Label>ACR Values (Optional)</Label>
												<Input
													value={parRequest.acr_values || ''}
													onChange={(e) =>
														setPARRequest((prev) => ({ ...prev, acr_values: e.target.value }))
													}
													placeholder="1"
												/>
											</InputGroup>

											<InputGroup>
												<Label>Prompt (Optional)</Label>
												<Select
													value={parRequest.prompt || ''}
													onChange={(e) =>
														setPARRequest((prev) => ({ ...prev, prompt: e.target.value }))
													}
												>
													<option value="">None</option>
													<option value="login">login</option>
													<option value="consent">consent</option>
													<option value="select_account">select_account</option>
												</Select>
											</InputGroup>

											<Button onClick={generatePKCE}>
												<FiKey />
												Generate PKCE & Security Parameters
											</Button>

											{parRequest.code_challenge && (
												<ConfigDisplay>
													<strong>Generated Parameters:</strong>
													<br />
													State: {parRequest.state}
													<br />
													Nonce: {parRequest.nonce}
													<br />
													Code Challenge: {parRequest.code_challenge}
												</ConfigDisplay>
											)}

											<Button
												onClick={() => setCurrentStep(2)}
												disabled={!parRequest.code_challenge}
											>
												Next: Push Authorization Request
											</Button>
										</div>
									)}

									{step.id === 'push' && currentStep === 2 && (
										<div>
											<InfoBox>
												<FiInfo
													style={{ color: '#3b82f6', fontSize: '1.25rem', marginTop: '0.125rem' }}
												/>
												<div>
													<strong>PAR Request Details</strong>
													<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
														This will push the authorization request to PingOne PAR endpoint.
													</p>
												</div>
											</InfoBox>

											<CodeBlock>
												{`POST ${config?.parEndpoint || '/api/par'}
Content-Type: application/json
Authorization: Basic ${config ? btoa(`${config.clientId}:${config.clientSecret}`) : '...'}

{
  "environment_id": "${config?.environmentId || ''}",
  "client_id": "${parRequest.client_id}",
  "client_secret": "${config?.clientSecret || ''}",
  "response_type": "${parRequest.response_type}",
  "redirect_uri": "${parRequest.redirect_uri}",
  "scope": "${parRequest.scope}",
  "state": "${parRequest.state}",
  "nonce": "${parRequest.nonce}",
  "code_challenge": "${parRequest.code_challenge}",
  "code_challenge_method": "${parRequest.code_challenge_method}"
${parRequest.acr_values ? `,  "acr_values": "${parRequest.acr_values}"` : ''}
${parRequest.prompt ? `,  "prompt": "${parRequest.prompt}"` : ''}
}`}
											</CodeBlock>

											<Button onClick={pushAuthorizationRequest} disabled={isLoading}>
												{isLoading ? (
													<>
														<FiRefreshCw style={{ animation: 'spin 1s linear infinite' }} />
														Pushing Request...
													</>
												) : (
													<>
														<FiShield />
														Push Authorization Request
													</>
												)}
											</Button>
										</div>
									)}

									{step.id === 'authorize' && currentStep === 3 && (
										<div>
											{error ? (
												<div>
													<ErrorBox>
														<FiXCircle
															style={{
																color: '#dc2626',
																fontSize: '1.25rem',
																marginTop: '0.125rem',
															}}
														/>
														<div>
															<strong>PAR Request Error</strong>
															<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
																{error}
															</p>
														</div>
													</ErrorBox>
													<Button onClick={() => setCurrentStep(2)} $variant="secondary">
														Try Again
													</Button>
												</div>
											) : parResponse ? (
												<div>
													<InfoBox>
														<FiCheckCircle
															style={{
																color: '#059669',
																fontSize: '1.25rem',
																marginTop: '0.125rem',
															}}
														/>
														<div>
															<strong>PAR Request Successful</strong>
															<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
																Received request_uri from PingOne. Now generating authorization URL.
															</p>
														</div>
													</InfoBox>

													<TokenSurface
														token={JSON.stringify(parResponse, null, 2)}
														title="PAR Response"
														copyable={true}
													/>

													<div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
														<Button onClick={generateAuthorizationUrl}>
															<FiExternalLink />
															Generate Authorization URL
														</Button>
													</div>
											) : null}
										</div>
									)}

									{step.id === 'complete' && currentStep === 4 && (
										<div>
											{authorizationUrl ? (
												<div>
													<InfoBox>
														<FiCheckCircle
															style={{
																color: '#059669',
																fontSize: '1.25rem',
																marginTop: '0.125rem',
															}}
														/>
														<div>
															<strong>Authorization URL Generated</strong>
															<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
																The authorization URL is ready. Click to test the complete PAR flow
																with PingOne.
															</p>
														</div>
													</InfoBox>

													<CodeBlock>{authorizationUrl}</CodeBlock>

													<div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
														<Button onClick={() => copyToClipboard(authorizationUrl)}>
															<FiCopy />
															Copy URL
														</Button>
														<Button onClick={openAuthorizationUrl}>
															<FiExternalLink />
															Open Authorization URL
														</Button>
														<Button onClick={() => setCurrentStep(0)} $variant="secondary">
															<FiRefreshCw />
															Start Over
														</Button>
													</div>
												</div>
											) : null}
										</div>
									)}
								</CardBody>
							</StepCard>
						))}
					</StepContainer>
				</CardBody>
			</FlowSection>

			<SpecCard
				title="RFC 9126 - OAuth 2.0 Pushed Authorization Requests"
				description="PAR enhances security by pushing authorization request parameters to the authorization server before redirecting the user, preventing parameter tampering and improving error handling."
				specUrl="https://datatracker.ietf.org/doc/html/rfc9126"
				features={[
					'Enhanced security through parameter protection',
					'Prevents parameter tampering attacks',
					'Centralized request validation',
					'Better error handling before redirect',
					'Improved user experience',
					'PingOne native support',
				]}
			/>
		</Container>
	);
};

export default PingOnePARFlow;
