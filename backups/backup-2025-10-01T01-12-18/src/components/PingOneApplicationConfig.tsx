// src/components/PingOneApplicationConfig.tsx
import React from 'react';
import { FiGlobe, FiKey, FiSettings, FiShield } from 'react-icons/fi';
import styled from 'styled-components';

export interface PingOneApplicationState {
	clientAuthMethod:
		| 'client_secret_post'
		| 'client_secret_basic'
		| 'client_secret_jwt'
		| 'private_key_jwt'
		| 'none';
	allowRedirectUriPatterns: boolean;
	pkceEnforcement: 'OPTIONAL' | 'REQUIRED' | 'S256_REQUIRED';

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
	
	&:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

const PingOneApplicationConfig: React.FC<PingOneApplicationConfigProps> = ({ value, onChange }) => {
	const update = (updates: Partial<PingOneApplicationState>) => {
		onChange({ ...value, ...updates });
	};

	return (
		<div>
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
							onChange={(e) => update({ clientAuthMethod: e.target.value as any })}
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
							onChange={(e) => update({ pkceEnforcement: e.target.value as any })}
						>
							<option value="OPTIONAL">Optional</option>
							<option value="REQUIRED">Required</option>
							<option value="S256_REQUIRED">S256 Required</option>
						</Select>
						<Helper>PingOne can enforce PKCE for public clients</Helper>
					</Field>
				</Grid>
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
							onClick={() => update({ enableJWKS: !value.enableJWKS })}
							aria-pressed={value.enableJWKS}
							role="switch"
							aria-label="Enable JWKS"
						>
							<span />
						</Toggle>
						<Helper>Enable JSON Web Key Set for token signature validation</Helper>
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
											onChange={() => update({ jwksMethod: 'JWKS_URL' })}
										/>
										JWKS URL
									</RadioLabel>
									<RadioLabel>
										<input
											type="radio"
											name="jwksMethod"
											value="JWKS"
											checked={value.jwksMethod === 'JWKS'}
											onChange={() => update({ jwksMethod: 'JWKS' })}
										/>
										JWKS
									</RadioLabel>
								</RadioGroup>
							</Field>

							{value.jwksMethod === 'JWKS_URL' && (
								<Field style={{ gridColumn: '1 / -1' }}>
									<Label htmlFor="jwks-url">JWKS URL</Label>
									<Input
										id="jwks-url"
										type="url"
										value={value.jwksUrl}
										onChange={(e) => update({ jwksUrl: e.target.value })}
										placeholder="https://example.com/.well-known/jwks.json"
									/>
									<Helper>URL where the JSON Web Key Set is hosted</Helper>
								</Field>
							)}

							{value.jwksMethod === 'JWKS' && (
								<Field style={{ gridColumn: '1 / -1' }}>
									<Label htmlFor="jwks">JWKS (JSON)</Label>
									<Textarea
										id="jwks"
										value={value.jwks}
										onChange={(e) => update({ jwks: e.target.value })}
										placeholder='{"keys": [...]}'
									/>
									<Helper>Paste your JWKS JSON directly</Helper>
								</Field>
							)}
						</>
					)}
				</Grid>
			</Section>

			<Section>
				<SectionTitle>
					<FiShield /> Pushed Authorization Request (PAR)
				</SectionTitle>
				<Grid>
					<Field>
						<CheckboxLabel>
							<Checkbox
								type="checkbox"
								checked={value.requirePushedAuthorizationRequest}
								onChange={(e) => update({ requirePushedAuthorizationRequest: e.target.checked })}
							/>
							Require Pushed Authorization Request
						</CheckboxLabel>
						<Helper>
							Require authorization requests to be pushed to the authorization server first
						</Helper>
					</Field>

					<Field>
						<Label htmlFor="par-timeout">PAR Reference Timeout (seconds)</Label>
						<Input
							id="par-timeout"
							type="number"
							min="10"
							max="600"
							value={value.pushedAuthorizationRequestTimeout}
							onChange={(e) =>
								update({ pushedAuthorizationRequestTimeout: parseInt(e.target.value) || 60 })
							}
						/>
						<Helper>Timeout for the PAR reference (10-600 seconds)</Helper>
					</Field>
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
								update({ requestParameterSignatureRequirement: e.target.value as any })
							}
						>
							<option value="DEFAULT">Default</option>
							<option value="REQUIRE_SIGNED">Require Signed</option>
							<option value="ALLOW_UNSIGNED">Allow Unsigned</option>
						</Select>
						<Helper>Define the signature requirement for request parameters</Helper>
					</Field>

					<Field>
						<CheckboxLabel>
							<Checkbox
								type="checkbox"
								checked={value.additionalRefreshTokenReplayProtection}
								onChange={(e) =>
									update({ additionalRefreshTokenReplayProtection: e.target.checked })
								}
							/>
							Additional Refresh Token Replay Protection
						</CheckboxLabel>
						<Helper>Enable additional protection against refresh token replay attacks</Helper>
					</Field>

					<Field>
						<CheckboxLabel>
							<Checkbox
								type="checkbox"
								checked={value.includeX5tParameter}
								onChange={(e) => update({ includeX5tParameter: e.target.checked })}
							/>
							Include x5t Parameter
						</CheckboxLabel>
						<Helper>
							Include the x5t parameter in the header of access tokens, ID tokens, and JWT-based
							refresh tokens
						</Helper>
					</Field>

					<Field>
						<CheckboxLabel>
							<Checkbox
								type="checkbox"
								checked={value.oidcSessionManagement}
								onChange={(e) => update({ oidcSessionManagement: e.target.checked })}
							/>
							OpenID Connect Session Management
						</CheckboxLabel>
						<Helper>Enable OpenID Connect Session Management for better session control</Helper>
					</Field>

					<Field>
						<CheckboxLabel>
							<Checkbox
								type="checkbox"
								checked={value.requestScopesForMultipleResources}
								onChange={(e) => update({ requestScopesForMultipleResources: e.target.checked })}
							/>
							Request Scopes for Multiple Resources
						</CheckboxLabel>
						<Helper>Enable requesting scopes for accessing multiple resources</Helper>
					</Field>

					<Field>
						<CheckboxLabel>
							<Checkbox
								type="checkbox"
								checked={value.terminateUserSessionByIdToken}
								onChange={(e) => update({ terminateUserSessionByIdToken: e.target.checked })}
							/>
							Terminate User Session by ID Token
						</CheckboxLabel>
						<Helper>Allow user sessions to be terminated using an ID token</Helper>
					</Field>
				</Grid>
			</Section>
		</div>
	);
};

export default PingOneApplicationConfig;
