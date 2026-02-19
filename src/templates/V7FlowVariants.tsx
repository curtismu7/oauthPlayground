// src/templates/V7FlowVariants.tsx
/**
 * V7 Flow Variants - OAuth vs OIDC Variants using Templates
 *
 * Provides standardized OAuth and OIDC variants for V7 flows
 * with built-in compliance architecture and educational content.
 */

import React, { useCallback, useState } from 'react';
import { FlowUIService } from '../services/flowUIService';
import { V7FlowTemplateService } from '../services/v7FlowTemplateService';
import type { V7FlowName } from '../services/v7SharedService';
import { V7FlowTemplate } from './V7FlowTemplate';

// Get shared UI components
const {
	InfoBox,
	InfoTitle,
	InfoText,
	InfoList,
	FormGroup,
	Label,
	Input,
	Button,
	CodeBlock,
	GeneratedContentBox,
	ParameterGrid,
	ParameterLabel,
	ParameterValue,
	HelperText,
	SectionDivider,
	CollapsibleSection,
	CollapsibleHeaderButton,
	CollapsibleTitle,
	CollapsibleContent,
} = FlowUIService.getFlowUIComponents();

export interface V7FlowVariantProps {
	baseFlowName: V7FlowName;
	showVariantSelector?: boolean;
	onVariantChange?: (variant: 'oauth' | 'oidc') => void;
}

/**
 * V7 OAuth Flow Variant
 * Standardized OAuth 2.0 flow with V7 compliance features
 */
export const V7OAuthFlowVariant: React.FC<V7FlowVariantProps> = ({
	baseFlowName,
	showVariantSelector = true,
	onVariantChange,
}) => {
	const [_selectedVariant, _setSelectedVariant] = useState<'oauth' | 'oidc'>('oauth');

	// Get OAuth template configuration
	const templateConfig = V7FlowTemplateService.getTemplateConfig(baseFlowName);

	// OAuth-specific configuration
	const oauthConfig = {
		...templateConfig,
		flowTitle: templateConfig.flowTitle.replace('OIDC', 'OAuth 2.0'),
		complianceFeatures: {
			...templateConfig.complianceFeatures,
			enableIDTokenValidation: false, // OAuth flow
		},
		educationalContent: {
			...templateConfig.educationalContent,
			overview: templateConfig.educationalContent.overview.replace('OpenID Connect', 'OAuth 2.0'),
			useCases: templateConfig.educationalContent.useCases.map((useCase) =>
				useCase.replace('identity', 'authorization').replace('authentication', 'authorization')
			),
		},
	};

	// Step content renderer for OAuth variant
	const renderStepContent = useCallback(
		(step: number) => {
			switch (step) {
				case 0:
					return renderCredentialsStep();
				case 1:
					return renderAuthorizationStep();
				case 2:
					return renderCallbackStep();
				case 3:
					return renderTokenExchangeStep();
				case 4:
					return renderTokenManagementStep();
				case 5:
					return renderCompletionStep();
				default:
					return <div>Step not implemented</div>;
			}
		},
		[
			renderAuthorizationStep,
			renderCallbackStep,
			renderCompletionStep,
			renderCredentialsStep,
			renderTokenExchangeStep,
			renderTokenManagementStep,
		]
	);

	// Step 0: Application Configuration
	const renderCredentialsStep = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>OAuth 2.0 Application Configuration</InfoTitle>
				<InfoText>
					Configure your OAuth 2.0 application credentials. OAuth 2.0 focuses on authorization
					rather than authentication, providing access tokens for API access.
				</InfoText>
			</InfoBox>

			<CollapsibleSection>
				<CollapsibleHeaderButton>
					<CollapsibleTitle>OAuth 2.0 vs OIDC Differences</CollapsibleTitle>
					<CollapsibleContent>
						<InfoBox $variant="info">
							<InfoTitle>OAuth 2.0 Characteristics</InfoTitle>
							<InfoList>
								<li>
									<strong>Purpose:</strong> Authorization framework for API access
								</li>
								<li>
									<strong>Tokens:</strong> Access token and refresh token only
								</li>
								<li>
									<strong>Identity:</strong> No user identity information
								</li>
								<li>
									<strong>Use Cases:</strong> API authorization, resource access
								</li>
								<li>
									<strong>Scopes:</strong> API-specific permissions (read, write, admin)
								</li>
							</InfoList>
						</InfoBox>
					</CollapsibleContent>
				</CollapsibleHeaderButton>
			</CollapsibleSection>

			<FormGroup>
				<Label>Client ID</Label>
				<Input type="text" placeholder="Enter your OAuth client ID" />
				<HelperText>Your OAuth application's client identifier</HelperText>
			</FormGroup>

			<FormGroup>
				<Label>Client Secret</Label>
				<Input type="password" placeholder="Enter your OAuth client secret" />
				<HelperText>Your OAuth application's client secret</HelperText>
			</FormGroup>

			<FormGroup>
				<Label>Redirect URI</Label>
				<Input type="text" placeholder="https://localhost:3000/callback" />
				<HelperText>Where to redirect after authorization</HelperText>
			</FormGroup>

			<FormGroup>
				<Label>Scope</Label>
				<Input type="text" placeholder="read write admin" />
				<HelperText>OAuth 2.0 scopes for API permissions</HelperText>
			</FormGroup>
		</>
	);

	// Step 1: Authorization Request
	const renderAuthorizationStep = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>OAuth 2.0 Authorization Request</InfoTitle>
				<InfoText>
					Generate the OAuth 2.0 authorization URL. This will redirect the user to the authorization
					server to grant permissions for API access.
				</InfoText>
			</InfoBox>

			<div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
				<Button>Generate OAuth 2.0 Authorization URL</Button>
			</div>

			<GeneratedContentBox>
				<InfoTitle>OAuth 2.0 Authorization URL</InfoTitle>
				<CodeBlock>
					{`GET /oauth/authorize?
  response_type=code&
  client_id=your-client-id&
  redirect_uri=https://localhost:3000/callback&
  scope=read write&
  state=random-state-value`}
				</CodeBlock>
			</GeneratedContentBox>
		</>
	);

	// Step 2: Authorization Response
	const renderCallbackStep = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>OAuth 2.0 Authorization Code</InfoTitle>
				<InfoText>
					The user has been redirected back with an authorization code. This code will be exchanged
					for an access token.
				</InfoText>
			</InfoBox>

			<FormGroup>
				<Label>Authorization Code</Label>
				<Input type="text" placeholder="Enter the authorization code" />
				<HelperText>The authorization code returned from the authorization server</HelperText>
			</FormGroup>
		</>
	);

	// Step 3: Token Exchange
	const renderTokenExchangeStep = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>OAuth 2.0 Token Exchange</InfoTitle>
				<InfoText>
					Exchange the authorization code for an access token and refresh token. The access token
					will be used to access protected APIs.
				</InfoText>
			</InfoBox>

			<Button>Exchange Code for Access Token</Button>

			<GeneratedContentBox>
				<InfoTitle>OAuth 2.0 Token Response</InfoTitle>
				<CodeBlock>
					{`{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "def50200...",
  "scope": "read write"
}`}
				</CodeBlock>
			</GeneratedContentBox>
		</>
	);

	// Step 4: Token Management
	const renderTokenManagementStep = () => (
		<>
			<InfoBox $variant="success">
				<InfoTitle>OAuth 2.0 Access Token</InfoTitle>
				<InfoText>
					Your application now has an access token for API authorization. Use this token to make
					authenticated requests to protected resources.
				</InfoText>
			</InfoBox>

			<ParameterGrid>
				<ParameterLabel>Token Type</ParameterLabel>
				<ParameterValue>Bearer</ParameterValue>
				<ParameterLabel>Expires In</ParameterLabel>
				<ParameterValue>3600 seconds</ParameterValue>
				<ParameterLabel>Scope</ParameterLabel>
				<ParameterValue>read write</ParameterValue>
			</ParameterGrid>
		</>
	);

	// Step 5: Flow Completion
	const renderCompletionStep = () => (
		<>
			<InfoBox $variant="success">
				<InfoTitle>OAuth 2.0 Flow Completed</InfoTitle>
				<InfoText>
					You have successfully completed the OAuth 2.0 Authorization Code flow. Your application
					now has access to protected APIs.
				</InfoText>
			</InfoBox>

			<InfoBox $variant="info">
				<InfoTitle>OAuth 2.0 Next Steps</InfoTitle>
				<InfoList>
					<li>Use the access token to make API calls</li>
					<li>Implement token refresh when the access token expires</li>
					<li>Store tokens securely in your application</li>
					<li>Implement proper error handling for token-related issues</li>
				</InfoList>
			</InfoBox>
		</>
	);

	// Navigation validation
	const canNavigateNext = useCallback((_step: number) => {
		// OAuth-specific validation logic
		return true;
	}, []);

	// Reset handler
	const handleReset = useCallback(() => {
		// Reset OAuth-specific state
	}, []);

	return (
		<V7FlowTemplate
			flowName={oauthConfig.flowName}
			flowTitle={oauthConfig.flowTitle}
			flowSubtitle={oauthConfig.flowSubtitle}
			stepMetadata={oauthConfig.stepMetadata}
			renderStepContent={renderStepContent}
			canNavigateNext={canNavigateNext}
			onReset={handleReset}
			complianceFeatures={oauthConfig.complianceFeatures}
		/>
	);
};

/**
 * V7 OIDC Flow Variant
 * Standardized OpenID Connect flow with V7 compliance features
 */
export const V7OIDCFlowVariant: React.FC<V7FlowVariantProps> = ({
	baseFlowName,
	showVariantSelector = true,
	onVariantChange,
}) => {
	const [_selectedVariant, _setSelectedVariant] = useState<'oauth' | 'oidc'>('oidc');

	// Get OIDC template configuration
	const templateConfig = V7FlowTemplateService.getTemplateConfig(baseFlowName);

	// OIDC-specific configuration
	const oidcConfig = {
		...templateConfig,
		flowTitle: templateConfig.flowTitle.replace('OAuth 2.0', 'OpenID Connect'),
		complianceFeatures: {
			...templateConfig.complianceFeatures,
			enableIDTokenValidation: true, // OIDC flow
		},
		educationalContent: {
			...templateConfig.educationalContent,
			overview: templateConfig.educationalContent.overview.replace('OAuth 2.0', 'OpenID Connect'),
			useCases: templateConfig.educationalContent.useCases.map((useCase) =>
				useCase.replace('authorization', 'authentication').replace('API access', 'user identity')
			),
		},
	};

	// Step content renderer for OIDC variant
	const renderStepContent = useCallback(
		(step: number) => {
			switch (step) {
				case 0:
					return renderCredentialsStep();
				case 1:
					return renderAuthorizationStep();
				case 2:
					return renderCallbackStep();
				case 3:
					return renderTokenExchangeStep();
				case 4:
					return renderIDTokenValidationStep();
				case 5:
					return renderUserInfoStep();
				case 6:
					return renderCompletionStep();
				default:
					return <div>Step not implemented</div>;
			}
		},
		[
			renderAuthorizationStep,
			renderCallbackStep,
			renderCompletionStep,
			renderCredentialsStep,
			renderIDTokenValidationStep,
			renderTokenExchangeStep,
			renderUserInfoStep,
		]
	);

	// Step 0: Application Configuration
	const renderCredentialsStep = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>OpenID Connect Application Configuration</InfoTitle>
				<InfoText>
					Configure your OpenID Connect application credentials. OIDC extends OAuth 2.0 to provide
					identity information through ID tokens and user information.
				</InfoText>
			</InfoBox>

			<CollapsibleSection>
				<CollapsibleHeaderButton>
					<CollapsibleTitle>OpenID Connect Characteristics</CollapsibleTitle>
					<CollapsibleContent>
						<InfoBox $variant="info">
							<InfoTitle>OIDC Features</InfoTitle>
							<InfoList>
								<li>
									<strong>Purpose:</strong> Authentication and authorization framework
								</li>
								<li>
									<strong>Tokens:</strong> ID token, access token, and refresh token
								</li>
								<li>
									<strong>Identity:</strong> User identity information via ID token
								</li>
								<li>
									<strong>Use Cases:</strong> User authentication, SSO, identity federation
								</li>
								<li>
									<strong>Scopes:</strong> Identity scopes (openid, profile, email)
								</li>
							</InfoList>
						</InfoBox>
					</CollapsibleContent>
				</CollapsibleHeaderButton>
			</CollapsibleSection>

			<FormGroup>
				<Label>Client ID</Label>
				<Input type="text" placeholder="Enter your OIDC client ID" />
				<HelperText>Your OpenID Connect application's client identifier</HelperText>
			</FormGroup>

			<FormGroup>
				<Label>Client Secret</Label>
				<Input type="password" placeholder="Enter your OIDC client secret" />
				<HelperText>Your OpenID Connect application's client secret</HelperText>
			</FormGroup>

			<FormGroup>
				<Label>Redirect URI</Label>
				<Input type="text" placeholder="https://localhost:3000/callback" />
				<HelperText>Where to redirect after authentication</HelperText>
			</FormGroup>

			<FormGroup>
				<Label>Scope</Label>
				<Input type="text" placeholder="openid profile email" />
				<HelperText>OIDC scopes for identity information</HelperText>
			</FormGroup>
		</>
	);

	// Step 1: Authorization Request
	const renderAuthorizationStep = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>OpenID Connect Authorization Request</InfoTitle>
				<InfoText>
					Generate the OpenID Connect authorization URL. This will redirect the user to the
					authorization server for authentication and consent.
				</InfoText>
			</InfoBox>

			<div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
				<Button>Generate OIDC Authorization URL</Button>
			</div>

			<GeneratedContentBox>
				<InfoTitle>OpenID Connect Authorization URL</InfoTitle>
				<CodeBlock>
					{`GET /oauth/authorize?
  response_type=code&
  client_id=your-client-id&
  redirect_uri=https://localhost:3000/callback&
  scope=openid profile email&
  nonce=random-nonce-value&
  state=random-state-value`}
				</CodeBlock>
			</GeneratedContentBox>
		</>
	);

	// Step 2: Authorization Response
	const renderCallbackStep = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>OpenID Connect Authorization Code</InfoTitle>
				<InfoText>
					The user has been redirected back with an authorization code. This code will be exchanged
					for ID token, access token, and refresh token.
				</InfoText>
			</InfoBox>

			<FormGroup>
				<Label>Authorization Code</Label>
				<Input type="text" placeholder="Enter the authorization code" />
				<HelperText>The authorization code returned from the authorization server</HelperText>
			</FormGroup>
		</>
	);

	// Step 3: Token Exchange
	const renderTokenExchangeStep = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>OpenID Connect Token Exchange</InfoTitle>
				<InfoText>
					Exchange the authorization code for ID token, access token, and refresh token. The ID
					token contains user identity information.
				</InfoText>
			</InfoBox>

			<div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
				<Button>Exchange Code for Tokens</Button>
			</div>

			<GeneratedContentBox>
				<InfoTitle>OpenID Connect Token Response</InfoTitle>
				<CodeBlock>
					{`{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "def50200...",
  "scope": "openid profile email"
}`}
				</CodeBlock>
			</GeneratedContentBox>
		</>
	);

	// Step 4: ID Token Validation
	const renderIDTokenValidationStep = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>ID Token Validation</InfoTitle>
				<InfoText>
					Validate the ID token according to OpenID Connect Core 1.0 specification. This ensures the
					token is authentic and contains valid user information.
				</InfoText>
			</InfoBox>

			<Button>Validate ID Token</Button>

			<GeneratedContentBox>
				<InfoTitle>ID Token Validation Results</InfoTitle>
				<CodeBlock>
					{`✅ ID Token is valid
  ✅ Signature validation passed
  ✅ Issuer validation passed
  ✅ Audience validation passed
  ✅ Expiration validation passed
  ✅ Nonce validation passed`}
				</CodeBlock>
			</GeneratedContentBox>
		</>
	);

	// Step 5: User Information
	const renderUserInfoStep = () => (
		<>
			<InfoBox $variant="info">
				<InfoTitle>User Information</InfoTitle>
				<InfoText>
					Retrieve user information from the UserInfo endpoint using the access token. This provides
					additional user profile information.
				</InfoText>
			</InfoBox>

			<Button>Get User Information</Button>

			<GeneratedContentBox>
				<InfoTitle>User Information Response</InfoTitle>
				<CodeBlock>
					{`{
  "sub": "user123",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "email_verified": true,
  "picture": "https://example.com/avatar.jpg"
}`}
				</CodeBlock>
			</GeneratedContentBox>
		</>
	);

	// Step 6: Flow Completion
	const renderCompletionStep = () => (
		<>
			<InfoBox $variant="success">
				<InfoTitle>OpenID Connect Flow Completed</InfoTitle>
				<InfoText>
					You have successfully completed the OpenID Connect Authorization Code flow. Your
					application now has user identity information and API access.
				</InfoText>
			</InfoBox>

			<InfoBox $variant="info">
				<InfoTitle>OpenID Connect Next Steps</InfoTitle>
				<InfoList>
					<li>Use the ID token for user authentication</li>
					<li>Use the access token for API calls</li>
					<li>Implement token refresh when tokens expire</li>
					<li>Store user information securely</li>
					<li>Implement proper logout mechanisms</li>
				</InfoList>
			</InfoBox>
		</>
	);

	// Navigation validation
	const canNavigateNext = useCallback((_step: number) => {
		// OIDC-specific validation logic
		return true;
	}, []);

	// Reset handler
	const handleReset = useCallback(() => {
		// Reset OIDC-specific state
	}, []);

	return (
		<V7FlowTemplate
			flowName={oidcConfig.flowName}
			flowTitle={oidcConfig.flowTitle}
			flowSubtitle={oidcConfig.flowSubtitle}
			stepMetadata={oidcConfig.stepMetadata}
			renderStepContent={renderStepContent}
			canNavigateNext={canNavigateNext}
			onReset={handleReset}
			complianceFeatures={oidcConfig.complianceFeatures}
		/>
	);
};

/**
 * V7 Flow Variant Selector
 * Allows users to choose between OAuth and OIDC variants
 */
export const V7FlowVariantSelector: React.FC<V7FlowVariantProps> = ({
	baseFlowName,
	onVariantChange,
}) => {
	const [selectedVariant, setSelectedVariant] = useState<'oauth' | 'oidc'>('oauth');

	const handleVariantChange = useCallback(
		(variant: 'oauth' | 'oidc') => {
			setSelectedVariant(variant);
			onVariantChange?.(variant);
		},
		[onVariantChange]
	);

	return (
		<>
			<InfoBox $variant="info">
				<InfoTitle>Choose Flow Variant</InfoTitle>
				<InfoText>
					Select whether you want to use OAuth 2.0 (authorization only) or OpenID Connect
					(authentication + authorization).
				</InfoText>
			</InfoBox>

			<ParameterGrid>
				<ParameterLabel>OAuth 2.0</ParameterLabel>
				<ParameterValue>
					<Button
						onClick={() => handleVariantChange('oauth')}
						style={{
							backgroundColor: selectedVariant === 'oauth' ? '#16a34a' : '#e5e7eb',
							color: selectedVariant === 'oauth' ? 'white' : 'black',
						}}
					>
						OAuth 2.0 (Authorization)
					</Button>
				</ParameterValue>
				<ParameterLabel>OpenID Connect</ParameterLabel>
				<ParameterValue>
					<Button
						onClick={() => handleVariantChange('oidc')}
						style={{
							backgroundColor: selectedVariant === 'oidc' ? '#3b82f6' : '#e5e7eb',
							color: selectedVariant === 'oidc' ? 'white' : 'black',
						}}
					>
						OpenID Connect (Authentication + Authorization)
					</Button>
				</ParameterValue>
			</ParameterGrid>

			{selectedVariant === 'oauth' && (
				<V7OAuthFlowVariant
					baseFlowName={baseFlowName}
					showVariantSelector={false}
					onVariantChange={onVariantChange}
				/>
			)}

			{selectedVariant === 'oidc' && (
				<V7OIDCFlowVariant
					baseFlowName={baseFlowName}
					showVariantSelector={false}
					onVariantChange={onVariantChange}
				/>
			)}
		</>
	);
};

export default {
	V7OAuthFlowVariant,
	V7OIDCFlowVariant,
	V7FlowVariantSelector,
};
