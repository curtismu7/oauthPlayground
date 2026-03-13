// src/components/MockApiCallDisplay.tsx
// Reusable component for displaying sample API calls in mock flows
// Shows realistic API endpoints, JSON bodies, and responses with collapsible sections

import React, { useState } from 'react';
import styled from 'styled-components';

// Styled Components
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
	color: #ffffff;
`;

const Title = styled.h4`
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	color: #ffffff;
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
	border: 1px solid
		${({ $type }) => {
			switch ($type) {
				case 'request':
					return '#bae6fd';
				case 'response':
					return '#bbf7d0';
				case 'headers':
					return '#fef3c7';
				default:
					return '#e2e8f0';
			}
		}};
	border-radius: 8px;
	padding: 1rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	color: #1f2937;
	overflow-x: auto;
	white-space: pre-wrap;
	word-wrap: break-word;
	margin: 0;
`;

const StatusBadge = styled.span<{ $status: number }>`
	background: ${({ $status }) => {
		if ($status >= 200 && $status < 300) return '#dcfce7';
		if ($status >= 400 && $status < 500) return '#fef2f2';
		if ($status >= 500) return '#fef2f2';
		return '#fef3c7';
	}};
	color: ${({ $status }) => {
		if ($status >= 200 && $status < 300) return '#166534';
		if ($status >= 400 && $status < 500) return '#991b1b';
		if ($status >= 500) return '#991b1b';
		return '#92400e';
	}};
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	border: 1px solid
		${({ $status }) => {
			if ($status >= 200 && $status < 300) return '#bbf7d0';
			if ($status >= 400 && $status < 500) return '#fecaca';
			if ($status >= 500) return '#fecaca';
			return '#fde68a';
		}};
`;

const NoteBox = styled.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 8px;
	padding: 1rem;
	margin-bottom: 1rem;
`;

const NoteText = styled.p`
	margin: 0;
	font-size: 0.875rem;
	color: #1e40af;
`;

// Types
export interface MockApiCallDisplayProps {
	title: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	url: string;
	headers?: Record<string, string>;
	body?: Record<string, any> | string;
	response?: {
		status: number;
		statusText: string;
		data?: any;
		headers?: Record<string, string>;
	};
	note?: string;
	description?: string;
	defaultExpanded?: boolean;
}

// Component
export const MockApiCallDisplay: React.FC<MockApiCallDisplayProps> = ({
	title,
	method,
	url,
	headers = {},
	body,
	response,
	note,
	description,
	defaultExpanded = false,
}) => {
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);

	const formatHeaders = (headers: Record<string, string>) => {
		return Object.entries(headers)
			.map(([key, value]) => `${key}: ${value}`)
			.join('\n');
	};

	const formatBody = (body: Record<string, any> | string) => {
		if (typeof body === 'string') {
			return body;
		}
		return JSON.stringify(body, null, 2);
	};

	const formatResponse = (data: any) => {
		return JSON.stringify(data, null, 2);
	};

	const toggleExpanded = () => {
		setIsExpanded(!isExpanded);
	};

	return (
		<Container>
			<Header $method={method} onClick={toggleExpanded}>
				<div>
					<MethodBadge $method={method}>{method}</MethodBadge>
					<Title style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>{title}</Title>
				</div>
				<ChevronIcon $isExpanded={isExpanded}>▼</ChevronIcon>
			</Header>

			<Content $isExpanded={isExpanded}>
				{description && (
					<Section>
						<p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>{description}</p>
					</Section>
				)}

				{note && (
					<Section>
						<NoteBox>
							<NoteText>
								<strong>Note:</strong> {note}
							</NoteText>
						</NoteBox>
					</Section>
				)}

				<Section>
					<SectionTitle>Request URL</SectionTitle>
					<CodeBlock $type="request">
						{method} {url}
					</CodeBlock>
				</Section>

				{headers && Object.keys(headers).length > 0 && (
					<Section>
						<SectionTitle>Request Headers</SectionTitle>
						<CodeBlock $type="headers">{formatHeaders(headers)}</CodeBlock>
					</Section>
				)}

				{body && (
					<Section>
						<SectionTitle>Request Body</SectionTitle>
						<CodeBlock $type="request">{formatBody(body)}</CodeBlock>
					</Section>
				)}

				{response && (
					<Section>
						<SectionTitle>Response</SectionTitle>
						<div style={{ marginBottom: '1rem' }}>
							<StatusBadge $status={response.status}>
								{response.status} {response.statusText}
							</StatusBadge>
						</div>

						{response.headers && Object.keys(response.headers).length > 0 && (
							<div style={{ marginBottom: '1rem' }}>
								<SectionTitle style={{ marginBottom: '0.5rem' }}>Response Headers</SectionTitle>
								<CodeBlock $type="response">{formatHeaders(response.headers)}</CodeBlock>
							</div>
						)}

						{response.data && (
							<div>
								<SectionTitle style={{ marginBottom: '0.5rem' }}>Response Body</SectionTitle>
								<CodeBlock $type="response">{formatResponse(response.data)}</CodeBlock>
							</div>
						)}
					</Section>
				)}
			</Content>
		</Container>
	);
};

// Helper function to create common mock API call examples
export const createMockTokenEndpoint = (
	environmentId: string,
	clientId: string,
	scopes: string[] = ['openid', 'profile', 'email']
): MockApiCallDisplayProps => ({
	title: 'OAuth 2.0 Token Endpoint',
	method: 'POST',
	url: `https://auth.pingone.com/${environmentId}/as/token`,
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		Accept: 'application/json',
	},
	body: {
		grant_type: 'client_credentials',
		client_id: clientId,
		client_secret: '***REDACTED***',
		scope: scopes.join(' '),
	},
	response: {
		status: 200,
		statusText: 'OK',
		data: {
			access_token:
				'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20iLCJzdWIiOiJjbGllbnQtaWQiLCJhdWQiOiJodHRwczovL2FwaS5waW5nb25lLmNvbSIsImV4cCI6MTY5NzQzMzAwMCwiaWF0IjoxNjk3NDI5NDAwLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIn0.signature',
			token_type: 'Bearer',
			expires_in: 3600,
			scope: scopes.join(' '),
		},
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store',
			Pragma: 'no-cache',
		},
	},
	note: 'This is a mock response. In a real implementation, the access_token would be a valid JWT signed by PingOne.',
	description:
		'Exchange client credentials for an access token using the OAuth 2.0 Client Credentials Grant.',
});

export const createMockUserInfoEndpoint = (
	environmentId: string,
	accessToken: string
): MockApiCallDisplayProps => ({
	title: 'OpenID Connect UserInfo Endpoint',
	method: 'GET',
	url: `https://auth.pingone.com/${environmentId}/as/userinfo`,
	headers: {
		Authorization: `Bearer ${accessToken.substring(0, 20)}...`,
		Accept: 'application/json',
	},
	response: {
		status: 200,
		statusText: 'OK',
		data: {
			sub: 'user-12345',
			name: 'John Doe',
			email: 'john.doe@example.com',
			email_verified: true,
			preferred_username: 'john.doe',
			given_name: 'John',
			family_name: 'Doe',
		},
		headers: {
			'Content-Type': 'application/json',
		},
	},
	note: 'The access token must be valid and include the openid scope to access this endpoint.',
	description:
		'Retrieve user profile information using the access token obtained from the token endpoint.',
});

export default MockApiCallDisplay;
