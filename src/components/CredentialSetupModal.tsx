import React, { useEffect, useState } from 'react';
import { FiEye, FiEyeOff, FiLoader, FiLock } from 'react-icons/fi';
import styled from 'styled-components';
import { credentialManager } from '../utils/credentialManager';
import StandardMessage from './StandardMessage';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid #e5e7eb;
`;

const ModalHeader = styled.div`
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;

  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  p {
    margin: 0;
    color: #6b7280;
    font-size: 1rem;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
    font-size: 0.9rem;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    &::placeholder {
      color: #9ca3af;
    }

    &.is-invalid {
      border-color: #ef4444;
    }
  }

  .form-text {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: #6b7280;
  }

  .invalid-feedback {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: #ef4444;
  }
`;

const ModalFooter = styled.div`
  padding: 1rem 2rem 2rem;
  border-top: 1px solid #e5e7eb;
  text-align: right;
`;

const SaveButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: white;
  background-color: #10b981;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #059669;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const CancelButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  color: #6b7280;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  margin-right: 0.75rem;

  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const SecretInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  max-width: 600px;

  input {
    padding-right: 3rem;
    font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
    font-size: 0.875rem;
  }

  .toggle-button {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #6c757d;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      background-color: #f8f9fa;
      color: #0070CC;
    }

    &:active {
      transform: translateY(-50%) scale(0.95);
    }

    svg {
      transition: all 0.2s;
    }
  }
`;

interface CredentialSetupModalProps {
	isOpen: boolean;
	onClose: () => void;
	// biome-ignore lint/suspicious/noExplicitAny: Credentials can be various types depending on flow
	onSave?: (credentials: any) => void;
	flowType?: string;
}

const CredentialSetupModal: React.FC<CredentialSetupModalProps> = ({
	isOpen,
	onClose,
	onSave,
	flowType: _flowType,
}) => {
	const [formData, setFormData] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: `${window.location.origin}/authz-callback`,
	});

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(false);
	const [showSecret, setShowSecret] = useState(false);
	const [saveStatus, setSaveStatus] = useState<{
		type: 'success' | 'danger';
		title: string;
		message: string;
	} | null>(null);
	const [hasBeenSaved, setHasBeenSaved] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [originalFormData, setOriginalFormData] = useState<typeof formData | null>(null);

	// Handle escape key to close modal
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
			return () => document.removeEventListener('keydown', handleEscape);
		}
	}, [isOpen, onClose]);

	// Load credentials from environment variables
	const loadFromEnvironmentVariables = async () => {
		try {
			console.log(' [CredentialSetupModal] Loading credentials from environment variables...');

			const response = await fetch('/api/env-config');
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const envConfig = await response.json();
			console.log(' [CredentialSetupModal] Loaded from environment config:', envConfig);

			// Pre-populate form with environment variables
			const newFormData = {
				environmentId: envConfig.environmentId || '',
				clientId: envConfig.clientId || '',
				clientSecret: envConfig.clientSecret || '', // Pre-populate client secret from .env
				redirectUri: envConfig.redirectUri || `${window.location.origin}/authz-callback`,
			};

			console.log(
				' [CredentialSetupModal] Setting form data from environment variables:',
				newFormData
			);
			setFormData(newFormData);
		} catch (error) {
			console.error(' [CredentialSetupModal] Failed to load from environment variables:', error);
			// Keep the default form data if environment loading fails
		}
	};

	// Load existing credentials from localStorage when modal opens
	useEffect(() => {
		if (isOpen) {
			console.log(
				' [CredentialSetupModal] Loading existing credentials from credential manager...'
			);

			// Debug: Check all localStorage keys
			console.log(' [CredentialSetupModal] All localStorage keys:', Object.keys(localStorage));
			console.log(
				' [CredentialSetupModal] pingone_permanent_credentials:',
				localStorage.getItem('pingone_permanent_credentials')
			);
			console.log(
				' [CredentialSetupModal] pingone_session_credentials:',
				localStorage.getItem('pingone_session_credentials')
			);
			console.log(
				' [CredentialSetupModal] pingone_config:',
				localStorage.getItem('pingone_config')
			);

			try {
				// Load credentials using the credential manager
				const allCredentials = credentialManager.getAllCredentials();

				// Also check the old pingone_config localStorage key for backward compatibility
				const oldConfig = localStorage.getItem('pingone_config');
				let oldCredentials = null;
				if (oldConfig) {
					try {
						oldCredentials = JSON.parse(oldConfig);
						console.log(' [CredentialSetupModal] Found old config:', oldCredentials);
					} catch (e) {
						console.log(' [CredentialSetupModal] Failed to parse old config:', e);
					}
				}

				console.log(' [CredentialSetupModal] Loaded credentials:', allCredentials);

				// Check if we have permanent credentials
				const hasPermanentCredentials = credentialManager.arePermanentCredentialsComplete();
				const hasSessionCredentials = !!allCredentials.clientSecret;

				const stored = {
					pingone_config: hasPermanentCredentials
						? {
								environmentId: allCredentials.environmentId,
								clientId: allCredentials.clientId,
								redirectUri: allCredentials.redirectUri,
							}
						: null,
					login_credentials: hasSessionCredentials
						? {
								clientSecret: allCredentials.clientSecret,
							}
						: null,
				};

				setStoredCredentials(stored);

				// Pre-populate form with existing credentials
				if (hasPermanentCredentials || hasSessionCredentials || oldCredentials) {
					console.log(' [CredentialSetupModal] Pre-populating form with existing credentials');
					const newFormData = {
						environmentId: allCredentials.environmentId || oldCredentials?.environmentId || '',
						clientId: allCredentials.clientId || oldCredentials?.clientId || '',
						clientSecret: allCredentials.clientSecret || oldCredentials?.clientSecret || '',
						redirectUri:
							allCredentials.redirectUri ||
							oldCredentials?.redirectUri ||
							`${window.location.origin}/authz-callback`,
					};
					console.log(' [CredentialSetupModal] Setting form data to:', newFormData);
					console.log(' [CredentialSetupModal] hasPermanentCredentials:', hasPermanentCredentials);
					console.log(' [CredentialSetupModal] hasSessionCredentials:', hasSessionCredentials);
					console.log(' [CredentialSetupModal] oldCredentials:', oldCredentials);
					setFormData(newFormData);
					setOriginalFormData(newFormData);
					setHasUnsavedChanges(false);
					setHasBeenSaved(false);
				} else {
					console.log(
						' [CredentialSetupModal] No existing credentials found, loading from environment variables...'
					);
					console.log(' [CredentialSetupModal] hasPermanentCredentials:', hasPermanentCredentials);
					console.log(' [CredentialSetupModal] hasSessionCredentials:', hasSessionCredentials);
					console.log(' [CredentialSetupModal] oldCredentials:', oldCredentials);

					// Load from environment variables as fallback
					loadFromEnvironmentVariables();
					setOriginalFormData(formData);
					setHasUnsavedChanges(false);
					setHasBeenSaved(false);
				}

				console.log(' [CredentialSetupModal] Form pre-populated with:', {
					environmentId: allCredentials.environmentId,
					hasClientId: !!allCredentials.clientId,
					hasClientSecret: !!allCredentials.clientSecret,
				});
			} catch (error) {
				console.error(' [CredentialSetupModal] Error loading existing credentials:', error);
			}
		}
	}, [
		isOpen,
		formData, // Load from environment variables as fallback
		loadFromEnvironmentVariables,
	]);

	// Debug form data changes
	useEffect(() => {
		console.log(' [CredentialSetupModal] Form data changed:', formData);
	}, [formData]);

	// Validate Environment ID format (more flexible for PingOne)
	const validateEnvironmentId = (envId: string): boolean => {
		// PingOne Environment IDs can be UUIDs or other formats
		// Just check that it's not empty and has reasonable length
		return envId.trim().length > 0 && envId.trim().length >= 8;
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		const newFormData = {
			...formData,
			[name]: value,
		};

		setFormData(newFormData);

		// Clear error when field is edited
		if (errors[name]) {
			setErrors((prev) => ({
				...prev,
				[name]: '',
			}));
		}

		// Check if form has been modified since last save
		if (originalFormData) {
			const hasChanges = Object.keys(newFormData).some(
				(key) =>
					newFormData[key as keyof typeof newFormData] !==
					originalFormData[key as keyof typeof originalFormData]
			);
			setHasUnsavedChanges(hasChanges);
			console.log(' [CredentialSetupModal] Form modified, unsaved changes:', hasChanges);
		}
	};

	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		console.log(' [CredentialSetupModal] Validating form data:', formData);

		if (!formData.environmentId) {
			newErrors.environmentId = 'Environment ID is required';
		} else if (!validateEnvironmentId(formData.environmentId)) {
			newErrors.environmentId = 'Environment ID must be at least 8 characters long';
		}

		if (!formData.clientId) {
			newErrors.clientId = 'Client ID is required';
		}

		if (!formData.redirectUri) {
			newErrors.redirectUri = 'Redirect URI is required';
		} else if (!/^https?:\/\//.test(formData.redirectUri)) {
			newErrors.redirectUri = 'Redirect URI must start with http:// or https://';
		}

		setErrors(newErrors);
		const isValid = Object.keys(newErrors).length === 0;
		console.log(' [CredentialSetupModal] Validation result:', { isValid, errors: newErrors });
		return isValid;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		console.log(' [CredentialSetupModal] Save button clicked', { formData, errors });

		if (!validateForm()) {
			console.log(' [CredentialSetupModal] Form validation failed', { errors });
			return;
		}

		console.log(' [CredentialSetupModal] Form validation passed, starting save...');
		setIsLoading(true);
		setSaveStatus(null);

		try {
			// Add minimum delay to ensure spinner is visible
			const minDelay = new Promise((resolve) => setTimeout(resolve, 500));

			// Save configuration credentials (Environment ID, Client ID, etc.)
			const permanentSuccess = credentialManager.saveConfigCredentials({
				environmentId: formData.environmentId,
				clientId: formData.clientId,
				redirectUri: formData.redirectUri,
				scopes: ['openid', 'profile', 'email'],
				authEndpoint: `https://auth.pingone.com/${formData.environmentId}/as/authorize`,
				tokenEndpoint: `https://auth.pingone.com/${formData.environmentId}/as/token`,
				userInfoEndpoint: `https://auth.pingone.com/${formData.environmentId}/as/userinfo`,
			});

			// Save session credentials (Client Secret)
			const sessionSuccess = credentialManager.saveSessionCredentials({
				clientSecret: formData.clientSecret,
			});

			if (!permanentSuccess || !sessionSuccess) {
				throw new Error('Failed to save credentials to credential manager');
			}

			// Dispatch events to notify other components that config has changed
			window.dispatchEvent(new CustomEvent('pingone-config-changed'));
			window.dispatchEvent(new CustomEvent('permanent-credentials-changed'));

			// Wait for minimum delay to ensure spinner is visible
			await minDelay;

			console.log(
				' [CredentialSetupModal] Configuration saved successfully to localStorage and events dispatched'
			);

			setSaveStatus({
				type: 'success',
				title: 'Configuration saved!',
				message: 'Your PingOne credentials have been configured successfully.',
			});

			// Mark as saved and update original form data
			setHasBeenSaved(true);
			setHasUnsavedChanges(false);
			setOriginalFormData({ ...formData });

			console.log(' [CredentialSetupModal] Form marked as saved, Save button will be disabled');

			// Call onSave callback if provided
			if (onSave) {
				onSave(formData);
			}

			// Auto-close after success
			setTimeout(() => {
				console.log(' [CredentialSetupModal] Auto-closing modal after successful save');
				onClose();
			}, 1500);
		} catch (error) {
			console.error('Failed to save configuration:', error);
			setSaveStatus({
				type: 'danger',
				title: 'Configuration failed',
				message: 'Failed to save your configuration. Please try again.',
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		onClose();
	};

	if (!isOpen) {
		return null;
	}

	return (
		<ModalOverlay>
			<ModalContent>
				<ModalHeader>
					<h2>
						<FiLock />
						Setup PingOne Credentials
					</h2>
					<p>Configure your PingOne environment to get started with the OAuth Playground</p>
				</ModalHeader>

				<ModalBody>
					{saveStatus && (
						<StandardMessage
							type={saveStatus.type === 'danger' ? 'error' : saveStatus.type}
							title={saveStatus.title}
							message={saveStatus.message}
						/>
					)}

					{/* Current localStorage Status */}
					<div
						style={{
							marginBottom: '2rem',
							padding: '1rem',
							backgroundColor: '#f8f9fa',
							borderRadius: '6px',
							border: '1px solid #dee2e6',
						}}
					>
						<h4
							style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#495057' }}
						>
							Current Stored Credentials
						</h4>
						<div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
							<div style={{ marginBottom: '0.25rem' }}>
								<strong>Permanent Credentials:</strong>{' '}
								{credentialManager.arePermanentCredentialsComplete() ? (
									<span style={{ color: '#28a745' }}> Complete</span>
								) : (
									<span style={{ color: '#dc3545' }}> Missing</span>
								)}
							</div>
							<div style={{ marginBottom: '0.25rem' }}>
								<strong>Session Credentials:</strong>{' '}
								{credentialManager.getAllCredentials().clientSecret ? (
									<span style={{ color: '#28a745' }}> Present</span>
								) : (
									<span style={{ color: '#dc3545' }}> Missing</span>
								)}
							</div>
							<div style={{ marginBottom: '0.25rem', fontSize: '0.8rem', color: '#6c757d' }}>
								<strong>Status:</strong> {credentialManager.getCredentialsStatus().overall}
							</div>
							{credentialManager.arePermanentCredentialsComplete() && (
								<div
									style={{
										marginTop: '0.5rem',
										padding: '0.5rem',
										backgroundColor: 'white',
										borderRadius: '4px',
										border: '1px solid #dee2e6',
									}}
								>
									<div>
										<strong>Environment ID:</strong>{' '}
										{credentialManager.getAllCredentials().environmentId || 'Not set'}
									</div>
									<div>
										<strong>Client ID:</strong>{' '}
										{credentialManager.getAllCredentials().clientId
											? `${credentialManager.getAllCredentials().clientId.substring(0, 12)}...`
											: 'Not set'}
									</div>
									<div>
										<strong>Client Secret:</strong>{' '}
										{credentialManager.getAllCredentials().clientSecret ? '' : 'Not set'}
									</div>
								</div>
							)}
						</div>
					</div>

					<form onSubmit={handleSubmit}>
						<FormGroup>
							<label htmlFor="environmentId">Environment ID *</label>
							<input
								type="text"
								id="environmentId"
								name="environmentId"
								value={formData.environmentId}
								onChange={handleChange}
								placeholder="e.g., abc12345-6789-4abc-def0-1234567890ab"
								className={errors.environmentId ? 'is-invalid' : ''}
								disabled={isLoading}
							/>
							{errors.environmentId && (
								<div className="invalid-feedback">{errors.environmentId}</div>
							)}
							<div className="form-text">Your PingOne Environment ID from the Admin Console</div>
						</FormGroup>

						<FormGroup>
							<label htmlFor="clientId">Client ID *</label>
							<input
								type="text"
								id="clientId"
								name="clientId"
								value={formData.clientId}
								onChange={handleChange}
								placeholder="Enter your application's Client ID"
								className={errors.clientId ? 'is-invalid' : ''}
								disabled={isLoading}
							/>
							{errors.clientId && <div className="invalid-feedback">{errors.clientId}</div>}
							<div className="form-text">The Client ID of your PingOne application</div>
						</FormGroup>

						<FormGroup>
							<label htmlFor="clientSecret">Client Secret</label>
							<SecretInputContainer>
								<input
									type={showSecret ? 'text' : 'password'}
									id="clientSecret"
									name="clientSecret"
									value={formData.clientSecret}
									onChange={handleChange}
									placeholder="Enter your application's Client Secret (optional)"
									disabled={isLoading}
								/>
								<button
									type="button"
									className="toggle-button"
									onClick={() => setShowSecret(!showSecret)}
									disabled={isLoading}
									aria-label={showSecret ? 'Hide client secret' : 'Show client secret'}
									title={showSecret ? 'Hide client secret' : 'Show client secret'}
								>
									{showSecret ? <FiEyeOff size={18} /> : <FiEye size={18} />}
								</button>
							</SecretInputContainer>
							<div className="form-text">Only required for confidential clients</div>
						</FormGroup>

						<FormGroup>
							<label htmlFor="redirectUri">Callback URL *</label>
							<input
								type="url"
								id="redirectUri"
								name="redirectUri"
								value={formData.redirectUri}
								onChange={handleChange}
								className={errors.redirectUri ? 'is-invalid' : ''}
								disabled={isLoading}
								placeholder="https://localhost:3000/authz-callback"
							/>
							{errors.redirectUri && <div className="invalid-feedback">{errors.redirectUri}</div>}
							<div className="form-text">
								Must match the redirect URI configured in your PingOne application
							</div>
						</FormGroup>

						<FormGroup>
							<label htmlFor="authEndpoint">Authorization Endpoint</label>
							<input
								type="url"
								id="authEndpoint"
								name="authEndpoint"
								value={
									formData.environmentId
										? `https://auth.pingone.com/${formData.environmentId}/as/authorize`
										: ''
								}
								readOnly
								disabled
								style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
							/>
							<div className="form-text">Auto-generated from Environment ID</div>
						</FormGroup>

						<FormGroup>
							<label htmlFor="scopes">Scopes</label>
							<input
								type="text"
								id="scopes"
								name="scopes"
								value="openid profile email"
								readOnly
								disabled
								style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
							/>
							<div className="form-text">Standard OAuth scopes for user authentication</div>
						</FormGroup>

						<FormGroup>
							<label htmlFor="responseType">Response Type</label>
							<select
								id="responseType"
								name="responseType"
								value="code"
								disabled
								style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
							>
								<option value="code">code (Authorization Code Flow)</option>
							</select>
							<div className="form-text">OAuth response type for authorization code flow</div>
						</FormGroup>
					</form>
				</ModalBody>

				<ModalFooter>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							width: '100%',
						}}
					>
						<label
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								fontSize: '0.875rem',
								color: '#6b7280',
								cursor: 'pointer',
							}}
						>
							<input
								type="checkbox"
								style={{
									margin: 0,
									cursor: 'pointer',
								}}
								onChange={(e) => {
									// Store the preference in localStorage
									if (e.target.checked) {
										localStorage.setItem('skip_startup_credentials_modal', 'true');
										console.log(
											' [CredentialSetupModal] User chose to skip startup credentials modal'
										);
									} else {
										localStorage.removeItem('skip_startup_credentials_modal');
										console.log(' [CredentialSetupModal] User will see startup credentials modal');
									}
								}}
							/>
							Do not show again
						</label>

						<div style={{ display: 'flex', gap: '0.75rem' }}>
							<CancelButton onClick={handleCancel} disabled={isLoading}>
								Cancel
							</CancelButton>
							<SaveButton
								onClick={handleSubmit}
								disabled={isLoading || (hasBeenSaved && !hasUnsavedChanges)}
								style={{
									opacity: hasBeenSaved && !hasUnsavedChanges ? 0.5 : 1,
									cursor: hasBeenSaved && !hasUnsavedChanges ? 'not-allowed' : 'pointer',
								}}
							>
								{isLoading ? (
									<>
										<FiLoader className="animate-spin" />
										Saving...
									</>
								) : hasBeenSaved && !hasUnsavedChanges ? (
									'Saved'
								) : (
									'Save Configuration'
								)}
							</SaveButton>
						</div>
					</div>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	);
};

export default CredentialSetupModal;
