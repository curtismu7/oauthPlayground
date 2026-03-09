// src/components/TokenIntrospect.tsx
// lint-file-disable: token-value-in-jsx

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { createModuleLogger } from '../utils/consoleMigrationHelper';
import { CalloutCard } from './InfoBlocks';
import NextSteps from './NextSteps';

// Styled components (reused from AuthorizationCodeFlowV5)
const CollapsibleSection = styled.section`
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: V9_COLORS.TEXT.WHITE;
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeaderButton = styled.button<{ $collapsed?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.25rem 1.5rem;
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf3 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #14532d;
	transition: background 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, V9_COLORS.BG.SUCCESS 0%, #ecfdf3 100%);
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.2s ease;
	transform: ${({ $collapsed }) => ($collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
	color: #15803d;
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	padding-top: 0;
	animation: fadeIn 0.2s ease;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

const GeneratedContentBox = styled.div`
	background-color: V9_COLORS.BG.SUCCESS;
	border: 1px solid V9_COLORS.PRIMARY.GREEN;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1.5rem 0;
	position: relative;
`;

const GeneratedLabel = styled.div`
	position: absolute;
	top: -10px;
	left: 16px;
	background-color: V9_COLORS.PRIMARY.GREEN_DARK;
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
`;

const ParameterGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1rem;
	margin: 1rem 0;
`;

const UserInfoGrid = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin: 1rem 0;
`;

const UserInfoRow = styled.div`
	display: grid;
	grid-template-columns: 180px 1fr;
	gap: 1rem;
	align-items: start;
	padding: 0.75rem;
	background: #f0fdf4;
	border-radius: 0.5rem;
	border: 1px solid V9_COLORS.BG.SUCCESS_BORDER;
`;

const ParameterLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: V9_COLORS.PRIMARY.GREEN_DARK;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const ParameterValue = styled.div`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	color: #064e3b;
	word-break: break-all;
	background-color: #f0fdf4;
	padding: 0.5rem;
	border-radius: 0.25rem;
	border: 1px solid V9_COLORS.BG.SUCCESS_BORDER;
`;

const ActionRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	align-items: center;
	margin-top: 1.5rem;
`;

const Button = styled.button<{
	$variant?: 'primary' | 'success' | 'secondary' | 'danger' | 'outline';
}>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
	transition: all 0.2s;
	border: 1px solid transparent;
	opacity: ${(props) => (props.disabled ? 0.6 : 1)};

	${({ $variant }) =>
		$variant === 'primary' &&
		`
		background-color: V9_COLORS.PRIMARY.GREEN;
		color: V9_COLORS.TEXT.WHITE;
		&:hover:not(:disabled) {
			background-color: V9_COLORS.PRIMARY.GREEN_DARK;
		}
	`}

	${({ $variant }) =>
		$variant === 'success' &&
		`
		background-color: V9_COLORS.PRIMARY.GREEN_DARK;
		color: V9_COLORS.TEXT.WHITE;
		&:hover:not(:disabled) {
			background-color: #15803d;
		}
	`}

	${({ $variant }) =>
		$variant === 'secondary' &&
		`
		background-color: #0ea5e9;
		color: V9_COLORS.TEXT.WHITE;
		&:hover:not(:disabled) {
			background-color: V9_COLORS.PRIMARY.BLUE;
		}
	`}

	${({ $variant }) =>
		$variant === 'danger' &&
		`
		background-color: V9_COLORS.PRIMARY.RED;
		color: V9_COLORS.TEXT.WHITE;
		&:hover:not(:disabled) {
			background-color: V9_COLORS.PRIMARY.RED_DARK;
		}
	`}

	${({ $variant }) =>
		$variant === 'outline' &&
		`
		background-color: transparent;
		color: #14532d;
		border-color: V9_COLORS.BG.SUCCESS_BORDER;
		&:hover:not(:disabled) {
			background-color: #f0fdf4;
			border-color: V9_COLORS.PRIMARY.GREEN;
		}
	`}
`;

const HighlightedActionButton = styled(Button)<{ $priority: 'primary' | 'success' }>`
	position: relative;
	background:
		${({ $priority }) =>
			$priority === 'primary'
				? 'linear-gradient(135deg, V9_COLORS.PRIMARY.GREEN 0%, V9_COLORS.PRIMARY.GREEN_DARK 100%)'
				: 'linear-gradient(135deg, V9_COLORS.PRIMARY.GREEN 0%, V9_COLORS.PRIMARY.GREEN_DARK 100%)'};
	box-shadow:
		${({ $priority }) =>
			$priority === 'primary'
				? '0 6px 18px rgba(34, 197, 94, 0.35)'
				: '0 6px 18px rgba(16, 185, 129, 0.35)'};
	color: V9_COLORS.TEXT.WHITE;
	padding-right: 2.5rem;

	&:hover {
		transform: scale(1.02);
	}

	&:disabled {
		background:
			${({ $priority }) =>
				$priority === 'primary'
					? 'linear-gradient(135deg, rgba(34,197,94,0.6) 0%, rgba(22,163,74,0.6) 100%)'
					: 'linear-gradient(135deg, rgba(16,185,129,0.6) 0%, rgba(5,150,105,0.6) 100%)'};
		box-shadow: none;
	}
`;

const InfoTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin: 0;
`;

const InfoText = styled.p`
	font-size: 0.95rem;
	color: #3f3f46;
	line-height: 1.7;
	margin: 0;
`;

const ResultsSection = styled.div`
	margin: 1.5rem 0;
`;

const ResultsHeading = styled.h3`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.125rem;
	font-weight: 600;
	color: #14532d;
	margin: 0 0 0.5rem;
`;

const HelperText = styled.p`
	font-size: 0.875rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	line-height: 1.5;
	margin: 0 0 1rem;
`;

const RawJsonContainer = styled.div`
	width: 100%;
	margin: 1rem 0;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' }>`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1.5rem;
	border-radius: 0.75rem;
	background: ${({ $variant }) => {
		switch ($variant) {
			case 'warning':
				return '#fef3c7';
			case 'success':
				return '#ecfdf5';
			default:
				return '#f8fafc';
		}
	}};
	border: 1px solid ${({ $variant }) => {
		switch ($variant) {
			case 'warning':
				return '#f59e0b';
			case 'success':
				return '#10b981';
			default:
				return '#3b82f6';
		}
	}};
	margin: 1rem 0;
`;

// Props interface for the reusable component
interface TokenIntrospectProps {
	// Flow identification
	flowName: string;
	flowVersion?: string;

	// Tokens for introspection (optional)
	tokens?: {
		access_token?: string;
		refresh_token?: string;
		[key: string]: unknown;
	};

	// Credentials for introspection (optional)
	credentials?: {
		environmentId?: string;
		clientId?: string;
		clientSecret?: string;
		[key: string]: unknown;
	};

	// User information
	userInfo?: Record<string, unknown> | null;
	onFetchUserInfo?: () => Promise<void>;
	isFetchingUserInfo?: boolean;

	// Callbacks
	onResetFlow: () => void;
	onNavigateToTokenManagement?: () => void;
	onIntrospectToken?: (token: string) => Promise<{
		active?: boolean;
		scope?: string;
		client_id?: string;
		sub?: string;
		token_type?: string;
		aud?: string;
		iss?: string;
		exp?: number;
		iat?: number;
	} | null>;

	// UI state
	collapsedSections?: {
		completionOverview?: boolean;
		completionDetails?: boolean;
		introspectionDetails?: boolean;
		rawJson?: boolean;
		userInfo?: boolean;
	};
	onToggleSection?: (section: string) => void;

	// Custom completion message (optional)
	completionMessage?: string;

	// Custom next steps (optional)
	nextSteps?: string[];
}

const TokenIntrospect: React.FC<TokenIntrospectProps> = ({
	flowName,
	tokens,
	userInfo,
	onFetchUserInfo,
	isFetchingUserInfo,
	onIntrospectToken,
	collapsedSections = {
		completionOverview: false,
		completionDetails: false,
		introspectionDetails: false, // Default to expanded for introspection
		rawJson: true, // Default to collapsed for raw JSON
		userInfo: false, // Default to expanded for user info
	},
	onToggleSection,
	completionMessage,
	nextSteps = [
		'Inspect or decode tokens using the Token Management tools.',
		'Repeat the flow with different scopes or redirect URIs.',
		'Explore refresh tokens and introspection flows.',
	],
}) => {
	const [introspectionResults, setIntrospectionResults] = useState<{
		active?: boolean;
		scope?: string;
		client_id?: string;
		sub?: string;
		token_type?: string;
		aud?: string;
		iss?: string;
		exp?: number;
		iat?: number;
		[json: string]: unknown;
	} | null>(null);
	const [isIntrospecting, setIsIntrospecting] = useState(false);

	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard
			.writeText(text)
			.then(() =>
				modernMessaging.showFooterMessage({
					type: 'status',
					message: `${label} copied to clipboard!`,
					duration: 4000,
				})
			)
			.catch(() =>
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: `Failed to copy ${label}: Unable to copy to clipboard.`,
					dismissible: true,
				})
			);
	}, []);

	const handleIntrospectToken = useCallback(async () => {
		if (!tokens?.access_token || !onIntrospectToken) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message:
					'No access token available for introspection or introspection handler not provided.',
				dismissible: true,
			});
			return;
		}

		setIsIntrospecting(true);
		try {
			const results = await onIntrospectToken(tokens.access_token);
			setIntrospectionResults(results);
			modernMessaging.showFooterMessage({
				type: 'status',
				message: 'Token introspection completed successfully!',
				duration: 4000,
			});
		} catch (error) {
			log.error('TokenIntrospect', 'Token introspection error:', undefined, error as Error);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Token introspection failed. Please try again.',
				dismissible: true,
			});
		} finally {
			setIsIntrospecting(false);
		}
	}, [tokens?.access_token, onIntrospectToken]);

	const toggleSection = useCallback(
		(section: keyof typeof collapsedSections) => {
			if (onToggleSection) {
				onToggleSection(section);
			}
		},
		[onToggleSection]
	);

	const defaultCompletionMessage = `Nice work! You successfully completed the ${flowName} flow.`;

	return (
		<>
			<CollapsibleSection>
				<CollapsibleHeaderButton
					onClick={() => toggleSection('completionOverview')}
					aria-expanded={!collapsedSections.completionOverview}
				>
					<CollapsibleTitle>
						<span>✅</span> Flow Completion Overview
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.completionOverview ?? false}>
						<span>⬇️</span>
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.completionOverview && (
					<CollapsibleContent>
						<GeneratedContentBox>
							<GeneratedLabel>All Done</GeneratedLabel>
							<InfoText>{completionMessage || defaultCompletionMessage}</InfoText>
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
						<span>🛡️</span> Next Steps & Resources
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsedSections.completionDetails ?? false}>
						<span>⬇️</span>
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsedSections.completionDetails && (
					<CollapsibleContent>
						<CalloutCard style={{ marginTop: '1.5rem' }}>
							<InfoTitle>
								<span>🛡️</span> Next Steps
							</InfoTitle>
							<NextSteps steps={nextSteps} />
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
							<span>👁️</span> Token Introspection
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={collapsedSections.introspectionDetails ?? false}>
							<span>⬇️</span>
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!collapsedSections.introspectionDetails && (
						<CollapsibleContent>
							<ResultsSection>
								<ResultsHeading>
									<span>👁️</span> Access Token Introspection
								</ResultsHeading>
								<HelperText>
									Introspect your access token to see detailed information about its validity,
									scopes, and claims.
								</HelperText>

								<ActionRow style={{ justifyContent: 'center', marginBottom: '1rem' }}>
									<HighlightedActionButton
										onClick={handleIntrospectToken}
										$priority="primary"
										disabled={isIntrospecting || !onIntrospectToken}
									>
										<span>👁️</span>{' '}
										{isIntrospecting ? 'Introspecting...' : 'Introspect Access Token'}
									</HighlightedActionButton>
								</ActionRow>

								{introspectionResults && (
									<>
										<GeneratedContentBox>
											<GeneratedLabel>Introspection Results</GeneratedLabel>
											<ParameterGrid>
												<div style={{ gridColumn: '1 / -1' }}>
													<ParameterLabel>Token Status</ParameterLabel>
													<ParameterValue
														style={{
															color: introspectionResults.active ? '#059669' : '#dc2626',
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
														<ParameterValue>
															{String(introspectionResults.client_id)}
														</ParameterValue>
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
														<ParameterValue>
															{String(introspectionResults.token_type)}
														</ParameterValue>
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
													<span>📋</span> Copy Results
												</Button>
											</ActionRow>
										</GeneratedContentBox>

										{/* Raw JSON Section */}
										<CollapsibleSection>
											<CollapsibleHeaderButton
												onClick={() => toggleSection('rawJson')}
												aria-expanded={!collapsedSections.rawJson}
											>
												<CollapsibleTitle>
													<span>🔑</span> Raw JSON Response
												</CollapsibleTitle>
												<CollapsibleToggleIcon $collapsed={collapsedSections.rawJson ?? false}>
													<span>⬇️</span>
												</CollapsibleToggleIcon>
											</CollapsibleHeaderButton>
											{!collapsedSections.rawJson && (
												<CollapsibleContent>
													<InfoBox $variant="info">
														<span style={{ fontSize: '20px' }}>🔑</span>
														<div>
															<InfoTitle>Raw JSON Response</InfoTitle>
															<InfoText>
																This is the raw JSON response from the token introspection endpoint.
																Useful for debugging and understanding the complete response
																structure.
															</InfoText>
														</div>
													</InfoBox>
													<GeneratedContentBox>
														<GeneratedLabel>Raw JSON</GeneratedLabel>
														<RawJsonContainer>
															<pre
																style={{
																	margin: 0,
																	padding: '1rem',
																	background: '#f8fafc',
																	borderRadius: '0.5rem',
																	border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
																	fontSize: '0.875rem',
																	lineHeight: '1.5',
																	overflow: 'auto',
																	maxHeight: '400px',
																	color: '#1f2937',
																}}
															>
																{JSON.stringify(introspectionResults, null, 2)}
															</pre>
														</RawJsonContainer>
														<ActionRow>
															<Button
																onClick={() =>
																	handleCopy(
																		JSON.stringify(introspectionResults, null, 2),
																		'Raw JSON Response'
																	)
																}
																$variant="outline"
															>
																<span>📋</span> Copy Raw JSON
															</Button>
														</ActionRow>
													</GeneratedContentBox>
												</CollapsibleContent>
											)}
										</CollapsibleSection>
									</>
								)}
							</ResultsSection>
						</CollapsibleContent>
					)}
				</CollapsibleSection>
			)}

			{/* User Information Section - Only for OIDC flows */}
			{tokens?.access_token && onFetchUserInfo && (
				<CollapsibleSection>
					<CollapsibleHeaderButton
						onClick={() => toggleSection('userInfo')}
						aria-expanded={!collapsedSections.userInfo}
					>
						<CollapsibleTitle>
							<span>👤</span> User Information
						</CollapsibleTitle>
						<CollapsibleToggleIcon $collapsed={collapsedSections.userInfo ?? false}>
							<span>⬇️</span>
						</CollapsibleToggleIcon>
					</CollapsibleHeaderButton>
					{!collapsedSections.userInfo && (
						<CollapsibleContent>
							<ResultsSection>
								<ResultsHeading>
									<span>👤</span> User Information
								</ResultsHeading>
								<HelperText>
									Retrieve and display user information from the userinfo endpoint.
								</HelperText>

								<ActionRow>
									<HighlightedActionButton
										onClick={onFetchUserInfo}
										$priority="primary"
										disabled={!tokens?.access_token || isFetchingUserInfo}
										style={{
											background:
												'linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE 0%, V9_COLORS.PRIMARY.BLUE_DARK 100%)',
											color: 'white',
											border: 'none',
											padding: '1rem 2rem',
											borderRadius: '0.75rem',
											fontSize: '1rem',
											fontWeight: '600',
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											transition: 'all 0.2s ease',
											boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
										}}
									>
										<span>👤</span>{' '}
										{isFetchingUserInfo ? 'Fetching User Info...' : 'Fetch User Information'}
									</HighlightedActionButton>
								</ActionRow>

								{userInfo && (
									<GeneratedContentBox>
										<GeneratedLabel>User Information</GeneratedLabel>
										<UserInfoGrid>
											{Object.entries(userInfo).map(([key, value]) => (
												<UserInfoRow key={key}>
													<ParameterLabel
														style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}
													>
														{key}
													</ParameterLabel>
													<ParameterValue>
														{typeof value === 'object'
															? JSON.stringify(value, null, 2)
															: String(value)}
													</ParameterValue>
												</UserInfoRow>
											))}
										</UserInfoGrid>
										<ActionRow>
											<Button
												onClick={() =>
													handleCopy(JSON.stringify(userInfo, null, 2), 'User Information')
												}
												$variant="outline"
											>
												<span>📋</span> Copy User Info
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

export default TokenIntrospect;
