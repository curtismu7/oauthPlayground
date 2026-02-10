/**
 * @file UnifiedFlowSuccessStepV8U.tsx
 * @module v8u/components
 * @description Success Step for Unified OAuth flows with user data and educational content
 * @version 8.0.0
 * @since 2026-02-05
 */

import React, { useCallback, useMemo } from 'react';
import {
	FiBook,
	FiCheckCircle,
	FiClock,
	FiDownload,
	FiExternalLink,
	FiKey,
	FiRefreshCw,
	FiShield,
	FiUser,
} from 'react-icons/fi';
import styled from 'styled-components';
import { useAuth } from '@/contexts/NewAuthContext';
import { type FlowType, type SpecVersion } from '@/v8/services/specVersionServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { type UnifiedFlowCredentials } from '../services/unifiedFlowIntegrationV8U';
import { TokenDisplayV8U } from './TokenDisplayV8U';

const _MODULE_TAG = '[✅ UNIFIED-FLOW-SUCCESS-V8U]';

interface UnifiedFlowSuccessStepV8UProps {
	flowType: FlowType;
	specVersion: SpecVersion;
	credentials: UnifiedFlowCredentials;
	onFlowReset: () => void;
}

const SuccessContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const SuccessHeader = styled.div`
	text-align: center;
	margin-bottom: 3rem;
	padding: 2rem;
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	border-radius: 1rem;
	color: white;
`;

const SuccessTitle = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 1rem;
`;

const SuccessSubtitle = styled.p`
	font-size: 1.2rem;
	opacity: 0.9;
	margin-bottom: 0;
`;

const Section = styled.section`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	margin-bottom: 2rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	border: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 600;
	margin-bottom: 1.5rem;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const GridContainer = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 2rem;
	margin-bottom: 2rem;
`;

const InfoCard = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	padding: 1.5rem;
`;

const InfoCardTitle = styled.h3`
	font-size: 1.1rem;
	font-weight: 600;
	margin-bottom: 1rem;
	color: #374151;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const InfoCardContent = styled.div`
	color: #6b7280;
	line-height: 1.6;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	border: none;
	font-size: 1rem;

	${({ $variant = 'primary' }) =>
		$variant === 'primary'
			? `
		background: #10b981;
		color: white;
		&:hover {
			background: #059669;
		}
	`
			: `
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		&:hover {
			background: #e5e7eb;
		}
	`}
`;

const ActionButtonsContainer = styled.div`
	display: flex;
	gap: 1rem;
	justify-content: center;
	flex-wrap: wrap;
	margin-top: 2rem;
`;

const LearningSection = styled.div`
	background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
	border: 1px solid #bfdbfe;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-top: 1rem;
`;

const LearningTitle = styled.h3`
	font-size: 1.1rem;
	font-weight: 600;
	margin-bottom: 1rem;
	color: #1e40af;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const LearningContent = styled.ul`
	margin: 0;
	padding-left: 1.5rem;
	color: #3730a3;
	line-height: 1.6;

	li {
		margin-bottom: 0.5rem;
	}
`;

export const UnifiedFlowSuccessStepV8U: React.FC<UnifiedFlowSuccessStepV8UProps> = ({
	flowType,
	specVersion,
	credentials,
	onFlowReset,
}) => {
	const { tokens } = useAuth();

	// Get flow information
	const flowInfo = useMemo(() => {
		const flowNames: Record<FlowType, string> = {
			'oauth-authz': 'OAuth 2.0 Authorization Code Flow',
			implicit: 'OAuth 2.0 Implicit Flow',
			'client-credentials': 'OAuth 2.0 Client Credentials Flow',
			'device-code': 'OAuth 2.0 Device Authorization Flow',
			hybrid: 'OpenID Connect Hybrid Flow',
			ropc: 'OAuth 2.0 Resource Owner Password Credentials Flow',
		};

		return {
			name: flowNames[flowType],
			isOIDC: flowType === 'hybrid' || specVersion === 'oidc',
		};
	}, [flowType, specVersion]);

	// Export flow data
	const handleExportData = useCallback(() => {
		const exportData = {
			timestamp: new Date().toISOString(),
			flow: {
				type: flowType,
				specVersion: specVersion,
				name: flowInfo.name,
			},
			credentials: {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri,
				scopes: credentials.scopes,
			},
			tokens: tokens
				? {
						hasAccessToken: !!(tokens as any).access_token,
						hasRefreshToken: !!(tokens as any).refresh_token,
						hasIdToken: !!(tokens as any).id_token,
						tokenTypes: Object.keys(tokens).filter((key) => (tokens as any)[key]),
					}
				: null,
		};

		const dataStr = JSON.stringify(exportData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `unified-flow-${flowType}-${Date.now()}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		toastV8.success('✅ Flow data exported successfully!');
	}, [flowType, specVersion, credentials, tokens, flowInfo.name]);

	// Get educational content based on flow type
	const getEducationalContent = useCallback((): string[] => {
		const content: Record<FlowType, string[]> = {
			'oauth-authz': [
				'You successfully completed the most secure OAuth 2.0 flow!',
				'The authorization code flow ensures tokens are never exposed to the browser',
				'PKCE (Proof Key for Code Exchange) added extra security against code interception',
				'Your access token can now be used to call protected APIs on behalf of the user',
				'The refresh token allows obtaining new access tokens without user re-authentication',
			],
			implicit: [
				'You completed the Implicit Flow (note: this flow is deprecated in OAuth 2.1)',
				'Tokens were returned directly in the URL fragment - less secure than authorization code',
				'Consider migrating to Authorization Code with PKCE for better security',
				'The access token can be used to call protected APIs',
				'No refresh token is available in implicit flow - user must re-authenticate when token expires',
			],
			'client-credentials': [
				'You successfully authenticated using the Client Credentials Flow!',
				'This flow is used for machine-to-machine communication',
				'No user context - the token represents the application itself',
				"The access token can be used to call protected APIs that don't require user context",
				'Token scopes determine what APIs your application can access',
			],
			'device-code': [
				'You completed the Device Authorization Flow!',
				'This flow is perfect for devices with limited input capabilities',
				'The user authenticated on a separate device while your app polled for tokens',
				"The access token represents the user's authorization for your device",
				'This flow is commonly used on smart TVs, IoT devices, and command-line tools',
			],
			hybrid: [
				'You successfully completed the OpenID Connect Hybrid Flow!',
				'This flow combines benefits of implicit and authorization code flows',
				'You received both an ID token (immediately) and authorization code',
				'The ID token provides immediate user authentication',
				'The authorization code was exchanged for access and refresh tokens',
				'This flow is useful when you need both immediate authentication and secure token delivery',
			],
			ropc: [
				'You completed the Resource Owner Password Credentials Flow!',
				'This flow directly exchanges user credentials for tokens',
				'⚠️ Use this flow only when absolutely necessary and trusted',
				"The user's username and password were handled securely",
				'This flow is suitable for legacy applications or first-party trusted clients',
			],
		};

		return content[flowType] || [];
	}, [flowType]);

	return (
		<SuccessContainer>
			<SuccessHeader>
				<SuccessTitle>
					<FiCheckCircle size={48} />
					Flow Completed Successfully!
				</SuccessTitle>
				<SuccessSubtitle>
					{flowInfo.name} completed successfully. Here's what happened and what you can do next.
				</SuccessSubtitle>
			</SuccessHeader>

			<Section>
				<SectionTitle>
					<FiUser />
					User Information & Credentials
				</SectionTitle>
				<GridContainer>
					<InfoCard>
						<InfoCardTitle>
							<FiKey />
							Credentials Used
						</InfoCardTitle>
						<InfoCardContent>
							<strong>Environment ID:</strong> {credentials.environmentId}
							<br />
							<strong>Client ID:</strong> {credentials.clientId}
							<br />
							<strong>Redirect URI:</strong> {credentials.redirectUri || 'N/A'}
							<br />
							<strong>Scopes:</strong>{' '}
							{Array.isArray(credentials.scopes)
								? credentials.scopes.join(', ')
								: credentials.scopes || 'N/A'}
							<br />
							<strong>Flow Type:</strong> {flowInfo.name}
						</InfoCardContent>
					</InfoCard>

					<InfoCard>
						<InfoCardTitle>
							<FiShield />
							Security Features
						</InfoCardTitle>
						<InfoCardContent>
							{flowType === 'oauth-authz' && (
								<>
									✅ Authorization Code Flow (most secure)
									<br />✅ PKCE protection enabled
									<br />✅ State parameter prevents CSRF
									<br />✅ Tokens delivered via secure back-channel
								</>
							)}
							{flowType === 'hybrid' && (
								<>
									✅ OpenID Connect Hybrid Flow
									<br />✅ ID token validation
									<br />✅ PKCE protection enabled
									<br />✅ Immediate user authentication
								</>
							)}
							{flowType === 'client-credentials' && (
								<>
									✅ Application-to-application authentication
									<br />✅ No user context required
									<br />✅ Direct token exchange
									<br />✅ Suitable for backend services
								</>
							)}
							{flowType === 'device-code' && (
								<>
									✅ Device authorization completed
									<br />✅ User authenticated separately
									<br />✅ Polling mechanism successful
									<br />✅ Suitable for limited-input devices
								</>
							)}
							{flowType === 'implicit' && (
								<>
									⚠️ Implicit Flow (deprecated in OAuth 2.1)
									<br />
									⚠️ Tokens exposed to browser
									<br />
									⚠️ Consider migration to Auth Code + PKCE
									<br />✅ Still functional for legacy systems
								</>
							)}
						</InfoCardContent>
					</InfoCard>
				</GridContainer>

				{tokens && (
					<div style={{ marginTop: '2rem' }}>
						<SectionTitle>
							<FiKey />
							Received Tokens
						</SectionTitle>
						<TokenDisplayV8U tokens={tokens} flowType={flowType} specVersion={specVersion} />
					</div>
				)}
			</Section>

			<Section>
				<SectionTitle>
					<FiBook />
					What You Learned
				</SectionTitle>
				<LearningSection>
					<LearningTitle>
						<FiBook />
						Key Concepts Mastered
					</LearningTitle>
					<LearningContent>
						{getEducationalContent().map((item: string, index: number) => (
							<li key={index}>{item}</li>
						))}
					</LearningContent>
				</LearningSection>

				<GridContainer style={{ marginTop: '2rem' }}>
					<InfoCard>
						<InfoCardTitle>
							<FiClock />
							Next Steps
						</InfoCardTitle>
						<InfoCardContent>
							<strong>Immediate:</strong>
							<br />• Use your access token to call protected APIs
							<br />• Test token refresh (if refresh token available)
							<br />• Validate ID token claims (if OIDC flow)
							<br />
							<br />
							<strong>Long-term:</strong>
							<br />• Implement proper token storage
							<br />• Handle token expiration gracefully
							<br />• Implement error handling for API calls
						</InfoCardContent>
					</InfoCard>

					<InfoCard>
						<InfoCardTitle>
							<FiExternalLink />
							Additional Resources
						</InfoCardTitle>
						<InfoCardContent>
							<strong>Documentation:</strong>
							<br />• PingOne API Documentation
							<br />• OAuth 2.0 RFC 6749
							<br />• OpenID Connect specs
							<br />
							<br />
							<strong>Tools:</strong>
							<br />• Token Management page
							<br />• API Playground
							<br />• Flow Documentation
						</InfoCardContent>
					</InfoCard>
				</GridContainer>
			</Section>

			<ActionButtonsContainer>
				<ActionButton onClick={handleExportData}>
					<FiDownload />
					Export Flow Data
				</ActionButton>
				<ActionButton $variant="secondary" onClick={onFlowReset}>
					<FiRefreshCw />
					Start New Flow
				</ActionButton>
			</ActionButtonsContainer>
		</SuccessContainer>
	);
};
