// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/OAuthAuthorizationCodeFlowV7_1.tsx
// V7.1 Main Container - Orchestrates all refactored components

import React, { useCallback, useEffect, useState } from 'react';
import { FiBook, FiCheckCircle, FiChevronDown, FiSettings } from '@icons';
import styled from 'styled-components';
import type { PingOneApplicationState } from '../../../components/PingOneApplicationConfig';
import { StepNavigationButtons } from '../../../components/StepNavigationButtons';
import { FlowConfiguration } from './components/FlowConfiguration';
import { FlowErrorWrapper } from './components/FlowErrorWrapper';
import { FlowResults } from './components/FlowResults';
import { FlowSteps } from './components/FlowSteps';
import { FLOW_CONSTANTS } from './constants/flowConstants';
import { UI_CONSTANTS } from './constants/uiConstants';
import { useAuthCodeManagement } from './hooks/useAuthCodeManagement';
import { useFlowStateManagement } from './hooks/useFlowStateManagement';
import { useFlowVariantSwitching } from './hooks/useFlowVariantSwitching';
import { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring';
import type { FlowCredentials, FlowVariant, TokenResponse, UserInfo } from './types/flowTypes';

// Mock services - these would be imported from actual services in real implementation
const v4ToastManager = {
	showSuccess: (message: string) => console.log('✅ Toast:', message),
	showError: (message: string) => console.error('❌ Toast:', message),
	showInfo: (message: string) => console.log('ℹ️ Toast:', message),
};

const _FlowCredentialService = {
	loadSharedCredentials: async (key: string): Promise<Partial<FlowCredentials> | null> => {
		try {
			const stored = sessionStorage.getItem(key);
			return stored ? JSON.parse(stored) : null;
		} catch {
			return null;
		}
	},
	saveSharedCredentials: async (key: string, credentials: FlowCredentials): Promise<void> => {
		try {
			sessionStorage.setItem(key, JSON.stringify(credentials));
		} catch (error) {
			console.warn('Failed to save credentials:', error);
		}
	},
};

const Container = styled.div`
  max-width: ${UI_CONSTANTS.LAYOUT.CONTAINER_MAX_WIDTH};
  margin: 0 auto;
  padding: ${UI_CONSTANTS.LAYOUT.CONTAINER_PADDING};
  background: ${UI_CONSTANTS.LAYOUT.MAIN_BACKGROUND};
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
  background-color: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const StepHeader = styled.div<{ $variant: FlowVariant }>`
  background: ${(props) =>
		props.$variant === 'oidc'
			? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
			: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'};
  color: #ffffff;
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
  color: #ffffff;
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
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f1f5f9;
  }
`;

const CollapsibleTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #374151;
`;

const CollapsibleToggleIcon = styled.span<{ $collapsed: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  box-shadow: 0 6px 16px #3b82f633;
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
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
  background: #ffffff;
`;

interface OAuthAuthorizationCodeFlowV7_1Props {
	initialVariant?: FlowVariant;
	initialCredentials?: Partial<FlowCredentials>;
	onFlowComplete?: (tokens: TokenResponse, userInfo?: UserInfo) => void;
	onFlowError?: (error: Error) => void;
	showDebugInfo?: boolean;
	enablePerformanceMonitoring?: boolean;
}

export const OAuthAuthorizationCodeFlowV7_1: React.FC<OAuthAuthorizationCodeFlowV7_1Props> = ({
	initialVariant = FLOW_CONSTANTS.DEFAULT_FLOW_VARIANT,
	initialCredentials,
	onFlowComplete,
	onFlowError,
	showDebugInfo = false,
	enablePerformanceMonitoring = true,
}) => {
	// Performance monitoring
	const performanceMonitoring = usePerformanceMonitoring('OAuthAuthorizationCodeFlowV7_1');

	// State management
	const flowState = useFlowStateManagement();
	const authCodeManagement = useAuthCodeManagement();

	// Local state
	const [isLoading, setIsLoading] = useState(true);
	const [appConfig, setAppConfig] = useState<PingOneApplicationState>({
		grantTypes: ['authorization_code'],
		tokenAuthMethod: 'client_secret_basic',
		scopes: ['openid', 'profile'],
		redirectUris: [FLOW_CONSTANTS.DEFAULT_REDIRECT_URI],
		pkceEnforcement: 'REQUIRED',
		parStatus: 'REQUIRED',
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

				v4ToastManager.showInfo('Flow initialized successfully');
			} catch (error) {
				console.error('Failed to initialize flow:', error);
				onFlowError?.(error as Error);
				setIsLoading(false);
			}
		};

		initializeFlow();
	}, [
		initialVariant,
		initialCredentials,
		authCodeManagement.detectAuthCode,
		flowState.flowState.flowVariant,
		flowState.markStepCompleted,
		flowState.updateAuthCode,
		flowState.updateCredentials,
		flowVariantSwitching.switchVariant,
		onFlowError,
		performanceMonitoring.endRender,
		performanceMonitoring.startRender,
	]);

	// Handle flow completion
	const _handleFlowComplete = useCallback(
		(tokens: TokenResponse, userInfo?: UserInfo) => {
			flowState.updateTokens(tokens);
			if (userInfo) {
				flowState.updateUserInfo(userInfo);
			}
			flowState.markStepCompleted(FLOW_CONSTANTS.TOTAL_STEPS - 1);
			onFlowComplete?.(tokens, userInfo);
			v4ToastManager.showSuccess('Flow completed successfully!');
		},
		[flowState, onFlowComplete]
	);

	// Handle flow error
	const handleFlowError = useCallback(
		(error: Error) => {
			performanceMonitoring.recordError(error);
			onFlowError?.(error);
			v4ToastManager.showError(`Flow error: ${error.message}`);
		},
		[performanceMonitoring, onFlowError]
	);

	// Handle step navigation
	const handleStepChange = useCallback(
		(step: number) => {
			if (flowState.canGoToStep(step)) {
				flowState.goToStep(step);
				v4ToastManager.showInfo(`Navigated to step ${step + 1}`);
			}
		},
		[flowState]
	);

	// Handle flow reset
	const handleFlowReset = useCallback(() => {
		flowState.resetFlow();
		authCodeManagement.clearAuthCode();
		v4ToastManager.showInfo('Flow reset successfully');
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
		v4ToastManager.showInfo('Token refresh not implemented yet');
	}, []);

	// Handle clear results
	const handleClearResults = useCallback(() => {
		flowState.clearTokens();
		flowState.clearUserInfo();
		v4ToastManager.showInfo('Results cleared');
	}, [flowState]);

	// Handle go home
	const handleGoHome = useCallback(() => {
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
		<FlowErrorWrapper flowKey={FLOW_CONSTANTS.FLOW_KEY}>
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
							</StepHeaderRight>
						</StepHeader>

						<StepContentWrapper>
							{/* Original V7 Step Navigation */}
							<StepNavigationButtons
								currentStep={flowState.flowState.currentStep}
								totalSteps={FLOW_CONSTANTS.TOTAL_STEPS}
								onStepChange={handleStepChange}
								onReset={handleFlowReset}
								onGoHome={handleGoHome}
								stepCompletion={flowState.stepCompletion}
								canGoBack={flowState.canGoBack()}
								canGoForward={flowState.canGoForward()}
								isComplete={flowState.isFlowComplete()}
							/>

							{/* Original V7 Collapsible Sections Structure */}
							<CollapsibleSection>
								<CollapsibleHeaderButton
									onClick={() => handleToggleSection('configuration')}
									$collapsed={flowState.flowState.collapsedSections.configuration || false}
								>
									<CollapsibleTitle>
										<FiSettings />
										Configuration
									</CollapsibleTitle>
									<CollapsibleToggleIcon
										$collapsed={flowState.flowState.collapsedSections.configuration || false}
									>
										<FiChevronDown />
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
										<FiBook />
										Flow Steps
									</CollapsibleTitle>
									<CollapsibleToggleIcon
										$collapsed={flowState.flowState.collapsedSections.steps || false}
									>
										<FiChevronDown />
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
										<FiCheckCircle />
										Results
									</CollapsibleTitle>
									<CollapsibleToggleIcon
										$collapsed={flowState.flowState.collapsedSections.results || false}
									>
										<FiChevronDown />
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
		</FlowErrorWrapper>
	);
};

export default OAuthAuthorizationCodeFlowV7_1;
