// src/pages/flows/AdvancedOAuthParametersDemoFlow.tsx
/**
 * Advanced OAuth Parameters Demo Flow
 *
 * This is a MOCK/EDUCATIONAL flow demonstrating advanced OAuth 2.0 and OIDC parameters
 * that may not be supported by all authorization servers (including PingOne).
 *
 * Purpose:
 * - Show how RFC 8707 Resource Indicators work
 * - Demonstrate Display parameter UI variations
 * - Show ACR Values, Max Age, UI Locales, etc.
 * - Generate mock tokens that reflect these parameters
 * - Educational content for each parameter
 */

import React, { useCallback, useState } from 'react';
import {
	FiAlertCircle,
	FiBook,
	FiCheckCircle,
	FiCopy,
	FiLink,
	FiPackage,
	FiSettings,
} from '@icons';
import styled from 'styled-components';
import AudienceParameterInput from '../../components/AudienceParameterInput';
// Import components
import {
	ClaimsRequestBuilder,
	ClaimsRequestStructure,
} from '../../components/ClaimsRequestBuilder';
import DisplayParameterSelector, { DisplayMode } from '../../components/DisplayParameterSelector';
import { EnhancedPromptSelector, PromptValue } from '../../components/EnhancedPromptSelector';
import { ResourceParameterInput } from '../../components/ResourceParameterInput';
// Import services
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import EducationalContentService from '../../services/educationalContentService.tsx';
import { FlowHeader } from '../../services/flowHeaderService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';

// Styled Components
const Container = styled.div`
	padding: 2rem;
	max-width: 1400px;
	margin: 0 auto;
`;

const DemoNotice = styled.div`
	background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
	border: 3px solid #3b82f6;
	border-radius: 1rem;
	padding: 2rem;
	margin-bottom: 2rem;
	display: flex;
	align-items: flex-start;
	gap: 1.5rem;
	box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'success' | 'warning' }>`
	padding: 1.5rem;
	border-radius: 0.75rem;
	margin: 1rem 0;
	background: ${({ $variant }) => {
		switch ($variant) {
			case 'success':
				return 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
			case 'warning':
				return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)';
			default:
				return 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
		}
	}};
	border-left: 4px solid ${({ $variant }) => {
		switch ($variant) {
			case 'success':
				return '#10b981';
			case 'warning':
				return '#f59e0b';
			default:
				return '#3b82f6';
		}
	}};
`;

const UrlDisplay = styled.div`
	background: #1e293b;
	color: #e2e8f0;
	padding: 1.5rem;
	border-radius: 0.75rem;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 0.9rem;
	word-break: break-all;
	margin: 1rem 0;
	position: relative;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const CopyButton = styled.button`
	position: absolute;
	top: 1rem;
	right: 1rem;
	padding: 0.5rem 1rem;
	background: #3b82f6;
	color: white;
	border: none;
	border-radius: 0.5rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s;

	&:hover {
		background: #2563eb;
		transform: translateY(-2px);
	}
`;

const ParameterSection = styled.div`
	margin: 2rem 0;
`;

const MockButton = styled.button`
	padding: 1rem 2rem;
	font-size: 1rem;
	font-weight: 600;
	color: white;
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	transition: all 0.2s;
	box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
	}

	&:active {
		transform: translateY(0);
	}
`;

type AdvancedOAuthParametersDemoFlowProps = {};

const AdvancedOAuthParametersDemoFlow: React.FC<AdvancedOAuthParametersDemoFlowProps> = () => {
	// State for all parameters
	const [audience, setAudience] = useState<string>('');
	const [resources, setResources] = useState<string[]>([]);
	const [promptValues, setPromptValues] = useState<PromptValue[]>([]);
	const [displayMode, setDisplayMode] = useState<DisplayMode>('page');
	const [claimsRequest, setClaimsRequest] = useState<ClaimsRequestStructure | null>(null);
	const [acrValues, setAcrValues] = useState<string>('');
	const [maxAge, setMaxAge] = useState<string>('');
	const [uiLocales, setUiLocales] = useState<string>('');
	const [loginHint, setLoginHint] = useState<string>('');
	const [idTokenHint, setIdTokenHint] = useState<string>('');

	// Generated outputs
	const [mockAuthUrl, setMockAuthUrl] = useState<string>('');
	const [mockTokens, setMockTokens] = useState<any>(null);

	// Generate mock authorization URL
	const handleGenerateMockUrl = useCallback(() => {
		const baseUrl = 'https://auth.example.com/authorize';
		const params = new URLSearchParams({
			response_type: 'code',
			client_id: 'demo-client-id',
			redirect_uri: 'https://example.com/callback',
			scope: 'openid profile email',
			state: `demo-state-${Math.random().toString(36).substring(7)}`,
			nonce: `demo-nonce-${Math.random().toString(36).substring(7)}`,
		});

		// Add all configured parameters
		if (audience) params.set('audience', audience);
		resources.forEach((r) => params.append('resource', r));
		if (promptValues.length > 0) params.set('prompt', promptValues.join(' '));
		if (displayMode !== 'page') params.set('display', displayMode);
		if (claimsRequest) params.set('claims', JSON.stringify(claimsRequest));
		if (acrValues) params.set('acr_values', acrValues);
		if (maxAge) params.set('max_age', maxAge);
		if (uiLocales) params.set('ui_locales', uiLocales);
		if (loginHint) params.set('login_hint', loginHint);
		if (idTokenHint) params.set('id_token_hint', idTokenHint);

		const fullUrl = `${baseUrl}?${params.toString()}`;
		setMockAuthUrl(fullUrl);
	}, [
		audience,
		resources,
		promptValues,
		displayMode,
		claimsRequest,
		acrValues,
		maxAge,
		uiLocales,
		loginHint,
		idTokenHint,
	]);

	// Generate mock tokens
	const handleGenerateMockTokens = useCallback(() => {
		const now = Math.floor(Date.now() / 1000);

		const mockAccessToken = {
			iss: 'https://auth.example.com',
			sub: 'demo-user-12345',
			aud: resources.length > 0 ? resources : audience || 'demo-client-id',
			exp: now + 3600,
			iat: now,
			scope: 'openid profile email read:api write:api',
			...(acrValues && { acr: acrValues.split(' ')[0] }),
			...(maxAge && { auth_time: now - 60 }),
		};

		const mockIdToken = {
			iss: 'https://auth.example.com',
			sub: 'demo-user-12345',
			aud: 'demo-client-id',
			exp: now + 3600,
			iat: now,
			email: 'demo@example.com',
			email_verified: true,
			name: 'Demo User',
			given_name: 'Demo',
			family_name: 'User',
			picture: 'https://example.com/avatar.jpg',
			...(acrValues && { acr: acrValues.split(' ')[0] }),
			...(maxAge && { auth_time: now - 60 }),
		};

		// Encode as base64 (simple mock - not real JWT)
		const mockAccessTokenJWT = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(mockAccessToken))}.mock-signature`;
		const mockIdTokenJWT = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(mockIdToken))}.mock-signature`;

		setMockTokens({
			access_token: mockAccessTokenJWT,
			id_token: mockIdTokenJWT,
			token_type: 'Bearer',
			expires_in: 3600,
			scope: 'openid profile email read:api write:api',
		});
	}, [audience, resources, acrValues, maxAge]);

	return (
		<Container>
			<FlowHeader
				flowId="advanced-oauth-params-demo"
				customConfig={{
					flowType: 'oauth',
					title: 'Advanced OAuth Parameters Demo',
					subtitle: 'Explore ALL OAuth 2.0 and OIDC parameters with mock responses',
				}}
			/>

			{/* Demo Notice */}
			<DemoNotice>
				<FiAlertCircle size={32} style={{ color: '#3b82f6', flexShrink: 0 }} />
				<div>
					<h3 style={{ margin: '0 0 1rem 0', color: '#1e40af', fontSize: '1.25rem' }}>
						🎭 Educational Demo Flow
					</h3>
					<p style={{ margin: '0 0 0.5rem 0', lineHeight: '1.6' }}>
						This is a <strong>mock/demonstration flow</strong> showing advanced OAuth 2.0 and OIDC
						parameters that may not be supported by all authorization servers, including PingOne.
					</p>
					<p style={{ margin: 0, lineHeight: '1.6' }}>
						All responses are mocked to show you how these parameters would work with a fully
						spec-compliant server. For parameters supported by PingOne, use the real OAuth/OIDC
						Authorization Code flows.
					</p>
				</div>
			</DemoNotice>

			{/* Educational Overview */}
			<EducationalContentService flowType="advanced-params-demo" defaultCollapsed={false} />

			{/* Step 1: Configure All Parameters */}
			<CollapsibleHeader
				title="Step 1: Configure Advanced Parameters"
				icon={<FiSettings />}
				theme="orange"
				defaultCollapsed={false}
			>
				<InfoBox>
					Configure all advanced OAuth 2.0 and OIDC parameters below. These parameters extend the
					basic OAuth flow with additional capabilities.
				</InfoBox>

				<ParameterSection>
					<h4>Audience Parameter</h4>
					<AudienceParameterInput value={audience} onChange={setAudience} />
				</ParameterSection>

				<ParameterSection>
					<h4>Resource Indicators (RFC 8707)</h4>
					<ResourceParameterInput value={resources} onChange={setResources} />
				</ParameterSection>

				<ParameterSection>
					<h4>Prompt Parameter</h4>
					<EnhancedPromptSelector value={promptValues} onChange={setPromptValues} />
				</ParameterSection>

				<ParameterSection>
					<h4>Display Parameter (OIDC)</h4>
					<DisplayParameterSelector value={displayMode} onChange={setDisplayMode} />
				</ParameterSection>

				<ParameterSection>
					<h4>Claims Request (OIDC)</h4>
					<ClaimsRequestBuilder value={claimsRequest} onChange={setClaimsRequest} />
				</ParameterSection>

				{/* Additional Parameters */}
				<ParameterSection>
					<h4>ACR Values (Authentication Context Class Reference)</h4>
					<InfoBox $variant="info">
						Space-separated list of Authentication Context Class Reference values (e.g.,
						"urn:mace:incommon:iap:silver urn:mace:incommon:iap:bronze")
					</InfoBox>
					<input
						type="text"
						value={acrValues}
						onChange={(e) => setAcrValues(e.target.value)}
						placeholder="e.g., urn:mace:incommon:iap:silver"
						style={{
							width: '100%',
							padding: '0.75rem',
							borderRadius: '0.5rem',
							border: '2px solid #e5e7eb',
							fontSize: '1rem',
						}}
					/>
				</ParameterSection>

				<ParameterSection>
					<h4>Max Age (seconds)</h4>
					<InfoBox $variant="info">
						Maximum authentication age allowed. If the last authentication is older than this, the
						user must re-authenticate.
					</InfoBox>
					<input
						type="number"
						value={maxAge}
						onChange={(e) => setMaxAge(e.target.value)}
						placeholder="e.g., 3600"
						style={{
							width: '100%',
							padding: '0.75rem',
							borderRadius: '0.5rem',
							border: '2px solid #e5e7eb',
							fontSize: '1rem',
						}}
					/>
				</ParameterSection>

				<ParameterSection>
					<h4>UI Locales</h4>
					<InfoBox $variant="info">
						Space-separated list of preferred languages for the authentication UI (e.g., "en-US
						es-ES fr-FR")
					</InfoBox>
					<input
						type="text"
						value={uiLocales}
						onChange={(e) => setUiLocales(e.target.value)}
						placeholder="e.g., en-US es-ES"
						style={{
							width: '100%',
							padding: '0.75rem',
							borderRadius: '0.5rem',
							border: '2px solid #e5e7eb',
							fontSize: '1rem',
						}}
					/>
				</ParameterSection>

				<ParameterSection>
					<h4>Login Hint</h4>
					<InfoBox $variant="info">
						Pre-populate the username/email field to improve UX for known users.
					</InfoBox>
					<input
						type="text"
						value={loginHint}
						onChange={(e) => setLoginHint(e.target.value)}
						placeholder="e.g., user@example.com"
						style={{
							width: '100%',
							padding: '0.75rem',
							borderRadius: '0.5rem',
							border: '2px solid #e5e7eb',
							fontSize: '1rem',
						}}
					/>
				</ParameterSection>

				<ParameterSection>
					<h4>ID Token Hint</h4>
					<InfoBox $variant="info">
						Previously issued ID token to enable seamless re-authentication.
					</InfoBox>
					<textarea
						value={idTokenHint}
						onChange={(e) => setIdTokenHint(e.target.value)}
						placeholder="Paste a previously issued ID token..."
						rows={3}
						style={{
							width: '100%',
							padding: '0.75rem',
							borderRadius: '0.5rem',
							border: '2px solid #e5e7eb',
							fontSize: '1rem',
							fontFamily: 'Monaco, monospace',
						}}
					/>
				</ParameterSection>

				<MockButton onClick={handleGenerateMockUrl}>
					<FiLink />
					Generate Mock Authorization URL
				</MockButton>
			</CollapsibleHeader>

			{/* Step 2: Mock Authorization URL */}
			{mockAuthUrl && (
				<CollapsibleHeader
					title="Step 2: Generated Authorization URL"
					icon={<FiLink />}
					theme="blue"
					defaultCollapsed={false}
				>
					<InfoBox $variant="success">
						<strong>✅ Mock URL Generated!</strong> This is what the authorization URL would look
						like with all your configured parameters.
					</InfoBox>

					<UrlDisplay>
						<CopyButton onClick={() => navigator.clipboard.writeText(mockAuthUrl)}>
							<FiCopy />
							Copy URL
						</CopyButton>
						{mockAuthUrl}
					</UrlDisplay>

					<InfoBox>
						<strong>📖 What happens next:</strong> In a real flow, clicking this URL would redirect
						the user to the authorization server, which would process all these parameters.
					</InfoBox>

					<MockButton onClick={handleGenerateMockTokens}>
						<FiCheckCircle />
						Simulate Authorization & Generate Mock Tokens
					</MockButton>
				</CollapsibleHeader>
			)}

			{/* Step 3: Mock Tokens */}
			{mockTokens && (
				<CollapsibleHeader
					title="Step 3: Mock Token Response"
					icon={<FiPackage />}
					theme="highlight"
					defaultCollapsed={false}
				>
					<InfoBox $variant="success">
						<strong>🎉 Mock Tokens Generated!</strong> These tokens demonstrate how your configured
						parameters would be reflected in the token response.
					</InfoBox>

					{UnifiedTokenDisplayService.showTokens(mockTokens, 'oauth', 'advanced-oauth-params-demo')}

					<InfoBox>
						<strong>🔍 Key Observations:</strong>
						<ul>
							{resources.length > 0 && (
								<li>
									The <code>aud</code> claim in the access token contains your resource URIs
								</li>
							)}
							{audience && resources.length === 0 && (
								<li>
									The <code>aud</code> claim in the access token contains your audience
								</li>
							)}
							{acrValues && (
								<li>
									The <code>acr</code> claim reflects the authentication context class
								</li>
							)}
							{maxAge && (
								<li>
									The <code>auth_time</code> claim shows when the user authenticated
								</li>
							)}
							{claimsRequest && <li>Requested claims appear in the ID token</li>}
						</ul>
					</InfoBox>
				</CollapsibleHeader>
			)}

			{/* Educational Content - Why These Don't Work with PingOne */}
			<CollapsibleHeader
				title="Why These Parameters May Not Work with PingOne"
				icon={<FiBook />}
				theme="yellow"
				defaultCollapsed={true}
			>
				<InfoBox $variant="warning">
					<strong>⚠️ Implementation Reality</strong>
					<p style={{ marginTop: '1rem' }}>
						While these parameters are part of the OAuth 2.0 and OIDC specifications, not all
						authorization servers implement them. Here's why:
					</p>
					<ul>
						<li>
							<strong>Resource Indicators (RFC 8707):</strong> Newer specification (2019), not
							universally adopted yet
						</li>
						<li>
							<strong>Display Parameter:</strong> Requires server-side UI adaptation, complex to
							implement
						</li>
						<li>
							<strong>ACR Values:</strong> Requires multiple authentication methods configured
						</li>
						<li>
							<strong>UI Locales:</strong> Requires internationalized UI implementation
						</li>
						<li>
							<strong>ID Token Hint:</strong> Complex validation and session management required
						</li>
					</ul>
					<p style={{ marginTop: '1rem' }}>
						<strong>For PingOne flows</strong>, we only show parameters that are well-supported
						(Audience, Prompt, Claims Request) to ensure a reliable user experience.
					</p>
				</InfoBox>
			</CollapsibleHeader>
		</Container>
	);
};

export default AdvancedOAuthParametersDemoFlow;
