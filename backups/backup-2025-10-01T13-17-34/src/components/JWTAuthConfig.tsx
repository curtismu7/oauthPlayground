import React, { useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiCheckCircle,
	FiCopy,
	FiEye,
	FiEyeOff,
	FiKey,
	FiShield,
} from 'react-icons/fi';
import styled from 'styled-components';
import { JWTAuthConfig, jwtAuthService } from '../services/jwtAuthService';
import { logger } from '../utils/logger';
import CopyIcon from './CopyIcon';

interface JWTAuthConfigProps {
	onConfigChange: (config: JWTAuthConfig) => void;
	initialConfig?: Partial<JWTAuthConfig>;
}

const Container = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  
  h3 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
  }
  
  .badge {
    background: #3b82f6;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }
  
  input, textarea, select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: border-color 0.2s;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    &:disabled {
      background: #f9fafb;
      color: #6b7280;
    }
  }
  
  textarea {
    resize: vertical;
    min-height: 120px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }
  
  .help-text {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .error-text {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: #dc2626;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
`;

const AuthMethodSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const MethodCard = styled.div<{ $selected: boolean; $disabled?: boolean }>`
  border: 2px solid ${({ $selected }) => ($selected ? '#3b82f6' : '#e2e8f0')};
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s;
  background: ${({ $selected }) => ($selected ? '#eff6ff' : 'white')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  
  &:hover:not([disabled]) {
    border-color: ${({ $selected }) => ($selected ? '#3b82f6' : '#94a3b8')};
  }
  
  .method-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    
    .method-name {
      font-weight: 600;
      color: #1e293b;
    }
    
    .method-badge {
      background: ${({ $selected }) => ($selected ? '#3b82f6' : '#6b7280')};
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }
  }
  
  .method-description {
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  ${({ variant = 'primary' }) =>
		variant === 'primary'
			? `
    background: #3b82f6;
    color: white;
    
    &:hover:not(:disabled) {
      background: #2563eb;
    }
  `
			: `
    background: transparent;
    color: #6b7280;
    border: 1px solid #d1d5db;
    
    &:hover:not(:disabled) {
      background: #f9fafb;
      color: #374151;
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.div<{ type: 'success' | 'error' | 'info' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  
  ${({ type }) => {
		switch (type) {
			case 'success':
				return `
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        `;
			case 'error':
				return `
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        `;
			case 'info':
				return `
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
        `;
		}
	}}
`;

const TestSection = styled.div`
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  
  .test-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    font-weight: 600;
    color: #1e293b;
  }
  
  .test-result {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.75rem;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.25rem;
    padding: 0.75rem;
    max-height: 200px;
    overflow-y: auto;
  }
`;

const JWTAuthConfig: React.FC<JWTAuthConfigProps> = ({ onConfigChange, initialConfig }) => {
	const [authMethod, setAuthMethod] = useState<'CLIENT_SECRET_JWT' | 'PRIVATE_KEY_JWT'>(
		'CLIENT_SECRET_JWT'
	);
	const [config, setConfig] = useState<JWTAuthConfig>({
		clientId: '',
		clientSecret: '',
		privateKey: '',
		keyId: '',
		issuer: '',
		audience: '',
		tokenEndpoint: '',
		...initialConfig,
	});

	const [showSecret, setShowSecret] = useState(false);
	const [showPrivateKey, setShowPrivateKey] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [status, setStatus] = useState<{
		type: 'success' | 'error' | 'info';
		message: string;
	} | null>(null);
	const [testResult, setTestResult] = useState<string | null>(null);
	const [isTesting, setIsTesting] = useState(false);

	useEffect(() => {
		onConfigChange(config);
	}, [config, onConfigChange]);

	const handleInputChange = (field: keyof JWTAuthConfig, value: string) => {
		setConfig((prev) => ({ ...prev, [field]: value }));

		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: '' }));
		}
	};

	const validateConfig = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!config.clientId) {
			newErrors.clientId = 'Client ID is required';
		}

		if (!config.issuer) {
			newErrors.issuer = 'Issuer is required';
		}

		if (!config.audience) {
			newErrors.audience = 'Audience is required';
		}

		if (!config.tokenEndpoint) {
			newErrors.tokenEndpoint = 'Token endpoint is required';
		}

		if (authMethod === 'CLIENT_SECRET_JWT' && !config.clientSecret) {
			newErrors.clientSecret = 'Client secret is required for CLIENT_SECRET_JWT';
		}

		if (authMethod === 'PRIVATE_KEY_JWT') {
			if (!config.privateKey) {
				newErrors.privateKey = 'Private key is required for PRIVATE_KEY_JWT';
			} else if (!jwtAuthService.validatePrivateKey(config.privateKey)) {
				newErrors.privateKey = 'Invalid private key format. Must be PEM format.';
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleTestAuth = async () => {
		if (!validateConfig()) {
			setStatus({ type: 'error', message: 'Please fix validation errors before testing' });
			return;
		}

		setIsTesting(true);
		setStatus(null);
		setTestResult(null);

		try {
			let result;

			if (authMethod === 'CLIENT_SECRET_JWT') {
				result = await jwtAuthService.exchangeClientSecretJWT(
					config,
					'client_credentials',
					'pingone:read'
				);
			} else {
				result = await jwtAuthService.exchangePrivateKeyJWT(
					config,
					'client_credentials',
					'pingone:read'
				);
			}

			if (result.success && result.tokenResponse) {
				setStatus({
					type: 'success',
					message: `${authMethod} authentication successful!`,
				});
				setTestResult(JSON.stringify(result.tokenResponse, null, 2));
			} else {
				setStatus({
					type: 'error',
					message: result.error || 'Authentication failed',
				});
				setTestResult(result.error || 'Authentication failed');
			}
		} catch (error) {
			setStatus({
				type: 'error',
				message: error instanceof Error ? error.message : 'Test failed',
			});
			setTestResult(error instanceof Error ? error.message : 'Test failed');
		} finally {
			setIsTesting(false);
		}
	};

	const handleCopyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setStatus({ type: 'info', message: 'Copied to clipboard!' });
			setTimeout(() => setStatus(null), 2000);
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	};

	return (
		<Container>
			<Header>
				<FiShield />
				<h3>JWT Authentication Configuration</h3>
				<span className="badge">Advanced</span>
			</Header>

			<AuthMethodSelector>
				<MethodCard
					$selected={authMethod === 'CLIENT_SECRET_JWT'}
					onClick={() => setAuthMethod('CLIENT_SECRET_JWT')}
				>
					<div className="method-header">
						<FiKey />
						<span className="method-name">CLIENT_SECRET_JWT</span>
						<span className="method-badge">HS256</span>
					</div>
					<div className="method-description">
						Use client secret to sign JWT assertions. Simpler setup, requires client secret.
					</div>
				</MethodCard>

				<MethodCard
					$selected={authMethod === 'PRIVATE_KEY_JWT'}
					onClick={() => setAuthMethod('PRIVATE_KEY_JWT')}
				>
					<div className="method-header">
						<FiKey />
						<span className="method-name">PRIVATE_KEY_JWT</span>
						<span className="method-badge">RS256</span>
					</div>
					<div className="method-description">
						Use private key to sign JWT assertions. More secure, requires RSA private key.
					</div>
				</MethodCard>
			</AuthMethodSelector>

			<FormGroup>
				<label htmlFor="clientId">Client ID *</label>
				<input
					id="clientId"
					type="text"
					value={config.clientId}
					onChange={(e) => handleInputChange('clientId', e.target.value)}
					placeholder="Enter your PingOne Client ID"
				/>
				{errors.clientId && (
					<div className="error-text">
						<FiAlertCircle size={14} />
						{errors.clientId}
					</div>
				)}
			</FormGroup>

			<FormGroup>
				<label htmlFor="issuer">Issuer *</label>
				<input
					id="issuer"
					type="text"
					value={config.issuer}
					onChange={(e) => handleInputChange('issuer', e.target.value)}
					placeholder="https://auth.pingone.com/{environmentId}"
				/>
				<div className="help-text">The issuer URL for your PingOne environment</div>
				{errors.issuer && (
					<div className="error-text">
						<FiAlertCircle size={14} />
						{errors.issuer}
					</div>
				)}
			</FormGroup>

			<FormGroup>
				<label htmlFor="audience">Audience *</label>
				<input
					id="audience"
					type="text"
					value={config.audience}
					onChange={(e) => handleInputChange('audience', e.target.value)}
					placeholder="https://auth.pingone.com/{environmentId}/as"
				/>
				<div className="help-text">
					The audience URL for your PingOne environment (usually the token endpoint)
				</div>
				{errors.audience && (
					<div className="error-text">
						<FiAlertCircle size={14} />
						{errors.audience}
					</div>
				)}
			</FormGroup>

			<FormGroup>
				<label htmlFor="tokenEndpoint">Token Endpoint *</label>
				<input
					id="tokenEndpoint"
					type="text"
					value={config.tokenEndpoint}
					onChange={(e) => handleInputChange('tokenEndpoint', e.target.value)}
					placeholder="https://auth.pingone.com/{environmentId}/as/token"
				/>
				<div className="help-text">The token endpoint URL for your PingOne environment</div>
				{errors.tokenEndpoint && (
					<div className="error-text">
						<FiAlertCircle size={14} />
						{errors.tokenEndpoint}
					</div>
				)}
			</FormGroup>

			{authMethod === 'CLIENT_SECRET_JWT' && (
				<FormGroup>
					<label htmlFor="clientSecret">Client Secret *</label>
					<div style={{ position: 'relative' }}>
						<input
							id="clientSecret"
							type={showSecret ? 'text' : 'password'}
							value={config.clientSecret || ''}
							onChange={(e) => handleInputChange('clientSecret', e.target.value)}
							placeholder="Enter your PingOne Client Secret"
							style={{ paddingRight: '3rem' }}
						/>
						<button
							type="button"
							onClick={() => setShowSecret(!showSecret)}
							style={{
								position: 'absolute',
								right: '0.75rem',
								top: '50%',
								transform: 'translateY(-50%)',
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								color: '#6b7280',
							}}
						>
							{showSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
						</button>
					</div>
					<div className="help-text">The client secret for your PingOne application</div>
					{errors.clientSecret && (
						<div className="error-text">
							<FiAlertCircle size={14} />
							{errors.clientSecret}
						</div>
					)}
				</FormGroup>
			)}

			{authMethod === 'PRIVATE_KEY_JWT' && (
				<>
					<FormGroup>
						<label htmlFor="privateKey">Private Key *</label>
						<div style={{ position: 'relative' }}>
							<textarea
								id="privateKey"
								value={config.privateKey || ''}
								onChange={(e) => handleInputChange('privateKey', e.target.value)}
								placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
								style={{ paddingRight: '3rem' }}
							/>
							<button
								type="button"
								onClick={() => setShowPrivateKey(!showPrivateKey)}
								style={{
									position: 'absolute',
									right: '0.75rem',
									top: '0.75rem',
									background: 'none',
									border: 'none',
									cursor: 'pointer',
									color: '#6b7280',
								}}
							>
								{showPrivateKey ? <FiEyeOff size={16} /> : <FiEye size={16} />}
							</button>
						</div>
						<div className="help-text">
							RSA private key in PEM format for signing JWT assertions
						</div>
						{errors.privateKey && (
							<div className="error-text">
								<FiAlertCircle size={14} />
								{errors.privateKey}
							</div>
						)}
					</FormGroup>

					<FormGroup>
						<label htmlFor="keyId">Key ID (Optional)</label>
						<input
							id="keyId"
							type="text"
							value={config.keyId || ''}
							onChange={(e) => handleInputChange('keyId', e.target.value)}
							placeholder="default"
						/>
						<div className="help-text">
							Key ID for JWKS endpoint (optional, defaults to 'default')
						</div>
					</FormGroup>
				</>
			)}

			{status && (
				<StatusMessage type={status.type}>
					{status.type === 'success' && <FiCheckCircle />}
					{status.type === 'error' && <FiAlertCircle />}
					{status.type === 'info' && <FiKey />}
					{status.message}
				</StatusMessage>
			)}

			<div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
				<Button variant="primary" onClick={handleTestAuth} disabled={isTesting}>
					{isTesting ? 'Testing...' : 'Test Authentication'}
				</Button>

				{testResult && (
					<Button variant="secondary" onClick={() => handleCopyToClipboard(testResult)}>
						<FiCopy />
						Copy Result
					</Button>
				)}
			</div>

			{testResult && (
				<TestSection>
					<div className="test-header">
						<FiKey />
						Test Result
					</div>
					<pre className="test-result">{testResult}</pre>
				</TestSection>
			)}
		</Container>
	);
};

export default JWTAuthConfig;
