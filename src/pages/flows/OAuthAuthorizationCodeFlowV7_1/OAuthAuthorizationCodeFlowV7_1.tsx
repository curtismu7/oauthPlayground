// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/OAuthAuthorizationCodeFlowV7_1.tsx
// V7.1 Main Container - Orchestrates all refactored components

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import type { PingOneApplicationState } from '../../../components/PingOneApplicationConfig';
import { RedirectUriEducationalModal } from '../../../components/RedirectUriEducationalModal';
import { RedirectUriEducationButton } from '../../../components/RedirectUriEducationButton';
import { StepNavigationButtons } from '../../../components/StepNavigationButtons';
import { useRedirectUriEducation } from '../../../hooks/useRedirectUriEducation';
import { logger } from '../../../utils/logger';
import { FlowConfiguration } from './components/FlowConfiguration';
import { FlowErrorWrapper } from './components/FlowErrorWrapper';
import { FlowResults } from './components/FlowResults';
import { FlowSteps } from './components/FlowSteps';
import { FLOW_CONSTANTS } from './constants/flowConstants';
import { UI_CONSTANTS } from './constants/uiConstants';
import { useAuthCodeManagement } from './hooks/useAuthCodeManagement';
import { useCredentialPersistence } from './hooks/useCredentialPersistence';
import { useFlowStateManagement } from './hooks/useFlowStateManagement';
import { useFlowVariantSwitching } from './hooks/useFlowVariantSwitching';
import { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring';
import type { FlowCredentials, FlowVariant, TokenResponse } from './types/flowTypes';

const Container = styled.div`
  max-width: ${UI_CONSTANTS.LAYOUT.CONTENT_MAX_WIDTH};
  margin: 0 auto;
  padding: ${UI_CONSTANTS.LAYOUT.CONTAINER_PADDING};
  background: ${UI_CONSTANTS.LAYOUT.CONTAINER_BACKGROUND};
  min-height: 100vh;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${UI_CONSTANTS.SPACING.LG};
`;

const _MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${UI_CONSTANTS.SPACING.LG};
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${UI_CONSTANTS.SPACING.LG};
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${UI_CONSTANTS.SPACING.XL};
  color: ${UI_CONSTANTS.COLORS.GRAY_500};
  font-size: ${UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.LG};
`;

// Original V7 styled components for compatibility
const MainCard = styled.div`
  background-color: V9_COLORS.TEXT.WHITE;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  overflow: hidden;
`;

const StepHeader = styled.div<{ $variant: FlowVariant }>`
  background: ${(props) =>
		props.$variant === 'oidc'
			? 'linear-gradient(135deg, V9_COLORS.PRIMARY.BLUE 0%, V9_COLORS.PRIMARY.BLUE_DARK 100%)'
			: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'};
  color: V9_COLORS.TEXT.WHITE;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StepHeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const VersionBadge = styled.span<{ $variant: FlowVariant }>`
  align-self: flex-start;
  background: ${(props) =>
		props.$variant === 'oidc' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(249, 115, 22, 0.2)'};
  border: 1px solid ${(props) => (props.$variant === 'oidc' ? '#60a5fa' : '#fb923c')};
  color: ${(props) => (props.$variant === 'oidc' ? '#dbeafe' : '#fed7aa')};
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
`;

const StepHeaderTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
`;

const StepHeaderSubtitle = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
`;

const StepHeaderRight = styled.div`
  text-align: right;
`;

const VariantSelector = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const VariantButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.5rem;
  background: ${(props) => (props.$active ? 'rgba(255, 255, 255, 0.2)' : 'transparent')};
  color: V9_COLORS.TEXT.WHITE;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const StepContentWrapper = styled.div`
  padding: 2rem;
`;

const CollapsibleSection = styled.div`
  margin-bottom: 1.5rem;
`;

const CollapsibleHeaderButton = styled.button<{ $collapsed: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: V9_COLORS.BG.GRAY_MEDIUM;
  }
`;

const CollapsibleTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: V9_COLORS.TEXT.GRAY_DARK;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: V9_COLORS.PRIMARY.BLUE;
  color: white;
  box-shadow: 0 6px 16px V9_COLORS.PRIMARY.BLUE33;
  transition: all 0.2s ease;
  transform: ${({ $collapsed }) => ($collapsed ? 'rotate(0deg)' : 'rotate(180deg)')};

  svg {
    width: 16px;
    height: 16px;
  }
`;

const CollapsibleContent = styled.div<{ $collapsed: boolean }>`
  max-height: ${(props) => (props.$collapsed ? '0' : '1000px')};
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding: ${(props) => (props.$collapsed ? '0' : '1rem')};
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
  background: V9_COLORS.TEXT.WHITE;
`;

interface OAuthAuthorizationCodeFlowV7_1Props {
	initialVariant?: 'oauth' | 'oidc';
	initialCredentials?: Partial<FlowCredentials>;
	_onFlowComplete?: (result: TokenResponse) => void;
	onFlowError?: (error: Error) => void;
	showDebugInfo?: boolean;
	_enablePerformanceMonitoring?: boolean;
}

export const OAuthAuthorizationCodeFlowV7_1: React.FC<OAuthAuthorizationCodeFlowV7_1Props> = ({
	initialVariant = FLOW_CONSTANTS.DEFAULT_FLOW_VARIANT,
	initialCredentials,
	_onFlowComplete,
	onFlowError,
	showDebugInfo = false,
	_enablePerformanceMonitoring = true,
}) => {
	// Performance monitoring
	const performanceMonitoring = usePerformanceMonitoring('OAuthAuthorizationCodeFlowV7_1');

	// State management
	const flowState = useFlowStateManagement();
	const authCodeManagement = useAuthCodeManagement();

	// Credential persistence for NewAuthContext integration
	const _credentialPersistence = useCredentialPersistence({
		credentials: flowState.credentials,
		onCredentialsChange: flowState.updateCredentials,
	});

	// Redirect URI educational integration
	const redirectUriEducation = useRedirectUriEducation({
		flowKey: FLOW_CONSTANTS.FLOW_KEY,
	});

	// Local state
	const [isLoading, setIsLoading] = useState(true);
	const [appConfig, setAppConfig] = useState<PingOneApplicationState>({
		grantTypeAuthorizationCode: true,
		clientAuthMethod: 'client_secret_basic' as const,
		allowRedirectUriPatterns: true,
		pkceEnforcement: 'REQUIRED' as const,
		responseTypeCode: true,
		responseTypeToken: false,
		responseTypeIdToken: true,
		initiateLoginUri: '',
		targetLinkUri: '',
		signoffUrls: [],
		requestParameterSignatureRequirement: 'DEFAULT' as const,
		enableJWKS: false,
		jwksMethod: 'JWKS_URL' as const,
		jwksUrl: '',
		jwks: '',
		requirePushedAuthorizationRequest: false,
		pushedAuthorizationRequestTimeout: 300,
		enableDPoP: false,
		dpopAlgorithm: 'ES256' as const,
		additionalRefreshTokenReplayProtection: false,
		includeX5tParameter: false,
		oidcSessionManagement: true,
		requestScopesForMultipleResources: false,
		terminateUserSessionByIdToken: false,
		corsAllowAnyOrigin: false,
		corsOrigins: [],
	});

	// Flow variant switching
	const flowVariantSwitching = useFlowVariantSwitching(
		flowState.credentials,
		flowState.updateCredentials,
		undefined // PKCE codes change handler would go here
	);

	// Initialize flow
	useEffect(() => {
		const initializeFlow = async () => {
			try {
				performanceMonitoring.startRender();

				// Load initial credentials
				if (initialCredentials) {
					flowState.updateCredentials(initialCredentials);
				}

				// Set initial variant
				if (initialVariant !== flowState.flowState.flowVariant) {
					await flowVariantSwitching.switchVariant(initialVariant);
				}

				// Detect auth code from URL
				const detectedCode = authCodeManagement.detectAuthCode();
				if (detectedCode) {
					flowState.updateAuthCode(detectedCode, 'url');
					flowState.markStepCompleted(1); // Mark auth code step as completed
				}

				setIsLoading(false);
				performanceMonitoring.endRender();

				modernMessaging.showFooterMessage({
					type: 'info',
					message: 'Flow initialized successfully',
					duration: 4000,
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				logger.error('Failed to initialize flow:', errorMessage, 'Flow initialization failed');
				onFlowError?.(error as Error);
				setIsLoading(false);
			}
		};

		initializeFlow();
	}, [
		initialVariant,
		initialCredentials,
		authCodeManagement,
		flowState,
		flowVariantSwitching,
		onFlowError,
		performanceMonitoring,
	]);

	// Handle flow error
	const handleFlowError = useCallback(
		(error: Error) => {
			performanceMonitoring.recordError(error);
			onFlowError?.(error);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: `Flow error: ${error.message}`,
				dismissible: true,
			});
		},
		[performanceMonitoring, onFlowError]
	);

	// Handle step navigation
	const handleStepChange = useCallback(
		(step: number) => {
			if (flowState.canGoToStep(step)) {
				flowState.goToStep(step);
				modernMessaging.showFooterMessage({
					type: 'info',
					message: `Navigated to step ${step + 1}`,
					duration: 4000,
				});
			}
		},
		[flowState]
	);

	// Handle flow reset
	const handleFlowReset = useCallback(() => {
		flowState.resetFlow();
		authCodeManagement.clearAuthCode();
		modernMessaging.showFooterMessage({
			type: 'info',
			message: 'Flow reset successfully',
			duration: 4000,
		});
	}, [flowState, authCodeManagement]);

	// Handle variant change
	const handleVariantChange = useCallback(
		async (variant: FlowVariant) => {
			try {
				await flowVariantSwitching.switchVariant(variant);
			} catch (error) {
				handleFlowError(error as Error);
			}
		},
		[flowVariantSwitching, handleFlowError]
	);

	// Handle credentials change
	const handleCredentialsChange = useCallback(
		(credentials: FlowCredentials) => {
			flowState.updateCredentials(credentials);

			// Auto-switch variant based on credentials
			flowVariantSwitching.autoSwitchVariant(credentials);
		},
		[flowState, flowVariantSwitching]
	);

	// Handle app config change
	const handleAppConfigChange = useCallback((config: PingOneApplicationState) => {
		setAppConfig(config);
	}, []);

	// Handle section collapse
	const handleToggleSection = useCallback(
		(section: string) => {
			flowState.toggleSection(section);
		},
		[flowState]
	);

	// Handle token refresh
	const handleRefreshTokens = useCallback(() => {
		// This would implement token refresh logic
		modernMessaging.showFooterMessage({
			type: 'info',
			message: 'Token refresh not implemented yet',
			duration: 4000,
		});
	}, []);

	// Handle clear results
	const handleClearResults = useCallback(() => {
		flowState.clearTokens();
		flowState.clearUserInfo();
		modernMessaging.showFooterMessage({ type: 'info', message: 'Results cleared', duration: 4000 });
	}, [flowState]);

	// Handle go home
	const _handleGoHome = useCallback(() => {
		window.location.href = '/';
	}, []);

	if (isLoading) {
		return (
			<Container>
				<LoadingSpinner>
					<div>🔄 Initializing OAuth Authorization Code Flow V7.1...</div>
				</LoadingSpinner>
			</Container>
		);
	}

	return (
		<FlowErrorWrapper flowName="OAuth Authorization Code Flow V7.1">
			<Container>
				<ContentWrapper>
					<MainCard>
						{/* Original V7 Header Structure */}
						<StepHeader $variant={flowState.flowState.flowVariant}>
							<StepHeaderLeft>
								<VersionBadge $variant={flowState.flowState.flowVariant}>V7.1</VersionBadge>
								<StepHeaderTitle>OAuth Authorization Code Flow V7.1</StepHeaderTitle>
								<StepHeaderSubtitle>
									Enhanced with modular architecture, error boundaries, and performance monitoring
								</StepHeaderSubtitle>
							</StepHeaderLeft>
							<StepHeaderRight>
								<VariantSelector>
									<VariantButton
										$active={flowState.flowState.flowVariant === 'oauth'}
										onClick={() => handleVariantChange('oauth')}
									>
										OAuth 2.0
									</VariantButton>
									<VariantButton
										$active={flowState.flowState.flowVariant === 'oidc'}
										onClick={() => handleVariantChange('oidc')}
									>
										OpenID Connect
									</VariantButton>
								</VariantSelector>
								<RedirectUriEducationButton
									flowKey={FLOW_CONSTANTS.FLOW_KEY}
									variant="outline"
									size="sm"
								>
									📚 URI Guide
								</RedirectUriEducationButton>
							</StepHeaderRight>
						</StepHeader>

						<StepContentWrapper>
							{/* Original V7 Step Navigation */}
							<StepNavigationButtons
								currentStep={flowState.flowState.currentStep}
								totalSteps={FLOW_CONSTANTS.TOTAL_STEPS}
								onPrevious={() => flowState.goToPreviousStep()}
								onNext={() => flowState.goToNextStep()}
								onReset={handleFlowReset}
								canNavigateNext={flowState.canGoForward()}
								isFirstStep={flowState.flowState.currentStep === 0}
							/>

							{/* Original V7 Collapsible Sections Structure */}
							<CollapsibleSection>
								<CollapsibleHeaderButton
									onClick={() => handleToggleSection('configuration')}
									$collapsed={flowState.flowState.collapsedSections.configuration || false}
								>
									<CollapsibleTitle>
										<span>⚙️</span>
										Configuration
									</CollapsibleTitle>
									<CollapsibleToggleIcon
										$collapsed={flowState.flowState.collapsedSections.configuration || false}
									>
										<span>⬇️</span>
									</CollapsibleToggleIcon>
								</CollapsibleHeaderButton>
								<CollapsibleContent
									$collapsed={flowState.flowState.collapsedSections.configuration || false}
								>
									<FlowConfiguration
										credentials={flowState.credentials}
										onCredentialsChange={handleCredentialsChange}
										flowVariant={flowState.flowState.flowVariant}
										onVariantChange={handleVariantChange}
										appConfig={appConfig}
										onAppConfigChange={handleAppConfigChange}
										isCollapsed={false}
										onToggleCollapse={() => handleToggleSection('configuration')}
										showAdvancedSettings={false}
										onToggleAdvancedSettings={() => handleToggleSection('advancedSettings')}
									/>
								</CollapsibleContent>
							</CollapsibleSection>

							<CollapsibleSection>
								<CollapsibleHeaderButton
									onClick={() => handleToggleSection('steps')}
									$collapsed={flowState.flowState.collapsedSections.steps || false}
								>
									<CollapsibleTitle>
										<span>📖</span>
										Flow Steps
									</CollapsibleTitle>
									<CollapsibleToggleIcon
										$collapsed={flowState.flowState.collapsedSections.steps || false}
									>
										<span>⬇️</span>
									</CollapsibleToggleIcon>
								</CollapsibleHeaderButton>
								<CollapsibleContent
									$collapsed={flowState.flowState.collapsedSections.steps || false}
								>
									<FlowSteps
										currentStep={flowState.flowState.currentStep}
										totalSteps={FLOW_CONSTANTS.TOTAL_STEPS}
										stepCompletion={flowState.stepCompletion}
										flowVariant={flowState.flowState.flowVariant}
										onStepClick={handleStepChange}
										showStepDetails={true}
										showProgress={true}
										isInteractive={true}
									/>
								</CollapsibleContent>
							</CollapsibleSection>

							<CollapsibleSection>
								<CollapsibleHeaderButton
									onClick={() => handleToggleSection('results')}
									$collapsed={flowState.flowState.collapsedSections.results || false}
								>
									<CollapsibleTitle>
										<span>✅</span>
										Results
									</CollapsibleTitle>
									<CollapsibleToggleIcon
										$collapsed={flowState.flowState.collapsedSections.results || false}
									>
										<span>⬇️</span>
									</CollapsibleToggleIcon>
								</CollapsibleHeaderButton>
								<CollapsibleContent
									$collapsed={flowState.flowState.collapsedSections.results || false}
								>
									<FlowResults
										tokens={flowState.tokens}
										userInfo={flowState.userInfo}
										isCollapsed={false}
										onToggleCollapse={() => handleToggleSection('results')}
										onRefreshTokens={handleRefreshTokens}
										onClearResults={handleClearResults}
										showTokenDetails={true}
										showUserInfo={true}
									/>
								</CollapsibleContent>
							</CollapsibleSection>
						</StepContentWrapper>
					</MainCard>

					{/* Debug Information */}
					{showDebugInfo && (
						<Sidebar>
							<div
								style={{
									background: UI_CONSTANTS.COLORS.GRAY_100,
									padding: UI_CONSTANTS.SPACING.LG,
									borderRadius: UI_CONSTANTS.SECTION.BORDER_RADIUS,
									fontSize: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM,
									fontFamily: 'monospace',
								}}
							>
								<h4>Debug Information</h4>
								<div>Current Step: {flowState.flowState.currentStep}</div>
								<div>Flow Variant: {flowState.flowState.flowVariant}</div>
								<div>Auth Code: {authCodeManagement.authCode ? 'Present' : 'Not present'}</div>
								<div>Tokens: {flowState.tokens ? 'Present' : 'Not present'}</div>
								<div>User Info: {flowState.userInfo ? 'Present' : 'Not present'}</div>
								<div>Completed Steps: {flowState.getCompletedSteps().length}</div>
								<div>Progress: {flowState.getCompletionProgress().percentage}%</div>
							</div>
						</Sidebar>
					)}
				</ContentWrapper>
			</Container>

			{/* Redirect URI Educational Modal */}
			<RedirectUriEducationalModal
				flowKey={FLOW_CONSTANTS.FLOW_KEY}
				isOpen={redirectUriEducation.showEducationalModal}
				onClose={redirectUriEducation.closeEducationalModal}
			/>
		</FlowErrorWrapper>
	);
};

export default OAuthAuthorizationCodeFlowV7_1;
