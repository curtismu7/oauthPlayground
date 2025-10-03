import { useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiCheck,
	FiCheckCircle,
	FiChevronDown,
	FiCopy,
	FiEdit,
	FiEye,
	FiEyeOff,
	FiLogIn,
} from 'react-icons/fi';
import { themeService } from '../services/themeService';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import packageJson from '../../package.json';
import AuthorizationRequestModal from '../components/AuthorizationRequestModal';
import DebugCredentials from '../components/DebugCredentials';
import Spinner from '../components/Spinner';
import { useAuth } from '../contexts/NewAuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { getCallbackUrlForFlow } from '../utils/callbackUrls';
import { pingOneConfigService, type PingOneConfig } from '../services/pingoneConfigService';
import { FlowHeader } from '../services/flowHeaderService';

// Define specific types for HMAC and signing algorithms
type HMACAlgorithm = 'HS256' | 'HS384' | 'HS512';
type SigningAlgorithm = 'RS256' | 'ES256' | 'PS256' | 'RS384' | 'ES384' | 'RS512' | 'ES512';
type RequestObjectPolicy = 'default' | 'require' | 'allow_unsigned';

interface ClientAssertion {
	hmacAlg: HMACAlgorithm;
	signAlg: SigningAlgorithm;
	privateKeyPEM: string;
	kid: string;
	audience: string;
	x5t: string;
}

interface AdvancedSettings {
	requestObjectPolicy?: RequestObjectPolicy;
	oidcSessionManagement: boolean;
	resourceScopes: string;
	terminateByIdToken: boolean;
}

interface Credentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	tokenAuthMethod: string;
	clientAssertion: ClientAssertion;
	advanced: AdvancedSettings;
	[key: string]: unknown; // For dynamic access to other properties
}

const LoginContainer = styled.div`
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 2rem 0.5rem;
`;

const LoginLayout = styled.div`
  max-width: 64rem;
  margin: 0 auto;
  padding: 0 1rem;
`;

const SetupSection = styled.div`
  width: 100%;
  min-width: 0;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background-color: var(--color-primary, #007bff);
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--color-primary-dark, #0056b3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const Alert = styled.div`
  padding: 1rem;
  margin-bottom: 1.5rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: flex-start;
  background-color: var(--color-error-bg, rgba(220, 53, 69, 0.1));
  border: 1px solid var(--color-error-border, rgba(220, 53, 69, 0.2));
  color: var(--color-error, #dc3545);
  
  svg {
    margin-right: 0.75rem;
    margin-top: 0.2rem;
    flex-shrink: 0;
  }
  
  div {
    flex: 1;
  }
`;

const PingOneSetupSection = styled.div`
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  text-align: left;
  height: fit-content;

  h3 {
    color: var(--color-text-primary, #495057);
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
  }

  p {
    color: var(--color-text-secondary, #6c757d);
    margin-bottom: 1rem;
    line-height: 1.4;
    font-size: 0.9rem;
  }

  em {
    font-style: italic;
    color: var(--color-text-secondary, #6c757d);
    font-size: 0.85rem;
  }
`;

const SetupSteps = styled.div`
  margin-bottom: 1.5rem;

  h4 {
    color: var(--color-text-primary, #343a40);
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  ul {
    margin: 0 0 0.5rem 0;
    padding-left: 1.2rem;
  }

  li {
    margin-bottom: 0.25rem;
    color: var(--color-text-secondary, #495057);
    line-height: 1.3;
    font-size: 0.85rem;

    strong {
      color: var(--color-text-primary, #212529);
    }

    code {
      background-color: var(--color-surface, #e9ecef);
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.75em;
      color: var(--color-text-secondary, #495057);
    }
  }
`;

const CredentialsBox = styled.div`
  background-color: var(--color-background, #ffffff);
  border: 1px solid var(--color-border, #dee2e6);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.5rem;

  h4 {
    color: var(--color-text-primary, #343a40);
    margin-top: 0;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  p {
    margin-bottom: 0.5rem;
    color: var(--color-text-secondary, #495057);
    font-size: 0.8rem;

    strong {
      color: var(--color-text-primary, #212529);
      font-weight: 600;
    }

    code {
      background-color: var(--color-surface, #f8f9fa);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--color-primary, #0070CC);
      letter-spacing: 0.5px;
      word-break: break-all;
      display: inline-block;
      margin-top: 0.25rem;
      border: 1px solid var(--color-border, #e9ecef);
    }
  }
`;

const CredentialRow = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 0.5rem;

  p {
    margin: 0;
    min-width: 120px;
    font-weight: 600;
    color: var(--color-text-secondary, #495057);
  }
`;

const CredentialWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;

  code {
    flex: 1;
    margin: 0;
  }
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  color: var(--color-text-secondary, #6c757d);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: var(--color-surface, #f8f9fa);
    color: var(--color-primary, #0070CC);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    transition: all 0.2s;
  }
`;

// Themed collapse icon (blue with white arrow)
const ChevronIcon = styled.div.withConfig({
	shouldForwardProp: (prop) => prop !== 'collapsed' && prop !== '$collapsed',
})<{ $collapsed: boolean }>`
	${() => themeService.getCollapseIconStyles()}
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
	transition: transform 0.2s ease;

	svg {
		color: inherit;
	}
`;

const Login = () => {
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [credentials, setCredentials] = useState<Credentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		tokenAuthMethod: 'client_secret_basic',
		clientAssertion: {
			hmacAlg: 'HS256',
			signAlg: 'RS256',
			privateKeyPEM: '',
			kid: '',
			audience: '',
			x5t: '',
		},
		advanced: {
			requestObjectPolicy: 'default',
			oidcSessionManagement: false,
			resourceScopes: 'openid profile email',
			terminateByIdToken: true,
		},
	});
	const [showClientSecret, setShowClientSecret] = useState(false);
	const toggleClientSecretVisibility = () => setShowClientSecret(!showClientSecret);
	const [saveStatus, setSaveStatus] = useState<{
		type: string;
		title: string;
		message: string;
	} | null>(null);
	const [isSavingCredentials, setIsSavingCredentials] = useState(false);

	// Modal state for URL preview
	const [showRedirectModal, setShowRedirectModal] = useState<boolean>(false);
	const [redirectUrl, setRedirectUrl] = useState<string>('');
	const [redirectParams, setRedirectParams] = useState<Record<string, string>>({});
	const [isConfigSectionCollapsed, setIsConfigSectionCollapsed] = useState<boolean>(true);
	const [isCredentialsSectionCollapsed, setIsCredentialsSectionCollapsed] =
		useState<boolean>(false);
	const [hasExistingCredentials, setHasExistingCredentials] = useState<boolean>(false);

	const { login } = useAuth();
	const location = useLocation();
	const { showSuccess, showError } = useNotifications();

	// Load existing credentials on component mount
	useEffect(() => {
		const loadExistingCredentials = () => {
			console.log(' [Login] Loading existing credentials...');

			// Try to load from V5 config service
			const config = pingOneConfigService.getConfig();
			console.log(' [Login] Config from service:', config);

			if (config?.environmentId && config?.clientId) {
				console.log(' [Login] Found existing credentials, pre-filling form');
				setCredentials((prev) => ({
					...prev,
					environmentId: config.environmentId || '',
					clientId: config.clientId || '',
					clientSecret: config.clientSecret || '',
					tokenAuthMethod: 'client_secret_basic',
				}));
				setHasExistingCredentials(true);

				// Collapse credentials section if they're already filled
				setIsCredentialsSectionCollapsed(true);
			} else {
				console.log(' [Login] No existing credentials found');
				setHasExistingCredentials(false);
			}
		};

		loadExistingCredentials();
	}, []);

	// Modal handler functions
	const handleRedirectModalClose = () => {
		setShowRedirectModal(false);
		setIsLoading(false);
	};

	const handleRedirectModalProceed = () => {
		console.log(' [Login] Proceeding with redirect to PingOne:', redirectUrl);
		window.location.href = redirectUrl;
	};

	// const from = location.state?.from?.pathname || '/';

	// Check for redirect messages
	const redirectMessage = location.state?.message;
	const redirectType = location.state?.type || 'info';

	// Load saved credentials on component mount
	useEffect(() => {
		console.log(' [Login] Loading credentials from V5 config service...');

		// Load from V5 config service
		const config = pingOneConfigService.getConfig();
		console.log(' [Login] Config service result:', config);

		if (config?.environmentId && config?.clientId) {
			console.log(' [Login] Found credentials from config service:', {
				hasEnvironmentId: !!config.environmentId,
				hasClientId: !!config.clientId,
				hasClientSecret: !!config.clientSecret,
				clientIdPrefix: `${config.clientId?.substring(0, 8)}...`,
			});

			setCredentials({
				environmentId: config.environmentId,
				clientId: config.clientId,
				clientSecret: config.clientSecret || '',
				tokenAuthMethod: 'client_secret_basic',
				clientAssertion: {
					hmacAlg: 'HS256',
					signAlg: 'RS256',
					privateKeyPEM: '',
					kid: '',
					audience: '',
					x5t: '',
				},
				advanced: {
					requestObjectPolicy: 'default',
					oidcSessionManagement: false,
					resourceScopes: 'openid profile email',
					terminateByIdToken: true,
				},
			});
			return;
		}

		// Fallback to old localStorage approach
		const savedCredentials = localStorage.getItem('login_credentials');
		if (savedCredentials) {
			try {
				const parsedCredentials = JSON.parse(savedCredentials);

				// Check if the client secret is the problematic hardcoded one
				if (
					parsedCredentials.clientSecret ===
					'0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a'
				) {
					console.log(' [Login] Clearing problematic hardcoded client secret');
					parsedCredentials.clientSecret = '';
					// Update localStorage with cleared secret
					localStorage.setItem('login_credentials', JSON.stringify(parsedCredentials));
				}

				console.log(' [Login] Found saved credentials from localStorage:', {
					hasEnvironmentId: !!parsedCredentials.environmentId,
					hasClientId: !!parsedCredentials.clientId,
					hasClientSecret: !!parsedCredentials.clientSecret,
					clientIdPrefix: `${parsedCredentials.clientId?.substring(0, 8)}...`,
				});
				setCredentials(parsedCredentials);
			} catch (error) {
				console.error(' [Login] Failed to parse saved credentials:', error);
			}
		} else {
			console.log(' [Login] No saved credentials found in localStorage or credential manager');
		}
	}, []);

	const copyToClipboard = async (text: string, id: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedId(id);
			setTimeout(() => setCopiedId(null), 2000);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	};

	const tokenEndpointForEnv = (envId: string) => `https://auth.pingone.com/${envId}/as/token`;

	const handleCredentialChange = (field: string, value: string) => {
		setCredentials((prev) => {
			const next: Credentials = { ...prev, [field]: value };
			// If environment changes, refresh default audience if it was empty or matched previous default
			if (field === 'environmentId') {
				const oldDefault = tokenEndpointForEnv(prev.environmentId);
				const newDefault = tokenEndpointForEnv(value);
				const curAud = prev.clientAssertion?.audience || '';
				if (!curAud || curAud === oldDefault) {
					next.clientAssertion = {
						...(prev.clientAssertion || {}),
						audience: newDefault,
					};
				}
			}
			return next;
		});
	};

	const handleCredentialSave = () => {
		console.log(' [Login] Saving credentials...');
		setSaveStatus(null);
		setIsSavingCredentials(true);

		try {
			// Save configuration using V5 config service
			const configToSave: PingOneConfig = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: getCallbackUrlForFlow('dashboard'),
				baseUrl: `https://auth.pingone.com/${credentials.environmentId}`,
				authUrl: `https://auth.pingone.com/${credentials.environmentId}/as`,
				authorizationEndpoint: `https://auth.pingone.com/${credentials.environmentId}/as/authorize`,
				tokenEndpoint: `https://auth.pingone.com/${credentials.environmentId}/as/token`,
				userInfoEndpoint: `https://auth.pingone.com/${credentials.environmentId}/as/userinfo`,
				logoutEndpoint: `https://auth.pingone.com/${credentials.environmentId}/as/signoff`,
				parEndpoint: `https://auth.pingone.com/${credentials.environmentId}/as/par`,
				tokenAuthMethod: (credentials.tokenAuthMethod || 'client_secret_basic') as
					| 'client_secret_basic'
					| 'client_secret_post'
					| 'client_secret_jwt'
					| 'private_key_jwt',
			};

			pingOneConfigService.saveConfig(configToSave);
			console.log(' [Login] Saved config to V5 service:', configToSave);

			setSaveStatus({
				type: 'success',
				title: 'Credentials saved',
				message:
					'Your login credentials have been saved successfully. The Configuration page has been updated with these same values.',
			});
			showSuccess('Login credentials have been saved successfully.');

			// Force a re-render to update the display with new values
			setCredentials((prev) => ({ ...prev }));
		} catch (error) {
			console.error(' [Login] Failed to save credentials:', error);
			setSaveStatus({
				type: 'danger',
				title: 'Error',
				message: 'Failed to save credentials. Please try again.',
			});
			showError('Failed to save login credentials. Please try again.');
		} finally {
			// Add a small delay to show the spinner effect
			setTimeout(() => {
				setIsSavingCredentials(false);
			}, 500);
		}

		// Clear success message after 3 seconds
		setTimeout(() => {
			setSaveStatus(null);
		}, 3000);
	};

	const handleLogin = async () => {
		console.log(' [Login] Starting login process...');
		setError('');
		setIsLoading(true);

		try {
			console.log(' [Login] Saving credentials before login:', {
				hasEnvironmentId: !!credentials.environmentId,
				hasClientId: !!credentials.clientId,
				hasClientSecret: !!credentials.clientSecret,
				environmentId: credentials.environmentId,
				clientId: `${credentials.clientId?.substring(0, 8)}...`,
			});

			// Save current form credentials to localStorage before login
			// This ensures the OAuth redirect uses the correct credentials
			localStorage.setItem('login_credentials', JSON.stringify(credentials));

			// Also save as pingone_config for consistency
			const configToSave = {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: getCallbackUrlForFlow('dashboard'),
				scopes: credentials.advanced?.resourceScopes || 'openid profile email',
				authEndpoint: `https://auth.pingone.com/${credentials.environmentId}/as/authorize`,
				tokenEndpoint: `https://auth.pingone.com/${credentials.environmentId}/as/token`,
				userInfoEndpoint: `https://auth.pingone.com/${credentials.environmentId}/as/userinfo`,
				tokenAuthMethod: credentials.tokenAuthMethod,
				clientAssertion: credentials.clientAssertion,
				advanced: credentials.advanced,
			};
			localStorage.setItem('pingone_config', JSON.stringify(configToSave));

			console.log(' [Login] Credentials saved, config prepared:', {
				redirectUri: configToSave.redirectUri,
				authEndpoint: configToSave.authEndpoint,
				tokenEndpoint: configToSave.tokenEndpoint,
				userInfoEndpoint: configToSave.userInfoEndpoint,
			});

			// Dispatch event to notify other components of config change
			window.dispatchEvent(
				new CustomEvent('pingone_config_changed', {
					detail: { config: configToSave },
				})
			);

			console.log(' [Login] Calling login function with dashboard callback type...');

			// Redirect to PingOne for authentication
			const result = await login('/', 'dashboard');

			console.log(' [Login] Login function result:', result);

			if (!result.success) {
				console.error(' [Login] Login failed:', result.error);
				setError(result.error || 'Login failed');
				showError(result.error || 'Login failed. Please check your credentials and try again.');
				setIsLoading(false);
				return;
			}

			// Show success message for successful login initiation
			showSuccess('Redirecting to PingOne for authentication...');

			console.log(' [Login] Login initiated successfully, showing URL preview modal');

			// Parse URL to extract parameters for modal display
			if (result.redirectUrl) {
				const urlObj = new URL(result.redirectUrl);
				const params: Record<string, string> = {};
				urlObj.searchParams.forEach((value, key) => {
					params[key] = value;
				});

				console.log(' [Login] Opening redirect modal with URL:', result.redirectUrl);
				setRedirectUrl(result.redirectUrl);
				setRedirectParams(params);
				setShowRedirectModal(true);
			}
		} catch (err) {
			console.error(' [Login] Login error:', err);
			console.error(' [Login] Error details:', {
				message: err instanceof Error ? err.message : 'Unknown error',
				stack: err instanceof Error ? err.stack : undefined,
				error: err,
			});
			setError('An error occurred during login. Please try again.');
			setIsLoading(false);
		}
	};

	return (
		<LoginContainer>
			<LoginLayout>
				<SetupSection>
					{/* V5 Flow Header */}
					<FlowHeader flowId="login" />

					{/* Version Badge */}
					<div
						style={{
							marginTop: '1.5rem',
							marginBottom: '1.5rem',
							textAlign: 'center',
							color: '#6c757d',
							fontSize: '0.875rem',
						}}
					>
						Version {packageJson.version}
					</div>

					<PingOneSetupSection>
						<h3
							onClick={() => setIsConfigSectionCollapsed(!isConfigSectionCollapsed)}
							style={{
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								userSelect: 'none',
							}}
						>
							<ChevronIcon $collapsed={isConfigSectionCollapsed}>
								<FiChevronDown />
							</ChevronIcon>
							PingOne Configuration Required
						</h3>
						{!isConfigSectionCollapsed && (
							<>
								<p>To use this OAuth Playground, you need to configure your PingOne environment:</p>

								<SetupSteps>
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
													fontWeight: '800',
													color: '#0070CC',
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
													fontWeight: '800',
													fontSize: '1rem',
													color: '#0070CC',
													marginLeft: '0.5rem',
												}}
											>
												PingOne OAuth/OIDC Playground v{packageJson.version}
												<button
													onClick={() =>
														copyToClipboard(
															`PingOne OAuth/OIDC Playground v${packageJson.version}`,
															'setup-app-name'
														)
													}
													style={{
														background: 'none',
														border: '1px solid #0070CC',
														color: '#0070CC',
														cursor: 'pointer',
														padding: '0.125rem 0.25rem',
														borderRadius: '3px',
														fontSize: '0.7rem',
														fontWeight: '600',
														marginLeft: '0.5rem',
														display: 'inline-flex',
														alignItems: 'center',
														gap: '0.125rem',
														transition: 'all 0.2s',
													}}
													title="Copy Application Name"
												>
													{copiedId === 'setup-app-name' ? (
														<FiCheck size={10} />
													) : (
														<FiCopy size={10} />
													)}
												</button>
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
											<strong>Enable Application - Grey button on top Right</strong>
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
													width: '20px',
													height: '20px',
													backgroundColor: '#0070CC',
													borderRadius: '50%',
													marginLeft: '8px',
													color: 'white',
												}}
											>
												<FiEdit size={12} />
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
													fontWeight: '800',
													fontSize: '1rem',
													color: '#0070CC',
													marginLeft: '0.5rem',
												}}
											>
												{getCallbackUrlForFlow('dashboard')}
												<button
													onClick={() =>
														copyToClipboard(
															getCallbackUrlForFlow('dashboard'),
															'setup-redirect-uri'
														)
													}
													style={{
														background: 'none',
														border: '1px solid #0070CC',
														color: '#0070CC',
														cursor: 'pointer',
														padding: '0.125rem 0.25rem',
														borderRadius: '3px',
														fontSize: '0.7rem',
														fontWeight: '600',
														marginLeft: '0.5rem',
														display: 'inline-flex',
														alignItems: 'center',
														gap: '0.125rem',
														transition: 'all 0.2s',
													}}
													title="Copy Redirect URI"
												>
													{copiedId === 'setup-redirect-uri' ? (
														<FiCheck size={10} />
													) : (
														<FiCopy size={10} />
													)}
												</button>
											</span>
										</li>
										<li>
											<strong>Token Endpoint Authentication Method:</strong> Client Secret Basic
										</li>
										<li>
											Click <strong style={{ color: '#0070CC' }}>Save</strong> to create the
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
													color: '#6c757d',
													display: 'inline-flex',
													alignItems: 'center',
													gap: '0.25rem',
												}}
											>
												(<FiEye size={12} /> show/hide)
											</span>
										</li>
									</ul>
								</SetupSteps>

								<p>
									<em>
										{' '}
										<strong>Need Help?</strong> Check the PingOne documentation or contact your
										PingOne administrator.
									</em>
								</p>
							</>
						)}
					</PingOneSetupSection>

					{/* Credentials Section - Separate Collapsible Section */}
					<PingOneSetupSection style={{ marginTop: '1rem' }}>
						<h3
							onClick={() => setIsCredentialsSectionCollapsed(!isCredentialsSectionCollapsed)}
							style={{
								cursor: 'pointer',
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								userSelect: 'none',
							}}
						>
							<ChevronIcon $collapsed={isCredentialsSectionCollapsed}>
								<FiChevronDown />
							</ChevronIcon>
							Enter Your Credentials
							{hasExistingCredentials && (
								<span
									style={{
										background: '#d4edda',
										color: '#155724',
										padding: '0.25rem 0.5rem',
										borderRadius: '12px',
										fontSize: '0.75rem',
										fontWeight: '500',
										marginLeft: '0.5rem',
										display: 'flex',
										alignItems: 'center',
										gap: '0.25rem',
									}}
								>
									<FiCheckCircle size={12} />
									Configured
								</span>
							)}
						</h3>
						{!isCredentialsSectionCollapsed && (
							<CredentialsBox>
								<h4>Configure Your PingOne Application Credentials</h4>

								{redirectMessage && (
									<div
										style={{
											padding: '1rem',
											marginBottom: '1.5rem',
											borderRadius: '0.375rem',
											backgroundColor:
												redirectType === 'success'
													? '#f0fdf4'
													: redirectType === 'error'
														? '#fef2f2'
														: redirectType === 'warning'
															? '#fffbeb'
															: '#eff6ff',
											border: `1px solid ${redirectType === 'success' ? '#bbf7d0' : redirectType === 'error' ? '#fecaca' : redirectType === 'warning' ? '#fde68a' : '#bfdbfe'}`,
											color:
												redirectType === 'success'
													? '#166534'
													: redirectType === 'error'
														? '#991b1b'
														: redirectType === 'warning'
															? '#92400e'
															: '#1e40af',
											display: 'flex',
											alignItems: 'flex-start',
										}}
									>
										{redirectType === 'success' ? (
											<FiCheckCircle
												size={20}
												style={{
													marginRight: '0.75rem',
													marginTop: '0.2rem',
													flexShrink: 0,
												}}
											/>
										) : redirectType === 'error' ? (
											<FiAlertCircle
												size={20}
												style={{
													marginRight: '0.75rem',
													marginTop: '0.2rem',
													flexShrink: 0,
												}}
											/>
										) : redirectType === 'warning' ? (
											<FiAlertCircle
												size={20}
												style={{
													marginRight: '0.75rem',
													marginTop: '0.2rem',
													flexShrink: 0,
												}}
											/>
										) : (
											<FiAlertCircle
												size={20}
												style={{
													marginRight: '0.75rem',
													marginTop: '0.2rem',
													flexShrink: 0,
												}}
											/>
										)}
										<div>
											<h4
												style={{
													marginTop: 0,
													marginBottom: '0.5rem',
													fontWeight: 600,
												}}
											>
												{redirectType === 'success'
													? 'Success'
													: redirectType === 'error'
														? 'Error'
														: redirectType === 'warning'
															? 'Warning'
															: 'Information'}
											</h4>
											<p style={{ margin: 0, fontSize: '0.9375rem' }}>{redirectMessage}</p>
										</div>
									</div>
								)}

								{error && (
									<Alert>
										<FiAlertCircle size={20} />
										<div>{error}</div>
									</Alert>
								)}

								<form
									onSubmit={(e) => {
										e.preventDefault();
										handleCredentialSave();
									}}
								>
									{saveStatus && (
										<div
											style={{
												padding: '1rem',
												marginBottom: '1.5rem',
												borderRadius: '0.375rem',
												backgroundColor: saveStatus.type === 'success' ? '#f0fdf4' : '#fef2f2',
												border: `1px solid ${saveStatus.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
												color: saveStatus.type === 'success' ? '#166534' : '#991b1b',
												display: 'flex',
												alignItems: 'flex-start',
											}}
										>
											{saveStatus.type === 'success' ? (
												<FiCheckCircle
													size={20}
													style={{
														marginRight: '0.75rem',
														marginTop: '0.2rem',
														flexShrink: 0,
													}}
												/>
											) : (
												<FiAlertCircle
													size={20}
													style={{
														marginRight: '0.75rem',
														marginTop: '0.2rem',
														flexShrink: 0,
													}}
												/>
											)}
											<div>
												<h4
													style={{
														marginTop: 0,
														marginBottom: '0.5rem',
														fontWeight: 600,
													}}
												>
													{saveStatus.title}
												</h4>
												<p style={{ margin: 0, fontSize: '0.9375rem' }}>{saveStatus.message}</p>
											</div>
										</div>
									)}

									<CredentialRow>
										<p>
											<strong>Environment ID:</strong>
										</p>
										<CredentialWrapper>
											<input
												type="text"
												value={credentials.environmentId}
												onChange={(e) => handleCredentialChange('environmentId', e.target.value)}
												style={{
													width: '100%',
													padding: '0.5rem',
													border: '1px solid #dee2e6',
													borderRadius: '4px',
													fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
													fontSize: '0.85rem',
													backgroundColor: '#f8f9fa',
												}}
												placeholder="e.g., abc12345-6789-4abc-def0-1234567890ab"
											/>
											<CopyButton
												onClick={() => copyToClipboard(credentials.environmentId, 'env-id')}
												title="Copy Environment ID"
											>
												{copiedId === 'env-id' ? <FiCheck size={16} /> : <FiCopy size={16} />}
											</CopyButton>
										</CredentialWrapper>
									</CredentialRow>

									<CredentialRow>
										<p>
											<strong>Client ID:</strong>
										</p>
										<CredentialWrapper>
											<input
												type="text"
												value={credentials.clientId}
												onChange={(e) => handleCredentialChange('clientId', e.target.value)}
												style={{
													width: '100%',
													padding: '0.5rem',
													border: '1px solid #dee2e6',
													borderRadius: '4px',
													fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
													fontSize: '0.85rem',
													backgroundColor: '#f8f9fa',
												}}
												placeholder="Enter your application's Client ID"
											/>
											<CopyButton
												onClick={() => copyToClipboard(credentials.clientId, 'client-id')}
												title="Copy Client ID"
											>
												{copiedId === 'client-id' ? <FiCheck size={16} /> : <FiCopy size={16} />}
											</CopyButton>
										</CredentialWrapper>
									</CredentialRow>

									<CredentialRow>
										<p>
											<strong>Client Secret:</strong>
										</p>
										<CredentialWrapper>
											<div style={{ position: 'relative', width: '100%' }}>
												<input
													type={showClientSecret ? 'text' : 'password'}
													value={credentials.clientSecret}
													onChange={(e) => handleCredentialChange('clientSecret', e.target.value)}
													autoComplete="current-password"
													style={{
														width: '100%',
														maxWidth: '610px',
														padding: '0.5rem 3.25rem 0.5rem 0.75rem',
														border: '1px solid #dee2e6',
														fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
														fontSize: '0.875rem',
														borderRadius: '4px',
														backgroundColor: '#f8f9fa',
													}}
													placeholder="Enter your application's Client Secret"
												/>
												<button
													onClick={toggleClientSecretVisibility}
													type="button"
													style={{
														position: 'absolute',
														right: '0.5rem',
														top: '50%',
														transform: 'translateY(-50%)',
														background: 'none',
														border: 'none',
														cursor: 'pointer',
														color: '#6c757d',
														padding: '0.25rem',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
													}}
													aria-label={
														showClientSecret ? 'Hide client secret' : 'Show client secret'
													}
												>
													{showClientSecret ? <FiEyeOff size={18} /> : <FiEye size={18} />}
												</button>
											</div>
											<CopyButton
												onClick={() => copyToClipboard(credentials.clientSecret, 'client-secret')}
												title="Copy Client Secret"
												style={{ marginLeft: '0.5rem' }}
											>
												{copiedId === 'client-secret' ? (
													<FiCheck size={16} />
												) : (
													<FiCopy size={16} />
												)}
											</CopyButton>
										</CredentialWrapper>
									</CredentialRow>

									{/* Token Endpoint Authentication Method */}
									<CredentialRow>
										<p>
											<strong>Token Auth Method:</strong>
										</p>
										<CredentialWrapper>
											<select
												value={credentials.tokenAuthMethod}
												onChange={(e) => {
													const method = e.target.value as
														| 'client_secret_basic'
														| 'client_secret_post'
														| 'client_secret_jwt'
														| 'private_key_jwt';

													setCredentials((prev) => {
														const updated = {
															...prev,
															tokenAuthMethod: method,
														};

														if (method === 'client_secret_jwt' || method === 'private_key_jwt') {
															const defAud = tokenEndpointForEnv(prev.environmentId);
															const curAud = prev.clientAssertion?.audience || '';

															if (!curAud) {
																updated.clientAssertion = {
																	...(prev.clientAssertion || {}),
																	audience: defAud,
																};
															}
														}

														return updated;
													});
												}}
												style={{
													width: '100%',
													padding: '0.5rem',
													border: '1px solid #dee2e6',
													borderRadius: '4px',
													backgroundColor: '#f8f9fa',
												}}
											>
												<option value="client_secret_post">client_secret_post</option>
												<option value="client_secret_jwt">client_secret_jwt (HS256)</option>
												<option value="private_key_jwt">private_key_jwt (RS256/ES256)</option>
											</select>
										</CredentialWrapper>
									</CredentialRow>

									{/* Client Assertion Options - HMAC */}
									{credentials.tokenAuthMethod === 'client_secret_jwt' && (
										<>
											<CredentialRow>
												<p>
													<strong>HMAC Alg:</strong>
												</p>
												<CredentialWrapper>
													<select
														value={credentials.clientAssertion?.hmacAlg || 'HS256'}
														onChange={(e) =>
															setCredentials((prev) => ({
																...prev,
																clientAssertion: {
																	...(prev.clientAssertion || {}),
																	hmacAlg: e.target.value as HMACAlgorithm,
																},
															}))
														}
														style={{
															width: '100%',
															padding: '0.5rem',
															border: '1px solid #dee2e6',
															borderRadius: 4,
															backgroundColor: '#f8f9fa',
														}}
													>
														<option value="HS256">HS256</option>
														<option value="HS384">HS384</option>
														<option value="HS512">HS512</option>
													</select>
												</CredentialWrapper>
											</CredentialRow>
											<CredentialRow>
												<p>
													<strong>Audience (aud):</strong>
												</p>
												<CredentialWrapper>
													<input
														type="text"
														placeholder="Defaults to token endpoint"
														value={credentials.clientAssertion?.audience || ''}
														onChange={(e) =>
															setCredentials((prev) => ({
																...prev,
																clientAssertion: {
																	...(prev.clientAssertion || {}),
																	audience: e.target.value,
																},
															}))
														}
														style={{
															width: '100%',
															padding: '0.5rem',
															border: '1px solid #dee2e6',
															borderRadius: 4,
															backgroundColor: '#f8f9fa',
														}}
													/>
												</CredentialWrapper>
											</CredentialRow>
										</>
									)}

									{/* Client Assertion Options - Private Key */}
									{credentials.tokenAuthMethod === 'private_key_jwt' && (
										<>
											<CredentialRow>
												<p>
													<strong>Signing Alg:</strong>
												</p>
												<CredentialWrapper>
													<select
														value={credentials.clientAssertion?.signAlg || 'RS256'}
														onChange={(e) =>
															setCredentials((prev) => ({
																...prev,
																clientAssertion: {
																	...(prev.clientAssertion || {}),
																	signAlg: e.target.value as SigningAlgorithm,
																},
															}))
														}
														style={{
															width: '100%',
															padding: '0.5rem',
															border: '1px solid #dee2e6',
															borderRadius: 4,
															backgroundColor: '#f8f9fa',
														}}
													>
														<option value="RS256">RS256</option>
														<option value="ES256">ES256</option>
													</select>
												</CredentialWrapper>
											</CredentialRow>
											<CredentialRow>
												<p>
													<strong>kid:</strong>
												</p>
												<CredentialWrapper>
													<input
														type="text"
														placeholder="Key ID registered in PingOne"
														value={credentials.clientAssertion?.kid || ''}
														onChange={(e) =>
															setCredentials((prev) => ({
																...prev,
																clientAssertion: {
																	...(prev.clientAssertion || {}),
																	kid: e.target.value,
																},
															}))
														}
														style={{
															width: '100%',
															padding: '0.5rem',
															border: '1px solid #dee2e6',
															borderRadius: 4,
															backgroundColor: '#f8f9fa',
														}}
													/>
												</CredentialWrapper>
											</CredentialRow>
											<CredentialRow>
												<p>
													<strong>Private Key (PEM):</strong>
												</p>
												<CredentialWrapper>
													<textarea
														placeholder={`-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----`}
														value={credentials.clientAssertion?.privateKeyPEM || ''}
														onChange={(e) =>
															setCredentials((prev) => ({
																...prev,
																clientAssertion: {
																	...(prev.clientAssertion || {}),
																	privateKeyPEM: e.target.value,
																},
															}))
														}
														style={{
															width: '100%',
															minHeight: '120px',
															padding: '0.5rem',
															border: '1px solid #dee2e6',
															borderRadius: 4,
															backgroundColor: '#f8f9fa',
															fontFamily: 'monospace',
														}}
													/>
												</CredentialWrapper>
											</CredentialRow>
											<CredentialRow>
												<p>
													<strong>Audience (aud):</strong>
												</p>
												<CredentialWrapper>
													<input
														type="text"
														placeholder="Defaults to token endpoint"
														value={credentials.clientAssertion?.audience || ''}
														onChange={(e) =>
															setCredentials((prev) => ({
																...prev,
																clientAssertion: {
																	...(prev.clientAssertion || {}),
																	audience: e.target.value,
																},
															}))
														}
														style={{
															width: '100%',
															padding: '0.5rem',
															border: '1px solid #dee2e6',
															borderRadius: 4,
															backgroundColor: '#f8f9fa',
														}}
													/>
												</CredentialWrapper>
											</CredentialRow>
										</>
									)}

									<CredentialRow>
										<p>
											<strong>Redirect URI:</strong>
										</p>
										<CredentialWrapper>
											<code>{getCallbackUrlForFlow('dashboard')}</code>
											<CopyButton
												onClick={() =>
													copyToClipboard(getCallbackUrlForFlow('dashboard'), 'redirect-uri')
												}
												title="Copy Redirect URI"
											>
												{copiedId === 'redirect-uri' ? <FiCheck size={16} /> : <FiCopy size={16} />}
											</CopyButton>
										</CredentialWrapper>
									</CredentialRow>

									{/* Advanced Configuration */}
									<div
										style={{
											backgroundColor: '#f8f9fa',
											border: '1px solid #e9ecef',
											borderRadius: 8,
											padding: '1rem',
											marginTop: '1rem',
										}}
									>
										<h4
											style={{
												marginTop: 0,
												marginBottom: '0.75rem',
												color: '#343a40',
											}}
										>
											Advanced Configuration
										</h4>

										<CredentialRow>
											<p>
												<strong>Req Object Policy:</strong>
											</p>
											<CredentialWrapper>
												<select
													value={credentials.advanced?.requestObjectPolicy || 'default'}
													onChange={(e) =>
														setCredentials((prev) => ({
															...prev,
															advanced: {
																...(prev.advanced || {}),
																requestObjectPolicy: e.target.value as RequestObjectPolicy,
															},
														}))
													}
													style={{
														width: '100%',
														padding: '0.5rem',
														border: '1px solid #dee2e6',
														borderRadius: 4,
														backgroundColor: '#ffffff',
													}}
												>
													<option value="default">default</option>
													<option value="require">require</option>
													<option value="allow_unsigned">allow_unsigned</option>
												</select>
											</CredentialWrapper>
										</CredentialRow>

										<CredentialRow>
											<p>
												<strong>x5t (JWT hdr):</strong>
											</p>
											<CredentialWrapper>
												<input
													type="text"
													placeholder="Base64URL thumbprint"
													value={credentials.clientAssertion?.x5t || ''}
													onChange={(e) =>
														setCredentials((prev) => ({
															...prev,
															clientAssertion: {
																...(prev.clientAssertion || {}),
																x5t: e.target.value,
															},
														}))
													}
													style={{
														width: '100%',
														padding: '0.5rem',
														border: '1px solid #dee2e6',
														borderRadius: 4,
														backgroundColor: '#ffffff',
													}}
												/>
											</CredentialWrapper>
										</CredentialRow>

										<CredentialRow>
											<p>
												<strong>OIDC Session Mgmt:</strong>
											</p>
											<CredentialWrapper>
												<label
													style={{
														display: 'inline-flex',
														alignItems: 'center',
														gap: '0.5rem',
													}}
												>
													<input
														type="checkbox"
														checked={!!credentials.advanced?.oidcSessionManagement}
														onChange={(e) =>
															setCredentials((prev) => ({
																...prev,
																advanced: {
																	...(prev.advanced || {}),
																	oidcSessionManagement: e.target.checked,
																},
															}))
														}
													/>
													Enable OP iframe monitoring
												</label>
											</CredentialWrapper>
										</CredentialRow>

										<CredentialRow>
											<p>
												<strong>Resource Scopes:</strong>
											</p>
											<CredentialWrapper>
												<input
													type="text"
													placeholder="openid profile email api://resource1 scope1 scope2"
													value={credentials.advanced?.resourceScopes || ''}
													onChange={(e) =>
														setCredentials((prev) => ({
															...prev,
															advanced: {
																...(prev.advanced || {}),
																resourceScopes: e.target.value,
															},
														}))
													}
													style={{
														width: '100%',
														padding: '0.5rem',
														border: '1px solid #dee2e6',
														borderRadius: 4,
														backgroundColor: '#ffffff',
													}}
												/>
											</CredentialWrapper>
										</CredentialRow>

										<CredentialRow>
											<p>
												<strong>Logout via ID Token:</strong>
											</p>
											<CredentialWrapper>
												<label
													style={{
														display: 'inline-flex',
														alignItems: 'center',
														gap: '0.5rem',
													}}
												>
													<input
														type="checkbox"
														checked={!!credentials.advanced?.terminateByIdToken}
														onChange={(e) =>
															setCredentials((prev) => ({
																...prev,
																advanced: {
																	...(prev.advanced || {}),
																	terminateByIdToken: e.target.checked,
																},
															}))
														}
													/>
													Use RP-initiated logout with id_token_hint
												</label>
											</CredentialWrapper>
										</CredentialRow>
									</div>

									<div
										style={{
											marginTop: '1.5rem',
											textAlign: 'center',
											display: 'flex',
											gap: '1rem',
											justifyContent: 'center',
											flexWrap: 'wrap',
										}}
									>
										<SubmitButton
											type="submit"
											disabled={isSavingCredentials}
											style={{ width: 'auto', padding: '0.75rem 2rem' }}
										>
											{isSavingCredentials ? (
												<>
													<Spinner size={16} />
													Saving...
												</>
											) : (
												<>
													<FiCheck />
													Save Credentials
												</>
											)}
										</SubmitButton>

										<SubmitButton
											onClick={handleLogin}
											disabled={isLoading}
											style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
										>
											{isLoading ? (
												<>
													<Spinner size={16} />
													Redirecting...
												</>
											) : (
												<>
													<FiLogIn />
													Login with PingOne
												</>
											)}
										</SubmitButton>
									</div>
								</form>
							</CredentialsBox>
						)}
					</PingOneSetupSection>
				</SetupSection>

				<DebugCredentials />
			</LoginLayout>

			{/* Authorization Request Modal */}
			<AuthorizationRequestModal
				isOpen={showRedirectModal}
				onClose={handleRedirectModalClose}
				onProceed={handleRedirectModalProceed}
				authorizationUrl={redirectUrl}
				requestParams={redirectParams}
			/>
		</LoginContainer>
	);
};

export default Login;
