// src/pages/flows/OAuthAuthorizationCodeFlowV7_1/OAuthAuthorizationCodeFlowV7_1.tsx
// V7.1 Main Container - Orchestrates all refactored components

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useFlowStateManagement } from './hooks/useFlowStateManagement';
import { useAuthCodeManagement } from './hooks/useAuthCodeManagement';
import { useFlowVariantSwitching } from './hooks/useFlowVariantSwitching';
import { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring';
import { FlowErrorWrapper } from './components/FlowErrorWrapper';
import { FlowHeader } from './components/FlowHeader';
import { FlowNavigation } from './components/FlowNavigation';
import { FlowConfiguration } from './components/FlowConfiguration';
import { FlowSteps } from './components/FlowSteps';
import { FlowResults } from './components/FlowResults';
import { FLOW_CONSTANTS } from './constants/flowConstants';
import { UI_CONSTANTS } from './constants/uiConstants';
import type { FlowVariant, FlowCredentials, TokenResponse, UserInfo } from './types/flowTypes';
import type { PingOneApplicationState } from '../../components/PingOneApplicationConfig';

// Mock services - these would be imported from actual services in real implementation
const v4ToastManager = {
  showSuccess: (message: string) => console.log('✅ Toast:', message),
  showError: (message: string) => console.error('❌ Toast:', message),
  showInfo: (message: string) => console.log('ℹ️ Toast:', message),
};

const FlowCredentialService = {
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
  }
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

const MainContent = styled.div`
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
  }, [initialVariant, initialCredentials]);

  // Handle flow completion
  const handleFlowComplete = useCallback((tokens: TokenResponse, userInfo?: UserInfo) => {
    flowState.updateTokens(tokens);
    if (userInfo) {
      flowState.updateUserInfo(userInfo);
    }
    flowState.markStepCompleted(FLOW_CONSTANTS.TOTAL_STEPS - 1);
    onFlowComplete?.(tokens, userInfo);
    v4ToastManager.showSuccess('Flow completed successfully!');
  }, [flowState, onFlowComplete]);

  // Handle flow error
  const handleFlowError = useCallback((error: Error) => {
    performanceMonitoring.recordError(error);
    onFlowError?.(error);
    v4ToastManager.showError(`Flow error: ${error.message}`);
  }, [performanceMonitoring, onFlowError]);

  // Handle step navigation
  const handleStepChange = useCallback((step: number) => {
    if (flowState.canGoToStep(step)) {
      flowState.goToStep(step);
      v4ToastManager.showInfo(`Navigated to step ${step + 1}`);
    }
  }, [flowState]);

  // Handle flow reset
  const handleFlowReset = useCallback(() => {
    flowState.resetFlow();
    authCodeManagement.clearAuthCode();
    v4ToastManager.showInfo('Flow reset successfully');
  }, [flowState, authCodeManagement]);

  // Handle variant change
  const handleVariantChange = useCallback(async (variant: FlowVariant) => {
    try {
      await flowVariantSwitching.switchVariant(variant);
    } catch (error) {
      handleFlowError(error as Error);
    }
  }, [flowVariantSwitching, handleFlowError]);

  // Handle credentials change
  const handleCredentialsChange = useCallback((credentials: FlowCredentials) => {
    flowState.updateCredentials(credentials);
    
    // Auto-switch variant based on credentials
    flowVariantSwitching.autoSwitchVariant(credentials);
  }, [flowState, flowVariantSwitching]);

  // Handle app config change
  const handleAppConfigChange = useCallback((config: PingOneApplicationState) => {
    setAppConfig(config);
  }, []);

  // Handle section collapse
  const handleToggleSection = useCallback((section: string) => {
    flowState.toggleSection(section);
  }, [flowState]);

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
          {/* Flow Header */}
          <FlowHeader
            flowVariant={flowState.flowState.flowVariant}
            onVariantChange={handleVariantChange}
            currentStep={flowState.flowState.currentStep}
            totalSteps={FLOW_CONSTANTS.TOTAL_STEPS}
            isCollapsed={flowState.flowState.collapsedSections.header || false}
            onToggleCollapse={() => handleToggleSection('header')}
            flowName="OAuth Authorization Code Flow V7.1"
            showVariantSelector={true}
          />

          <MainContent>
            {/* Flow Navigation */}
            <FlowNavigation
              currentStep={flowState.flowState.currentStep}
              totalSteps={FLOW_CONSTANTS.TOTAL_STEPS}
              canGoBack={flowState.canGoBack()}
              canGoForward={flowState.canGoForward()}
              isComplete={flowState.isFlowComplete()}
              onStepChange={handleStepChange}
              onReset={handleFlowReset}
              onGoHome={handleGoHome}
              stepCompletion={flowState.stepCompletion}
              showStepButtons={true}
              showResetButton={true}
              showHomeButton={true}
            />

            {/* Flow Configuration */}
            <FlowConfiguration
              credentials={flowState.credentials}
              onCredentialsChange={handleCredentialsChange}
              flowVariant={flowState.flowState.flowVariant}
              onVariantChange={handleVariantChange}
              appConfig={appConfig}
              onAppConfigChange={handleAppConfigChange}
              isCollapsed={flowState.flowState.collapsedSections.configuration || false}
              onToggleCollapse={() => handleToggleSection('configuration')}
              showAdvancedSettings={false}
              onToggleAdvancedSettings={() => handleToggleSection('advancedSettings')}
            />

            {/* Flow Steps */}
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

            {/* Flow Results */}
            <FlowResults
              tokens={flowState.tokens}
              userInfo={flowState.userInfo}
              isCollapsed={flowState.flowState.collapsedSections.results || false}
              onToggleCollapse={() => handleToggleSection('results')}
              onRefreshTokens={handleRefreshTokens}
              onClearResults={handleClearResults}
              showTokenDetails={true}
              showUserInfo={true}
            />
          </MainContent>

          {/* Debug Information */}
          {showDebugInfo && (
            <Sidebar>
              <div style={{ 
                background: UI_CONSTANTS.COLORS.GRAY_100, 
                padding: UI_CONSTANTS.SPACING.LG, 
                borderRadius: UI_CONSTANTS.SECTION.BORDER_RADIUS,
                fontSize: UI_CONSTANTS.TYPOGRAPHY.FONT_SIZES.SM,
                fontFamily: 'monospace'
              }}>
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