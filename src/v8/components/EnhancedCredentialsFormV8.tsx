/**
 * @file EnhancedCredentialsFormV8.tsx
 * @module v8/components
 * @description Enhanced credentials form with comprehensive user interaction tracking
 * @version 1.0.0
 * @since 2026-02-15
 *
 * Features:
 * - Multi-storage backend support (IndexedDB, SQLite, localStorage)
 * - Comprehensive user interaction tracking
 * - Real-time validation with error tracking
 * - Performance monitoring
 * - Auto-save functionality
 * - Storage backend status display
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiActivity,
	FiAlertTriangle,
	FiCheckCircle,
	FiClock,
	FiDatabase,
	FiHardDrive,
	FiSave,
} from 'react-icons/fi';
import styled from 'styled-components';
import { useEnhancedCredentialsTracking } from '../hooks/useEnhancedCredentialsTracking';
import { EnhancedCredentialsServiceV8 } from '../services/enhancedCredentialsServiceV8';

const _MODULE_TAG = '[📋 ENHANCED-CREDENTIALS-FORM-V8]';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const FormContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const FormHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const FormTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const FormSubtitle = styled.p`
  color: #6b7280;
  font-size: 1rem;
`;

const StorageStatus = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const StorageBackend = styled.div<{ status: 'available' | 'unavailable' | 'active' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  background: ${({ status }) => {
		switch (status) {
			case 'available':
				return '#f0fdf4';
			case 'unavailable':
				return '#fef2f2';
			case 'active':
				return '#dbeafe';
			default:
				return '#f9fafb';
		}
	}};
  color: ${({ status }) => {
		switch (status) {
			case 'available':
				return '#166534';
			case 'unavailable':
				return '#991b1b';
			case 'active':
				return '#1e40af';
			default:
				return '#6b7280';
		}
	}};
  border: 1px solid ${({ status }) => {
		switch (status) {
			case 'available':
				return '#bbf7d0';
			case 'unavailable':
				return '#fecaca';
			case 'active':
				return '#bfdbfe';
			default:
				return '#e5e7eb';
		}
	}};
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const FormLabel = styled.label`
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:invalid {
    border-color: #ef4444;
  }

  &:disabled {
    background-color: #f9fafb;
    cursor: not-allowed;
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  background-color: white;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${({ variant = 'primary' }) => {
		switch (variant) {
			case 'primary':
				return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
          &:disabled { background: #9ca3af; cursor: not-allowed; }
        `;
			case 'secondary':
				return `
          background: #6b7280;
          color: white;
          &:hover { background: #4b5563; }
          &:disabled { background: #9ca3af; cursor: not-allowed; }
        `;
			case 'danger':
				return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; }
          &:disabled { background: #9ca3af; cursor: not-allowed; }
        `;
			default:
				return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
		}
	}}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatsPanel = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const StatsTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const StatItem = styled.div`
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
`;

const StatValue = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SuccessMessage = styled.div`
  padding: 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  color: #166534;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface EnhancedCredentialsFormV8Props {
	environmentId: string;
	appName?: string;
	flowType?: string;
	onCredentialsChange?: (credentials: Record<string, any>) => void;
}

export const EnhancedCredentialsFormV8: React.FC<EnhancedCredentialsFormV8Props> = ({
	environmentId,
	appName = 'OAuth Playground',
	flowType = 'oauth',
	onCredentialsChange,
}) => {
	// Form state
	const [credentials, setCredentials] = useState({
		clientId: '',
		clientSecret: '',
		issuerUrl: '',
		redirectUri: '',
		scopes: 'openid profile email',
		clientAuthMethod: 'client_secret_post' as const,
		responseType: 'code',
	});

	const [storageBackends, setStorageBackends] = useState<
		Array<{ name: string; available: boolean }>
	>([]);
	const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
	const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

	// Initialize tracking hook
	const tracking = useEnhancedCredentialsTracking({
		environmentId,
		appName,
		flowType,
		clientId: credentials.clientId || 'unknown',
		autoSave: true,
		autoSaveDelay: 2000,
		trackPerformance: true,
	});

	// Load storage backend status
	useEffect(() => {
		const loadBackendStatus = async () => {
			try {
				const backends = await EnhancedCredentialsServiceV8.getBackendStatus();
				setStorageBackends(backends.map((b) => ({ name: b.name, available: b.available })));
			} catch (error) {
				console.error('Failed to load backend status:', error);
			}
		};

		loadBackendStatus();
	}, []);

	// Load existing credentials
	useEffect(() => {
		const loadCredentials = async () => {
			try {
				const existing = await tracking.loadCredentials();
				if (existing) {
					setCredentials({
						clientId: existing.clientId || '',
						clientSecret: existing.clientSecret || '',
						issuerUrl: existing.issuerUrl || '',
						redirectUri: existing.redirectUri || '',
						scopes: existing.scopes || 'openid profile email',
						clientAuthMethod: existing.clientAuthMethod || 'client_secret_post',
						responseType: existing.responseType || 'code',
					});
				}
			} catch (error) {
				console.error('Failed to load credentials:', error);
			}
		};

		loadCredentials();
	}, [tracking]);

	// Field change handler with tracking
	const handleFieldChange = useCallback(
		(fieldName: string, value: string, validate = false) => {
			setCredentials((prev) => ({ ...prev, [fieldName]: value }));

			// Track field interaction
			tracking.trackFieldInteraction(fieldName, 'change', value);

			// Validate field if requested
			if (validate) {
				validateField(fieldName, value);
			}

			// Notify parent
			if (onCredentialsChange) {
				onCredentialsChange({ ...credentials, [fieldName]: value });
			}
		},
		[tracking, credentials, onCredentialsChange, validateField]
	);

	// Field focus/blur handlers
	const handleFieldFocus = useCallback(
		(fieldName: string) => {
			tracking.trackFieldInteraction(fieldName, 'focus');
		},
		[tracking]
	);

	const handleFieldBlur = useCallback(
		(fieldName: string, value: string) => {
			tracking.trackFieldInteraction(fieldName, 'blur', value);
			validateField(fieldName, value);
		},
		[tracking, validateField]
	);

	// Validation
	const validateField = useCallback(
		(fieldName: string, value: string) => {
			const errors: Record<string, string> = {};

			switch (fieldName) {
				case 'clientId':
					if (!value.trim()) {
						errors.clientId = 'Client ID is required';
					} else if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
						errors.clientId = 'Client ID contains invalid characters';
					}
					break;
				case 'issuerUrl':
					if (value && !value.startsWith('https://')) {
						errors.issuerUrl = 'Issuer URL must start with https://';
					}
					break;
				case 'redirectUri':
					if (value && !value.startsWith('https://') && !value.startsWith('http://localhost')) {
						errors.redirectUri = 'Redirect URI must be HTTPS or localhost';
					}
					break;
			}

			// Update validation errors
			setValidationErrors((prev) => {
				const newErrors = { ...prev };
				if (errors[fieldName]) {
					newErrors[fieldName] = errors[fieldName];
					tracking.trackValidation(fieldName, false, errors[fieldName]);
				} else {
					delete newErrors[fieldName];
					tracking.trackValidation(fieldName, true);
				}
				return newErrors;
			});
		},
		[tracking]
	);

	// Dropdown selection tracking
	const handleDropdownChange = useCallback(
		(dropdownId: string, value: string, text: string) => {
			tracking.trackDropdownSelection(dropdownId, value, text);
		},
		[tracking]
	);

	// Save credentials
	const handleSave = useCallback(async () => {
		setSaveStatus('saving');

		try {
			const result = await tracking.saveCredentials(credentials);

			if (result.success) {
				setSaveStatus('saved');
				setTimeout(() => setSaveStatus('idle'), 3000);
			} else {
				setSaveStatus('error');
			}
		} catch (error) {
			setSaveStatus('error');
			console.error('Save failed:', error);
		}
	}, [tracking, credentials]);

	// Load credentials
	const handleLoad = useCallback(async () => {
		try {
			const loaded = await tracking.loadCredentials();
			if (loaded) {
				setCredentials({
					clientId: loaded.clientId || '',
					clientSecret: loaded.clientSecret || '',
					issuerUrl: loaded.issuerUrl || '',
					redirectUri: loaded.redirectUri || '',
					scopes: loaded.scopes || 'openid profile email',
					clientAuthMethod: loaded.clientAuthMethod || 'client_secret_post',
					responseType: loaded.responseType || 'code',
				});
			}
		} catch (error) {
			console.error('Load failed:', error);
		}
	}, [tracking]);

	// Clear credentials
	const handleClear = useCallback(async () => {
		try {
			await EnhancedCredentialsServiceV8.clear(environmentId);
			setCredentials({
				clientId: '',
				clientSecret: '',
				issuerUrl: '',
				redirectUri: '',
				scopes: 'openid profile email',
				clientAuthMethod: 'client_secret_post',
				responseType: 'code',
			});
			tracking.resetSession();
		} catch (error) {
			console.error('Clear failed:', error);
		}
	}, [environmentId, tracking]);

	const stats = tracking.sessionStats;

	return (
		<FormContainer>
			<FormHeader>
				<FormTitle>Enhanced Credentials Manager</FormTitle>
				<FormSubtitle>
					Multi-storage credentials with comprehensive user interaction tracking
				</FormSubtitle>
			</FormHeader>

			{/* Storage Backend Status */}
			<StorageStatus>
				{storageBackends.map((backend) => (
					<StorageBackend
						key={backend.name}
						status={backend.available ? 'available' : 'unavailable'}
					>
						{backend.name === 'indexeddb' && <FiDatabase />}
						{backend.name === 'sqlite' && <FiHardDrive />}
						{backend.name === 'localStorage' && <FiDatabase />}
						{backend.name.toUpperCase()}
					</StorageBackend>
				))}
			</StorageStatus>

			{/* Save Status Messages */}
			{saveStatus === 'saved' && (
				<SuccessMessage>
					<FiCheckCircle />
					Credentials saved successfully!
				</SuccessMessage>
			)}

			{saveStatus === 'error' && (
				<ErrorMessage>
					<FiAlertTriangle />
					Failed to save credentials. Please try again.
				</ErrorMessage>
			)}

			{/* Form Fields */}
			<FormGroup>
				<FormLabel htmlFor="clientId">Client ID *</FormLabel>
				<FormInput
					id="clientId"
					type="text"
					value={credentials.clientId}
					onChange={(e) => handleFieldChange('clientId', e.target.value)}
					onFocus={() => handleFieldFocus('clientId')}
					onBlur={(e) => handleFieldBlur('clientId', e.target.value)}
					placeholder="Enter your client ID"
					required
				/>
				{validationErrors.clientId && <ErrorMessage>{validationErrors.clientId}</ErrorMessage>}
			</FormGroup>

			<FormGroup>
				<FormLabel htmlFor="clientSecret">Client Secret</FormLabel>
				<FormInput
					id="clientSecret"
					type="password"
					value={credentials.clientSecret}
					onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
					onFocus={() => handleFieldFocus('clientSecret')}
					onBlur={(e) => handleFieldBlur('clientSecret', e.target.value)}
					placeholder="Enter your client secret"
				/>
			</FormGroup>

			<FormGroup>
				<FormLabel htmlFor="issuerUrl">Issuer URL</FormLabel>
				<FormInput
					id="issuerUrl"
					type="url"
					value={credentials.issuerUrl}
					onChange={(e) => handleFieldChange('issuerUrl', e.target.value, true)}
					onFocus={() => handleFieldFocus('issuerUrl')}
					onBlur={(e) => handleFieldBlur('issuerUrl', e.target.value)}
					placeholder="https://auth.pingone.com/"
				/>
				{validationErrors.issuerUrl && <ErrorMessage>{validationErrors.issuerUrl}</ErrorMessage>}
			</FormGroup>

			<FormGroup>
				<FormLabel htmlFor="redirectUri">Redirect URI</FormLabel>
				<FormInput
					id="redirectUri"
					type="url"
					value={credentials.redirectUri}
					onChange={(e) => handleFieldChange('redirectUri', e.target.value, true)}
					onFocus={() => handleFieldFocus('redirectUri')}
					onBlur={(e) => handleFieldBlur('redirectUri', e.target.value)}
					placeholder="https://localhost:3000/callback"
				/>
				{validationErrors.redirectUri && (
					<ErrorMessage>{validationErrors.redirectUri}</ErrorMessage>
				)}
			</FormGroup>

			<FormGroup>
				<FormLabel htmlFor="scopes">Scopes</FormLabel>
				<FormTextarea
					id="scopes"
					value={credentials.scopes}
					onChange={(e) => handleFieldChange('scopes', e.target.value)}
					onFocus={() => handleFieldFocus('scopes')}
					onBlur={(e) => handleFieldBlur('scopes', e.target.value)}
					placeholder="openid profile email"
				/>
			</FormGroup>

			<FormGroup>
				<FormLabel htmlFor="clientAuthMethod">Client Auth Method</FormLabel>
				<FormSelect
					id="clientAuthMethod"
					value={credentials.clientAuthMethod}
					onChange={(e) => {
						handleFieldChange('clientAuthMethod', e.target.value);
						handleDropdownChange(
							'clientAuthMethod',
							e.target.value,
							e.target.options[e.target.selectedIndex].text
						);
					}}
					onFocus={() => handleFieldFocus('clientAuthMethod')}
					onBlur={(e) => handleFieldBlur('clientAuthMethod', e.target.value)}
				>
					<option value="none">None</option>
					<option value="client_secret_basic">Client Secret Basic</option>
					<option value="client_secret_post">Client Secret Post</option>
					<option value="client_secret_jwt">Client Secret JWT</option>
					<option value="private_key_jwt">Private Key JWT</option>
				</FormSelect>
			</FormGroup>

			<FormGroup>
				<FormLabel htmlFor="responseType">Response Type</FormLabel>
				<FormSelect
					id="responseType"
					value={credentials.responseType}
					onChange={(e) => {
						handleFieldChange('responseType', e.target.value);
						handleDropdownChange(
							'responseType',
							e.target.value,
							e.target.options[e.target.selectedIndex].text
						);
					}}
					onFocus={() => handleFieldFocus('responseType')}
					onBlur={(e) => handleFieldBlur('responseType', e.target.value)}
				>
					<option value="code">Authorization Code</option>
					<option value="token">Implicit Token</option>
					<option value="id_token">Implicit ID Token</option>
					<option value="code token">Hybrid (Code + Token)</option>
					<option value="code id_token">Hybrid (Code + ID Token)</option>
				</FormSelect>
			</FormGroup>

			{/* Action Buttons */}
			<ButtonGroup>
				<Button
					variant="primary"
					onClick={handleSave}
					disabled={tracking.isLoading || Object.keys(validationErrors).length > 0}
				>
					<FiSave />
					{tracking.isLoading ? 'Saving...' : 'Save Credentials'}
				</Button>
				<Button variant="secondary" onClick={handleLoad} disabled={tracking.isLoading}>
					<FiDatabase />
					Load Credentials
				</Button>
				<Button variant="danger" onClick={handleClear} disabled={tracking.isLoading}>
					<FiAlertTriangle />
					Clear Credentials
				</Button>
			</ButtonGroup>

			{/* Session Statistics */}
			<StatsPanel>
				<StatsTitle>
					<FiActivity />
					Session Statistics
				</StatsTitle>
				<StatsGrid>
					<StatItem>
						<StatLabel>Session Duration</StatLabel>
						<StatValue>
							<FiClock style={{ display: 'inline', marginRight: '0.5rem' }} />
							{Math.round(stats.sessionDuration / 1000)}s
						</StatValue>
					</StatItem>
					<StatItem>
						<StatLabel>Field Interactions</StatLabel>
						<StatValue>{stats.fieldInteractions}</StatValue>
					</StatItem>
					<StatItem>
						<StatLabel>Modified Fields</StatLabel>
						<StatValue>{stats.modifiedFields}</StatValue>
					</StatItem>
					<StatItem>
						<StatLabel>Validated Fields</StatLabel>
						<StatValue>{stats.validatedFields}</StatValue>
					</StatItem>
					<StatItem>
						<StatLabel>Error Fields</StatLabel>
						<StatValue>{stats.errorFields}</StatValue>
					</StatItem>
					<StatItem>
						<StatLabel>Avg Field Time</StatLabel>
						<StatValue>{Math.round(stats.averageFieldTime)}ms</StatValue>
					</StatItem>
					<StatItem>
						<StatLabel>Avg Save Time</StatLabel>
						<StatValue>{Math.round(stats.averageSaveTime)}ms</StatValue>
					</StatItem>
					<StatItem>
						<StatLabel>Last Save</StatLabel>
						<StatValue>
							{stats.lastSaveTime ? new Date(stats.lastSaveTime).toLocaleTimeString() : 'Never'}
						</StatValue>
					</StatItem>
				</StatsGrid>
			</StatsPanel>
		</FormContainer>
	);
};

export default EnhancedCredentialsFormV8;
