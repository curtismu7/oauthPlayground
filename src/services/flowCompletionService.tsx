// src/services/flowCompletionService.tsx
/**
 * Flow Completion Service
 *
 * Provides a standardized completion page component for all OAuth/OIDC flows.
 * Includes success confirmation, summary of completed steps, and next steps guidance.
 */

import { FiCheckCircle, FiInfo, FiRefreshCw, FiZap } from '@icons';
import React from 'react';
import styled from 'styled-components';

export interface FlowCompletionStep {
	completed: boolean;
	description: string;
}

export interface FlowCompletionConfig {
	flowName: string;
	flowDescription: string;
	completedSteps: FlowCompletionStep[];
	nextSteps: string[];
	onStartNewFlow: () => void;
	showUserInfo?: boolean;
	showIntrospection?: boolean;
	userInfo?: Record<string, unknown>;
	introspectionResult?: Record<string, unknown>;
	flowType?: string;
}

// Styled Components
const CollapsibleSection = styled.div`
	background: white;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	margin-bottom: 1rem;
	overflow: hidden;
`;

const CollapsibleHeaderButton = styled.button`
	width: 100%;
	padding: 1rem 1.5rem;
	background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
	color: white;
	border: none;
	cursor: pointer;
	display: flex;
	justify-content: space-between;
	align-items: center;
	transition: background 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, #15803d 0%, #166534 100%);
	}
`;

const CollapsibleTitle = styled.h3`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CollapsibleToggleIcon = styled.div<{ $collapsed: boolean }>`
	transform: ${(props) => (props.$collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	transition: transform 0.2s ease;
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
`;

const InfoBox = styled.div<{ $variant?: 'success' | 'info' | 'warning' | 'error' }>`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1rem;
	border-radius: 8px;
	margin-bottom: 1rem;
	background: ${(props) => {
		switch (props.$variant) {
			case 'success':
				return '#f0fdf4';
			case 'info':
				return '#f0f9ff';
			case 'warning':
				return '#fffbeb';
			case 'error':
				return '#fef2f2';
			default:
				return '#f8fafc';
		}
	}};
	border: 1px solid ${(props) => {
		switch (props.$variant) {
			case 'success':
				return '#bbf7d0';
			case 'info':
				return '#bae6fd';
			case 'warning':
				return '#fed7aa';
			case 'error':
				return '#fecaca';
			default:
				return '#e2e8f0';
		}
	}};
`;

const InfoTitle = styled.h4`
	margin: 0 0 0.5rem 0;
	font-size: 1.125rem;
	font-weight: 600;
	color: ${(props) => props.theme?.colors?.success || '#15803d'};
`;

const InfoText = styled.p`
	margin: 0;
	color: #374151;
	line-height: 1.5;
`;

const ExplanationSection = styled.div`
	margin-top: 1.5rem;
`;

const ExplanationHeading = styled.h4`
	margin: 0 0 1rem 0;
	font-size: 1rem;
	font-weight: 600;
	color: #374151;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const SummaryContainer = styled.div`
	background-color: #f8fafc;
	padding: 1.5rem;
	border-radius: 0.5rem;
	border: 1px solid #e2e8f0;
`;

const SummaryList = styled.ul`
	margin: 0;
	padding-left: 1.5rem;
	line-height: 2;
`;

const SummaryItem = styled.li`
	color: #374151;
`;

const NextStepsList = styled.ul`
	margin-top: 0.75rem;
	padding-left: 1.5rem;
	line-height: 1.8;
`;

const NextStepsItem = styled.li`
	color: #6b7280;
`;

const ActionRow = styled.div`
	display: flex;
	gap: 1rem;
	margin-top: 1.5rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	border: none;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s ease;
	background: ${(props) => {
		switch (props.$variant) {
			case 'danger':
				return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
			case 'secondary':
				return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
			default:
				return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
		}
	}};
	color: white;

	&:hover {
		background: ${(props) => {
			switch (props.$variant) {
				case 'danger':
					return 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
				case 'secondary':
					return 'linear-gradient(135deg, #4b5563 0%, #374151 100%)';
				default:
					return 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
			}
		}};
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
`;

export const FlowCompletionService: React.FC<{
	config: FlowCompletionConfig;
	collapsed?: boolean;
	onToggleCollapsed?: () => void;
}> = ({ config, collapsed = false, onToggleCollapsed }) => {
	const {
		flowName,
		flowDescription,
		completedSteps,
		nextSteps,
		onStartNewFlow,
		showUserInfo = false,
		showIntrospection = false,
		userInfo,
		introspectionResult,
	} = config;

	return (
		<CollapsibleSection>
			<CollapsibleHeaderButton onClick={onToggleCollapsed}>
				<CollapsibleTitle>
					<FiCheckCircle /> Flow Complete
				</CollapsibleTitle>
				<CollapsibleToggleIcon $collapsed={collapsed}>
					<FiInfo />
				</CollapsibleToggleIcon>
			</CollapsibleHeaderButton>

			{!collapsed && (
				<CollapsibleContent>
					<InfoBox $variant="success">
						<FiCheckCircle size={24} />
						<div>
							<InfoTitle>{flowName} Complete!</InfoTitle>
							<InfoText>{flowDescription}</InfoText>
						</div>
					</InfoBox>

					<ExplanationSection>
						<ExplanationHeading>
							<FiInfo /> Summary
						</ExplanationHeading>
						<SummaryContainer>
							<SummaryList>
								{completedSteps.map((step, index) => (
									<SummaryItem key={index}>
										{step.completed ? '✅' : '⏳'} {step.description}
									</SummaryItem>
								))}
								{showUserInfo && userInfo && (
									<SummaryItem>✅ User information retrieved</SummaryItem>
								)}
								{showIntrospection && introspectionResult && (
									<SummaryItem>✅ Token introspected and validated</SummaryItem>
								)}
							</SummaryList>
						</SummaryContainer>
					</ExplanationSection>

					<ExplanationSection>
						<ExplanationHeading>
							<FiZap /> Next Steps
						</ExplanationHeading>
						<InfoText>In a production application, you would:</InfoText>
						<NextStepsList>
							{nextSteps.map((step, index) => (
								<NextStepsItem key={index}>{step}</NextStepsItem>
							))}
						</NextStepsList>
					</ExplanationSection>

					<ActionRow>
						<Button onClick={onStartNewFlow} $variant="danger">
							<FiRefreshCw /> Start New Flow
						</Button>
					</ActionRow>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);
};

// Predefined configurations for common flows
export const FlowCompletionConfigs = {
	authorizationCode: {
		flowName: 'Authorization Code Flow',
		flowDescription:
			"You've successfully completed the OAuth 2.0 Authorization Code flow with PKCE. The authorization code has been exchanged for tokens.",
		completedSteps: [
			{ completed: true, description: 'Authorization URL generated' },
			{ completed: true, description: 'User redirected to authorization server' },
			{ completed: true, description: 'User authorized the application' },
			{ completed: true, description: 'Authorization code received' },
			{ completed: true, description: 'Code exchanged for access token' },
		],
		nextSteps: [
			'Store the access token securely',
			'Use the access token to call protected APIs',
			'Refresh the token when it expires (if refresh token provided)',
			'Handle token expiration and re-authorization',
			'Implement proper error handling and retry logic',
		],
	},

	implicit: {
		flowName: 'Implicit Flow',
		flowDescription:
			"You've successfully completed the OAuth 2.0 Implicit flow. The access token has been received directly from the authorization server.",
		completedSteps: [
			{ completed: true, description: 'Authorization URL generated' },
			{ completed: true, description: 'User redirected to authorization server' },
			{ completed: true, description: 'User authorized the application' },
			{ completed: true, description: 'Access token received via URL fragment' },
		],
		nextSteps: [
			'Store the access token securely',
			'Use the access token to call protected APIs',
			'Handle token expiration and re-authorization',
			'Implement proper error handling and retry logic',
		],
	},

	deviceAuthorization: {
		flowName: 'Device Authorization Flow',
		flowDescription:
			"You've successfully completed the OAuth Device Authorization Grant flow. The device has been authorized and tokens have been received.",
		completedSteps: [
			{ completed: true, description: 'Device code requested and received' },
			{ completed: true, description: 'User code displayed to user' },
			{ completed: true, description: 'User authorized on secondary device' },
			{ completed: true, description: 'Tokens received via polling' },
		],
		nextSteps: [
			'Store the access token securely',
			'Use the access token to call protected APIs',
			'Refresh the token when it expires (if refresh token provided)',
			'Handle token expiration and re-authorization',
			'Implement proper error handling and retry logic',
		],
	},

	jwtBearer: {
		flowName: 'JWT Bearer Token Flow',
		flowDescription:
			"You've successfully completed the OAuth 2.0 JWT Bearer Token flow (RFC 7523). A JWT assertion has been exchanged for an access token.",
		completedSteps: [
			{ completed: true, description: 'JWT claims configured' },
			{ completed: true, description: 'JWT signed with private key' },
			{ completed: true, description: 'JWT assertion generated' },
			{ completed: true, description: 'JWT exchanged for access token' },
		],
		nextSteps: [
			'Store the access token securely',
			'Use the access token to call protected APIs',
			'Refresh the token when it expires (if supported)',
			'Implement proper JWT generation and signing',
			'Implement proper error handling and retry logic',
		],
	},

	clientCredentials: {
		flowName: 'Client Credentials Flow',
		flowDescription:
			"You've successfully completed the OAuth 2.0 Client Credentials flow. The client has been authenticated and access token received.",
		completedSteps: [
			{ completed: true, description: 'Client credentials validated' },
			{ completed: true, description: 'Token request sent to authorization server' },
			{ completed: true, description: 'Access token received' },
		],
		nextSteps: [
			'Store the access token securely',
			'Use the access token to call protected APIs',
			'Refresh the token when it expires',
			'Implement proper error handling and retry logic',
		],
	},

	hybrid: {
		flowName: 'OIDC Hybrid Flow',
		flowDescription:
			"You've successfully completed the OpenID Connect Hybrid flow. The authorization code and ID token have been received.",
		completedSteps: [
			{ completed: true, description: 'Authorization URL generated' },
			{ completed: true, description: 'User redirected to authorization server' },
			{ completed: true, description: 'User authorized the application' },
			{ completed: true, description: 'Authorization code and ID token received' },
			{ completed: true, description: 'Code exchanged for additional tokens' },
		],
		nextSteps: [
			'Store the access token and ID token securely',
			'Use the access token to call protected APIs',
			'Validate the ID token signature and claims',
			'Refresh the token when it expires (if refresh token provided)',
			'Handle token expiration and re-authorization',
			'Implement proper error handling and retry logic',
		],
	},

	workerToken: {
		flowName: 'PingOne Worker Token Flow',
		flowDescription:
			"You've successfully obtained a Worker app access token using OAuth 2.0 Client Credentials flow. This token provides administrative access to PingOne APIs.",
		completedSteps: [
			{ completed: true, description: 'Worker app credentials validated' },
			{ completed: true, description: 'Token request sent to PingOne' },
			{ completed: true, description: 'Worker access token received' },
		],
		nextSteps: [
			'Store the Worker access token securely in a vault',
			'Use the token to call PingOne Management APIs',
			'Monitor token expiration (1 hour validity)',
			'Implement automated token refresh before expiry',
			'Log all Worker app API calls for audit purposes',
			'Rotate Worker app client secrets regularly (every 90 days)',
		],
	},

	rar: {
		flowName: 'RAR Flow (V7) - Rich Authorization Requests',
		flowDescription:
			"You've successfully completed the RAR (Rich Authorization Requests) flow with fine-grained authorization details. The authorization request included structured JSON parameters for precise permission specifications.",
		completedSteps: [
			{ completed: true, description: 'RAR authorization details configured' },
			{ completed: true, description: 'Authorization URL generated with RAR parameters' },
			{ completed: true, description: 'User authorized with detailed permission context' },
			{ completed: true, description: 'Authorization code received with RAR context' },
			{ completed: true, description: 'Tokens exchanged maintaining RAR authorization details' },
		],
		nextSteps: [
			'Store the access token securely with RAR context',
			'Use the token to call APIs with fine-grained permissions',
			'Validate that the token includes the approved authorization details',
			'Implement proper RAR parameter validation in your application',
			'Handle token expiration and re-authorization with RAR context',
			'Consider implementing RAR for other OAuth flows in your system',
		],
	},
};

export default FlowCompletionService;
