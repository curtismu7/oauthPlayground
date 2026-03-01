// src/components/CredentialsInput.tsx

import { FiChevronDown, FiChevronRight, FiEye, FiEyeOff, FiGlobe, FiSettings } from '@icons';
import { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { callbackUriService } from '../services/callbackUriService';
import { CopyButtonVariants } from '../services/copyButtonService';
import type { DiscoveryResult } from '../services/oidcDiscoveryService';
import EnvironmentIdInput from './EnvironmentIdInput';
import LogoutUriInfoPanel from './LogoutUriInfoPanel';
import ResponseModeSelector, { type ResponseMode } from './response-modes/ResponseModeSelector';

// Global style to force all credential inputs to be editable
export const GlobalInputFix = createGlobalStyle`
	/* CRITICAL: Force all credential inputs to be editable */
	form[data-credentials-form] input[type="text"],
	form[data-credentials-form] input[type="password"],
	form[data-credentials-form] textarea,
	form[data-credentials-form] select {
		pointer-events: auto !important;
		cursor: text !important;
		user-select: text !important;
		-webkit-user-select: text !important;
		z-index: 99999 !important;
		position: relative !important;
		background-color: #ffffff !important;
		opacity: 1 !important;
	}
	
	form[data-credentials-form] input:disabled,
	form[data-credentials-form] input[readonly] {
		pointer-events: auto !important;
		cursor: text !important;
		background-color: #ffffff !important;
	}
`;

// CSS animation for loading spinner (unused - kept for potential future use)
// const spin = keyframes`
// 	0% { transform: rotate(0deg); }
// 	100% { transform: rotate(360deg); }
// `;

export interface CredentialsInputProps {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri?: string;
	scopes?: string;
	loginHint?: string;
	postLogoutRedirectUri?: string;
	region?: 'us' | 'eu' | 'ap' | 'ca';
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
	onScopesBlur?: (value: string) => void;
	onLoginHintChange?: (value: string) => void;
	onPostLogoutRedirectUriChange?: (value: string) => void;
	onRegionChange?: (value: 'us' | 'eu' | 'ap' | 'ca') => void;
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
	autoDiscover?: boolean;
}

const CollapsibleContainer = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	overflow: hidden;
	/* Ensure container allows interactions */
	pointer-events: auto;
	position: relative;
	z-index: 1;
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

const SecretInputWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	width: 100%;
`;

// Icon button for toggling visibility (must be declared before SecretToggleButton)
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

const SecretToggleButton = styled(IconButton)`
	top: 50%;
	right: 3.25rem;
	transform: translateY(-50%);
`;

const SecretCopyButtonSlot = styled.div`
	position: absolute;
	top: 0;
	bottom: 0;
	right: 0.5rem;
	display: flex;
	align-items: center;
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
	/* CRITICAL: Ensure content is interactive when expanded */
	pointer-events: ${({ $collapsed }) => ($collapsed ? 'none' : 'auto')};
	position: relative;
	z-index: 1;
	
	/* Ensure all child elements can receive pointer events when not collapsed */
	* {
		pointer-events: ${({ $collapsed }) => ($collapsed ? 'none' : 'auto')};
	}
	
	/* Force inputs to always be interactive */
	input, textarea, select {
		pointer-events: auto !important;
		cursor: text !important;
	}
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
	/* Ensure grid is interactive */
	pointer-events: auto;
	position: relative;
	z-index: 1;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const FormField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
	position: relative;
	z-index: 5;
	pointer-events: auto;
	
	/* Ensure all inputs in form fields are interactive */
	input, textarea, select {
		pointer-events: auto !important;
		cursor: text !important;
	}
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
	background: #ffffff !important;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	cursor: text !important;
	pointer-events: auto !important;
	position: relative;
	z-index: 10 !important;
	user-select: text !important;
	-webkit-user-select: text !important;

	&:hover {
		border-color: ${({ $hasError }) => ($hasError ? '#ef4444' : '#9ca3af')};
	}

	&:focus {
		outline: none;
		border-color: ${({ $hasError }) => ($hasError ? '#ef4444' : '#2563eb')};
		box-shadow: 0 0 0 3px ${({ $hasError }) => ($hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 99, 235, 0.1)')} !important;
		z-index: 20 !important;
	}

	&::placeholder {
		color: #9ca3af;
	}

	&:disabled {
		background: #ffffff !important;
		color: #111827 !important;
		cursor: text !important;
		pointer-events: auto !important;
	}

	&[readonly] {
		background: #ffffff !important;
		color: #111827 !important;
		cursor: text !important;
		pointer-events: auto !important;
	}
`;

const FormSelect = styled.select`
	width: 100%;
	padding: 0.75rem 0.875rem;
	border: 1px solid #d1d5db;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	transition: all 0.2s ease;
	font-family: inherit;
	background: #ffffff;
	box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	cursor: pointer;
	position: relative;
	z-index: 10;
	user-select: none;

	&:hover {
		border-color: #9ca3af;
	}

	&:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
		z-index: 20;
	}

	&:disabled {
		background: #f9fafb;
		color: #6b7280;
		cursor: not-allowed;
		pointer-events: none;
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
	region = 'us',
	responseMode = 'fragment',
	flowKey = 'authorization_code',
	responseType = 'code',
	onEnvironmentIdChange,
	onClientIdChange,
	onClientSecretChange,
	onRedirectUriChange,
	onScopesChange,
	onScopesBlur,
	onLoginHintChange,
	onPostLogoutRedirectUriChange,
	onRegionChange,
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
	autoDiscover = true,
}: CredentialsInputProps) => {
	const [showClientSecretValue, setShowClientSecretValue] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);

	// Handle scopes change - allow spaces while typing, clean up on blur
	const handleScopesChange = (value: string) => {
		// Just pass through the value as-is to allow typing spaces
		onScopesChange?.(value);
	};

	const handleScopesBlur = (value: string) => {
		// Clean up multiple spaces and trim only on blur
		const cleanedValue = value.replace(/\s+/g, ' ').trim();
		onScopesBlur?.(cleanedValue);
	};

	// Format timestamp as "11/2/2025, 5:23:20 PM"
	const formatTimestamp = (date: Date): string => {
		const month = date.getMonth() + 1;
		const day = date.getDate();
		const year = date.getFullYear();
		let hours = date.getHours();
		const minutes = date.getMinutes().toString().padStart(2, '0');
		const seconds = date.getSeconds().toString().padStart(2, '0');
		const ampm = hours >= 12 ? 'PM' : 'AM';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
		return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
	};

	// Wrap onSave to update timestamp
	const handleSave = () => {
		if (onSave) {
			const timestamp = formatTimestamp(new Date());
			setLastSavedTimestamp(timestamp);
			onSave();
		}
	};

	return (
		<>
			<GlobalInputFix />
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
					<form
						data-credentials-form="true"
						style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}
						onMouseDown={(e) => {
							// Prevent form from blocking input interactions
							if (
								(e.target as HTMLElement).tagName === 'INPUT' ||
								(e.target as HTMLElement).tagName === 'TEXTAREA' ||
								(e.target as HTMLElement).tagName === 'SELECT'
							) {
								e.stopPropagation();
							}
						}}
					>
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
										autoDiscover={autoDiscover}
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
								<div
									style={{
										position: 'relative',
										display: 'flex',
										alignItems: 'stretch',
										gap: '0.5rem',
									}}
								>
									<FormInput
										type="text"
										placeholder={
											emptyRequiredFields.has('environmentId')
												? 'Required: Enter your PingOne Environment ID'
												: 'Enter your PingOne Environment ID'
										}
										value={environmentId}
										onChange={(e) => {
											console.log('Environment ID onChange triggered:', e.target.value);
											onEnvironmentIdChange(e.target.value);
										}}
										disabled={false}
										readOnly={false}
										$hasError={emptyRequiredFields.has('environmentId')}
										style={{
											flex: 1,
											pointerEvents: 'auto' as React.CSSProperties['pointerEvents'],
											userSelect: 'text',
											cursor: 'text',
											position: 'relative',
											zIndex: 9999,
											backgroundColor: '#ffffff',
										}}
										onMouseDown={(e) => {
											e.stopPropagation();
											console.log('Environment ID onMouseDown');
										}}
										onMouseUp={(e) => {
											e.stopPropagation();
											console.log('Environment ID onMouseUp');
										}}
										onFocus={(e) => {
											console.log('Environment ID focused');
											e.target.style.pointerEvents = 'auto';
											e.target.style.userSelect = 'text';
											e.target.style.cursor = 'text';
										}}
										onClick={(e) => {
											console.log('Environment ID clicked');
											(e.target as HTMLInputElement).focus();
										}}
									/>
									{environmentId && (
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												height: '100%',
											}}
										>
											{CopyButtonVariants.identifier(environmentId, 'Environment ID')}
										</div>
									)}
								</div>
							</FormField>

							<FormField>
								<FormLabel>Region</FormLabel>
								<FormSelect
									value={region}
									onChange={(e) => onRegionChange?.(e.target.value as 'us' | 'eu' | 'ap' | 'ca')}
								>
									<option value="us">US (North America)</option>
									<option value="eu">EU (Europe)</option>
									<option value="ap">AP (Asia Pacific)</option>
									<option value="ca">CA (Canada)</option>
								</FormSelect>
								<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
									The region where your PingOne environment is hosted.
								</div>
							</FormField>

							<FormField>
								<FormLabel>
									Client ID <span style={{ color: '#ef4444' }}>*</span>
								</FormLabel>
								<div
									style={{
										position: 'relative',
										display: 'flex',
										alignItems: 'stretch',
										gap: '0.5rem',
									}}
								>
									<FormInput
										type="text"
										placeholder={
											emptyRequiredFields.has('clientId')
												? 'Required: Enter your PingOne Client ID'
												: 'Enter your PingOne Client ID'
										}
										value={clientId}
										onChange={(e) => {
											console.log('Client ID onChange triggered:', e.target.value);
											onClientIdChange(e.target.value);
										}}
										$hasError={emptyRequiredFields.has('clientId')}
										style={{
											flex: 1,
											pointerEvents: 'auto' as React.CSSProperties['pointerEvents'],
											userSelect: 'text',
											cursor: 'text',
											position: 'relative',
											zIndex: 9999,
											backgroundColor: '#ffffff',
										}}
										disabled={false}
										readOnly={false}
										onMouseDown={(e) => {
											e.stopPropagation();
											console.log('Client ID onMouseDown');
										}}
										onMouseUp={(e) => {
											e.stopPropagation();
											console.log('Client ID onMouseUp');
										}}
										onFocus={(e) => {
											console.log('Client ID focused');
											e.target.style.pointerEvents = 'auto';
											e.target.style.userSelect = 'text';
											e.target.style.cursor = 'text';
										}}
										onClick={(e) => {
											e.stopPropagation();
											console.log('Client ID clicked');
											(e.target as HTMLInputElement).focus();
										}}
									/>
									{clientId && (
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												height: '100%',
											}}
										>
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
									<SecretInputWrapper>
										<FormInput
											type={showClientSecretValue ? 'text' : 'password'}
											placeholder={
												emptyRequiredFields.has('clientSecret')
													? 'Required: Enter your PingOne Client Secret'
													: 'Enter your PingOne Client Secret'
											}
											value={clientSecret}
											onChange={(e) => {
												console.log('Client Secret onChange triggered');
												onClientSecretChange(e.target.value);
											}}
											$hasError={emptyRequiredFields.has('clientSecret')}
											style={{
												paddingRight: '6.5rem',
												pointerEvents: 'auto' as React.CSSProperties['pointerEvents'],
												userSelect: 'text',
												cursor: 'text',
												position: 'relative',
												zIndex: 9999,
												backgroundColor: '#ffffff',
											}}
											disabled={false}
											readOnly={false}
											autoComplete="current-password"
											onMouseDown={(e) => {
												e.stopPropagation();
												console.log('Client Secret onMouseDown');
											}}
											onMouseUp={(e) => {
												e.stopPropagation();
												console.log('Client Secret onMouseUp');
											}}
											onFocus={(e) => {
												console.log('Client Secret focused');
												e.target.style.pointerEvents = 'auto';
												e.target.style.userSelect = 'text';
												e.target.style.cursor = 'text';
											}}
											onClick={(e) => {
												e.stopPropagation();
												console.log('Client Secret clicked');
												(e.target as HTMLInputElement).focus();
											}}
										/>
										{clientSecret && (
											<SecretCopyButtonSlot>
												{CopyButtonVariants.identifier(clientSecret, 'Client Secret')}
											</SecretCopyButtonSlot>
										)}
										<SecretToggleButton
											type="button"
											onClick={() => setShowClientSecretValue(!showClientSecretValue)}
											title={showClientSecretValue ? 'Hide client secret' : 'Show client secret'}
										>
											{showClientSecretValue ? <FiEyeOff size={16} /> : <FiEye size={16} />}
										</SecretToggleButton>
									</SecretInputWrapper>
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
										<strong>Note:</strong> Client Secret is not required for this flow type. This
										flow uses public client authentication (client_id only).
									</div>
								</FormField>
							)}

							{showRedirectUri && (
								<FormField style={{ gridColumn: '1 / -1' }}>
									<FormLabel>
										Redirect URI <span style={{ color: '#ef4444' }}>*</span>
									</FormLabel>
									<div
										style={{
											position: 'relative',
											display: 'flex',
											alignItems: 'stretch',
											gap: '0.5rem',
										}}
									>
										<FormInput
											type="text"
											placeholder={
												callbackUriService.getRedirectUriForFlow(flowKey || 'authorization_code')
													.redirectUri
											}
											value={
												redirectUri ||
												callbackUriService.getRedirectUriForFlow(flowKey || 'authorization_code')
													.redirectUri
											}
											onChange={(e) => onRedirectUriChange?.(e.target.value)}
											$hasError={emptyRequiredFields.has('redirectUri')}
											style={{ flex: 1 }}
											disabled={false}
											readOnly={false}
										/>
										{redirectUri && (
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													height: '100%',
												}}
											>
												{CopyButtonVariants.url(redirectUri, 'Redirect URI')}
											</div>
										)}
									</div>
									<div
										style={{
											marginTop: '0.5rem',
											padding: '0.75rem',
											backgroundColor: '#f8fafc',
											border: '1px solid #e2e8f0',
											borderRadius: '0.375rem',
											fontSize: '0.875rem',
											color: '#475569',
										}}
									>
										<strong>
											📋{' '}
											{
												callbackUriService.getRedirectUriForFlow(flowKey || 'authorization_code')
													.description
											}
											:
										</strong>
										<br />
										<code
											style={{
												color: '#1e40af',
												backgroundColor: '#eff6ff',
												padding: '0.125rem 0.25rem',
												borderRadius: '0.25rem',
											}}
										>
											{
												callbackUriService.getRedirectUriForFlow(flowKey || 'authorization_code')
													.redirectUri
											}
										</code>
										<br />
										<span style={{ fontSize: '0.8rem', color: '#64748b' }}>
											{
												callbackUriService.getRedirectUriForFlow(flowKey || 'authorization_code')
													.note
											}
										</span>
										<br />
										<span style={{ fontSize: '1rem', color: '#dc2626', fontWeight: '600' }}>
											⚠️ Add this exact URI to your PingOne application's "Redirect URIs" list
										</span>
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
										<strong>Note:</strong> Redirect URI is not required for this flow type. This
										flow handles authentication without redirects.
									</div>
								</FormField>
							)}

							<FormField style={{ gridColumn: '1 / -1' }}>
								<FormLabel>
									Scopes <span style={{ color: '#ef4444' }}>*</span>
								</FormLabel>
								<div
									style={{
										position: 'relative',
										display: 'flex',
										alignItems: 'stretch', // Changed from 'center' to 'stretch' for perfect alignment
										gap: '0.5rem',
									}}
								>
									<FormInput
										type="text"
										placeholder="openid"
										value={scopes}
										onChange={(e) => {
											console.log('Scopes onChange triggered:', e.target.value);
											handleScopesChange(e.target.value);
										}}
										onBlur={(e) => handleScopesBlur(e.target.value)}
										onKeyDown={(e) => {
											// Ensure space key works
											if (e.key === ' ') {
												e.stopPropagation();
											}
										}}
										$hasError={emptyRequiredFields.has('scopes') || !scopes.includes('openid')}
										style={{
											flex: 1,
											pointerEvents: 'auto' as React.CSSProperties['pointerEvents'],
											userSelect: 'text',
											cursor: 'text',
											position: 'relative',
											zIndex: 9999,
											backgroundColor: '#ffffff',
										}}
										disabled={false}
										readOnly={false}
										onMouseDown={(e) => {
											e.stopPropagation();
											console.log('Scopes onMouseDown');
										}}
										onClick={(e) => {
											e.stopPropagation();
											console.log('Scopes clicked');
											(e.target as HTMLInputElement).focus();
										}}
										onFocus={(e) => {
											console.log('Scopes focused');
											e.target.style.pointerEvents = 'auto';
											e.target.style.userSelect = 'text';
											e.target.style.cursor = 'text';
										}}
									/>
									{scopes && (
										<div
											style={{
												display: 'flex',
												alignItems: 'center', // Center the copy button within its container
												height: '100%', // Match the input field height
											}}
										>
											{CopyButtonVariants.identifier(scopes, 'Scopes')}
										</div>
									)}
								</div>
								<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
									Space-separated list of scopes. <strong>openid</strong> is always required and
									will be automatically added.
								</div>
							</FormField>

							{showLoginHint && (
								<FormField style={{ gridColumn: '1 / -1' }}>
									<FormLabel>
										Login Hint{' '}
										<span style={{ color: '#6b7280', fontSize: '0.75rem' }}>(Optional)</span>
									</FormLabel>
									<div
										style={{
											position: 'relative',
											display: 'flex',
											alignItems: 'stretch',
											gap: '0.5rem',
										}}
									>
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
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													height: '100%',
												}}
											>
												{CopyButtonVariants.identifier(loginHint, 'Login Hint')}
											</div>
										)}
									</div>
									<div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
										Hint about the user identifier (email, username). Helps pre-fill the login form
										or skip account selection.
									</div>
								</FormField>
							)}

							{showPostLogoutRedirectUri && (
								<FormField style={{ gridColumn: '1 / -1' }}>
									<FormLabel>
										🚪 Post-Logout Redirect URI{' '}
										<span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
											(Required for Logout)
										</span>
									</FormLabel>
									<div
										style={{
											position: 'relative',
											display: 'flex',
											alignItems: 'stretch',
											gap: '0.5rem',
										}}
									>
										<FormInput
											type="text"
											placeholder={
												callbackUriService.getRedirectUriForFlow(flowKey || 'authorization_code')
													.logoutUri
											}
											value={
												postLogoutRedirectUri ||
												callbackUriService.getRedirectUriForFlow(flowKey || 'authorization_code')
													.logoutUri
											}
											onChange={(e) => onPostLogoutRedirectUriChange?.(e.target.value)}
											style={{ flex: 1 }}
											disabled={false}
											readOnly={false}
										/>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												height: '100%',
											}}
										>
											{CopyButtonVariants.url(
												postLogoutRedirectUri ||
													callbackUriService.getRedirectUriForFlow(flowKey || 'authorization_code')
														.logoutUri,
												'Post-Logout Redirect URI'
											)}
										</div>
									</div>

									{/* Enhanced Logout URI Information Panel */}
									<LogoutUriInfoPanel flowKey={flowKey || 'authorization_code'} compact={true} />
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
							<div
								style={{
									marginTop: '1.5rem',
									paddingTop: '1rem',
									borderTop: '1px solid #e5e7eb',
									display: 'flex',
									flexDirection: 'column',
									gap: '0.5rem',
								}}
							>
								<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
									<button
										type="button"
										onClick={handleSave}
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
												<div
													style={{
														width: '16px',
														height: '16px',
														border: '2px solid #ffffff',
														borderTop: '2px solid transparent',
														borderRadius: '50%',
														animation: 'spin 1s linear infinite',
													}}
												/>
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
												<svg
													width="16"
													height="16"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
												>
													<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
													<polyline points="17,21 17,13 7,13 7,21" />
													<polyline points="7,3 7,8 15,8" />
												</svg>
												{hasUnsavedChanges ? 'Save Changes' : 'Save Credentials'}
											</>
										)}
									</button>
								</div>
								{lastSavedTimestamp && (
									<div
										style={{
											fontSize: '0.75rem',
											color: '#6b7280',
											fontStyle: 'italic',
										}}
									>
										Last saved {lastSavedTimestamp}
									</div>
								)}
							</div>
						)}
					</form>
				</CollapsibleContent>
			</CollapsibleContainer>
		</>
	);
};

export default CredentialsInput;
