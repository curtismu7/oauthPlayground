// src/components/CredentialsInput.tsx
import { useState } from 'react';
import { FiEye, FiEyeOff, FiGlobe, FiChevronRight, FiChevronDown, FiSettings } from 'react-icons/fi';
import styled, { keyframes } from 'styled-components';
import type { DiscoveryResult } from '../services/oidcDiscoveryService';
import EnvironmentIdInput from './EnvironmentIdInput';
import ResponseModeSelector, { type ResponseMode } from './response-modes/ResponseModeSelector';
import { CopyButtonVariants } from '../services/copyButtonService';

// CSS animation for loading spinner
const spin = keyframes`
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
`;

export interface CredentialsInputProps {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri?: string;
	scopes?: string;
	loginHint?: string;
	postLogoutRedirectUri?: string;
	responseMode?: ResponseMode;
	flowKey?: 'authorization_code' | 'implicit' | 'hybrid' | 'device' | 'client_credentials';
	responseType?:
		| 'code'
		| 'token'
		| 'id_token'
		| 'token id_token'
		| 'code id_token'
		| 'code token'
		| 'code token id_token';
	onEnvironmentIdChange: (value: string) => void;
	onClientIdChange: (value: string) => void;
	onClientSecretChange: (value: string) => void;
	onRedirectUriChange?: (value: string) => void;
	onScopesChange?: (value: string) => void;
	onLoginHintChange?: (value: string) => void;
	onPostLogoutRedirectUriChange?: (value: string) => void;
	onResponseModeChange?: (value: ResponseMode) => void;
	emptyRequiredFields?: Set<string>;
	showRedirectUri?: boolean;
	showLoginHint?: boolean;
	showPostLogoutRedirectUri?: boolean;
	showClientSecret?: boolean;
	showEnvironmentIdInput?: boolean;
	showResponseModeSelector?: boolean;
	onDiscoveryComplete?: (result: DiscoveryResult) => void;
	onSave?: () => void;
	hasUnsavedChanges?: boolean;
	isSaving?: boolean;
}

const CollapsibleContainer = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	overflow: hidden;
`;

const CollapsibleHeader = styled.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	width: 100%;
	padding: 1rem 1.5rem;
	background: #3b82f6;
	color: white;
	font-weight: 600;
	font-size: 0.875rem;
	border: none;
	cursor: pointer;
	transition: background-color 0.2s ease;
	
	&:hover {
		background: #2563eb;
	}
`;

const CollapsibleHeaderLeft = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	border: 2px solid white; /* White circle around arrow for visibility */
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Subtle shadow for depth */
	transition: all 0.2s ease;
	
	&:hover {
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* Enhanced shadow on hover */
		transform: scale(1.1);
	}
	
	svg {
		width: 16px;
		height: 16px;
	}
`;

const CollapsibleContent = styled.div<{ $collapsed: boolean }>`
	padding: ${({ $collapsed }) => ($collapsed ? '0' : '1.5rem')};
	max-height: ${({ $collapsed }) => ($collapsed ? '0' : 'none')};
	overflow: hidden;
	transition: all 0.3s ease;
`;

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
	cursor: text;
	pointer-events: auto;
	position: relative;
	z-index: 5;

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

	&:disabled {
		background: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
		pointer-events: none;
	}

	&[readonly] {
		background: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
		pointer-events: none;
	}

	/* Ensure inputs are always interactive when not disabled/readonly */
	&:not(:disabled):not([readonly]) {
		background: #ffffff !important;
		color: #111827 !important;
		cursor: text !important;
		pointer-events: auto !important;
		user-select: text !important;
	}

	/* Special override for login hint field to ensure it's always editable */
	&[data-field="login-hint"] {
		background: #ffffff !important;
		color: #111827 !important;
		cursor: text !important;
		pointer-events: auto !important;
		user-select: text !important;
		border-color: #d1d5db !important;
	}
`;

const IconButton = styled.button`
	position: absolute;
	background: white;
	border: 1px solid #d1d5db;
	color: #374151;
	padding: 0.375rem;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
	border-radius: 0.375rem;
	z-index: 10;
	pointer-events: auto;
	width: 2rem;
	height: 2rem;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

	&:hover {
		background: #f9fafb;
		border-color: #9ca3af;
		color: #111827;
	}

	&:active {
		transform: scale(0.95);
	}
`;

const EnvironmentSection = styled.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 8px;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`;

const EnvironmentHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 1rem;
`;

const EnvironmentTitle = styled.h3`
	color: #1e40af;
	font-size: 1.125rem;
	font-weight: 600;
	margin: 0;
`;

const SectionDivider = styled.div`
	height: 1px;
	background-color: #e5e7eb;
	margin: 1.5rem 0;
	border-radius: 0.5px;
`;

export const CredentialsInput = ({
	environmentId,
	clientId,
	clientSecret,
	redirectUri = '',
	scopes = 'openid',
	loginHint = '',
	postLogoutRedirectUri = '',
	responseMode = 'fragment',
	flowKey = 'authorization_code',
	responseType = 'code',
	onEnvironmentIdChange,
	onClientIdChange,
	onClientSecretChange,
	onRedirectUriChange,
	onScopesChange,
	onLoginHintChange,
	onPostLogoutRedirectUriChange,
	onResponseModeChange,
	emptyRequiredFields = new Set(),
	showRedirectUri = true,
	showLoginHint = true,
	showPostLogoutRedirectUri = false,
	showClientSecret = true,
	showEnvironmentIdInput = false,
	showResponseModeSelector = false,
	onDiscoveryComplete,
	onSave,
	hasUnsavedChanges = false,
	isSaving = false,
}: CredentialsInputProps) => {
	const [showClientSecretValue, setShowClientSecretValue] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);

	// Handle scopes change - allow spaces while typing, clean up on blur
	const handleScopesChange = (value: string) => {
		// Just pass through the value as-is to allow typing spaces
		onScopesChange?.(value);
	};

	const handleScopesBlur = (value: string) => {
		// Clean up multiple spaces and trim only on blur
		const cleanedValue = value.replace(/\s+/g, ' ').trim();
		onScopesChange?.(cleanedValue);
	};

	return (
		<CollapsibleContainer>
			<CollapsibleHeader
				onClick={() => setIsCollapsed(!isCollapsed)}
				aria-expanded={!isCollapsed}
			>
			<CollapsibleHeaderLeft>
				<FiSettings size={18} />
				<span>Application Configuration & Credentials</span>
			</CollapsibleHeaderLeft>
			<CollapsibleToggleIcon $collapsed={isCollapsed}>
				{isCollapsed ? <FiChevronRight /> : <FiChevronDown />}
			</CollapsibleToggleIcon>
			</CollapsibleHeader>
			
			<CollapsibleContent $collapsed={isCollapsed}>
				<form>
					{showEnvironmentIdInput && (
						<>
							<EnvironmentSection>
								<EnvironmentHeader>
									<FiGlobe size={20} />
									<EnvironmentTitle>🌍 PingOne Environment Configuration</EnvironmentTitle>
								</EnvironmentHeader>

								<EnvironmentIdInput
									onDiscoveryComplete={onDiscoveryComplete || (() => {})}
									onEnvironmentIdChange={onEnvironmentIdChange}
									onIssuerUrlChange={() => {}}
									showSuggestions={true}
									autoDiscover={false}
								/>
							</EnvironmentSection>

							<SectionDivider />
						</>
					)}

					<FormGrid>
				<FormField>
					<FormLabel>
						Environment ID <span style={{ color: '#ef4444' }}>*</span>
					</FormLabel>
					<div style={{ 
						position: 'relative', 
						display: 'flex', 
						alignItems: 'stretch', 
						gap: '0.5rem' 
					}}>
						<FormInput
							type="text"
							placeholder={
								emptyRequiredFields.has('environmentId')
									? 'Required: Enter your PingOne Environment ID'
									: 'Enter your PingOne Environment ID'
							}
							value={environmentId}
							onChange={(e) => onEnvironmentIdChange(e.target.value)}
							disabled={false}
							readOnly={false}
							$hasError={emptyRequiredFields.has('environmentId')}
							style={{ flex: 1 }}
						/>
						{environmentId && (
							<div style={{ 
								display: 'flex', 
								alignItems: 'center', 
								height: '100%' 
							}}>
								{CopyButtonVariants.identifier(environmentId, 'Environment ID')}
							</div>
						)}
					</div>
				</FormField>

				<FormField>
					<FormLabel>
						Client ID <span style={{ color: '#ef4444' }}>*</span>
					</FormLabel>
					<div style={{ 
						position: 'relative', 
						display: 'flex', 
						alignItems: 'stretch', 
						gap: '0.5rem' 
					}}>
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
							style={{ flex: 1 }}
							disabled={false}
							readOnly={false}
						/>
						{clientId && (
							<div style={{ 
								display: 'flex', 
								alignItems: 'center', 
								height: '100%' 
							}}>
								{CopyButtonVariants.identifier(clientId, 'Client ID')}
							</div>
						)}
					</div>
				</FormField>

				{showClientSecret && (
					<FormField style={{ gridColumn: '1 / -1' }}>
						<FormLabel>
							Client Secret <span style={{ color: '#ef4444' }}>*</span>
						</FormLabel>
						<div style={{ 
							position: 'relative', 
							display: 'flex', 
							alignItems: 'stretch', 
							gap: '0.5rem' 
						}}>
							<FormInput
								type={showClientSecretValue ? 'text' : 'password'}
								placeholder={
									emptyRequiredFields.has('clientSecret')
										? 'Required: Enter your PingOne Client Secret'
										: 'Enter your PingOne Client Secret'
								}
								value={clientSecret}
								onChange={(e) => onClientSecretChange(e.target.value)}
								$hasError={emptyRequiredFields.has('clientSecret')}
								style={{ flex: 1, paddingRight: '2.5rem' }}
								disabled={false}
								readOnly={false}
								autoComplete="current-password"
							/>
							{clientSecret && (
								<div style={{ 
									display: 'flex', 
									alignItems: 'center', 
									height: '100%' 
								}}>
									{CopyButtonVariants.identifier(clientSecret, 'Client Secret')}
								</div>
							)}
							<IconButton
								type="button"
								onClick={() => setShowClientSecretValue(!showClientSecretValue)}
								style={{
									position: 'absolute',
									right: '0.5rem',
									top: '50%',
									transform: 'translateY(-50%)',
									width: '2rem',
									height: '2rem',
								}}
								title={showClientSecretValue ? 'Hide client secret' : 'Show client secret'}
							>
								{showClientSecretValue ? <FiEyeOff size={16} /> : <FiEye size={16} />}
							</IconButton>
						</div>
					</FormField>
				)}

				{!showClientSecret && (
					<FormField style={{ gridColumn: '1 / -1' }}>
						<div
							style={{
								fontSize: '0.875rem',
								color: '#6b7280',
								backgroundColor: '#f3f4f6',
								padding: '0.75rem',
								borderRadius: '0.5rem',
								border: '1px solid #e5e7eb',
								marginTop: '0.5rem',
							}}
						>
							<strong>Note:</strong> Client Secret is not required for this flow type. This flow
							uses public client authentication (client_id only).
						</div>
					</FormField>
				)}

				{showRedirectUri && (
					<FormField style={{ gridColumn: '1 / -1' }}>
						<FormLabel>
							Redirect URI <span style={{ color: '#ef4444' }}>*</span>
						</FormLabel>
						<div style={{ 
							position: 'relative', 
							display: 'flex', 
							alignItems: 'stretch', 
							gap: '0.5rem' 
						}}>
							<FormInput
								type="text"
								placeholder="https://localhost:3000/authz-callback"
								value={redirectUri || 'https://localhost:3000/authz-callback'}
								onChange={(e) => onRedirectUriChange?.(e.target.value)}
								$hasError={emptyRequiredFields.has('redirectUri')}
								style={{ flex: 1 }}
								disabled={false}
								readOnly={false}
							/>
							{redirectUri && (
								<div style={{ 
									display: 'flex', 
									alignItems: 'center', 
									height: '100%' 
								}}>
									{CopyButtonVariants.url(redirectUri, 'Redirect URI')}
								</div>
							)}
						</div>
					</FormField>
				)}

				{!showRedirectUri && (
					<FormField style={{ gridColumn: '1 / -1' }}>
						<div
							style={{
								fontSize: '0.875rem',
								color: '#6b7280',
								backgroundColor: '#f3f4f6',
								padding: '0.75rem',
								borderRadius: '0.5rem',
								border: '1px solid #e5e7eb',
								marginTop: '0.5rem',
							}}
						>
							<strong>Note:</strong> Redirect URI is not required for this flow type. This flow
							handles authentication without redirects.
						</div>
					</FormField>
				)}

				<FormField style={{ gridColumn: '1 / -1' }}>
					<FormLabel>
						Scopes <span style={{ color: '#ef4444' }}>*</span>
					</FormLabel>
					<div style={{ 
						position: 'relative', 
						display: 'flex', 
						alignItems: 'stretch', // Changed from 'center' to 'stretch' for perfect alignment
						gap: '0.5rem' 
					}}>
						<FormInput
							type="text"
							placeholder="openid profile email"
							value={scopes}
							onChange={(e) => handleScopesChange(e.target.value)}
							onBlur={(e) => handleScopesBlur(e.target.value)}
							onKeyDown={(e) => {
								// Ensure space key works
								if (e.key === ' ') {
									e.stopPropagation();
								}
							}}
							$hasError={emptyRequiredFields.has('scopes') || !scopes.includes('openid')}
							style={{ flex: 1 }}
							disabled={false}
							readOnly={false}
						/>
						{scopes && (
							<div style={{ 
								display: 'flex', 
								alignItems: 'center', // Center the copy button within its container
								height: '100%' // Match the input field height
							}}>
								{CopyButtonVariants.identifier(scopes, 'Scopes')}
							</div>
						)}
					</div>
					<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
						Space-separated list of scopes. <strong>openid</strong> is always required and will be
						automatically added.
					</div>
				</FormField>

				{showLoginHint && (
					<FormField style={{ gridColumn: '1 / -1' }}>
						<FormLabel>
							Login Hint <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>(Optional)</span>
						</FormLabel>
						<div style={{ 
							position: 'relative', 
							display: 'flex', 
							alignItems: 'stretch', 
							gap: '0.5rem' 
						}}>
							<FormInput
								type="text"
								placeholder="user@example.com or username"
								value={loginHint}
								onChange={(e) => onLoginHintChange?.(e.target.value)}
								style={{ flex: 1 }}
								disabled={false}
								readOnly={false}
								data-field="login-hint"
							/>
							{loginHint && (
								<div style={{ 
									display: 'flex', 
									alignItems: 'center', 
									height: '100%' 
								}}>
									{CopyButtonVariants.identifier(loginHint, 'Login Hint')}
								</div>
							)}
						</div>
						<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
							Hint about the user identifier (email, username). Helps pre-fill the login form or
							skip account selection.
						</div>
					</FormField>
				)}

				{showPostLogoutRedirectUri && (
					<FormField style={{ gridColumn: '1 / -1' }}>
						<FormLabel>
							Post-Logout Redirect URI <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>(Optional)</span>
						</FormLabel>
						<div style={{ 
							position: 'relative', 
							display: 'flex', 
							alignItems: 'stretch', 
							gap: '0.5rem' 
						}}>
							<FormInput
								type="text"
								placeholder="https://localhost:3000/logout-callback"
								value={postLogoutRedirectUri || 'https://localhost:3000/logout-callback'}
								onChange={(e) => onPostLogoutRedirectUriChange?.(e.target.value)}
								style={{ flex: 1 }}
								disabled={false}
								readOnly={false}
							/>
							<div style={{ 
								display: 'flex', 
								alignItems: 'center', 
								height: '100%' 
							}}>
								{CopyButtonVariants.url(postLogoutRedirectUri || 'https://localhost:3000/logout-callback', 'Post-Logout Redirect URI')}
							</div>
						</div>
						<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
							URL to redirect users after logout. Add this to your PingOne application's Post-Logout Redirect URIs.
						</div>
					</FormField>
				)}
			</FormGrid>

			{showResponseModeSelector && (
				<>
					<SectionDivider />
					<ResponseModeSelector
						flowKey={flowKey}
						responseType={responseType}
						redirectUri={redirectUri}
						clientId={clientId}
						scope={scopes}
						state="random_state_123"
						nonce="random_nonce_456"
						defaultMode={responseMode}
						readOnlyFlowContext={false}
						onModeChange={onResponseModeChange || (() => {})}
					/>
				</>
			)}

			{/* Save Button */}
			{onSave && (
				<div style={{ 
					marginTop: '1.5rem', 
					paddingTop: '1rem', 
					borderTop: '1px solid #e5e7eb',
					display: 'flex',
					justifyContent: 'flex-start'
				}}>
					<button
						type="button"
						onClick={onSave}
						disabled={isSaving}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							padding: '0.75rem 1.5rem',
							backgroundColor: '#10b981',
							color: 'white',
							border: '1px solid #10b981',
							borderRadius: '0.5rem',
							fontSize: '0.875rem',
							fontWeight: '600',
							cursor: isSaving ? 'not-allowed' : 'pointer',
							opacity: isSaving ? 0.7 : 1,
							transition: 'all 0.2s ease',
						}}
						onMouseEnter={(e) => {
							if (!isSaving) {
								e.currentTarget.style.backgroundColor = '#059669';
								e.currentTarget.style.borderColor = '#059669';
							}
						}}
						onMouseLeave={(e) => {
							if (!isSaving) {
								e.currentTarget.style.backgroundColor = '#10b981';
								e.currentTarget.style.borderColor = '#10b981';
							}
						}}
					>
						{isSaving ? (
							<>
								<div style={{
									width: '16px',
									height: '16px',
									border: '2px solid #ffffff',
									borderTop: '2px solid transparent',
									borderRadius: '50%',
									animation: 'spin 1s linear infinite'
								}} />
								<style>{`
									@keyframes spin {
										0% { transform: rotate(0deg); }
										100% { transform: rotate(360deg); }
									}
								`}</style>
								Saving...
							</>
						) : (
							<>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
									<polyline points="17,21 17,13 7,13 7,21" />
									<polyline points="7,3 7,8 15,8" />
								</svg>
								{hasUnsavedChanges ? 'Save Changes' : 'Save Credentials'}
							</>
						)}
					</button>
				</div>
			)}
				</form>
			</CollapsibleContent>
		</CollapsibleContainer>
	);
};

export default CredentialsInput;
