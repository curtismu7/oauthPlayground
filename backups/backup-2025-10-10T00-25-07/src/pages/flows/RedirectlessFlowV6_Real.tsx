import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiCheckCircle,
	FiCopy,
	FiDownload,
	FiExternalLink,
	FiEye,
	FiEyeOff,
	FiRefreshCw,
	FiUpload,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import TokenIntrospect from '../../components/TokenIntrospect';
import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowController';
import { usePageScroll } from '../../hooks/usePageScroll';
import { AuthorizationCodeSharedService } from '../../services/authorizationCodeSharedService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import EducationalContentService from '../../services/educationalContentService';
import { FlowCompletionConfigs, FlowCompletionService } from '../../services/flowCompletionService';
import { FlowHeader } from '../../services/flowHeaderService';
import { getFlowSequence } from '../../services/flowSequenceService';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { v4ToastManager } from '../../utils/v4ToastMessages';
// Import config
import {
	DEFAULT_APP_CONFIG,
	IntroSectionKey,
	PIFLOW_EDUCATION,
	STEP_METADATA,
} from './config/RedirectlessFlow.config';

// Styled components
const VersionBadge = styled.span`
	background: linear-gradient(135deg, #10b981, #059669);
	color: white;
	padding: 0.25rem 0.75rem;
	border-radius: 0.5rem;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' }>`
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1rem 0;
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	background: ${(props) => {
		switch (props.$variant) {
			case 'warning':
				return '#fef3c7';
			case 'success':
				return '#d1fae5';
			default:
				return '#eff6ff';
		}
	}};
	border: 1px solid ${(props) => {
		switch (props.$variant) {
			case 'warning':
				return '#fbbf24';
			case 'success':
				return '#10b981';
			default:
				return '#3b82f6';
		}
	}};
	color: ${(props) => {
		switch (props.$variant) {
			case 'warning':
				return '#92400e';
			case 'success':
				return '#065f46';
			default:
				return '#1e40af';
		}
	}};
`;

const Button = styled.button<{
	$priority?: 'primary' | 'secondary' | 'success';
	$disabled?: boolean;
}>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 600;
	font-size: 0.875rem;
	border: none;
	cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
	opacity: ${(props) => (props.$disabled ? 0.5 : 1)};
	transition: all 0.2s;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	
	${(props) => {
		switch (props.$priority) {
			case 'primary':
				return `
					background: #3b82f6;
					color: white;
					&:hover:not(:disabled) {
						background: #2563eb;
					}
				`;
			case 'success':
				return `
					background: #10b981;
					color: white;
					&:hover:not(:disabled) {
						background: #059669;
					}
				`;
			default:
				return `
					background: #f3f4f6;
					color: #374151;
					&:hover:not(:disabled) {
						background: #e5e7eb;
					}
				`;
		}
	}}
`;

const HighlightedActionButton = styled(Button)<{ $priority: 'primary' | 'success' }>`
	position: relative;
	overflow: hidden;
	
	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}
	
	&:hover:not(:disabled)::before {
		left: 100%;
	}
`;

const HighlightBadge = styled.span`
	background: #f59e0b;
	color: white;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	margin-left: 0.5rem;
`;

const TokenDisplay = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 0.5rem 0;
	position: relative;
`;

const CollapsibleContent = styled.div<{ $collapsed?: boolean }>`
	max-height: ${(props) => (props.$collapsed ? '0' : 'none')};
	overflow: ${(props) => (props.$collapsed ? 'hidden' : 'visible')};
	transition: max-height 0.3s ease;
`;

const CollapsibleSection = styled.section`
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	background: white;
	margin-bottom: 1.5rem;
	overflow: hidden;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const CollapsibleHeader = styled.div<{ $collapsed?: boolean }>`
	background: linear-gradient(135deg, #3b82f6, #1d4ed8);
	color: white;
	padding: 1rem 1.5rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-weight: 600;
	font-size: 1rem;
	transition: all 0.2s ease;
	
	&:hover {
		background: linear-gradient(135deg, #2563eb, #1e40af);
	}
	
	& > div:first-child {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
`;

const CollapsibleArrow = styled.div<{ $collapsed?: boolean }>`
	transform: ${(props) => (props.$collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
	transition: transform 0.2s ease;
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
	color: #065f46;
	transition: all 0.2s ease;
	
	&:hover {
		background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed?: boolean }>`
	display: inline-flex;
	width: 32px;
	height: 32px;
	align-items: center;
	justify-content: center;
	background: #10b981;
	color: white;
	border-radius: 50%;
	font-size: 1.2rem;
	transition: transform 0.2s ease;
	
	transform: ${(props) => (props.$collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
`;

/**
 * Redirectless Flow V6 Real - PingOne API-driven authentication without browser redirects
 * Uses response_mode=pi.flow for server-to-server token exchange
 */
const RedirectlessFlowV6Real: React.FC = () => {
	const navigate = useNavigate();

	// Initialize controller with redirectless-specific configuration
	const controller = useAuthorizationCodeFlowController({
		flowKey: 'redirectless-v6-real',
		defaultFlowVariant: 'oidc',
		redirectUri: 'https://localhost:3000/redirectless-callback',
		scope: 'openid profile email',
		responseType: 'code',
		defaultAppConfig: DEFAULT_APP_CONFIG,
		logPrefix: '[🔐 REDIRECTLESS-V6-REAL]',
	});

	// Page scroll management
	usePageScroll({ pageName: 'Redirectless Flow V6 Real', force: true });

	// Local state management (V6 pattern)
	const [currentStep, setCurrentStep] = useState(
		AuthorizationCodeSharedService.StepRestoration.getInitialStep()
	);
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(
		AuthorizationCodeSharedService.CollapsibleSections.getDefaultState()
	);
	const [completionCollapsed, setCompletionCollapsed] = useState(false);

	// Scroll to top on step change
	useEffect(() => {
		AuthorizationCodeSharedService.StepRestoration.scrollToTopOnStepChange();
	}, [currentStep]);

	// Toggle section handler
	const toggleSection = useCallback(
		AuthorizationCodeSharedService.CollapsibleSections.createToggleHandler(setCollapsedSections),
		[]
	);

	// Custom navigation handler with validation (V6 pattern)
	const handleStepChange = useCallback(
		(newStep: number) => {
			console.log('🔍 [Redirectless V6] handleStepChange called:', {
				currentStep,
				newStep,
				credentials: controller.credentials,
			});

			// Use service navigation manager for proper validation
			AuthorizationCodeSharedService.Navigation.handleNext(
				currentStep,
				controller.credentials,
				'oauth', // Redirectless is based on OAuth
				controller,
				(step: number) => {
					// Enhanced step validation - checks both controller state and session storage
					const hasPkceCodes =
						!!(controller.pkceCodes.codeVerifier && controller.pkceCodes.codeChallenge) ||
						!!sessionStorage.getItem(`${controller.persistKey}-pkce-codes`);

					switch (step) {
						case 0:
							return true; // Introduction step
						case 1:
							return hasPkceCodes;
						case 2:
							return !!(controller.authUrl && hasPkceCodes);
						case 3:
							return !!(controller.authCode || controller.authCode);
						default:
							return true;
					}
				},
				() => {
					console.log('✅ [Redirectless V6] Navigation allowed, moving to step:', newStep);
					setCurrentStep(newStep);
				}
			);
		},
		[currentStep, controller]
	);

	// PKCE generation handler
	const handleGeneratePkce = useCallback(() => {
		AuthorizationCodeSharedService.PKCE.generatePKCE('oidc', controller.credentials, controller);
	}, [controller]);

	// Authorization URL generation handler
	const handleGenerateAuthUrl = useCallback(() => {
		AuthorizationCodeSharedService.Authorization.generateAuthUrl(
			'oidc',
			controller.credentials,
			controller
		);
	}, [controller]);

	// Open authorization URL handler
	const handleOpenAuthUrl = useCallback(() => {
		if (controller.authUrl) {
			AuthorizationCodeSharedService.Authorization.openAuthUrl(controller.authUrl);
		}
	}, [controller.authUrl]);

	// Navigate to token management
	const navigateToTokenManagement = useCallback(() => {
		AuthorizationCodeSharedService.TokenManagement.navigateToTokenManagement();

		// Store tokens in localStorage for token management page
		if (controller.tokens.accessToken) {
			localStorage.setItem('redirectless-access-token', controller.tokens.accessToken);
		}
		if (controller.tokens.idToken) {
			localStorage.setItem('redirectless-id-token', controller.tokens.idToken);
		}
		if (controller.tokens.refreshToken) {
			localStorage.setItem('redirectless-refresh-token', controller.tokens.refreshToken);
		}

		navigate('/token-management');
	}, [controller.tokens, navigate]);

	// Response type enforcement
	useEffect(() => {
		if (!controller.credentials) {
			return;
		}

		AuthorizationCodeSharedService.ResponseTypeEnforcer.enforceResponseType(
			'oidc',
			controller.credentials,
			controller.setCredentials
		);
	}, [controller.credentials, controller.setCredentials]);

	// Credentials sync
	useEffect(() => {
		if (!controller.credentials) {
			return;
		}

		AuthorizationCodeSharedService.CredentialsSync.syncCredentials(
			'oidc',
			controller.credentials,
			controller.setCredentials
		);
	}, [controller.credentials, controller.setCredentials]);

	// Render step content (V6 pattern)
	const renderStepContent = useCallback(() => {
		switch (currentStep) {
			case 0:
				return (
					<>
						<ComprehensiveCredentialsService
							flowKey="redirectless-v6-real"
							credentials={controller.credentials}
							onCredentialsChange={controller.setCredentials}
							onDiscoveryComplete={controller.handleDiscoveryComplete}
							discoveryResult={controller.discoveryResult}
							isDiscoveryLoading={controller.isDiscoveryLoading}
						/>

						{/* Redirectless Educational Content */}
						<EducationalContentService flowType="redirectless" defaultCollapsed={false} />

						<FlowConfigurationRequirements
							requiredFields={['environmentId', 'clientId', 'redirectUri']}
							credentials={controller.credentials}
						/>
					</>
				);

			case 1:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('pkce')}
								aria-expanded={!collapsedSections.pkce}
							>
								<CollapsibleTitle>
									<CollapsibleToggleIcon $collapsed={collapsedSections.pkce}>
										🔐
									</CollapsibleToggleIcon>
									PKCE Parameters
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.pkce}>▼</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.pkce && (
								<CollapsibleContent>
									<div style={{ marginBottom: '1rem' }}>
										<p>
											<strong>Proof Key for Code Exchange (PKCE)</strong> adds an extra layer of
											security to the authorization code flow, even for public clients.
										</p>
									</div>

									<HighlightedActionButton
										onClick={handleGeneratePkce}
										$priority="primary"
										disabled={!!controller.pkceCodes.codeVerifier}
										title={
											controller.pkceCodes.codeVerifier
												? 'PKCE parameters already generated'
												: 'Generate PKCE parameters'
										}
									>
										{controller.pkceCodes.codeVerifier ? <FiCheckCircle /> : <FiRefreshCw />}{' '}
										{controller.pkceCodes.codeVerifier
											? 'PKCE Parameters Generated'
											: 'Generate PKCE Parameters'}
										<HighlightBadge>1</HighlightBadge>
									</HighlightedActionButton>

									{controller.pkceCodes.codeVerifier && (
										<div style={{ marginTop: '1rem' }}>
											<TokenDisplay
												title="Code Verifier"
												token={controller.pkceCodes.codeVerifier}
												isVisible={controller.showTokens.pkceVerifier}
												onToggleVisibility={() => controller.toggleTokenVisibility('pkceVerifier')}
												onCopy={() => {
													navigator.clipboard.writeText(controller.pkceCodes.codeVerifier);
													v4ToastManager.showSuccess('Code verifier copied to clipboard');
												}}
											/>
											<TokenDisplay
												title="Code Challenge"
												token={controller.pkceCodes.codeChallenge}
												isVisible={controller.showTokens.pkceChallenge}
												onToggleVisibility={() => controller.toggleTokenVisibility('pkceChallenge')}
												onCopy={() => {
													navigator.clipboard.writeText(controller.pkceCodes.codeChallenge);
													v4ToastManager.showSuccess('Code challenge copied to clipboard');
												}}
											/>
										</div>
									)}
								</CollapsibleContent>
							)}
						</CollapsibleSection>

						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('authUrl')}
								aria-expanded={!collapsedSections.authUrl}
							>
								<CollapsibleTitle>
									<CollapsibleToggleIcon $collapsed={collapsedSections.authUrl}>
										🔗
									</CollapsibleToggleIcon>
									Authorization URL Generation
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.authUrl}>
									▼
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.authUrl && (
								<CollapsibleContent>
									<div style={{ marginBottom: '1rem' }}>
										<p>
											Generate the authorization URL that will be used to authenticate the user. For
											Redirectless flow, this URL includes the special{' '}
											<code>response_mode=pi.flow</code> parameter.
										</p>
									</div>

									<HighlightedActionButton
										onClick={handleGenerateAuthUrl}
										$priority="primary"
										disabled={
											!!controller.authUrl ||
											(!controller.pkceCodes.codeVerifier &&
												!sessionStorage.getItem(`${controller.persistKey}-pkce-codes`))
										}
										title={
											!controller.pkceCodes.codeVerifier &&
											!sessionStorage.getItem(`${controller.persistKey}-pkce-codes`)
												? 'Generate PKCE parameters first'
												: controller.authUrl
													? 'Authorization URL already generated'
													: 'Generate authorization URL'
										}
									>
										{controller.authUrl ? <FiCheckCircle /> : <FiExternalLink />}{' '}
										{controller.authUrl
											? 'Authorization URL Generated'
											: !controller.pkceCodes.codeVerifier &&
													!sessionStorage.getItem(`${controller.persistKey}-pkce-codes`)
												? 'Complete above action'
												: 'Generate Authorization URL'}
										<HighlightBadge>1</HighlightBadge>
									</HighlightedActionButton>

									{controller.authUrl && (
										<div style={{ marginTop: '1rem' }}>
											<TokenDisplay
												title="Authorization URL"
												token={controller.authUrl}
												isVisible={controller.showTokens.authUrl}
												onToggleVisibility={() => controller.toggleTokenVisibility('authUrl')}
												onCopy={() => {
													navigator.clipboard.writeText(controller.authUrl);
													v4ToastManager.showSuccess('Authorization URL copied to clipboard');
												}}
											/>

											<div style={{ marginTop: '1rem' }}>
												<HighlightedActionButton
													onClick={handleOpenAuthUrl}
													$priority="secondary"
													title="Open authorization URL in new tab"
												>
													<FiExternalLink /> Open Authorization URL
												</HighlightedActionButton>
											</div>
										</div>
									)}
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 2:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('tokenExchange')}
								aria-expanded={!collapsedSections.tokenExchange}
							>
								<CollapsibleTitle>
									<CollapsibleToggleIcon $collapsed={collapsedSections.tokenExchange}>
										🔄
									</CollapsibleToggleIcon>
									Token Exchange
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.tokenExchange}>
									▼
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.tokenExchange && (
								<CollapsibleContent>
									<div style={{ marginBottom: '1rem' }}>
										<p>
											For Redirectless flow, tokens are returned directly in the API response
											without requiring a separate token exchange call.
										</p>
									</div>

									{controller.tokens.accessToken ? (
										<div>
											<TokenDisplay
												title="Access Token"
												token={controller.tokens.accessToken}
												isVisible={controller.showTokens.accessToken}
												onToggleVisibility={() => controller.toggleTokenVisibility('accessToken')}
												onCopy={() => {
													navigator.clipboard.writeText(controller.tokens.accessToken);
													v4ToastManager.showSuccess('Access token copied to clipboard');
												}}
											/>

											{controller.tokens.idToken && (
												<TokenDisplay
													title="ID Token"
													token={controller.tokens.idToken}
													isVisible={controller.showTokens.idToken}
													onToggleVisibility={() => controller.toggleTokenVisibility('idToken')}
													onCopy={() => {
														navigator.clipboard.writeText(controller.tokens.idToken);
														v4ToastManager.showSuccess('ID token copied to clipboard');
													}}
												/>
											)}

											{controller.tokens.refreshToken && (
												<TokenDisplay
													title="Refresh Token"
													token={controller.tokens.refreshToken}
													isVisible={controller.showTokens.refreshToken}
													onToggleVisibility={() =>
														controller.toggleTokenVisibility('refreshToken')
													}
													onCopy={() => {
														navigator.clipboard.writeText(controller.tokens.refreshToken);
														v4ToastManager.showSuccess('Refresh token copied to clipboard');
													}}
												/>
											)}

											{UnifiedTokenDisplayService.showTokens(
												controller.tokens.accessToken
													? {
															access_token: controller.tokens.accessToken,
															id_token: controller.tokens.idToken,
															refresh_token: controller.tokens.refreshToken,
														}
													: null,
												'redirectless',
												'redirectless-v6',
												{
													showCopyButtons: true,
													showDecodeButtons: true,
												}
											)}
										</div>
									) : (
										<div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
											<p>Complete the authorization step to receive tokens</p>
										</div>
									)}
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			case 3:
				return (
					<>
						<CollapsibleSection>
							<CollapsibleHeaderButton
								onClick={() => toggleSection('tokenManagement')}
								aria-expanded={!collapsedSections.tokenManagement}
							>
								<CollapsibleTitle>
									<CollapsibleToggleIcon $collapsed={collapsedSections.tokenManagement}>
										🛠️
									</CollapsibleToggleIcon>
									Token Management
								</CollapsibleTitle>
								<CollapsibleToggleIcon $collapsed={collapsedSections.tokenManagement}>
									▼
								</CollapsibleToggleIcon>
							</CollapsibleHeaderButton>
							{!collapsedSections.tokenManagement && (
								<CollapsibleContent>
									<div style={{ marginBottom: '1rem' }}>
										<p>Manage your tokens, including introspection, refresh, and validation.</p>
									</div>

									<HighlightedActionButton
										onClick={navigateToTokenManagement}
										$priority="primary"
										disabled={!controller.tokens.accessToken}
										title={
											!controller.tokens.accessToken
												? 'No tokens available'
												: 'Open token management'
										}
									>
										<FiEye /> Token Management
										<HighlightBadge>1</HighlightBadge>
									</HighlightedActionButton>

									{controller.tokens.accessToken && (
										<TokenIntrospect
											token={controller.tokens.accessToken}
											tokenType="access_token"
											onIntrospect={(result) => {
												console.log('Token introspection result:', result);
											}}
										/>
									)}
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</>
				);

			default:
				return <div>Step {currentStep}</div>;
		}
	}, [
		currentStep,
		controller,
		collapsedSections,
		toggleSection,
		handleGeneratePkce,
		handleGenerateAuthUrl,
		handleOpenAuthUrl,
		navigateToTokenManagement,
		completionCollapsed,
	]);

	return (
		<div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
			<FlowHeader
				flowId="redirectless-v6-real"
				title="Redirectless Flow V6 Real"
				subtitle="PingOne API-driven authentication without browser redirects"
				version="V6"
			/>

			<VersionBadge version="V6" $variant="success" />

			<StepNavigationButtons
				steps={STEP_METADATA}
				currentStep={currentStep}
				onStepChange={handleStepChange}
				flowKey="redirectless-v6-real"
			/>

			<div style={{ marginTop: '2rem' }}>{renderStepContent()}</div>
		</div>
	);
};

export default RedirectlessFlowV6Real;
