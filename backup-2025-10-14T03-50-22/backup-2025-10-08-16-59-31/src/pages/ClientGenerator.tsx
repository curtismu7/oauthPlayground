// src/pages/ClientGenerator.tsx
import React, { useState, useEffect } from 'react';
import {
	FiCheckCircle,
	FiX,
	FiLoader,
	FiSettings,
	FiSmartphone,
	FiGlobe,
	FiCode,
	FiServer,
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
import { credentialManager } from '../utils/credentialManager';

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

const ClientGenerator: React.FC = () => {
	usePageScroll({ pageName: 'Client Generator', force: true });

	const [selectedAppType, setSelectedAppType] = useState<AppType | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [creationResult, setCreationResult] = useState<AppCreationResult | null>(null);
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

	// Load credentials on mount
	useEffect(() => {
		const loadCredentials = () => {
			try {
				const configCredentials = credentialManager.loadConfigCredentials();
				if (configCredentials.environmentId && configCredentials.clientId) {
					// Service is initialized with worker token for API access
					// We'll handle this when creating apps
				}
			} catch (error) {
				console.error('Failed to load credentials:', error);
			}
		};

		loadCredentials();
	}, []);

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
					tokenEndpointAuthMethod: 'client_secret_basic',
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
			// Get credentials for API access
			const credentials = credentialManager.loadConfigCredentials();
			if (!credentials.environmentId || !credentials.clientId) {
				throw new Error(
					'No valid credentials found. Please configure your PingOne credentials first.'
				);
			}

			// For now, we'll use the existing client credentials to create apps
			// In a real implementation, you'd have a separate management token
			const accessToken = localStorage.getItem('pingone_access_token');
			if (!accessToken) {
				throw new Error('No access token available. Please authenticate first.');
			}

			// Initialize the service
			pingOneAppCreationService.initialize(accessToken, credentials.environmentId);

			// Create the app based on type
			let result: AppCreationResult;

			const baseConfig = {
				name: formData.name,
				description: formData.description,
				enabled: formData.enabled,
			};

			switch (selectedAppType) {
				case 'OIDC_WEB_APP':
					result = await pingOneAppCreationService.createOIDCWebApp({
						...baseConfig,
						type: 'OIDC_WEB_APP',
						redirectUris: formData.redirectUris,
						postLogoutRedirectUris: formData.postLogoutRedirectUris,
						grantTypes: formData.grantTypes as any,
						responseTypes: formData.responseTypes as any,
						tokenEndpointAuthMethod: formData.tokenEndpointAuthMethod as any,
						pkceEnforcement: formData.pkceEnforcement as any,
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
						idTokenValiditySeconds: formData.idTokenValiditySeconds,
					});
					break;
				case 'OIDC_NATIVE_APP':
					result = await pingOneAppCreationService.createOIDCNativeApp({
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
					});
					break;
				case 'SINGLE_PAGE_APP':
					result = await pingOneAppCreationService.createSinglePageApp({
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
					});
					break;
				case 'WORKER':
					result = await pingOneAppCreationService.createWorkerApp({
						...baseConfig,
						type: 'WORKER',
						grantTypes: formData.grantTypes as any,
						tokenEndpointAuthMethod: formData.tokenEndpointAuthMethod as any,
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
					});
					break;
				case 'SERVICE':
					result = await pingOneAppCreationService.createServiceApp({
						...baseConfig,
						type: 'SERVICE',
						grantTypes: formData.grantTypes as any,
						tokenEndpointAuthMethod: formData.tokenEndpointAuthMethod as any,
						scopes: formData.scopes,
						accessTokenValiditySeconds: formData.accessTokenValiditySeconds,
						refreshTokenValiditySeconds: formData.refreshTokenValiditySeconds,
					});
					break;
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
								<option value="client_secret_basic">Client Secret Basic</option>
								<option value="client_secret_post">Client Secret Post</option>
								<option value="client_secret_jwt">Client Secret JWT</option>
								<option value="private_key_jwt">Private Key JWT</option>
								<option value="none">None</option>
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
		</Container>
	);
};

export default ClientGenerator;
