// src/pages/ClientGenerator.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
	FiCheckCircle,
	FiX,
	FiLoader,
	FiSettings,
	FiSmartphone,
	FiGlobe,
	FiCode,
	FiServer,
	FiKey,
} from 'react-icons/fi';
import styled from 'styled-components';
import { FlowHeader } from '../services/flowHeaderService';
import {
	pingOneAppCreationService,
	AppType,
	AppConfig,
	CreatedApp,
	AppCreationResult,
} from '../services/pingOneAppCreationService';
import { usePageScroll } from '../hooks/usePageScroll';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { CredentialsInput } from '../components/CredentialsInput';
import ColoredUrlDisplay from '../components/ColoredUrlDisplay';

const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const Header = styled.div`
	text-align: center;
	margin-bottom: 3rem;
`;

const Title = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
	font-size: 1.2rem;
	color: #6b7280;
	margin: 0;
`;

const CardGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 2rem;
	margin-bottom: 3rem;
`;

const AppTypeCard = styled.div<{ selected: boolean }>`
	background: white;
	border: 2px solid ${(props) => (props.selected ? '#3b82f6' : '#e5e7eb')};
	border-radius: 12px;
	padding: 2rem;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: ${(props) => (props.selected ? '0 4px 6px -1px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)')};

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
	}

	.icon {
		font-size: 3rem;
		color: ${(props) => (props.selected ? '#3b82f6' : '#6b7280')};
		margin-bottom: 1rem;
		display: block;
		text-align: center;
	}

	.title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
		text-align: center;
	}

	.description {
		color: #6b7280;
		font-size: 0.9rem;
		text-align: center;
		line-height: 1.4;
	}
`;

const FormContainer = styled.div`
	background: white;
	border-radius: 12px;
	padding: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	margin-bottom: 2rem;
`;

const FormTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 2rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const FormGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1.5rem;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Label = styled.label`
	font-weight: 500;
	color: #374151;
	font-size: 0.875rem;
`;

const Input = styled.input`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const TextArea = styled.textarea`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	min-height: 80px;
	resize: vertical;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Select = styled.select`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 0.875rem;
	background: white;

	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const CheckboxGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const CheckboxLabel = styled.label`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: #374151;
	cursor: pointer;
`;

const Checkbox = styled.input`
	width: 16px;
	height: 16px;
`;

const ButtonGroup = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 1rem;
	margin-top: 2rem;
`;

const Button = styled.button<{ variant: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-weight: 500;
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;

	${(props) =>
		props.variant === 'primary'
			? `
		background: #3b82f6;
		color: white;
		border: none;

		&:hover:not(:disabled) {
			background: #2563eb;
		}
	`
			: `
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;

		&:hover:not(:disabled) {
			background: #f9fafb;
		}
	`}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ActionButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.25rem;
	font-size: 0.875rem;
	font-weight: 500;
	border-radius: 0.375rem;
	cursor: pointer;
	transition: all 0.2s;
	border: 1px solid transparent;
	background-color: #3b82f6;
	color: white;

	&:hover:not(:disabled) {
		background-color: #2563eb;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	svg {
		width: 16px;
		height: 16px;
	}
`;

const ResultCard = styled.div<{ type: 'success' | 'error' }>`
	background: ${(props) => (props.type === 'success' ? '#f0fdf4' : '#fef2f2')};
	border: 1px solid ${(props) => (props.type === 'success' ? '#bbf7d0' : '#fecaca')};
	border-radius: 8px;
	padding: 1.5rem;
	margin-top: 2rem;
`;

const ResultTitle = styled.h3`
	color: ${(props) => (props.type === 'success' ? '#166534' : '#dc2626')};
	margin: 0 0 1rem 0;
	font-size: 1.125rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ResultContent = styled.div`
	color: ${(props) => (props.type === 'success' ? '#166534' : '#dc2626')};
	font-size: 0.875rem;
	line-height: 1.5;
`;

const ResultDetails = styled.div`
	background: white;
	border-radius: 4px;
	padding: 1rem;
	margin-top: 1rem;
	border: 1px solid #e5e7eb;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.75rem;
	white-space: pre-wrap;
`;

const LoadingSpinner = styled.div`
	display: inline-block;
	width: 20px;
	height: 20px;
	border: 2px solid #e5e7eb;
	border-radius: 50%;
	border-top-color: #3b82f6;
	animation: spin 1s ease-in-out infinite;

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
`;

const SuccessMessage = styled.div`
	background: #d1fae5;
	border: 1px solid #6ee7b7;
	border-radius: 8px;
	padding: 1rem 1.5rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	color: #065f46;
	font-weight: 500;
	margin-bottom: 2rem;
	flex-wrap: wrap;
	
	svg {
		color: #10b981;
		font-size: 1.25rem;
	}
`;

const ClientGenerator: React.FC = () => {
	usePageScroll({ pageName: 'Client Generator', force: true });

	// Worker token state
	const [workerToken, setWorkerToken] = useState<string | null>(null);
	const [workerCredentials, setWorkerCredentials] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		scopes: 'openid p1:create:application p1:read:application p1:update:application',
		tokenEndpointAuthMethod: 'client_secret_post' as 'client_secret_basic' | 'client_secret_post',
	});
	const [isGettingToken, setIsGettingToken] = useState(false);
	const [tokenError, setTokenError] = useState<string | null>(null);

	const [selectedAppType, setSelectedAppType] = useState<AppType | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [creationResult, setCreationResult] = useState<AppCreationResult | null>(null);
	const [lastApiUrl, setLastApiUrl] = useState<string>('');
	const [lastRequestBody, setLastRequestBody] = useState<string>('');
	const [workerTokenRequest, setWorkerTokenRequest] = useState<{
		url: string;
		method: string;
		headers: Record<string, string>;
		body: string;
		authMethod: string;
	} | null>(null);
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		enabled: true,
		redirectUris: ['http://localhost:3000/callback'],
		postLogoutRedirectUris: ['http://localhost:3000'],
		grantTypes: ['authorization_code'] as string[],
		responseTypes: ['code'] as string[],
		tokenEndpointAuthMethod: 'client_secret_basic' as string,
		pkceEnforcement: 'OPTIONAL' as string,
		scopes: ['openid', 'profile', 'email'],
		accessTokenValiditySeconds: 3600,
		refreshTokenValiditySeconds: 2592000,
		idTokenValiditySeconds: 3600,
	});

	// Load saved worker credentials and silently get token on mount
	useEffect(() => {
		const loadAndGetToken = async () => {
			try {
				// Try to load saved worker credentials
				const saved = localStorage.getItem('app-generator-worker-credentials');
				if (saved) {
					const credentials = JSON.parse(saved);
					setWorkerCredentials(credentials);
					
					// Silently get token if we have credentials
					if (credentials.clientId && credentials.clientSecret && credentials.environmentId) {
						console.log('[App Generator] Silently requesting worker token...');
						await getWorkerTokenSilently(credentials);
					}
				}
			} catch (error) {
				console.error('[App Generator] Failed to load credentials:', error);
			}
		};

		loadAndGetToken();
	}, []);

	// Silently get worker token
	const getWorkerTokenSilently = async (credentials: typeof workerCredentials) => {
		try {
			setIsGettingToken(true);
			setTokenError(null);

			// Validate environment ID format (should be UUID format, not a long client ID)
			const envId = credentials.environmentId?.trim();
			if (!envId) {
				throw new Error('Environment ID is required');
			}
			
			// Basic validation: environment IDs are typically UUID format (36 chars with dashes)
			// Client IDs are much longer base64-like strings
			if (envId.length > 50 || !envId.match(/^[a-zA-Z0-9-]+$/)) {
				console.warn('[App Generator] Environment ID looks suspicious:', envId);
				throw new Error('Invalid Environment ID format. Please check your credentials.');
			}

			const tokenEndpoint = `https://auth.pingone.com/${envId}/as/token`;
			console.log('[App Generator] Requesting token from:', tokenEndpoint);
			console.log('[App Generator] Using auth method:', credentials.tokenEndpointAuthMethod);
			
			// Prepare headers and body based on auth method
			const headers: Record<string, string> = {
				'Content-Type': 'application/x-www-form-urlencoded',
			};
			
			const bodyParams: Record<string, string> = {
				grant_type: 'client_credentials',
				scope: credentials.scopes,
			};
			
			if (credentials.tokenEndpointAuthMethod === 'client_secret_basic') {
				// Client Secret Basic: credentials in Authorization header
				const basicAuth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
				headers['Authorization'] = `Basic ${basicAuth}`;
			} else {
				// Client Secret Post: credentials in request body
				bodyParams.client_id = credentials.clientId;
				bodyParams.client_secret = credentials.clientSecret;
			}
			
			// Capture request details for display
			setWorkerTokenRequest({
				url: tokenEndpoint,
				method: 'POST',
				headers,
				body: new URLSearchParams(bodyParams).toString(),
				authMethod: credentials.tokenEndpointAuthMethod,
			});
			
			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers,
				body: new URLSearchParams(bodyParams),
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('[App Generator] Token request failed:', response.status, errorText);
				throw new Error(`Token request failed: ${response.status} - ${errorText.substring(0, 100)}`);
			}

			const tokenData = await response.json();
			setWorkerToken(tokenData.access_token);
			console.log('[App Generator] Worker token obtained successfully');
		} catch (error) {
			console.error('[App Generator] Failed to get worker token:', error);
			setTokenError(error instanceof Error ? error.message : 'Failed to get token');
		} finally {
			setIsGettingToken(false);
		}
	};

	// Handle worker credential changes
	const handleWorkerCredentialChange = useCallback((field: string, value: string) => {
		setWorkerCredentials(prev => ({ ...prev, [field]: value }));
	}, []);

	// Save credentials and get token
	const handleSaveAndGetToken = useCallback(async () => {
		try {
			// Save credentials to localStorage
			localStorage.setItem('app-generator-worker-credentials', JSON.stringify(workerCredentials));
			v4ToastManager.showSuccess('Worker credentials saved');
			
			// Get token
			await getWorkerTokenSilently(workerCredentials);
			v4ToastManager.showSuccess('Worker token obtained!');
		} catch (error) {
			console.error('[App Generator] Failed to save and get token:', error);
			v4ToastManager.showError('Failed to obtain worker token');
		}
	}, [workerCredentials]);

	const appTypes = [
		{
			type: 'OIDC_WEB_APP' as AppType,
			icon: <FiGlobe />,
			title: 'OIDC Web App',
			description:
				'Traditional web applications using authorization code flow with server-side processing.',
		},
		{
			type: 'OIDC_NATIVE_APP' as AppType,
			icon: <FiSmartphone />,
			title: 'OIDC Native App',
			description: 'Mobile and desktop applications using OAuth 2.0 and OpenID Connect.',
		},
		{
			type: 'SINGLE_PAGE_APP' as AppType,
			icon: <FiCode />,
			title: 'Single Page App',
			description: 'JavaScript-based applications running entirely in the browser.',
		},
		{
			type: 'WORKER' as AppType,
			icon: <FiServer />,
			title: 'Worker App',
			description: 'Server-to-server applications using client credentials flow.',
		},
		{
			type: 'SERVICE' as AppType,
			icon: <FiSettings />,
			title: 'Service App',
			description: 'Machine-to-machine applications with automated authentication.',
		},
	];

	const handleAppTypeSelect = (type: AppType) => {
		setSelectedAppType(type);
		setCreationResult(null);

		// Set default values based on app type
		switch (type) {
			case 'OIDC_WEB_APP':
				setFormData({
					...formData,
					grantTypes: ['authorization_code', 'refresh_token'],
					responseTypes: ['code'],
					tokenEndpointAuthMethod: 'client_secret_basic',
					pkceEnforcement: 'OPTIONAL',
				});
				break;
			case 'OIDC_NATIVE_APP':
				setFormData({
					...formData,
					grantTypes: ['authorization_code', 'refresh_token'],
					responseTypes: ['code'],
					tokenEndpointAuthMethod: 'none',
					pkceEnforcement: 'REQUIRED',
					redirectUris: ['com.example.app://callback'],
				});
				break;
			case 'SINGLE_PAGE_APP':
				setFormData({
					...formData,
					grantTypes: ['authorization_code', 'refresh_token'],
					responseTypes: ['code'],
					tokenEndpointAuthMethod: 'none',
					pkceEnforcement: 'REQUIRED',
				});
				break;
			case 'WORKER':
				setFormData({
					...formData,
					grantTypes: ['client_credentials'],
					responseTypes: [],
					tokenEndpointAuthMethod: 'client_secret_post',
					redirectUris: [],
					postLogoutRedirectUris: [],
				});
				break;
			case 'SERVICE':
				setFormData({
					...formData,
					grantTypes: ['client_credentials'],
					responseTypes: [],
					tokenEndpointAuthMethod: 'client_secret_jwt',
					redirectUris: [],
					postLogoutRedirectUris: [],
				});
				break;
		}
	};

	const handleInputChange = (field: string, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleArrayChange = (field: string, values: string[]) => {
		setFormData((prev) => ({ ...prev, [field]: values }));
	};

	const handleCreateApp = async () => {
		if (!selectedAppType) return;

		setIsCreating(true);
		setCreationResult(null);

		try {
			// Use the Worker token we obtained earlier
			if (!workerToken) {
				throw new Error(
					'No worker token available. Please obtain a worker token first by clicking "Save & Get Worker Token".'
				);
			}

			if (!workerCredentials.environmentId) {
				throw new Error('Environment ID is required.');
			}

			console.log('[App Generator] Creating app with worker token in environment:', workerCredentials.environmentId);

			// Initialize the service with the worker token
			pingOneAppCreationService.initialize(workerToken, workerCredentials.environmentId);

			// Capture API URL and request body for display
			const apiUrl = `https://api.pingone.com/v1/environments/${workerCredentials.environmentId}/applications`;
			setLastApiUrl(apiUrl);

			// Create the app based on type
			let result: AppCreationResult;

			const baseConfig = {
				name: formData.name,
				description: formData.description,
				enabled: formData.enabled,
			};

			switch (selectedAppType) {
				case 'OIDC_WEB_APP': {
					const payload = {
						...baseConfig,
						type: 'OIDC_WEB_APP',
						redirectUris: formData.redirectUris,
						postLogoutRedirectUris: formData.postLogoutRedirectUris,
						grantTypes: formData.grantTypes as any,
						responseTypes: formData.responseTypes as any,
						tokenEndpointAuthMethod: formData.tokenEndpointAuthMethod as any,
						pkceEnforcement: formData.pkceEnforcement as any,
						scopes: formData.scopes,
						accessTokenValiditySeconds: 7200,
						refreshTokenValiditySeconds: 2592000,
						idTokenValiditySeconds: 7200,
					};
					setLastRequestBody(JSON.stringify(payload, null, 2));
					result = await pingOneAppCreationService.createOIDCWebApp(payload);
					break;
				}
				case 'OIDC_NATIVE_APP': {
					const nativePayload = {
						...baseConfig,
						type: 'OIDC_NATIVE_APP',
						redirectUris: formData.redirectUris,
						grantTypes: formData.grantTypes as any,
						responseTypes: formData.responseTypes as any,
						tokenEndpointAuthMethod: formData.tokenEndpointAuthMethod as any,
						pkceEnforcement: formData.pkceEnforcement as any,
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
						idTokenValiditySeconds: formData.idTokenValiditySeconds,
					};
					setLastRequestBody(JSON.stringify(nativePayload, null, 2));
					result = await pingOneAppCreationService.createOIDCNativeApp(nativePayload);
					break;
				}
				case 'SINGLE_PAGE_APP': {
					const spaPayload = {
						...baseConfig,
						type: 'SINGLE_PAGE_APP',
						redirectUris: formData.redirectUris,
						grantTypes: formData.grantTypes as any,
						responseTypes: formData.responseTypes as any,
						tokenEndpointAuthMethod: 'none',
						pkceEnforcement: formData.pkceEnforcement as any,
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
						idTokenValiditySeconds: formData.idTokenValiditySeconds,
					};
					setLastRequestBody(JSON.stringify(spaPayload, null, 2));
					result = await pingOneAppCreationService.createSinglePageApp(spaPayload);
					break;
				}
				case 'WORKER': {
					const workerPayload = {
						...baseConfig,
						type: 'WORKER',
						grantTypes: formData.grantTypes as any,
						tokenEndpointAuthMethod: formData.tokenEndpointAuthMethod as any,
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
					};
					setLastRequestBody(JSON.stringify(workerPayload, null, 2));
					result = await pingOneAppCreationService.createWorkerApp(workerPayload);
					break;
				}
				case 'SERVICE': {
					const servicePayload = {
						...baseConfig,
						type: 'SERVICE',
						grantTypes: formData.grantTypes as any,
						tokenEndpointAuthMethod: formData.tokenEndpointAuthMethod as any,
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
					};
					setLastRequestBody(JSON.stringify(servicePayload, null, 2));
					result = await pingOneAppCreationService.createServiceApp(servicePayload);
					break;
				}
				default:
					throw new Error('Unsupported application type');
			}

			setCreationResult(result);

			if (result.success) {
				v4ToastManager.showSuccess(`Application "${formData.name}" created successfully!`);
				// Reset form
				setFormData({
					name: '',
					description: '',
					enabled: true,
					redirectUris: ['http://localhost:3000/callback'],
					postLogoutRedirectUris: ['http://localhost:3000'],
					grantTypes: ['authorization_code'],
					responseTypes: ['code'],
					tokenEndpointAuthMethod: 'client_secret_basic',
					pkceEnforcement: 'OPTIONAL',
					scopes: ['openid', 'profile', 'email'],
					accessTokenValiditySeconds: 3600,
					refreshTokenValiditySeconds: 2592000,
					idTokenValiditySeconds: 3600,
				});
			} else {
				v4ToastManager.showError(`Failed to create application: ${result.error}`);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			setCreationResult({ success: false, error: errorMessage });
			v4ToastManager.showError(errorMessage);
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<Container>
			<FlowHeader flowId="client-generator" />

			<Header>
				<Title>PingOne Client Generator</Title>
				<Subtitle>
					Create OAuth 2.0 and OpenID Connect applications in your PingOne environment
				</Subtitle>
			</Header>

			{/* Worker Credentials Section */}
			{!workerToken && (
				<FormContainer>
					<FormTitle>
						<FiKey style={{ marginRight: '0.5rem' }} />
						Worker Application Credentials
					</FormTitle>
					<p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
						Enter your Worker application credentials to manage PingOne applications.
					</p>
					<p style={{ color: '#f59e0b', fontSize: '0.875rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiSettings /> 
						<strong>Note:</strong> Environment ID should be a UUID format (e.g., "12345678-1234-1234-1234-123456789abc"), not a Client ID.
					</p>

					<CredentialsInput
						environmentId={workerCredentials.environmentId}
						clientId={workerCredentials.clientId}
						clientSecret={workerCredentials.clientSecret}
						scopes={workerCredentials.scopes}
						onEnvironmentIdChange={(value) => handleWorkerCredentialChange('environmentId', value)}
						onClientIdChange={(value) => handleWorkerCredentialChange('clientId', value)}
						onClientSecretChange={(value) => handleWorkerCredentialChange('clientSecret', value)}
						onScopesChange={(value) => handleWorkerCredentialChange('scopes', value)}
						showRedirectUri={false}
						showPostLogoutRedirectUri={false}
						showLoginHint={false}
						showClientSecret={true}
					/>

					{/* Token Endpoint Auth Method */}
					<FormGroup style={{ marginTop: '1rem' }}>
						<Label>
							Token Endpoint Authentication Method
							<span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>
						</Label>
						<p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
							This must match the authentication method configured in your PingOne worker application.
						</p>
						<Select
							value={workerCredentials.tokenEndpointAuthMethod}
							onChange={(e) => handleWorkerCredentialChange('tokenEndpointAuthMethod', e.target.value as 'client_secret_basic' | 'client_secret_post')}
						>
							<option value="client_secret_post">Client Secret Post (credentials in request body)</option>
							<option value="client_secret_basic">Client Secret Basic (credentials in Authorization header)</option>
						</Select>
						<p style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
							<FiSettings size={12} />
							<strong>Important:</strong> Check your worker app settings in PingOne to ensure this matches.
						</p>
					</FormGroup>

					<div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
						<ActionButton
							onClick={handleSaveAndGetToken}
							disabled={
								!workerCredentials.environmentId ||
								!workerCredentials.clientId ||
								!workerCredentials.clientSecret ||
								isGettingToken
							}
						>
							{isGettingToken ? (
								<>
									<LoadingSpinner /> Getting Token...
								</>
							) : (
								<>
									<FiKey /> Save & Get Worker Token
								</>
							)}
						</ActionButton>
						
						<Button
							variant="secondary"
							onClick={() => {
								localStorage.removeItem('app-generator-worker-credentials');
								setWorkerCredentials({
									environmentId: '',
									clientId: '',
									clientSecret: '',
									scopes: 'openid p1:create:application p1:read:application p1:update:application',
									tokenEndpointAuthMethod: 'client_secret_post',
								});
								setTokenError(null);
								v4ToastManager.showSuccess('Credentials cleared');
							}}
							style={{ padding: '0.75rem 1.25rem' }}
						>
							<FiX /> Clear
						</Button>
						
						{tokenError && (
							<span style={{ color: '#ef4444', fontSize: '0.9rem', width: '100%', marginTop: '0.5rem' }}>
								⚠️ {tokenError}
							</span>
						)}
					</div>
				</FormContainer>
			)}

			{/* Success indicator when we have a token */}
			{workerToken && (
				<SuccessMessage>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiCheckCircle /> Worker token active - Ready to create applications
					</div>
					<Button
						variant="secondary"
						onClick={() => {
							setWorkerToken(null);
							setTokenError(null);
						}}
						style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
					>
						<FiSettings /> Change Credentials
					</Button>
				</SuccessMessage>
			)}

			{/* Display Worker Token Request Details */}
			{workerTokenRequest && (
				<div style={{ marginBottom: '2rem' }}>
					<div style={{ 
						background: '#f0fdf4', 
						border: '1px solid #22c55e', 
						borderRadius: '0.75rem', 
						padding: '1.25rem'
					}}>
						<div style={{ 
							display: 'flex', 
							alignItems: 'center', 
							gap: '0.5rem', 
							marginBottom: '0.75rem',
							color: '#166534',
							fontWeight: 600
						}}>
							<FiKey size={20} />
							Worker Token Request (OAuth 2.0 Client Credentials)
						</div>
						<div style={{ fontSize: '0.875rem', color: '#166534', marginBottom: '1rem' }}>
							This shows how to obtain an access token using the Client Credentials grant type.
						</div>

						{/* Token Endpoint */}
						<div style={{ marginBottom: '1rem' }}>
							<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#166534' }}>Token Endpoint:</div>
							<ColoredUrlDisplay
								url={workerTokenRequest.url}
								label="POST"
								showCopyButton={true}
							/>
						</div>

						{/* Authentication Method */}
						<div style={{ marginBottom: '1rem', padding: '1rem', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '0.5rem' }}>
							<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<FiKey size={16} />
								Authentication Method: {workerTokenRequest.authMethod === 'client_secret_basic' ? 'Client Secret Basic' : 'Client Secret Post'}
							</div>
							{workerTokenRequest.authMethod === 'client_secret_basic' ? (
								<div style={{ fontSize: '0.875rem', color: '#78350f' }}>
									Credentials sent in <code style={{ background: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>Authorization</code> header as Base64 encoded string
								</div>
							) : (
								<div style={{ fontSize: '0.875rem', color: '#78350f' }}>
									Credentials sent in request body as <code style={{ background: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>client_id</code> and <code style={{ background: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>client_secret</code> parameters
								</div>
							)}
						</div>

						{/* Headers */}
						<div style={{ marginBottom: '1rem' }}>
							<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#166534' }}>Headers:</div>
							<pre style={{ 
								background: '#1e293b', 
								color: '#e2e8f0', 
								padding: '1rem', 
								borderRadius: '0.5rem', 
								overflowX: 'auto',
								fontSize: '0.875rem',
								lineHeight: '1.6',
								fontFamily: 'Monaco, Menlo, monospace'
							}}>
								{Object.entries(workerTokenRequest.headers).map(([key, value]) => 
									`${key}: ${key === 'Authorization' && value.startsWith('Basic') ? 'Basic [base64_encoded_credentials]' : value}`
								).join('\n')}
							</pre>
						</div>

						{/* Request Body */}
						<div>
							<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#166534' }}>Request Body (URL-encoded):</div>
							<pre style={{ 
								background: '#1e293b', 
								color: '#e2e8f0', 
								padding: '1rem', 
								borderRadius: '0.5rem', 
								overflowX: 'auto',
								fontSize: '0.875rem',
								lineHeight: '1.6',
								fontFamily: 'Monaco, Menlo, monospace'
							}}>
								{workerTokenRequest.body.split('&').map(param => {
									const [key, value] = param.split('=');
									return `${key}=${key.includes('secret') ? '[REDACTED]' : decodeURIComponent(value)}`;
								}).join('\n')}
							</pre>
						</div>
					</div>
				</div>
			)}

			{/* Only show app creation if we have a worker token */}
			{workerToken && (
				<CardGrid>
					{appTypes.map((appType) => (
						<AppTypeCard
							key={appType.type}
							selected={selectedAppType === appType.type}
							onClick={() => handleAppTypeSelect(appType.type)}
						>
							<div className="icon">{appType.icon}</div>
							<div className="title">{appType.title}</div>
							<div className="description">{appType.description}</div>
						</AppTypeCard>
					))}
				</CardGrid>
			)}

			{selectedAppType && (
				<FormContainer>
					<FormTitle>Configure {appTypes.find((t) => t.type === selectedAppType)?.title}</FormTitle>

					<FormGrid>
						<FormGroup>
							<Label>Application Name *</Label>
							<Input
								value={formData.name}
								onChange={(e) => handleInputChange('name', e.target.value)}
								placeholder="My Awesome App"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Description</Label>
							<Input
								value={formData.description}
								onChange={(e) => handleInputChange('description', e.target.value)}
								placeholder="Optional description"
							/>
						</FormGroup>

						{(selectedAppType === 'OIDC_WEB_APP' ||
							selectedAppType === 'OIDC_NATIVE_APP' ||
							selectedAppType === 'SINGLE_PAGE_APP') && (
							<>
								<FormGroup>
									<Label>Redirect URIs</Label>
									<TextArea
										value={formData.redirectUris.join('\n')}
										onChange={(e) =>
											handleArrayChange(
												'redirectUris',
												e.target.value.split('\n').filter((uri) => uri.trim())
											)
										}
										placeholder="http://localhost:3000/callback&#10;https://myapp.com/callback"
									/>
								</FormGroup>

								<FormGroup>
									<Label>Post-Logout Redirect URIs</Label>
									<TextArea
										value={formData.postLogoutRedirectUris.join('\n')}
										onChange={(e) =>
											handleArrayChange(
												'postLogoutRedirectUris',
												e.target.value.split('\n').filter((uri) => uri.trim())
											)
										}
										placeholder="http://localhost:3000&#10;https://myapp.com"
									/>
								</FormGroup>
							</>
						)}

						<FormGroup>
							<Label>Grant Types</Label>
							<CheckboxGroup>
								{['authorization_code', 'implicit', 'refresh_token', 'client_credentials'].map(
									(grantType) => (
										<CheckboxLabel key={grantType}>
											<Checkbox
												type="checkbox"
												checked={formData.grantTypes.includes(grantType)}
												onChange={(e) => {
													const newGrants = e.target.checked
														? [...formData.grantTypes, grantType]
														: formData.grantTypes.filter((g) => g !== grantType);
													handleArrayChange('grantTypes', newGrants);
												}}
											/>
											{grantType.replace('_', ' ')}
										</CheckboxLabel>
									)
								)}
							</CheckboxGroup>
						</FormGroup>

						{(selectedAppType === 'OIDC_WEB_APP' ||
							selectedAppType === 'OIDC_NATIVE_APP' ||
							selectedAppType === 'SINGLE_PAGE_APP') && (
							<FormGroup>
								<Label>Response Types</Label>
								<CheckboxGroup>
									{['code', 'token', 'id_token'].map((responseType) => (
										<CheckboxLabel key={responseType}>
											<Checkbox
												type="checkbox"
												checked={formData.responseTypes.includes(responseType)}
												onChange={(e) => {
													const newTypes = e.target.checked
														? [...formData.responseTypes, responseType]
														: formData.responseTypes.filter((t) => t !== responseType);
													handleArrayChange('responseTypes', newTypes);
												}}
											/>
											{responseType}
										</CheckboxLabel>
									))}
								</CheckboxGroup>
							</FormGroup>
						)}

						<FormGroup>
							<Label>Token Endpoint Auth Method</Label>
							<Select
								value={formData.tokenEndpointAuthMethod}
								onChange={(e) => handleInputChange('tokenEndpointAuthMethod', e.target.value)}
							>
								{selectedAppType === 'OIDC_NATIVE_APP' || selectedAppType === 'SINGLE_PAGE_APP' ? (
									<>
										<option value="none">None (Public Client)</option>
										<option value="client_secret_basic">Client Secret Basic</option>
										<option value="client_secret_post">Client Secret Post</option>
									</>
								) : (
									<>
										<option value="none">None</option>
										<option value="client_secret_basic">Client Secret Basic</option>
										<option value="client_secret_post">Client Secret Post</option>
										<option value="client_secret_jwt">Client Secret JWT</option>
										<option value="private_key_jwt">Private Key JWT</option>
									</>
								)}
							</Select>
						</FormGroup>

						{(selectedAppType === 'OIDC_WEB_APP' ||
							selectedAppType === 'OIDC_NATIVE_APP' ||
							selectedAppType === 'SINGLE_PAGE_APP') && (
							<FormGroup>
								<Label>PKCE Enforcement</Label>
								<Select
									value={formData.pkceEnforcement}
									onChange={(e) => handleInputChange('pkceEnforcement', e.target.value)}
								>
									<option value="OPTIONAL">Optional</option>
									<option value="REQUIRED">Required</option>
								</Select>
							</FormGroup>
						)}

						<FormGroup>
							<Label>Scopes</Label>
							<TextArea
								value={formData.scopes.join(' ')}
								onChange={(e) =>
									handleArrayChange(
										'scopes',
										e.target.value.split(' ').filter((scope) => scope.trim())
									)
								}
								placeholder="openid profile email"
							/>
						</FormGroup>

						<FormGroup>
							<Label>Access Token Validity (seconds)</Label>
							<Input
								type="number"
								value={formData.accessTokenValiditySeconds}
								onChange={(e) =>
									handleInputChange('accessTokenValiditySeconds', parseInt(e.target.value))
								}
							/>
						</FormGroup>
					</FormGrid>

					<ButtonGroup>
						<Button variant="secondary" onClick={() => setSelectedAppType(null)}>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleCreateApp}
							disabled={isCreating || !formData.name.trim()}
						>
							{isCreating ? <LoadingSpinner /> : <FiCheckCircle />}
							Create Application
						</Button>
					</ButtonGroup>
				</FormContainer>
			)}

			{creationResult && (
				<ResultCard type={creationResult.success ? 'success' : 'error'}>
					<ResultTitle>
						{creationResult.success ? <FiCheckCircle /> : <FiX />}
						{creationResult.success
							? 'Application Created Successfully!'
							: 'Application Creation Failed'}
					</ResultTitle>
					<ResultContent>
						{creationResult.success ? (
							<div>
								<p>Your application has been created in PingOne with the following details:</p>
								{creationResult.app && (
									<ResultDetails>
										<strong>Application ID:</strong> {creationResult.app.id}
										<br />
										<strong>Client ID:</strong> {creationResult.app.clientId}
										<br />
										<strong>Name:</strong> {creationResult.app.name}
										<br />
										<strong>Type:</strong> {creationResult.app.type}
										<br />
										<strong>Created:</strong>{' '}
										{new Date(creationResult.app.createdAt).toLocaleString()}
									</ResultDetails>
								)}
							</div>
						) : (
							<div>
								<p>Failed to create the application:</p>
								<ResultDetails>{creationResult.error}</ResultDetails>
							</div>
						)}
					</ResultContent>
				</ResultCard>
			)}

			{lastApiUrl && (
				<div style={{ marginTop: '2rem' }}>
					<div style={{ 
						background: '#eff6ff', 
						border: '1px solid #3b82f6', 
						borderRadius: '0.75rem', 
						padding: '1.25rem',
						marginBottom: '1rem'
					}}>
						<div style={{ 
							display: 'flex', 
							alignItems: 'center', 
							gap: '0.5rem', 
							marginBottom: '0.75rem',
							color: '#1e40af',
							fontWeight: 600
						}}>
							<FiCode size={20} />
							PingOne Management API Call Details
						</div>
						<div style={{ fontSize: '0.875rem', color: '#1e40af', marginBottom: '1rem' }}>
							Learn how the API call is made. This shows the endpoint, authentication method, and request body.
						</div>

						{/* API Endpoint */}
						<div style={{ marginBottom: '1rem' }}>
							<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1e40af' }}>API Endpoint:</div>
							<ColoredUrlDisplay
								url={lastApiUrl}
								label="POST"
								showCopyButton={true}
							/>
						</div>

						{/* Authentication */}
						<div style={{ marginBottom: '1rem', padding: '1rem', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '0.5rem' }}>
							<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
								<FiKey size={16} />
								Authentication Method
							</div>
							<div style={{ fontSize: '0.875rem', color: '#78350f', marginBottom: '0.5rem' }}>
								<strong>Type:</strong> Bearer Token (OAuth 2.0 Client Credentials)
							</div>
							<div style={{ fontSize: '0.875rem', color: '#78350f', marginBottom: '0.5rem' }}>
								<strong>Header:</strong> <code style={{ background: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>Authorization: Bearer [worker_token]</code>
							</div>
							<div style={{ fontSize: '0.875rem', color: '#78350f' }}>
								<strong>Worker Token Auth Method:</strong> <code style={{ background: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>client_secret_post</code>
							</div>
							<div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.5rem', fontStyle: 'italic' }}>
								💡 The worker token was obtained using client_credentials grant with client_secret_post authentication
							</div>
						</div>

						{/* Request Body */}
						{lastRequestBody && (
							<div>
								<div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1e40af' }}>Request Body (JSON):</div>
								<pre style={{ 
									background: '#1e293b', 
									color: '#e2e8f0', 
									padding: '1rem', 
									borderRadius: '0.5rem', 
									overflowX: 'auto',
									fontSize: '0.875rem',
									lineHeight: '1.6',
									fontFamily: 'Monaco, Menlo, monospace'
								}}>
									{lastRequestBody}
								</pre>
							</div>
						)}
					</div>
				</div>
			)}
		</Container>
	);
};

export default ClientGenerator;
