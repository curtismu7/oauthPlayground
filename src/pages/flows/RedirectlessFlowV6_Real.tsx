// src/pages/flows/RedirectlessFlowV6_Real.tsx
// ⭐ V6 FLOW - Redirectless Flow using PingOne API without browser redirects
// Uses response_mode=pi.flow for server-to-server token exchange

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
	FiExternalLink, 
	FiCheckCircle, 
	FiRefreshCw, 
	FiEye, 
	FiInfo,
	FiKey,
	FiShield,
	FiArrowRight,
	FiCode,
	FiSend
} from 'react-icons/fi';

import { useAuthorizationCodeFlowController } from '../../hooks/useAuthorizationCodeFlowController';
import { usePageScroll } from '../../hooks/usePageScroll';
import { AuthorizationCodeSharedService } from '../../services/authorizationCodeSharedService';
import { CollapsibleHeader } from '../../services/collapsibleHeaderService';
import { FlowHeader } from '../../services/flowHeaderService';
import ComprehensiveCredentialsService from '../../services/comprehensiveCredentialsService';
import EducationalContentService from '../../services/educationalContentService.tsx';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import { V5StepperService } from '../../services/v5StepperService';
import { EnhancedApiCallDisplay } from '../../components/EnhancedApiCallDisplay';
import { EnhancedApiCallDisplayService, EnhancedApiCallData } from '../../services/enhancedApiCallDisplayService';
import { v4ToastManager } from '../../utils/v4ToastManager';
import { UnifiedTokenDisplayService } from '../../services/unifiedTokenDisplayService';
import { ExplanationHeading, ExplanationSection } from '../../components/InfoBlocks';
import { HelperText, ResultsHeading, ResultsSection, SectionDivider } from '../../components/ResultsPanel';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import { FlowStorageService } from '../../services/flowStorageService';
import { FlowCompletionService, FlowCompletionConfigs } from '../../services/flowCompletionService';
import styled from 'styled-components';

// Import config
import { STEP_METADATA } from './config/RedirectlessFlow.config';

// V6 Styled Components - Following V6 Template Pattern
const Container = styled.div`
	min-height: 100vh;
	background-color: #f9fafb;
	padding: 2rem 0 6rem;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const StepSection = styled.div`
	background: white;
	border-radius: 1rem;
	padding: 2rem;
	margin: 1.5rem 0;
	border: 1px solid #e5e7eb;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

// V5Stepper components - using NavigationButton for consistent V6 styling
const { NavigationButton } = V5StepperService.createStepLayout({ theme: 'blue', showProgress: true });

/**
 * Redirectless Flow V6 Real - PingOne API-driven authentication without browser redirects
 * Uses response_mode=pi.flow for server-to-server token exchange
 * ⭐ V6 TEMPLATE COMPLIANCE: Uses V5StepperService for consistent navigation
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

    // V6 Educational API Call Tracking
    const [apiCalls, setApiCalls] = useState<EnhancedApiCallData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tokens, setTokens] = useState<any>(null);

    // Scroll to top on step change
    useEffect(() => {
        AuthorizationCodeSharedService.StepRestoration.scrollToTopOnStepChange();
    }, [currentStep]);

    // V6 Service: Load saved flow state on mount
    useEffect(() => {
        const savedState = FlowStorageService.AdvancedParameters.get('redirectless-v6');
        if (savedState) {
            console.log('[Redirectless V6] Loading saved flow state:', savedState);
            // Apply saved state if needed
        }
    }, []);

    // V6 Service: Save flow state when it changes
    useEffect(() => {
        if (controller.credentials.clientId) {
            FlowStorageService.AdvancedParameters.set('redirectless-v6', {
                currentStep,
                hasTokens: !!controller.tokens?.accessToken,
                flowType: 'redirectless'
            });
        }
    }, [currentStep, controller.credentials.clientId, controller.tokens]);

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

    // PKCE generation handler with service-based API call tracking
    const handleGeneratePkce = useCallback(() => {
        // Use service to create PKCE API call template
        const pkceApiCall = EnhancedApiCallDisplayService.createOAuthTemplate(
            'redirectless',
            'PKCE Generation',
            {
                method: 'LOCAL' as any,
                url: 'Client-side PKCE Generation',
                description: 'Generate cryptographically secure PKCE parameters for redirectless flow',
                educationalNotes: [
                    'PKCE (Proof Key for Code Exchange) adds security to OAuth flows',
                    'Code verifier is a cryptographically random string',
                    'Code challenge is SHA256 hash of the verifier',
                    'Prevents authorization code interception attacks'
                ]
            }
        );

        setApiCalls(prev => [...prev, pkceApiCall]);
        AuthorizationCodeSharedService.PKCE.generatePKCE('oidc', controller.credentials, controller);
    }, [controller]);

    // Authorization URL generation handler with service-based API call tracking
    const handleGenerateAuthUrl = useCallback(() => {
        // Use service to create authorization URL API call template
        const authUrlApiCall = EnhancedApiCallDisplayService.createOAuthTemplate(
            'redirectless',
            'Authorization URL Generation',
            {
                method: 'LOCAL' as any,
                url: 'Client-side URL Construction',
                description: 'Generate authorization URL with response_mode=pi.flow for server-to-server exchange',
                body: {
                    response_type: 'code',
                    response_mode: 'pi.flow',
                    client_id: controller.credentials.clientId,
                    redirect_uri: 'urn:pingidentity:redirectless',
                    scope: 'openid profile email',
                    code_challenge: controller.pkceCodes.codeChallenge,
                    code_challenge_method: 'S256',
                    state: '[random-state-value]'
                },
                educationalNotes: [
                    'response_mode=pi.flow enables redirectless flow',
                    'redirect_uri uses special urn:pingidentity:redirectless',
                    'PKCE parameters ensure security without client secret',
                    'Authorization code will be returned directly in API response'
                ]
            }
        );

        setApiCalls(prev => [...prev, authUrlApiCall]);
        AuthorizationCodeSharedService.Authorization.generateAuthUrl('oidc', controller.credentials, controller);
    }, [controller]);

    // Real Redirectless Authentication and Token Exchange
    const handleRedirectlessTokenExchange = useCallback(async () => {
        if (!controller.credentials.clientId || !controller.credentials.environmentId || !controller.pkceCodes.codeVerifier) {
            v4ToastManager.showError('Complete above actions: Generate PKCE parameters and ensure credentials are set.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Force generate fresh PKCE codes for redirectless flow
            console.log('🔐 [Redirectless V6] Force generating fresh PKCE codes for redirectless flow');
            
            // Import PKCE generation utilities
            const { generateCodeVerifier, generateCodeChallenge } = await import('../../utils/oauth');
            
            // Generate fresh PKCE codes directly
            const codeVerifier = generateCodeVerifier();
            const codeChallenge = await generateCodeChallenge(codeVerifier);
            
            const freshPkceCodes = {
                codeVerifier,
                codeChallenge,
                codeChallengeMethod: 'S256' as const
            };
            
            console.log('🔐 [Redirectless V6] Generated fresh PKCE codes:', {
                codeVerifier: codeVerifier.substring(0, 20) + '...',
                codeChallenge: codeChallenge.substring(0, 20) + '...'
            });
            
            // Update the controller with fresh codes
            controller.setPkceCodes(freshPkceCodes);
            
            // Also update sessionStorage
            const pkceStorageKey = 'redirectless-v6-real-pkce-codes';
            sessionStorage.setItem(pkceStorageKey, JSON.stringify(freshPkceCodes));
            
            console.log('🔐 [Redirectless V6] Fresh PKCE codes set in controller and sessionStorage');
            
            // Step 1: Make real authorization request with response_mode=pi.flow (UPDATED VERSION)
            console.log('🔐 [Redirectless V6] Making real authorization request with response_mode=pi.flow - UPDATED VERSION');
            
            const authEndpoint = `https://auth.pingone.com/${controller.credentials.environmentId}/as/authorize`;
            const stateValue = `redirectless-${Date.now()}`;
            const authRequestBody = new URLSearchParams({
                response_type: 'code',
                client_id: controller.credentials.clientId,
                scope: 'openid profile email',
                state: stateValue,
                nonce: `nonce-${Date.now()}`,
                code_challenge: controller.pkceCodes.codeChallenge,
                code_challenge_method: 'S256',
                response_mode: 'pi.flow',
                username: 'testuser', // TODO: Get from user input
                password: 'testpass'  // TODO: Get from user input
            });

            console.log('🔐 [Redirectless V6] Authorization request body:', authRequestBody.toString());

            const authResponse = await fetch(authEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: authRequestBody.toString()
            });

            console.log('🔐 [Redirectless V6] Authorization response status:', authResponse.status);

            if (!authResponse.ok) {
                const errorText = await authResponse.text();
                throw new Error(`Authorization request failed: ${authResponse.status} ${authResponse.statusText}. ${errorText}`);
            }

            const authData = await authResponse.json();
            console.log('🔐 [Redirectless V6] Authorization response data:', authData);
            console.log('🔐 [Redirectless V6] Checking for resumeUrl:', authData.resumeUrl);

            // In redirectless flow, PingOne returns a flow object with resumeUrl, not a direct code
            if (!authData.resumeUrl) {
                throw new Error('No resumeUrl received from PingOne redirectless flow - this is the updated error message');
            }

            // Step 2: Call the resumeUrl to complete the authentication and get the authorization code
            console.log('🔐 [Redirectless V6] Calling resumeUrl to complete authentication');
            console.log('🔐 [Redirectless V6] Flow ID:', authData.id);
            console.log('🔐 [Redirectless V6] Flow state:', authData.state);
            
            // For redirectless flow, we need to call the resumeUrl directly with POST method
            // and include the flow state information
            const resumeResponse = await fetch('/api/pingone/resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resumeUrl: authData.resumeUrl,
                    flowId: authData.id,
                    flowState: stateValue, // Use the state we sent in the authorization request
                    clientId: controller.credentials.clientId,
                    clientSecret: controller.credentials.clientSecret
                })
            });

            if (!resumeResponse.ok) {
                const errorText = await resumeResponse.text();
                throw new Error(`Resume request failed: ${resumeResponse.status} ${resumeResponse.statusText}. ${errorText}`);
            }

            const resumeData = await resumeResponse.json();
            console.log('🔐 [Redirectless V6] Resume response data:', resumeData);

            if (!resumeData.code) {
                throw new Error('No authorization code received after calling resumeUrl');
            }

            // Step 3: Exchange authorization code for tokens using backend proxy
            console.log('🔐 [Redirectless V6] Exchanging authorization code for tokens');
            
            const backendUrl = process.env.NODE_ENV === 'production' 
                ? 'https://oauth-playground.vercel.app' 
                : 'https://localhost:3001';

            const tokenRequestBody = {
                grant_type: 'authorization_code',
                code: resumeData.code,
                redirect_uri: 'urn:pingidentity:redirectless',
                client_id: controller.credentials.clientId,
                client_secret: controller.credentials.clientSecret,
                environment_id: controller.credentials.environmentId,
                code_verifier: controller.pkceCodes.codeVerifier
            };

            const tokenResponse = await fetch(`${backendUrl}/api/token-exchange`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tokenRequestBody)
            });

            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.json().catch(() => ({}));
                throw new Error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}. ${errorData.error_description || errorData.error || 'Please check your configuration.'}`);
            }

            const tokenData = await tokenResponse.json();
            console.log('🔐 [Redirectless V6] Token exchange successful:', tokenData);

            if (!tokenData.access_token) {
                throw new Error('No access token received from PingOne');
            }

            // Create API call display for the resume step
            const resumeApiCall = EnhancedApiCallDisplayService.createOAuthTemplate(
                'redirectless',
                'Resume Flow',
                {
                    method: 'POST',
                    url: '/api/pingone/resume',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        resumeUrl: authData.resumeUrl,
                        clientId: controller.credentials.clientId,
                        clientSecret: '***REDACTED***'
                    },
                    description: 'Complete redirectless authentication by calling resumeUrl',
                    educationalNotes: [
                        'Redirectless flow returns a resumeUrl instead of direct authorization code',
                        'ResumeUrl must be called to complete the authentication process',
                        'This step validates the user credentials and returns the authorization code',
                        'No browser interaction required - pure API-based flow'
                    ]
                }
            );

            // Create API call display for the successful token exchange
            const tokenExchangeApiCall = EnhancedApiCallDisplayService.createOAuthTemplate(
                'redirectless',
                'Token Exchange',
                {
                    method: 'POST',
                    url: `${backendUrl}/api/token-exchange`,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: {
                        grant_type: 'authorization_code',
                        code: resumeData.code,
                        redirect_uri: 'urn:pingidentity:redirectless',
                        client_id: controller.credentials.clientId,
                        client_secret: '***REDACTED***',
                        environment_id: controller.credentials.environmentId,
                        code_verifier: controller.pkceCodes.codeVerifier
                    },
                    description: 'Real server-to-server token exchange using response_mode=pi.flow',
                    educationalNotes: [
                        'Authorization code obtained from resume step is exchanged for tokens',
                        'No browser redirect required - pure server-to-server exchange',
                        'PKCE code_verifier validates the original request',
                        'Special redirect_uri urn:pingidentity:redirectless used',
                        'Response includes access_token, id_token, and refresh_token'
                    ]
                }
            );

            // Add real response data
            tokenExchangeApiCall.response = {
                status: tokenResponse.status,
                statusText: tokenResponse.statusText,
                headers: Object.fromEntries(tokenResponse.headers.entries()),
                data: {
                    ...tokenData,
                    access_token: `${tokenData.access_token.substring(0, 20)}...[TRUNCATED FOR SECURITY]`
                }
            };

            setApiCalls(prev => [...prev, resumeApiCall, tokenExchangeApiCall]);
            setIsLoading(false);
            v4ToastManager.showSuccess('✅ Real tokens obtained from PingOne redirectless flow!');
            
            // Store tokens in local state for display
            setTokens({
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                id_token: tokenData.id_token,
                token_type: tokenData.token_type,
                expires_in: tokenData.expires_in,
                scope: tokenData.scope
            });

        } catch (error: any) {
            console.error('🔐 [Redirectless V6] Real token exchange failed:', error);
            setError(error.message);
            setIsLoading(false);
            v4ToastManager.showError(`❌ Real token exchange failed: ${error.message}`);
        }
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
                        {/* Redirectless Education - What is response_mode=pi.flow */}
                        <div style={{ 
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
                            color: 'white', 
                            padding: '2rem', 
                            borderRadius: '1rem', 
                            marginBottom: '2rem',
                            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.2)'
                        }}>
                            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '700' }}>
                                🎯 PingOne Redirectless Flow (response_mode=pi.flow)
                            </h2>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', opacity: '0.9' }}>
                                Build custom authentication UIs without browser redirects. Perfect for embedded login experiences, 
                                mobile apps, and server-to-server scenarios where you want full control over the user experience.
                            </p>
                            <div style={{ 
                                background: 'rgba(255, 255, 255, 0.1)', 
                                padding: '1rem', 
                                borderRadius: '0.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <strong>Key Difference:</strong> Instead of redirecting users to PingOne's hosted login page, 
                                you make a direct API call to the authorization endpoint with <code>response_mode=pi.flow</code> 
                                and receive tokens directly in the JSON response.
                            </div>
                        </div>

                        {/* URL Example */}
                        <div style={{ 
                            background: '#f8fafc', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '0.75rem', 
                            padding: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiExternalLink />
                                Authorization URL with response_mode=pi.flow
                            </h3>
                            <div style={{ 
                                background: '#1f2937', 
                                color: '#f9fafb', 
                                padding: '1rem', 
                                borderRadius: '0.5rem', 
                                fontFamily: 'Monaco, Menlo, monospace',
                                fontSize: '0.875rem',
                                overflow: 'auto'
                            }}>
                                <div style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>POST</div>
                                <div style={{ marginBottom: '1rem' }}>
                                    https://auth.pingone.com/{controller.credentials?.environmentId || '{environmentId}'}/as/authorize
                                </div>
                                <div style={{ color: '#34d399', marginBottom: '0.5rem' }}>Headers:</div>
                                <div style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                                    Content-Type: application/x-www-form-urlencoded
                                </div>
                                <div style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>Body Parameters:</div>
                                <div style={{ marginLeft: '1rem' }}>
                                    <div>client_id={controller.credentials?.clientId || '{clientId}'}</div>
                                    <div style={{ color: '#f87171', fontWeight: 'bold' }}>response_mode=pi.flow</div>
                                    <div>response_type=code</div>
                                    <div>scope=openid profile email</div>
                                    <div>username={'{username}'}</div>
                                    <div>password={'{password}'}</div>
                                    <div>code_challenge={'{pkce_challenge}'}</div>
                                    <div>code_challenge_method=S256</div>
                                </div>
                            </div>
                            <div style={{ 
                                marginTop: '1rem', 
                                padding: '1rem', 
                                background: '#fef3c7', 
                                border: '1px solid #f59e0b',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem'
                            }}>
                                <strong>⚡ Key Point:</strong> Notice there's no <code>redirect_uri</code> parameter! 
                                The <code>response_mode=pi.flow</code> tells PingOne to return tokens directly 
                                in the API response instead of redirecting to a callback URL.
                            </div>
                        </div>

                        {/* Mock UI Demo */}
                        <div style={{ 
                            background: 'white', 
                            border: '2px solid #10b981', 
                            borderRadius: '1rem', 
                            padding: '2rem',
                            marginBottom: '2rem',
                            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.1)'
                        }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiEye />
                                Mock Custom Login UI (What Your Users Would See)
                            </h3>
                            <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
                                This is what your custom authentication UI might look like. Instead of redirecting 
                                to PingOne's hosted login page, you collect credentials in your own UI and make 
                                the API call behind the scenes.
                            </p>
                            
                            {/* Mock Login Form */}
                            <div style={{ 
                                background: '#f9fafb', 
                                border: '1px solid #e5e7eb', 
                                borderRadius: '0.75rem', 
                                padding: '2rem',
                                maxWidth: '400px',
                                margin: '0 auto'
                            }}>
                                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#1f2937' }}>
                                        Sign In to Your App
                                    </h4>
                                    <p style={{ margin: '0', color: '#6b7280', fontSize: '0.875rem' }}>
                                        Custom UI powered by PingOne
                                    </p>
                                </div>
                                
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                        Username or Email
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter your username"
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.75rem', 
                                            border: '1px solid #d1d5db', 
                                            borderRadius: '0.5rem',
                                            fontSize: '1rem'
                                        }}
                                        disabled
                                    />
                                </div>
                                
                                <form key="v6-password-form">
                                    <div style={{ marginBottom: '2rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                                            Password
                                        </label>
                                        <input 
                                            type="password" 
                                            placeholder="Enter your password"
                                            style={{ 
                                                width: '100%', 
                                                padding: '0.75rem', 
                                                border: '1px solid #d1d5db', 
                                                borderRadius: '0.5rem',
                                                fontSize: '1rem'
                                            }}
                                            disabled
                                        />
                                    </div>
                                </form>
                                
                                <NavigationButton
                                    disabled
                                    style={{ 
                                        width: '100%', 
                                        opacity: '0.7'
                                    }}
                                >
                                    Sign In (Demo Only)
                                </NavigationButton>
                                
                                <div style={{ 
                                    marginTop: '1rem', 
                                    padding: '1rem', 
                                    background: '#dbeafe', 
                                    border: '1px solid #3b82f6',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    textAlign: 'center'
                                }}>
                                    <strong>Behind the scenes:</strong> When user clicks "Sign In", your app makes a 
                                    POST request to PingOne's authorization endpoint with <code>response_mode=pi.flow</code> 
                                    and receives tokens directly - no redirect needed!
                                </div>
                            </div>
                        </div>

                        {/* API Response Example */}
                        <div style={{ 
                            background: '#f0fdf4', 
                            border: '1px solid #16a34a', 
                            borderRadius: '0.75rem', 
                            padding: '1.5rem',
                            marginBottom: '2rem'
                        }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiCheckCircle />
                                Direct Token Response (No Redirect!)
                            </h3>
                            <p style={{ margin: '0 0 1rem 0', color: '#166534' }}>
                                Instead of a redirect, PingOne returns tokens directly in the API response:
                            </p>
                            <div style={{ 
                                background: '#1f2937', 
                                color: '#f9fafb', 
                                padding: '1rem', 
                                borderRadius: '0.5rem', 
                                fontFamily: 'Monaco, Menlo, monospace',
                                fontSize: '0.875rem',
                                overflow: 'auto'
                            }}>
                                <div style={{ color: '#34d399', marginBottom: '0.5rem' }}>HTTP 200 OK</div>
                                <div style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>Content-Type: application/json</div>
                                <div style={{ marginTop: '1rem' }}>
{`{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email",
  "id_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."
}`}
                                </div>
                            </div>
                        </div>

                        <ComprehensiveCredentialsService
                            credentials={controller.credentials}
                            onCredentialsChange={controller.setCredentials}
                            onDiscoveryComplete={() => {}}
                            requireClientSecret={false}
                            showAdvancedConfig={true}
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
                            
                            <NavigationButton
                                onClick={handleGeneratePkce}
                                disabled={!!controller.pkceCodes.codeVerifier}
                                title={controller.pkceCodes.codeVerifier ? 'PKCE parameters already generated' : 'Generate PKCE parameters'}
                            >
                                {controller.pkceCodes.codeVerifier ? <FiCheckCircle /> : <FiRefreshCw />}{' '}
                                {controller.pkceCodes.codeVerifier ? 'PKCE Parameters Generated' : 'Generate PKCE Parameters'}
                                <HighlightBadge>1</HighlightBadge>
                            </NavigationButton>

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
                            
                            <NavigationButton
                                onClick={handleGenerateAuthUrl}
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
                            </NavigationButton>

                            {controller.authUrl && (
                                <div style={{ marginTop: '1rem' }}>
                                    <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                                        <strong>Authorization URL:</strong>
                                        <pre style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '0.25rem', fontSize: '0.75rem', overflow: 'auto' }}>
                                            {controller.authUrl}
                                        </pre>
                                    </div>
                                    
                                    <div style={{ marginTop: '1rem' }}>
                                        <NavigationButton
                                            onClick={handleOpenAuthUrl}
                                            title="Open authorization URL in new tab"
                                        >
                                            <FiExternalLink /> Open Authorization URL
                                        </NavigationButton>
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
                                    without requiring a separate token exchange call. Click below to make real API calls to PingOne and get actual tokens.
                                </p>
                            </div>

                            <NavigationButton
                                onClick={handleRedirectlessTokenExchange}
                                disabled={!controller.authUrl || isLoading}
                                title={!controller.authUrl ? 'Generate authorization URL first' : 'Get real tokens from PingOne'}
                            >
                                {isLoading ? (
                                    <>
                                        <FiRefreshCw className="animate-spin" /> Exchanging Tokens...
                                    </>
                                ) : (
                                    <>
                                        <FiSend /> Get Real Tokens
                                    </>
                                )}
                                <HighlightBadge>2</HighlightBadge>
                            </NavigationButton>

                            {controller.tokens?.accessToken && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                                    <p style={{ color: '#166534', margin: 0, fontWeight: '600' }}>
                                        ✅ Tokens received successfully! The redirectless flow is complete.
                                    </p>
                                </div>
                            )}

                            {controller.tokens?.accessToken ? (
                                <div style={{ marginTop: '1rem' }}>
                                    {UnifiedTokenDisplayService.showTokens(
                                        controller.tokens,
                                        'oidc',
                                        'redirectless-v6-tokens',
                                        {
                                            showCopyButtons: true,
                                            showDecodeButtons: true,
                                            showIntrospection: true,
                                            title: '🎯 Redirectless Flow Tokens'
                                        }
                                    )}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                    <FiInfo style={{ marginBottom: '0.5rem' }} />
                                    <p>Complete the token exchange step to receive tokens</p>
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

                            <NavigationButton
                                onClick={navigateToTokenManagement}
                                disabled={!controller.tokens?.accessToken}
                                title={!controller.tokens?.accessToken ? 'No tokens available' : 'Open token management'}
                            >
                                <FiEye /> Token Management
                                <HighlightBadge>1</HighlightBadge>
                            </NavigationButton>

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
        <Container>
            <ContentWrapper>
                <FlowHeader flowId="redirectless-v6-real" />
                
                {/* V6 Educational Flow Info Card */}
                <EnhancedFlowInfoCard
                    title="Redirectless Flow (response_mode=pi.flow)"
                    description="Server-to-server OAuth/OIDC flow without browser redirects using PingOne's pi.flow response mode"
                    features={[
                        'No browser redirects required',
                        'Server-to-server token exchange',
                        'PKCE security for public clients',
                        'Direct API integration'
                    ]}
                    flowType="redirectless"
                />

                {/* V6 Service: Educational Content */}
                <EducationalContentService flowType="oauth" defaultCollapsed={false} />

                {/* V6 API Call Display Section */}
                {apiCalls.length > 0 && (
                    <StepSection>
                        <ExplanationHeading>
                            <FiCode /> API Calls & Responses
                        </ExplanationHeading>
                        <ExplanationSection>
                            <HelperText>
                                Educational view of the redirectless flow API interactions with PingOne.
                            </HelperText>
                            {apiCalls.map((apiCall, index) => (
                                <EnhancedApiCallDisplay
                                    key={`${apiCall.flowType}-${apiCall.stepName}-${index}`}
                                    apiCall={apiCall}
                                    onCopy={() => {}}
                                />
                            ))}
                        </ExplanationSection>
                    </StepSection>
                )}

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

                {/* V6 Service: Flow Completion */}
                {controller.tokens?.accessToken && (
                    <FlowCompletionService
                        config={{
                            ...FlowCompletionConfigs.authorizationCode,
                            flowType: 'redirectless',
                            title: 'Redirectless Flow Complete! 🎉',
                            description: 'You have successfully completed the redirectless OAuth flow using response_mode=pi.flow',
                            nextSteps: [
                                'Use the access token to make API calls',
                                'Implement token refresh using the refresh token',
                                'Explore other OAuth flows in the playground',
                                'Learn about PKCE security best practices'
                            ]
                        }}
                        tokens={controller.tokens}
                        onReset={() => {
                            controller.resetFlow();
                            setCurrentStep(0);
                            setApiCalls([]);
                        }}
                    />
                )}

                <StepSection>
                    {renderStepContent()}
                </StepSection>
            </ContentWrapper>
        </Container>
    );
};

export default RedirectlessFlowV6Real;