// Worker Credentials component for secure credential input

import React, { useCallback, useEffect, useState } from 'react';
import { FiAlertCircle, FiCheck, FiEye, FiEyeOff, FiSettings } from 'react-icons/fi';
import styled from 'styled-components';
import { DEFAULT_WORKER_SCOPES, WorkerTokenCredentials } from '../../types/workerToken';
import { validateCredentialFormat } from '../../utils/clientCredentials';
import { logger } from '../../utils/logger';
import { validateEnvironmentId } from '../../utils/workerToken';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h3 {
    margin: 0 0 0 0.5rem;
    color: #1f2937;
    font-size: 1.125rem;
    font-weight: 600;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
`;

const Input = styled.input<{ hasError?: boolean }>`
  padding: 0.75rem;
  border: 1px solid ${(props) => (props.hasError ? '#ef4444' : '#d1d5db')};
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${(props) => (props.hasError ? '#ef4444' : '#3b82f6')};
    box-shadow: 0 0 0 3px ${(props) => (props.hasError ? '#fef2f2' : '#eff6ff')};
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
  }
`;

const SecureInputContainer = styled.div`
  position: relative;
`;

const SecureInput = styled(Input)<{ hasError?: boolean }>`
  padding-right: 3rem;
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: #374151;
  }
`;

const _Textarea = styled.textarea<{ hasError?: boolean }>`
  padding: 0.75rem;
  border: 1px solid ${(props) => (props.hasError ? '#ef4444' : '#d1d5db')};
  border-radius: 8px;
  font-size: 0.875rem;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${(props) => (props.hasError ? '#ef4444' : '#3b82f6')};
    box-shadow: 0 0 0 3px ${(props) => (props.hasError ? '#fef2f2' : '#eff6ff')};
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #059669;
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const ScopeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ScopeList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem;
`;

const ScopeItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const Checkbox = styled.input`
  margin: 0;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  ${(props) =>
		props.variant === 'primary'
			? `
    background-color: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background-color: #2563eb;
    }
  `
			: `
    background-color: #f3f4f6;
    color: #374151;
    
    &:hover:not(:disabled) {
      background-color: #e5e7eb;
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

interface WorkerCredentialsProps {
	credentials: WorkerTokenCredentials;
	onChange: (credentials: WorkerTokenCredentials) => void;
	onValidate?: (isValid: boolean, errors: string[]) => void;
	showAdvanced?: boolean;
	autoDiscover?: boolean;
}

export const WorkerCredentials: React.FC<WorkerCredentialsProps> = ({
	credentials,
	onChange,
	onValidate,
	showAdvanced = false,
	autoDiscover = true,
}) => {
	const [showSecret, setShowSecret] = useState(false);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const [isValidating, setIsValidating] = useState(false);

	// Validate credentials whenever they change
	useEffect(() => {
		const validateCredentials = () => {
			const errors: string[] = [];

			// Validate client ID
			if (!credentials.client_id || credentials.client_id.trim().length === 0) {
				errors.push('Client ID is required');
			} else if (credentials.client_id.length < 8) {
				errors.push('Client ID appears to be too short');
			}

			// Validate client secret
			if (!credentials.client_secret || credentials.client_secret.trim().length === 0) {
				errors.push('Client Secret is required');
			} else if (credentials.client_secret.length < 16) {
				errors.push('Client Secret appears to be too short');
			}

			// Validate environment ID
			if (!credentials.environment_id || credentials.environment_id.trim().length === 0) {
				errors.push('Environment ID is required');
			} else if (!validateEnvironmentId(credentials.environment_id)) {
				errors.push('Environment ID should be a valid UUID');
			}

			// Validate scopes
			if (!credentials.scopes || credentials.scopes.length === 0) {
				errors.push('At least one scope is required');
			}

			setValidationErrors(errors);
			onValidate?.(errors.length === 0, errors);

			return errors.length === 0;
		};

		validateCredentials();
	}, [credentials, onValidate]);

	const handleFieldChange = useCallback(
		(field: keyof WorkerTokenCredentials, value: any) => {
			const updatedCredentials = {
				...credentials,
				[field]: value,
			};

			// Auto-generate endpoints when environment ID changes
			if (field === 'environment_id' && autoDiscover && value && validateEnvironmentId(value)) {
				updatedCredentials.token_endpoint = `https://auth.pingone.com/${value}/as/token`;
				updatedCredentials.introspection_endpoint = `https://auth.pingone.com/${value}/as/introspect`;
			}

			onChange(updatedCredentials);
		},
		[credentials, onChange, autoDiscover]
	);

	const handleScopeToggle = useCallback(
		(scope: string, checked: boolean) => {
			const updatedScopes = checked
				? [...credentials.scopes, scope]
				: credentials.scopes.filter((s) => s !== scope);

			handleFieldChange('scopes', updatedScopes);
		},
		[credentials.scopes, handleFieldChange]
	);

	const handleTestConnection = useCallback(async () => {
		setIsValidating(true);

		try {
			logger.info('WORKER-CREDENTIALS', 'Testing connection', {
				clientId: `${credentials.client_id.substring(0, 8)}...`,
				environmentId: credentials.environment_id,
			});

			// Basic validation
			const validation = validateCredentialFormat(credentials.client_id, credentials.client_secret);
			if (!validation.isValid) {
				setValidationErrors(validation.errors);
				return;
			}

			// Test token endpoint accessibility
			const response = await fetch(
				credentials.token_endpoint ||
					`https://auth.pingone.com/${credentials.environment_id}/as/token`,
				{
					method: 'HEAD',
					mode: 'cors',
				}
			);

			if (response.ok) {
				logger.success('WORKER-CREDENTIALS', 'Connection test successful');
				setValidationErrors([]);
			} else {
				throw new Error(`Token endpoint returned ${response.status}`);
			}
		} catch (error) {
			logger.error('WORKER-CREDENTIALS', 'Connection test failed', error);
			setValidationErrors([
				`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			]);
		} finally {
			setIsValidating(false);
		}
	}, [credentials]);

	const handleLoadFromEnv = useCallback(() => {
		// In a real implementation, this would load from actual environment variables
		// For now, we'll just show a placeholder
		logger.info('WORKER-CREDENTIALS', 'Loading credentials from environment variables');
		// This would be implemented based on the actual environment variable loading mechanism
	}, []);

	return (
		<Container>
			<Header>
				<FiSettings size={20} color="#3b82f6" />
				<h3>Worker Application Credentials</h3>
			</Header>

			<Form>
				<FieldGroup>
					<Label htmlFor="client_id">Client ID *</Label>
					<Input
						id="client_id"
						type="text"
						value={credentials.client_id}
						onChange={(e) => handleFieldChange('client_id', e.target.value)}
						placeholder="Enter your PingOne client ID"
						hasError={validationErrors.some((error) => error.includes('Client ID'))}
						autoComplete="username"
					/>
					{validationErrors.some((error) => error.includes('Client ID')) && (
						<ErrorMessage>
							<FiAlertCircle size={14} />
							{validationErrors.find((error) => error.includes('Client ID'))}
						</ErrorMessage>
					)}
				</FieldGroup>

				<FieldGroup>
					<Label htmlFor="client_secret">Client Secret *</Label>
					<SecureInputContainer>
						<SecureInput
							id="client_secret"
							type={showSecret ? 'text' : 'password'}
							value={credentials.client_secret}
							onChange={(e) => handleFieldChange('client_secret', e.target.value)}
							placeholder="Enter your PingOne client secret"
							hasError={validationErrors.some((error) => error.includes('Client Secret'))}
							autoComplete="current-password"
						/>
						<ToggleButton
							type="button"
							onClick={() => setShowSecret(!showSecret)}
							title={showSecret ? 'Hide secret' : 'Show secret'}
						>
							{showSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
						</ToggleButton>
					</SecureInputContainer>
					{validationErrors.some((error) => error.includes('Client Secret')) && (
						<ErrorMessage>
							<FiAlertCircle size={14} />
							{validationErrors.find((error) => error.includes('Client Secret'))}
						</ErrorMessage>
					)}
				</FieldGroup>

				<FieldGroup>
					<Label htmlFor="environment_id">Environment ID *</Label>
					<Input
						id="environment_id"
						type="text"
						value={credentials.environment_id}
						onChange={(e) => handleFieldChange('environment_id', e.target.value)}
						placeholder="Enter your PingOne environment ID (UUID)"
						hasError={validationErrors.some((error) => error.includes('Environment ID'))}
					/>
					{validationErrors.some((error) => error.includes('Environment ID')) && (
						<ErrorMessage>
							<FiAlertCircle size={14} />
							{validationErrors.find((error) => error.includes('Environment ID'))}
						</ErrorMessage>
					)}
					{credentials.environment_id && validateEnvironmentId(credentials.environment_id) && (
						<SuccessMessage>
							<FiCheck size={14} />
							Valid environment ID format
						</SuccessMessage>
					)}
				</FieldGroup>

				<FieldGroup>
					<Label>Scopes *</Label>
					<ScopeContainer>
						<ScopeList>
							{DEFAULT_WORKER_SCOPES.map((scope) => (
								<ScopeItem key={scope}>
									<Checkbox
										type="checkbox"
										checked={credentials.scopes.includes(scope)}
										onChange={(e) => handleScopeToggle(scope, e.target.checked)}
									/>
									<span>{scope}</span>
								</ScopeItem>
							))}
						</ScopeList>
					</ScopeContainer>
					{validationErrors.some((error) => error.includes('scope')) && (
						<ErrorMessage>
							<FiAlertCircle size={14} />
							{validationErrors.find((error) => error.includes('scope'))}
						</ErrorMessage>
					)}
				</FieldGroup>

				{showAdvanced && (
					<>
						<FieldGroup>
							<Label htmlFor="token_endpoint">Token Endpoint</Label>
							<Input
								id="token_endpoint"
								type="url"
								value={credentials.token_endpoint || ''}
								onChange={(e) => handleFieldChange('token_endpoint', e.target.value)}
								placeholder="Auto-generated from environment ID"
								disabled={autoDiscover}
							/>
						</FieldGroup>

						<FieldGroup>
							<Label htmlFor="introspection_endpoint">Introspection Endpoint</Label>
							<Input
								id="introspection_endpoint"
								type="url"
								value={credentials.introspection_endpoint || ''}
								onChange={(e) => handleFieldChange('introspection_endpoint', e.target.value)}
								placeholder="Auto-generated from environment ID"
								disabled={autoDiscover}
							/>
						</FieldGroup>
					</>
				)}

				<ButtonGroup>
					<Button type="button" onClick={handleLoadFromEnv} variant="secondary">
						Load from Environment
					</Button>
					<Button
						type="button"
						onClick={handleTestConnection}
						variant="secondary"
						disabled={isValidating || validationErrors.length > 0}
					>
						{isValidating ? 'Testing...' : 'Test Connection'}
					</Button>
				</ButtonGroup>
			</Form>
		</Container>
	);
};

export default WorkerCredentials;
