/**
 * @file Login.PingUI.tsx
 * @module pages
 * @description Login page with PingOne UI styling
 * @version 1.0.0
 * @since 2026-02-22
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import packageJson from '../../package.json';
import AuthorizationRequestModal from '../components/AuthorizationRequestModal';
import CollapsibleSection from '../components/CollapsibleSection';
import DebugCredentials from '../components/DebugCredentials';
import Spinner from '../components/Spinner';
import { useAuth } from '../contexts/NewAuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { usePageScroll } from '../hooks/usePageScroll';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { getCallbackUrlForFlow } from '../utils/callbackUrls';
import { EnvironmentIdServiceV8 } from '../v8/services/environmentIdServiceV8';
import { SharedCredentialsServiceV8 } from '../v8/services/sharedCredentialsServiceV8';

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

// MDI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 20, ariaLabel, className = '', style }) => {
	const iconMap: Record<string, string> = {
		FiAlertCircle: 'mdi-alert-circle',
		FiCheck: 'mdi-check',
		FiCheckCircle: 'mdi-check-circle',
		FiCopy: 'mdi-content-copy',
		FiEdit: 'mdi-pencil',
		FiEye: 'mdi-eye',
		FiEyeOff: 'mdi-eye-off',
		FiKey: 'mdi-key',
		FiLock: 'mdi-lock',
		FiLogIn: 'mdi-login',
		FiSettings: 'mdi-cog',
		FiChevronDown: 'mdi-chevron-down',
		FiChevronUp: 'mdi-chevron-up',
		FiRefreshCw: 'mdi-refresh',
		FiDownload: 'mdi-download',
		FiExternalLink: 'mdi-open-in-new',
	};

	const iconClass = iconMap[icon] || icon;
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<span
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			title={ariaLabel}
			aria-hidden={!ariaLabel}
		/>
	);
};

// Main Component
const LoginPingUI: React.FC = () => {
	const { login, isAuthenticated, user } = useAuth();
	const { showSuccess, showError } = useNotifications();
	const { scrollToTopAfterAction } = usePageScroll();
	const location = useLocation();

	const [formData, setFormData] = useState({
		clientId: '',
		clientSecret: '',
		environmentId: '',
		redirectUri: '',
		scopes: 'openid profile email',
	});

	const [showSecret, setShowSecret] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [debugMode, setDebugMode] = useState(false);

	const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
		requestObjectPolicy: 'default',
		oidcSessionManagement: false,
		resourceScopes: '',
		terminateByIdToken: false,
	});

	const [clientAssertion, setClientAssertion] = useState<ClientAssertion>({
		hmacAlg: 'HS256',
		signAlg: 'RS256',
		privateKeyPEM: '',
		kid: '',
		audience: '',
		x5t: '',
	});

	// Load saved credentials on mount
	useEffect(() => {
		const savedCredentials = SharedCredentialsServiceV8.loadSharedCredentialsSync();
		if (savedCredentials) {
			setFormData({
				clientId: savedCredentials.clientId || '',
				clientSecret: savedCredentials.clientSecret || '',
				environmentId: savedCredentials.environmentId || '',
				redirectUri: getCallbackUrlForFlow('authorization_code'), // Use default since not in shared credentials
				scopes: 'openid profile email', // Use default since not in shared credentials
			});
		}

		// Load environment ID from service
		const envId = EnvironmentIdServiceV8.getEnvironmentId();
		if (envId && !formData.environmentId) {
			setFormData(prev => ({ ...prev, environmentId: envId }));
		}
	}, []);

	const handleInputChange = (field: keyof typeof formData, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		if (error) setError('');
	};

	const handleAdvancedSettingChange = (field: keyof AdvancedSettings, value: any) => {
		setAdvancedSettings(prev => ({ ...prev, [field]: value }));
	};

	const handleClientAssertionChange = (field: keyof ClientAssertion, value: string) => {
		setClientAssertion(prev => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		try {
			// Validate required fields
			if (!formData.clientId || !formData.environmentId) {
				throw new Error('Client ID and Environment ID are required');
			}

			// Save credentials
			SharedCredentialsServiceV8.saveSharedCredentialsSync({
				clientId: formData.clientId,
				clientSecret: formData.clientSecret,
				environmentId: formData.environmentId,
			});

			// Save environment ID
			EnvironmentIdServiceV8.saveEnvironmentId(formData.environmentId);

			// Attempt login
			await login({
				clientId: formData.clientId,
				clientSecret: formData.clientSecret,
				environmentId: formData.environmentId,
			});

			showSuccess('Successfully logged in!');

		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Login failed';
			setError(errorMessage);
			showError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			showSuccess(`${label} copied to clipboard!`);
		} catch (err) {
			showError('Failed to copy to clipboard');
		}
	};

	const generateAuthUrl = () => {
		const params = new URLSearchParams({
			response_type: 'code',
			client_id: formData.clientId,
			redirect_uri: formData.redirectUri,
			scope: formData.scopes,
			state: Math.random().toString(36).substring(7),
		});

		if (formData.environmentId) {
			params.append('environment_id', formData.environmentId);
		}

		return `https://auth.pingone.com/${formData.environmentId}/as/authorize?${params.toString()}`;
	};

	if (isAuthenticated && user) {
		return (
			<div className="end-user-nano">
				<style>
					{`
						.login-success {
							max-width: 600px;
							margin: 0 auto;
							padding: var(--ping-spacing-xl, 3rem);
							text-align: center;
							font-family: var(--ping-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
						}

						.login-success .success-icon {
							font-size: 4rem;
							color: var(--ping-color-success, #10b981);
							margin-bottom: var(--ping-spacing-lg, 1.5rem);
						}

						.login-success h1 {
							font-size: var(--ping-font-size-2xl, 2rem);
							color: var(--ping-text-primary, #1a1a1a);
							margin-bottom: var(--ping-spacing-md, 1rem);
						}

						.login-success p {
							font-size: var(--ping-font-size-base, 1rem);
							color: var(--ping-text-secondary, #666);
							margin-bottom: var(--ping-spacing-lg, 1.5rem);
						}

						.login-success .user-info {
							background: var(--ping-surface-secondary, #f8fafc);
							border: 1px solid var(--ping-border-light, #e5e7eb);
							border-radius: var(--ping-radius-lg, 0.75rem);
							padding: var(--ping-spacing-lg, 1.5rem);
							margin-bottom: var(--ping-spacing-lg, 1.5rem);
						}

						.login-success .logout-btn {
							background: var(--ping-color-primary, #3b82f6);
							color: var(--ping-color-white, #ffffff);
							border: none;
							border-radius: var(--ping-radius-md, 0.5rem);
							padding: var(--ping-spacing-sm, 0.75rem) var(--ping-spacing-lg, 1.5rem);
							font-size: var(--ping-font-size-base, 1rem);
							font-weight: var(--ping-font-weight-medium, 500);
							cursor: pointer;
							transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
						}

						.login-success .logout-btn:hover {
							background: var(--ping-color-primary-dark, #2563eb);
							transform: translateY(-1px);
						}
					`}
				</style>

				<div className="login-success">
					<CollapsibleHeader title="Login Success">Login Success</CollapsibleHeader>
					
					<div className="success-icon">
						<MDIIcon icon="FiCheckCircle" size={64} ariaLabel="Success" />
					</div>

					<h1>Welcome Back!</h1>
					<p>You are successfully logged in to the MasterFlow API platform.</p>

					<div className="user-info">
						<h3>User Information</h3>
						<p><strong>Client ID:</strong> {user.clientId}</p>
						<p><strong>Environment:</strong> {user.environmentId}</p>
						<p><strong>Version:</strong> {packageJson.version}</p>
					</div>

					<button
						type="button"
						className="logout-btn"
						onClick={() => window.location.href = '/logout'}
					>
						<MDIIcon icon="FiLogIn" size={16} ariaLabel="Logout" />
						Logout
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="end-user-nano">
			<style>
				{`
					.login-pingui {
						max-width: 800px;
						margin: 0 auto;
						padding: var(--ping-spacing-lg, 1.5rem);
						font-family: var(--ping-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
					}

					.login-pingui .form-container {
						background: var(--ping-surface-primary, #ffffff);
						border: 1px solid var(--ping-border-light, #e5e7eb);
						border-radius: var(--ping-radius-lg, 0.75rem);
						padding: var(--ping-spacing-xl, 2rem);
						box-shadow: var(--ping-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
					}

					.login-pingui .form-title {
						font-size: var(--ping-font-size-2xl, 2rem);
						font-weight: var(--ping-font-weight-bold, 700);
						color: var(--ping-text-primary, #1a1a1a);
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
						text-align: center;
					}

					.login-pingui .form-group {
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
					}

					.login-pingui label {
						display: block;
						font-size: var(--ping-font-size-sm, 0.875rem);
						font-weight: var(--ping-font-weight-medium, 500);
						color: var(--ping-text-primary, #1a1a1a);
						margin-bottom: var(--ping-spacing-xs, 0.25rem);
					}

					.login-pingui input {
						width: 100%;
						padding: var(--ping-spacing-sm, 0.75rem) var(--ping-spacing-md, 1rem);
						border: 1px solid var(--ping-border-primary, #d1d5db);
						border-radius: var(--ping-radius-md, 0.5rem);
						font-size: var(--ping-font-size-base, 1rem);
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.login-pingui input:focus {
						outline: none;
						border-color: var(--ping-color-primary, #3b82f6);
						box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
					}

					.login-pingui .input-group {
						position: relative;
					}

					.login-pingui .input-group button {
						position: absolute;
						right: var(--spacing-xs, 0.25rem);
						top: 50%;
						transform: translateY(-50%);
						background: none;
						border: none;
						padding: var(--ping-spacing-sm, 0.5rem);
						cursor: pointer;
						color: var(--ping-text-secondary, #666);
						transition: color var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.login-pingui .input-group button:hover {
						color: var(--ping-text-primary, #1a1a1a);
					}

					.login-pingui .btn-primary {
						width: 100%;
						background: var(--ping-color-primary, #3b82f6);
						color: var(--ping-color-white, #ffffff);
						border: none;
						border-radius: var(--ping-radius-md, 0.5rem);
						padding: var(--ping-spacing-md, 1rem) var(--ping-spacing-lg, 1.5rem);
						font-size: var(--ping-font-size-base, 1rem);
						font-weight: var(--ping-font-weight-medium, 500);
						cursor: pointer;
						transition: all var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
						display: flex;
						align-items: center;
						justify-content: center;
						gap: var(--ping-spacing-sm, 0.5rem);
					}

					.login-pingui .btn-primary:hover:not(:disabled) {
						background: var(--ping-color-primary-dark, #2563eb);
						transform: translateY(-1px);
					}

					.login-pingui .btn-primary:disabled {
						opacity: 0.6;
						cursor: not-allowed;
					}

					.login-pingui .error-message {
						background: var(--ping-color-error-light, #fef2f2);
						border: 1px solid var(--ping-color-error, #ef4444);
						color: var(--ping-color-error, #ef4444);
						padding: var(--ping-spacing-sm, 0.75rem);
						border-radius: var(--ping-radius-md, 0.5rem);
						margin-bottom: var(--ping-spacing-lg, 1.5rem);
						font-size: var(--ping-font-size-sm, 0.875rem);
					}

					.login-pingui .advanced-toggle {
						background: none;
						border: none;
						color: var(--ping-color-primary, #3b82f6);
						cursor: pointer;
						font-size: var(--ping-font-size-sm, 0.875rem);
						font-weight: var(--ping-font-weight-medium, 500);
						display: flex;
						align-items: center;
						gap: var(--ping-spacing-xs, 0.25rem);
						transition: color var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.login-pingui .advanced-toggle:hover {
						color: var(--ping-color-primary-dark, #2563eb);
					}

					.login-pingui .copy-button {
						background: none;
						border: none;
						padding: var(--ping-spacing-xs, 0.25rem);
						cursor: pointer;
						color: var(--ping-text-secondary, #666);
						transition: color var(--ping-transition-duration, 0.15s) var(--ping-transition-easing, ease-in-out);
					}

					.login-pingui .copy-button:hover {
						color: var(--ping-color-primary, #3b82f6);
					}

					@media (max-width: 768px) {
						.login-pingui {
							padding: var(--ping-spacing-md, 1rem);
						}

						.login-pingui .form-container {
							padding: var(--ping-spacing-lg, 1.5rem);
						}
					}
				`}
			</style>

			<div className="login-pingui">
				<CollapsibleHeader title="Login">Login</CollapsibleHeader>
				
				<div className="form-container">
					<h1 className="form-title">MasterFlow API Login</h1>

					{error && (
						<div className="error-message">
							<MDIIcon icon="FiAlertCircle" size={16} ariaLabel="Error" />
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit}>
						<div className="form-group">
							<label htmlFor="clientId">Client ID *</label>
							<input
								id="clientId"
								type="text"
								value={formData.clientId}
								onChange={(e) => handleInputChange('clientId', e.target.value)}
								placeholder="Enter your PingOne Client ID"
								required
							/>
						</div>

						<div className="form-group">
							<label htmlFor="clientSecret">Client Secret</label>
							<div className="input-group">
								<input
									id="clientSecret"
									type={showSecret ? 'text' : 'password'}
									value={formData.clientSecret}
									onChange={(e) => handleInputChange('clientSecret', e.target.value)}
									placeholder="Enter your Client Secret"
								/>
								<button
									type="button"
									onClick={() => setShowSecret(!showSecret)}
									aria-label={showSecret ? 'Hide secret' : 'Show secret'}
								>
									<MDIIcon icon={showSecret ? 'FiEyeOff' : 'FiEye'} size={16} />
								</button>
							</div>
						</div>

						<div className="form-group">
							<label htmlFor="environmentId">Environment ID *</label>
							<input
								id="environmentId"
								type="text"
								value={formData.environmentId}
								onChange={(e) => handleInputChange('environmentId', e.target.value)}
								placeholder="Enter your PingOne Environment ID"
								required
							/>
						</div>

						<div className="form-group">
							<label htmlFor="redirectUri">Redirect URI</label>
							<input
								id="redirectUri"
								type="url"
								value={formData.redirectUri}
								onChange={(e) => handleInputChange('redirectUri', e.target.value)}
								placeholder="https://your-domain.com/callback"
							/>
						</div>

						<div className="form-group">
							<label htmlFor="scopes">Scopes</label>
							<input
								id="scopes"
								type="text"
								value={formData.scopes}
								onChange={(e) => handleInputChange('scopes', e.target.value)}
								placeholder="openid profile email"
							/>
						</div>

						<button
							type="button"
							className="advanced-toggle"
							onClick={() => setShowAdvanced(!showAdvanced)}
						>
							<MDIIcon icon={showAdvanced ? 'FiChevronUp' : 'FiChevronDown'} size={16} />
							{showAdvanced ? 'Hide' : 'Show'} Advanced Settings
						</button>

						{showAdvanced && (
							<div className="form-group">
								<CollapsibleSection title="Advanced Configuration">
									<div className="form-group">
										<label>Request Object Policy</label>
										<select
											value={advancedSettings.requestObjectPolicy}
											onChange={(e) => handleAdvancedSettingChange('requestObjectPolicy', e.target.value)}
											style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem' }}
										>
											<option value="default">Default</option>
											<option value="require">Require</option>
											<option value="allow_unsigned">Allow Unsigned</option>
										</select>
									</div>

									<div className="form-group">
										<label>
											<input
												type="checkbox"
												checked={advancedSettings.oidcSessionManagement}
												onChange={(e) => handleAdvancedSettingChange('oidcSessionManagement', e.target.checked)}
												style={{ marginRight: '0.5rem' }}
											/>
											OIDC Session Management
										</label>
									</div>

									<div className="form-group">
										<label htmlFor="resourceScopes">Resource Scopes</label>
										<input
											id="resourceScopes"
											type="text"
											value={advancedSettings.resourceScopes}
											onChange={(e) => handleAdvancedSettingChange('resourceScopes', e.target.value)}
											placeholder="api:read api:write"
										/>
									</div>
								</CollapsibleSection>
							</div>
						)}

						<button
							type="submit"
							className="btn-primary"
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<Spinner size={16} />
									Logging in...
								</>
							) : (
								<>
									<MDIIcon icon="FiLogIn" size={16} ariaLabel="Login" />
									Login
								</>
							)}
						</button>
					</form>

					<div style={{ marginTop: '2rem', textAlign: 'center' }}>
						<button
							type="button"
							className="advanced-toggle"
							onClick={() => setShowAuthModal(true)}
						>
							<MDIIcon icon="FiExternalLink" size={16} />
							Generate Authorization URL
						</button>
					</div>

					{debugMode && (
						<DebugCredentials
							credentials={formData}
							onUpdate={setFormData}
						/>
					)}
				</div>

				{showAuthModal && (
					<AuthorizationRequestModal
						authUrl={generateAuthUrl()}
						onClose={() => setShowAuthModal(false)}
					/>
				)}
			</div>
		</div>
	);
};

export default LoginPingUI;
