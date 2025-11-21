import React, { useCallback, useState } from 'react';
import { FiCheckCircle, FiChevronDown, FiCopy, FiEye, FiShield } from 'react-icons/fi';
import styled from 'styled-components';
import { useUISettings } from '../contexts/UISettingsContext';
import { themeService } from '../services/themeService';
import { v4ToastManager } from '../utils/v4ToastMessages';

// Styled Components
const CollapsibleSection = styled.div`
	margin-bottom: 1.5rem;
`;

const CollapsibleHeaderButton = styled.button`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem;
	background: ${({ theme }) => theme.colors.background};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 0.5rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ theme }) => theme.colors.hover};
		border-color: ${({ theme }) => theme.colors.primary};
	}
`;

const CollapsibleTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text};
`;

const CollapsibleToggleIcon = styled.div<{ $collapsed: boolean }>`
	${() => themeService.getCollapseIconStyles()}
	width: 32px;
	height: 32px;
	border-radius: 50%;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};

	svg {
		width: 16px;
		height: 16px;
	}

	&:hover {
		transform: ${({ $collapsed }) =>
			$collapsed ? 'rotate(-90deg) scale(1.1)' : 'rotate(0deg) scale(1.1)'};
	}
`;

const CollapsibleContent = styled.div`
	padding: 1rem;
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-top: none;
	border-radius: 0 0 0.5rem 0.5rem;
	background: ${({ theme }) => theme.colors.background};
`;

const GeneratedContentBox = styled.div`
	background: ${({ theme }) => theme.colors.background};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 0.5rem;
	overflow: hidden;
	position: relative;
`;

const GeneratedLabel = styled.div`
	background: ${({ theme }) => theme.colors.primary};
	color: white;
	padding: 0.5rem 1rem;
	font-size: 0.8rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`;

const InfoText = styled.p`
	margin: 0;
	color: ${({ theme }) => theme.colors.textSecondary};
	line-height: 1.5;
`;

const CalloutCard = styled.div`
	background: ${({ theme }) => theme.colors.background};
	border: 1px solid ${({ theme }) => theme.colors.border};
	border-radius: 0.5rem;
	padding: 1rem;
`;

const InfoTitle = styled.h3`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin: 0 0 0.5rem 0;
	color: ${({ theme }) => theme.colors.text};
	font-size: 1.1rem;
	font-weight: 600;
`;

const InfoList = styled.ul`
	margin: 0;
	padding-left: 1.5rem;
	color: ${({ theme }) => theme.colors.textSecondary};
	line-height: 1.6;
`;

const ResultsSection = styled.div`
	margin-top: 1.5rem;
`;

const ResultsHeading = styled.h3`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin: 0 0 0.5rem 0;
	color: ${({ theme }) => theme.colors.text};
	font-size: 1.1rem;
	font-weight: 600;
`;

const HelperText = styled.p`
	margin: 0 0 1rem 0;
	color: ${({ theme }) => theme.colors.textSecondary};
	font-size: 0.9rem;
	line-height: 1.4;
`;

const ActionRow = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;
	justify-content: center;
	margin: 1.5rem 0;
`;

const HighlightedActionButton = styled.button<{ $priority: 'primary' | 'secondary' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background: ${({ $priority, theme }) =>
		$priority === 'primary' ? theme.colors.primary : theme.colors.secondary};
	color: white;
	border: none;
	border-radius: 0.5rem;
	font-weight: 600;
	font-size: 1rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin: 1rem 0;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const ParameterLabel = styled.div`
	font-weight: 600;
	color: ${({ theme }) => theme.colors.text};
	font-size: 0.9rem;
`;

const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.85rem;
	color: ${({ theme }) => theme.colors.textSecondary};
	word-break: break-word;
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'danger' | 'outline' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	background: ${({ $variant, theme }) => {
		switch ($variant) {
			case 'primary':
				return theme.colors.primary;
			case 'secondary':
				return theme.colors.secondary;
			case 'danger':
				return '#dc2626';
			case 'outline':
				return 'transparent';
			default:
				return theme.colors.primary;
		}
	}};
	color: ${({ $variant }) => ($variant === 'outline' ? '#374151' : 'white')};
	border: ${({ $variant }) => ($variant === 'outline' ? '1px solid #d1d5db' : 'none')};
	border-radius: 0.375rem;
	font-weight: 500;
	font-size: 0.9rem;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}
`;

// Types
interface TokenIntrospectionStepProps {
	tokens?: any;
	credentials?: any;
	introspectionResults?: any;
	onIntrospectToken: () => void;
	onResetFlow: () => void;
	onNavigateToTokenManagement: () => void;
	isIntrospecting?: boolean;
	flowType?: 'oauth' | 'oidc' | 'worker';
}

const TokenIntrospectionStep: React.FC<TokenIntrospectionStepProps> = ({
	tokens,
	credentials,
	introspectionResults,
	onIntrospectToken,
	onResetFlow,
	onNavigateToTokenManagement,
	isIntrospecting = false,
	flowType = 'oauth',
}) => {
	const { primaryColor, secondaryColor } = useUISettings();
	const [collapsedSections, setCollapsedSections] = useState({
		completionOverview: false,
		completionDetails: false,
		introspectionDetails: false,
	});

	const toggleSection = useCallback((section: keyof typeof collapsedSections) => {
		setCollapsedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard`);
	}, []);

	const getFlowSpecificText = () => {
		switch (flowType) {
			case 'oidc':
				return {
					title: 'OpenID Connect Authorization Code Flow',
					description:
						'Nice work! You successfully completed the OpenID Connect Authorization Code Flow with PKCE using reusable V5 components.',
					nextSteps: [
						'Inspect or decode tokens using the Token Management tools.',
						'Repeat the flow with different scopes or redirect URIs.',
						'Explore refresh tokens, ID tokens, and introspection flows.',
					],
				};
			case 'worker':
				return {
					title: 'Worker Token Flow',
					description:
						'Nice work! You successfully completed the Worker Token Flow using reusable V5 components.',
					nextSteps: [
						'Inspect or decode tokens using the Token Management tools.',
						'Repeat the flow with different scopes.',
						'Explore token introspection and validation flows.',
					],
				};
			default: // oauth
				return {
					title: 'OAuth 2.0 Authorization Code Flow',
					description:
						'Nice work! You successfully completed the OAuth 2.0 Authorization Code Flow with PKCE using reusable V5 components.',
					nextSteps: [
						'Inspect or decode tokens using the Token Management tools.',
						'Repeat the flow with different scopes or redirect URIs.',
						'Explore refresh tokens and introspection flows.',
					],
				};
		}
	};

	const flowText = getFlowSpecificText();

	return (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('completionOverview')}
					aria-expanded={!collapsedSections.completionOverview}
				>
					<CollapsibleTitle>
						<FiCheckCircle /> Flow Completion Overview
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.completionOverview}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.completionOverview && (
					<CollapsibleContent>
						<GeneratedContentBox>
							<GeneratedLabel style={{ backgroundColor: primaryColor }}>All Done</GeneratedLabel>
							<InfoText>{flowText.description}</InfoText>
						</GeneratedContentBox>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('completionDetails')}
					aria-expanded={!collapsedSections.completionDetails}
				>
					<CollapsibleTitle>
						<FiShield /> Next Steps & Resources
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.completionDetails}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.completionDetails && (
					<CollapsibleContent>
						<CalloutCard style={{ marginTop: '1.5rem' }}>
							<InfoTitle>
								<FiShield /> Next Steps
							</InfoTitle>
							<InfoList>
								{flowText.nextSteps.map((step, index) => (
									<li key={index}>{step}</li>
								))}
							</InfoList>
						</CalloutCard>
					</CollapsibleContent>
				)}
			</CollapsibleSection>

			{/* Token Introspection Section */}
			{tokens?.access_token && (
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => toggleSection('introspectionDetails')}
						aria-expanded={!collapsedSections.introspectionDetails}
					>
						<CollapsibleTitle>
							<FiEye /> Token Introspection
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={collapsedSections.introspectionDetails}>
							<FiChevronDown />
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!collapsedSections.introspectionDetails && (
						<CollapsibleContent>
							<ResultsSection>
								<ResultsHeading>
									<FiEye /> Access Token Introspection
								</ResultsHeading>
								<HelperText>
									Introspect your access token to see detailed information about its validity,
									scopes, and claims.
								</HelperText>

								<ActionRow style={{ justifyContent: 'center', marginBottom: '1rem' }}>
									<HighlightedActionButton
										onClick={onIntrospectToken}
										$priority="primary"
										disabled={isIntrospecting}
										style={{
											backgroundColor: primaryColor,
											borderColor: primaryColor,
										}}
									>
										<FiEye /> {isIntrospecting ? 'Introspecting...' : 'Introspect Access Token'}
									</HighlightedActionButton>
								</ActionRow>

								{introspectionResults && (
									<GeneratedContentBox>
										<GeneratedLabel style={{ backgroundColor: primaryColor }}>
											Introspection Results
										</GeneratedLabel>
										<ParameterGrid>
											<div style={{ gridColumn: '1 / -1' }}>
												<ParameterLabel>Token Status</ParameterLabel>
												<ParameterValue
													style={{
														color: introspectionResults.active ? '#16a34a' : '#dc2626',
														fontWeight: 'bold',
													}}
												>
													{introspectionResults.active
														? '✅ Active'
														: introspectionResults.exp &&
																Date.now() >= introspectionResults.exp * 1000
															? '❌ Expired'
															: '❌ Inactive'}
												</ParameterValue>
											</div>
											{introspectionResults.scope && (
												<div>
													<ParameterLabel>Scope</ParameterLabel>
													<ParameterValue>{String(introspectionResults.scope)}</ParameterValue>
												</div>
											)}
											{introspectionResults.client_id && (
												<div>
													<ParameterLabel>Client ID</ParameterLabel>
													<ParameterValue>{String(introspectionResults.client_id)}</ParameterValue>
												</div>
											)}
											{introspectionResults.sub && (
												<div>
													<ParameterLabel>Subject</ParameterLabel>
													<ParameterValue>{String(introspectionResults.sub)}</ParameterValue>
												</div>
											)}
											{introspectionResults.token_type && (
												<div>
													<ParameterLabel>Token Type</ParameterLabel>
													<ParameterValue>{String(introspectionResults.token_type)}</ParameterValue>
												</div>
											)}
											{introspectionResults.aud && (
												<div>
													<ParameterLabel>Audience</ParameterLabel>
													<ParameterValue>{String(introspectionResults.aud)}</ParameterValue>
												</div>
											)}
											{introspectionResults.iss && (
												<div>
													<ParameterLabel>Issuer</ParameterLabel>
													<ParameterValue>{String(introspectionResults.iss)}</ParameterValue>
												</div>
											)}
											{introspectionResults.exp && (
												<div>
													<ParameterLabel>Expires At</ParameterLabel>
													<ParameterValue>
														{new Date(Number(introspectionResults.exp) * 1000).toLocaleString()}
													</ParameterValue>
												</div>
											)}
											{introspectionResults.iat && (
												<div>
													<ParameterLabel>Issued At</ParameterLabel>
													<ParameterValue>
														{new Date(Number(introspectionResults.iat) * 1000).toLocaleString()}
													</ParameterValue>
												</div>
											)}
										</ParameterGrid>
										<ActionRow>
											<Button
												onClick={() =>
													handleCopy(
														JSON.stringify(introspectionResults, null, 2),
														'Introspection Results'
													)
												}
												$variant="outline"
											>
												<FiCopy /> Copy Results
											</Button>
										</ActionRow>
									</GeneratedContentBox>
								)}
							</ResultsSection>
						</CollapsibleContent>
					)}
				</CollapsibleSection>
			)}
		</>
	);
};

export default TokenIntrospectionStep;
