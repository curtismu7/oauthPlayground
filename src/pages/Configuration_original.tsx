import { useEffect, useId, useState } from 'react';
import { FiEye, FiEyeOff, FiGlobe, FiRefreshCw, FiSave, FiSettings } from 'react-icons/fi';
import styled from 'styled-components';
import packageJson from '../../package.json';
import CollapsibleSection from '../components/CollapsibleSection';
import DiscoveryPanel from '../components/DiscoveryPanel';
import StandardMessage from '../components/StandardMessage';
import UISettingsModal from '../components/UISettingsModal';
import { useUISettings } from '../contexts/UISettingsContext';
import { showGlobalSuccess } from '../hooks/useNotifications';
import { usePageScroll } from '../hooks/usePageScroll';
import type { OpenIDConfiguration } from '../services/discoveryService';
import { loadFlowCredentials, saveFlowCredentials } from '../services/flowCredentialService';
import { FlowHeader } from '../services/flowHeaderService';
import { credentialManager } from '../utils/credentialManager';
import { getAllFlowCredentialStatuses } from '../utils/flowCredentialChecker';
import { v4ToastManager } from '../utils/v4ToastMessages';

const ConfigurationContainer = styled.div`
	max-width: 1400px;
	margin: 0 auto;
	padding: 1.5rem;
	background: var(--color-background, white);
	color: var(--color-text-primary, #1e293b);
	min-height: 100vh;
`;
const _PageHeader = styled.div`
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 600;
    color: var(--color-text-primary, #1e293b);
    margin-bottom: 0.5rem;
  }
  
  p {
    color: var(--color-text-secondary, #64748b);
    font-size: 1.1rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--color-text-primary, #1e293b);
  }
  
  input, select, textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid var(--color-border, #e2e8f0);
    border-radius: 0.375rem;
    background: var(--color-background, white);
    color: var(--color-text-primary, #1e293b);
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary, #3b82f6);
      box-shadow: 0 0 0 3px var(--color-primary-bg, #dbeafe);
    }
    
    &::placeholder {
      color: var(--color-text-muted, #94a3b8);
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
    color: var(--color-text-secondary, #64748b);
  }
  
  /* Custom checkbox styling */
  input[type="checkbox"] {
    width: auto !important;
    margin-right: 0.5rem;
    appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid var(--color-border, #e2e8f0);
    border-radius: 0.25rem;
    background-color: var(--color-background, white);
    cursor: pointer;
    position: relative;
    transition: all 0.15s ease-in-out;
    
    &:checked {
      background-color: var(--color-primary, #3b82f6);
      border-color: var(--color-primary, #3b82f6);
    }
    
    &:checked::after {
      content: '';
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
  background-color: #10b981;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-width: 120px;
  
  &:hover:not(:disabled) {
    background-color: #059669;
  }
  
  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    background-color: #10b981;
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

	// UI Settings context
	const { settings: uiSettings, updateSetting, saveSettings } = useUISettings();

	const formIds = {
		configForm: useId(),
		environmentId: useId(),
		clientId: useId(),
		clientSecret: useId(),
		redirectUri: useId(),
		scopes: useId(),
		responseType: useId(),
		enablePkce: useId(),
		codeChallengeMethod: useId(),
		enableOidc: useId(),
		useGlobalConfig: useId(),
		authEndpoint: useId(),
		tokenEndpoint: useId(),
		userInfoEndpoint: useId(),
		showCredentialsModal: useId(),
		showSuccessModal: useId(),
		showAuthRequestModal: useId(),
		showFlowDebugConsole: useId(),
		// New UI Settings IDs
		darkMode: useId(),
		fontSize: useId(),
		colorScheme: useId(),
		autoAdvanceSteps: useId(),
		collapsibleDefaultState: useId(),
		showRequestResponseDetails: useId(),
		copyButtonBehavior: useId(),
		errorDetailLevel: useId(),
		consoleLoggingLevel: useId(),
		defaultPageOnLoad: useId(),
		hideCompletedFlows: useId(),
		quickActionsVisibility: useId(),
	} as const satisfies Record<
		| 'configForm'
		| 'environmentId'
		| 'clientId'
		| 'clientSecret'
		| 'redirectUri'
		| 'scopes'
		| 'responseType'
		| 'enablePkce'
		| 'codeChallengeMethod'
		| 'enableOidc'
		| 'useGlobalConfig'
		| 'authEndpoint'
		| 'tokenEndpoint'
		| 'userInfoEndpoint'
		| 'showCredentialsModal'
		| 'showSuccessModal'
		| 'showAuthRequestModal'
		| 'showFlowDebugConsole'
		| 'darkMode'
		| 'fontSize'
		| 'colorScheme'
		| 'autoAdvanceSteps'
		| 'collapsibleDefaultState'
		| 'showRequestResponseDetails'
		| 'copyButtonBehavior'
		| 'errorDetailLevel'
		| 'consoleLoggingLevel'
		| 'defaultPageOnLoad'
		| 'hideCompletedFlows'
		| 'quickActionsVisibility',
		string
	>;

	const [initialLoading, setInitialLoading] = useState(true);
	const [flowCredentialStatuses, setFlowCredentialStatuses] = useState(
		getAllFlowCredentialStatuses()
	);

	// UI Settings modal state
	const [isUISettingsModalOpen, setIsUISettingsModalOpen] = useState(false);

	// Helper function to get status for a specific flow
	const [formData, setFormData] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: `${window.location.origin}/callback`,
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
		showFlowDebugConsole: true,
		// New UI Settings
		darkMode: false,
		fontSize: 'medium',
		colorScheme: 'blue',
		autoAdvanceSteps: false,
		collapsibleDefaultState: 'collapsed',
		showRequestResponseDetails: false,
		copyButtonBehavior: 'confirmation',
		errorDetailLevel: 'basic',
		consoleLoggingLevel: 'normal',
		defaultPageOnLoad: 'dashboard',
		hideCompletedFlows: false,
		quickActionsVisibility: true,
		showPollingPrompt: true,
		showApiCallExamples: true,
	});

	useEffect(() => {
		setFormData((prev) => ({
			...prev,
			showCredentialsModal: uiSettings.showCredentialsModal,
			showSuccessModal: uiSettings.showSuccessModal,
			showAuthRequestModal: uiSettings.showAuthRequestModal,
			showFlowDebugConsole: uiSettings.showFlowDebugConsole,
			darkMode: uiSettings.darkMode,
			fontSize: uiSettings.fontSize,
			colorScheme: uiSettings.colorScheme,
			autoAdvanceSteps: uiSettings.autoAdvanceSteps,
			collapsibleDefaultState: uiSettings.collapsibleDefaultState,
			showRequestResponseDetails: uiSettings.showRequestResponseDetails,
			copyButtonBehavior: uiSettings.copyButtonBehavior,
			errorDetailLevel: uiSettings.errorDetailLevel,
			consoleLoggingLevel: uiSettings.consoleLoggingLevel,
			defaultPageOnLoad: uiSettings.defaultPageOnLoad,
			hideCompletedFlows: uiSettings.hideCompletedFlows,
			quickActionsVisibility: uiSettings.quickActionsVisibility,
			showApiCallExamples: uiSettings.showApiCallExamples,
			showPollingPrompt: uiSettings.showPollingPrompt,
		}));
	}, [uiSettings]);

	// Helper function to get status for a specific flow
	const getFlowStatus = (flowType: string) => {
		return flowCredentialStatuses.find((status) => status.flowType === flowType);
	};

	// Refresh flow credential statuses when form data changes
	useEffect(() => {
		setFlowCredentialStatuses(getAllFlowCredentialStatuses());
	}, []);

	const [errors, setErrors] = useState<Record<string, string | null>>({});
	const [isLoading, setIsLoading] = useState(false);
	const [saveStatus, setSaveStatus] = useState<{
		type: 'success' | 'error' | 'info' | 'danger';
		title: string;
		message: string;
	} | null>(null);
	const [showClientSecret, setShowClientSecret] = useState(false);
	const [showDiscoveryPanel, setShowDiscoveryPanel] = useState(false);

	// Load saved configuration using V7 standardized system
	useEffect(() => {
		const loadConfigurationV7 = async () => {
			console.log(' [Configuration] Loading configuration using V7 standardized system...');

			try {
				// Try V7 FlowCredentialService first (most recent)
				const v7Credentials = await loadFlowCredentials({
					flowKey: 'configuration-page',
					defaultCredentials: {
						environmentId: '',
						clientId: '',
						clientSecret: '',
						redirectUri: `${window.location.origin}/callback`,
						scope: 'openid profile email',
						scopes: 'openid profile email',
						loginHint: '',
						postLogoutRedirectUri: '',
						responseType: 'code',
						grantType: 'authorization_code',
						issuerUrl: '',
						authorizationEndpoint: '',
						tokenEndpoint: '',
						userInfoEndpoint: '',
						clientAuthMethod: 'client_secret_post',
						tokenEndpointAuthMethod: 'client_secret_post',
					},
				});

				console.log(' [Configuration] V7 FlowCredentialService result:', v7Credentials);

				if (v7Credentials.credentials?.clientId && v7Credentials.credentials?.environmentId) {
					console.log(' [Configuration] Using V7 FlowCredentialService credentials');
					setFormData((prev) => ({
						...prev,
						environmentId: v7Credentials.credentials.environmentId || '',
						clientId: v7Credentials.credentials.clientId || '',
						clientSecret: v7Credentials.credentials.clientSecret || '',
						redirectUri: v7Credentials.credentials.redirectUri || prev.redirectUri,
						scopes: v7Credentials.credentials.scopes || prev.scopes,
						authEndpoint: v7Credentials.credentials.authorizationEndpoint || prev.authEndpoint,
						tokenEndpoint: v7Credentials.credentials.tokenEndpoint || prev.tokenEndpoint,
						userInfoEndpoint: v7Credentials.credentials.userInfoEndpoint || prev.userInfoEndpoint,
						endSessionEndpoint: prev.endSessionEndpoint,
					}));
					return;
				}
			} catch (v7Error) {
				console.log(' [Configuration] V7 FlowCredentialService not available:', v7Error);
			}

			// Fallback to legacy credential manager
			console.log(' [Configuration] Loading from legacy credential manager...');
			const configCredentials = credentialManager.loadConfigCredentials();

			console.log(' [Configuration] Loading configuration, config credentials:', configCredentials);

			if (configCredentials && (configCredentials.environmentId || configCredentials.clientId)) {
				console.log(' [Configuration] Loading from config credentials');
				setFormData((prev) => ({
					...prev,
					environmentId: configCredentials.environmentId || '',
					clientId: configCredentials.clientId || '',
					clientSecret: configCredentials.clientSecret || '',
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
						console.log(' [Configuration] Loading from legacy pingone_config:', parsedConfig);

						// Check if the client secret is the problematic hardcoded one
						if (
							parsedConfig.clientSecret ===
							'0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a'
						) {
							console.log(' [Configuration] Clearing problematic hardcoded client secret');
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
							console.log(' [Configuration] Migrating legacy credentials to config credentials');
							credentialManager.saveConfigCredentials({
								environmentId: parsedConfig.environmentId,
								clientId: parsedConfig.clientId,
								clientSecret: parsedConfig.clientSecret || '',
								redirectUri: parsedConfig.redirectUri || `${window.location.origin}/callback`,
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
							console.log(' [Configuration] Loading from login_credentials:', parsedLoginCreds);

							setFormData((prev) => ({
								...prev,
								...parsedLoginCreds,
							}));

							// Migrate to new credential manager if we have valid credentials
							if (parsedLoginCreds.environmentId && parsedLoginCreds.clientId) {
								console.log(' [Configuration] Migrating login credentials to config credentials');
								credentialManager.saveConfigCredentials({
									environmentId: parsedLoginCreds.environmentId,
									clientId: parsedLoginCreds.clientId,
									clientSecret: parsedLoginCreds.clientSecret || '',
									redirectUri: parsedLoginCreds.redirectUri || `${window.location.origin}/callback`,
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
				flowConfig.showAuthRequestModal !== undefined ||
				flowConfig.showFlowDebugConsole !== undefined
			) {
				console.log(' [Configuration] Loading UI settings from flow config:', flowConfig);
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
					showFlowDebugConsole:
						flowConfig.showFlowDebugConsole !== undefined
							? flowConfig.showFlowDebugConsole
							: prev.showFlowDebugConsole,
				}));
			}
		};

		loadConfigurationV7();

		// Show spinner for 500ms
		setTimeout(() => setInitialLoading(false), 500);
	}, []);

	// Listen for credential changes from login page
	useEffect(() => {
		const handleCredentialChange = () => {
			console.log(
				' [Configuration] Credentials updated from login page, refreshing configuration...'
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

		// Listen for UI settings changes from other components
		const handleUISettingsChange = (event: CustomEvent) => {
			const { showAuthRequestModal } = event.detail || {};
			if (showAuthRequestModal !== undefined) {
				console.log(' [Configuration] UI settings changed from external component:', {
					showAuthRequestModal,
				});
				setFormData((prev) => ({
					...prev,
					showAuthRequestModal,
				}));
			}
		};

		window.addEventListener('uiSettingsChanged', handleUISettingsChange as EventListener);

		return () => {
			window.removeEventListener('permanent-credentials-changed', handleCredentialChange);
			window.removeEventListener('pingone-config-changed', handleCredentialChange);
			window.removeEventListener('uiSettingsChanged', handleUISettingsChange as EventListener);
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
		console.log(' [Configuration] Validating form with data:', formData);
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

		console.log(' [Configuration] Validation result:', {
			isValid,
			errors: newErrors,
		});
		setErrors(newErrors);
		return isValid;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		console.log(' [Configuration] Form submitted');

		if (!validateForm()) {
			console.log(' [Configuration] Form validation failed');
			return;
		}

		console.log(' [Configuration] Form validation passed, starting save...');
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

			console.log(' [Configuration] Saving config using V7 standardized system:', configToSave);

			// Save using V7 standardized storage system
			const v7Credentials = {
				environmentId: configToSave.environmentId,
				clientId: configToSave.clientId,
				clientSecret: configToSave.clientSecret,
				redirectUri: configToSave.redirectUri,
				scope: configToSave.scopes || 'openid profile email',
				scopes: configToSave.scopes || 'openid profile email',
				loginHint: '',
				postLogoutRedirectUri: '',
				responseType: 'code',
				grantType: 'authorization_code',
				issuerUrl: '',
				authorizationEndpoint: configToSave.authEndpoint,
				tokenEndpoint: configToSave.tokenEndpoint,
				userInfoEndpoint: configToSave.userInfoEndpoint,
				clientAuthMethod: 'client_secret_post',
				tokenEndpointAuthMethod: 'client_secret_post',
			};

			const v7Success = await saveFlowCredentials(
				'configuration-page',
				v7Credentials,
				undefined, // flowConfig
				undefined, // additionalState
				{ showToast: false } // We'll show our own success message
			);

			if (!v7Success) {
				throw new Error('Failed to save credentials using V7 standardized system');
			}

			// Also save to legacy credential manager for backward compatibility
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
				showCredentialsModal: uiSettings.showCredentialsModal,
				showSuccessModal: uiSettings.showSuccessModal,
				showAuthRequestModal: uiSettings.showAuthRequestModal,
			};
			localStorage.setItem(flowConfigKey, JSON.stringify(updatedFlowConfig));
			console.log(' [Configuration] UI settings saved to flow config:', updatedFlowConfig);

			await saveSettings();

			// Dispatch custom event to notify other components that config has changed
			console.log(' [Configuration] Dispatching configuration change events...');
			window.dispatchEvent(new CustomEvent('pingone-config-changed'));
			window.dispatchEvent(new CustomEvent('permanent-credentials-changed'));
			console.log(' [Configuration] Configuration change events dispatched');

			console.log(' [Configuration] Config saved successfully:', {
				configSuccess,
			});

			setSaveStatus({
				type: 'success',
				title: 'PingOne Credentials saved',
				message:
					'Your PingOne credentials have been saved successfully using V7 standardized storage.',
			});

			// Show centralized success message using v4ToastManager
			v4ToastManager.showSaveSuccess();

			console.log(' [Configuration] Success status set');
		} catch (error) {
			console.error(' [Configuration] Failed to save configuration:', error);

			setSaveStatus({
				type: 'danger',
				title: 'Error',
				message: 'Failed to save PingOne credentials. Please try again.',
			});

			// Show centralized error message using v4ToastManager
			v4ToastManager.showSaveError(
				error instanceof Error ? error.message : 'Unknown error occurred'
			);
		} finally {
			console.log(' [Configuration] Setting isLoading to false');
			setIsLoading(false);
		}
	};

	// Clear success message after 5 seconds when saveStatus changes
	useEffect(() => {
		if (saveStatus?.type === 'success') {
			const timer = setTimeout(() => {
				console.log(' [Configuration] Clearing success message after 5 seconds');
				setSaveStatus(null);
			}, 5000);

			return () => clearTimeout(timer);
		}
	}, [saveStatus]);

	// Debug state changes
	useEffect(() => {
		console.log(
			' [Configuration] State changed - isLoading:',
			isLoading,
			'saveStatus:',
			saveStatus
		);
	}, [isLoading, saveStatus]);

	// Handle discovery panel configuration
	const handleConfigurationDiscovered = (config: OpenIDConfiguration, environmentId: string) => {
		console.log(' [Configuration] Configuration discovered:', config);

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

		// Show centralized success message using v4ToastManager
		v4ToastManager.showSuccess('saveConfigurationSuccess');
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
			<FlowHeader flowType="configuration" />

			<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
				<button
					type="button"
					onClick={() => setIsUISettingsModalOpen(true)}
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: '0.5rem',
						padding: '0.75rem 1rem',
						background: 'var(--color-primary, #3b82f6)',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						fontSize: '0.875rem',
						fontWeight: '500',
						cursor: 'pointer',
						transition: 'all 0.2s ease',
						boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = 'var(--color-primary-dark, #2563eb)';
						e.currentTarget.style.transform = 'translateY(-1px)';
						e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = 'var(--color-primary, #3b82f6)';
						e.currentTarget.style.transform = 'translateY(0)';
						e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
					}}
				>
					<FiSettings size={16} />
					UI Settings
				</button>
			</div>

			{/* Flow Credential Status Table */}
			<CollapsibleSection
				title="Flow Credential Status Overview"
				subtitle="Comprehensive view of all OAuth and OIDC flow credential status"
				defaultCollapsed={true}
				headerActions={
					<button
						type="button"
						onClick={() => {
							setFlowCredentialStatuses(getAllFlowCredentialStatuses());
							v4ToastManager.showSuccess('saveConfigurationSuccess');
						}}
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: '0.5rem',
							padding: '0.5rem 1rem',
							background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
							color: 'white',
							border: 'none',
							borderRadius: '0.5rem',
							fontSize: '0.875rem',
							fontWeight: '600',
							cursor: 'pointer',
							transition: 'all 0.2s ease',
							boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background =
								'linear-gradient(135deg, #059669 0%, #047857 100%)';
							e.currentTarget.style.transform = 'translateY(-1px)';
							e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background =
								'linear-gradient(135deg, #10b981 0%, #059669 100%)';
							e.currentTarget.style.transform = 'translateY(0)';
							e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
						}}
					>
						<FiRefreshCw size={16} />
						Refresh
					</button>
				}
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
						<table
							style={{
								width: '100%',
								borderCollapse: 'collapse',
								fontSize: '0.875rem',
							}}
						>
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
									<td
										style={{
											padding: '0.75rem',
											borderBottom: '1px solid #fecaca',
										}}
									>
										OAuth 2.0 Authorization Code (V3)
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
									<td
										style={{
											padding: '0.75rem',
											borderBottom: '1px solid #fecaca',
										}}
									>
										OAuth 2.0 Implicit V3
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
											{getFlowStatus('oauth2-implicit-v3')?.lastExecutionTime || 'Never'}
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
												backgroundColor: getFlowStatus('oauth2-implicit-v3')?.hasCredentials
													? '#dcfce7'
													: '#fee2e2',
												color: getFlowStatus('oauth2-implicit-v3')?.hasCredentials
													? '#166534'
													: '#dc2626',
											}}
										>
											{getFlowStatus('oauth2-implicit-v3')?.hasCredentials
												? 'Configured'
												: 'Missing'}
										</span>
									</td>
								</tr>
								<tr>
									<td
										style={{
											padding: '0.75rem',
											borderBottom: '1px solid #fecaca',
										}}
									>
										OAuth2 Client Credentials V3
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
											{getFlowStatus('oauth2-client-credentials-v3')?.lastExecutionTime || 'Never'}
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
												backgroundColor: getFlowStatus('oauth2-client-credentials-v3')
													?.hasCredentials
													? '#dcfce7'
													: '#fee2e2',
												color: getFlowStatus('oauth2-client-credentials-v3')?.hasCredentials
													? '#166534'
													: '#dc2626',
											}}
										>
											{getFlowStatus('oauth2-client-credentials-v3')?.hasCredentials
												? 'Configured'
												: 'Missing'}
										</span>
									</td>
								</tr>
								<tr>
									<td style={{ padding: '0.75rem' }}>OAuth 2.0 Resource Owner Password</td>
									<td style={{ padding: '0.75rem', textAlign: 'center' }}>
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
											{getFlowStatus('oauth-resource-owner-password')?.lastExecutionTime || 'Never'}
										</span>
									</td>
									<td style={{ padding: '0.75rem', textAlign: 'center' }}>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: getFlowStatus('oauth-resource-owner-password')
													?.hasCredentials
													? '#dcfce7'
													: '#fee2e2',
												color: getFlowStatus('oauth-resource-owner-password')?.hasCredentials
													? '#166534'
													: '#dc2626',
											}}
										>
											{getFlowStatus('oauth-resource-owner-password')?.hasCredentials
												? 'Configured'
												: 'Missing'}
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
							color: '#16a34a',
						}}
					>
						OpenID Connect Flows
					</h5>
					<div
						style={{
							backgroundColor: '#faf5ff',
							border: '1px solid #bbf7d0',
							borderRadius: '0.5rem',
							overflow: 'hidden',
						}}
					>
						<table
							style={{
								width: '100%',
								borderCollapse: 'collapse',
								fontSize: '0.875rem',
							}}
						>
							<thead>
								<tr style={{ backgroundColor: '#f0fdf4' }}>
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
										Last Execution Time
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
									<td
										style={{
											padding: '0.75rem',
											borderBottom: '1px solid #bbf7d0',
										}}
									>
										OIDC Authorization Code (V3)
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #bbf7d0',
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
											{getFlowStatus('enhanced-authorization-code-v3')?.lastExecutionTime ||
												'Never'}
										</span>
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #bbf7d0',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: getFlowStatus('enhanced-authorization-code-v3')
													?.hasCredentials
													? '#dcfce7'
													: '#fee2e2',
												color: getFlowStatus('enhanced-authorization-code-v3')?.hasCredentials
													? '#166534'
													: '#dc2626',
											}}
										>
											{getFlowStatus('enhanced-authorization-code-v3')?.hasCredentials
												? 'Configured'
												: 'Missing'}
										</span>
									</td>
								</tr>
								<tr>
									<td
										style={{
											padding: '0.75rem',
											borderBottom: '1px solid #bbf7d0',
										}}
									>
										OIDC Implicit V3
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #bbf7d0',
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
											{getFlowStatus('oidc-implicit-v3')?.lastExecutionTime || 'Never'}
										</span>
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #bbf7d0',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: getFlowStatus('oidc-implicit-v3')?.hasCredentials
													? '#dcfce7'
													: '#fee2e2',
												color: getFlowStatus('oidc-implicit-v3')?.hasCredentials
													? '#166534'
													: '#dc2626',
											}}
										>
											{getFlowStatus('oidc-implicit-v3')?.hasCredentials ? 'Configured' : 'Missing'}
										</span>
									</td>
								</tr>
								<tr>
									<td
										style={{
											padding: '0.75rem',
											borderBottom: '1px solid #bbf7d0',
										}}
									>
										OIDC Hybrid V3
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #bbf7d0',
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
											{getFlowStatus('oidc-hybrid-v3')?.lastExecutionTime || 'Never'}
										</span>
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #bbf7d0',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: getFlowStatus('oidc-hybrid-v3')?.hasCredentials
													? '#dcfce7'
													: '#fee2e2',
												color: getFlowStatus('oidc-hybrid-v3')?.hasCredentials
													? '#166534'
													: '#dc2626',
											}}
										>
											{getFlowStatus('oidc-hybrid-v3')?.hasCredentials ? 'Configured' : 'Missing'}
										</span>
									</td>
								</tr>
								<tr>
									<td
										style={{
											padding: '0.75rem',
											borderBottom: '1px solid #bbf7d0',
										}}
									>
										OIDC Client Credentials V3
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #bbf7d0',
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
											{getFlowStatus('oidc-client-credentials-v3')?.lastExecutionTime || 'Never'}
										</span>
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #bbf7d0',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: getFlowStatus('oidc-client-credentials-v3')?.hasCredentials
													? '#dcfce7'
													: '#fee2e2',
												color: getFlowStatus('oidc-client-credentials-v3')?.hasCredentials
													? '#166534'
													: '#dc2626',
											}}
										>
											{getFlowStatus('oidc-client-credentials-v3')?.hasCredentials
												? 'Configured'
												: 'Missing'}
										</span>
									</td>
								</tr>
								<tr>
									<td
										style={{
											padding: '0.75rem',
											borderBottom: '1px solid #bbf7d0',
										}}
									>
										OIDC Device Code V3
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #bbf7d0',
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
											{getFlowStatus('device-code-oidc')?.lastExecutionTime || 'Never'}
										</span>
									</td>
									<td
										style={{
											padding: '0.75rem',
											textAlign: 'center',
											borderBottom: '1px solid #bbf7d0',
										}}
									>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: getFlowStatus('device-code-oidc')?.hasCredentials
													? '#dcfce7'
													: '#fee2e2',
												color: getFlowStatus('device-code-oidc')?.hasCredentials
													? '#166534'
													: '#dc2626',
											}}
										>
											{getFlowStatus('device-code-oidc')?.hasCredentials ? 'Configured' : 'Missing'}
										</span>
									</td>
								</tr>
								<tr>
									<td style={{ padding: '0.75rem' }}>OIDC Resource Owner Password</td>
									<td style={{ padding: '0.75rem', textAlign: 'center' }}>
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
											{getFlowStatus('oidc-resource-owner-password')?.lastExecutionTime || 'Never'}
										</span>
									</td>
									<td style={{ padding: '0.75rem', textAlign: 'center' }}>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: getFlowStatus('oidc-resource-owner-password')
													?.hasCredentials
													? '#dcfce7'
													: '#fee2e2',
												color: getFlowStatus('oidc-resource-owner-password')?.hasCredentials
													? '#166534'
													: '#dc2626',
											}}
										>
											{getFlowStatus('oidc-resource-owner-password')?.hasCredentials
												? 'Configured'
												: 'Missing'}
										</span>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				{/* PingOne Flows Table */}
				<div>
					<h5
						style={{
							fontSize: '0.875rem',
							fontWeight: '600',
							marginBottom: '0.75rem',
							color: '#059669',
						}}
					>
						PingOne Flows
					</h5>
					<div
						style={{
							backgroundColor: '#f0fdf4',
							border: '1px solid #bbf7d0',
							borderRadius: '0.5rem',
							overflow: 'hidden',
						}}
					>
						<table
							style={{
								width: '100%',
								borderCollapse: 'collapse',
								fontSize: '0.875rem',
							}}
						>
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
										Last Execution Time
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
									<td style={{ padding: '0.75rem' }}>PingOne Worker Token V3</td>
									<td style={{ padding: '0.75rem', textAlign: 'center' }}>
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
											{getFlowStatus('worker-token-v3')?.lastExecutionTime || 'Never'}
										</span>
									</td>
									<td style={{ padding: '0.75rem', textAlign: 'center' }}>
										<span
											style={{
												padding: '0.25rem 0.5rem',
												borderRadius: '0.375rem',
												fontSize: '0.75rem',
												fontWeight: '500',
												backgroundColor: getFlowStatus('worker-token-v3')?.hasCredentials
													? '#dcfce7'
													: '#fee2e2',
												color: getFlowStatus('worker-token-v3')?.hasCredentials
													? '#166534'
													: '#dc2626',
											}}
										>
											{getFlowStatus('worker-token-v3')?.hasCredentials ? 'Configured' : 'Missing'}
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
				defaultCollapsed={false}
			>
				<form
					onSubmit={(e) => {
						console.log(' [Configuration] Form onSubmit triggered');
						handleSubmit(e);
					}}
					id={formIds.configForm}
					onKeyDown={(e) => console.log(' [Configuration] Form keydown:', e.key)}
				>
					<FormGroup>
						<label htmlFor={formIds.environmentId} htmlFor="environmentid">
							Environment ID
						</label>
						<input
							type="text"
							id={formIds.environmentId}
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
						<label htmlFor={formIds.clientId} htmlFor="clientid">
							Client ID
						</label>
						<input
							type="text"
							id={formIds.clientId}
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
						<label htmlFor={formIds.clientSecret} htmlFor="clientsecretoptional">
							Client Secret (Optional)
						</label>
						<div style={{ position: 'relative' }}>
							<input
								type={showClientSecret ? 'text' : 'password'}
								id={formIds.clientSecret}
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
									v4ToastManager.showSuccess(
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
						<label htmlFor={formIds.redirectUri} htmlFor="redirecturi">
							Redirect URI
						</label>
						<input
							type="url"
							id={formIds.redirectUri}
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
						<label htmlFor={formIds.scopes} htmlFor="scopes">
							Scopes
						</label>
						<input
							type="text"
							id={formIds.scopes}
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
						<label htmlFor={formIds.responseType} htmlFor="responsetype">
							Response Type
						</label>
						<select
							id={formIds.responseType}
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
								id={formIds.enablePkce}
								name="enablePKCE"
								checked={formData.enablePKCE}
								onChange={(e) => {
									const isEnabled = e.target.checked;
									setFormData((prev) => ({ ...prev, enablePKCE: isEnabled }));
									showGlobalSuccess(
										isEnabled ? ' PKCE Enabled' : ' PKCE Disabled',
										isEnabled
											? 'Proof Key for Code Exchange is now enabled for enhanced security'
											: 'PKCE has been disabled - consider enabling for better security'
									);
								}}
							/>
							<label htmlFor={formIds.enablePkce} htmlFor="enablepkceproofkeyforcodeexchange">
								Enable PKCE (Proof Key for Code Exchange)
							</label>
						</div>
						<div className="form-text">
							PKCE adds security by preventing authorization code interception attacks. Recommended
							for all flows.
						</div>
					</FormGroup>

					{formData.enablePKCE && (
						<FormGroup>
							<label htmlFor={formIds.codeChallengeMethod} htmlFor="codechallengemethod">
								Code Challenge Method
							</label>
							<select
								id={formIds.codeChallengeMethod}
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
								id={formIds.enableOidc}
								name="enableOIDC"
								checked={formData.enableOIDC}
								onChange={(e) => {
									const isEnabled = e.target.checked;
									setFormData((prev) => ({ ...prev, enableOIDC: isEnabled }));
									showGlobalSuccess(
										isEnabled ? ' OIDC Enabled' : ' OIDC Disabled',
										isEnabled
											? 'OpenID Connect is now enabled for identity authentication'
											: 'OIDC has been disabled - you will use OAuth 2.0 only'
									);
								}}
							/>
							<label htmlFor={formIds.enableOidc} htmlFor="enableopenidconnectoidc">
								Enable OpenID Connect (OIDC)
							</label>
						</div>
						<div className="form-text">
							Enable OpenID Connect features like ID tokens and user information endpoints.
						</div>
					</FormGroup>

					<FormGroup>
						<div className="checkbox-container">
							<input
								type="checkbox"
								id={formIds.useGlobalConfig}
								name="useGlobalConfig"
								checked={formData.useGlobalConfig || false}
								onChange={(e) => {
									const isEnabled = e.target.checked;
									setFormData((prev) => ({
										...prev,
										useGlobalConfig: isEnabled,
									}));
									showGlobalSuccess(
										isEnabled ? ' Using Global Config' : ' Using Flow-Specific Config',
										isEnabled
											? 'This flow will use the global configuration settings'
											: 'This flow will use its own specific configuration'
									);
								}}
							/>
							<label htmlFor={formIds.useGlobalConfig} htmlFor="useglobalconfigforcredentials">
								Use global config for credentials
							</label>
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
						<label htmlFor={formIds.authEndpoint} htmlFor="authorizationendpoint">
							Authorization Endpoint
						</label>
						<input
							type="url"
							id={formIds.authEndpoint}
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
						<label htmlFor={formIds.tokenEndpoint} htmlFor="tokenendpoint">
							Token Endpoint
						</label>
						<input
							type="url"
							id={formIds.tokenEndpoint}
							name="tokenEndpoint"
							value={formData.tokenEndpoint}
							onChange={handleChange}
						/>
						<div className="form-text">
							The token endpoint URL. Use {'{envId}'} as a placeholder for the environment ID.
						</div>
					</FormGroup>

					<FormGroup>
						<label htmlFor={formIds.userInfoEndpoint} htmlFor="userinfoendpoint">
							UserInfo Endpoint
						</label>
						<input
							type="url"
							id={formIds.userInfoEndpoint}
							name="userInfoEndpoint"
							value={formData.userInfoEndpoint}
							onChange={handleChange}
						/>
						<div className="form-text">
							The UserInfo endpoint URL. Use {'{envId}'} as a placeholder for the environment ID.
						</div>
					</FormGroup>

					<div
						style={{
							marginTop: '2rem',
							display: 'flex',
							gap: '1rem',
							alignItems: 'center',
						}}
					>
						<SaveButton
							type="submit"
							disabled={isLoading}
							onClick={() => console.log(' [Configuration] Save button clicked')}
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
								v4ToastManager.showSuccess(
									'Discovery panel opened - use this tool to automatically discover your PingOne endpoints'
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
				defaultCollapsed={true}
			>
				<FormGroup>
					<div className="checkbox-container">
						<input
							type="checkbox"
							id={formIds.showCredentialsModal}
							name="showCredentialsModal"
							checked={uiSettings.showCredentialsModal}
							onChange={(e) => {
								const isEnabled = e.target.checked;
								console.log(' [Configuration] showCredentialsModal changed:', isEnabled);
								updateSetting('showCredentialsModal', isEnabled);
								showGlobalSuccess(
									isEnabled ? 'Credentials modal enabled' : 'Credentials modal disabled',
									{
										description: isEnabled
											? 'The credentials setup modal will be shown when needed'
											: 'The credentials setup modal will be hidden',
									}
								);
							}}
						/>
						<label htmlFor={formIds.showCredentialsModal}>
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
							id={formIds.showSuccessModal}
							name="showSuccessModal"
							checked={formData.showSuccessModal}
							onChange={(e) => {
								const isEnabled = e.target.checked;
								setFormData((prev) => ({ ...prev, showSuccessModal: isEnabled }));
								showGlobalSuccess(isEnabled ? 'Success modal enabled' : 'Success modal disabled', {
									description: isEnabled
										? 'Success messages will be shown in a modal'
										: 'Success messages will be shown inline',
								});
							}}
						/>
						<label htmlFor={formIds.showSuccessModal}>
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
							id={formIds.showAuthRequestModal}
							name="showAuthRequestModal"
							checked={formData.showAuthRequestModal || false}
							onChange={(e) => {
								const isEnabled = e.target.checked;
								console.log(' [Configuration] showAuthRequestModal changed:', isEnabled);
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
								console.log(' [Configuration] UI settings auto-saved:', updatedFlowConfig);
								showGlobalSuccess(
									isEnabled ? ' Auth Request Modal Enabled' : ' Auth Request Modal Disabled',
									{
										description: isEnabled
											? 'OAuth request details will be shown in a debugging modal'
											: 'OAuth requests will redirect directly without showing debug modal',
									}
								);
							}}
						/>
						<label htmlFor={formIds.showAuthRequestModal}>
							Show OAuth Authorization Request Modal
							<div className="form-text">
								Display a debugging modal showing all OAuth parameters before redirecting to PingOne
								(useful for debugging)
							</div>
						</label>
					</div>
				</FormGroup>

				<FormGroup>
					<div className="checkbox-container">
						<input
							type="checkbox"
							id={formIds.showFlowDebugConsole}
							name="showFlowDebugConsole"
							checked={formData.showFlowDebugConsole}
							onChange={(e) => {
								const isEnabled = e.target.checked;
								console.log(' [Configuration] showFlowDebugConsole changed:', isEnabled);
								setFormData((prev) => ({
									...prev,
									showFlowDebugConsole: isEnabled,
								}));
								// Auto-save UI settings immediately
								const flowConfigKey = 'enhanced-flow-authorization-code';
								const existingFlowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || '{}');
								const updatedFlowConfig = {
									...existingFlowConfig,
									showFlowDebugConsole: isEnabled,
								};
								localStorage.setItem(flowConfigKey, JSON.stringify(updatedFlowConfig));
								console.log(' [Configuration] UI settings auto-saved:', updatedFlowConfig);

								// Dispatch custom event to notify other components of the change
								window.dispatchEvent(
									new CustomEvent('uiSettingsChanged', {
										detail: { showFlowDebugConsole: isEnabled },
									})
								);

								showGlobalSuccess(
									isEnabled ? ' Flow Debug Console Enabled' : ' Flow Debug Console Disabled',
									{
										description: isEnabled
											? 'The Flow Debug Console will be visible on all flow pages'
											: 'The Flow Debug Console will be hidden on all flow pages',
									}
								);
							}}
						/>
						<label htmlFor={formIds.showFlowDebugConsole}>
							Show Flow Debug Console
							<div className="form-text">
								Display the Flow Debug Console at the bottom of all OAuth flow pages for debugging
								and monitoring
							</div>
						</label>
					</div>
				</FormGroup>

				{/* Theme & Appearance Settings */}
				<h4
					style={{
						margin: '2rem 0 1rem 0',
						fontSize: '1.1rem',
						fontWeight: '600',
						color: '#374151',
						borderBottom: '1px solid #e5e7eb',
						paddingBottom: '0.5rem',
					}}
				>
					Theme & Appearance
				</h4>

				<FormGroup>
					<div className="checkbox-container">
						<input
							type="checkbox"
							id={formIds.darkMode}
							name="darkMode"
							checked={uiSettings.darkMode}
							onChange={(e) => {
								const isEnabled = e.target.checked;
								updateSetting('darkMode', isEnabled);
								v4ToastManager.showSuccess(isEnabled ? 'Dark mode enabled' : 'Light mode enabled');
							}}
						/>
						<label htmlFor={formIds.darkMode}>
							Enable Dark Mode
							<div className="form-text">Switch between light and dark themes</div>
						</label>
					</div>
				</FormGroup>

				<FormGroup>
					<label htmlFor={formIds.fontSize} htmlFor="fontsizepreference">
						Font Size Preference
					</label>
					<select
						id={formIds.fontSize}
						name="fontSize"
						value={formData.fontSize}
						onChange={(e) => {
							setFormData((prev) => ({ ...prev, fontSize: e.target.value }));
							v4ToastManager.showSuccess(`Font size changed to ${e.target.value}`);
						}}
					>
						<option value="small">Small</option>
						<option value="medium">Medium</option>
						<option value="large">Large</option>
					</select>
					<div className="form-text">
						Choose your preferred text size throughout the application
					</div>
				</FormGroup>

				<FormGroup>
					<label htmlFor={formIds.colorScheme} htmlFor="colorscheme">
						Color Scheme
					</label>
					<select
						id={formIds.colorScheme}
						name="colorScheme"
						value={formData.colorScheme}
						onChange={(e) => {
							setFormData((prev) => ({ ...prev, colorScheme: e.target.value }));
							v4ToastManager.showSuccess(`Color scheme changed to ${e.target.value}`);
						}}
					>
						<option value="blue">Blue (Default)</option>
						<option value="green">Green</option>
						<option value="purple">Purple</option>
						<option value="orange">Orange</option>
						<option value="red">Red</option>
					</select>
					<div className="form-text">Select your preferred accent color theme</div>
				</FormGroup>

				{/* Flow Behavior Settings */}
				<h4
					style={{
						margin: '2rem 0 1rem 0',
						fontSize: '1.1rem',
						fontWeight: '600',
						color: '#374151',
						borderBottom: '1px solid #e5e7eb',
						paddingBottom: '0.5rem',
					}}
				>
					Flow Behavior
				</h4>

				<FormGroup>
					<div className="checkbox-container">
						<input
							type="checkbox"
							id={formIds.autoAdvanceSteps}
							name="autoAdvanceSteps"
							checked={formData.autoAdvanceSteps}
							onChange={(e) => {
								const isEnabled = e.target.checked;
								setFormData((prev) => ({ ...prev, autoAdvanceSteps: isEnabled }));
								v4ToastManager.showSuccess(
									isEnabled ? 'Auto-advance enabled' : 'Auto-advance disabled'
								);
							}}
						/>
						<label htmlFor={formIds.autoAdvanceSteps}>
							Auto-Advance Steps
							<div className="form-text">Automatically proceed to the next step when possible</div>
						</label>
					</div>
				</FormGroup>

				<FormGroup>
					<label
						htmlFor={formIds.collapsibleDefaultState}
						htmlFor="collapsiblesectionsdefaultstate"
					>
						Collapsible Sections Default State
					</label>
					<select
						id={formIds.collapsibleDefaultState}
						name="collapsibleDefaultState"
						value={formData.collapsibleDefaultState}
						onChange={(e) => {
							setFormData((prev) => ({ ...prev, collapsibleDefaultState: e.target.value }));
							v4ToastManager.showSuccess(`Collapsible sections will start ${e.target.value}`);
						}}
					>
						<option value="collapsed">Collapsed</option>
						<option value="expanded">Expanded</option>
					</select>
					<div className="form-text">
						Choose whether collapsible sections start expanded or collapsed
					</div>
				</FormGroup>

				{/* Developer Settings */}
				<h4
					style={{
						margin: '2rem 0 1rem 0',
						fontSize: '1.1rem',
						fontWeight: '600',
						color: '#374151',
						borderBottom: '1px solid #e5e7eb',
						paddingBottom: '0.5rem',
					}}
				>
					Developer Options
				</h4>

				<FormGroup>
					<div className="checkbox-container">
						<input
							type="checkbox"
							id={formIds.showRequestResponseDetails}
							name="showRequestResponseDetails"
							checked={formData.showRequestResponseDetails}
							onChange={(e) => {
								const isEnabled = e.target.checked;
								setFormData((prev) => ({ ...prev, showRequestResponseDetails: isEnabled }));
								v4ToastManager.showSuccess(
									isEnabled
										? 'Request/Response details enabled'
										: 'Request/Response details disabled'
								);
							}}
						/>
						<label htmlFor={formIds.showRequestResponseDetails}>
							Show Request/Response Details
							<div className="form-text">
								Display detailed HTTP request and response information
							</div>
						</label>
					</div>
				</FormGroup>

				<FormGroup>
					<label htmlFor={formIds.copyButtonBehavior} htmlFor="copybuttonbehavior">
						Copy Button Behavior
					</label>
					<select
						id={formIds.copyButtonBehavior}
						name="copyButtonBehavior"
						value={formData.copyButtonBehavior}
						onChange={(e) => {
							setFormData((prev) => ({ ...prev, copyButtonBehavior: e.target.value }));
							v4ToastManager.showSuccess(`Copy behavior changed to ${e.target.value}`);
						}}
					>
						<option value="confirmation">Show Confirmation</option>
						<option value="silent">Silent Copy</option>
					</select>
					<div className="form-text">Choose whether copy actions show confirmation messages</div>
				</FormGroup>

				<FormGroup>
					<label htmlFor={formIds.errorDetailLevel} htmlFor="errordetaillevel">
						Error Detail Level
					</label>
					<select
						id={formIds.errorDetailLevel}
						name="errorDetailLevel"
						value={formData.errorDetailLevel}
						onChange={(e) => {
							setFormData((prev) => ({ ...prev, errorDetailLevel: e.target.value }));
							v4ToastManager.showSuccess(`Error detail level changed to ${e.target.value}`);
						}}
					>
						<option value="basic">Basic</option>
						<option value="detailed">Detailed</option>
					</select>
					<div className="form-text">Choose the level of detail shown in error messages</div>
				</FormGroup>

				<FormGroup>
					<label htmlFor={formIds.consoleLoggingLevel} htmlFor="consolelogginglevel">
						Console Logging Level
					</label>
					<select
						id={formIds.consoleLoggingLevel}
						name="consoleLoggingLevel"
						value={formData.consoleLoggingLevel}
						onChange={(e) => {
							setFormData((prev) => ({ ...prev, consoleLoggingLevel: e.target.value }));
							v4ToastManager.showSuccess(`Console logging level changed to ${e.target.value}`);
						}}
					>
						<option value="minimal">Minimal</option>
						<option value="normal">Normal</option>
						<option value="verbose">Verbose</option>
					</select>
					<div className="form-text">Control the verbosity of console output</div>
				</FormGroup>

				{/* Dashboard Settings */}
				<h4
					style={{
						margin: '2rem 0 1rem 0',
						fontSize: '1.1rem',
						fontWeight: '600',
						color: '#374151',
						borderBottom: '1px solid #e5e7eb',
						paddingBottom: '0.5rem',
					}}
				>
					Dashboard & Navigation
				</h4>

				<FormGroup>
					<label htmlFor={formIds.defaultPageOnLoad} htmlFor="defaultpageonload">
						Default Page on Load
					</label>
					<select
						id={formIds.defaultPageOnLoad}
						name="defaultPageOnLoad"
						value={formData.defaultPageOnLoad}
						onChange={(e) => {
							setFormData((prev) => ({ ...prev, defaultPageOnLoad: e.target.value }));
							v4ToastManager.showSuccess(`Default page changed to ${e.target.value}`);
						}}
					>
						<option value="dashboard">Dashboard</option>
						<option value="authorization-code-v5">Authorization Code Flow V5</option>
						<option value="token-management">Token Management</option>
						<option value="configuration">Configuration</option>
					</select>
					<div className="form-text">Choose which page loads when you open the application</div>
				</FormGroup>

				<FormGroup>
					<div className="checkbox-container">
						<input
							type="checkbox"
							id={formIds.hideCompletedFlows}
							name="hideCompletedFlows"
							checked={formData.hideCompletedFlows}
							onChange={(e) => {
								const isEnabled = e.target.checked;
								setFormData((prev) => ({ ...prev, hideCompletedFlows: isEnabled }));
								v4ToastManager.showSuccess(
									isEnabled ? 'Completed flows will be hidden' : 'Completed flows will be shown'
								);
							}}
						/>
						<label htmlFor={formIds.hideCompletedFlows}>
							Hide Completed Flows
							<div className="form-text">Show only incomplete flows on the dashboard</div>
						</label>
					</div>
				</FormGroup>

				<FormGroup>
					<div className="checkbox-container">
						<input
							type="checkbox"
							id={formIds.quickActionsVisibility}
							name="quickActionsVisibility"
							checked={formData.quickActionsVisibility}
							onChange={(e) => {
								const isEnabled = e.target.checked;
								setFormData((prev) => ({ ...prev, quickActionsVisibility: isEnabled }));
								v4ToastManager.showSuccess(
									isEnabled ? 'Quick actions enabled' : 'Quick actions disabled'
								);
							}}
						/>
						<label htmlFor={formIds.quickActionsVisibility}>
							Show Quick Actions
							<div className="form-text">Display quick action buttons throughout the interface</div>
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
					<h4 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>UI Settings Info</h4>
					<p style={{ margin: '0', fontSize: '0.9rem', color: '#6c757d' }}>
						These settings control the display of modals, debug tools, themes, and behavior
						throughout the application. Changes are saved automatically and will affect all OAuth
						flows, especially the V5 flow template.
					</p>
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
				title="PingOne Configuration Help"
				subtitle="Step-by-step guide to set up your PingOne application"
				defaultCollapsed={true}
			>
				<div>
					<h3 style={{ marginTop: 0 }}>PingOne Configuration Required</h3>
					<p>To use this OAuth Playground, you need to configure your PingOne environment:</p>

					<div>
						<h4>1. Access PingOne Admin Console</h4>
						<ul>
							<li>
								Navigate to your <strong>PingOne Admin Console</strong>
							</li>
							<li>
								Go to <strong>Applications</strong> <strong>Applications</strong>
							</li>
							<li>
								Click{' '}
								<strong
									style={{
										fontSize: '1.1rem',
										fontWeight: 800,
										color: 'rgb(0, 112, 204)',
									}}
								>
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
									aria-hidden={true}
								></span>
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
								<span
									style={{
										marginLeft: '0.375rem',
										color: 'rgb(108, 117, 125)',
									}}
								>
									(hidden by default)
								</span>
							</li>
						</ul>
					</div>

					<p style={{ marginTop: '1rem' }}>
						<em>
							<strong>Need Help?</strong> Check the PingOne documentation or contact your PingOne
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

			{/* UI Settings Modal */}
			<UISettingsModal
				isOpen={isUISettingsModalOpen}
				onClose={() => setIsUISettingsModalOpen(false)}
			/>
		</ConfigurationContainer>
	);
};

export default Configuration;
