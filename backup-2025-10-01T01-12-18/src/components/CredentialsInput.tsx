// src/components/CredentialsInput.tsx
import { useState } from 'react';
import styled from 'styled-components';
import { FiCopy, FiEye, FiEyeOff } from 'react-icons/fi';

export interface CredentialsInputProps {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri?: string;
	scopes?: string;
	loginHint?: string;
	onEnvironmentIdChange: (value: string) => void;
	onClientIdChange: (value: string) => void;
	onClientSecretChange: (value: string) => void;
	onRedirectUriChange?: (value: string) => void;
	onScopesChange?: (value: string) => void;
	onLoginHintChange?: (value: string) => void;
	onCopy: (text: string, label: string) => void;
	emptyRequiredFields?: Set<string>;
	copiedField?: string | null;
	showRedirectUri?: boolean;
	showLoginHint?: boolean;
}

const FormGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin-bottom: 0;
	padding: 0;
	background: transparent;
	border-radius: 0;
	border: none;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const FormField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
`;

const FormLabel = styled.label`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0;
	display: flex;
	align-items: center;
	gap: 0.25rem;
`;

const FormInput = styled.input<{ $hasError?: boolean }>`
	width: 100%;
	padding: 0.75rem 0.875rem;
	border: 1px solid ${({ $hasError }) => ($hasError ? '#ef4444' : '#d1d5db')};
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: all 0.2s ease;
	font-family: inherit;
	background: #ffffff;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

	&:hover {
		border-color: ${({ $hasError }) => ($hasError ? '#ef4444' : '#9ca3af')};
	}

	&:focus {
		outline: none;
		border-color: ${({ $hasError }) => ($hasError ? '#ef4444' : '#2563eb')};
		box-shadow: 0 0 0 3px ${({ $hasError }) => ($hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 99, 235, 0.1)')};
	}

	&::placeholder {
		color: #9ca3af;
	}
`;

const IconButton = styled.button`
	position: absolute;
	background: none;
	border: none;
	cursor: pointer;
	color: #6b7280;
	padding: 0.375rem;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
	border-radius: 0.375rem;

	&:hover {
		color: #2563eb;
		background: rgba(37, 99, 235, 0.1);
	}

	&:active {
		transform: scale(0.95);
	}
`;

export const CredentialsInput = ({
	environmentId,
	clientId,
	clientSecret,
	redirectUri = '',
	scopes = 'openid',
	loginHint = '',
	onEnvironmentIdChange,
	onClientIdChange,
	onClientSecretChange,
	onRedirectUriChange,
	onScopesChange,
	onLoginHintChange,
	onCopy,
	emptyRequiredFields = new Set(),
	copiedField = null,
	showRedirectUri = true,
	showLoginHint = true,
}: CredentialsInputProps) => {
	const [showClientSecret, setShowClientSecret] = useState(false);

	// Handle scopes change - ensure openid is always present
	const handleScopesChange = (value: string) => {
		// Split scopes and filter out empty strings
		const scopesList = value.split(' ').filter(s => s.trim());
		
		// Remove any duplicate "openid" entries
		const filteredScopes = scopesList.filter((scope, index) => 
			scope !== 'openid' || index === 0
		);
		
		// Ensure openid is first if it exists, or add it if it doesn't
		if (filteredScopes.length === 0 || filteredScopes[0] !== 'openid') {
			filteredScopes.unshift('openid');
		}
		
		// Join back and call parent handler
		onScopesChange?.(filteredScopes.join(' '));
	};

	return (
		<FormGrid>
			<FormField>
				<FormLabel>
					Environment ID <span style={{ color: '#ef4444' }}>*</span>
				</FormLabel>
				<div style={{ position: 'relative' }}>
					<FormInput
						type="text"
						placeholder={
							emptyRequiredFields.has('environmentId')
								? 'Required: Enter your PingOne Environment ID'
								: 'Enter your PingOne Environment ID'
						}
						value={environmentId}
						onChange={(e) => onEnvironmentIdChange(e.target.value)}
						$hasError={emptyRequiredFields.has('environmentId')}
						style={{ paddingRight: '2.5rem' }}
					/>
					<IconButton
						type="button"
						onClick={() => onCopy(environmentId, 'Environment ID')}
						style={{
							right: '0.5rem',
							top: '50%',
							transform: copiedField === 'Environment ID' ? 'translateY(-50%) scale(1.2)' : 'translateY(-50%) scale(1)',
							color: copiedField === 'Environment ID' ? '#10b981' : '#6b7280',
						}}
						title="Copy Environment ID"
					>
						<FiCopy size={16} />
					</IconButton>
				</div>
			</FormField>

			<FormField>
				<FormLabel>
					Client ID <span style={{ color: '#ef4444' }}>*</span>
				</FormLabel>
				<div style={{ position: 'relative' }}>
					<FormInput
						type="text"
						placeholder={
							emptyRequiredFields.has('clientId')
								? 'Required: Enter your PingOne Client ID'
								: 'Enter your PingOne Client ID'
						}
						value={clientId}
						onChange={(e) => onClientIdChange(e.target.value)}
						$hasError={emptyRequiredFields.has('clientId')}
						style={{ paddingRight: '2.5rem' }}
					/>
					<IconButton
						type="button"
						onClick={() => onCopy(clientId, 'Client ID')}
						style={{
							right: '0.5rem',
							top: '50%',
							transform: copiedField === 'Client ID' ? 'translateY(-50%) scale(1.2)' : 'translateY(-50%) scale(1)',
							color: copiedField === 'Client ID' ? '#10b981' : '#6b7280',
						}}
						title="Copy Client ID"
					>
						<FiCopy size={16} />
					</IconButton>
				</div>
			</FormField>

			<FormField style={{ gridColumn: '1 / -1' }}>
				<FormLabel>
					Client Secret <span style={{ color: '#ef4444' }}>*</span>
				</FormLabel>
				<div style={{ position: 'relative' }}>
					<FormInput
						type={showClientSecret ? 'text' : 'password'}
						placeholder={
							emptyRequiredFields.has('clientSecret')
								? 'Required: Enter your PingOne Client Secret'
								: 'Enter your PingOne Client Secret'
						}
						value={clientSecret}
						onChange={(e) => onClientSecretChange(e.target.value)}
						$hasError={emptyRequiredFields.has('clientSecret')}
						style={{ paddingRight: '5rem' }}
					/>
					<IconButton
						type="button"
						onClick={() => onCopy(clientSecret, 'Client Secret')}
						style={{
							right: '2.25rem',
							top: '50%',
							transform: copiedField === 'Client Secret' ? 'translateY(-50%) scale(1.2)' : 'translateY(-50%) scale(1)',
							color: copiedField === 'Client Secret' ? '#10b981' : '#6b7280',
						}}
						title="Copy Client Secret"
					>
						<FiCopy size={16} />
					</IconButton>
					<IconButton
						type="button"
						onClick={() => setShowClientSecret(!showClientSecret)}
						style={{
							right: '0.5rem',
							top: '50%',
							transform: 'translateY(-50%)',
						}}
						title={showClientSecret ? 'Hide client secret' : 'Show client secret'}
					>
						{showClientSecret ? <FiEyeOff size={16} /> : <FiEye size={16} />}
					</IconButton>
				</div>
			</FormField>

			{showRedirectUri && (
				<FormField style={{ gridColumn: '1 / -1' }}>
					<FormLabel>
						Redirect URI <span style={{ color: '#ef4444' }}>*</span>
					</FormLabel>
					<div style={{ position: 'relative' }}>
						<FormInput
							type="text"
							placeholder={
								emptyRequiredFields.has('redirectUri')
									? 'Required: Enter your Redirect URI'
									: 'Enter your Redirect URI'
							}
							value={redirectUri}
							onChange={(e) => onRedirectUriChange?.(e.target.value)}
							$hasError={emptyRequiredFields.has('redirectUri')}
							style={{ paddingRight: '2.5rem' }}
						/>
						<IconButton
							type="button"
							onClick={() => onCopy(redirectUri, 'Redirect URI')}
							style={{
								right: '0.5rem',
								top: '50%',
								transform: copiedField === 'Redirect URI' ? 'translateY(-50%) scale(1.2)' : 'translateY(-50%) scale(1)',
								color: copiedField === 'Redirect URI' ? '#10b981' : '#6b7280',
							}}
							title="Copy Redirect URI"
						>
							<FiCopy size={16} />
						</IconButton>
					</div>
				</FormField>
			)}

			<FormField style={{ gridColumn: '1 / -1' }}>
				<FormLabel>
					Scopes <span style={{ color: '#ef4444' }}>*</span>
				</FormLabel>
				<div style={{ position: 'relative' }}>
					<FormInput
						type="text"
						placeholder="openid"
						value={scopes}
						onChange={(e) => handleScopesChange(e.target.value)}
						$hasError={emptyRequiredFields.has('scopes') || !scopes.includes('openid')}
						style={{ paddingRight: '2.5rem' }}
					/>
					<IconButton
						type="button"
						onClick={() => onCopy(scopes, 'Scopes')}
						style={{
							right: '0.5rem',
							top: '50%',
							transform: copiedField === 'Scopes' ? 'translateY(-50%) scale(1.2)' : 'translateY(-50%) scale(1)',
							color: copiedField === 'Scopes' ? '#10b981' : '#6b7280',
						}}
						title="Copy Scopes"
					>
						<FiCopy size={16} />
					</IconButton>
				</div>
				<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
					Space-separated list of scopes. <strong>openid</strong> is always required and will be automatically added.
				</div>
			</FormField>

			{showLoginHint && (
				<FormField style={{ gridColumn: '1 / -1' }}>
					<FormLabel>
						Login Hint <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>(Optional)</span>
					</FormLabel>
					<div style={{ position: 'relative' }}>
						<FormInput
							type="text"
							placeholder="user@example.com or username"
							value={loginHint}
							onChange={(e) => onLoginHintChange?.(e.target.value)}
							style={{ paddingRight: '2.5rem' }}
						/>
						<IconButton
							type="button"
							onClick={() => onCopy(loginHint, 'Login Hint')}
							style={{
								right: '0.5rem',
								top: '50%',
								transform: copiedField === 'Login Hint' ? 'translateY(-50%) scale(1.2)' : 'translateY(-50%) scale(1)',
								color: copiedField === 'Login Hint' ? '#10b981' : '#6b7280',
							}}
							title="Copy Login Hint"
						>
							<FiCopy size={16} />
						</IconButton>
					</div>
					<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
						Hint about the user identifier (email, username). Helps pre-fill the login form or skip account selection.
					</div>
				</FormField>
			)}
		</FormGrid>
	);
};

export default CredentialsInput;
