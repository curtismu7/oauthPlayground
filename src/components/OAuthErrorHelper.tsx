// src/components/OAuthErrorHelper.tsx
import React from 'react';
import { getAppOrigin } from '../utils/flowRedirectUriMapping';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiCopy,
	FiExternalLink,
	FiGlobe,
	FiRefreshCw,
	FiSettings,
	FiShield,
	FiX,
} from 'react-icons/fi';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const ErrorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const ErrorIcon = styled.div`
  color: #dc2626;
  font-size: 1.5rem;
`;

const ErrorTitle = styled.h3`
  color: #dc2626;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`;

const ErrorMessage = styled.div`
  color: #7f1d1d;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const SolutionsSection = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
`;

const SolutionsTitle = styled.h4`
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SolutionItem = styled.div`
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  border-left: 4px solid #3b82f6;
`;

const SolutionTitle = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SolutionDescription = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const CodeBlock = styled.div`
  background: #1f2937;
  color: #f9fafb;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  margin: 0.5rem 0;
  overflow-x: auto;
`;

const CopyButton = styled.button`
  background: none;
  border: 1px solid #6b7280;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  margin-left: 0.5rem;
  
  &:hover {
    background: #374151;
    color: #f9fafb;
  }
`;

interface OAuthErrorHelperProps {
	error: string;
	errorDescription?: string;
	correlationId?: string;
	onRetry?: () => void;
	onGoToConfig?: () => void;
	onDismiss?: () => void;
}

export const OAuthErrorHelper: React.FC<OAuthErrorHelperProps> = ({
	error,
	errorDescription,
	correlationId,
	onRetry,
	onGoToConfig,
	onDismiss,
}) => {
	const getErrorGuidance = (error: string) => {
		if (!error || typeof error !== 'string') {
			return {
				title: 'Unknown Error',
				description: 'An unknown error occurred during the OAuth flow.',
				solutions: [
					{
						title: 'General Troubleshooting',
						icon: <FiSettings />,
						description: 'Check your configuration and try again.',
						steps: [
							'Verify your client credentials are correct',
							'Check that redirect URI matches exactly',
							'Ensure your PingOne application is properly configured',
						],
					},
				],
			};
		}

		switch (error.toLowerCase()) {
			case 'invalid_scope':
			case 'at least one scope must be granted':
				return {
					title: 'Scope Configuration Error',
					description: 'The requested scopes are not properly configured or granted.',
					solutions: [
						{
							title: 'Check PingOne Application Configuration',
							icon: <FiSettings />,
							description:
								'Verify that the required scopes are enabled in your PingOne application settings.',
							steps: [
								'Go to PingOne Admin Console',
								'Navigate to your application',
								'Check the "Scopes" section',
								'Ensure the required scopes are enabled',
							],
							codeExample: 'Required scopes: openid, profile, email',
						},
						{
							title: 'Verify Scope Format',
							icon: <FiShield />,
							description: 'Ensure scopes are properly formatted in your authorization request.',
							steps: [
								'Check that scopes are space-separated',
								'Verify scope names match PingOne configuration',
								'Ensure no invalid characters are present',
							],
							codeExample: 'scope=openid profile email',
						},
						{
							title: 'Check Application Permissions',
							icon: <FiGlobe />,
							description:
								'Verify your application has the necessary permissions for the requested scopes.',
							steps: [
								'Review application role assignments',
								'Check resource access policies',
								'Verify user consent requirements',
							],
						},
					],
				};

			case 'invalid_client':
				return {
					title: 'Client Configuration Error',
					description: 'The client ID or client secret is invalid or not properly configured.',
					solutions: [
						{
							title: 'Verify Client Credentials',
							icon: <FiSettings />,
							description: 'Check that your client ID and client secret are correct.',
							steps: [
								'Verify client ID in PingOne Admin Console',
								'Check client secret is correct',
								'Ensure credentials are properly copied',
							],
						},
						{
							title: 'Check Application Status',
							icon: <FiShield />,
							description: 'Ensure your application is active and properly configured.',
							steps: [
								'Verify application is enabled',
								'Check application type matches flow',
								'Review redirect URI configuration',
							],
						},
					],
				};

			case 'invalid_redirect_uri':
				return {
					title: 'Redirect URI Error',
					description: 'The redirect URI in the request does not match the configured URI.',
					solutions: [
						{
							title: 'Update Redirect URI Configuration',
							icon: <FiSettings />,
							description: 'Add the correct redirect URI to your PingOne application.',
							steps: [
								'Go to PingOne Admin Console',
								'Navigate to your application',
								'Add the redirect URI to allowed URIs',
								'Ensure exact match including protocol and port',
							],
							codeExample: `${getAppOrigin()}/authz-callback`,
						},
					],
				};

			case 'access_denied':
				return {
					title: 'Access Denied',
					description: 'The user denied the authorization request or access was not granted.',
					solutions: [
						{
							title: 'User Consent Required',
							icon: <FiShield />,
							description: 'The user needs to grant permission for the requested scopes.',
							steps: [
								'User must click "Allow" or "Authorize"',
								'Check if user has necessary permissions',
								'Verify user is in correct user group',
							],
						},
					],
				};

			default:
				return {
					title: 'OAuth Error',
					description:
						errorDescription || 'An OAuth error occurred during the authorization process.',
					solutions: [
						{
							title: 'Check Configuration',
							icon: <FiSettings />,
							description: 'Verify your PingOne application configuration.',
							steps: [
								'Review application settings',
								'Check environment configuration',
								'Verify all required parameters',
							],
						},
						{
							title: 'Review Error Details',
							icon: <FiAlertTriangle />,
							description: 'Check the error details for more specific information.',
							steps: [
								'Look at the correlation ID for support',
								'Check browser console for additional errors',
								'Review network requests',
							],
						},
					],
				};
		}
	};

	const guidance = getErrorGuidance(error);

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
	};

	return (
		<ErrorContainer>
			<ErrorHeader>
				<ErrorIcon>
					<FiAlertTriangle />
				</ErrorIcon>
				<ErrorTitle>{guidance.title}</ErrorTitle>
			</ErrorHeader>

			<ErrorMessage>
				<strong>Error:</strong> {error}
				{errorDescription && (
					<>
						<br />
						<strong>Description:</strong> {errorDescription}
					</>
				)}
				{correlationId && (
					<>
						<br />
						<strong>Correlation ID:</strong> {correlationId}
					</>
				)}
			</ErrorMessage>

			<SolutionsSection>
				<SolutionsTitle>
					<FiCheckCircle />
					Possible Solutions
				</SolutionsTitle>

				{guidance.solutions && guidance.solutions.length > 0 ? (
					guidance.solutions.map((solution, index) => (
						<SolutionItem key={index}>
							<SolutionTitle>
								{solution.icon}
								{solution.title}
							</SolutionTitle>
							<SolutionDescription>{solution.description}</SolutionDescription>

							{solution.steps && (
								<div style={{ marginBottom: '0.75rem' }}>
									<strong>Steps to resolve:</strong>
									<ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
										{solution.steps && solution.steps.length > 0 ? (
											solution.steps.map((step, stepIndex) => (
												<li key={stepIndex} style={{ marginBottom: '0.25rem' }}>
													{step}
												</li>
											))
										) : (
											<li style={{ color: '#6b7280' }}>No specific steps available</li>
										)}
									</ol>
								</div>
							)}

							{solution.codeExample && (
								<div>
									<strong>Example:</strong>
									<CodeBlock>
										{solution.codeExample}
										<CopyButton onClick={() => copyToClipboard(solution.codeExample!)}>
											<FiCopy size={12} />
											Copy
										</CopyButton>
									</CodeBlock>
								</div>
							)}
						</SolutionItem>
					))
				) : (
					<div style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
						No specific solutions available for this error.
					</div>
				)}
			</SolutionsSection>

			<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
				{onRetry && (
					<ActionButton onClick={onRetry}>
						<FiRefreshCw size={16} />
						Try Again
					</ActionButton>
				)}

				{onGoToConfig && (
					<ActionButton onClick={onGoToConfig}>
						<FiSettings size={16} />
						Go to Configuration
					</ActionButton>
				)}

				<ActionButton
					onClick={() =>
						window.open(
							'https://docs.pingidentity.com/bundle/pingone/page/ojg1564020488637.html',
							'_blank'
						)
					}
				>
					<FiExternalLink size={16} />
					PingOne Documentation
				</ActionButton>

				{onDismiss && (
					<ActionButton onClick={onDismiss} style={{ background: '#6b7280', color: 'white' }}>
						<FiX size={16} />
						Dismiss
					</ActionButton>
				)}
			</div>
		</ErrorContainer>
	);
};

export default OAuthErrorHelper;
