import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiSave, FiEye, FiEyeOff, FiGlobe } from 'react-icons/fi';
import { usePageScroll } from '../hooks/usePageScroll';
import { getSharedConfigurationStatus } from '../utils/configurationStatus';
import DiscoveryPanel from '../components/DiscoveryPanel';
import { OpenIDConfiguration } from '../services/discoveryService';
import { credentialManager } from '../utils/credentialManager';
import { getAllFlowCredentialStatuses } from '../utils/flowCredentialChecker';
import StandardMessage from '../components/StandardMessage';
import CollapsibleSection from '../components/CollapsibleSection';
import CentralizedSuccessMessage, {
	showFlowSuccess,
	showFlowError,
} from '../components/CentralizedSuccessMessage';
import CredentialStatusPanel from '../components/CredentialStatusPanel';
import packageJson from '../../package.json';

const ConfigurationContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.5rem;
  }
  
  p {
    color: ${({ theme }) => theme.colors.gray600};
    font-size: 1.1rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.gray700};
  }
  
  input, select, textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid ${({ theme }) => theme.colors.gray300};
    border-radius: 0.375rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.primary}40`};
    }
    
    &::placeholder {
      color: ${({ theme }) => theme.colors.gray400};
    }
  }
  
  textarea {
    min-height: 120px;
    resize: vertical;
  }
  
  .form-text {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.gray600};
  }
  
  /* Custom checkbox styling */
  input[type="checkbox"] {
    width: auto !important;
    margin-right: 0.5rem;
    appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid ${({ theme }) => theme.colors.gray300};
    border-radius: 0.25rem;
    background-color: white;
    cursor: pointer;
    position: relative;
    transition: all 0.15s ease-in-out;
    
    &:checked {
      background-color: ${({ theme }) => theme.colors.primary};
      border-color: ${({ theme }) => theme.colors.primary};
    }
    
    &:checked::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 0.875rem;
      font-weight: bold;
    }
    
    &:focus {
      box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.primary}40`};
    }
  }
  
  /* Checkbox container styling */
  .checkbox-container {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
    
    label {
      margin: 0;
      cursor: pointer;
      line-height: 1.5;
    }
  }
  
  .invalid-feedback {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const SaveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.25rem;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background-color: ${({ theme }) => theme.colors.primary};
  border: 1px solid transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-width: 120px;
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryDark};
  }
  
  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.primary};
  }
  
  .spinner {
    margin-right: 8px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 2px solid white;
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const LoadingSpinner = styled.div`
  border: 2px solid rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  border-top: 2px solid #0070cc;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Configuration = () => {
	// Centralized scroll management - ALL pages start at top
	usePageScroll({ pageName: 'Configuration', force: true });

	const [initialLoading, setInitialLoading] = useState(true);
	const [flowCredentialStatuses, setFlowCredentialStatuses] = useState(
		getAllFlowCredentialStatuses()
	);

	// Helper function to get status for a specific flow
	const getFlowStatus = (flowType: string) => {
		return flowCredentialStatuses.find((status) => status.flowType === flowType);
	};

	// Refresh flow credential statuses when form data changes
	useEffect(() => {
		setFlowCredentialStatuses(getAllFlowCredentialStatuses());
	}, [formData]);

	const [formData, setFormData] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: window.location.origin + '/callback',
		scopes: 'openid profile email',
		authEndpoint: 'https://auth.pingone.com/{envId}/as/authorize',
		tokenEndpoint: 'https://auth.pingone.com/{envId}/as/token',
		userInfoEndpoint: 'https://auth.pingone.com/{envId}/as/userinfo',
		endSessionEndpoint: 'https://auth.pingone.com/{envId}/as/end_session',
		enablePKCE: true,
		codeChallengeMethod: 'S256',
		responseType: 'code',
		enableOIDC: true,
		useGlobalConfig: false,
		showCredentialsModal: false,
		showSuccessModal: true,
		showAuthRequestModal: false,
	});

	const [errors, setErrors] = useState<Record<string, string | null>>({});
	const [isLoading, setIsLoading] = useState(false);
	const [saveStatus, setSaveStatus] = useState<{
		type: 'success' | 'error' | 'info' | 'danger';
		title: string;
		message: string;
	} | null>(null);
	const [showClientSecret, setShowClientSecret] = useState(false);
	const [showDiscoveryPanel, setShowDiscoveryPanel] = useState(false);

	// Load saved configuration on component mount
	useEffect(() => {
		const loadConfiguration = () => {
			// Debug: Check all localStorage keys first
			console.log('🔧 [Configuration] All localStorage keys:', Object.keys(localStorage));
			console.log(
				'🔧 [Configuration] pingone_permanent_credentials:',
				localStorage.getItem('pingone_permanent_credentials')
			);
			console.log('🔧 [Configuration] pingone_config:', localStorage.getItem('pingone_config'));
			console.log(
				'🔧 [Configuration] login_credentials:',
				localStorage.getItem('login_credentials')
			);

			// Load from configuration-specific credentials first
			const configCredentials = credentialManager.loadConfigCredentials();

			console.log(
				'🔧 [Configuration] Loading configuration, config credentials:',
				configCredentials
			);

			if (configCredentials && (configCredentials.environmentId || configCredentials.clientId)) {
				console.log('✅ [Configuration] Loading from config credentials');
				setFormData((prev) => ({
					...prev,
					environmentId: configCredentials.environmentId || '',
					clientId: configCredentials.clientId || '',
					clientSecret: (configCredentials as any).clientSecret || '',
					redirectUri: configCredentials.redirectUri || prev.redirectUri,
					scopes: Array.isArray(configCredentials.scopes)
						? configCredentials.scopes.join(' ')
						: configCredentials.scopes || prev.scopes,
					authEndpoint: configCredentials.authEndpoint || prev.authEndpoint,
					tokenEndpoint: configCredentials.tokenEndpoint || prev.tokenEndpoint,
					userInfoEndpoint: configCredentials.userInfoEndpoint || prev.userInfoEndpoint,
					endSessionEndpoint: configCredentials.endSessionEndpoint || prev.endSessionEndpoint,
				}));
			} else {
				// Fallback to legacy pingone_config
				const savedConfig = localStorage.getItem('pingone_config');
				if (savedConfig) {
					try {
						const parsedConfig = JSON.parse(savedConfig);
						console.log('🔧 [Configuration] Loading from legacy pingone_config:', parsedConfig);

						// Check if the client secret is the problematic hardcoded one
						if (
							parsedConfig.clientSecret ===
							'0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a'
						) {
							console.log('🧹 [Configuration] Clearing problematic hardcoded client secret');
							parsedConfig.clientSecret = '';
							// Update localStorage with cleared secret
							localStorage.setItem('pingone_config', JSON.stringify(parsedConfig));
						}

						setFormData((prev) => ({
							...prev,
							...parsedConfig,
						}));

						// Migrate to new credential manager if we have valid credentials
						if (parsedConfig.environmentId && parsedConfig.clientId) {
							console.log('🔄 [Configuration] Migrating legacy credentials to config credentials');
							credentialManager.saveConfigCredentials({
								environmentId: parsedConfig.environmentId,
								clientId: parsedConfig.clientId,
								clientSecret: parsedConfig.clientSecret || '',
								redirectUri: parsedConfig.redirectUri || window.location.origin + '/callback',
								scopes: parsedConfig.scopes || ['openid', 'profile', 'email'],
								authEndpoint: parsedConfig.authEndpoint,
								tokenEndpoint: parsedConfig.tokenEndpoint,
								userInfoEndpoint: parsedConfig.userInfoEndpoint,
								endSessionEndpoint: parsedConfig.endSessionEndpoint,
							});
						}
					} catch (error) {
						console.error('Failed to load saved configuration:', error);
					}
				} else {
					// Try login_credentials as last resort
					const loginCreds = localStorage.getItem('login_credentials');
					if (loginCreds) {
						try {
							const parsedLoginCreds = JSON.parse(loginCreds);
							console.log('🔧 [Configuration] Loading from login_credentials:', parsedLoginCreds);

							setFormData((prev) => ({
								...prev,
								...parsedLoginCreds,
							}));

							// Migrate to new credential manager if we have valid credentials
							if (parsedLoginCreds.environmentId && parsedLoginCreds.clientId) {
								console.log('🔄 [Configuration] Migrating login credentials to config credentials');
								credentialManager.saveConfigCredentials({
									environmentId: parsedLoginCreds.environmentId,
									clientId: parsedLoginCreds.clientId,
									clientSecret: parsedLoginCreds.clientSecret || '',
									redirectUri: parsedLoginCreds.redirectUri || window.location.origin + '/callback',
									scopes: parsedLoginCreds.scopes || ['openid', 'profile', 'email'],
									authEndpoint: parsedLoginCreds.authEndpoint,
									tokenEndpoint: parsedLoginCreds.tokenEndpoint,
									userInfoEndpoint: parsedLoginCreds.userInfoEndpoint,
									endSessionEndpoint: parsedLoginCreds.endSessionEndpoint,
								});
							}
						} catch (error) {
							console.error('Failed to load login credentials:', error);
						}
					}
				}
			}

			// Load UI settings from flow configuration
			const flowConfigKey = 'enhanced-flow-authorization-code';
			const flowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || '{}');
			if (
				flowConfig.showCredentialsModal !== undefined ||
				flowConfig.showSuccessModal !== undefined ||
				flowConfig.showAuthRequestModal !== undefined
			) {
				console.log('✅ [Configuration] Loading UI settings from flow config:', flowConfig);
				setFormData((prev) => ({
					...prev,
					showCredentialsModal:
						flowConfig.showCredentialsModal !== undefined
							? flowConfig.showCredentialsModal
							: prev.showCredentialsModal,
					showSuccessModal:
						flowConfig.showSuccessModal !== undefined
							? flowConfig.showSuccessModal
							: prev.showSuccessModal,
					showAuthRequestModal:
						flowConfig.showAuthRequestModal !== undefined
							? flowConfig.showAuthRequestModal
							: prev.showAuthRequestModal,
				}));
			}
		};

		loadConfiguration();

		// Show spinner for 500ms
		setTimeout(() => setInitialLoading(false), 500);
	}, []);

	// Listen for credential changes from login page
	useEffect(() => {
		const handleCredentialChange = () => {
			console.log(
				'🔄 [Configuration] Credentials updated from login page, refreshing configuration...'
			);

			// Load from config credentials
			const configCredentials = credentialManager.loadConfigCredentials();

			if (configCredentials && (configCredentials.environmentId || configCredentials.clientId)) {
				setFormData((prev) => ({
					...prev,
					environmentId: configCredentials.environmentId || '',
					clientId: configCredentials.clientId || '',
					redirectUri: configCredentials.redirectUri || prev.redirectUri,
					scopes: Array.isArray(configCredentials.scopes)
						? configCredentials.scopes.join(' ')
						: configCredentials.scopes || prev.scopes,
					authEndpoint: configCredentials.authEndpoint || prev.authEndpoint,
					tokenEndpoint: configCredentials.tokenEndpoint || prev.tokenEndpoint,
					userInfoEndpoint: configCredentials.userInfoEndpoint || prev.userInfoEndpoint,
					endSessionEndpoint: configCredentials.endSessionEndpoint || prev.endSessionEndpoint,
				}));

				// Show success message
				setSaveStatus({
					type: 'success',
					title: 'PingOne Credentials Updated',
					message:
						'PingOne credentials have been automatically updated with the credentials saved from the login page.',
				});

				// Clear message after 5 seconds
				setTimeout(() => setSaveStatus(null), 5000);
			}
		};

		// Listen for credential change events
		window.addEventListener('permanent-credentials-changed', handleCredentialChange);
		window.addEventListener('pingone-config-changed', handleCredentialChange);

		return () => {
			window.removeEventListener('permanent-credentials-changed', handleCredentialChange);
			window.removeEventListener('pingone-config-changed', handleCredentialChange);
		};
	}, []);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		// Clear error when field is edited
		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: null,
			}));
		}
	};

	const validateForm = () => {
		console.log('🔍 [Configuration] Validating form with data:', formData);
		const newErrors: Record<string, string> = {};
		let isValid = true;

		if (!formData.environmentId) {
			newErrors.environmentId = 'Environment ID is required';
			isValid = false;
		}

		if (!formData.clientId) {
			newErrors.clientId = 'Client ID is required';
			isValid = false;
		}

		if (!formData.redirectUri) {
			newErrors.redirectUri = 'Redirect URI is required';
			isValid = false;
		} else if (!/^https?:\/\//.test(formData.redirectUri)) {
			newErrors.redirectUri = 'Redirect URI must start with http:// or https://';
			isValid = false;
		}

		console.log('🔍 [Configuration] Validation result:', { isValid, errors: newErrors });
		setErrors(newErrors);
		return isValid;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		console.log('🔍 [Configuration] Form submitted');

		if (!validateForm()) {
			console.log('❌ [Configuration] Form validation failed');
			return;
		}

		console.log('✅ [Configuration] Form validation passed, starting save...');
		setIsLoading(true);
		setSaveStatus(null);

		try {
			// Format endpoints with environment ID
			const configToSave = {
				...formData,
				authEndpoint: formData.authEndpoint.replace('{envId}', formData.environmentId),
				tokenEndpoint: formData.tokenEndpoint.replace('{envId}', formData.environmentId),
				userInfoEndpoint: formData.userInfoEndpoint.replace('{envId}', formData.environmentId),
			};

			console.log('💾 [Configuration] Saving config using credential manager:', configToSave);

			// Save configuration-specific credentials (Environment ID, Client ID, etc.)
			const configSuccess = credentialManager.saveConfigCredentials({
				environmentId: configToSave.environmentId,
				clientId: configToSave.clientId,
				clientSecret: configToSave.clientSecret,
				redirectUri: configToSave.redirectUri,
				scopes: configToSave.scopes
					? configToSave.scopes.split(' ')
					: ['openid', 'profile', 'email'],
				authEndpoint: configToSave.authEndpoint,
				tokenEndpoint: configToSave.tokenEndpoint,
				userInfoEndpoint: configToSave.userInfoEndpoint,
				endSessionEndpoint: configToSave.endSessionEndpoint,
			});

			// Also save to legacy pingone_config for backward compatibility
			localStorage.setItem('pingone_config', JSON.stringify(configToSave));

			// Save UI settings to flow configuration
			const flowConfigKey = 'enhanced-flow-authorization-code';
			const existingFlowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || '{}');
			const updatedFlowConfig = {
				...existingFlowConfig,
				showCredentialsModal: formData.showCredentialsModal,
				showSuccessModal: formData.showSuccessModal,
				showAuthRequestModal: formData.showAuthRequestModal,
			};
			localStorage.setItem(flowConfigKey, JSON.stringify(updatedFlowConfig));
			console.log('💾 [Configuration] UI settings saved to flow config:', updatedFlowConfig);

			// Dispatch custom event to notify other components that config has changed
			console.log('📡 [Configuration] Dispatching configuration change events...');
			window.dispatchEvent(new CustomEvent('pingone-config-changed'));
			window.dispatchEvent(new CustomEvent('permanent-credentials-changed'));
			console.log('📡 [Configuration] Configuration change events dispatched');

			console.log('✅ [Configuration] Config saved successfully:', { configSuccess });

			setSaveStatus({
				type: 'success',
				title: 'PingOne Credentials saved',
				message: 'Your PingOne credentials have been saved successfully to localStorage.',
			});

			// Show centralized success message as well
			showFlowSuccess(
				'✅ Configuration Saved Successfully!',
				'Your PingOne OAuth credentials have been saved and are ready to use across all flows.'
			);

			console.log('✅ [Configuration] Success status set');
		} catch (error) {
			console.error('❌ [Configuration] Failed to save configuration:', error);

			setSaveStatus({
				type: 'danger',
				title: 'Error',
				message: 'Failed to save PingOne credentials. Please try again.',
			});

			// Show centralized error message as well
			showFlowError(
				'❌ Configuration Save Failed',
				'Failed to save PingOne credentials. Please check your input and try again.'
			);
		} finally {
			console.log('🔄 [Configuration] Setting isLoading to false');
			setIsLoading(false);
		}
	};

	// Clear success message after 5 seconds when saveStatus changes
	useEffect(() => {
		if (saveStatus?.type === 'success') {
			const timer = setTimeout(() => {
				console.log('⏰ [Configuration] Clearing success message after 5 seconds');
				setSaveStatus(null);
			}, 5000);

			return () => clearTimeout(timer);
		}
	}, [saveStatus]);

	// Debug state changes
	useEffect(() => {
		console.log(
			'🔄 [Configuration] State changed - isLoading:',
			isLoading,
			'saveStatus:',
			saveStatus
		);
	}, [isLoading, saveStatus]);

	// Handle discovery panel configuration
	const handleConfigurationDiscovered = (config: OpenIDConfiguration, environmentId: string) => {
		console.log('🔍 [Configuration] Configuration discovered:', config);

		setFormData((prev) => ({
			...prev,
			environmentId: environmentId,
			authEndpoint: config.authorization_endpoint,
			tokenEndpoint: config.token_endpoint,
			userInfoEndpoint: config.userinfo_endpoint,
			scopes: config.scopes_supported?.join(' ') || 'openid profile email',
		}));

		setSaveStatus({
			type: 'success',
			title: 'PingOne Credentials Discovered',
			message: `Successfully discovered and applied PingOne credentials for environment ${environmentId}`,
		});

		// Show centralized success message as well
		showFlowSuccess(
			'🔍 Discovery Successful!',
			`PingOne configuration automatically discovered and applied for environment ${environmentId}`
		);
	};

	if (initialLoading) {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
					backgroundColor: '#f8f9fa',
				}}
			>
				<LoadingSpinner />
			</div>
		);
	}

	// Show page-level spinner when saving
	if (isLoading) {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
					backgroundColor: '#f8f9fa',
				}}
			>
				<div style={{ textAlign: 'center' }}>
					<LoadingSpinner />
					<p style={{ marginTop: '1rem', fontSize: '1.1rem', color: '#374151' }}>
						Saving PingOne Credentials...
					</p>
				</div>
			</div>
		);
	}

	return (
		<ConfigurationContainer>
			<PageHeader>
				<h1>🔧 Flow-Specific Credential Configuration</h1>
				<p>
					Configure credentials for each OIDC and OAuth 2.0 flow type. Each flow can have its own
					settings or use global configuration.
				</p>
			</PageHeader>

			{/* Global Status Panel */}
			<CredentialStatusPanel />

			{/* Flow Credential Status Table */}
			<CollapsibleSection
				title="Flow Credential Status Overview"
				subtitle="Comprehensive view of all OAuth and OIDC flow credential status"
				icon="📊"
				defaultCollapsed={false}
			>
				{/* OAuth 2.0 Flows Table */}
				<div style={{ marginBottom: '1.5rem' }}>
					<h5
						style={{
							fontSize: '0.875rem',
							fontWeight: '600',
							marginBottom: '0.75rem',
							color: '#dc2626',
						}}
					>
						OAuth 2.0 Flows
					</h5>
					<div
						style={{
							backgroundColor: '#fef2f2',
							border: '1px solid #fecaca',
							borderRadius: '0.5rem',
							overflow: 'hidden',
						}}
					>
						<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
							<thead>
								<tr style={{ backgroundColor: '#fee2e2' }}>
									<th
										style={{
											padding: '0.75rem',
											textAlign: 'left',
											borderBottom: '1px solid #fecaca',
											fontWeight: '600',
										}}
									>
										Flow Type
									</th>
									<th
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #fecaca',
											fontWeight: '600',
										}}
									>
										Last Execution Time
									</th>
									<th
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #fecaca',
											fontWeight: '600',
										}}
									>
										Credentials
									</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td style={{ padding: '0.75rem', borderBottom: '1px solid #fecaca' }}>
										🔐 OAuth 2.0 Authorization Code (V3)
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #fecaca',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#f3f4f6',
												color: '#6b7280',
											}}
										>
											{getFlowStatus('oauth-authorization-code-v3')?.lastExecutionTime || 'Never'}
										</span>
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #fecaca',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: getFlowStatus('oauth-authorization-code-v3')
													?.hasCredentials
													? '#dcfce7'
													: '#fee2e2',
												color: getFlowStatus('oauth-authorization-code-v3')?.hasCredentials
													? '#166534'
													: '#dc2626',
											}}
										>
											{getFlowStatus('oauth-authorization-code-v3')?.hasCredentials
												? 'Configured'
												: 'Missing'}
										</span>
									</td>
								</tr>
								<tr>
									<td style={{ padding: '0.75rem', borderBottom: '1px solid #fecaca' }}>
										🚀 OAuth 2.0 Implicit V3
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #fecaca',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Ready
										</span>
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #fecaca',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Configured
										</span>
									</td>
								</tr>
								<tr>
									<td style={{ padding: '0.75rem', borderBottom: '1px solid #fecaca' }}>
										🚀 OAuth2 Client Credentials V3
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #fecaca',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Ready
										</span>
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #fecaca',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Configured
										</span>
									</td>
								</tr>
								<tr>
									<td style={{ padding: '0.75rem' }}>🚀 OAuth 2.0 Resource Owner Password</td>
									<td style={{ padding: '0.75rem', textAlign: 'center' }}>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Ready
										</span>
									</td>
									<td style={{ padding: '0.75rem', textAlign: 'center' }}>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Configured
										</span>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				{/* OpenID Connect Flows Table */}
				<div style={{ marginBottom: '1.5rem' }}>
					<h5
						style={{
							fontSize: '0.875rem',
							fontWeight: '600',
							marginBottom: '0.75rem',
							color: '#7c3aed',
						}}
					>
						OpenID Connect Flows
					</h5>
					<div
						style={{
							backgroundColor: '#faf5ff',
							border: '1px solid #d8b4fe',
							borderRadius: '0.5rem',
							overflow: 'hidden',
						}}
					>
						<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
							<thead>
								<tr style={{ backgroundColor: '#f3e8ff' }}>
									<th
										style={{
											padding: '0.75rem',
											textAlign: 'left',
											borderBottom: '1px solid #d8b4fe',
											fontWeight: '600',
										}}
									>
										Flow Type
									</th>
									<th
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #d8b4fe',
											fontWeight: '600',
										}}
									>
										Status
									</th>
									<th
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #d8b4fe',
											fontWeight: '600',
										}}
									>
										Credentials
									</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td style={{ padding: '0.75rem', borderBottom: '1px solid #d8b4fe' }}>
										🚀 OIDC Authorization Code (V3)
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #d8b4fe',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Ready
										</span>
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #d8b4fe',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Configured
										</span>
									</td>
								</tr>
								<tr>
									<td style={{ padding: '0.75rem', borderBottom: '1px solid #d8b4fe' }}>
										🚀 OIDC Implicit V3
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #d8b4fe',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Ready
										</span>
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #d8b4fe',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Configured
										</span>
									</td>
								</tr>
								<tr>
									<td style={{ padding: '0.75rem', borderBottom: '1px solid #d8b4fe' }}>
										🚀 OIDC Hybrid V3
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #d8b4fe',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Ready
										</span>
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #d8b4fe',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Configured
										</span>
									</td>
								</tr>
								<tr>
									<td style={{ padding: '0.75rem', borderBottom: '1px solid #d8b4fe' }}>
										🚀 OIDC Client Credentials V3
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #d8b4fe',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Ready
										</span>
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #d8b4fe',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Configured
										</span>
									</td>
								</tr>
								<tr>
									<td style={{ padding: '0.75rem', borderBottom: '1px solid #d8b4fe' }}>
										🚀 OIDC Device Code V3
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #d8b4fe',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Ready
										</span>
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #d8b4fe',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Configured
										</span>
									</td>
								</tr>
								<tr>
									<td style={{ padding: '0.75rem' }}>🚀 OIDC Resource Owner Password</td>
									<td style={{ padding: '0.75rem', textAlign: 'center' }}>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Ready
										</span>
									</td>
									<td style={{ padding: '0.75rem', textAlign: 'center' }}>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fef3c7',
												color: '#92400e',
											}}
										>
											Configured
										</span>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				{/* PingOne Tokens Table */}
				<div>
					<h5
						style={{
							fontSize: '0.875rem',
							fontWeight: '600',
							marginBottom: '0.75rem',
							color: '#059669',
						}}
					>
						PingOne Tokens
					</h5>
					<div
						style={{
							backgroundColor: '#f0fdf4',
							border: '1px solid #bbf7d0',
							borderRadius: '0.5rem',
							overflow: 'hidden',
						}}
					>
						<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
							<thead>
								<tr style={{ backgroundColor: '#dcfce7' }}>
									<th
										style={{
											padding: '0.75rem',
											textAlign: 'left',
											borderBottom: '1px solid #bbf7d0',
											fontWeight: '600',
										}}
									>
										Flow Type
									</th>
									<th
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #bbf7d0',
											fontWeight: '600',
										}}
									>
										Status
									</th>
									<th
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #bbf7d0',
											fontWeight: '600',
										}}
									>
										Credentials
									</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td style={{ padding: '0.75rem' }}>🚀 PingOne Worker Token V3</td>
									<td style={{ padding: '0.75rem', textAlign: 'center' }}>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fee2e2',
												color: '#dc2626',
											}}
										>
											Needs Fix
										</span>
									</td>
									<td style={{ padding: '0.75rem', textAlign: 'center' }}>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: '#fee2e2',
												color: '#dc2626',
											}}
										>
											Missing
										</span>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</CollapsibleSection>

			{/* Global Configuration Section */}
			<CollapsibleSection
				title="Global Configuration"
				subtitle="Default credentials used by all flows (unless overridden)"
				icon="🌐"
				defaultCollapsed={false}
			>
				<form
					onSubmit={(e) => {
						console.log('🔍 [Configuration] Form onSubmit triggered');
						handleSubmit(e);
					}}
					id="configForm"
					onKeyDown={(e) => console.log('🔍 [Configuration] Form keydown:', e.key)}
				>
					<FormGroup>
						<label htmlFor="environmentId">Environment ID</label>
						<input
							type="text"
							id="environmentId"
							name="environmentId"
							value={formData.environmentId}
							onChange={handleChange}
							placeholder="e.g., abc12345-6789-4abc-def0-1234567890ab"
							className={errors.environmentId ? 'is-invalid' : ''}
						/>
						{errors.environmentId && <div className="invalid-feedback">{errors.environmentId}</div>}
						<div className="form-text">
							Your PingOne Environment ID. You can find this in the PingOne Admin Console.
						</div>
					</FormGroup>

					<FormGroup>
						<label htmlFor="clientId">Client ID</label>
						<input
							type="text"
							id="clientId"
							name="clientId"
							value={formData.clientId}
							onChange={handleChange}
							placeholder="Enter your application's Client ID"
							autoComplete="username"
							className={errors.clientId ? 'is-invalid' : ''}
						/>
						{errors.clientId && <div className="invalid-feedback">{errors.clientId}</div>}
						<div className="form-text">The Client ID of your application in PingOne.</div>
					</FormGroup>

					<FormGroup>
						<label htmlFor="clientSecret">Client Secret (Optional)</label>
						<div style={{ position: 'relative' }}>
							<input
								type={showClientSecret ? 'text' : 'password'}
								id="clientSecret"
								name="clientSecret"
								autoComplete="current-password"
								value={formData.clientSecret}
								onChange={handleChange}
								placeholder="Enter your application's Client Secret"
								style={{
									paddingRight: '2.5rem',
									width: '100%',
									maxWidth: '800px',
									fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
									fontSize: '0.875rem',
								}}
							/>
							<button
								type="button"
								onClick={() => {
									const newShowState = !showClientSecret;
									setShowClientSecret(newShowState);
									showFlowSuccess(
										newShowState ? '👁️ Client Secret Shown' : '🙈 Client Secret Hidden',
										newShowState
											? 'Client secret is now visible in the input field'
											: 'Client secret is now hidden for security'
									);
								}}
								style={{
									position: 'absolute',
									right: '0.75rem',
									top: '50%',
									transform: 'translateY(-50%)',
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									color: '#6c757d',
									padding: '0.25rem',
								}}
								aria-label={showClientSecret ? 'Hide client secret' : 'Show client secret'}
							>
								{showClientSecret ? <FiEyeOff size={18} /> : <FiEye size={18} />}
							</button>
						</div>
						<div className="form-text">
							Only required for confidential clients using flows that require client authentication.
						</div>
					</FormGroup>

					<FormGroup>
						<label htmlFor="redirectUri">Redirect URI</label>
						<input
							type="url"
							id="redirectUri"
							name="redirectUri"
							value={formData.redirectUri}
							onChange={handleChange}
							className={errors.redirectUri ? 'is-invalid' : ''}
						/>
						{errors.redirectUri && <div className="invalid-feedback">{errors.redirectUri}</div>}
						<div className="form-text">
							The redirect URI registered in your PingOne application. Must match exactly.
						</div>
					</FormGroup>

					<FormGroup>
						<label htmlFor="scopes">Scopes</label>
						<input
							type="text"
							id="scopes"
							name="scopes"
							value={formData.scopes}
							onChange={handleChange}
							placeholder="openid profile email"
						/>
						<div className="form-text">
							Space-separated list of scopes to request. Common scopes: openid, profile, email,
							offline_access
						</div>
					</FormGroup>

					<h3
						style={{
							margin: '2rem 0 1.5rem',
							fontSize: '1.25rem',
							fontWeight: '600',
							color: '#1f2937',
							borderBottom: '2px solid #e5e7eb',
							paddingBottom: '0.5rem',
						}}
					>
						OAuth Flow Settings
					</h3>

					<FormGroup>
						<label htmlFor="responseType">Response Type</label>
						<select
							id="responseType"
							name="responseType"
							value={formData.responseType}
							onChange={handleChange}
						>
							<option value="code">code (Authorization Code Flow)</option>
							<option value="id_token">id_token (Implicit Flow)</option>
							<option value="id_token token">
								id_token token (Implicit Flow with Access Token)
							</option>
							<option value="code id_token">code id_token (Hybrid Flow)</option>
							<option value="code token">code token (Hybrid Flow)</option>
							<option value="code id_token token">code id_token token (Hybrid Flow)</option>
						</select>
						<div className="form-text">
							The OAuth response type determines which tokens are returned in the authorization
							response.
						</div>
					</FormGroup>

					<FormGroup>
						<div className="checkbox-container">
							<input
								type="checkbox"
								id="enablePKCE"
								name="enablePKCE"
								checked={formData.enablePKCE}
								onChange={(e) => {
									const isEnabled = e.target.checked;
									setFormData((prev) => ({ ...prev, enablePKCE: isEnabled }));
									showFlowSuccess(
										isEnabled ? '🔐 PKCE Enabled' : '🔓 PKCE Disabled',
										isEnabled
											? 'Proof Key for Code Exchange is now enabled for enhanced security'
											: 'PKCE has been disabled - consider enabling for better security'
									);
								}}
							/>
							<label htmlFor="enablePKCE">Enable PKCE (Proof Key for Code Exchange)</label>
						</div>
						<div className="form-text">
							PKCE adds security by preventing authorization code interception attacks. Recommended
							for all flows.
						</div>
					</FormGroup>

					{formData.enablePKCE && (
						<FormGroup>
							<label htmlFor="codeChallengeMethod">Code Challenge Method</label>
							<select
								id="codeChallengeMethod"
								name="codeChallengeMethod"
								value={formData.codeChallengeMethod}
								onChange={handleChange}
							>
								<option value="S256">S256 (SHA256 - Recommended)</option>
								<option value="plain">plain (Plain text - Less secure)</option>
							</select>
							<div className="form-text">
								The method used to generate the code challenge from the code verifier.
							</div>
						</FormGroup>
					)}

					<FormGroup>
						<div className="checkbox-container">
							<input
								type="checkbox"
								id="enableOIDC"
								name="enableOIDC"
								checked={formData.enableOIDC}
								onChange={(e) => {
									const isEnabled = e.target.checked;
									setFormData((prev) => ({ ...prev, enableOIDC: isEnabled }));
									showFlowSuccess(
										isEnabled ? '🔑 OIDC Enabled' : '🔒 OIDC Disabled',
										isEnabled
											? 'OpenID Connect is now enabled for identity authentication'
											: 'OIDC has been disabled - you will use OAuth 2.0 only'
									);
								}}
							/>
							<label htmlFor="enableOIDC">Enable OpenID Connect (OIDC)</label>
						</div>
						<div className="form-text">
							Enable OpenID Connect features like ID tokens and user information endpoints.
						</div>
					</FormGroup>

					<FormGroup>
						<div className="checkbox-container">
							<input
								type="checkbox"
								id="useGlobalConfig"
								name="useGlobalConfig"
								checked={formData.useGlobalConfig || false}
								onChange={(e) => {
									const isEnabled = e.target.checked;
									setFormData((prev) => ({ ...prev, useGlobalConfig: isEnabled }));
									showFlowSuccess(
										isEnabled ? '🌐 Using Global Config' : '⚙️ Using Flow-Specific Config',
										isEnabled
											? 'This flow will use the global configuration settings'
											: 'This flow will use its own specific configuration'
									);
								}}
							/>
							<label htmlFor="useGlobalConfig">Use global config for credentials</label>
						</div>
						<div className="form-text">
							When enabled, all OAuth flows will use these Dashboard credentials instead of their
							individual flow-specific credentials. This simplifies credential management across all
							flows.
						</div>
					</FormGroup>

					<h3
						style={{
							margin: '2rem 0 1.5rem',
							fontSize: '1.25rem',
							fontWeight: '600',
							color: '#1f2937',
							borderBottom: '2px solid #e5e7eb',
							paddingBottom: '0.5rem',
						}}
					>
						Advanced Settings
					</h3>

					<FormGroup>
						<label htmlFor="authEndpoint">Authorization Endpoint</label>
						<input
							type="url"
							id="authEndpoint"
							name="authEndpoint"
							value={formData.authEndpoint}
							onChange={handleChange}
						/>
						<div className="form-text">
							The authorization endpoint URL. Use {'{envId}'} as a placeholder for the environment
							ID.
						</div>
					</FormGroup>

					<FormGroup>
						<label htmlFor="tokenEndpoint">Token Endpoint</label>
						<input
							type="url"
							id="tokenEndpoint"
							name="tokenEndpoint"
							value={formData.tokenEndpoint}
							onChange={handleChange}
						/>
						<div className="form-text">
							The token endpoint URL. Use {'{envId}'} as a placeholder for the environment ID.
						</div>
					</FormGroup>

					<FormGroup>
						<label htmlFor="userInfoEndpoint">UserInfo Endpoint</label>
						<input
							type="url"
							id="userInfoEndpoint"
							name="userInfoEndpoint"
							value={formData.userInfoEndpoint}
							onChange={handleChange}
						/>
						<div className="form-text">
							The UserInfo endpoint URL. Use {'{envId}'} as a placeholder for the environment ID.
						</div>
					</FormGroup>

					<div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
						<SaveButton
							type="submit"
							disabled={isLoading}
							onClick={() => console.log('🔘 [Configuration] Save button clicked')}
						>
							{isLoading ? (
								<>
									<div className="spinner" />
									Saving...
								</>
							) : (
								<>
									<FiSave size={18} style={{ marginRight: '8px' }} />
									Save Global Configuration
								</>
							)}
						</SaveButton>

						<button
							type="button"
							onClick={() => {
								setShowDiscoveryPanel(true);
								showFlowSuccess(
									'🔍 Discovery Panel Opened',
									'Use this tool to automatically discover your PingOne endpoints'
								);
							}}
							style={{
								display: 'inline-flex',
								alignItems: 'center',
								justifyContent: 'center',
								padding: '0.625rem 1.25rem',
								fontSize: '1rem',
								fontWeight: '500',
								color: '#374151',
								backgroundColor: '#f9fafb',
								border: '1px solid #d1d5db',
								borderRadius: '0.375rem',
								cursor: 'pointer',
								transition: 'all 0.2s ease-in-out',
								minWidth: '120px',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = '#f3f4f6';
								e.currentTarget.style.borderColor = '#9ca3af';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = '#f9fafb';
								e.currentTarget.style.borderColor = '#d1d5db';
							}}
						>
							<FiGlobe size={18} style={{ marginRight: '8px' }} />
							OIDC Discovery
						</button>
					</div>
				</form>
			</CollapsibleSection>

			{/* UI Settings Section */}
			<CollapsibleSection
				title="UI Settings"
				subtitle="Configure user interface behavior and modal display options"
				icon="🎛️"
				defaultCollapsed={true}
			>
				<FormGroup>
					<div className="checkbox-container">
						<input
							type="checkbox"
							id="showCredentialsModal"
							name="showCredentialsModal"
							checked={formData.showCredentialsModal}
							onChange={(e) => {
								const isEnabled = e.target.checked;
								console.log('🔧 [Configuration] showCredentialsModal changed:', isEnabled);
								setFormData((prev) => ({
									...prev,
									showCredentialsModal: isEnabled,
								}));
								// Auto-save UI settings immediately
								const flowConfigKey = 'enhanced-flow-authorization-code';
								const existingFlowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || '{}');
								const updatedFlowConfig = {
									...existingFlowConfig,
									showCredentialsModal: isEnabled,
								};
								localStorage.setItem(flowConfigKey, JSON.stringify(updatedFlowConfig));
								console.log('💾 [Configuration] UI settings auto-saved:', updatedFlowConfig);
								showFlowSuccess(
									isEnabled ? '📋 Credentials Modal Enabled' : '🚫 Credentials Modal Disabled',
									isEnabled
										? 'The credentials setup modal will be shown when needed'
										: 'The credentials setup modal will be hidden'
								);
							}}
						/>
						<label htmlFor="showCredentialsModal">
							Show Credentials Modal at Startup
							<div className="form-text">
								Display the credentials setup modal when the application starts (if no credentials
								are found)
							</div>
						</label>
					</div>
				</FormGroup>

				<FormGroup>
					<div className="checkbox-container">
						<input
							type="checkbox"
							id="showSuccessModal"
							name="showSuccessModal"
							checked={formData.showSuccessModal}
							onChange={(e) => {
								const isEnabled = e.target.checked;
								console.log('🔧 [Configuration] showSuccessModal changed:', isEnabled);
								setFormData((prev) => ({
									...prev,
									showSuccessModal: isEnabled,
								}));
								// Auto-save UI settings immediately
								const flowConfigKey = 'enhanced-flow-authorization-code';
								const existingFlowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || '{}');
								const updatedFlowConfig = {
									...existingFlowConfig,
									showSuccessModal: isEnabled,
								};
								localStorage.setItem(flowConfigKey, JSON.stringify(updatedFlowConfig));
								console.log('💾 [Configuration] UI settings auto-saved:', updatedFlowConfig);
								showFlowSuccess(
									isEnabled ? '✅ Success Modal Enabled' : '🚫 Success Modal Disabled',
									isEnabled
										? 'Success messages will be shown in modal dialogs'
										: 'Success messages will use toast notifications only'
								);
							}}
						/>
						<label htmlFor="showSuccessModal">
							Show Success Modal
							<div className="form-text">
								Display a modal with authorization success details when returning from PingOne
							</div>
						</label>
					</div>
				</FormGroup>

				<FormGroup>
					<div className="checkbox-container">
						<input
							type="checkbox"
							id="showAuthRequestModal"
							name="showAuthRequestModal"
							checked={formData.showAuthRequestModal || false}
							onChange={(e) => {
								const isEnabled = e.target.checked;
								console.log('🔧 [Configuration] showAuthRequestModal changed:', isEnabled);
								setFormData((prev) => ({
									...prev,
									showAuthRequestModal: isEnabled,
								}));
								// Auto-save UI settings immediately
								const flowConfigKey = 'enhanced-flow-authorization-code';
								const existingFlowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || '{}');
								const updatedFlowConfig = {
									...existingFlowConfig,
									showAuthRequestModal: isEnabled,
								};
								localStorage.setItem(flowConfigKey, JSON.stringify(updatedFlowConfig));
								console.log('💾 [Configuration] UI settings auto-saved:', updatedFlowConfig);
								showFlowSuccess(
									isEnabled ? '🔍 Auth Request Modal Enabled' : '🚫 Auth Request Modal Disabled',
									isEnabled
										? 'OAuth request details will be shown in a debugging modal'
										: 'OAuth requests will redirect directly without showing debug modal'
								);
							}}
						/>
						<label htmlFor="showAuthRequestModal">
							Show OAuth Authorization Request Modal
							<div className="form-text">
								Display a debugging modal showing all OAuth parameters before redirecting to PingOne
								(useful for debugging)
							</div>
						</label>
					</div>
				</FormGroup>

				<div
					style={{
						marginTop: '1.5rem',
						padding: '1rem',
						backgroundColor: '#e9ecef',
						borderRadius: '0.5rem',
						border: '1px solid #ced4da',
					}}
				>
					<h4 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>💡 UI Settings Info</h4>
					<p style={{ margin: '0', fontSize: '0.9rem', color: '#6c757d' }}>
						These settings control the display of modals throughout the application. Changes are
						saved automatically and will affect all OAuth flows.
					</p>
				</div>
			</CollapsibleSection>

			<CollapsibleSection
				title="OAuth 2.0 Authorization Code Flow"
				subtitle="Configure credentials for pure OAuth 2.0 Authorization Code Flow"
				icon="🔒"
				defaultCollapsed={true}
			>
				<div
					style={{
						padding: '1rem',
						backgroundColor: '#f8f9fa',
						borderRadius: '0.5rem',
						marginBottom: '1rem',
					}}
				>
					<p style={{ margin: '0', fontSize: '0.9rem', color: '#6c757d' }}>
						<strong>Used by:</strong> OAuth 2.0 flows without OIDC features •
						<strong>Features:</strong> Access tokens only, no ID tokens
					</p>
				</div>
				{/* OAuth 2.0 Authorization Code Flow Credentials */}
				<FormGroup>
					<label htmlFor="oauth2-authz-clientId">Client ID (OAuth 2.0)</label>
					<input
						type="text"
						id="oauth2-authz-clientId"
						name="oauth2-authz-clientId"
						placeholder="Client ID for pure OAuth 2.0 flows (no OIDC features)"
						style={{
							width: '100%',
							padding: '0.5rem 0.75rem',
							fontSize: '1rem',
							border: '1px solid #e5e7eb',
							borderRadius: '0.375rem',
						}}
					/>
					<div className="form-text">
						OAuth 2.0 client ID for access token-only flows without ID tokens.
					</div>
				</FormGroup>

				<FormGroup>
					<label htmlFor="oauth2-authz-scopes">Scopes (OAuth 2.0)</label>
					<input
						type="text"
						id="oauth2-authz-scopes"
						name="oauth2-authz-scopes"
						placeholder="profile email api:read"
						defaultValue="profile email"
						style={{
							width: '100%',
							padding: '0.5rem 0.75rem',
							fontSize: '1rem',
							border: '1px solid #e5e7eb',
							borderRadius: '0.375rem',
						}}
					/>
					<div className="form-text">
						OAuth 2.0 scopes (excludes 'openid' - no ID tokens in pure OAuth flows).
					</div>
				</FormGroup>

				<div
					style={{
						marginTop: '1.5rem',
						padding: '1rem',
						backgroundColor: '#f3e5f5',
						borderRadius: '0.5rem',
						border: '1px solid #ce93d8',
					}}
				>
					<h4 style={{ margin: '0 0 0.5rem 0', color: '#7b1fa2' }}>🔒 OAuth 2.0 Features</h4>
					<ul
						style={{
							margin: '0.5rem 0 0 0',
							paddingLeft: '1.5rem',
							fontSize: '0.9rem',
							color: '#8e24aa',
						}}
					>
						<li>Access tokens only (no ID tokens)</li>
						<li>Resource server authorization</li>
						<li>PKCE security support</li>
						<li>Pure OAuth 2.0 specification compliance</li>
					</ul>
				</div>
			</CollapsibleSection>

			<CollapsibleSection
				title="Client Credentials Flow"
				subtitle="Configure credentials for service-to-service authentication"
				icon="🖥️"
				defaultCollapsed={true}
			>
				<div
					style={{
						padding: '1rem',
						backgroundColor: '#f8f9fa',
						borderRadius: '0.5rem',
						marginBottom: '1rem',
					}}
				>
					<p style={{ margin: '0', fontSize: '0.9rem', color: '#6c757d' }}>
						<strong>Used by:</strong> Server-to-server API access •<strong>Features:</strong> No
						user context, machine-to-machine
					</p>
				</div>
				{/* Client Credentials Flow Configuration */}
				<FormGroup>
					<label htmlFor="client-creds-clientId">Client ID (Client Credentials)</label>
					<input
						type="text"
						id="client-creds-clientId"
						name="client-creds-clientId"
						placeholder="Service account client ID for machine-to-machine authentication"
						style={{
							width: '100%',
							padding: '0.5rem 0.75rem',
							fontSize: '1rem',
							border: '1px solid #e5e7eb',
							borderRadius: '0.375rem',
						}}
					/>
					<div className="form-text">
						Client ID for service-to-service authentication without user context.
					</div>
				</FormGroup>

				<FormGroup>
					<label htmlFor="client-creds-clientSecret">Client Secret (Required)</label>
					<input
						type="password"
						id="client-creds-clientSecret"
						name="client-creds-clientSecret"
						placeholder="Service account client secret (required for client credentials flow)"
						style={{
							width: '100%',
							padding: '0.5rem 0.75rem',
							fontSize: '1rem',
							border: '1px solid #e5e7eb',
							borderRadius: '0.375rem',
							fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
						}}
					/>
					<div className="form-text">
						Client secret is required for Client Credentials flow - no user authentication involved.
					</div>
				</FormGroup>

				<FormGroup>
					<label htmlFor="client-creds-scopes">API Scopes</label>
					<input
						type="text"
						id="client-creds-scopes"
						name="client-creds-scopes"
						placeholder="api:read api:write admin:users"
						defaultValue="api:read api:write"
						style={{
							width: '100%',
							padding: '0.5rem 0.75rem',
							fontSize: '1rem',
							border: '1px solid #e5e7eb',
							borderRadius: '0.375rem',
						}}
					/>
					<div className="form-text">
						API scopes for service access. No user-related scopes (profile, email, openid).
					</div>
				</FormGroup>

				<div
					style={{
						marginTop: '1.5rem',
						padding: '1rem',
						backgroundColor: '#e8f5e8',
						borderRadius: '0.5rem',
						border: '1px solid #a5d6a7',
					}}
				>
					<h4 style={{ margin: '0 0 0.5rem 0', color: '#2e7d32' }}>
						🖥️ Service-to-Service Features
					</h4>
					<ul
						style={{
							margin: '0.5rem 0 0 0',
							paddingLeft: '1.5rem',
							fontSize: '0.9rem',
							color: '#388e3c',
						}}
					>
						<li>No user interaction required</li>
						<li>Machine-to-machine authentication</li>
						<li>API access tokens only</li>
						<li>Server-side applications and services</li>
					</ul>
				</div>
			</CollapsibleSection>

			<CollapsibleSection
				title="Device Code Flow"
				subtitle="Configure credentials for device authorization (smart TVs, IoT devices)"
				icon="📱"
				defaultCollapsed={true}
			>
				<div
					style={{
						padding: '1rem',
						backgroundColor: '#f8f9fa',
						borderRadius: '0.5rem',
						marginBottom: '1rem',
					}}
				>
					<p style={{ margin: '0', fontSize: '0.9rem', color: '#6c757d' }}>
						<strong>Used by:</strong> Devices without browsers or limited input •
						<strong>Features:</strong> User code verification, polling for tokens
					</p>
				</div>
				<div
					style={{
						padding: '2rem',
						textAlign: 'center',
						color: '#6c757d',
						backgroundColor: '#f8f9fa',
						borderRadius: '0.5rem',
					}}
				>
					🚧 Flow-specific credential configuration coming soon...
				</div>
			</CollapsibleSection>

			<CollapsibleSection
				title="Implicit Flow"
				subtitle="Configure credentials for browser-based applications (legacy)"
				icon="⚡"
				defaultCollapsed={true}
			>
				<div
					style={{
						padding: '1rem',
						backgroundColor: '#fff3cd',
						borderRadius: '0.5rem',
						marginBottom: '1rem',
						border: '1px solid #ffeaa7',
					}}
				>
					<p style={{ margin: '0', fontSize: '0.9rem', color: '#856404' }}>
						⚠️ <strong>Legacy Flow:</strong> Not recommended for new applications. Use Authorization
						Code Flow with PKCE instead.
					</p>
				</div>
				<div
					style={{
						padding: '2rem',
						textAlign: 'center',
						color: '#6c757d',
						backgroundColor: '#f8f9fa',
						borderRadius: '0.5rem',
					}}
				>
					🚧 Flow-specific credential configuration coming soon...
				</div>
			</CollapsibleSection>

			<CollapsibleSection
				title="Hybrid Flow"
				subtitle="Configure credentials for hybrid OpenID Connect flow"
				icon="💻"
				defaultCollapsed={true}
			>
				<div
					style={{
						padding: '1rem',
						backgroundColor: '#f8f9fa',
						borderRadius: '0.5rem',
						marginBottom: '1rem',
					}}
				>
					<p style={{ margin: '0', fontSize: '0.9rem', color: '#6c757d' }}>
						<strong>Used by:</strong> Complex applications needing both front-end and back-end
						tokens •<strong>Features:</strong> Mixed response types, advanced use cases
					</p>
				</div>
				<div
					style={{
						padding: '2rem',
						textAlign: 'center',
						color: '#6c757d',
						backgroundColor: '#f8f9fa',
						borderRadius: '0.5rem',
					}}
				>
					🚧 Flow-specific credential configuration coming soon...
				</div>
			</CollapsibleSection>

			{saveStatus && (
				<StandardMessage
					type={saveStatus.type === 'danger' ? 'error' : saveStatus.type}
					title={saveStatus.title}
					message={saveStatus.message}
				/>
			)}

			<CollapsibleSection
				title="❓ PingOne Configuration Help"
				subtitle="Step-by-step guide to set up your PingOne application"
				icon="❓"
				defaultCollapsed={true}
			>
				<div>
					<h3 style={{ marginTop: 0 }}>🔧 PingOne Configuration Required</h3>
					<p>To use this OAuth Playground, you need to configure your PingOne environment:</p>

					<div>
						<h4>1. Access PingOne Admin Console</h4>
						<ul>
							<li>
								Navigate to your <strong>PingOne Admin Console</strong>
							</li>
							<li>
								Go to <strong>Applications</strong> → <strong>Applications</strong>
							</li>
							<li>
								Click{' '}
								<strong style={{ fontSize: '1.1rem', fontWeight: 800, color: 'rgb(0, 112, 204)' }}>
									+ Add Application
								</strong>
							</li>
							<li>
								Select <strong>Web Application</strong>
							</li>
						</ul>

						<h4>2. Configure Application Details</h4>
						<ul>
							<li>
								<strong>Application Type:</strong> OIDC Web App
							</li>
							<li>
								<strong>Application Name:</strong>
								<span
									style={{
										fontWeight: 800,
										fontSize: '1rem',
										color: 'rgb(0, 112, 204)',
										marginLeft: '0.5rem',
									}}
								>
									PingOne OAuth/OIDC Playground v{packageJson.version}
								</span>
							</li>
							<li>
								<strong>Description:</strong> Interactive OAuth 2.0 testing application
							</li>
							<li>
								<strong>Hit Save Button</strong>
							</li>
						</ul>

						<h4>3. Configure Authentication</h4>
						<ul>
							<li>
								<strong>Enable Application -</strong> Grey button on top right
							</li>
							<li>
								<strong>Hit Configuration tab</strong>
							</li>
							<li>
								<strong>Hit blue pencil</strong>
								<span
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										justifyContent: 'center',
										width: 20,
										height: 20,
										backgroundColor: 'rgb(0, 112, 204)',
										borderRadius: '50%',
										marginLeft: 8,
										color: 'white',
									}}
									aria-hidden
								>
									✎
								</span>
							</li>
							<li>
								<strong>Response Type:</strong> Code
							</li>
							<li>
								<strong>Grant Type:</strong> Authorization Code
							</li>
							<li>
								<strong>Redirect URIs:</strong>
								<span
									style={{
										fontWeight: 800,
										fontSize: '1rem',
										color: 'rgb(0, 112, 204)',
										marginLeft: '0.5rem',
									}}
								>
									{formData.redirectUri || 'https://localhost:3000/callback'}
								</span>
							</li>
							<li>
								<strong>Token Endpoint Authentication Method:</strong> Client Secret Basic
							</li>
							<li>
								Click <strong style={{ color: 'rgb(0, 112, 204)' }}>Save</strong> to create the
								application
							</li>
						</ul>

						<h4>4. Save and Get Credentials</h4>
						<ul>
							<li>
								See the <strong>Environment ID (Issuer)</strong>
							</li>
							<li>
								See the <strong>Client ID</strong>
							</li>
							<li>
								See the <strong>Client Secret</strong>
								<span style={{ marginLeft: '0.375rem', color: 'rgb(108, 117, 125)' }}>
									(hidden by default)
								</span>
							</li>
						</ul>
					</div>

					<p style={{ marginTop: '1rem' }}>
						<em>
							💡 <strong>Need Help?</strong> Check the PingOne documentation or contact your PingOne
							administrator.
						</em>
					</p>
				</div>
			</CollapsibleSection>

			{/* Discovery Panel */}
			{showDiscoveryPanel && (
				<DiscoveryPanel
					onConfigurationDiscovered={handleConfigurationDiscovered}
					onClose={() => setShowDiscoveryPanel(false)}
				/>
			)}

			{/* Centralized Success/Error Messages */}
			<CentralizedSuccessMessage position="top" />
			<CentralizedSuccessMessage position="bottom" />
		</ConfigurationContainer>
	);
};

export default Configuration;
