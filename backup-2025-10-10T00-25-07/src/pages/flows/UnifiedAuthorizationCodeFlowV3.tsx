// src/pages/flows/UnifiedAuthorizationCodeFlowV3.tsx - Unified OAuth 2.0 and OIDC Authorization Code Flow

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiCheckCircle, FiCopy, FiRotateCcw, FiSettings, FiShield, FiUser } from 'react-icons/fi';
import styled from 'styled-components';
import AuthorizationRequestModal from '../../components/AuthorizationRequestModal';
import EnhancedStepFlowV2 from '../../components/EnhancedStepFlowV2';
import { type FlowConfig, FlowConfiguration } from '../../components/FlowConfiguration';
import FlowIntro from '../../components/flow/FlowIntro';
import IDTokenEducationSection from '../../components/IDTokenEducationSection';
import {
	InlineDocumentation,
	QuickReference,
	TroubleshootingGuide,
} from '../../components/InlineDocumentation';
import PingOneConfigSection from '../../components/PingOneConfigSection';
import {
	ActionButton,
	createAuthUrlStep,
	createCallbackHandlingStep,
	createCredentialsStep,
	createPKCEStep,
	createRefreshTokenStep,
	createTokenExchangeStep,
	createUserAuthorizationStep,
	InfoBox,
	type PKCECodes,
	type StepCredentials,
} from '../../components/steps/CommonSteps';
import { useAuth } from '../../contexts/NewAuthContext';
import { showGlobalError, showGlobalSuccess } from '../../hooks/useNotifications';
import { useAuthorizationFlowScroll } from '../../hooks/usePageScroll';
import { getCallbackUrlForFlow } from '../../utils/callbackUrls';
import {
	type ClientAuthConfig,
	type ClientAuthMethod,
	getAuthMethodSecurityLevel,
} from '../../utils/clientAuthentication';
import { copyToClipboard } from '../../utils/clipboard';
import { credentialManager } from '../../utils/credentialManager';
import { enhancedDebugger } from '../../utils/enhancedDebug';
import { getDefaultConfig } from '../../utils/flowConfigDefaults';
import { trackFlowCompletion } from '../../utils/flowCredentialChecker';
import { useFlowStepManager } from '../../utils/flowStepSystem';
import { generateCodeChallenge, generateCodeVerifier, validateIdToken } from '../../utils/oauth';
import { usePerformanceMonitor } from '../../utils/performance';
import { safeJsonParse } from '../../utils/secureJson';
import { storeOAuthTokens } from '../../utils/tokenStorage';

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const HeroSection = styled.section<{ $variant: 'oidc' | 'oauth' }>`
  margin-bottom: 2rem;
  border-radius: 16px;
  padding: 2.5rem;
  color: white;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
  background: #f8fafc;
`;

const ConfigCard = styled.div`
  background: #f8fafc;
  border: 1px solid #d4e4ff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 18px 36px rgba(79, 134, 255, 0.15);
  margin-bottom: 2rem;
`;

const FlowCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
`;

const FlowControlSection = styled.div`
  padding: 2rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const FlowControlTitle = styled.h3`
  margin: 0 0 1.5rem 0;
  color: #374151;
  font-size: 1.1rem;
  font-weight: 600;
`;

const FlowControlButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
`;

const FlowControlButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 140px;
  justify-content: center;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.clear {
    background: #10b981;
    color: white;
    
    &:hover {
      background: #059669;
    }
  }
  
  &.debug {
    background: #f59e0b;
    color: white;
    
    &:hover {
      background: #d97706;
    }
  }
  
  &.reset {
    background: #6b7280;
    color: white;
    
    &:hover {
      background: #4b5563;
    }
  }
`;

interface UnifiedFlowProps {
	flowType: 'oauth' | 'oidc';
}

const UnifiedAuthorizationCodeFlowV3: React.FC<UnifiedFlowProps> = ({ flowType }) => {
	const _authContext = useAuth();

	// Performance monitoring
	const _performanceMonitor = usePerformanceMonitor(`UnifiedAuthorizationCodeFlowV3-${flowType}`);

	// Start debug session
	React.useEffect(() => {
		const sessionId = enhancedDebugger.startSession(`${flowType}-authorization-code-v3`);
		console.log(` [${flowType.toUpperCase()}-V3] Debug session started:`, sessionId);

		return () => {
			enhancedDebugger.endSession();
		};
	}, [flowType]);

	// Use centralized scroll management
	const { scrollToTopAfterAction } = useAuthorizationFlowScroll(
		`${flowType.toUpperCase()} Authorization Code Flow V3`
	);

	// Use the new step management system
	const stepManager = useFlowStepManager({
		flowType: `${flowType}-authorization-code`,
		persistKey: `${flowType}_v3_step_manager`,
		defaultStep: 0,
		enableAutoAdvance: true,
	});

	// Force flow independence by clearing other flow's state on initialization
	useEffect(() => {
		console.log(` [${flowType.toUpperCase()}-V3] Ensuring flow independence...`);

		const otherFlowType = flowType === 'oauth' ? 'oidc' : 'oauth';

		// Clear any potential shared or conflicting keys
		const keysToCheck = [
			// Other flow's step management keys
			`${otherFlowType}_v3_step_manager-step`,
			`${otherFlowType}_v3_flow_steps`,
			// Legacy shared keys
			'oauth-authz-v3',
			'oidc-authz-v3',
			'enhanced-authz-code-v2-step',
			// Any generic step keys
			'step_manager',
			'flow_steps',
		];

		keysToCheck.forEach((key) => {
			if (sessionStorage.getItem(key)) {
				console.log(` [${flowType.toUpperCase()}-V3] Clearing potentially conflicting key: ${key}`);
				sessionStorage.removeItem(key);
			}
		});

		// Debug current state
		console.log(` [${flowType.toUpperCase()}-V3] Flow state after cleanup:`, {
			flowType,
			persistKey: `${flowType}_v3_step_manager`,
			currentStep: stepManager.currentStepIndex,
			isInitialized: stepManager.isInitialized,
			sessionStorageKeys: Object.keys(sessionStorage).filter(
				(key) => key.includes('step') || key.includes('flow')
			),
		});
	}, [flowType, stepManager.currentStepIndex, stepManager.isInitialized]); // Only run when flowType changes

	// State management
	const [credentials, setCredentials] = useState<StepCredentials>(() => {
		// Check for URL parameters first (from Flow Comparison tool OR OAuth callback)
		const urlParams = new URLSearchParams(window.location.search);
		const urlEnv = urlParams.get('env');
		const urlClient = urlParams.get('client');
		const urlScope = urlParams.get('scope');
		const urlRedirect = urlParams.get('redirect');

		// Check for OAuth callback parameters
		const authCode = urlParams.get('code');
		const authState = urlParams.get('state');
		const authError = urlParams.get('error');

		console.log(` [${flowType.toUpperCase()}-V3] URL parameter analysis:`, {
			isCallback: !!(authCode || authError),
			authCode: authCode ? `${authCode.substring(0, 10)}...` : null,
			authState: authState ? `${authState.substring(0, 10)}...` : null,
			authError,
			urlParams: Object.fromEntries(urlParams.entries()),
		});

		// COMPREHENSIVE FALLBACK CHAIN FOR CREDENTIAL LOADING:
		let allCredentials = null;
		let source = 'none';

		// 1. Try flow-specific credentials first
		allCredentials = credentialManager.loadFlowCredentials(flowType);
		if (allCredentials.environmentId && allCredentials.clientId) {
			source = 'flow-specific';
			console.log(` [${flowType.toUpperCase()}-V3] Loaded credentials from flow-specific storage`);
		} else {
			// 2. Try config page credentials (global fallback)
			allCredentials = credentialManager.loadConfigCredentials();
			if (allCredentials.environmentId && allCredentials.clientId) {
				source = 'config-page';
				console.log(` [${flowType.toUpperCase()}-V3] Loaded credentials from config page storage`);
			} else {
				// 3. Try permanent credentials
				allCredentials = credentialManager.loadPermanentCredentials();
				if (allCredentials.environmentId && allCredentials.clientId) {
					source = 'permanent';
					console.log(` [${flowType.toUpperCase()}-V3] Loaded credentials from permanent storage`);
				} else {
					// 4. Try legacy pingone_config
					const pingoneConfig = localStorage.getItem('pingone_config');
					if (pingoneConfig) {
						try {
							const parsed = JSON.parse(pingoneConfig);
							if (parsed.environmentId && parsed.clientId) {
								allCredentials = parsed;
								source = 'legacy-pingone-config';
								console.log(
									` [${flowType.toUpperCase()}-V3] Loaded credentials from legacy pingone_config`
								);
							}
						} catch (e) {
							console.warn(`! [${flowType.toUpperCase()}-V3] Failed to parse pingone_config:`, e);
						}
					}

					if (!allCredentials.environmentId || !allCredentials.clientId) {
						// 5. Try legacy login_credentials
						const loginCreds = localStorage.getItem('login_credentials');
						if (loginCreds) {
							try {
								const parsed = JSON.parse(loginCreds);
								if (parsed.environmentId && parsed.clientId) {
									allCredentials = parsed;
									source = 'legacy-login-credentials';
									console.log(
										` [${flowType.toUpperCase()}-V3] Loaded credentials from legacy login_credentials`
									);
								}
							} catch (e) {
								console.warn(
									`! [${flowType.toUpperCase()}-V3] Failed to parse login_credentials:`,
									e
								);
							}
						}
					}
				}
			}
		}

		const redirectUri =
			urlRedirect || allCredentials?.redirectUri || getCallbackUrlForFlow('authorization-code');
		const environmentId = urlEnv || allCredentials?.environmentId || '';
		const issuerUrl = environmentId ? `https://auth.pingone.com/${environmentId}` : '';

		// Always use OIDC scopes as default (both OAuth and OIDC V3 flows)
		const defaultScopes = 'openid';

		const savedScopes =
			urlScope ||
			(allCredentials?.scopes
				? Array.isArray(allCredentials.scopes)
					? allCredentials.scopes.join(' ')
					: allCredentials.scopes
				: defaultScopes);

		console.log(` [${flowType.toUpperCase()}-V3] Comprehensive credential loading:`, {
			source,
			hasUrlParams: !!(urlEnv || urlClient || urlScope),
			hasCredentials: !!(allCredentials?.environmentId && allCredentials?.clientId),
			redirectUri,
			urlClient: urlClient ? `${urlClient.substring(0, 8)}...` : null,
			loadedClientId: allCredentials?.clientId
				? `${allCredentials.clientId.substring(0, 8)}...`
				: null,
			urlScope,
			loadedScopes: allCredentials?.scopes,
			finalScope: savedScopes,
			flowType,
		});

		const initialCredentials = {
			environmentId: environmentId,
			clientId: urlClient || allCredentials?.clientId || '',
			clientSecret: allCredentials?.clientSecret || '',
			redirectUri: redirectUri,
			scope: savedScopes,
			scopes: savedScopes.split(' ').filter(Boolean),
			responseType: 'code',
			grantType: 'authorization_code',
			issuerUrl: issuerUrl,
		};

		// If we got credentials from URL parameters, save them for future use
		if (urlEnv || urlClient || urlScope) {
			console.log(` [${flowType.toUpperCase()}-V3] Saving URL credentials to storage`);
			credentialManager.saveAuthzFlowCredentials({
				environmentId: initialCredentials.environmentId,
				clientId: initialCredentials.clientId,
				redirectUri: initialCredentials.redirectUri,
				scopes: initialCredentials.scopes,
				tokenAuthMethod: initialCredentials.clientAuthMethod,
			});
		}

		return initialCredentials;
	});

	const credentialsRef = useRef<StepCredentials | null>(null);

	useEffect(() => {
		credentialsRef.current = credentials;
	}, [credentials]);

	const [pkceCodes, setPkceCodes] = useState<PKCECodes>({
		codeVerifier: '',
		codeChallenge: '',
		codeChallengeMethod: 'S256',
	});

	const [authUrl, setAuthUrl] = useState('');
	const [authCode, setAuthCode] = useState('');
	const [state, setState] = useState('');
	const [tokens, setTokens] = useState<Record<string, unknown> | null>(null);
	const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(null);
	const [isAuthorizing, setIsAuthorizing] = useState(false);
	const [isExchangingTokens, setIsExchangingTokens] = useState(false);
	const [_canExchangeTokens, setCanExchangeTokens] = useState(false);
	const [newTokensFromRefresh, setNewTokensFromRefresh] = useState(null);
	const [isRefreshingTokens, setIsRefreshingTokens] = useState(false);
	const [isResettingFlow, setIsResettingFlow] = useState(false);
	const [flowConfig, setFlowConfig] = useState<FlowConfig>(() => {
		// Try to load saved flow configuration
		try {
			const savedConfig = localStorage.getItem(`${flowType}_v3_flow_config`);
			if (savedConfig) {
				const parsed = JSON.parse(savedConfig);
				console.log(` [${flowType.toUpperCase()}-V3] Loaded saved flow configuration:`, parsed);
				return {
					...getDefaultConfig(
						flowType === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code'
					),
					...parsed,
				};
			}
		} catch (error) {
			console.warn(
				`! [${flowType.toUpperCase()}-V3] Failed to load saved flow configuration:`,
				error
			);
		}

		// Return default configuration
		const defaultConfig = getDefaultConfig(
			flowType === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code'
		);
		console.log(` [${flowType.toUpperCase()}-V3] Using default flow configuration:`, defaultConfig);
		console.log(
			` [${flowType.toUpperCase()}-V3] Default showAuthRequestModal:`,
			defaultConfig.showAuthRequestModal
		);
		return defaultConfig;
	});
	const [showExplainer, setShowExplainer] = useState(false);

	// UI state based on flow configuration
	const [showAuthSuccessModal, setShowAuthSuccessModal] = useState(false);
	const [showAuthRequestModal, setShowAuthRequestModal] = useState(false);

	// State for save button management
	const [hasCredentialsSaved, setHasCredentialsSaved] = useState(false);
	const [hasUnsavedCredentialChanges, setHasUnsavedCredentialChanges] = useState(false);
	const [originalCredentials, setOriginalCredentials] = useState<typeof credentials | null>(null);
	const [isSavingCredentials, setIsSavingCredentials] = useState(false);
	const [showSecret, setShowSecret] = useState(false);

	// Save flow configuration when it changes
	const handleFlowConfigChange = useCallback(
		(newConfig: FlowConfig) => {
			setFlowConfig(newConfig);

			// Persist the configuration
			try {
				localStorage.setItem(`${flowType}_v3_flow_config`, JSON.stringify(newConfig));
				console.log(` [${flowType.toUpperCase()}-V3] Saved flow configuration:`, {
					scopes: newConfig.scopes,
					nonce: newConfig.nonce ? `${newConfig.nonce.substring(0, 10)}...` : 'none',
					state: newConfig.state ? `${newConfig.state.substring(0, 10)}...` : 'none',
					maxAge: newConfig.maxAge,
					prompt: newConfig.prompt,
					loginHint: newConfig.loginHint,
					acrValues: newConfig.acrValues,
					clientAuthMethod: newConfig.clientAuthMethod,
					enablePKCE: newConfig.enablePKCE,
					enableOIDC: newConfig.enableOIDC,
				});
			} catch (error) {
				console.error(` [${flowType.toUpperCase()}-V3] Failed to save flow configuration:`, error);
			}
		},
		[flowType]
	);

	// Initialize original credentials and track changes
	useEffect(() => {
		if (!originalCredentials && (credentials.environmentId || credentials.clientId)) {
			console.log(
				' [UnifiedAuthorizationCodeFlowV3] Initializing original credentials:',
				credentials
			);
			setOriginalCredentials({ ...credentials });
			setHasCredentialsSaved(false);
			setHasUnsavedCredentialChanges(false);
		}
	}, [credentials, originalCredentials]);

	// Track credential changes
	useEffect(() => {
		if (originalCredentials) {
			const hasChanges = Object.keys(credentials).some(
				(key) =>
					credentials[key as keyof typeof credentials] !==
					originalCredentials[key as keyof typeof originalCredentials]
			);
			if (hasChanges !== hasUnsavedCredentialChanges) {
				setHasUnsavedCredentialChanges(hasChanges);
				console.log(
					` [UnifiedAuthorizationCodeFlowV3] Credentials changed, unsaved changes: ${hasChanges}`
				);
			}
		}
	}, [credentials, originalCredentials, hasUnsavedCredentialChanges]);

	// Reload credentials when storage changes (for browser restart scenarios)
	useEffect(() => {
		const reloadCredentials = () => {
			console.log(` [${flowType.toUpperCase()}-V3] Reloading credentials after storage change...`);

			// Try all storage mechanisms
			let foundCredentials = null;
			let source = 'none';

			// 1. Check authz flow credentials
			foundCredentials = credentialManager.loadAuthzFlowCredentials();
			if (foundCredentials.environmentId && foundCredentials.clientId) {
				source = 'authz-flow';
			} else {
				// 2. Check config credentials
				foundCredentials = credentialManager.loadConfigCredentials();
				if (foundCredentials.environmentId && foundCredentials.clientId) {
					source = 'config-page';
				} else {
					// 3. Check permanent credentials
					foundCredentials = credentialManager.loadPermanentCredentials();
					if (foundCredentials.environmentId && foundCredentials.clientId) {
						source = 'permanent';
					} else {
						// 4. Check legacy storage
						const pingoneConfig = localStorage.getItem('pingone_config');
						if (pingoneConfig) {
							try {
								const parsed = JSON.parse(pingoneConfig);
								if (parsed.environmentId && parsed.clientId) {
									foundCredentials = parsed;
									source = 'legacy-pingone-config';
								}
							} catch (e) {
								console.warn(`! [${flowType.toUpperCase()}-V3] Failed to parse pingone_config:`, e);
							}
						}
					}
				}
			}

			if (foundCredentials?.environmentId && foundCredentials.clientId) {
				console.log(` [${flowType.toUpperCase()}-V3] Reloading credentials from ${source}:`, {
					environmentId: foundCredentials.environmentId,
					clientId: `${foundCredentials.clientId.substring(0, 8)}...`,
					hasClientSecret: !!foundCredentials.clientSecret,
				});

				setCredentials((prev) => {
					const previous = credentialsRef.current ?? prev;

					console.log(` [${flowType.toUpperCase()}-V3] setCredentials called - previous state:`, {
						environmentId: previous.environmentId,
						clientId: previous.clientId ? `${previous.clientId.substring(0, 8)}...` : 'none',
						hasClientSecret: !!previous.clientSecret,
						redirectUri: previous.redirectUri,
					});

					const newCredentials = {
						...previous,
						environmentId: foundCredentials.environmentId ?? previous.environmentId,
						clientId: foundCredentials.clientId ?? previous.clientId,
						clientSecret: foundCredentials.clientSecret ?? previous.clientSecret,
						redirectUri: foundCredentials.redirectUri ?? previous.redirectUri,
						scope: scopeString ?? previous.scope,
						scopes: scopeArray.length > 0 ? scopeArray : previous.scopes,
						authEndpoint:
							foundCredentials.authEndpoint ??
							previous.authEndpoint ??
							(foundCredentials.environmentId
								? `https://auth.pingone.com/${foundCredentials.environmentId}/as/authorize`
								: ''),
						tokenEndpoint:
							foundCredentials.tokenEndpoint ??
							previous.tokenEndpoint ??
							(foundCredentials.environmentId
								? `https://auth.pingone.com/${foundCredentials.environmentId}/as/token`
								: ''),
						userInfoEndpoint:
							foundCredentials.userInfoEndpoint ??
							previous.userInfoEndpoint ??
							(foundCredentials.environmentId
								? `https://auth.pingone.com/${foundCredentials.environmentId}/as/userinfo`
								: ''),
						clientAuthMethod: foundCredentials.tokenAuthMethod ?? previous.clientAuthMethod,
					};

					console.log(` [${flowType.toUpperCase()}-V3] setCredentials - new credentials:`, {
						environmentId: newCredentials.environmentId,
						clientId: newCredentials.clientId
							? `${newCredentials.clientId.substring(0, 8)}...`
							: 'none',
						hasClientSecret: !!newCredentials.clientSecret,
						redirectUri: newCredentials.redirectUri,
					});

					const hasChanged = Object.keys(newCredentials).some(
						(key) =>
							newCredentials[key as keyof typeof newCredentials] !==
							previous[key as keyof typeof previous]
					);

					if (hasChanged) {
						console.log(` [${flowType.toUpperCase()}-V3] Credentials updated from ${source}`);
						return newCredentials;
					}

					console.log(` [${flowType.toUpperCase()}-V3] Credentials already up to date`);
					return previous;
				});
			} else {
				console.warn(
					`! [${flowType.toUpperCase()}-V3] No valid credentials found in any storage mechanism on mount`
				);
				console.log(
					` [${flowType.toUpperCase()}-V3] Available localStorage keys:`,
					Object.keys(localStorage)
				);
			}
		};

		// Listen for storage changes
		const handleStorageChange = (e: StorageEvent) => {
			if (
				e.key &&
				(e.key.includes('pingone') || e.key.includes('credentials') || e.key.includes('config'))
			) {
				console.log(` [${flowType.toUpperCase()}-V3] Storage change detected for key:`, e.key);
				reloadCredentials();
			}
		};

		// Listen for custom credential change events
		const handleCredentialChange = (e: CustomEvent) => {
			console.log(` [${flowType.toUpperCase()}-V3] Credential change event received:`, e.detail);
			reloadCredentials();
		};

		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('authz-credentials-changed', handleCredentialChange as EventListener);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener(
				'authz-credentials-changed',
				handleCredentialChange as EventListener
			);
		};
	}, [flowType]);

	// Step result management
	const [stepResults, setStepResults] = useState<Record<string, unknown>>(() => {
		try {
			const stored = sessionStorage.getItem(`${flowType}_v3_step_results`);
			return stored ? safeJsonParse(stored) || {} : {};
		} catch {
			return {};
		}
	});

	const saveStepResult = useCallback(
		(stepId: string, result: unknown) => {
			const newResults = { ...stepResults, [stepId]: result };
			setStepResults(newResults);
			sessionStorage.setItem(`${flowType}_v3_step_results`, JSON.stringify(newResults));
		},
		[stepResults, flowType]
	);

	const hasStepResult = useCallback(
		(stepId: string) => {
			return Boolean(stepResults[stepId]);
		},
		[stepResults]
	);

	// Handle stored authorization code from callback (after step manager initialization)
	React.useEffect(() => {
		// Only process stored codes after step manager is initialized
		if (!stepManager.isInitialized) return;

		const storedCode = sessionStorage.getItem(`${flowType}_v3_auth_code`);
		const storedState = sessionStorage.getItem(`${flowType}_v3_state`);

		if (storedCode) {
			console.log(` [${flowType.toUpperCase()}-V3] Found stored authorization code from callback`);
			setAuthCode(storedCode);
			setState(storedState || '');

			// Enable token exchange button
			setCanExchangeTokens(true);

			// Clean up stored values
			sessionStorage.removeItem(`${flowType}_v3_auth_code`);
			sessionStorage.removeItem(`${flowType}_v3_state`);

			console.log(
				` [${flowType.toUpperCase()}-V3] Authorization code loaded and ready for token exchange`
			);
		}
	}, [stepManager.isInitialized, flowType]);

	// Handle step navigation from authorization step
	useEffect(() => {
		const handleStepNext = () => {
			console.log(
				` [${flowType.toUpperCase()}-V3] Step next event received, advancing to next step`
			);
			stepManager.setStep(stepManager.currentStepIndex + 1);
		};

		window.addEventListener('step:next', handleStepNext);

		return () => {
			window.removeEventListener('step:next', handleStepNext);
		};
	}, [stepManager, flowType]);

	// Exchange refresh token for new access token
	const exchangeRefreshToken = useCallback(async () => {
		if (!tokens?.refresh_token) {
			showGlobalError('No refresh token available');
			return;
		}

		setIsRefreshingTokens(true);

		try {
			console.log(` [${flowType.toUpperCase()}-V3] Starting refresh token exchange...`);

			const requestBody = {
				grant_type: 'refresh_token',
				refresh_token: tokens.refresh_token,
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
				environment_id: credentials.environmentId,
				scope: flowType === 'oidc' ? 'openid profile email' : 'read write',
			};

			console.log(` [${flowType.toUpperCase()}-V3] Making refresh token request:`, {
				grant_type: requestBody.grant_type,
				client_id: requestBody.client_id
					? `${requestBody.client_id.substring(0, 8)}...`
					: 'MISSING',
				environment_id: requestBody.environment_id || 'MISSING',
				hasRefreshToken: !!requestBody.refresh_token,
				hasClientSecret: !!requestBody.client_secret,
				scope: requestBody.scope,
			});

			const response = await fetch('/api/token-exchange', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			const result = await response.json();

			if (response.ok && result.access_token) {
				console.log(` [${flowType.toUpperCase()}-V3] Refresh token exchange successful`);
				setNewTokensFromRefresh(result);

				// Store the new tokens using standardized storage for Token Management page
				const refreshSuccess = storeOAuthTokens(
					result,
					`${flowType}-authorization-code-v3-refresh`,
					`${flowType.toUpperCase()} Refresh Token Exchange`
				);
				if (refreshSuccess) {
					console.log(
						` [${flowType.toUpperCase()}-V3] New tokens stored successfully for Token Management page`
					);
				} else {
					console.warn(
						`! [${flowType.toUpperCase()}-V3] Failed to store new tokens for Token Management page`
					);
				}

				// Store the new tokens in flow-specific sessionStorage for demonstration
				sessionStorage.setItem(`${flowType}_v3_new_access_token`, result.access_token);
				if (result.refresh_token) {
					sessionStorage.setItem(`${flowType}_v3_new_refresh_token`, result.refresh_token);
				}
				if (result.id_token && flowType === 'oidc') {
					sessionStorage.setItem(`${flowType}_v3_new_id_token`, result.id_token);
				}

				showGlobalSuccess(
					'Tokens refreshed',
					'PingOne returned a new access token from your refresh token.'
				);
				stepManager.updateStepMessage('refresh-token-exchange', 'New tokens received successfully');
			} else {
				console.error(` [${flowType.toUpperCase()}-V3] Refresh token exchange failed:`, result);
				showGlobalError(
					`Refresh token exchange failed: ${result.error_description || result.error || 'Unknown error'}`
				);
			}
		} catch (error) {
			console.error(` [${flowType.toUpperCase()}-V3] Refresh token exchange error:`, error);
			showGlobalError('Refresh failed', `We couldn't obtain a new access token: ${String(error)}.`);
		} finally {
			setIsRefreshingTokens(false);
		}
	}, [tokens?.refresh_token, credentials, flowType, stepManager]);

	// Load credentials on mount
	const loadCredentialsOnMount = useCallback(() => {
		console.log(` [${flowType.toUpperCase()}-V3] Loading credentials on component mount...`);

		console.log(
			` [${flowType.toUpperCase()}-V3] All localStorage keys:`,
			Object.keys(localStorage)
		);
		console.log(
			` [${flowType.toUpperCase()}-V3] Current credentials state:`,
			credentialsRef.current
		);
		credentialManager.debugLocalStorage();

		let allCredentials = null;
		let source = 'none';

		// 1. Try authz flow credentials (dedicated storage for this flow)
		allCredentials = credentialManager.loadAuthzFlowCredentials();
		if (allCredentials.environmentId && allCredentials.clientId) {
			source = 'authz-flow';
			console.log(` [${flowType.toUpperCase()}-V3] Found authz flow credentials`);
		} else {
			// 2. Try config page credentials
			allCredentials = credentialManager.loadConfigCredentials();
			if (allCredentials.environmentId && allCredentials.clientId) {
				source = 'config-page';
				console.log(` [${flowType.toUpperCase()}-V3] Found config page credentials`);
			} else {
				// 3. Try permanent credentials
				allCredentials = credentialManager.loadPermanentCredentials();
				if (allCredentials.environmentId && allCredentials.clientId) {
					source = 'permanent';
					console.log(` [${flowType.toUpperCase()}-V3] Found permanent credentials`);
				} else {
					// 4. Try legacy pingone_config
					const pingoneConfig = localStorage.getItem('pingone_config');
					if (pingoneConfig) {
						try {
							const parsed = JSON.parse(pingoneConfig);
							if (parsed.environmentId && parsed.clientId) {
								allCredentials = parsed;
								source = 'legacy-pingone-config';
								console.log(
									` [${flowType.toUpperCase()}-V3] Found legacy pingone_config credentials`
								);
							}
						} catch (e) {
							console.warn(`! [${flowType.toUpperCase()}-V3] Failed to parse pingone_config:`, e);
						}
					}

					if (!allCredentials?.environmentId || !allCredentials?.clientId) {
						// 5. Try legacy login_credentials
						const loginCreds = localStorage.getItem('login_credentials');
						if (loginCreds) {
							try {
								const parsed = JSON.parse(loginCreds);
								if (parsed.environmentId && parsed.clientId) {
									allCredentials = parsed;
									source = 'legacy-login-credentials';
									console.log(` [${flowType.toUpperCase()}-V3] Found legacy login_credentials`);
								}
							} catch (e) {
								console.warn(
									`! [${flowType.toUpperCase()}-V3] Failed to parse login_credentials:`,
									e
								);
							}
						}
					}
				}
			}
		}

		if (allCredentials?.environmentId && allCredentials.clientId) {
			console.log(` [${flowType.toUpperCase()}-V3] Loading credentials from ${source}:`, {
				environmentId: allCredentials.environmentId,
				clientId: `${allCredentials.clientId.substring(0, 8)}...`,
				hasClientSecret: !!allCredentials.clientSecret,
				redirectUri: allCredentials.redirectUri,
			});

			// Update credentials state if different from current
			const scopeString = Array.isArray(allCredentials.scopes)
				? allCredentials.scopes.join(' ')
				: allCredentials.scopes;
			const scopeArray = Array.isArray(allCredentials.scopes)
				? allCredentials.scopes
				: allCredentials.scopes
					? allCredentials.scopes.split(' ')
					: [];

			setCredentials((prev) => {
				const previous = credentialsRef.current ?? prev;

				console.log(` [${flowType.toUpperCase()}-V3] setCredentials called - previous state:`, {
					environmentId: previous.environmentId,
					clientId: previous.clientId ? `${previous.clientId.substring(0, 8)}...` : 'none',
					hasClientSecret: !!previous.clientSecret,
					redirectUri: previous.redirectUri,
				});

				const newCredentials = {
					...previous,
					environmentId: allCredentials.environmentId ?? previous.environmentId,
					clientId: allCredentials.clientId ?? previous.clientId,
					clientSecret: allCredentials.clientSecret ?? previous.clientSecret,
					redirectUri: allCredentials.redirectUri ?? previous.redirectUri,
					scope: scopeString ?? previous.scope,
					scopes: scopeArray.length > 0 ? scopeArray : previous.scopes,
					authEndpoint:
						allCredentials.authEndpoint ??
						previous.authEndpoint ??
						(allCredentials.environmentId
							? `https://auth.pingone.com/${allCredentials.environmentId}/as/authorize`
							: ''),
					tokenEndpoint:
						allCredentials.tokenEndpoint ??
						previous.tokenEndpoint ??
						(allCredentials.environmentId
							? `https://auth.pingone.com/${allCredentials.environmentId}/as/token`
							: ''),
					userInfoEndpoint:
						allCredentials.userInfoEndpoint ??
						previous.userInfoEndpoint ??
						(allCredentials.environmentId
							? `https://auth.pingone.com/${allCredentials.environmentId}/as/userinfo`
							: ''),
					clientAuthMethod: allCredentials.tokenAuthMethod ?? previous.clientAuthMethod,
				};

				console.log(` [${flowType.toUpperCase()}-V3] setCredentials - new credentials:`, {
					environmentId: newCredentials.environmentId,
					clientId: newCredentials.clientId
						? `${newCredentials.clientId.substring(0, 8)}...`
						: 'none',
					hasClientSecret: !!newCredentials.clientSecret,
					redirectUri: newCredentials.redirectUri,
				});

				const hasChanged = Object.keys(newCredentials).some(
					(key) =>
						newCredentials[key as keyof typeof newCredentials] !==
						previous[key as keyof typeof previous]
				);

				if (hasChanged) {
					console.log(` [${flowType.toUpperCase()}-V3] Credentials updated from ${source}`);
					return newCredentials;
				}

				console.log(` [${flowType.toUpperCase()}-V3] Credentials already up to date`);
				return previous;
			});

			// Migrate to preferred storage if found in legacy storage
			if (source.startsWith('legacy-')) {
				console.log(
					` [${flowType.toUpperCase()}-V3] Migrating ${source} credentials to authz flow storage`
				);
				credentialManager.saveAuthzFlowCredentials({
					environmentId: allCredentials.environmentId,
					clientId: allCredentials.clientId,
					clientSecret: allCredentials.clientSecret,
					redirectUri: allCredentials.redirectUri || getCallbackUrlForFlow('authorization-code'),
					scopes: scopeArray.length > 0 ? scopeArray : ['openid'],
					authEndpoint:
						allCredentials.authEndpoint ||
						`https://auth.pingone.com/${allCredentials.environmentId}/as/authorize`,
					tokenEndpoint:
						allCredentials.tokenEndpoint ||
						`https://auth.pingone.com/${allCredentials.environmentId}/as/token`,
					userInfoEndpoint:
						allCredentials.userInfoEndpoint ||
						`https://auth.pingone.com/${allCredentials.environmentId}/as/userinfo`,
					tokenAuthMethod: allCredentials.tokenAuthMethod,
				});
			}
		} else {
			console.warn(
				`! [${flowType.toUpperCase()}-V3] No valid credentials found in any storage mechanism on mount`
			);
			console.log(
				` [${flowType.toUpperCase()}-V3] Available localStorage keys:`,
				Object.keys(localStorage)
			);
		}
	}, [flowType]);

	const hasLoadedCredentialsRef = useRef(false);

	useEffect(() => {
		if (hasLoadedCredentialsRef.current) {
			return;
		}

		hasLoadedCredentialsRef.current = true;
		loadCredentialsOnMount();
	}, [loadCredentialsOnMount]);

	// Handle OAuth callback from PingOne redirect (URL parameters)
	React.useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const authCode = urlParams.get('code');
		const authState = urlParams.get('state');
		const authError = urlParams.get('error');
		const errorDescription = urlParams.get('error_description');

		// Only process if we have OAuth callback parameters
		if (authCode || authError) {
			console.log(` [${flowType.toUpperCase()}-V3] Processing OAuth callback from URL:`, {
				hasCode: !!authCode,
				hasError: !!authError,
				authError,
				errorDescription,
			});

			if (authError) {
				console.error(
					` [${flowType.toUpperCase()}-V3] Authorization error:`,
					authError,
					errorDescription
				);
				showGlobalError('Authorization failed', `${errorDescription || authError}`);

				// Clear URL parameters
				window.history.replaceState({}, '', window.location.pathname);
				return;
			}

			if (authCode) {
				console.log(
					` [${flowType.toUpperCase()}-V3] Authorization code received from PingOne redirect!`
				);

				// Set the authorization code and state
				setAuthCode(authCode);
				setState(authState || '');

				// Store in session storage for persistence
				sessionStorage.setItem(`${flowType}_v3_auth_code`, authCode);
				if (authState) {
					sessionStorage.setItem(`${flowType}_v3_state`, authState);
				}

				// Mark callback handling as completed
				saveStepResult('handle-callback', true);

				// Show success message to user
				showGlobalSuccess(
					'Authorization code received',
					'PingOne redirected back with a code. Continue to the token exchange step.'
				);

				// Show success modal if configured
				if (flowConfig.showSuccessModal) {
					setShowAuthSuccessModal(true);
				}

				// Auto-advance to token exchange step
				if (stepManager.isInitialized) {
					// Check if credentials step is skipped to determine correct index (flow-specific)
					const skipCredentialsStep =
						localStorage.getItem(`${flowType}_v3_skip_credentials_step`) === 'true';
					const tokenExchangeStepIndex = skipCredentialsStep ? 3 : 4; // Adjust based on whether credentials step is present

					stepManager.setStep(tokenExchangeStepIndex, 'callback completed');
					console.log(
						` [${flowType.toUpperCase()}-V3] Advanced to token exchange step at index ${tokenExchangeStepIndex} (credentials skipped: ${skipCredentialsStep})`
					);
				}

				// Clear URL parameters to clean up the URL
				window.history.replaceState({}, '', window.location.pathname);

				console.log(
					` [${flowType.toUpperCase()}-V3] Callback processing completed, advanced to token exchange step`
				);
			}
		}
	}, [flowType, stepManager, saveStepResult, flowConfig.showSuccessModal]);

	// Generate PKCE codes
	const generatePKCE = useCallback(async () => {
		try {
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);

			const newPkceCodes = {
				codeVerifier,
				codeChallenge,
				codeChallengeMethod: 'S256' as const,
			};

			setPkceCodes(newPkceCodes);

			// Store code verifier for token exchange
			sessionStorage.setItem(`${flowType}_v3_code_verifier`, codeVerifier);

			console.log(` [${flowType.toUpperCase()}-V3] Generated PKCE codes`);
			showGlobalSuccess(
				'PKCE ready',
				'Verifier and challenge generated. You can now build the authorization request.'
			);
		} catch (error) {
			console.error(` [${flowType.toUpperCase()}-V3] PKCE generation failed:`, error);
			showGlobalError('Failed to generate PKCE codes');
		}
	}, [flowType]);

	// Generate authorization URL
	const generateAuthUrl = useCallback(() => {
		// Clear any previous callback processing flags to prevent loops
		sessionStorage.removeItem('v3_callback_processed');
		console.log(
			` [${flowType.toUpperCase()}-V3] Cleared callback processing flag for new authorization`
		);
		try {
			if (!credentials.environmentId || !credentials.clientId) {
				throw new Error('Environment ID and Client ID are required');
			}

			const stateValue = generateCodeVerifier().substring(0, 16);
			const nonce = generateCodeVerifier().substring(0, 16);

			setState(stateValue);

			// Store values for later use
			sessionStorage.setItem(`${flowType}_v3_state`, stateValue);
			sessionStorage.setItem(`${flowType}_v3_nonce`, nonce);
			sessionStorage.setItem(`${flowType}_v3_redirect_uri`, credentials.redirectUri);

			// Store flow context for callback handling (flow-specific)
			sessionStorage.setItem(
				`${flowType}_v3_flowContext`,
				JSON.stringify({
					flow: `${flowType}-authorization-code-v3`,
					redirectUri: credentials.redirectUri,
				})
			);

			// Also store generic flowContext for NewAuthContext compatibility
			sessionStorage.setItem(
				'flowContext',
				JSON.stringify({
					flow: `${flowType}-authorization-code-v3`,
					redirectUri: credentials.redirectUri,
				})
			);

			const authEndpoint =
				credentials.environmentId !== 'custom'
					? `https://auth.pingone.com/${credentials.environmentId}/as/authorize`
					: credentials.issuerUrl
						? `${credentials.issuerUrl.replace(/\/$/, '')}/as/authorize`
						: '';

			console.log(` [${flowType.toUpperCase()}-V3] COMPREHENSIVE REDIRECT URI DEBUG:`, {
				credentialsRedirectUri: credentials.redirectUri,
				willBeStoredAs: `${flowType}_v3_redirect_uri`,
				authEndpoint,
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				currentUrl: window.location.href,
				origin: window.location.origin,
				expectedCallback: getCallbackUrlForFlow('authorization-code'),
				allSessionStorageKeys: Object.keys(sessionStorage).filter((key) =>
					key.includes('redirect')
				),
				allLocalStorageKeys: Object.keys(localStorage).filter(
					(key) => key.includes('redirect') || key.includes('uri')
				),
				pingOneConfigRedirects: localStorage.getItem('pingone_config')
					? JSON.parse(localStorage.getItem('pingone_config') || '{}')
					: null,
			});

			const scopeToUse = credentials.scope || 'openid profile email';
			console.log(` [${flowType.toUpperCase()}-V3] SCOPE DEBUG - Using scopes:`, {
				credentialsScope: credentials.scope,
				defaultScope: 'openid profile email',
				finalScope: scopeToUse,
				flowType: flowType,
			});

			const params = new URLSearchParams({
				client_id: credentials.clientId,
				response_type: credentials.responseType || 'code',
				redirect_uri: credentials.redirectUri,
				scope: scopeToUse,
				state: stateValue,
				code_challenge: pkceCodes.codeChallenge,
				code_challenge_method: pkceCodes.codeChallengeMethod,
			});

			// Add custom parameters from flow configuration
			if (flowConfig.customParams && Object.keys(flowConfig.customParams).length > 0) {
				console.log(
					` [${flowType.toUpperCase()}-V3] Adding custom parameters:`,
					flowConfig.customParams
				);
				Object.entries(flowConfig.customParams).forEach(([key, value]) => {
					if (key && value) {
						params.set(key, value);
					}
				});
			}

			// Add OIDC-specific parameters for OIDC flows
			if (flowType === 'oidc') {
				// Use configured nonce or generated nonce
				const nonceValue = flowConfig.nonce || nonce;
				params.set('nonce', nonceValue);

				// Add other OIDC parameters from flow configuration
				if (flowConfig.maxAge && flowConfig.maxAge > 0) {
					params.set('max_age', flowConfig.maxAge.toString());
				}

				if (flowConfig.prompt && flowConfig.prompt !== 'none') {
					params.set('prompt', flowConfig.prompt);
				}

				if (flowConfig.loginHint) {
					params.set('login_hint', flowConfig.loginHint);
				}

				if (flowConfig.acrValues && flowConfig.acrValues.length > 0) {
					// Filter out invalid ACR values before adding to URL
					const validAcrValues = flowConfig.acrValues.filter(
						(acr) =>
							acr &&
							acr.trim() !== '' &&
							!/^[0-9]+$/.test(acr) && // Remove single digits like '1', '2', '3'
							(acr.startsWith('urn:') || acr.length > 3) // Must be URN or meaningful string
					);

					if (validAcrValues.length > 0) {
						params.set('acr_values', validAcrValues.join(' '));
						console.log(` [${flowType.toUpperCase()}-V3] Added valid ACR values:`, validAcrValues);
					} else {
						console.warn(
							`! [${flowType.toUpperCase()}-V3] No valid ACR values found, skipping acr_values parameter`
						);
					}
				}

				console.log(` [${flowType.toUpperCase()}-V3] Added OIDC parameters:`, {
					nonce: nonceValue ? `${nonceValue.substring(0, 10)}...` : 'none',
					maxAge: flowConfig.maxAge,
					prompt: flowConfig.prompt,
					loginHint: flowConfig.loginHint,
					acrValues: flowConfig.acrValues,
				});
			}

			// Use configured state if available
			if (flowConfig.state) {
				params.set('state', flowConfig.state);
				console.log(` [${flowType.toUpperCase()}-V3] Using configured state parameter`);
			}

			const url = `${authEndpoint}?${params.toString()}`;
			setAuthUrl(url);

			console.log(` [${flowType.toUpperCase()}-V3] FINAL AUTHORIZATION URL DEBUG:`, {
				fullUrl: url,
				authEndpoint: authEndpoint,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri,
				scopes: scopeToUse,
				state: stateValue,
				codeChallenge: pkceCodes.codeChallenge,
				environmentId: credentials.environmentId,
				flowType: flowType,
				allParams: Object.fromEntries(params.entries()),
			});

			showGlobalSuccess(
				'Authorization URL ready',
				'PingOne authorize endpoint prepared with your parameters.'
			);
		} catch (error) {
			console.error(` [${flowType.toUpperCase()}-V3] Authorization URL generation failed:`, error);

			// Provide helpful error message for scope issues
			if (error.message.includes('scope')) {
				showGlobalError(
					`Scope configuration error: ${error.message}. Please ensure 'openid profile email' scopes are configured in your PingOne application.`
				);
			} else {
				showGlobalError(`Authorization URL generation failed: ${error.message}`);
			}
		}
	}, [credentials, pkceCodes, flowType, flowConfig]);

	// Direct popup authorization (without modal)
	const handlePopupAuthorizationDirect = useCallback(() => {
		if (!authUrl) return;

		setIsAuthorizing(true);

		// Store flow context for popup callback handling (flow-specific)
		sessionStorage.setItem(
			`${flowType}_v3_flowContext`,
			JSON.stringify({
				flow: `${flowType}-authorization-code-v3`,
				redirectUri: credentials.redirectUri,
			})
		);

		// Also store generic flowContext for NewAuthContext compatibility
		sessionStorage.setItem(
			'flowContext',
			JSON.stringify({
				flow: `${flowType}-authorization-code-v3`,
				redirectUri: credentials.redirectUri,
			})
		);

		const popup = window.open(
			authUrl,
			'oauth_popup',
			'width=600,height=700,scrollbars=yes,resizable=yes'
		);

		if (!popup) {
			setIsAuthorizing(false);
			showGlobalError('Popup blocked. Please allow popups and try again.');
			return;
		}

		const checkClosed = setInterval(() => {
			if (popup.closed) {
				clearInterval(checkClosed);
				setIsAuthorizing(false);
				console.log(` [${flowType.toUpperCase()}-V3] Popup closed`);
			}
		}, 1000);

		// Listen for messages from popup
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;

			if (event.data.type === `${flowType.toUpperCase()}_CALLBACK`) {
				const { code, state: receivedState } = event.data;

				if (code) {
					setAuthCode(code);
					setState(receivedState || '');
					setCanExchangeTokens(true);
					setIsAuthorizing(false);

					popup.close();
					clearInterval(checkClosed);

					console.log(` [${flowType.toUpperCase()}-V3] Authorization successful via popup`);
					showGlobalSuccess(
						'Popup complete',
						'PingOne returned an authorization code. You can now exchange it for tokens.'
					);

					// Auto-advance to token exchange step
					stepManager.setStep(5);
				}
			}
		};

		window.addEventListener('message', handleMessage);

		// Cleanup
		setTimeout(() => {
			window.removeEventListener('message', handleMessage);
			clearInterval(checkClosed);
		}, 300000); // 5 minutes timeout
	}, [authUrl, credentials.redirectUri, stepManager, flowType]);

	// Handle popup authorization (with optional modal)
	const handlePopupAuthorizationWithModal = useCallback(() => {
		if (!authUrl) return;

		// Check configuration setting for showing auth request modal (same key as Configuration screen)
		const globalFlowConfigKey = 'enhanced-flow-authorization-code';
		const globalFlowConfig = JSON.parse(localStorage.getItem(globalFlowConfigKey) || '{}');
		const shouldShowModal = globalFlowConfig.showAuthRequestModal === true;

		console.log(` [${flowType.toUpperCase()}-V3] Modal setting check:`, {
			shouldShowModal,
			globalFlowConfig,
			localFlowConfig: flowConfig,
		});

		// Show modal first if enabled in configuration
		if (shouldShowModal) {
			console.log(
				` [${flowType.toUpperCase()}-V3] Showing OAuth Authorization Request Modal (user preference)`
			);
			setShowAuthRequestModal(true);
			return;
		}

		console.log(
			` [${flowType.toUpperCase()}-V3] Modal disabled, proceeding directly with authorization (user preference)`
		);
		// Otherwise proceed directly
		handlePopupAuthorizationDirect();
	}, [authUrl, flowConfig, flowType, handlePopupAuthorizationDirect]);

	// Handle full redirect authorization (with optional modal)
	const handleFullRedirectAuthorizationDirect = useCallback(() => {
		if (!authUrl) return;

		// Store flow context for redirect callback handling (flow-specific)
		sessionStorage.setItem(
			`${flowType}_v3_flowContext`,
			JSON.stringify({
				flow: `${flowType}-authorization-code-v3`,
				redirectUri: credentials.redirectUri,
			})
		);

		// Also store generic flowContext for NewAuthContext compatibility
		sessionStorage.setItem(
			'flowContext',
			JSON.stringify({
				flow: `${flowType}-authorization-code-v3`,
				redirectUri: credentials.redirectUri,
			})
		);

		console.log(` [${flowType.toUpperCase()}-V3] Redirecting to authorization URL`);
		window.location.href = authUrl;
	}, [authUrl, credentials.redirectUri, flowType]);

	const handleFullRedirectAuthorizationWithModal = useCallback(() => {
		if (!authUrl) return;

		// Check configuration setting for showing auth request modal (same key as Configuration screen)
		const globalFlowConfigKey = 'enhanced-flow-authorization-code';
		const globalFlowConfig = JSON.parse(localStorage.getItem(globalFlowConfigKey) || '{}');
		const shouldShowModal = globalFlowConfig.showAuthRequestModal === true;

		console.log(` [${flowType.toUpperCase()}-V3] Full redirect modal setting check:`, {
			shouldShowModal,
			globalFlowConfig,
			localFlowConfig: flowConfig,
		});

		// Show modal first if enabled in configuration
		if (shouldShowModal) {
			console.log(
				` [${flowType.toUpperCase()}-V3] Showing OAuth Authorization Request Modal for redirect (user preference)`
			);
			setShowAuthRequestModal(true);
			return;
		}

		console.log(
			` [${flowType.toUpperCase()}-V3] Modal disabled, proceeding directly with full redirect (user preference)`
		);
		// Otherwise proceed directly
		handleFullRedirectAuthorizationDirect();
	}, [authUrl, flowConfig, flowType, handleFullRedirectAuthorizationDirect]);

	// Exchange tokens
	const exchangeTokens = useCallback(async () => {
		console.log(` [${flowType.toUpperCase()}-V3] Starting token exchange validation:`, {
			hasAuthCode: Boolean(authCode),
			authCodeLength: authCode?.length || 0,
			hasEnvironmentId: Boolean(credentials.environmentId),
			environmentId: credentials.environmentId,
			hasClientId: Boolean(credentials.clientId),
			clientId: credentials.clientId,
			hasClientSecret: Boolean(credentials.clientSecret),
			clientSecretLength: credentials.clientSecret?.length || 0,
			hasRedirectUri: Boolean(credentials.redirectUri),
			redirectUri: credentials.redirectUri,
		});

		if (!authCode || !credentials.environmentId || !credentials.clientId) {
			throw new Error('Authorization code, environment ID, and client ID are required');
		}

		setIsExchangingTokens(true);

		try {
			const codeVerifier = sessionStorage.getItem(`${flowType}_v3_code_verifier`);

			if (!codeVerifier) {
				throw new Error('Code verifier not found. Please restart the flow.');
			}

			const tokenEndpoint =
				credentials.environmentId !== 'custom'
					? `https://auth.pingone.com/${credentials.environmentId}/as/token`
					: credentials.issuerUrl
						? `${credentials.issuerUrl.replace(/\/$/, '')}/as/token`
						: '';

			// CRITICAL: Use the EXACT same redirect URI that was used in authorization request
			const storedRedirectUri =
				sessionStorage.getItem(`${flowType}_v3_redirect_uri`) || credentials.redirectUri;

			console.log(
				` [${flowType.toUpperCase()}-V3] COMPREHENSIVE REDIRECT URI DEBUG FOR TOKEN EXCHANGE:`,
				{
					credentialsRedirectUri: credentials.redirectUri,
					storedRedirectUri: storedRedirectUri,
					usingStoredValue: storedRedirectUri !== credentials.redirectUri,
					sessionStorageKey: `${flowType}_v3_redirect_uri`,
					allRedirectKeys: Object.keys(sessionStorage).filter((key) => key.includes('redirect')),
					sessionValues: {
						[`${flowType}_v3_redirect_uri`]: sessionStorage.getItem(`${flowType}_v3_redirect_uri`),
						[`${flowType}_v3_state`]: sessionStorage.getItem(`${flowType}_v3_state`),
						[`${flowType}_v3_nonce`]: sessionStorage.getItem(`${flowType}_v3_nonce`),
						[`${flowType}_v3_code_verifier`]: sessionStorage.getItem(
							`${flowType}_v3_code_verifier`
						),
					},
					currentUrl: window.location.href,
					origin: window.location.origin,
					expectedCallback: getCallbackUrlForFlow('authorization-code'),
				}
			);

			const requestBody = {
				grant_type: 'authorization_code',
				code: authCode,
				code_verifier: codeVerifier,
				client_id: credentials.clientId,
				redirect_uri: storedRedirectUri, // Use stored redirect URI to ensure exact match
				environment_id: credentials.environmentId, // Add environment_id for backend
			};

			console.log(` [${flowType.toUpperCase()}-V3] Original request body:`, {
				requestBody,
				authCode,
				codeVerifier,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri,
			});

			// Apply client authentication
			const authMethod: ClientAuthMethod =
				credentials.clientAuthMethod || (credentials.clientSecret ? 'client_secret_post' : 'none');
			const authMethodInfo = getAuthMethodSecurityLevel(authMethod);

			// Create the auth config object
			const _authConfig: ClientAuthConfig = {
				method: credentials.clientAuthMethod || 'client_secret_post',
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				tokenEndpoint: tokenEndpoint,
			};

			console.log(` [${flowType.toUpperCase()}-V3] Exchanging tokens:`, {
				tokenEndpoint,
				clientId: `${credentials.clientId.substring(0, 8)}...`,
				hasCodeVerifier: Boolean(codeVerifier),
				authMethod: authMethodInfo.level,
			});

			// Send the client authentication method to the backend
			const finalRequestBody = {
				grant_type: 'authorization_code',
				client_id: credentials.clientId,
				client_secret: credentials.clientSecret,
				code: authCode,
				redirect_uri: storedRedirectUri, // Use the stored redirect URI to ensure exact match
				code_verifier: codeVerifier,
				environment_id: credentials.environmentId,
				scope: flowType === 'oidc' ? 'openid profile email' : 'read write',
				client_auth_method: credentials.clientAuthMethod, // Tell backend which auth method to use
				...(credentials.includeX5tParameter && {
					includeX5tParameter: credentials.includeX5tParameter,
				}),
			};

			console.log(` [${flowType.toUpperCase()}-V3] Simplified token exchange request:`, {
				grant_type: finalRequestBody.grant_type,
				client_id: finalRequestBody.client_id
					? `${finalRequestBody.client_id.substring(0, 8)}...`
					: 'MISSING',
				environment_id: finalRequestBody.environment_id || 'MISSING',
				hasCode: !!finalRequestBody.code,
				hasCodeVerifier: !!finalRequestBody.code_verifier,
				hasClientSecret: !!finalRequestBody.client_secret,
				redirect_uri: finalRequestBody.redirect_uri,
				redirect_uri_match:
					finalRequestBody.redirect_uri === credentials.redirectUri ? 'MATCH' : 'MISMATCH',
				scope: finalRequestBody.scope,
			});

			// CRITICAL: Show user exactly what redirect URI should be configured in PingOne
			console.log(
				` [${flowType.toUpperCase()}-V3] IMPORTANT - CONFIGURE THIS REDIRECT URI IN PINGONE:`
			);
			console.log(`   Environment ID: ${finalRequestBody.environment_id}`);
			console.log(`   Redirect URI: ${finalRequestBody.redirect_uri}`);
			console.log(
				`   PingOne Console: https://console.pingone.com/index.html?env=${finalRequestBody.environment_id}`
			);
			console.log(
				`   Path: Applications  Your App  Configuration  Redirect URIs  Add: ${finalRequestBody.redirect_uri}`
			);

			// CRITICAL: Validate required parameters before sending
			if (!finalRequestBody.client_id || finalRequestBody.client_id.trim() === '') {
				throw new Error('Client ID is required for token exchange');
			}
			if (!finalRequestBody.environment_id || finalRequestBody.environment_id.trim() === '') {
				throw new Error('Environment ID is required for token exchange');
			}
			if (!finalRequestBody.code || finalRequestBody.code.trim() === '') {
				throw new Error('Authorization code is required for token exchange');
			}
			if (!finalRequestBody.code_verifier || finalRequestBody.code_verifier.trim() === '') {
				throw new Error('Code verifier is required for PKCE token exchange');
			}

			const response = await fetch('/api/token-exchange', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(finalRequestBody),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));

				// Special handling for redirect URI mismatch
				if (
					errorData.error === 'invalid_grant' &&
					errorData.error_description?.includes('redirect URI')
				) {
					const helpfulError = `
 REDIRECT URI MISMATCH ERROR:

The redirect URI in your token exchange request doesn't match what's configured in PingOne.

Current Request:
- Redirect URI: ${finalRequestBody.redirect_uri}
- Environment ID: ${finalRequestBody.environment_id}

SOLUTION: Add this redirect URI to your PingOne application:
1. Go to: https://console.pingone.com/index.html?env=${finalRequestBody.environment_id}
2. Navigate to: Applications  Your App  Configuration  Redirect URIs
3. Add this exact URI: ${finalRequestBody.redirect_uri}
4. Save your configuration

Original Error: ${errorData.error_description || errorData.error}
          `.trim();

					console.error(
						` [${flowType.toUpperCase()}-V3] Redirect URI mismatch error:`,
						helpfulError
					);
					showGlobalError(helpfulError);
					throw new Error(helpfulError);
				}

				throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
			}

			const tokenData = await response.json();

			console.log(` [${flowType.toUpperCase()}-V3] Token exchange successful:`, {
				flowType: flowType.toUpperCase(),
				hasAccessToken: Boolean(tokenData.access_token),
				hasRefreshToken: Boolean(tokenData.refresh_token),
				hasIdToken: Boolean(tokenData.id_token),
				shouldHaveIdToken: flowType === 'oidc' ? 'YES (OIDC)' : 'NO (OAuth)',
				tokenType: tokenData.token_type,
				expiresIn: tokenData.expires_in,
				scope: tokenData.scope,
				scopesRequested: finalRequestBody.scope,
			});

			console.log(` [${flowType.toUpperCase()}-V3] Setting tokens state:`, {
				tokenData,
				hasAccessToken: Boolean(tokenData.access_token),
				hasRefreshToken: Boolean(tokenData.refresh_token),
				hasIdToken: Boolean(tokenData.id_token),
				tokenType: tokenData.token_type,
				expiresIn: tokenData.expires_in,
			});

			setTokens(tokenData);

			// Track flow completion for dashboard status
			trackFlowCompletion(`${flowType}-authorization-code-v3`);

			// Store tokens using standardized storage for Token Management page compatibility
			const success = storeOAuthTokens(
				tokenData,
				`${flowType}-authorization-code-v3`,
				`${flowType.toUpperCase()} Authorization Code Flow V3`
			);
			if (success) {
				console.log(
					` [${flowType.toUpperCase()}-V3] Tokens stored successfully for Token Management page`
				);
			} else {
				console.warn(
					`! [${flowType.toUpperCase()}-V3] Failed to store tokens for Token Management page`
				);
			}

			// Store tokens in flow-specific sessionStorage
			sessionStorage.setItem(`${flowType}_v3_access_token`, tokenData.access_token || '');
			sessionStorage.setItem(`${flowType}_v3_refresh_token`, tokenData.refresh_token || '');
			sessionStorage.setItem(`${flowType}_v3_id_token`, tokenData.id_token || '');

			// For OIDC flows, validate ID token and custom claims
			if (flowType === 'oidc' && tokenData.id_token) {
				try {
					console.log(` [${flowType.toUpperCase()}-V3] Validating ID token and custom claims...`);

					// Validate ID token with custom claims
					const idTokenValidation = await validateIdToken(
						tokenData.id_token,
						credentials.clientId,
						credentials.issuerUrl || `https://auth.pingone.com/${credentials.environmentId}`,
						flowConfig.nonce || nonce,
						flowConfig.maxAge || undefined,
						tokenData.access_token
					);

					console.log(` [${flowType.toUpperCase()}-V3] ID token validation:`, {
						isValid: idTokenValidation.isValid,
						hasCustomClaims: Object.keys(flowConfig.customClaims || {}).length > 0,
						customClaimsFound: idTokenValidation.customClaimsFound || [],
						customClaimsValidation: idTokenValidation.customClaimsValidation || {},
					});

					if (!idTokenValidation.isValid) {
						console.warn(
							`! [${flowType.toUpperCase()}-V3] ID token validation failed:`,
							idTokenValidation.errors
						);
					}
				} catch (idTokenError) {
					console.warn(`! [${flowType.toUpperCase()}-V3] ID token validation error:`, idTokenError);
				}
			}

			// For OIDC flows, fetch user info if available
			if (flowType === 'oidc' && tokenData.access_token) {
				try {
					const userInfoResponse = await fetch('/api/userinfo', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							access_token: tokenData.access_token,
							environment_id: credentials.environmentId,
						}),
					});

					if (userInfoResponse.ok) {
						const userInfoData = await userInfoResponse.json();
						setUserInfo(userInfoData);
						console.log(` [${flowType.toUpperCase()}-V3] User info fetched successfully`);
					}
				} catch (userInfoError) {
					console.warn(`! [${flowType.toUpperCase()}-V3] User info fetch failed:`, userInfoError);
				}
			}

			// Save step result to prevent re-execution
			const stepResult = { tokens: tokenData, timestamp: Date.now() };
			console.log(
				` [${flowType.toUpperCase()}-V3] Saving step result for exchange-tokens:`,
				stepResult
			);
			saveStepResult('exchange-tokens', stepResult);

			showGlobalSuccess(
				'Token exchange successful',
				'PingOne returned tokens for this authorization code.'
			);

			// Force a re-render to ensure UI updates
			setTimeout(() => {
				stepManager.setStep(6); // Move to token validation step
			}, 100);

			// Return success result for EnhancedStepFlowV2
			return { success: true, tokens: tokenData, timestamp: Date.now() };
		} catch (error) {
			console.error(` [${flowType.toUpperCase()}-V3] Token exchange failed:`, error);
			showGlobalError(`Token exchange failed: ${error.message}`);
			throw error; // Re-throw so EnhancedStepFlowV2 can handle it
		} finally {
			setIsExchangingTokens(false);
		}
	}, [
		authCode,
		credentials,
		stepManager,
		flowType,
		flowConfig.customClaims,
		flowConfig.maxAge,
		flowConfig.nonce,
		saveStepResult,
	]);

	// Save credentials
	const saveCredentials = useCallback(async () => {
		setIsSavingCredentials(true);
		try {
			const environmentId =
				credentials.environmentId ||
				(credentials.issuerUrl?.includes('pingone')
					? credentials.issuerUrl.split('/')[4]
					: 'custom');

			const scopesToSave = credentials.scope
				? credentials.scope.split(' ')
				: flowType === 'oauth'
					? ['read', 'write']
					: ['openid', 'profile', 'email'];

			console.log(` [${flowType.toUpperCase()}-V3] Saving credentials:`, {
				environmentId: environmentId,
				clientId: `${credentials.clientId.substring(0, 8)}...`,
				redirectUri: credentials.redirectUri,
				scopeString: credentials.scope,
				scopesToSave: scopesToSave,
			});

			credentialManager.saveAuthzFlowCredentials({
				environmentId: environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: credentials.redirectUri,
				scopes: scopesToSave,
				authEndpoint:
					environmentId !== 'custom'
						? `https://auth.pingone.com/${environmentId}/as/authorize`
						: credentials.issuerUrl
							? `${credentials.issuerUrl.replace(/\/$/, '')}/as/authorize`
							: '',
				tokenAuthMethod: credentials.clientAuthMethod,
			});

			// Update save button state
			setHasCredentialsSaved(true);
			setHasUnsavedCredentialChanges(false);
			setOriginalCredentials({ ...credentials });
			console.log(
				' [UnifiedAuthorizationCodeFlowV3] Credentials saved, Save button will be disabled'
			);

			// Mark step as completed and advance to next step
			saveStepResult('setup-credentials', true);

			showGlobalSuccess('Credentials saved', 'Flow configuration stored for quick re-use.');

			// Auto-advance to next step after successful save
			setTimeout(() => {
				if (stepManager.isInitialized && stepManager.currentStepIndex === 0) {
					stepManager.setStep(1, 'credentials saved, advancing to PKCE step');
					console.log(
						' [UnifiedAuthorizationCodeFlowV3] Auto-advancing to next step after credential save'
					);
				}
			}, 1000); // Small delay to show success message
		} catch (error) {
			console.error(` [${flowType.toUpperCase()}-V3] Save credentials failed:`, error);
			showGlobalError('Save failed', "We couldn't persist the flow credentials. Please try again.");
		} finally {
			setIsSavingCredentials(false);
		}
	}, [
		credentials,
		flowType, // Mark step as completed and advance to next step
		saveStepResult,
		stepManager.currentStepIndex,
		stepManager.isInitialized,
		stepManager.setStep,
	]);

	// Handle closing credentials step
	const handleCloseCredentials = useCallback(() => {
		console.log(
			' [UnifiedAuthorizationCodeFlowV3] Closing credentials step, advancing to next step'
		);
		// Mark step as completed (even though not saved) and advance
		saveStepResult('setup-credentials', true);
		if (stepManager.isInitialized && stepManager.currentStepIndex === 0) {
			stepManager.setStep(1, 'credentials step closed, advancing to PKCE step');
		}
	}, [stepManager, saveStepResult]);

	// Clear credentials
	const clearCredentials = useCallback(() => {
		credentialManager.clearAllCredentials();
		setCredentials({
			environmentId: '',
			clientId: '',
			clientSecret: '',
			redirectUri: getCallbackUrlForFlow('authorization-code'),
			scope: flowType === 'oauth' ? 'read write' : 'openid',
			scopes: flowType === 'oauth' ? ['read', 'write'] : ['openid'],
			responseType: 'code',
			grantType: 'authorization_code',
			issuerUrl: '',
		});
		showGlobalSuccess('Credentials cleared', 'Flow settings have been reset to defaults.');
	}, [flowType]);

	// Reset flow
	const resetFlow = useCallback(async () => {
		console.log(` [${flowType.toUpperCase()}-V3] Reset flow initiated`);

		setIsResettingFlow(true);

		try {
			// Simulate a brief delay for better UX
			await new Promise((resolve) => setTimeout(resolve, 500));

			console.log(
				` [${flowType.toUpperCase()}-V3] Current step before reset:`,
				stepManager.currentStepIndex
			);

			// Clear any shared step state that might be interfering
			const sharedKeys = [
				'oauth-authz-v3',
				'oidc-authz-v3',
				'enhanced-authz-code-v2-step',
				'oauth_v3_flow_steps',
				'oidc_v3_flow_steps',
			];

			sharedKeys.forEach((key) => {
				localStorage.removeItem(key);
				sessionStorage.removeItem(key);
			});

			console.log(` [${flowType.toUpperCase()}-V3] Cleared shared step state keys:`, sharedKeys);

			// Clear all state
			setPkceCodes({
				codeVerifier: '',
				codeChallenge: '',
				codeChallengeMethod: 'S256',
			});
			setAuthUrl('');
			setAuthCode('');
			setState('');
			setTokens(null);
			setUserInfo(null);
			setCanExchangeTokens(false);

			// Clear session storage
			sessionStorage.removeItem(`${flowType}_v3_code_verifier`);
			sessionStorage.removeItem(`${flowType}_v3_state`);
			sessionStorage.removeItem(`${flowType}_v3_nonce`);
			sessionStorage.removeItem(`${flowType}_v3_redirect_uri`);
			sessionStorage.removeItem(`${flowType}_v3_auth_code`);
			sessionStorage.removeItem(`${flowType}_v3_access_token`);
			sessionStorage.removeItem(`${flowType}_v3_refresh_token`);
			sessionStorage.removeItem(`${flowType}_v3_id_token`);
			sessionStorage.removeItem(`${flowType}_v3_step_results`);
			sessionStorage.removeItem(`${flowType}_v3_flowContext`);
			sessionStorage.removeItem('flowContext'); // Clear generic flowContext too
			sessionStorage.removeItem('v3_callback_processed'); // Clear callback processing flag

			console.log(` [${flowType.toUpperCase()}-V3] Cleared session storage, resetting to step 0`);

			// Reset to first step
			stepManager.setStep(0);

			console.log(
				` [${flowType.toUpperCase()}-V3] Step after reset:`,
				stepManager.currentStepIndex
			);

			showGlobalSuccess(
				'Flow reset',
				`Cleared ${flowType.toUpperCase()} state so you can restart from step one.`
			);

			// AGGRESSIVE SCROLL TO TOP - try all methods
			console.log(
				`[${flowType.toUpperCase()}-V3] AGGRESSIVE SCROLL - position before:`,
				window.pageYOffset
			);

			// Method 1: Immediate scroll
			window.scrollTo(0, 0);
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;

			// Method 2: Centralized system
			scrollToTopAfterAction();

			// Method 3: Force scroll all containers
			const scrollAllContainers = () => {
				// Scroll main window
				window.scrollTo({ top: 0, behavior: 'instant' });

				// Scroll all possible containers
				const containers = [
					document.documentElement,
					document.body,
					document.querySelector('main'),
					document.querySelector('[data-scrollable]'),
					document.querySelector('.app-container'),
					document.querySelector('.page-container'),
				];

				containers.forEach((container) => {
					if (container) {
						container.scrollTop = 0;
						if (container.scrollTo) {
							container.scrollTo(0, 0);
						}
					}
				});

				console.log(`[${flowType.toUpperCase()}-V3] Force scrolled all containers`);
			};

			// Execute force scroll immediately and with delays
			scrollAllContainers();
			setTimeout(scrollAllContainers, 50);
			setTimeout(scrollAllContainers, 200);
			setTimeout(scrollAllContainers, 500);

			// Final verification
			setTimeout(() => {
				console.log(`[${flowType.toUpperCase()}-V3] FINAL scroll position:`, window.pageYOffset);
				if (window.pageYOffset > 0) {
					console.log(
						`[${flowType.toUpperCase()}-V3] Scroll failed - still at position:`,
						window.pageYOffset
					);
					// One more desperate attempt
					window.scrollTo({ top: 0, behavior: 'instant' });
					document.documentElement.scrollTop = 0;
					document.body.scrollTop = 0;
				} else {
					console.log(`[${flowType.toUpperCase()}-V3] Scroll successful - at top!`);
				}
			}, 1000);
		} catch (error) {
			console.error(` [${flowType.toUpperCase()}-V3] Reset flow failed:`, error);
			showGlobalError('Reset failed', "We couldn't clear the flow state. Please try again.");
		} finally {
			setIsResettingFlow(false);
		}
	}, [stepManager, flowType, scrollToTopAfterAction]);

	// Navigate to Token Management
	const navigateToTokenManagement = useCallback(
		(tokenType: 'access' | 'refresh' | 'id') => {
			console.log(` [${flowType.toUpperCase()}-V3] Navigate to token management:`, {
				tokenType,
				tokens,
				hasTokens: !!tokens,
				hasAccessToken: !!tokens?.access_token,
				hasRefreshToken: !!tokens?.refresh_token,
				hasIdToken: !!tokens?.id_token,
			});

			const token =
				tokenType === 'access'
					? tokens?.access_token
					: tokenType === 'refresh'
						? tokens?.refresh_token
						: tokens?.id_token;

			if (token) {
				console.log(` [${flowType.toUpperCase()}-V3] Token found, storing for analysis:`, {
					tokenType,
					tokenLength: token.length,
					tokenPreview: `${token.substring(0, 20)}...`,
				});

				// Store the token for the Token Management page
				sessionStorage.setItem('token_to_analyze', token);
				sessionStorage.setItem('token_type', tokenType);
				sessionStorage.setItem('flow_source', `${flowType}-v3`);

				console.log(` [${flowType.toUpperCase()}-V3] Navigating to token management page...`);
				window.location.href = '/token-management';
			} else {
				console.error(
					` [${flowType.toUpperCase()}-V3] No ${tokenType} token available for analysis`
				);
				showGlobalError(`No ${tokenType} token available for analysis`);
			}
		},
		[tokens, flowType]
	);

	// Copy UserInfo to clipboard
	const copyUserInfo = useCallback(async () => {
		if (userInfo) {
			try {
				await copyToClipboard(JSON.stringify(userInfo, null, 2));
				showGlobalSuccess('UserInfo copied', 'OIDC user information saved to your clipboard.');
			} catch (_error) {
				showGlobalError(
					'Copy failed',
					"We couldn't copy the PingOne user information to your clipboard."
				);
			}
		}
	}, [userInfo]);

	const getUserInfo = useCallback(async () => {
		if (!tokens?.access_token) {
			showGlobalError('No access token available', 'Generate tokens before requesting UserInfo.');
			return;
		}

		setIsGettingUserInfo(true);
		try {
			const userInfoEndpoint =
				credentials.userInfoEndpoint ||
				(credentials.environmentId
					? `https://auth.pingone.com/${credentials.environmentId}/as/userinfo`
					: '');

			if (!userInfoEndpoint) {
				showGlobalError(
					'UserInfo endpoint missing',
					'Set an environment ID or explicit UserInfo endpoint to continue.'
				);
				return;
			}

			const response = await fetch(userInfoEndpoint, {
				headers: {
					Authorization: `Bearer ${tokens.access_token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`UserInfo request failed: ${response.status} ${errorText}`);
			}

			const userInfoData = await response.json();
			setUserInfo(userInfoData);

			showGlobalSuccess(
				'UserInfo Retrieved',
				'Successfully fetched user information from PingOne.'
			);
		} catch (error) {
			console.error('[OIDC-V3] UserInfo request failed:', error);
			showGlobalError(
				'UserInfo Request Failed',
				error instanceof Error ? error.message : 'Unknown error occurred.'
			);
		} finally {
			setIsGettingUserInfo(false);
		}
	}, [tokens?.access_token, credentials.userInfoEndpoint, credentials.environmentId]);

	// Create steps based on flow type
	const steps = React.useMemo(() => {
		console.log(` [${flowType.toUpperCase()}-V3] Creating steps with current state:`, {
			authCode: authCode ? `${authCode.substring(0, 10)}...` : 'NONE',
			hasCredentials: Boolean(credentials.environmentId && credentials.clientId),
			credentials: {
				environmentId: credentials.environmentId
					? `${credentials.environmentId.substring(0, 10)}...`
					: 'MISSING',
				clientId: credentials.clientId ? `${credentials.clientId.substring(0, 10)}...` : 'MISSING',
				redirectUri: credentials.redirectUri || 'MISSING',
			},
		});

		// Check if user has chosen to skip credentials step (flow-specific)
		const skipCredentialsStep =
			localStorage.getItem(`${flowType}_v3_skip_credentials_step`) === 'true';

		if (skipCredentialsStep) {
			console.log(' [UnifiedAuthorizationCodeFlowV3] Skipping credentials step (user preference)');
		}

		const credentialsStep = {
			...createCredentialsStep(
				credentials,
				setCredentials,
				saveCredentials,
				`${flowType.toUpperCase()} Authorization Code Flow`,
				handleCloseCredentials,
				`${flowType}_v3`,
				showSecret,
				setShowSecret
			),
			canExecute: Boolean(
				credentials.environmentId &&
					credentials.clientId &&
					credentials.clientSecret &&
					credentials.redirectUri &&
					(!hasCredentialsSaved || hasUnsavedCredentialChanges)
			),
			buttonText: isSavingCredentials
				? 'Saving...'
				: hasCredentialsSaved && !hasUnsavedCredentialChanges
					? 'Saved'
					: 'Save Configuration',
			completed: hasStepResult('setup-credentials'),
		};

		const baseSteps = [
			// Only include credentials step if user hasn't chosen to skip it
			...(skipCredentialsStep ? [] : [credentialsStep]),
			{
				...createPKCEStep(pkceCodes, setPkceCodes, generatePKCE),
				canExecute: Boolean(credentials.environmentId && credentials.clientId),
				completed: hasStepResult('generate-pkce'),
			},
			{
				...createAuthUrlStep(
					authUrl,
					generateAuthUrl,
					credentials,
					pkceCodes,
					undefined,
					undefined,
					isAuthorizing,
					showExplainer,
					setShowExplainer
				),
				canExecute: Boolean(
					credentials.environmentId &&
						credentials.clientId &&
						credentials.redirectUri &&
						pkceCodes.codeVerifier &&
						pkceCodes.codeChallenge &&
						!authCode // Disable after successful authentication
				),
				completed: hasStepResult('build-auth-url'),
			},
			{
				...createUserAuthorizationStep(
					authUrl,
					handlePopupAuthorizationWithModal,
					handleFullRedirectAuthorizationWithModal,
					isAuthorizing,
					authCode
				),
				canExecute: Boolean(authUrl && !authCode) || Boolean(authCode), // Allow execution when authenticated to enable Next button
				completed: hasStepResult('user-authorization') || Boolean(authCode),
			},
			{
				...createCallbackHandlingStep(authCode, resetFlow),
				canExecute: Boolean(authCode),
				completed: hasStepResult('handle-callback') || Boolean(authCode),
			},
			{
				...createTokenExchangeStep(
					authCode,
					tokens,
					async () => {
						await exchangeTokens();
					},
					credentials,
					isExchangingTokens,
					flowType
				),
				canExecute: (() => {
					const hasAuthCode = Boolean(authCode);
					const hasEnvironmentId = Boolean(credentials.environmentId);
					const hasClientId = Boolean(credentials.clientId);
					const canExec = hasAuthCode && hasEnvironmentId && hasClientId;

					console.log(` [${flowType.toUpperCase()}-V3] Token exchange canExecute check:`, {
						authCode: hasAuthCode ? `${authCode.substring(0, 10)}...` : 'MISSING',
						environmentId: hasEnvironmentId
							? `${credentials.environmentId.substring(0, 10)}...`
							: 'MISSING',
						clientId: hasClientId ? `${credentials.clientId.substring(0, 10)}...` : 'MISSING',
						hasTokens: Boolean(tokens?.access_token),
						canExecute: canExec,
						fullCredentials: credentials,
					});

					return canExec;
				})(),
				completed: (() => {
					const hasResult = hasStepResult('exchange-tokens');
					const hasTokens = Boolean(tokens?.access_token);
					const completed = hasResult || hasTokens;

					console.log(` [${flowType.toUpperCase()}-V3] Token exchange step completion check:`, {
						hasResult,
						hasTokens,
						tokensPresent: tokens ? 'YES' : 'NO',
						accessTokenPresent: tokens?.access_token ? 'YES' : 'NO',
						tokensKeys: tokens ? Object.keys(tokens) : 'NO_TOKENS',
						completed,
						stepResults: Object.keys(stepResults),
						stepResultsValues: stepResults,
					});

					return completed;
				})(),
			},
		];

		// Add flow-specific final steps
		console.log(` [${flowType.toUpperCase()}-V3] Adding flow-specific steps for ${flowType} flow`);

		if (flowType === 'oidc') {
			console.log(
				` [OIDC-V3] Adding OIDC-specific steps: Token Validation with ID Token and UserInfo`
			);
			// OIDC flow includes token validation and user info
			baseSteps.push(
				{
					id: 'validate-tokens',
					title: 'Validate Tokens & Token Management',
					description:
						'Validate the received tokens and use them with the Token Management page for detailed inspection.',
					icon: <FiShield />,
					category: 'validation',
					content: (
						<div>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.75rem',
									padding: '1rem',
									background: '#fef2f2',
									border: '1px solid #bfdbfe',
									color: '#1e40af',
									borderRadius: '6px',
									marginBottom: '1rem',
								}}
							>
								<FiShield />
								<div>
									<strong>Token Validation & Management</strong>
									<br />
									Your tokens are ready! Use the Token Management page to decode and inspect them.
								</div>
							</div>

							{tokens && (
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.75rem',
										padding: '1rem',
										background: '#f0fdf4',
										border: '1px solid #bbf7d0',
										color: '#15803d',
										borderRadius: '6px',
										marginBottom: '1rem',
									}}
								>
									<FiCheckCircle />
									<div>
										<strong> Tokens Received Successfully!</strong>
										<br />
										Access token, ID token, and refresh token are ready for use.
									</div>
								</div>
							)}

							{userInfo && (
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.75rem',
										padding: '1rem',
										background: '#fef3c7',
										border: '1px solid #fcd34d',
										color: '#92400e',
										borderRadius: '6px',
										marginBottom: '1rem',
									}}
								>
									<FiUser />
									<div>
										<strong> User Info Retrieved</strong>
										<br />
										User profile information has been fetched successfully.
									</div>
								</div>
							)}

							{/* Token Display Section */}
							{tokens && (
								<div style={{ marginTop: '1.5rem' }}>
									<h4
										style={{
											margin: '0 0 1rem 0',
											color: '#1f2937',
											fontSize: '1.1rem',
											fontWeight: '600',
										}}
									>
										Received Tokens
									</h4>

									{/* Access Token Display */}
									{tokens.access_token && (
										<div
											style={{
												background: '#f8fafc',
												border: '1px solid #e2e8f0',
												borderRadius: '8px',
												padding: '1rem',
												marginBottom: '1rem',
											}}
										>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '0.5rem',
													marginBottom: '0.75rem',
												}}
											>
												<strong style={{ color: '#1f2937', fontSize: '0.9rem' }}>
													Access Token:
												</strong>
												<ActionButton
													onClick={() => copyToClipboard(tokens.access_token, 'Access Token')}
													style={{
														fontSize: '0.75rem',
														padding: '0.25rem 0.5rem',
													}}
												>
													<FiCopy />
													Copy
												</ActionButton>
											</div>
											<div
												style={{
													background: '#f8fafc',
													border: '1px solid #86efac',
													borderRadius: '0.5rem',
													padding: '0.75rem',
													fontFamily: 'Monaco, Menlo, monospace',
													fontSize: '0.8rem',
													wordBreak: 'break-all',
													maxHeight: '100px',
													overflow: 'auto',
													boxShadow:
														'0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
												}}
											>
												{tokens.access_token}
											</div>
										</div>
									)}

									{/* Refresh Token Display */}
									{tokens.refresh_token && (
										<div
											style={{
												background: '#f8fafc',
												border: '1px solid #e2e8f0',
												borderRadius: '8px',
												padding: '1rem',
												marginBottom: '1rem',
											}}
										>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '0.5rem',
													marginBottom: '0.75rem',
												}}
											>
												<strong style={{ color: '#1f2937', fontSize: '0.9rem' }}>
													Refresh Token:
												</strong>
												<ActionButton
													onClick={() => copyToClipboard(tokens.refresh_token, 'Refresh Token')}
													style={{
														fontSize: '0.75rem',
														padding: '0.25rem 0.5rem',
													}}
												>
													<FiCopy />
													Copy
												</ActionButton>
											</div>
											<div
												style={{
													background: '#f8fafc',
													border: '1px solid #86efac',
													borderRadius: '0.5rem',
													padding: '0.75rem',
													fontFamily: 'Monaco, Menlo, monospace',
													fontSize: '0.8rem',
													wordBreak: 'break-all',
													maxHeight: '100px',
													overflow: 'auto',
													boxShadow:
														'0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
												}}
											>
												{tokens.refresh_token}
											</div>
										</div>
									)}

									{/* ID Token Display (for OIDC flows) */}
									{flowType === 'oidc' && tokens.id_token && (
										<div>
											<div
												style={{
													background: '#f8fafc',
													border: '1px solid #e2e8f0',
													borderRadius: '8px',
													padding: '1rem',
													marginBottom: '1rem',
												}}
											>
												<div
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '0.5rem',
														marginBottom: '0.75rem',
													}}
												>
													<strong style={{ color: '#1f2937', fontSize: '0.9rem' }}>
														ID Token:
													</strong>
													<ActionButton
														onClick={() => copyToClipboard(tokens.id_token, 'ID Token')}
														style={{
															fontSize: '0.75rem',
															padding: '0.25rem 0.5rem',
														}}
													>
														<FiCopy />
														Copy
													</ActionButton>
												</div>
												<div
													style={{
														background: 'white',
														border: '1px solid #d1d5db',
														borderRadius: '4px',
														padding: '0.75rem',
														fontFamily: 'Monaco, Menlo, monospace',
														fontSize: '0.8rem',
														wordBreak: 'break-all',
														maxHeight: '100px',
														overflow: 'auto',
													}}
												>
													{tokens.id_token}
												</div>
											</div>

											{/* ID Token Education Section */}
											<IDTokenEducationSection defaultCollapsed={true} />
										</div>
									)}
								</div>
							)}

							<div
								style={{
									display: 'flex',
									gap: '1rem',
									flexWrap: 'wrap',
									marginTop: '1rem',
								}}
							>
								<ActionButton onClick={() => navigateToTokenManagement('access')}>
									Decode Access Token
								</ActionButton>
								<ActionButton onClick={() => navigateToTokenManagement('id')}>
									Decode ID Token
								</ActionButton>
								<ActionButton onClick={() => navigateToTokenManagement('refresh')}>
									Decode Refresh Token
								</ActionButton>
							</div>

							{userInfo && (
								<div style={{ marginTop: '1rem' }}>
									<h4>User Info</h4>
									<div
										style={{
											background: '#f8fafc',
											border: '1px solid #e2e8f0',
											borderRadius: '8px',
											padding: '1rem',
											fontFamily: 'monospace',
											fontSize: '0.875rem',
											maxHeight: '300px',
											overflow: 'auto',
										}}
									>
										<pre>{JSON.stringify(userInfo, null, 2)}</pre>
									</div>
									<button
										type="button"
										onClick={copyUserInfo}
										style={{
											marginTop: '0.5rem',
											padding: '0.5rem 1rem',
											background: '#10b981',
											color: 'white',
											border: 'none',
											borderRadius: '6px',
											cursor: 'pointer',
										}}
									>
										Copy UserInfo
									</button>
								</div>
							)}
						</div>
					),
					canExecute: Boolean(tokens?.access_token),
					completed: Boolean(tokens?.access_token),
				},
				// Add refresh token step after OIDC token validation
				{
					...createRefreshTokenStep(
						tokens?.refresh_token ?? '',
						newTokensFromRefresh,
						exchangeRefreshToken,
						credentials,
						getUserInfo,
						navigateToTokenManagement,
						tokens,
						isRefreshingTokens,
						flowType
					),
					canExecute: Boolean(tokens?.refresh_token && !newTokensFromRefresh),
					completed: hasStepResult('refresh-token-exchange') || Boolean(newTokensFromRefresh),
					isFinalStep: true,
				}
			);
		} else {
			console.log(
				` [OAUTH-V3] Adding OAuth-specific steps: Token Analysis (NO ID Token, NO UserInfo)`
			);
			// OAuth flow has simpler final step
			baseSteps.push(
				{
					id: 'oauth-token-management',
					title: 'OAuth Token Analysis',
					description: 'Analyze and manage your OAuth tokens',
					icon: <FiCheckCircle />,
					status: tokens ? 'completed' : 'pending',
					canExecute: !!tokens,
					completed: !!tokens,
					isFinalStep: true,
					content: (
						<div>
							<InfoBox type="info">
								<FiCheckCircle />
								<div>
									<strong>OAuth 2.0 Token Exchange Complete</strong>
									<br />
									Your authorization code has been successfully exchanged for OAuth tokens. In OAuth
									2.0 (unlike OIDC), you receive only <strong>Access Tokens</strong> and{' '}
									<strong>Refresh Tokens</strong> - no ID tokens.
								</div>
							</InfoBox>

							{tokens && (
								<div style={{ margin: '1.5rem 0' }}>
									{/* Access Token Display */}
									<div
										style={{
											background: '#f8fafc',
											border: '1px solid #2196f3',
											borderRadius: '8px',
											padding: '1rem',
											marginBottom: '1rem',
										}}
									>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												marginBottom: '0.5rem',
											}}
										>
											<h4 style={{ margin: 0, color: '#1565c0' }}>Access Token</h4>
											<button
												type="button"
												onClick={() => copyToClipboard(tokens.access_token)}
												style={{
													background: '#2196f3',
													color: 'white',
													border: 'none',
													borderRadius: '4px',
													padding: '0.25rem 0.5rem',
													cursor: 'pointer',
													fontSize: '0.875rem',
												}}
											>
												Copy
											</button>
										</div>
										<p
											style={{
												margin: '0 0 0.5rem 0',
												fontSize: '0.875rem',
												color: '#1565c0',
											}}
										>
											Used to access protected resources on behalf of the user. Short-lived
											(typically 1 hour).
										</p>
										<code
											style={{
												display: 'block',
												background: 'white',
												padding: '0.5rem',
												borderRadius: '4px',
												fontSize: '0.75rem',
												wordBreak: 'break-all',
												border: '1px solid #e3f2fd',
											}}
										>
											{tokens.access_token}
										</code>
									</div>

									{/* Refresh Token Display */}
									{tokens.refresh_token && (
										<div
											style={{
												background: '#f8fafc',
												border: '1px solid #4caf50',
												borderRadius: '8px',
												padding: '1rem',
												marginBottom: '1rem',
											}}
										>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													marginBottom: '0.5rem',
												}}
											>
												<h4 style={{ margin: 0, color: '#2e7d32' }}>Refresh Token</h4>
												<button
													type="button"
													onClick={() => copyToClipboard(tokens.refresh_token)}
													style={{
														background: '#4caf50',
														color: 'white',
														border: 'none',
														borderRadius: '4px',
														padding: '0.25rem 0.5rem',
														cursor: 'pointer',
														fontSize: '0.875rem',
													}}
												>
													Copy
												</button>
											</div>
											<p
												style={{
													margin: '0 0 0.5rem 0',
													fontSize: '0.875rem',
													color: '#2e7d32',
												}}
											>
												<strong>Refresh Token Purpose:</strong> Used to obtain new access tokens
												when they expire, without requiring user re-authentication. Long-lived
												(typically 30 days) and should be stored securely.
												<br />
												<br />
												<strong>How to use:</strong> Send a POST request to the token endpoint with
												grant_type=refresh_token to get a new access token.
											</p>
											<code
												style={{
													display: 'block',
													background: 'white',
													padding: '0.5rem',
													borderRadius: '4px',
													fontSize: '0.75rem',
													wordBreak: 'break-all',
													border: '1px solid #e8f5e8',
												}}
											>
												{tokens.refresh_token}
											</code>
										</div>
									)}

									{/* Action Buttons */}
									<div
										style={{
											display: 'flex',
											gap: '1rem',
											flexWrap: 'wrap',
											marginTop: '1.5rem',
										}}
									>
										<ActionButton onClick={() => navigateToTokenManagement('access')}>
											Decode Access Token
										</ActionButton>
										{tokens.refresh_token && (
											<ActionButton onClick={() => navigateToTokenManagement('refresh')}>
												Decode Refresh Token
											</ActionButton>
										)}

										<ActionButton
											onClick={resetFlow}
											style={{
												backgroundColor: '#ffcdd2',
												color: '#d32f2f',
												border: '1px solid #f44336',
											}}
										>
											Restart OAuth Flow
										</ActionButton>
									</div>
								</div>
							)}
						</div>
					),
				},
				// Add refresh token step after OAuth token analysis
				{
					...createRefreshTokenStep(
						tokens?.refresh_token ?? '',
						newTokensFromRefresh,
						exchangeRefreshToken,
						credentials,
						getUserInfo,
						navigateToTokenManagement,
						tokens,
						isRefreshingTokens,
						flowType
					),
					canExecute: Boolean(tokens?.refresh_token && !newTokensFromRefresh),
					completed: hasStepResult('refresh-token-exchange') || Boolean(newTokensFromRefresh),
					isFinalStep: true,
				}
			);
		}

		return baseSteps;
	}, [
		credentials.environmentId,
		credentials.clientId,
		credentials.clientSecret,
		credentials.redirectUri,
		pkceCodes.codeVerifier,
		pkceCodes.codeChallenge,
		authUrl,
		authCode,
		tokens?.access_token,
		tokens?.refresh_token,
		newTokensFromRefresh,
		isExchangingTokens,
		isRefreshingTokens,
		flowType,
		hasCredentialsSaved,
		hasUnsavedCredentialChanges,
		isSavingCredentials,
		navigateToTokenManagement,
		resetFlow,
		tokens,
		exchangeTokens,
		generateAuthUrl,
		generatePKCE,
		handleCloseCredentials,
		handleFullRedirectAuthorizationWithModal,
		handlePopupAuthorizationWithModal,
		hasStepResult,
		pkceCodes,
		showSecret,
		showExplainer,
		stepResults,
		saveCredentials,
		exchangeRefreshToken,
		credentials,
		copyUserInfo,
		isAuthorizing,
		userInfo,
		getUserInfo,
	]);

	const flowTitle =
		flowType === 'oauth'
			? ' OAuth 2.0 Authorization Code Flow (V3)'
			: ' OIDC Authorization Code Flow (V3)';

	const flowDescription =
		flowType === 'oauth'
			? 'A pure OAuth 2.0 Authorization Code Flow for resource access. This flow focuses solely on obtaining an Access Token for API access.'
			: 'A comprehensive OpenID Connect authorization code journey tailored for apps that require user authentication, profile data, and secure API access.';

	const flowIntroCopy =
		flowType === 'oauth' ? undefined : (
			<p>
				The OIDC authorization code flow extends OAuth by returning ID tokens and standard user
				claims. It is the recommended option for web apps that need to authenticate users, build
				profiles, and call backend APIs with access tokens.
			</p>
		);

	const flowBullets =
		flowType === 'oauth'
			? [
					'Focuses on secure API access with authorization codes',
					'PKCE optional for confidential clients, required for public clients',
					'Supports state and advanced OAuth parameters',
				]
			: [
					'Handles login, token issuance, and user profile retrieval',
					'PKCE optional for confidential clients, required for public clients',
					'Supports state, nonce, and advanced OIDC parameters',
				];

	const flowWarning =
		flowType === 'oauth'
			? {
					title: 'Setup Tip',
					body: 'Populate the configuration below before starting the flow. Saved values persist so you can rerun without re-entering credentials.',
					icon: <FiSettings />,
				}
			: {
					title: 'Security Reminder',
					body: 'Validate the state parameter, generate unique nonce values, and safeguard client secrets to maintain OIDC security.',
					icon: <FiShield />,
				};

	return (
		<Container>
			<HeroSection $variant={flowType === 'oidc' ? 'oidc' : 'oauth'}>
				<FlowIntro
					title={flowTitle}
					description={flowDescription}
					introCopy={flowIntroCopy}
					bullets={flowBullets}
					warningTitle={flowWarning.title}
					warningBody={flowWarning.body}
					warningIcon={flowWarning.icon}
					illustration={
						flowType === 'oidc'
							? '/images/flows/oidc-auth-code-flow.svg'
							: '/images/flows/auth-code-flow.svg'
					}
					illustrationAlt="Authorization code flow overview"
				/>
			</HeroSection>

			<ConfigCard>
				<FlowConfiguration
					config={flowConfig}
					onConfigChange={handleFlowConfigChange}
					flowType={flowType === 'oidc' ? 'oidc-authorization-code' : 'oauth-authorization-code'}
					initialExpanded={false}
					title="Flow Configuration"
					subtitle="Configure OAuth 2.0 and OpenID Connect specific settings"
				/>
			</ConfigCard>

			<FlowCard>
				{/* Show credentials step reset option if user has hidden it */}
				{localStorage.getItem(`${flowType}_v3_skip_credentials_step`) === 'true' && (
					<div
						style={{
							marginTop: '1rem',
							padding: '0.75rem',
							backgroundColor: '#fef3c7',
							border: '1px solid #f59e0b',
							borderRadius: '0.5rem',
							fontSize: '0.875rem',
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							<span style={{ color: '#92400e' }}>
								i Credentials step is hidden (you chose "Do not show again")
							</span>
							<button
								type="button"
								onClick={() => {
									localStorage.removeItem(`${flowType}_v3_skip_credentials_step`);
									console.log(` [${flowType.toUpperCase()}-V3] Reset credentials step preference`);
									window.location.reload(); // Refresh to show the step
								}}
								style={{
									padding: '0.25rem 0.5rem',
									fontSize: '0.75rem',
									backgroundColor: '#f59e0b',
									color: 'white',
									border: 'none',
									borderRadius: '0.25rem',
									cursor: 'pointer',
								}}
							>
								Show Again
							</button>
						</div>
					</div>
				)}

				{/* Main Step Flow */}
				<EnhancedStepFlowV2
					steps={steps}
					title={flowTitle}
					persistKey={`${flowType}_v3_flow_steps`}
					initialStepIndex={stepManager.currentStepIndex}
					onStepChange={stepManager.setStep}
					autoAdvance={false}
					showDebugInfo={false}
					allowStepJumping={true}
					onStepComplete={(stepId, result) => {
						console.log(` [${flowType.toUpperCase()}-V3] Step completed:`, stepId, result);
					}}
				/>

				{/* Flow Control Actions */}
				<FlowControlSection>
					<FlowControlTitle> Flow Control Actions</FlowControlTitle>
					<FlowControlButtons>
						<FlowControlButton className="clear" onClick={clearCredentials}>
							Clear Credentials
						</FlowControlButton>
						<FlowControlButton
							className="debug"
							onClick={(e) => {
								e.preventDefault();
								console.log(' [DEBUG] Manual credential reload triggered - button clicked!');
								console.log(' [DEBUG] Current localStorage keys:', Object.keys(localStorage));
								console.log(' [DEBUG] Current credentials state:', credentials);
								console.log(' [DEBUG] Flow type:', flowType);

								// Try to reload credentials
								const allCredentials = credentialManager.loadAuthzFlowCredentials();
								console.log(' [DEBUG] Loaded authz flow credentials:', allCredentials);

								const configCredentials = credentialManager.loadConfigCredentials();
								console.log(' [DEBUG] Loaded config credentials:', configCredentials);

								const permanentCredentials = credentialManager.loadPermanentCredentials();
								console.log(' [DEBUG] Loaded permanent credentials:', permanentCredentials);

								// Show comprehensive redirect URI debugging
								const debugInfo = {
									currentUrl: window.location.href,
									origin: window.location.origin,
									expectedCallback: getCallbackUrlForFlow('authorization-code'),
									credentialsRedirectUri: credentials.redirectUri,
									environmentId: credentials.environmentId,
									clientId: credentials.clientId,
									allLocalStorageKeys: Object.keys(localStorage),
									allSessionStorageKeys: Object.keys(sessionStorage),
								};

								console.log(' [COMPREHENSIVE DEBUG] Full application state:', debugInfo);
								alert(
									`Debug Info:\n\nCurrent URL: ${debugInfo.currentUrl}\nOrigin: ${debugInfo.origin}\nExpected Callback: ${debugInfo.expectedCallback}\nCredentials Redirect URI: ${debugInfo.credentialsRedirectUri}\n\nCheck console for full details.`
								);
							}}
						>
							Debug Credentials
						</FlowControlButton>
						<FlowControlButton
							className="reset"
							onClick={resetFlow}
							disabled={isResettingFlow}
							style={{
								background: isResettingFlow ? '#9ca3af' : undefined,
								cursor: isResettingFlow ? 'not-allowed' : 'pointer',
							}}
						>
							<FiRotateCcw
								style={{
									animation: isResettingFlow ? 'spin 1s linear infinite' : 'none',
									marginRight: '0.5rem',
								}}
							/>
							{isResettingFlow ? 'Resetting...' : 'Reset Flow'}
						</FlowControlButton>
					</FlowControlButtons>
				</FlowControlSection>
			</FlowCard>

			{/* PingOne Configuration Section - Only show on step 1 */}
			<PingOneConfigSection
				callbackUrl={getCallbackUrlForFlow('authorization-code')}
				flowType={flowTitle}
				showOnlyOnStep={0}
				currentStep={stepManager.currentStepIndex}
			/>

			{/* Centralized Success/Error Messages */}

			{/* Documentation */}
			<InlineDocumentation>
				<QuickReference
					title={`${flowType.toUpperCase()} 2.0 Authorization Code Flow`}
					items={
						flowType === 'oauth'
							? [
									'Pure OAuth 2.0 implementation for resource access',
									'PKCE (RFC 7636) for enhanced security',
									'Authorization code exchange for access tokens',
									'No user identity information included',
									'Ideal for API access and resource authorization',
								]
							: [
									'Complete OpenID Connect implementation',
									'Authentication and authorization in one flow',
									'PKCE (RFC 7636) for enhanced security',
									'Access token, ID token, and refresh token',
									'User profile information via UserInfo endpoint',
									'OIDC compliance and best practices',
								]
					}
				/>
				<TroubleshootingGuide
					issue={`Common Errors for ${flowType.toUpperCase()} Authorization Code Flow`}
					symptoms={[
						'Redirect URI mismatch error',
						'Invalid client credentials',
						'Authorization code expired',
						'Token exchange failed',
					]}
					solutions={[
						{
							title: 'Fix Redirect URI Mismatch',
							steps: [
								'Go to PingOne Admin Console  Applications  Your App',
								'Navigate to Configuration  Redirect URIs',
								`Verify the redirect URI exactly matches: ${getCallbackUrlForFlow('authorization-code')}`,
								'Check protocol (http vs https) and port number match exactly',
								'Save changes in PingOne console',
								'Clear browser cache and try again',
							],
						},
						{
							title: 'Fix Invalid Client Credentials',
							steps: [
								'Verify Client ID in PingOne Admin Console',
								'Check Client Secret is correct (regenerate if needed)',
								'Ensure credentials are properly copied without extra spaces',
								'Verify the application is enabled in PingOne',
								'Check that the application type is set to "Web Application"',
								'Ensure the client is assigned to the correct environment',
							],
						},
						{
							title: 'Fix Authorization Code Expired',
							steps: [
								'Authorization codes expire in 10 minutes - start flow again',
								'Do not refresh the callback page after receiving the code',
								'Complete token exchange immediately after receiving code',
								'Check system clock is synchronized',
								'Avoid delays between authorization and token exchange',
							],
						},
						{
							title: 'Fix Token Exchange Failed',
							steps: [
								'Verify PKCE code verifier matches the original challenge',
								'Check that client authentication method is correct',
								'Ensure all required parameters are included in token request',
								'Verify the authorization code has not been used already',
								'Check token endpoint URL is correct for your environment',
								'Validate that the redirect URI matches exactly',
							],
						},
					]}
				/>
			</InlineDocumentation>

			{/* Success Modal - Show after successful authentication if configured */}
			{showAuthSuccessModal && flowConfig.showSuccessModal && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1000,
					}}
				>
					<div
						style={{
							backgroundColor: 'white',
							borderRadius: '0.5rem',
							padding: '2rem',
							maxWidth: '500px',
							width: '90%',
							boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
						}}
					>
						<div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
							<div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
							<h3 style={{ margin: '0 0 0.5rem 0', color: '#059669' }}>
								Authentication Successful!
							</h3>
							<p style={{ margin: 0, color: '#6b7280' }}>
								You have been successfully authenticated with PingOne.
							</p>
						</div>

						{authCode && flowConfig.showAuthCodeInModal && (
							<div
								style={{
									marginBottom: '1.5rem',
									padding: '1rem',
									backgroundColor: '#f0fdf4',
									border: '1px solid #22c55e',
									borderRadius: '0.5rem',
								}}
							>
								<h4 style={{ margin: '0 0 0.5rem 0', color: '#15803d' }}>
									Authorization Code Received:
								</h4>
								<code
									style={{
										fontSize: '0.875rem',
										color: '#374151',
										wordBreak: 'break-all',
										display: 'block',
										padding: '0.5rem',
										backgroundColor: 'white',
										borderRadius: '0.25rem',
									}}
								>
									{authCode}
								</code>
							</div>
						)}

						<div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
							<button
								type="button"
								onClick={() => setShowAuthSuccessModal(false)}
								style={{
									padding: '0.75rem 1.5rem',
									backgroundColor: '#3b82f6',
									color: 'white',
									border: 'none',
									borderRadius: '0.375rem',
									cursor: 'pointer',
									fontWeight: '500',
								}}
							>
								Continue with Flow
							</button>
						</div>
					</div>
				</div>
			)}

			{/* OAuth Authorization Request Modal - Show debugging info before redirect */}
			<AuthorizationRequestModal
				isOpen={showAuthRequestModal}
				onClose={() => setShowAuthRequestModal(false)}
				onProceed={() => {
					setShowAuthRequestModal(false);
					// Determine which authorization method to use based on the last clicked button
					// For now, default to popup (can be enhanced later)
					handlePopupAuthorizationDirect();
				}}
				authorizationUrl={authUrl || ''}
				requestParams={{
					environmentId: credentials.environmentId || '',
					clientId: credentials.clientId || '',
					redirectUri: credentials.redirectUri || '',
					scopes: credentials.scope || '',
					state: state || '',
					codeChallenge: pkceCodes.codeChallenge || '',
					flowType: flowType || '',
				}}
			/>
		</Container>
	);
};

export default UnifiedAuthorizationCodeFlowV3;
