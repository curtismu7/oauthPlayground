// src/components/PingOneApplicationConfig.tsx

import { FiCheck, FiGlobe, FiInfo, FiKey, FiSave, FiSettings, FiShield } from '@icons';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { DPoPStatus } from '../services/dpopService';
import { ColoredUrlDisplay } from './ColoredUrlDisplay';

export interface PingOneApplicationState {
	clientAuthMethod:
		| 'client_secret_post'
		| 'client_secret_basic'
		| 'client_secret_jwt'
		| 'private_key_jwt'
		| 'none';
	allowRedirectUriPatterns: boolean;
	pkceEnforcement: 'OPTIONAL' | 'REQUIRED' | 'S256_REQUIRED';

	// JWT Authentication Settings
	privateKey?: string; // For private_key_jwt authentication
	keyId?: string; // Key ID for JWKS (optional)

	// Response Types (from OIDC Settings)
	responseTypeCode: boolean;
	responseTypeToken: boolean;
	responseTypeIdToken: boolean;

	// Grant Types (from OIDC Settings)
	grantTypeAuthorizationCode: boolean;

	// Advanced OIDC Parameters
	initiateLoginUri: string;
	targetLinkUri: string;
	signoffUrls: string[];

	// Request Parameter Signature
	requestParameterSignatureRequirement: 'DEFAULT' | 'REQUIRE_SIGNED' | 'ALLOW_UNSIGNED';

	// JWKS Settings
	enableJWKS: boolean;
	jwksMethod: 'JWKS_URL' | 'JWKS';
	jwksUrl: string;
	jwks: string;

	// Pushed Authorization Request (PAR)
	requirePushedAuthorizationRequest: boolean;
	pushedAuthorizationRequestTimeout: number; // in seconds

	// DPoP (Demonstration of Proof of Possession)
	enableDPoP: boolean;
	dpopAlgorithm: 'ES256' | 'RS256';

	// Advanced Security Settings
	additionalRefreshTokenReplayProtection: boolean;
	includeX5tParameter: boolean;
	oidcSessionManagement: boolean;
	requestScopesForMultipleResources: boolean;
	terminateUserSessionByIdToken: boolean;

	// CORS Settings
	corsOrigins: string[];
	corsAllowAnyOrigin: boolean;
}

export interface PingOneApplicationConfigProps {
	value: PingOneApplicationState;
	onChange: (next: PingOneApplicationState) => void;
	initialCollapsed?: boolean;
	onSave?: () => void;
	isSaving?: boolean;
	hasUnsavedChanges?: boolean;
	flowType?: string; // To conditionally hide features that don't make sense for certain flows
}

const Section = styled.div`
	margin: 2rem 0;
`;

const SectionTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #1f2937;
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin-bottom: 1rem;
	
	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const Field = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Label = styled.label`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
`;

const Select = styled.select`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background: white;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Input = styled.input`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	background: #ffffff;
	color: #111827;
	cursor: text;
	pointer-events: auto;
	position: relative;
	z-index: 5;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
`;

const Textarea = styled.textarea`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	font-family: monospace;
	resize: vertical;
	min-height: 120px;
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Toggle = styled.button<{ $active: boolean }>`
	position: relative;
	width: 3rem;
	height: 1.5rem;
	background-color: ${({ $active }) => ($active ? '#22c55e' : '#d1d5db')};
	border: none;
	border-radius: 9999px;
	cursor: pointer;
	transition: background-color 0.2s;
	
	&:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
	}
	
	span {
		position: absolute;
		top: 0.125rem;
		left: ${({ $active }) => ($active ? '1.625rem' : '0.125rem')};
		width: 1.25rem;
		height: 1.25rem;
		background-color: white;
		border-radius: 50%;
		transition: left 0.2s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
`;

const Checkbox = styled.input`
	margin-right: 0.5rem;
`;

const CheckboxLabel = styled.label`
	display: flex;
	align-items: center;
	font-size: 0.875rem;
	color: #374151;
	cursor: pointer;
`;

const Helper = styled.p`
	font-size: 0.75rem;
	color: #6b7280;
	margin: 0.25rem 0 0 0;
	line-height: 1.4;
`;

const RadioGroup = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;
	margin-top: 0.5rem;
`;

const RadioLabel = styled.label`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: #374151;
	cursor: pointer;
`;

const UrlExampleContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: 1rem;
`;

const UrlExample = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const UrlLabel = styled.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
`;

const SaveButtonContainer = styled.div`
	display: flex;
	justify-content: flex-end;
	margin-top: 1.5rem;
	padding-top: 1.5rem;
	border-top: 1px solid #e5e7eb;
`;

const SaveButton = styled.button<{ $hasChanges?: boolean; $isSaving?: boolean }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	border-radius: 0.5rem;
	border: none;
	cursor: pointer;
	transition: all 0.2s;
	
	${({ $hasChanges, $isSaving }) => {
		if ($isSaving) {
			return `
				background: #9ca3af;
				color: white;
				cursor: wait;
			`;
		}
		if ($hasChanges) {
			return `
				background: linear-gradient(135deg, #10b981, #059669);
				color: white;
				box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
				
				&:hover {
					background: linear-gradient(135deg, #059669, #047857);
					box-shadow: 0 6px 8px rgba(16, 185, 129, 0.3);
					transform: translateY(-1px);
				}
			`;
		}
		return `
			background: #e5e7eb;
			color: #6b7280;
			cursor: not-allowed;
		`;
	}}
	
	&:active:not(:disabled) {
		transform: translateY(0);
	}
`;

const PingOneApplicationConfig: React.FC<PingOneApplicationConfigProps> = ({
	value,
	onChange,
	onSave,
	isSaving = false,
	hasUnsavedChanges = false,
	flowType,
}) => {
	// Track initial values to detect changes
	const [initialValues, setInitialValues] = useState(value);

	// Reset initial values when save is successful (when isSaving goes from true to false)
	const [wasSaving, setWasSaving] = useState(false);
	useEffect(() => {
		if (wasSaving && !isSaving) {
			// Save just completed, reset initial values
			setInitialValues(value);
		}
		setWasSaving(isSaving);
	}, [isSaving, value, wasSaving]);

	// Calculate if there are unsaved changes
	const hasActualUnsavedChanges = useMemo(() => {
		// If parent explicitly provides hasUnsavedChanges, use that
		if (hasUnsavedChanges !== false) {
			return hasUnsavedChanges;
		}

		// Otherwise, compare current values with initial values
		return JSON.stringify(value) !== JSON.stringify(initialValues);
	}, [value, initialValues, hasUnsavedChanges]);

	const update = (updates: Partial<PingOneApplicationState>) => {
		onChange({ ...value, ...updates });
	};

	return (
		<div>
			<SectionTitle style={{ fontSize: '1.125rem', marginBottom: '1.5rem', color: '#1f2937' }}>
				<FiSettings /> PingOne Advanced Configuration
			</SectionTitle>
			{/* Hide PAR for flows that don't use authorization endpoints */}
			{!flowType?.includes('client-credentials') &&
				!flowType?.includes('jwt-bearer') &&
				!flowType?.includes('worker-token') &&
				!flowType?.includes('device-authorization') && (
					<Section>
						<SectionTitle>
							<FiShield /> Pushed Authorization Request (PAR)
						</SectionTitle>
						<Grid>
							<Field style={{ gridColumn: '1 / -1', width: '100%' }}>
								<CheckboxLabel>
									<Checkbox
										type="checkbox"
										checked={value.requirePushedAuthorizationRequest}
										onChange={(e) =>
											onChange({ ...value, requirePushedAuthorizationRequest: e.target.checked })
										}
									/>
									Require Pushed Authorization Request
								</CheckboxLabel>
								<Helper>
									Requires authorization requests to be pushed via PAR endpoint before the
									authorization flow begins, providing better security for SPA applications
								</Helper>

								<div
									style={{
										marginTop: '1rem',
										padding: '1rem',
										background: '#f0f9ff',
										border: '1px solid #0ea5e9',
										borderRadius: '6px',
										fontSize: '0.85rem',
									}}
								>
									<h4
										style={{
											margin: '0 0 0.5rem 0',
											color: '#0c4a6e',
											fontSize: '0.9rem',
											fontWeight: '600',
										}}
									>
										🔄 PAR Flow Process
									</h4>
									<ol
										style={{
											margin: 0,
											paddingLeft: '1.5rem',
											color: '#0c4a6e',
											lineHeight: '1.5',
										}}
									>
										<li>
											<strong>Step 1:</strong> Client sends POST request to <code>/as/par</code>{' '}
											with all authorization parameters
										</li>
										<li>
											<strong>Step 2:</strong> PingOne validates the request and returns a{' '}
											<code>request_uri</code>
										</li>
										<li>
											<strong>Step 3:</strong> Client redirects user to <code>/as/authorize</code>{' '}
											with only the <code>request_uri</code>
										</li>
										<li>
											<strong>Step 4:</strong> PingOne retrieves the original parameters using the{' '}
											<code>request_uri</code>
										</li>
										<li>
											<strong>Step 5:</strong> Normal OAuth flow continues with user authentication
										</li>
									</ol>
									<div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#0369a1' }}>
										<strong>Benefits:</strong> Keeps sensitive parameters off the browser URL,
										prevents tampering, and provides better security for SPAs.
									</div>
								</div>

								{/* PingOne PAR Compatibility */}
								<div
									style={{
										marginTop: '1rem',
										padding: '1rem',
										background: '#f0fdf4',
										border: '1px solid #16a34a',
										borderRadius: '6px',
										fontSize: '0.85rem',
									}}
								>
									<h4
										style={{
											margin: '0 0 0.5rem 0',
											color: '#15803d',
											fontSize: '0.9rem',
											fontWeight: '600',
										}}
									>
										✅ PingOne PAR Compatibility
									</h4>
									<div style={{ color: '#15803d', lineHeight: '1.5', marginBottom: '0.5rem' }}>
										<strong>Supported Application Types:</strong>
									</div>
									<ul
										style={{
											margin: '0 0 0.5rem 0',
											paddingLeft: '1.5rem',
											color: '#15803d',
											lineHeight: '1.5',
										}}
									>
										<li>
											<strong>OIDC Web App:</strong> Authorization Code grant type ✅
										</li>
										<li>
											<strong>Native App:</strong> Authorization Code or Implicit grant types ✅
										</li>
										<li>
											<strong>Single-page App:</strong> Implicit grant type ✅
										</li>
										<li>
											<strong>Worker App:</strong> Only if configured for user-based grant types ✅
										</li>
									</ul>
									<div style={{ fontSize: '0.8rem', color: '#16a34a' }}>
										<strong>PingOne Limits:</strong> Max 1MB request size, 60-second default
										lifetime, HTTP POST only, request_uri can only be used once.
									</div>
								</div>

								<UrlExampleContainer style={{ width: '100%' }}>
									<UrlExample style={{ width: '100%' }}>
										<UrlLabel>Without PAR (Traditional Flow):</UrlLabel>
										<ColoredUrlDisplay
											url="https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/authorize?response_type=code&client_id=a4f963ea-0736-456a-be72-b1fa4f63f81f&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fauthz-callback&scope=openid%20profile%20email&state=af0ifjsldkj&code_challenge=4Ey6Qpryp0Z_5BEDPVQf&code_challenge_method=S256&nonce=n-0S6_WzA2Mj"
											title="Authorization URL without PAR"
											showCopyButton={true}
											showExplanationButton={true}
										/>
									</UrlExample>

									<UrlExample style={{ width: '100%' }}>
										<UrlLabel>With PAR (Step 1 - PAR Request):</UrlLabel>
										<ColoredUrlDisplay
											url="https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/par"
											title="PAR Endpoint URL"
											showCopyButton={true}
											showExplanationButton={true}
										/>
										<details style={{ marginTop: '0.5rem' }}>
											<summary
												style={{
													fontSize: '0.8rem',
													color: '#374151',
													cursor: 'pointer',
													fontWeight: '600',
												}}
											>
												📋 Show Complete PAR Request Body
											</summary>
											<div
												style={{
													marginTop: '0.5rem',
													padding: '0.75rem',
													background: '#f8fafc',
													border: '1px solid #e2e8f0',
													borderRadius: '4px',
													fontSize: '0.75rem',
													fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
												}}
											>
												<strong>POST /as/par</strong>
												<br />
												<strong>Content-Type:</strong> application/x-www-form-urlencoded
												<br />
												<br />
												<strong>Request Body:</strong>
												<br />
												client_id=a4f963ea-0736-456a-be72-b1fa4f63f81f
												<br />
												client_secret=0mClRqd3fif2vh4WJCO6B-8OZuOokzsh5gLw1V3GHbeGJYCMLk_zPfrptWzfYJ.a
												<br />
												response_type=code
												<br />
												redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fauthz-callback
												<br />
												scope=openid%20profile%20email
												<br />
												state=af0ifjsldkj
												<br />
												code_challenge=4Ey6Qpryp0Z_5BEDPVQf
												<br />
												code_challenge_method=S256
												<br />
												nonce=n-0S6_WzA2Mj
												<br />
												<br />
												<strong>Response:</strong>
												<br />
												{'{'}
												<br />
												&nbsp;&nbsp;"request_uri":
												"urn:ietf:params:oauth:request_uri:pingone-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
												<br />
												&nbsp;&nbsp;"expires_in": 600
												<br />
												{'}'}
											</div>
										</details>
									</UrlExample>

									<UrlExample style={{ width: '100%' }}>
										<UrlLabel>With PAR (Step 2 - Authorization URL):</UrlLabel>
										<ColoredUrlDisplay
											url="https://auth.pingone.com/b9817c16-9910-4415-b67e-4ac687da74d9/as/authorize?request_uri=urn:ietf:params:oauth:request_uri:pingone-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz&client_id=a4f963ea-0736-456a-be72-b1fa4f63f81f"
											title="Authorization URL with PAR"
											showCopyButton={true}
											showExplanationButton={true}
										/>
										<div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
											<strong>Response from Step 1:</strong>{' '}
											request_uri=urn:ietf:params:oauth:request_uri:pingone-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
										</div>
									</UrlExample>
								</UrlExampleContainer>
							</Field>
						</Grid>
					</Section>
				)}

			{/* DPoP Section - Only show for mock/demo flows since PingOne doesn't support DPoP yet */}
			{DPoPStatus.isSupported() &&
				(flowType?.includes('mock') ||
					flowType?.includes('demo') ||
					flowType?.includes('jwt-bearer')) && ( // JWT Bearer flows are mock implementations
					<Section>
						<SectionTitle>
							<FiShield /> DPoP (Demonstration of Proof of Possession)
						</SectionTitle>
						<Grid>
							<Field style={{ gridColumn: '1 / -1', width: '100%' }}>
								<CheckboxLabel>
									<Checkbox
										type="checkbox"
										checked={value.enableDPoP}
										onChange={(e) => onChange({ ...value, enableDPoP: e.target.checked })}
									/>
									Enable DPoP for enhanced token security
								</CheckboxLabel>
								<Helper>
									<strong>Demo Feature:</strong> Demonstrates DPoP (RFC 9449) implementation for
									educational purposes. PingOne does not currently support DPoP validation, so this
									provides client-side proof generation only.
								</Helper>

								{value.enableDPoP && (
									<div style={{ marginTop: '1rem' }}>
										<Field>
											<Label htmlFor="dpop-algorithm">Signature Algorithm</Label>
											<Select
												id="dpop-algorithm"
												value={value.dpopAlgorithm}
												onChange={(e) =>
													onChange({ ...value, dpopAlgorithm: e.target.value as 'ES256' | 'RS256' })
												}
											>
												<option value="ES256">ES256 (Elliptic Curve - Recommended)</option>
												<option value="RS256">RS256 (RSA)</option>
											</Select>
											<Helper>Cryptographic algorithm used for DPoP proof signatures</Helper>
										</Field>

										<div
											style={{
												marginTop: '1rem',
												padding: '1rem',
												background: '#f8fafc',
												border: '1px solid #e2e8f0',
												borderRadius: '6px',
											}}
										>
											<div style={{ marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
												DPoP Status
											</div>
											<div
												style={{
													display: 'flex',
													flexDirection: 'column',
													gap: '0.25rem',
													fontSize: '0.875rem',
												}}
											>
												<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
													<span style={{ fontWeight: '500' }}>Browser Support:</span>
													<span style={{ color: '#10b981' }}>✓ Supported</span>
												</div>
												<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
													<span style={{ fontWeight: '500' }}>Algorithm:</span>
													<span style={{ color: '#6b7280' }}>{value.dpopAlgorithm}</span>
												</div>
											</div>
										</div>

										<div
											style={{
												marginTop: '1rem',
												display: 'flex',
												gap: '0.75rem',
												padding: '1rem',
												background: '#eff6ff',
												border: '1px solid #bfdbfe',
												borderRadius: '6px',
											}}
										>
											<FiInfo
												color="#1e40af"
												size={20}
												style={{ flexShrink: 0, marginTop: '0.125rem' }}
											/>
											<div>
												<div
													style={{ fontWeight: '600', color: '#1e40af', marginBottom: '0.25rem' }}
												>
													How DPoP Works
												</div>
												<div style={{ color: '#1e40af', fontSize: '0.875rem', lineHeight: '1.4' }}>
													DPoP creates a cryptographic proof for each HTTP request using a private
													key. The authorization server can verify this proof to ensure the request
													comes from the legitimate client, preventing token theft and replay
													attacks.
												</div>
											</div>
										</div>
									</div>
								)}
							</Field>
						</Grid>
					</Section>
				)}

			<Section>
				<SectionTitle>
					<FiSettings /> Client Authentication
				</SectionTitle>
				<Grid>
					<Field>
						<Label htmlFor="client-auth-method">Client Authentication Method</Label>
						<Select
							id="client-auth-method"
							value={value.clientAuthMethod}
							onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
								update({
									clientAuthMethod: e.target.value as PingOneApplicationState['clientAuthMethod'],
								})
							}
						>
							<option value="client_secret_post">Client Secret Post</option>
							<option value="client_secret_basic">Client Secret Basic</option>
							<option value="client_secret_jwt">Client Secret JWT</option>
							<option value="private_key_jwt">Private Key JWT</option>
							<option value="none">None (Public Client)</option>
						</Select>
						<Helper>How the client authenticates with the token endpoint</Helper>
					</Field>

					<Field>
						<Label htmlFor="pkce-enforcement">PKCE Enforcement</Label>
						<Select
							id="pkce-enforcement"
							value={value.pkceEnforcement}
							disabled
							style={{ backgroundColor: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }}
						>
							<option value="OPTIONAL">Optional</option>
							<option value="REQUIRED">Required</option>
							<option value="S256_REQUIRED">S256 Required</option>
						</Select>
						<Helper style={{ color: '#059669', fontWeight: '500' }}>
							⚙️ Configured in PingOne → Enable PKCE enforcement in your PingOne application settings
							to see this feature in the flow
						</Helper>
					</Field>
				</Grid>

				{value.clientAuthMethod === 'private_key_jwt' && (
					<Grid>
						<Field style={{ gridColumn: '1 / -1' }}>
							<Label htmlFor="private-key">Private Key (PKCS8 Format)</Label>
							<Textarea
								id="private-key"
								value={value.privateKey || ''}
								onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
									update({ privateKey: e.target.value })
								}
								placeholder="-----BEGIN PRIVATE KEY-----&#10;MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...&#10;-----END PRIVATE KEY-----"
								rows={8}
								style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
							/>
							<Helper>RSA private key in PKCS8 PEM format for signing JWT assertions</Helper>
						</Field>

						<Field>
							<Label htmlFor="key-id">Key ID (kid) - Optional</Label>
							<Input
								id="key-id"
								type="text"
								value={value.keyId || ''}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									console.log('🔧 PingOne Key ID input changed:', e.target.value);
									update({ keyId: e.target.value });
								}}
								placeholder="my-key-id"
								disabled={false}
								readOnly={false}
							/>
							<Helper>Key identifier to match with JWKS (if using JWKS)</Helper>
						</Field>
					</Grid>
				)}
			</Section>

			<Section>
				<SectionTitle>
					<FiKey /> JSON Web Key Set (JWKS)
				</SectionTitle>
				<Grid>
					<Field style={{ gridColumn: '1 / -1' }}>
						<Label htmlFor="enable-jwks-toggle">Enable JWKS</Label>
						<Toggle
							id="enable-jwks-toggle"
							$active={value.enableJWKS}
							onClick={() => onChange({ ...value, enableJWKS: !value.enableJWKS })}
							aria-pressed={value.enableJWKS}
							role="switch"
							aria-label="Enable JWKS"
						>
							<span />
						</Toggle>
						<Helper style={{ color: '#059669', fontWeight: '500' }}>
							🔧 Enable JWKS to configure JWT signature validation features
						</Helper>
					</Field>

					{value.enableJWKS && (
						<>
							<Field style={{ gridColumn: '1 / -1' }}>
								<Label>JSON Web Key Set Method</Label>
								<RadioGroup>
									<RadioLabel>
										<input
											type="radio"
											name="jwksMethod"
											value="JWKS_URL"
											checked={value.jwksMethod === 'JWKS_URL'}
											onChange={() => onChange({ ...value, jwksMethod: 'JWKS_URL' })}
										/>
										JWKS URL
									</RadioLabel>
									<RadioLabel>
										<input
											type="radio"
											name="jwksMethod"
											value="JWKS"
											checked={value.jwksMethod === 'JWKS'}
											onChange={() => onChange({ ...value, jwksMethod: 'JWKS' })}
										/>
										JWKS
									</RadioLabel>
								</RadioGroup>
								<Helper style={{ color: '#059669', fontWeight: '500' }}>
									🔧 Choose how to provide your JSON Web Key Set
								</Helper>
							</Field>

							{value.jwksMethod === 'JWKS_URL' && (
								<Field style={{ gridColumn: '1 / -1' }}>
									<Label htmlFor="jwks-url">JWKS URL</Label>
									<Input
										id="jwks-url"
										type="url"
										value={value.jwksUrl}
										onChange={(e) => onChange({ ...value, jwksUrl: e.target.value })}
										placeholder="https://example.com/.well-known/jwks.json"
									/>
									<Helper style={{ color: '#059669', fontWeight: '500' }}>
										⚙️ Configured in PingOne → Set your JWKS URL in PingOne application settings
									</Helper>
								</Field>
							)}

							{value.jwksMethod === 'JWKS' && (
								<Field style={{ gridColumn: '1 / -1' }}>
									<Label htmlFor="jwks">JWKS (JSON)</Label>
									<Textarea
										id="jwks"
										value={value.jwks}
										onChange={(e) => onChange({ ...value, jwks: e.target.value })}
										placeholder='{"keys": [...]}'
									/>
									<Helper style={{ color: '#059669', fontWeight: '500' }}>
										🔧 Enter your JSON Web Key Set as JSON
									</Helper>
								</Field>
							)}
						</>
					)}
				</Grid>
			</Section>

			<Section>
				<SectionTitle>
					<FiGlobe /> Advanced Security Settings
				</SectionTitle>
				<Grid>
					<Field>
						<Label htmlFor="request-signature">Request Parameter Signature Requirement</Label>
						<Select
							id="request-signature"
							value={value.requestParameterSignatureRequirement}
							onChange={(e) =>
								onChange({
									...value,
									requestParameterSignatureRequirement: e.target.value as
										| 'DEFAULT'
										| 'REQUIRE_SIGNED'
										| 'ALLOW_UNSIGNED',
								})
							}
						>
							<option value="DEFAULT">Default</option>
							<option value="REQUIRE_SIGNED">Require Signed</option>
							<option value="ALLOW_UNSIGNED">Allow Unsigned</option>
						</Select>
						<Helper>
							Controls whether request parameters must be cryptographically signed for enhanced
							security and integrity
							<br />
							<strong>Default:</strong> Uses PingOne's default signature requirements
							<br />
							<strong>Require Signed:</strong> All requests must include valid signatures
							<br />
							<strong>Allow Unsigned:</strong> Permits requests without signatures (less secure)
						</Helper>
					</Field>

					<Field>
						<CheckboxLabel>
							<Checkbox
								type="checkbox"
								checked={value.additionalRefreshTokenReplayProtection}
								onChange={(e) =>
									onChange({ ...value, additionalRefreshTokenReplayProtection: e.target.checked })
								}
							/>
							Additional Refresh Token Replay Protection
						</CheckboxLabel>
						<Helper>
							Prevents refresh tokens from being used multiple times, enhancing security by ensuring
							each token can only be used once
							<br />
							<strong>Benefit:</strong> Prevents token replay attacks where stolen refresh tokens
							could be reused
						</Helper>
					</Field>

					<Field>
						<CheckboxLabel>
							<Checkbox
								type="checkbox"
								checked={value.includeX5tParameter}
								onChange={(e) => onChange({ ...value, includeX5tParameter: e.target.checked })}
							/>
							Include x5t Parameter
						</CheckboxLabel>
						<Helper>
							Includes the x5t (X.509 certificate thumbprint) parameter in JWT tokens for
							certificate-based authentication validation
							<br />
							<strong>Purpose:</strong> Allows clients to validate that JWTs were signed with the
							expected certificate
						</Helper>
					</Field>

					<Field>
						<CheckboxLabel>
							<Checkbox
								type="checkbox"
								checked={value.oidcSessionManagement}
								onChange={(e) => onChange({ ...value, oidcSessionManagement: e.target.checked })}
							/>
							OpenID Connect Session Management
						</CheckboxLabel>
						<Helper>
							Enables OIDC session management features including session state and logout
							functionality for better user session handling
							<br />
							<strong>Features:</strong> Session state tracking, logout redirection, and improved
							session lifecycle management
						</Helper>
					</Field>

					<Field>
						<CheckboxLabel>
							<Checkbox
								type="checkbox"
								checked={value.requestScopesForMultipleResources}
								onChange={(e) =>
									onChange({ ...value, requestScopesForMultipleResources: e.target.checked })
								}
							/>
							Request Scopes for Multiple Resources
						</CheckboxLabel>
						<Helper>
							Allows requesting permissions across multiple resource servers in a single
							authorization request, useful for microservices architectures
							<br />
							<strong>Use Case:</strong> Applications that need access to multiple APIs/services can
							request all permissions in one authorization flow
						</Helper>
					</Field>

					<Field>
						<CheckboxLabel>
							<Checkbox
								type="checkbox"
								checked={value.terminateUserSessionByIdToken}
								onChange={(e) =>
									onChange({ ...value, terminateUserSessionByIdToken: e.target.checked })
								}
							/>
							Terminate User Session by ID Token
						</CheckboxLabel>
						<Helper>
							Allows terminating user sessions using the ID token, providing a way to logout users
							across all applications
							<br />
							<strong>Benefit:</strong> Enables single logout (SLO) functionality where logging out
							from one application logs the user out from all related applications
						</Helper>
					</Field>
				</Grid>
			</Section>

			{/* Save Button */}
			{onSave && (
				<SaveButtonContainer>
					<SaveButton
						onClick={onSave}
						disabled={!hasActualUnsavedChanges || isSaving}
						$hasChanges={hasActualUnsavedChanges}
						$isSaving={isSaving}
						title={
							isSaving
								? 'Saving...'
								: hasActualUnsavedChanges
									? 'Save PingOne configuration'
									: 'No unsaved changes'
						}
					>
						{isSaving ? (
							<>
								<FiSave className="animate-spin" />
								Saving...
							</>
						) : hasActualUnsavedChanges ? (
							<>
								<FiSave />
								Save Configuration
							</>
						) : (
							<>
								<FiCheck />
								Saved
							</>
						)}
					</SaveButton>
				</SaveButtonContainer>
			)}
		</div>
	);
};

// Default DPoP configuration
export const getDefaultDPoPConfig = () => ({
	enableDPoP: false,
	dpopAlgorithm: 'ES256' as const,
});

export default PingOneApplicationConfig;
