// src/components/PingOneApplicationConfig.tsx
import React from 'react';
import { FiCheck, FiGlobe, FiKey, FiSave, FiSettings, FiShield } from 'react-icons/fi';
import styled from 'styled-components';
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
}) => {
	const update = (updates: Partial<PingOneApplicationState>) => {
		onChange({ ...value, ...updates });
	};

	return (
		<div>
			<SectionTitle style={{ fontSize: '1.125rem', marginBottom: '1.5rem', color: '#1f2937' }}>
				<FiSettings /> PingOne Advanced Configuration
			</SectionTitle>
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
							Requires authorization requests to be pushed via PAR endpoint before the authorization
							flow begins, providing better security for SPA applications
						</Helper>

						<UrlExampleContainer style={{ width: '100%' }}>
							<UrlExample style={{ width: '100%' }}>
								<UrlLabel>Without PAR:</UrlLabel>
								<ColoredUrlDisplay
									url="https://auth.pingone.com/env/as/authorize?response_type=code&client_id=...&redirect_uri=...&scope=openid&state=..."
									title="Authorization URL without PAR"
									showCopyButton={true}
									showExplanationButton={true}
								/>
							</UrlExample>

							<UrlExample style={{ width: '100%' }}>
								<UrlLabel>With PAR:</UrlLabel>
								<ColoredUrlDisplay
									url="https://auth.pingone.com/env/as/authorize?request_uri=urn:ietf:params:oauth:request_uri:..."
									title="Authorization URL with PAR"
									showCopyButton={true}
									showExplanationButton={true}
								/>
							</UrlExample>
						</UrlExampleContainer>
					</Field>
				</Grid>
			</Section>

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
							disabled
							style={{ cursor: 'not-allowed', opacity: 0.6 }}
							aria-pressed={value.enableJWKS}
							role="switch"
							aria-label="Enable JWKS"
						>
							<span />
						</Toggle>
						<Helper style={{ color: '#059669', fontWeight: '500' }}>
							⚙️ Configured in PingOne → Enable JWKS in your PingOne application settings to see JWT
							signature validation features
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
											disabled
											style={{ cursor: 'not-allowed' }}
										/>
										JWKS URL
									</RadioLabel>
									<RadioLabel>
										<input
											type="radio"
											name="jwksMethod"
											value="JWKS"
											checked={value.jwksMethod === 'JWKS'}
											disabled
											style={{ cursor: 'not-allowed' }}
										/>
										JWKS
									</RadioLabel>
								</RadioGroup>
								<Helper style={{ color: '#059669', fontWeight: '500' }}>
									⚙️ Configured in PingOne → Set your JWKS method in PingOne application
									configuration
								</Helper>
							</Field>

							{value.jwksMethod === 'JWKS_URL' && (
								<Field style={{ gridColumn: '1 / -1' }}>
									<Label htmlFor="jwks-url">JWKS URL</Label>
									<Input
										id="jwks-url"
										type="url"
										value={value.jwksUrl}
										disabled
										style={{ backgroundColor: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }}
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
										disabled
										style={{ backgroundColor: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }}
										placeholder='{"keys": [...]}'
									/>
									<Helper style={{ color: '#059669', fontWeight: '500' }}>
										⚙️ Configured in PingOne → Set your JWKS JSON in PingOne application settings
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
						disabled={!hasUnsavedChanges || isSaving}
						$hasChanges={hasUnsavedChanges}
						$isSaving={isSaving}
						title={
							isSaving
								? 'Saving...'
								: hasUnsavedChanges
									? 'Save PingOne configuration'
									: 'No unsaved changes'
						}
					>
						{isSaving ? (
							<>
								<FiSave className="animate-spin" />
								Saving...
							</>
						) : hasUnsavedChanges ? (
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

export default PingOneApplicationConfig;
