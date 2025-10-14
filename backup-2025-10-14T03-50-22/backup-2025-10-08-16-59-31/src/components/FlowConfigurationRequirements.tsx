// src/components/FlowConfigurationRequirements.tsx
// Displays PingOne application configuration requirements for each OAuth/OIDC flow

import React, { useState } from 'react';
import { FiAlertTriangle, FiCheck, FiChevronDown, FiChevronUp, FiInfo, FiX } from 'react-icons/fi';
import styled from 'styled-components';

interface FlowConfigRequirement {
	clientSecret: 'required' | 'optional' | 'not-used';
	redirectUri: 'required' | 'optional' | 'not-used';
	tokenAuthMethod: 'none' | 'client_secret_post' | 'client_secret_basic' | 'private_key_jwt';
	explanation: string;
}

interface FlowConfigurationRequirementsProps {
	flowType:
		| 'device-authorization'
		| 'implicit'
		| 'authorization-code'
		| 'client-credentials'
		| 'resource-owner-password'
		| 'hybrid'
		| 'ciba'
		| 'jwt-bearer'
		| 'worker-token'
		| 'token-introspection'
		| 'token-revocation'
		| 'userinfo'
		| 'redirectless'
		| 'rar';
	variant?: 'oauth' | 'oidc' | 'pingone';
}

const FLOW_REQUIREMENTS: Record<string, FlowConfigRequirement> = {
	'device-authorization': {
		clientSecret: 'not-used',
		redirectUri: 'not-used',
		tokenAuthMethod: 'none',
		explanation:
			'Device Authorization Flow is designed for public clients (smart TVs, IoT devices, CLI tools) that cannot securely store secrets or handle browser redirects. The flow uses device codes and user verification codes instead.',
	},
	implicit: {
		clientSecret: 'not-used',
		redirectUri: 'required',
		tokenAuthMethod: 'none',
		explanation:
			'Implicit Flow is a legacy public client flow where tokens are returned directly in the URL fragment. No client authentication is used. Note: This flow is deprecated in OAuth 2.1 - use Authorization Code with PKCE instead.',
	},
	'authorization-code': {
		clientSecret: 'optional',
		redirectUri: 'required',
		tokenAuthMethod: 'client_secret_post',
		explanation:
			'Authorization Code Flow can be used with public clients (PKCE, no secret) or confidential clients (with secret). For confidential clients, use client_secret_post or client_secret_basic authentication.',
	},
	'client-credentials': {
		clientSecret: 'required',
		redirectUri: 'not-used',
		tokenAuthMethod: 'client_secret_post',
		explanation:
			'Client Credentials Flow is for machine-to-machine authentication where the client itself is the resource owner. Always requires client authentication (secret or private key). No redirect URI needed as there is no user interaction.',
	},
	'resource-owner-password': {
		clientSecret: 'required',
		redirectUri: 'not-used',
		tokenAuthMethod: 'client_secret_post',
		explanation:
			'Resource Owner Password Credentials Flow is a legacy flow where the client collects user credentials directly. Requires client authentication. No redirect URI needed. Note: This flow is deprecated - use Authorization Code Flow instead.',
	},
	hybrid: {
		clientSecret: 'required',
		redirectUri: 'required',
		tokenAuthMethod: 'client_secret_post',
		explanation:
			'Hybrid Flow (OIDC only) combines aspects of Authorization Code and Implicit flows. Requires confidential client with secret and redirect URI. Returns some tokens in the front channel and others via back channel.',
	},
	ciba: {
		clientSecret: 'required',
		redirectUri: 'not-used',
		tokenAuthMethod: 'client_secret_post',
		explanation:
			'Client Initiated Backchannel Authentication (CIBA) is for decoupled authentication scenarios where the user authenticates on a different device. Requires client authentication but no redirect URI as authentication happens out-of-band.',
	},
	'jwt-bearer': {
		clientSecret: 'not-used',
		redirectUri: 'not-used',
		tokenAuthMethod: 'private_key_jwt',
		explanation:
			'JWT Bearer Token Flow uses a signed JWT assertion for client authentication instead of a client secret. Requires private key JWT authentication. No redirect URI needed as this is a direct token exchange flow.',
	},
	'worker-token': {
		clientSecret: 'required',
		redirectUri: 'not-used',
		tokenAuthMethod: 'client_secret_post',
		explanation:
			'Worker Token Flow (PingOne-specific) is used to obtain access tokens for PingOne Management APIs. Requires a Worker application type in PingOne with appropriate management scopes. Client authentication required, no redirect URI needed.',
	},
	'token-introspection': {
		clientSecret: 'required',
		redirectUri: 'not-used',
		tokenAuthMethod: 'client_secret_post',
		explanation:
			'Token Introspection is used to validate and get metadata about access tokens. Requires client authentication to call the introspection endpoint. No redirect URI needed as this is a utility endpoint.',
	},
	'token-revocation': {
		clientSecret: 'required',
		redirectUri: 'not-used',
		tokenAuthMethod: 'client_secret_post',
		explanation:
			'Token Revocation is used to invalidate access or refresh tokens. Requires client authentication to call the revocation endpoint. No redirect URI needed as this is a utility endpoint.',
	},
	userinfo: {
		clientSecret: 'not-used',
		redirectUri: 'not-used',
		tokenAuthMethod: 'none',
		explanation:
			'UserInfo endpoint (OIDC) is called with a valid access token to retrieve user profile information. No client authentication needed - the access token itself provides authorization. No redirect URI needed.',
	},
	redirectless: {
		clientSecret: 'optional',
		redirectUri: 'required',
		tokenAuthMethod: 'client_secret_post',
		explanation:
			'Redirectless Flow (PingOne response_mode=pi.flow) is an enhanced authorization code flow that embeds authentication in an iframe/webview. Supports both public (PKCE) and confidential clients. Redirect URI required for callback handling.',
	},
	rar: {
		clientSecret: 'required',
		redirectUri: 'required',
		tokenAuthMethod: 'client_secret_post',
		explanation:
			'Rich Authorization Requests (RAR) extends OAuth 2.0 with granular authorization details. Requires client secret for confidential client authentication and redirect URI for authorization callback. Authorization details specify exact permissions requested.',
	},
};

const Container = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	overflow: hidden;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
	padding: 1rem 1.5rem;
	background: white;
	border-bottom: 1px solid #e5e7eb;
	cursor: pointer;
	user-select: none;
	
	&:hover {
		background: #f9fafb;
	}
`;

const HeaderLeft = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex: 1;
`;

const CollapseIcon = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	background: #3b82f6;
	border-radius: 50%;
	width: 32px;
	height: 32px;
	transition: all 0.2s;
	
	&:hover {
		background: #2563eb;
	}
`;

const Content = styled.div<{ $isCollapsed: boolean }>`
	max-height: ${({ $isCollapsed }) => ($isCollapsed ? '0' : '2000px')};
	overflow: hidden;
	transition: max-height 0.3s ease;
	padding: ${({ $isCollapsed }) => ($isCollapsed ? '0 1.5rem' : '1.5rem')};
`;

const IconWrapper = styled.div`
	flex-shrink: 0;
	color: #3b82f6;
`;

const Title = styled.h3`
	margin: 0;
	font-size: 1.125rem;
	font-weight: 700;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const Explanation = styled.p`
	margin: 0 0 1.25rem 0;
	font-size: 0.9375rem;
	line-height: 1.6;
	color: #374151;
`;

const RequirementsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 1rem;
`;

const RequirementCard = styled.div<{ $status: 'required' | 'optional' | 'not-used' }>`
	background: white;
	border: 1px solid
		${({ $status }) =>
			$status === 'required' ? '#f59e0b' : $status === 'not-used' ? '#10b981' : '#6b7280'};
	border-radius: 0.5rem;
	padding: 1rem;
`;

const RequirementHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.5rem;
`;

const RequirementLabel = styled.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
`;

const StatusBadge = styled.div<{ $status: 'required' | 'optional' | 'not-used' }>`
	display: flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.25rem 0.625rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.025em;
	background: ${({ $status }) =>
		$status === 'required' ? '#fef3c7' : $status === 'not-used' ? '#d1fae5' : '#f3f4f6'};
	color: ${({ $status }) =>
		$status === 'required' ? '#92400e' : $status === 'not-used' ? '#065f46' : '#374151'};
`;

const RequirementValue = styled.div`
	font-size: 0.875rem;
	color: #6b7280;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	background: #f9fafb;
	padding: 0.5rem;
	border-radius: 0.375rem;
	margin-top: 0.5rem;
`;

const FlowConfigurationRequirements: React.FC<FlowConfigurationRequirementsProps> = ({
	flowType,
	variant = 'oauth',
}) => {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const requirements = FLOW_REQUIREMENTS[flowType];

	if (!requirements) {
		return null;
	}

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'required':
				return <FiAlertTriangle size={14} />;
			case 'not-used':
				return <FiCheck size={14} />;
			case 'optional':
				return <FiInfo size={14} />;
			default:
				return <FiX size={14} />;
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case 'required':
				return 'Required';
			case 'not-used':
				return 'Not Used';
			case 'optional':
				return 'Optional';
			default:
				return 'Unknown';
		}
	};

	return (
		<Container>
			<Header onClick={() => setIsCollapsed(!isCollapsed)}>
				<HeaderLeft>
					<IconWrapper>
						<FiInfo size={24} />
					</IconWrapper>
					<Title>
						PingOne Application Configuration Requirements
						{variant === 'oidc' && (
							<span style={{ fontSize: '0.875rem', color: '#6b7280' }}>(OIDC)</span>
						)}
					</Title>
				</HeaderLeft>
				<CollapseIcon>
					<FiChevronDown
						size={16}
						color="white"
						style={{
							transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
							transition: 'transform 0.2s ease',
						}}
					/>
				</CollapseIcon>
			</Header>

			<Content $isCollapsed={isCollapsed}>
				<Explanation>{requirements.explanation}</Explanation>

				<RequirementsGrid>
					<RequirementCard $status={requirements.clientSecret}>
						<RequirementHeader>
							<RequirementLabel>Client Secret</RequirementLabel>
							<StatusBadge $status={requirements.clientSecret}>
								{getStatusIcon(requirements.clientSecret)}
								{getStatusText(requirements.clientSecret)}
							</StatusBadge>
						</RequirementHeader>
						<RequirementValue>
							{requirements.clientSecret === 'required' && 'Must configure a client secret'}
							{requirements.clientSecret === 'optional' &&
								'Optional - use for confidential clients'}
							{requirements.clientSecret === 'not-used' && 'Public client - no secret needed'}
						</RequirementValue>
					</RequirementCard>

					<RequirementCard $status={requirements.redirectUri}>
						<RequirementHeader>
							<RequirementLabel>Redirect URI</RequirementLabel>
							<StatusBadge $status={requirements.redirectUri}>
								{getStatusIcon(requirements.redirectUri)}
								{getStatusText(requirements.redirectUri)}
							</StatusBadge>
						</RequirementHeader>
						<RequirementValue>
							{requirements.redirectUri === 'required' && 'Must configure redirect URI(s)'}
							{requirements.redirectUri === 'optional' && 'Optional - depends on use case'}
							{requirements.redirectUri === 'not-used' && 'No redirect URI needed'}
						</RequirementValue>
					</RequirementCard>

					<RequirementCard $status="required">
						<RequirementHeader>
							<RequirementLabel>Token Endpoint Auth Method</RequirementLabel>
							<StatusBadge $status="required">
								<FiAlertTriangle size={14} />
								Required
							</StatusBadge>
						</RequirementHeader>
						<RequirementValue>
							<strong>{requirements.tokenAuthMethod}</strong>
							{requirements.tokenAuthMethod === 'none' && ' (public client)'}
							{requirements.tokenAuthMethod === 'client_secret_post' && ' (confidential client)'}
						</RequirementValue>
					</RequirementCard>
				</RequirementsGrid>
			</Content>
		</Container>
	);
};

export default FlowConfigurationRequirements;
