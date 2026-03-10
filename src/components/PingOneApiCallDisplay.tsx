/**
 * @file PingOneApiCallDisplay.tsx
 * @description Educational component showing real PingOne API call formats
 * @version 1.0.0
 * @since 2026-03-10
 *
 * Shows users exactly what real PingOne API calls look like including:
 * - Request URLs and methods
 * - Headers (with real examples)
 * - JSON request bodies
 * - JSON response bodies
 * - HTTP status codes
 * - Educational explanations
 */

import React, { useState } from 'react';
import styled from 'styled-components';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Container = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	margin: 1.5rem 0;
	overflow: hidden;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div<{ $method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' }>`
	background: ${({ $method }) => {
		switch ($method) {
			case 'GET':
				return '#10b981';
			case 'POST':
				return '#3b82f6';
			case 'PUT':
				return '#f59e0b';
			case 'DELETE':
				return '#ef4444';
			case 'PATCH':
				return '#8b5cf6';
			default:
				return '#6b7280';
		}
	}};
	color: white;
	padding: 1rem 1.5rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		filter: brightness(1.1);
	}
`;

const MethodBadge = styled.span<{ $method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' }>`
	background: rgba(255, 255, 255, 0.2);
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const Title = styled.h4`
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
`;

const ChevronIcon = styled.span<{ $isExpanded: boolean }>`
	transition: transform 0.2s ease;
	transform: ${({ $isExpanded }) => ($isExpanded ? 'rotate(180deg)' : 'rotate(0deg)')};
`;

const Content = styled.div<{ $isExpanded: boolean }>`
	max-height: ${({ $isExpanded }) => ($isExpanded ? '2000px' : '0')};
	overflow: hidden;
	transition: max-height 0.3s ease;
`;

const Section = styled.div`
	padding: 1.5rem;
	border-bottom: 1px solid #e2e8f0;

	&:last-child {
		border-bottom: none;
	}
`;

const SectionTitle = styled.h5`
	margin: 0 0 1rem 0;
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const CodeBlock = styled.pre<{ $type?: 'request' | 'response' | 'headers' }>`
	background: ${({ $type }) => {
		switch ($type) {
			case 'request':
				return '#f0f9ff';
			case 'response':
				return '#f0fdf4';
			case 'headers':
				return '#fefce8';
			default:
				return '#f8fafc';
		}
	}};
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow-x: auto;
	white-space: pre-wrap;
	word-wrap: break-word;
`;

const EducationalNote = styled.div`
	background: linear-gradient(135deg, #fef3c7, #fde68a);
	border-left: 3px solid #f59e0b;
	border-radius: 4px;
	padding: 1rem;
	margin-top: 1rem;
	font-size: 0.875rem;
	color: #92400e;
`;

const ParameterHighlight = styled.span`
	background: #dbeafe;
	color: #1e40af;
	padding: 0.125rem 0.25rem;
	border-radius: 4px;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
`;

const StatusBadge = styled.span<{ $status: number }>`
	background: ${({ $status }) => {
		if ($status >= 200 && $status < 300) return '#10b981';
		if ($status >= 300 && $status < 400) return '#f59e0b';
		if ($status >= 400 && $status < 500) return '#ef4444';
		return '#6b7280';
	}};
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 700;
`;

// ============================================================================
// INTERFACES
// ============================================================================

interface PingOneApiCallProps {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	url: string;
	title: string;
	description: string;
	headers?: Record<string, string>;
	body?: Record<string, unknown> | string;
	queryParams?: Record<string, string>;
	responseStatus: number;
	responseData?: Record<string, unknown> | string;
	responseHeaders?: Record<string, string>;
	educationalNotes?: string[];
	learnMoreUrl?: string;
	defaultExpanded?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PingOneApiCallDisplay: React.FC<PingOneApiCallProps> = ({
	method,
	url,
	title,
	description,
	headers = {},
	body,
	queryParams,
	responseStatus,
	responseData,
	responseHeaders = {},
	educationalNotes = [],
	learnMoreUrl,
	defaultExpanded = false,
}) => {
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);

	const formatHeaders = (headers: Record<string, string>) => {
		return Object.entries(headers)
			.map(([key, value]) => `${key}: ${value}`)
			.join('\n');
	};

	const formatBody = (body: Record<string, unknown> | string | undefined) => {
		if (!body) return '';
		if (typeof body === 'string') return body;
		return JSON.stringify(body, null, 2);
	};

	const getStatusText = (status: number) => {
		const statusTexts: Record<number, string> = {
			200: 'OK',
			201: 'Created',
			302: 'Found',
			400: 'Bad Request',
			401: 'Unauthorized',
			403: 'Forbidden',
			404: 'Not Found',
			500: 'Internal Server Error',
		};
		return statusTexts[status] || 'Unknown';
	};

	return (
		<Container>
			<Header $method={method} onClick={() => setIsExpanded(!isExpanded)}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
					<MethodBadge $method={method}>{method}</MethodBadge>
					<Title>{title}</Title>
				</div>
				<ChevronIcon $isExpanded={isExpanded}>▼</ChevronIcon>
			</Header>

			<Content $isExpanded={isExpanded}>
				<Section>
					<p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
						{description}
					</p>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
						<strong style={{ fontSize: '0.875rem', color: '#374151' }}>Endpoint:</strong>
						<code style={{ 
							background: '#f3f4f6', 
							padding: '0.25rem 0.5rem', 
							borderRadius: '4px', 
							fontSize: '0.875rem',
							color: '#1f2937'
						}}>
							{url}
						</code>
					</div>
				</Section>

				{/* Request Section */}
				<Section>
					<SectionTitle>📤 Request</SectionTitle>
					
					{Object.keys(headers).length > 0 && (
						<div style={{ marginBottom: '1rem' }}>
							<SectionTitle>Headers</SectionTitle>
							<CodeBlock $type="headers">{formatHeaders(headers)}</CodeBlock>
						</div>
					)}

					{queryParams && Object.keys(queryParams).length > 0 && (
						<div style={{ marginBottom: '1rem' }}>
							<SectionTitle>Query Parameters</SectionTitle>
							<CodeBlock $type="headers">
								{Object.entries(queryParams)
									.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
									.join('&')}
							</CodeBlock>
						</div>
					)}

					{body && (
						<div style={{ marginBottom: '1rem' }}>
							<SectionTitle>Request Body</SectionTitle>
							<CodeBlock $type="request">{formatBody(body)}</CodeBlock>
						</div>
					)}
				</Section>

				{/* Response Section */}
				<Section>
					<SectionTitle>📥 Response</SectionTitle>
					
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
						<StatusBadge $status={responseStatus}>{responseStatus}</StatusBadge>
						<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
							{getStatusText(responseStatus)}
						</span>
					</div>

					{Object.keys(responseHeaders).length > 0 && (
						<div style={{ marginBottom: '1rem' }}>
							<SectionTitle>Response Headers</SectionTitle>
							<CodeBlock $type="headers">{formatHeaders(responseHeaders)}</CodeBlock>
						</div>
					)}

					{responseData && (
						<div style={{ marginBottom: '1rem' }}>
							<SectionTitle>Response Body</SectionTitle>
							<CodeBlock $type="response">{formatBody(responseData)}</CodeBlock>
						</div>
					)}
				</Section>

				{/* Educational Notes */}
				{educationalNotes.length > 0 && (
					<Section>
						<EducationalNote>
							<strong>📚 Educational Notes:</strong>
							<ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
								{educationalNotes.map((note, index) => (
									<li key={index} style={{ marginBottom: '0.25rem' }}>{note}</li>
								))}
							</ul>
							{learnMoreUrl && (
								<div style={{ marginTop: '0.5rem' }}>
									<a 
										href={learnMoreUrl} 
										target="_blank" 
										rel="noopener noreferrer"
										style={{ color: '#1e40af', textDecoration: 'underline' }}
									>
										📖 Learn more in PingOne documentation
									</a>
								</div>
							)}
						</EducationalNote>
					</Section>
				)}
			</Content>
		</Container>
	);
};

// ============================================================================
// PREDEFINED API CALL EXAMPLES
// ============================================================================

export const PingOneApiExamples = {
	// Authorization Code Flow Examples
	authorizationEndpoint: {
		method: 'GET' as const,
		url: 'https://auth.pingone.com/{environmentId}/as/authorization',
		title: 'OAuth Authorization Endpoint',
		description: 'Initiates the OAuth 2.0 Authorization Code flow. The user is redirected to PingOne\'s login page.',
		queryParams: {
			response_type: 'code',
			client_id: 'your-client-id',
			redirect_uri: 'https://your-app.com/callback',
			scope: 'openid profile email',
			state: 'random-state-string',
			code_challenge: 'base64url-encoded-challenge',
			code_challenge_method: 'S256',
		},
		responseStatus: 302,
		responseData: {
			redirect_uri: 'https://your-app.com/callback?code=auth-code-12345&state=random-state-string',
		},
		educationalNotes: [
			'The <ParameterHighlight>response_type=code</ParameterHighlight> parameter specifies Authorization Code flow',
			'The <ParameterHighlight>code_challenge</ParameterHighlight> and <ParameterHighlight>code_challenge_method=S256</ParameterHighlight> enable PKCE security',
			'The <ParameterHighlight>state</ParameterHighlight> parameter prevents CSRF attacks',
			'The 302 response redirects the user\'s browser to PingOne\'s login page',
		],
		learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-authorization',
	},

	tokenEndpoint: {
		method: 'POST' as const,
		url: 'https://auth.pingone.com/{environmentId}/as/token',
		title: 'OAuth Token Endpoint',
		description: 'Exchanges the authorization code for access, ID, and refresh tokens.',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic base64(client_id:client_secret)',
		},
		body: {
			grant_type: 'authorization_code',
			code: 'auth-code-12345',
			redirect_uri: 'https://your-app.com/callback',
			code_verifier: 'original-code-verifier',
		},
		responseStatus: 200,
		responseHeaders: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store',
			'Pragma': 'no-cache',
		},
		responseData: {
			access_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAifQ.eyJzdWIiOiI1N...',
			token_type: 'Bearer',
			expires_in: 3600,
			refresh_token: 'def50200e3b4b8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8',
			id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAifQ.eyJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20v...',
			scope: 'openid profile email',
		},
		educationalNotes: [
			'The <ParameterHighlight>grant_type=authorization_code</ParameterHighlight> specifies the flow type',
			'The <ParameterHighlight>code_verifier</ParameterHighlight> must match the original PKCE challenge',
			'The response includes <ParameterHighlight>access_token</ParameterHighlight>, <ParameterHighlight>refresh_token</ParameterHighlight>, and <ParameterHighlight>id_token</ParameterHighlight>',
			'The <ParameterHighlight>expires_in</ParameterHighlight> is in seconds (3600 = 1 hour)',
		],
		learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-token',
	},

	userInfoEndpoint: {
		method: 'GET' as const,
		url: 'https://auth.pingone.com/{environmentId}/as/userinfo',
		title: 'OIDC UserInfo Endpoint',
		description: 'Returns user profile information using the access token.',
		headers: {
			'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAifQ.eyJzdWIiOiI1N...',
		},
		responseStatus: 200,
		responseData: {
			sub: '12345678-1234-1234-1234-123456789012',
			email: 'user@example.com',
			email_verified: true,
			name: 'John Doe',
			given_name: 'John',
			family_name: 'Doe',
			preferred_username: 'john.doe',
			picture: 'https://example.com/avatar.jpg',
		},
		educationalNotes: [
			'The access token is sent in the <ParameterHighlight>Authorization: Bearer</ParameterHighlight> header',
			'The <ParameterHighlight>sub</ParameterHighlight> claim is the user\'s unique identifier',
			'The response includes user profile information based on requested scopes',
			'Use this endpoint to get user details after authentication',
		],
		learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-userinfo',
	},

	// MFA Examples
	mfaChallenge: {
		method: 'POST' as const,
		url: 'https://auth.pingone.com/{environmentId}/as/mfa/challenge',
		title: 'MFA Challenge Initiation',
		description: 'Initiates a multi-factor authentication challenge for the user.',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAifQ...',
		},
		body: {
			deviceId: '12345678-1234-1234-1234-123456789012',
			challengeType: 'otp',
			userId: '12345678-1234-1234-1234-123456789012',
		},
		responseStatus: 200,
		responseData: {
			challengeId: 'challenge-12345',
			challengeType: 'otp',
			deviceId: '12345678-1234-1234-1234-123456789012',
			status: 'PENDING',
			createdAt: '2026-03-10T22:45:00.000Z',
			expiresAt: '2026-03-10T22:50:00.000Z',
		},
		educationalNotes: [
			'This endpoint initiates an MFA challenge for additional security',
			'The <ParameterHighlight>challengeType</ParameterHighlight> can be "otp", "push", "biometric", etc.',
			'The <ParameterHighlight>deviceId</ParameterHighlight> specifies which device to challenge',
			'The response includes a <ParameterHighlight>challengeId</ParameterHighlight> for completing the challenge',
		],
		learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-mfa-challenge',
	},

	mfaVerify: {
		method: 'POST' as const,
		url: 'https://auth.pingone.com/{environmentId}/as/mfa/verify',
		title: 'MFA Challenge Verification',
		description: 'Verifies the user\'s response to an MFA challenge.',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAifQ...',
		},
		body: {
			challengeId: 'challenge-12345',
			code: '123456',
			deviceId: '12345678-1234-1234-1234-123456789012',
		},
		responseStatus: 200,
		responseData: {
			status: 'VERIFIED',
			challengeId: 'challenge-12345',
			deviceId: '12345678-1234-1234-1234-123456789012',
			verifiedAt: '2026-03-10T22:45:30.000Z',
		},
		educationalNotes: [
			'This endpoint verifies the user\'s MFA response (OTP code, push approval, etc.)',
			'The <ParameterHighlight>challengeId</ParameterHighlight> must match the initiated challenge',
			'The <ParameterHighlight>code</ParameterHighlight> is the OTP code entered by the user',
			'A successful verification allows the authentication flow to continue',
		],
		learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-mfa-verify',
	},

	// Application Management Examples
	createApplication: {
		method: 'POST' as const,
		url: 'https://api.pingone.com/v1/environments/{environmentId}/applications',
		title: 'Create Application',
		description: 'Creates a new OAuth/OIDC application in PingOne.',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer worker-access-token',
		},
		body: {
			name: 'My OAuth Application',
			description: 'Application for OAuth 2.0 Authorization Code flow',
			type: 'WEB_APP',
			enabled: true,
			grantTypes: ['authorization_code', 'refresh_token'],
			responseTypes: ['code'],
			tokenEndpointAuthMethod: 'client_secret_basic',
			redirectUris: ['https://myapp.com/callback'],
			postLogoutRedirectUris: ['https://myapp.com/logout'],
			pkceRequired: true,
			pkceEnforced: true,
		},
		responseStatus: 201,
		responseData: {
			id: '12345678-1234-1234-1234-123456789012',
			name: 'My OAuth Application',
			description: 'Application for OAuth 2.0 Authorization Code flow',
			type: 'WEB_APP',
			enabled: true,
			createdAt: '2026-03-10T22:45:00.000Z',
			updatedAt: '2026-03-10T22:45:00.000Z',
			environmentId: '12345678-1234-1234-1234-123456789012',
		},
		educationalNotes: [
			'This endpoint creates new OAuth/OIDC applications in your PingOne environment',
			'The <ParameterHighlight>type</ParameterHighlight> can be WEB_APP, NATIVE_APP, SINGLE_PAGE_APP, or SERVICE',
			'The <ParameterHighlight>grantTypes</ParameterHighlight> array defines which OAuth flows are allowed',
			'Enabling <ParameterHighlight>pkceRequired</ParameterHighlight> enhances security for public clients',
		],
		learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-applications',
	},

	// Device Authorization Flow Examples
	deviceAuthorization: {
		method: 'POST' as const,
		url: 'https://auth.pingone.com/{environmentId}/as/device_authorization',
		title: 'Device Authorization Endpoint',
		description: 'Initiates the OAuth Device Authorization flow for devices without browsers.',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic base64(client_id:client_secret)',
		},
		body: {
			client_id: 'your-client-id',
			client_secret: 'your-client-secret',
			scope: 'openid profile email',
		},
		responseStatus: 200,
		responseData: {
			device_code: 'GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS',
			user_code: 'WDJB-MJHT',
			verification_uri: 'https://auth.pingone.com/device',
			verification_uri_complete: 'https://auth.pingone.com/device?user_code=WDJB-MJHT',
			expires_in: 1800,
			interval: 5,
		},
		educationalNotes: [
			'This endpoint starts the Device Authorization flow for IoT devices, smart TVs, etc.',
			'The <ParameterHighlight>user_code</ParameterHighlight> is what users enter on their secondary device',
			'The <ParameterHighlight>device_code</ParameterHighlight> is used internally to poll for token completion',
			'The <ParameterHighlight>expires_in</ParameterHighlight> is typically 30 minutes (1800 seconds)',
		],
		learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-device-authorization',
	},

	deviceToken: {
		method: 'POST' as const,
		url: 'https://auth.pingone.com/{environmentId}/as/token',
		title: 'Device Token Endpoint',
		description: 'Polls for tokens after user completes device authorization.',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic base64(client_id:client_secret)',
		},
		body: {
			grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
			device_code: 'GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS',
			client_id: 'your-client-id',
		},
		responseStatus: 200,
		responseData: {
			access_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OTAifQ.eyJzdWIiOiI1N...',
			token_type: 'Bearer',
			expires_in: 3600,
			refresh_token: 'def50200e3b4b8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8',
			scope: 'openid profile email',
		},
		educationalNotes: [
			'This endpoint is polled repeatedly until the user completes authorization',
			'The <ParameterHighlight>grant_type</ParameterHighlight> uses the special device code value',
			'Polling should respect the <ParameterHighlight>interval</ParameterHighlight> from the device authorization response',
			'When <ParameterHighlight>authorization_pending</ParameterHighlight> error is returned, continue polling',
		],
		learnMoreUrl: 'https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-device-token',
	},
};

export default PingOneApiCallDisplay;
