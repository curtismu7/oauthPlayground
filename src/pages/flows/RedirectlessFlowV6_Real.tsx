import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiExternalLink, FiCheckCircle, FiRefreshCw, FiEye } from 'react-icons/fi';

import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowController';
import { usePageScroll } from '../../hooks/usePageScroll';
import { AuthorizationCodeSharedService } from '../../services/authorizationCodeSharedService';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { FlowHeader } from '../../services/flowHeaderService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import EducationalContentService from '../../services/educationalContentService';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import styled from 'styled-components';

// Import config
import { STEP_METADATA } from './config/RedirectlessFlow.config';

// Styled components
const Button = styled.button<{
	$priority?: 'primary' | 'secondary' | 'success';
	$disabled?: boolean;
}>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-weight: 600;
	font-size: 0.875rem;
	border: none;
	cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
	opacity: ${props => props.$disabled ? 0.5 : 1};
	transition: all 0.2s;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	
	${props => {
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

// [REMOVED] Unused styled components - migrated to services

/**
 * Redirectless Flow V6 Real - PingOne API-driven authentication without browser redirects
 * Uses response_mode=pi.flow for server-to-server token exchange
 */
const RedirectlessFlowV6Real: React.FC = () => {
    const navigate = useNavigate();
    
    // Initialize controller with redirectless-specific configuration
    const controller = useAuthorizationCodeFlowController({
        flowKey: 'redirectless-v6-real',
        defaultFlowVariant: 'oidc'
    });

    // Page scroll management
    usePageScroll({ pageName: 'Redirectless Flow V6 Real', force: true });

    // Local state management (V6 pattern)
    const [currentStep, setCurrentStep] = useState(
        AuthorizationCodeSharedService.StepRestoration.getInitialStep()
    );
    
    // Collapse all sections by default for cleaner UI
    const shouldCollapseAll = true;
    
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(
        AuthorizationCodeSharedService.CollapsibleSections.getDefaultState()
    );

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
    const handleStepChange = useCallback((newStep: number) => {
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
                const hasPkceCodes = !!(controller.pkceCodes.codeVerifier && controller.pkceCodes.codeChallenge) || 
                                   !!sessionStorage.getItem(`${controller.persistKey}-pkce-codes`);
                
                switch (step) {
                    case 0: return true; // Introduction step
                    case 1: return hasPkceCodes;
                    case 2: return !!(controller.authUrl && hasPkceCodes);
                    case 3: return !!(controller.authCode || controller.authCode);
                    default: return true;
                }
            },
            () => {
                console.log('✅ [Redirectless V6] Navigation allowed, moving to step:', newStep);
                setCurrentStep(newStep);
            }
        );
    }, [currentStep, controller]);

    // PKCE generation handler
    const handleGeneratePkce = useCallback(() => {
        AuthorizationCodeSharedService.PKCE.generatePKCE('oidc', controller.credentials, controller);
    }, [controller]);

    // Authorization URL generation handler
    const handleGenerateAuthUrl = useCallback(() => {
        AuthorizationCodeSharedService.Authorization.generateAuthUrl('oidc', controller.credentials, controller);
    }, [controller]);

    // Open authorization URL handler
    const handleOpenAuthUrl = useCallback(() => {
        if (controller.authUrl) {
            AuthorizationCodeSharedService.Authorization.openAuthUrl(controller.authUrl);
        }
    }, [controller.authUrl]);

    // Navigate to token management
    const navigateToTokenManagement = useCallback(() => {
        if (!controller.tokens) return;
        
        // Store tokens in localStorage for token management page
        if (controller.tokens.accessToken) {
            localStorage.setItem('redirectless-access-token', String(controller.tokens.accessToken));
        }
        if (controller.tokens.idToken) {
            localStorage.setItem('redirectless-id-token', String(controller.tokens.idToken));
        }
        if (controller.tokens.refreshToken) {
            localStorage.setItem('redirectless-refresh-token', String(controller.tokens.refreshToken));
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
                            credentials={controller.credentials}
                            onCredentialsChange={controller.setCredentials}
                            onDiscoveryComplete={() => {}}
                            requireClientSecret={false}
                            showAdvancedConfig={true} // ✅ Redirectless uses authorization endpoint, PAR applicable
                            defaultCollapsed={shouldCollapseAll}
                        />

                        {/* Redirectless Educational Content */}
                        <EducationalContentService flowType="redirectless" defaultCollapsed={shouldCollapseAll} />
                    </>
                );

            case 1:
                return (
                    <>
                        <CollapsibleHeader
					title="PKCE Parameters"
				icon={<FiCheckCircle />}
				defaultCollapsed={shouldCollapseAll}
			>
					<div style={{ marginBottom: '1rem' }}>
                                <p>
                                    <strong>Proof Key for Code Exchange (PKCE)</strong> adds an extra layer of security 
                                    to the authorization code flow, even for public clients.
                                </p>
                            </div>
                            
                            <HighlightedActionButton
                                onClick={handleGeneratePkce}
                                $priority="primary"
                                disabled={!!controller.pkceCodes.codeVerifier}
                                title={controller.pkceCodes.codeVerifier ? 'PKCE parameters already generated' : 'Generate PKCE parameters'}
                            >
                                {controller.pkceCodes.codeVerifier ? <FiCheckCircle /> : <FiRefreshCw />}{' '}
                                {controller.pkceCodes.codeVerifier ? 'PKCE Parameters Generated' : 'Generate PKCE Parameters'}
                                <HighlightBadge>1</HighlightBadge>
                            </HighlightedActionButton>

                            {controller.pkceCodes.codeVerifier && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <strong>Code Verifier:</strong>
                                        <pre style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '0.25rem', fontSize: '0.75rem', overflow: 'auto' }}>
                                            {controller.pkceCodes.codeVerifier}
                                        </pre>
                                    </div>
                                    <div>
                                        <strong>Code Challenge:</strong>
                                        <pre style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '0.25rem', fontSize: '0.75rem', overflow: 'auto' }}>
                                            {controller.pkceCodes.codeChallenge}
                                        </pre>
                                    </div>
                                </div>
                            )}
				</CollapsibleHeader>

                        <CollapsibleHeader
					title="Authorization URL Generation"
				icon={<FiCheckCircle />}
				defaultCollapsed={shouldCollapseAll}
			>
					<div style={{ marginBottom: '1rem' }}>
                                <p>
                                    Generate the authorization URL that will be used to authenticate the user. 
                                    For Redirectless flow, this URL includes the special <code>response_mode=pi.flow</code> parameter.
                                </p>
                            </div>
                            
                            <HighlightedActionButton
                                onClick={handleGenerateAuthUrl}
                                $priority="primary"
                                disabled={
                                    !!controller.authUrl ||
                                    (!controller.pkceCodes.codeVerifier && !sessionStorage.getItem(`${controller.persistKey}-pkce-codes`))
                                }
                                title={
                                    (!controller.pkceCodes.codeVerifier && !sessionStorage.getItem(`${controller.persistKey}-pkce-codes`))
                                        ? 'Generate PKCE parameters first'
                                        : controller.authUrl
                                            ? 'Authorization URL already generated'
                                            : 'Generate authorization URL'
                                }
                            >
                                {controller.authUrl ? <FiCheckCircle /> : <FiExternalLink />}{' '}
                                {controller.authUrl
                                    ? 'Authorization URL Generated'
                                    : (!controller.pkceCodes.codeVerifier && !sessionStorage.getItem(`${controller.persistKey}-pkce-codes`))
                                        ? 'Complete above action'
                                        : 'Generate Authorization URL'}
                                <HighlightBadge>1</HighlightBadge>
                            </HighlightedActionButton>

                            {controller.authUrl && (
                                <div style={{ marginTop: '1rem' }}>
                                    <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                                        <strong>Authorization URL:</strong>
                                        <pre style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '0.25rem', fontSize: '0.75rem', overflow: 'auto' }}>
                                            {controller.authUrl}
                                        </pre>
                                    </div>
                                    
                                    <div style={{ marginTop: '1rem' }}>
                                        <Button
                                            onClick={handleOpenAuthUrl}
                                            $priority="primary"
                                            title="Open authorization URL in new tab"
                                        >
                                            <FiExternalLink /> Open Authorization URL
                                        </Button>
                                    </div>
                                </div>
                            )}
				</CollapsibleHeader>
                    </>
                );

            case 2:
                return (
                    <>
                        <CollapsibleHeader
					title="Token Exchange"
					icon={<FiRefreshCw />}
					defaultCollapsed={shouldCollapseAll}
				>
					<div style={{ marginBottom: '1rem' }}>
                                <p>
                                    For Redirectless flow, tokens are returned directly in the API response 
                                    without requiring a separate token exchange call.
                                </p>
                            </div>

                            {controller.tokens?.accessToken ? (
                                <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <strong>Access Token:</strong>
                                        <pre style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '0.25rem', fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px' }}>
                                            {String(controller.tokens.accessToken)}
                                        </pre>
                                    </div>
                                    
                                    {controller.tokens.idToken ? (
                                        <div style={{ marginBottom: '1rem' }}>
                                            <strong>ID Token:</strong>
                                            <pre style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '0.25rem', fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px' }}>
                                                {String(controller.tokens.idToken)}
                                            </pre>
                                        </div>
                                    ) : null}
                                    
                                    {controller.tokens.refreshToken ? (
                                        <div>
                                            <strong>Refresh Token:</strong>
                                            <pre style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '0.25rem', fontSize: '0.75rem', overflow: 'auto', maxHeight: '200px' }}>
                                                {String(controller.tokens.refreshToken)}
                                            </pre>
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                    <p>Complete the authorization step to receive tokens</p>
                                </div>
                            )}
				</CollapsibleHeader>
                    </>
                );

            case 3:
                return (
                    <>
                        <CollapsibleHeader
					title="Token Management"
					icon={<FiEye />}
					defaultCollapsed={shouldCollapseAll}
				>
					<div style={{ marginBottom: '1rem' }}>
                                <p>
                                    Manage your tokens, including introspection, refresh, and validation.
                                </p>
                            </div>

                            <HighlightedActionButton
                                onClick={navigateToTokenManagement}
                                $priority="primary"
                                disabled={!controller.tokens?.accessToken}
                                title={!controller.tokens?.accessToken ? 'No tokens available' : 'Open token management'}
                            >
                                <FiEye /> Token Management
                                <HighlightBadge>1</HighlightBadge>
                            </HighlightedActionButton>

                            {controller.tokens?.accessToken ? (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                                    <p style={{ color: '#059669', margin: 0 }}>
                                        ✓ Tokens available. Click the button above to navigate to Token Management page.
                                    </p>
                                </div>
                            ) : null}
				</CollapsibleHeader>

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
        shouldCollapseAll
    ]);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <FlowHeader flowId="redirectless" />

            <StepNavigationButtons
                currentStep={currentStep}
                totalSteps={STEP_METADATA.length}
                onPrevious={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                onNext={() => handleStepChange(currentStep + 1)}
                onReset={() => {
                    setCurrentStep(0);
                    controller.resetFlow();
                }}
                canNavigateNext={true}
                isFirstStep={currentStep === 0}
            />

            <div style={{ marginTop: '2rem' }}>
                {renderStepContent()}
            </div>
        </div>
    );
};

export default RedirectlessFlowV6Real;