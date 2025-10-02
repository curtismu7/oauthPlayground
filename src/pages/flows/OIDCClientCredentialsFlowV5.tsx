// src/pages/flows/OIDCClientCredentialsFlowV5.tsx
// OIDC-Compatible Client Credentials Flow - V5 Implementation
import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiAlertTriangle,
	FiCheckCircle,
	FiChevronDown,
	FiClock,
	FiCopy,
	FiExternalLink,
	FiInfo,
	FiKey,
	FiLock,
	FiRefreshCw,
	FiServer,
	FiShield,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import FlowInfoCard from '../../components/FlowInfoCard';
import FlowSequenceDisplay from '../../components/FlowSequenceDisplay';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import { ResultsHeading, ResultsSection } from '../../components/ResultsPanel';
import { ClientAuthMethod, useClientCredentialsFlow } from '../../hooks/useClientCredentialsFlow';
import { getFlowInfo } from '../../utils/flowInfoConfig';
import { v4ToastManager } from '../../utils/v4ToastMessages';

// Styled Components (V5 Parity) - Reusing from Client Credentials
const FlowContainer = styled.div`
	min-height: 100vh;
	background-color: var(--color-background, #f9fafb);
	padding: 2rem 0 6rem;
`;

const FlowContent = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const FlowHeader = styled.div`
	background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
	color: #ffffff;
	padding: 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-radius: 1rem 1rem 0 0;
	box-shadow: 0 10px 25px rgba(8, 145, 178, 0.2);
`;

const FlowTitle = styled.h2`
	font-size: 2rem;
	font-weight: 700;
	margin: 0;
	color: #ffffff;
`;

const FlowSubtitle = styled.p`
	font-size: 1rem;
	color: rgba(255, 255, 255, 0.9);
	margin: 0.5rem 0 0 0;
`;

const StepBadge = styled.span`
	background: rgba(8, 145, 178, 0.2);
	border: 1px solid #67e8f9;
	color: #cffafe;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	display: inline-block;
	margin-bottom: 0.5rem;
`;

const CollapsibleSection = styled.section`
	border: 1px solid var(--color-border, #e2e8f0);
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: var(--color-surface, #ffffff);
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeaderButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.5rem;
	background: transparent;
	border: none;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover {
		background-color: rgba(0, 0, 0, 0.02);
	}
`;

const CollapsibleTitle = styled.h3`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1.25rem;
	font-weight: 600;
	color: var(--color-text-primary, #1e293b);
	margin: 0;

	svg {
		color: var(--color-primary, #0891b2);
	}
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed: boolean }>`
	color: var(--color-text-secondary, #64748b);
	transition: transform 0.2s ease;
	transform: ${(props) => (props.$collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
	display: flex;
	align-items: center;
`;

const CollapsibleContent = styled.div`
	padding: 0 1.5rem 1.5rem;
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--color-text-primary, #1e293b);
	margin-bottom: 0.5rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	font-size: 1rem;
	border: 1px solid var(--color-border, #e2e8f0);
	border-radius: 0.5rem;
	background-color: var(--color-surface, #ffffff);
	color: var(--color-text-primary, #1e293b);
	transition: border-color 0.2s, box-shadow 0.2s;

	&:focus {
		outline: none;
		border-color: var(--color-primary, #0891b2);
		box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
	}

	&:disabled {
		background-color: #f1f5f9;
		cursor: not-allowed;
	}
`;

const Select = styled.select`
	width: 100%;
	padding: 0.75rem;
	font-size: 1rem;
	border: 1px solid var(--color-border, #e2e8f0);
	border-radius: 0.5rem;
	background-color: var(--color-surface, #ffffff);
	color: var(--color-text-primary, #1e293b);
	transition: border-color 0.2s, box-shadow 0.2s;

	&:focus {
		outline: none;
		border-color: var(--color-primary, #0891b2);
		box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
	}
`;

const _TextArea = styled.textarea`
	width: 100%;
	padding: 0.75rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	border: 1px solid var(--color-border, #e2e8f0);
	border-radius: 0.5rem;
	background-color: var(--color-surface, #ffffff);
	color: var(--color-text-primary, #1e293b);
	transition: border-color 0.2s, box-shadow 0.2s;
	min-height: 120px;
	resize: vertical;

	&:focus {
		outline: none;
		border-color: var(--color-primary, #0891b2);
		box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
	}
`;

const Button = styled.button<{ $variant?: 'primary' | 'outline' | 'danger' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	font-size: 1rem;
	font-weight: 600;
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s;
	border: 2px solid;

	${(props) => {
		if (props.$variant === 'danger') {
			return `
				background-color: #ef4444;
				border-color: #ef4444;
				color: #ffffff;
				&:hover:not(:disabled) {
					background-color: #dc2626;
					border-color: #dc2626;
				}
			`;
		}
		if (props.$variant === 'outline') {
			return `
				background-color: transparent;
				border-color: var(--color-primary, #0891b2);
				color: var(--color-primary, #0891b2);
				&:hover:not(:disabled) {
					background-color: rgba(8, 145, 178, 0.1);
				}
			`;
		}
		return `
			background-color: var(--color-primary, #0891b2);
			border-color: var(--color-primary, #0891b2);
			color: #ffffff;
			&:hover:not(:disabled) {
				background-color: #0e7490;
				border-color: #0e7490;
			}
		`;
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ActionRow = styled.div`
	display: flex;
	gap: 1rem;
	margin-top: 1.5rem;
	flex-wrap: wrap;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'error' }>`
	display: flex;
	gap: 1rem;
	padding: 1rem;
	border-radius: 0.5rem;
	margin: 1rem 0;

	${(props) => {
		switch (props.$variant) {
			case 'warning':
				return `
					background-color: #fef3c7;
					border: 1px solid #fbbf24;
					color: #92400e;
				`;
			case 'success':
				return `
					background-color: #dcfce7;
					border: 1px solid #4ade80;
					color: #166534;
				`;
			case 'error':
				return `
					background-color: #fee2e2;
					border: 1px solid #f87171;
					color: #991b1b;
				`;
			default:
				return `
					background-color: #dbeafe;
					border: 1px solid #60a5fa;
					color: #1e40af;
				`;
		}
	}}

	svg {
		flex-shrink: 0;
		margin-top: 0.125rem;
	}
`;

const InfoTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	margin: 0 0 0.5rem 0;
`;

const InfoText = styled.p`
	font-size: 0.875rem;
	line-height: 1.6;
	margin: 0;
`;

const TokenDisplay = styled.div`
	background: #f0fdf4;
	color: #15803d;
	border: 2px solid #16a34a;
	border-radius: 0.5rem;
	padding: 1rem;
	box-shadow: 0 1px 3px rgba(22, 163, 74, 0.1);
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow-x: auto;
	white-space: pre-wrap;
	word-break: break-all;
	position: relative;
`;

const TokenMask = styled.div`
	filter: blur(4px);
	user-select: none;
`;

const ExpiryChip = styled.span<{ $expired?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	background-color: ${(props) => (props.$expired ? '#fee2e2' : '#dcfce7')};
	color: ${(props) => (props.$expired ? '#991b1b' : '#166534')};
	border: 1px solid ${(props) => (props.$expired ? '#f87171' : '#4ade80')};
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	margin: 1rem 0;
`;

const ParameterItem = styled.div`
	padding: 0.75rem;
	background-color: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
`;

const ParameterLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #64748b;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.25rem;
`;

const ParameterValue = styled.div`
	font-size: 0.875rem;
	color: #1e293b;
	font-weight: 500;
	word-break: break-word;
`;

const OIDCClientCredentialsFlowV5: React.FC = () => {
	const clientCredsFlow = useClientCredentialsFlow();

	// Local form state - OIDC specific defaults
	const [formData, setFormData] = useState({
		issuer: clientCredsFlow.config?.issuer || '',
		clientId: clientCredsFlow.config?.clientId || '',
		clientSecret: clientCredsFlow.config?.clientSecret || '',
		authMethod: clientCredsFlow.config?.authMethod || ('client_secret_post' as ClientAuthMethod),
		// OIDC-style scopes (note: 'openid' will typically be rejected/ignored)
		scopes: clientCredsFlow.config?.scopes || 'api:read api:write',
		audience: clientCredsFlow.config?.audience || '',
		resource: clientCredsFlow.config?.resource || '',
		tokenEndpoint: clientCredsFlow.config?.tokenEndpoint || '',
		jwtSigningAlg: clientCredsFlow.config?.jwtSigningAlg || 'HS256',
		jwtSigningKid: clientCredsFlow.config?.jwtSigningKid || '',
		jwtPrivateKey: clientCredsFlow.config?.jwtPrivateKey || '',
		enableMtls: clientCredsFlow.config?.enableMtls || false,
	});

	const [showTokens, setShowTokens] = useState(false);
	const [collapsedSections, setCollapsedSections] = useState({
		configuration: false,
		oidcDifferences: false,
		howItWorks: true,
		tokens: false,
	});

	// Load saved config on mount
	useEffect(() => {
		if (clientCredsFlow.config) {
			setFormData({
				issuer: clientCredsFlow.config.issuer || '',
				clientId: clientCredsFlow.config.clientId || '',
				clientSecret: clientCredsFlow.config.clientSecret || '',
				authMethod: clientCredsFlow.config.authMethod || 'client_secret_post',
				scopes: clientCredsFlow.config.scopes || 'api:read api:write',
				audience: clientCredsFlow.config.audience || '',
				resource: clientCredsFlow.config.resource || '',
				tokenEndpoint: clientCredsFlow.config.tokenEndpoint || '',
				jwtSigningAlg: clientCredsFlow.config.jwtSigningAlg || 'HS256',
				jwtSigningKid: clientCredsFlow.config.jwtSigningKid || '',
				jwtPrivateKey: clientCredsFlow.config.jwtPrivateKey || '',
				enableMtls: clientCredsFlow.config.enableMtls || false,
			});
		}
	}, [clientCredsFlow.config]);

	const toggleSection = useCallback((section: keyof typeof collapsedSections) => {
		setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
	}, []);

	const handleInputChange = useCallback((field: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	}, []);

	const handleSaveConfiguration = useCallback(() => {
		// Warn if 'openid' scope is included
		if (formData.scopes.includes('openid')) {
			v4ToastManager.showWarning(
				'Warning: "openid" scope typically ignored in Client Credentials (no user context)'
			);
		}

		clientCredsFlow.setConfig({
			issuer: formData.issuer,
			clientId: formData.clientId,
			clientSecret: formData.clientSecret,
			authMethod: formData.authMethod,
			scopes: formData.scopes,
			audience: formData.audience,
			resource: formData.resource,
			tokenEndpoint: formData.tokenEndpoint,
			jwtSigningAlg: formData.jwtSigningAlg,
			jwtSigningKid: formData.jwtSigningKid,
			jwtPrivateKey: formData.jwtPrivateKey,
			enableMtls: formData.enableMtls,
		});
		v4ToastManager.showSuccess('Configuration saved!');
	}, [formData, clientCredsFlow]);

	const handleRequestToken = useCallback(async () => {
		await clientCredsFlow.requestToken();
		setCollapsedSections((prev) => ({ ...prev, tokens: false }));
	}, [clientCredsFlow]);

	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard!`);
	}, []);

	const handleReset = useCallback(() => {
		clientCredsFlow.reset();
		setShowTokens(false);
	}, [clientCredsFlow]);

	const renderOIDCDifferences = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton
				onClick={() => toggleSection('oidcDifferences')}
				aria-expanded={!collapsedSections.oidcDifferences}
			>
				<CollapsibleTitle>
					<FiAlertTriangle /> OAuth vs OIDC Client Credentials
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={collapsedSections.oidcDifferences}>
					<FiChevronDown />
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>
			{!collapsedSections.oidcDifferences && (
				<CollapsibleContent>
					<InfoBox $variant="warning">
						<FiAlertTriangle size={20} />
						<div>
							<InfoTitle>⚠️ Common Misconception</InfoTitle>
							<InfoText>
								<strong>OIDC Client Credentials does NOT issue ID Tokens!</strong>
								<br />
								<br />
								OIDC only issues ID Tokens when a <strong>user authenticates</strong>. Client
								Credentials is machine-to-machine with no user involved, so you'll only receive an{' '}
								<strong>Access Token</strong>.
							</InfoText>
						</div>
					</InfoBox>

					<ExplanationSection>
						<ExplanationHeading style={{ fontSize: '1.1rem' }}>
							<FiInfo /> Key Differences
						</ExplanationHeading>
						<div style={{ marginTop: '1rem' }}>
							<table style={{ width: '100%', borderCollapse: 'collapse' }}>
								<thead>
									<tr style={{ backgroundColor: '#f8fafc' }}>
										<th
											style={{
												padding: '0.75rem',
												textAlign: 'left',
												borderBottom: '2px solid #e2e8f0',
											}}
										>
											Aspect
										</th>
										<th
											style={{
												padding: '0.75rem',
												textAlign: 'left',
												borderBottom: '2px solid #e2e8f0',
											}}
										>
											OAuth 2.0
										</th>
										<th
											style={{
												padding: '0.75rem',
												textAlign: 'left',
												borderBottom: '2px solid #e2e8f0',
											}}
										>
											OIDC
										</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
											<strong>Standard Spec</strong>
										</td>
										<td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
											RFC 6749 Section 4.4
										</td>
										<td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
											Same (OIDC assumes user context)
										</td>
									</tr>
									<tr>
										<td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
											<strong>Tokens Returned</strong>
										</td>
										<td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
											Access Token only
										</td>
										<td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
											Access Token only (no ID Token)
										</td>
									</tr>
									<tr>
										<td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
											<strong>Subject (sub)</strong>
										</td>
										<td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
											The client app
										</td>
										<td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
											Still the client (not a user)
										</td>
									</tr>
									<tr>
										<td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
											<strong>User Identity</strong>
										</td>
										<td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>None</td>
										<td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
											None (OIDC adds nothing here)
										</td>
									</tr>
									<tr>
										<td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
											<strong>Claims Structure</strong>
										</td>
										<td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
											Basic (iss, aud, scope)
										</td>
										<td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
											May include OIDC-style claims
										</td>
									</tr>
									<tr>
										<td style={{ padding: '0.75rem' }}>
											<strong>Use Case</strong>
										</td>
										<td style={{ padding: '0.75rem' }}>M2M, API-to-API</td>
										<td style={{ padding: '0.75rem' }}>Same (system-level APIs)</td>
									</tr>
								</tbody>
							</table>
						</div>
					</ExplanationSection>

					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<InfoTitle>What About "openid" Scope?</InfoTitle>
							<InfoText>
								If you request <code>scope=openid</code> with Client Credentials:
								<ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', marginBottom: 0 }}>
									<li>
										Most OIDC providers will <strong>reject</strong> the request
									</li>
									<li>
										Some will <strong>ignore</strong> the openid scope
									</li>
									<li>You'll still only get an Access Token (no ID Token)</li>
									<li>
										<strong>Reason:</strong> openid requires user authentication, which doesn't
										exist in Client Credentials
									</li>
								</ul>
							</InfoText>
						</div>
					</InfoBox>

					<InfoBox $variant="success">
						<FiCheckCircle size={20} />
						<div>
							<InfoTitle>What OIDC Adds (When Available)</InfoTitle>
							<InfoText>
								If your OIDC provider supports Client Credentials:
								<ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', marginBottom: 0 }}>
									<li>
										<strong>OIDC-style claims</strong> in the Access Token (iss, aud, client_id)
									</li>
									<li>
										<strong>Standardized endpoints</strong> (/.well-known/openid-configuration)
									</li>
									<li>
										<strong>JWKS for verification</strong> (public keys at /.well-known/jwks.json)
									</li>
									<li>
										<strong>System/client-level scopes</strong> for OIDC-protected APIs
									</li>
								</ul>
							</InfoText>
						</div>
					</InfoBox>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderConfiguration = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton
				onClick={() => toggleSection('configuration')}
				aria-expanded={!collapsedSections.configuration}
			>
				<CollapsibleTitle>
					<FiZap /> Configuration
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={collapsedSections.configuration}>
					<FiChevronDown />
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>
			{!collapsedSections.configuration && (
				<CollapsibleContent>
					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<InfoText>
								<strong>OIDC Provider:</strong> Use an OIDC-compliant authorization server (e.g.,
								PingOne, Okta, Auth0). The token endpoint and claims structure will follow OIDC
								standards.
							</InfoText>
						</div>
					</InfoBox>

					<FormGroup>
						<Label>OIDC Issuer URL *</Label>
						<Input
							type="text"
							placeholder="https://auth.pingone.com/{environmentId}"
							value={formData.issuer}
							onChange={(e) => handleInputChange('issuer', e.target.value)}
						/>
					</FormGroup>

					<FormGroup>
						<Label>Client ID *</Label>
						<Input
							type="text"
							placeholder="your-client-id"
							value={formData.clientId}
							onChange={(e) => handleInputChange('clientId', e.target.value)}
						/>
					</FormGroup>

					<FormGroup>
						<Label>Authentication Method *</Label>
						<Select
							value={formData.authMethod}
							onChange={(e) => handleInputChange('authMethod', e.target.value)}
						>
							<option value="client_secret_post">Client Secret (POST body)</option>
							<option value="client_secret_basic">Client Secret (Basic Auth)</option>
							<option value="client_secret_jwt">Client Secret JWT</option>
							<option value="private_key_jwt">Private Key JWT</option>
							<option value="tls_client_auth">mTLS</option>
							<option value="none">None (Public Client)</option>
						</Select>
					</FormGroup>

					{formData.authMethod !== 'none' &&
						!formData.authMethod.includes('jwt') &&
						formData.authMethod !== 'tls_client_auth' && (
							<FormGroup>
								<Label>Client Secret *</Label>
								<Input
									type="password"
									placeholder="your-client-secret"
									value={formData.clientSecret}
									onChange={(e) => handleInputChange('clientSecret', e.target.value)}
								/>
							</FormGroup>
						)}

					<FormGroup>
						<Label>Scopes *</Label>
						<Input
							type="text"
							placeholder="api:read api:write (do NOT include 'openid')"
							value={formData.scopes}
							onChange={(e) => handleInputChange('scopes', e.target.value)}
						/>
						<InfoBox $variant="warning" style={{ marginTop: '0.5rem' }}>
							<FiAlertTriangle size={16} />
							<div>
								<InfoText style={{ fontSize: '0.8rem' }}>
									<strong>Note:</strong> Including "openid" scope will likely be rejected or ignored
									by OIDC providers, as Client Credentials has no user context for ID Token
									issuance.
								</InfoText>
							</div>
						</InfoBox>
					</FormGroup>

					<FormGroup>
						<Label>Audience - Optional</Label>
						<Input
							type="text"
							placeholder="https://api.example.com"
							value={formData.audience}
							onChange={(e) => handleInputChange('audience', e.target.value)}
						/>
					</FormGroup>

					<FormGroup>
						<Label>Resource - Optional</Label>
						<Input
							type="text"
							placeholder="urn:example:resource"
							value={formData.resource}
							onChange={(e) => handleInputChange('resource', e.target.value)}
						/>
					</FormGroup>

					<FormGroup>
						<Label>Token Endpoint - Optional (auto-derived from issuer if empty)</Label>
						<Input
							type="text"
							placeholder="{issuer}/as/token"
							value={formData.tokenEndpoint}
							onChange={(e) => handleInputChange('tokenEndpoint', e.target.value)}
						/>
					</FormGroup>

					<ActionRow>
						<Button onClick={handleSaveConfiguration}>
							<FiCheckCircle /> Save Configuration
						</Button>
					</ActionRow>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderHowItWorks = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton
				onClick={() => toggleSection('howItWorks')}
				aria-expanded={!collapsedSections.howItWorks}
			>
				<CollapsibleTitle>
					<FiInfo /> How OIDC Client Credentials Works
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={collapsedSections.howItWorks}>
					<FiChevronDown />
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>
			{!collapsedSections.howItWorks && (
				<CollapsibleContent>
					<ExplanationSection>
						<ExplanationHeading>
							<FiServer /> Flow Overview
						</ExplanationHeading>
						<InfoText>
							OIDC Client Credentials follows the same OAuth 2.0 flow, but uses an{' '}
							<strong>OIDC provider</strong> that may include OIDC-style claims in the access token.{' '}
							<strong>No ID Token is issued</strong> because there's no user authentication.
						</InfoText>
					</ExplanationSection>

					<div style={{ marginTop: '1.5rem' }}>
						<ExplanationHeading style={{ fontSize: '1.1rem' }}>
							<FiZap /> Flow Steps
						</ExplanationHeading>
						<ol style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
							<li>Client authenticates with OIDC provider (client ID + credentials)</li>
							<li>
								Client requests access token with <code>grant_type=client_credentials</code>
							</li>
							<li>OIDC provider validates credentials</li>
							<li>
								Provider issues <strong>Access Token</strong> (may include OIDC-style claims)
							</li>
							<li>Client uses access token to call protected APIs</li>
						</ol>
					</div>

					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<InfoTitle>Expected Token Claims (OIDC-style)</InfoTitle>
							<InfoText>
								Your access token may include:
								<ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', marginBottom: 0 }}>
									<li>
										<code>iss</code> - Issuer (OIDC provider URL)
									</li>
									<li>
										<code>sub</code> - Subject (client ID, not a user)
									</li>
									<li>
										<code>aud</code> - Audience (target API)
									</li>
									<li>
										<code>exp</code> - Expiration timestamp
									</li>
									<li>
										<code>iat</code> - Issued at timestamp
									</li>
									<li>
										<code>client_id</code> - Your application's client ID
									</li>
									<li>
										<code>scope</code> - Granted scopes (NOT including "openid")
									</li>
								</ul>
							</InfoText>
						</div>
					</InfoBox>

					<InfoBox $variant="warning">
						<FiShield size={20} />
						<div>
							<InfoTitle>Security Best Practices</InfoTitle>
							<InfoText>
								<ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', marginBottom: 0 }}>
									<li>
										Prefer <code>private_key_jwt</code> over client secrets
									</li>
									<li>Use OIDC Discovery (/.well-known/openid-configuration)</li>
									<li>Verify token signature using JWKS endpoint</li>
									<li>
										Validate <code>iss</code>, <code>aud</code>, and <code>exp</code> claims
									</li>
									<li>Use short-lived tokens with appropriate scopes</li>
									<li>Never include "openid" scope (will be rejected)</li>
								</ul>
							</InfoText>
						</div>
					</InfoBox>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderTokenRequest = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton onClick={() => handleRequestToken} aria-expanded={true}>
				<CollapsibleTitle>
					<FiKey /> Request Access Token
				</CollapsibleTitle>
			</CollapsibleHeaderButton>
			<CollapsibleContent>
				{!clientCredsFlow.config ? (
					<InfoBox $variant="warning">
						<FiAlertCircle size={20} />
						<div>
							<InfoTitle>Configuration Required</InfoTitle>
							<InfoText>
								Please configure the OIDC settings above before requesting a token.
							</InfoText>
						</div>
					</InfoBox>
				) : (
					<>
						<InfoText style={{ marginBottom: '1rem' }}>
							Click the button below to request an access token from your OIDC provider using Client
							Credentials. You will receive an <strong>Access Token only</strong> (no ID Token).
						</InfoText>

						<ActionRow>
							<Button onClick={handleRequestToken} disabled={clientCredsFlow.isRequesting}>
								{clientCredsFlow.isRequesting ? (
									<>
										<FiRefreshCw className="spin" /> Requesting...
									</>
								) : (
									<>
										<FiKey /> Request Token
									</>
								)}
							</Button>

							{clientCredsFlow.tokens && (
								<Button $variant="danger" onClick={handleReset}>
									<FiRefreshCw /> Reset Flow
								</Button>
							)}
						</ActionRow>

						{clientCredsFlow.error && (
							<InfoBox $variant="error">
								<FiAlertCircle size={20} />
								<div>
									<InfoTitle>Error</InfoTitle>
									<InfoText>{clientCredsFlow.error}</InfoText>
								</div>
							</InfoBox>
						)}
					</>
				)}
			</CollapsibleContent>
		</CollapsibleSection>
	);

	const renderTokens = () => {
		if (!clientCredsFlow.tokens) return null;

		const isExpired = clientCredsFlow.isTokenExpired();

		return (
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('tokens')}
					aria-expanded={!collapsedSections.tokens}
				>
					<CollapsibleTitle>
						<FiCheckCircle /> Access Token (OIDC-Compatible)
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.tokens}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.tokens && (
					<CollapsibleContent>
						<InfoBox $variant="info">
							<FiInfo size={20} />
							<div>
								<InfoTitle>✅ Token Received (No ID Token)</InfoTitle>
								<InfoText>
									As expected with Client Credentials, you received an <strong>Access Token</strong>{' '}
									only. OIDC providers do not issue ID Tokens without user authentication.
								</InfoText>
							</div>
						</InfoBox>

						<ResultsSection>
							<ResultsHeading>
								<FiKey size={18} /> Token Details
							</ResultsHeading>

							<ParameterGrid>
								<ParameterItem>
									<ParameterLabel>Token Type</ParameterLabel>
									<ParameterValue>{clientCredsFlow.tokens.token_type}</ParameterValue>
								</ParameterItem>

								{clientCredsFlow.tokens.expires_in && (
									<ParameterItem>
										<ParameterLabel>Expires In</ParameterLabel>
										<ParameterValue>
											<ExpiryChip $expired={isExpired}>
												<FiClock size={12} />
												{clientCredsFlow.formatExpiry(clientCredsFlow.tokens.expires_in)}
												{isExpired && ' (Expired)'}
											</ExpiryChip>
										</ParameterValue>
									</ParameterItem>
								)}

								{clientCredsFlow.tokens.scope && (
									<ParameterItem>
										<ParameterLabel>Granted Scopes</ParameterLabel>
										<ParameterValue>{clientCredsFlow.tokens.scope}</ParameterValue>
									</ParameterItem>
								)}
							</ParameterGrid>

							<div style={{ marginTop: '1.5rem' }}>
								<Label>Access Token</Label>
								<TokenDisplay>
									{showTokens ? (
										clientCredsFlow.tokens.access_token
									) : (
										<TokenMask>{clientCredsFlow.tokens.access_token.replace(/./g, '•')}</TokenMask>
									)}
								</TokenDisplay>

								<ActionRow>
									<Button $variant="outline" onClick={() => setShowTokens(!showTokens)}>
										<FiKey /> {showTokens ? 'Mask' : 'Reveal'} Token
									</Button>
									<Button
										$variant="outline"
										onClick={() => handleCopy(clientCredsFlow.tokens!.access_token, 'Access Token')}
									>
										<FiCopy /> Copy Token
									</Button>
									<Button
										$variant="outline"
										onClick={() => {
											localStorage.setItem(
												'token_to_analyze',
												clientCredsFlow.tokens!.access_token
											);
											localStorage.setItem('token_type', 'access');
											localStorage.setItem('flow_source', 'oidc-client-credentials-v5');
											window.location.href = '/token-management';
										}}
									>
										<FiExternalLink /> View in Token Management
									</Button>
								</ActionRow>
							</div>

							{clientCredsFlow.decodedToken && (
								<div style={{ marginTop: '1.5rem' }}>
									<ExplanationHeading style={{ fontSize: '1.1rem' }}>
										<FiShield /> Decoded JWT (OIDC-Style Claims)
									</ExplanationHeading>

									<div style={{ marginTop: '1rem' }}>
										<Label>Header</Label>
										<TokenDisplay>
											<pre>{JSON.stringify(clientCredsFlow.decodedToken.header, null, 2)}</pre>
										</TokenDisplay>
									</div>

									<div style={{ marginTop: '1rem' }}>
										<Label>Payload (OIDC Claims)</Label>
										<TokenDisplay>
											<pre>{JSON.stringify(clientCredsFlow.decodedToken.payload, null, 2)}</pre>
										</TokenDisplay>
									</div>

									<InfoBox $variant="success">
										<FiCheckCircle size={20} />
										<div>
											<InfoTitle>OIDC-Style Claims Detected</InfoTitle>
											<InfoText>
												<strong>Issuer (iss):</strong>{' '}
												{clientCredsFlow.decodedToken.payload.iss || 'N/A'}
												<br />
												<strong>Subject (sub):</strong>{' '}
												{clientCredsFlow.decodedToken.payload.sub || 'N/A'}{' '}
												<em>(This is the client, not a user)</em>
												<br />
												<strong>Audience (aud):</strong>{' '}
												{Array.isArray(clientCredsFlow.decodedToken.payload.aud)
													? clientCredsFlow.decodedToken.payload.aud.join(', ')
													: clientCredsFlow.decodedToken.payload.aud || 'N/A'}
												<br />
												<strong>Expires:</strong>{' '}
												{clientCredsFlow.decodedToken.payload.exp
													? new Date(
															clientCredsFlow.decodedToken.payload.exp * 1000
														).toLocaleString()
													: 'N/A'}
												<br />
												<strong>Client ID:</strong>{' '}
												{clientCredsFlow.decodedToken.payload.client_id || 'N/A'}
											</InfoText>
										</div>
									</InfoBox>
								</div>
							)}

							{!clientCredsFlow.decodedToken && (
								<InfoBox $variant="info">
									<FiInfo size={20} />
									<div>
										<InfoTitle>Opaque Token</InfoTitle>
										<InfoText>
											This access token is opaque (not a JWT). Use token introspection to retrieve
											metadata. Navigate to the Token Management page for introspection
											capabilities.
										</InfoText>
									</div>
								</InfoBox>
							)}
						</ResultsSection>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		);
	};

	return (
		<FlowContainer>
			<FlowContent>
				<FlowHeader>
					<div>
						<StepBadge>RFC 6749 • OIDC-Compatible</StepBadge>
						<FlowTitle>
							<FiLock style={{ marginRight: '0.5rem' }} />
							OIDC Client Credentials Flow
						</FlowTitle>
						<FlowSubtitle>
							Server-to-Server • OIDC Provider • Access Token Only • V5 Implementation
						</FlowSubtitle>
					</div>
				</FlowHeader>

				<FlowInfoCard flowInfo={getFlowInfo('client-credentials')!} />
				<FlowSequenceDisplay flowType="client-credentials" />

				{renderOIDCDifferences()}
				{renderConfiguration()}
				{renderHowItWorks()}
				{renderTokenRequest()}
				{renderTokens()}
			</FlowContent>
		</FlowContainer>
	);
};

export default OIDCClientCredentialsFlowV5;
