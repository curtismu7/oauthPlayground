// src/pages/flows/EnhancedAuthorizationCodeFlowV3.tsx - Clean reusable implementation

import React, { useCallback, useState } from "react";
import styled from "styled-components";
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiCopy,
	FiKey,
	FiRotateCcw,
	FiShield,
	FiUser,
} from "react-icons/fi";
import EnhancedStepFlowV2 from "../../components/EnhancedStepFlowV2";
import {
	type FlowConfig,
	FlowConfiguration,
} from "../../components/FlowConfiguration";
import {
	InlineDocumentation,
	QuickReference,
	TroubleshootingGuide,
} from "../../components/InlineDocumentation";
import OAuthErrorHelper from "../../components/OAuthErrorHelper";
import PingOneConfigSection from "../../components/PingOneConfigSection";
import FlowIntro from "../../components/flow/FlowIntro";
import {
	createAuthUrlStep,
	createCallbackHandlingStep,
	createCredentialsStep,
	createPKCEStep,
	createTokenExchangeStep,
	createUserAuthorizationStep,
	InfoBox,
} from "../../components/steps/CommonSteps";
import { useAuth } from "../../contexts/NewAuthContext";
import {
	showGlobalError,
	showGlobalSuccess,
} from "../../hooks/useNotifications";
import { useAuthorizationFlowScroll } from "../../hooks/usePageScroll";
import { getCallbackUrlForFlow } from "../../utils/callbackUrls";
import { getAuthMethodSecurityLevel } from "../../utils/clientAuthentication";
import { copyToClipboard } from "../../utils/clipboard";
import { credentialManager } from "../../utils/credentialManager";
import { enhancedDebugger } from "../../utils/enhancedDebug";
import EnhancedErrorRecovery, {
	type RecoveryAction,
} from "../../utils/errorRecovery";
import { getDefaultConfig } from "../../utils/flowConfigDefaults";
import { trackFlowCompletion } from "../../utils/flowCredentialChecker";
import { useFlowStepManager } from "../../utils/flowStepSystem";
import {
	generateCodeChallenge,
	generateCodeVerifier,
	validateIdToken,
} from "../../utils/oauth";
import {
	generateComplianceReport,
	validateOIDCCompliance,
} from "../../utils/oidcCompliance";
import {
	useMemoizedComputation,
	usePerformanceMonitor,
} from "../../utils/performance";
import {
	type InterpretedError,
	PingOneErrorInterpreter,
} from "../../utils/pingoneErrorInterpreter";
import { safeJsonParse } from "../../utils/secureJson";

const EnhancedAuthorizationCodeFlowV3: React.FC = () => {
	const _authContext = useAuth();

	// Performance monitoring
	const _performanceMonitor = usePerformanceMonitor(
		"EnhancedAuthorizationCodeFlowV3",
	);

	// Start debug session
	React.useEffect(() => {
		const sessionId = enhancedDebugger.startSession(
			"oidc-authorization-code-v3",
		);
		console.log(" [OIDC-V3] Debug session started:", sessionId);

		return () => {
			const session = enhancedDebugger.endSession();
			if (session) {
				console.log(" [OIDC-V3] Debug session completed:", {
					duration: session.performance.totalDuration,
					steps: session.steps.length,
					errors: session.errors.length,
				});
			}
		};
	}, []);

	// Use centralized scroll management
	useAuthorizationFlowScroll("Enhanced Authorization Code Flow V3");

	// Use the new step management system
	const stepManager = useFlowStepManager({
		flowType: "oidc-authorization-code",
		persistKey: "enhanced-authz-v3",
		defaultStep: 0,
		enableAutoAdvance: true,
	});

	// Comprehensive URL parameter debugging and handling (V2 feature)
	React.useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const hashParams = new URLSearchParams(window.location.hash.substring(1));

		// Log all URL parameters for debugging
		console.log(" [OIDC-V3] Comprehensive URL parameter analysis:");
		console.log("   Current URL:", window.location.href);
		console.log("   Search params:", Object.fromEntries(urlParams.entries()));
		console.log("   Hash params:", Object.fromEntries(hashParams.entries()));

		// Check for authorization code in query parameters
		const code = urlParams.get("code");
		const state = urlParams.get("state");
		const error = urlParams.get("error");
		const errorDescription = urlParams.get("error_description");

		// Check for tokens in hash parameters (for implicit flow compatibility)
		const accessToken = hashParams.get("access_token");
		const idToken = hashParams.get("id_token");
		const tokenType = hashParams.get("token_type");

		console.log(" [OIDC-V3] Parameter extraction results:", {
			code: code ? `${code.substring(0, 10)}...` : null,
			state: state ? `${state.substring(0, 10)}...` : null,
			error: error,
			errorDescription: errorDescription,
			accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : null,
			idToken: idToken ? `${idToken.substring(0, 20)}...` : null,
			tokenType: tokenType,
		});

		// Handle authorization errors with enhanced error interpretation
		if (error) {
			console.error(" [OIDC-V3] Authorization error received:", {
				error,
				errorDescription,
				fullUrl: window.location.href,
			});

			// Use enhanced error handling with PingOneErrorInterpreter
			// handleOAuthError({
			//   error: error,
			//   error_description: errorDescription,
			//   details: {
			//     fullUrl: window.location.href,
			//     searchParams: Object.fromEntries(urlParams.entries()),
			//     hashParams: Object.fromEntries(hashParams.entries())
			//   }
			// }, 'authorization'); // Temporarily commented to fix syntax
			showGlobalError(` Authorization failed: ${errorDescription || error}`);
			return;
		}

		// Handle authorization code from URL parameters (standard flow)
		if (code) {
			console.log(" [OIDC-V3] Authorization code detected in URL:", code);

			// Validate state parameter for CSRF protection
			const storedState = sessionStorage.getItem("oauth_state");
			if (state && storedState && state !== storedState) {
				console.error(
					" [OIDC-V3] State parameter mismatch - possible CSRF attack:",
					{
						received: state,
						expected: storedState,
					},
				);

				// Use enhanced error handling for CSRF protection
				// handleOAuthError({
				//   error: 'invalid_state',
				//   error_description: 'State parameter mismatch - possible CSRF attack detected',
				//   details: {
				//     receivedState: state,
				//     expectedState: storedState,
				//     securityIssue: 'CSRF_PROTECTION'
				//   }
				// }, 'authorization'); // Temporarily commented to fix syntax
				showGlobalError(
					" State parameter mismatch. Possible CSRF attack detected.",
				);
				return;
			}

			setAuthCode(code);
			console.log(" [OIDC-V3] Auto-advancing to token exchange step");

			// Auto-advance to token exchange step (step 5 in our 6-step flow)
			if (stepManager.currentStepIndex < 5) {
				stepManager.setStep(5, "authorization code detected");
			}

			// Clean up URL parameters
			const cleanUrl = window.location.pathname;
			window.history.replaceState({}, document.title, cleanUrl);
			console.log(" [OIDC-V3] Cleaned URL parameters from address bar");

			showGlobalSuccess(
				" Authorization successful! You can now exchange your authorization code for tokens.",
			);
		}

		// Handle authorization code from sessionStorage (full redirect callback)
		if (!code) {
			const storedCode = sessionStorage.getItem("oauth_auth_code");
			const storedState = sessionStorage.getItem("oauth_state");

			if (storedCode) {
				console.log(
					" [OIDC-V3] Authorization code detected in sessionStorage (full redirect):",
					storedCode,
				);
				setAuthCode(storedCode);

				// Auto-advance to token exchange step (step 5 in our 7-step flow)
				if (stepManager.currentStepIndex < 5) {
					stepManager.setStep(5, "authorization code from full redirect");
					console.log(
						" [OIDC-V3] Auto-advancing to step 5 (token exchange) after full redirect",
					);
				}

				// Clean up sessionStorage after loading
				sessionStorage.removeItem("oauth_auth_code");
				if (storedState) {
					sessionStorage.removeItem("oauth_state");
				}

				showGlobalSuccess(
					" Authorization successful via full redirect! You can now exchange your authorization code for tokens.",
				);
			}
		}

		// Handle implicit flow tokens (if present)
		if (accessToken) {
			console.log(" [OIDC-V3] Implicit flow tokens detected");
			const implicitTokens = {
				access_token: accessToken,
				id_token: idToken,
				token_type: tokenType || "Bearer",
				expires_in: hashParams.get("expires_in"),
				scope: hashParams.get("scope"),
			};

			setTokens(implicitTokens);
			console.log(
				" [OIDC-V3] Auto-advancing to user info step for implicit flow",
			);
			stepManager.setStep(4, "implicit flow tokens received");
		}
	}, [stepManager]);

	// Flow state - ensure consistent redirect URI for V3
	const [credentials, setCredentials] = useState<StepCredentials>({
		clientId: "",
		clientSecret: "",
		environmentId: "",
		redirectUri: "",
		scopes: "openid",
		authorizationEndpoint: "",
		tokenEndpoint: "",
		userInfoEndpoint: "",
		clientAuthMethod: "client_secret_post",
	});

	const [pkceCodes, setPkceCodes] = useState<PKCECodes>({
		codeVerifier: "",
		codeChallenge: "",
	});

	const [authUrl, setAuthUrl] = useState("");
	const [authCode, setAuthCode] = useState("");
	const [tokens, setTokens] = useState<Record<string, unknown> | null>(null);
	const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(
		null,
	);
	const [isExchangingTokens, setIsExchangingTokens] = useState(false);
	const [isGettingUserInfo, setIsGettingUserInfo] = useState(false);

	// Authorization handling state (V2 features)
	const [isAuthorizing, setIsAuthorizing] = useState(false);
	const [_showAuthSuccessModal, setShowAuthSuccessModal] = useState(false);

	// Step completion tracking and result persistence (V2 features)
	const stepResultsRef = React.useRef<Record<string, unknown>>({});

	// Reset functionality with confirmation modals (V2 features)
	const [showResetModal, setShowResetModal] = useState(false);
	const [showClearCredentialsModal, setShowClearCredentialsModal] =
		useState(false);
	const [isResettingFlow, setIsResettingFlow] = useState(false);

	// Error handling state (V2 features)
	const [currentError, setCurrentError] = useState<Record<
		string,
		unknown
	> | null>(null);
	const [showErrorHelper, setShowErrorHelper] = useState(false);

	// Enhanced error recovery system
	const [errorRecovery] = useState(
		() =>
			new EnhancedErrorRecovery({
				maxRetries: 3,
				baseDelay: 1000,
				enableAutoRetry: true,
				enableUserPrompts: true,
			}),
	);
	const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([]);
	const [clearHover, setClearHover] = useState(false);
	const [resetHover, setResetHover] = useState(false);
	const [copyHover, setCopyHover] = useState(false);

	// Flow Configuration state - V2 feature integration
	const [flowConfig, setFlowConfig] = useState<FlowConfig>(() =>
		getDefaultConfig("oidc-authorization-code"),
	);

	// Step result management functions (V2 features)
	const saveStepResult = useCallback((stepId: string, result: unknown) => {
		console.log(" [OIDC-V3] Saving step result:", { stepId, result });
		const updated = { ...stepResultsRef.current, [stepId]: result };
		stepResultsRef.current = updated;
		localStorage.setItem("oidc-v3-step-results", JSON.stringify(updated));
	}, []);

	const _getStepResult = useCallback((stepId: string) => {
		return stepResultsRef.current[stepId];
	}, []);

	const hasStepResult = useCallback(
		(stepId: string) => stepId in stepResultsRef.current,
		[],
	);

	const clearStepResults = useCallback(() => {
		console.log(" [OIDC-V3] Clearing all step results");
		stepResultsRef.current = {};
		localStorage.removeItem("oidc-v3-step-results");
	}, []);

	// Load credentials on mount
	React.useEffect(() => {
		const loadCredentials = () => {
			const saved = credentialManager.loadAuthzFlowCredentials();
			if (saved) {
				setCredentials({
					clientId: saved.clientId || "",
					clientSecret: saved.clientSecret || "",
					environmentId: saved.environmentId || "",
					redirectUri:
						saved.redirectUri || getCallbackUrlForFlow("authorization-code"), // Use saved redirect URI or default
					scopes: Array.isArray(saved.scopes)
						? saved.scopes.join(" ")
						: saved.scopes || "openid",
					authorizationEndpoint: saved.authEndpoint || "",
					tokenEndpoint: saved.tokenEndpoint || "",
					userInfoEndpoint: saved.userInfoEndpoint || "",
					clientAuthMethod: saved.tokenAuthMethod || "client_secret_post",
				});
			}
		};
		loadCredentials();
	}, []);

	// Save credentials function
	const saveCredentials = useCallback(async () => {
		try {
			const success = credentialManager.saveAuthzFlowCredentials({
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: credentials.redirectUri,
				scopes: credentials.scopes.split(" "),
				authEndpoint: credentials.authorizationEndpoint,
				tokenEndpoint: credentials.tokenEndpoint,
				userInfoEndpoint: credentials.userInfoEndpoint,
				tokenAuthMethod: flowConfig.clientAuthMethod,
			});

			if (success) {
				showGlobalSuccess(" Credentials Saved Successfully");
			} else {
				throw new Error("Failed to save credentials");
			}
		} catch (error) {
			showGlobalError(" Failed to save credentials");
			throw error;
		}
	}, [credentials, flowConfig.clientAuthMethod]);

	// Generate PKCE codes
	const generatePKCE = useCallback(async () => {
		try {
			const verifier = generateCodeVerifier();
			const challenge = await generateCodeChallenge(verifier, "S256");

			setPkceCodes({
				codeVerifier: verifier,
				codeChallenge: challenge,
			});

			// OIDC Spec Compliance: Store code_verifier for token exchange per RFC 7636
			sessionStorage.setItem("code_verifier", verifier);
			sessionStorage.setItem("oauth_code_verifier", verifier); // Backup storage key

			console.log(
				" [OIDC-V3] PKCE codes generated and stored per OIDC specifications:",
				{
					codeVerifierLength: verifier.length,
					codeChallengeLength: challenge.length,
					storedInSessionStorage: true,
				},
			);

			showGlobalSuccess(" PKCE Codes Generated Successfully");
		} catch (error) {
			showGlobalError(" Failed to generate PKCE codes");
			throw error;
		}
	}, []);

	// Generate authorization URL with advanced parameters from FlowConfig
	const generateAuthUrl = useCallback(() => {
		try {
			const authEndpoint =
				credentials.authorizationEndpoint ||
				`https://auth.pingone.com/${credentials.environmentId}/as/authorize`;

			// Generate nonce for OIDC compliance
			const generatedNonce = generateCodeVerifier().substring(0, 32);
			sessionStorage.setItem("oauth_nonce", generatedNonce);

			console.log(
				" [OIDC-V3] Generated and stored nonce for ID token validation:",
				{
					nonce: `${generatedNonce.substring(0, 10)}...`,
					storedInSessionStorage: true,
					key: "oauth_nonce",
				},
			);

			// OIDC Spec Compliance: Use consistent redirect URI per section 3.1.2.1
			// The same redirect_uri used here MUST be used in token exchange
			const redirectUri = getCallbackUrlForFlow("authorization-code");

			// Verify it's the expected V3 callback URL
			console.log(" [OIDC-V3] Authorization redirect URI verified:", {
				redirectUri,
				isAuthzCallback: redirectUri.endsWith("/authz-callback"),
				origin: window.location.origin,
			});

			// CRITICAL: Store the EXACT redirect URI used in authorization for token exchange
			// This is the core OIDC compliance requirement - redirect_uri MUST match exactly
			sessionStorage.setItem("oauth_redirect_uri", redirectUri);
			sessionStorage.setItem("oauth_redirect_uri_v3", redirectUri); // V3-specific storage

			// Set flow context to ensure proper callback routing to V3 flow
			const flowContext = {
				flow: "enhanced-authorization-code-v3",
				returnPath: `/flows/enhanced-authorization-code-v3?step=4`,
				redirectUri: redirectUri, // Store redirect URI in flow context
				timestamp: Date.now(),
			};
			sessionStorage.setItem("flowContext", JSON.stringify(flowContext));

			console.log(
				" [OIDC-V3] Using OIDC-compliant redirect URI and flow context:",
				{
					redirectUri,
					flowContext,
					storedForTokenExchange: true,
					oidcCompliance: "Section 3.1.2.1 - redirect_uri consistency",
				},
			);

			// Handle scopes properly - V2 compatibility fix
			const scopes =
				flowConfig.scopes && flowConfig.scopes.length > 0
					? flowConfig.scopes.join(" ")
					: credentials.scopes || "openid profile email";

			console.log(" [OIDC-V3] Using scopes:", scopes);

			// Validate required parameters BEFORE building URL (V2 feature)
			if (!credentials.clientId) {
				throw new Error(
					"Client ID is required. Please configure your credentials first.",
				);
			}
			if (!credentials.environmentId) {
				throw new Error(
					"Environment ID is required. Please configure your credentials first.",
				);
			}
			if (!redirectUri) {
				throw new Error("Redirect URI is required");
			}
			if (!scopes || scopes.trim() === "") {
				throw new Error("At least one scope must be specified");
			}

			// Generate state for CSRF protection
			const generatedState =
				flowConfig.state || generateCodeVerifier().substring(0, 32);
			sessionStorage.setItem("oauth_state", generatedState);

			// Base parameters
			const params = new URLSearchParams({
				response_type: flowConfig.responseType || "code",
				client_id: credentials.clientId,
				redirect_uri: redirectUri,
				scope: scopes,
				state: generatedState,
				code_challenge: pkceCodes.codeChallenge,
				code_challenge_method: "S256",
			});

			// Advanced OIDC parameters from FlowConfig
			if (flowConfig.nonce || generatedNonce) {
				params.set("nonce", flowConfig.nonce || generatedNonce);
			}

			if (flowConfig.maxAge && flowConfig.maxAge > 0) {
				params.set("max_age", flowConfig.maxAge.toString());
			}

			if (flowConfig.prompt) {
				params.set("prompt", flowConfig.prompt);
			}

			if (flowConfig.loginHint) {
				params.set("login_hint", flowConfig.loginHint);
			}

			if (flowConfig.acrValues && flowConfig.acrValues.length > 0) {
				// Filter out invalid ACR values before adding to URL
				const validAcrValues = flowConfig.acrValues.filter(
					(acr) =>
						acr &&
						acr.trim() !== "" &&
						!/^[0-9]+$/.test(acr) && // Remove single digits like '1', '2', '3'
						(acr.startsWith("urn:") || acr.length > 3), // Must be URN or meaningful string
				);

				if (validAcrValues.length > 0) {
					params.set("acr_values", validAcrValues.join(" "));
					console.log(" [OIDC-V3] Added valid ACR values:", validAcrValues);
				} else {
					console.warn(
						" [OIDC-V3] No valid ACR values found, skipping acr_values parameter",
					);
				}
			}

			// Custom parameters support
			if (flowConfig.customParams) {
				Object.entries(flowConfig.customParams).forEach(([key, value]) => {
					if (value) {
						params.set(key, String(value));
					}
				});
			}

			const url = `${authEndpoint}?${params.toString()}`;

			console.log(
				" [OIDC-V3] Generated authorization URL with advanced parameters:",
				url,
			);
			console.log(" [OIDC-V3] URL parameters breakdown:", {
				response_type: params.get("response_type"),
				client_id: params.get("client_id"),
				redirect_uri: params.get("redirect_uri"),
				scope: params.get("scope"),
				state: params.get("state"),
				code_challenge: params.get("code_challenge"),
				code_challenge_method: params.get("code_challenge_method"),
				nonce: params.get("nonce"),
			});

			setAuthUrl(url);
			showGlobalSuccess(
				" Authorization URL Generated Successfully with Advanced Parameters",
			);
		} catch (error) {
			showGlobalError(" Failed to generate authorization URL");
			throw error;
		}
	}, [credentials, pkceCodes, flowConfig]);

	// Enhanced error handling with PingOneErrorInterpreter and recovery system
	const handleOAuthError = useCallback(
		async (
			error: unknown,
			context?: string,
			retryFunction?: () => Promise<void>,
		) => {
			console.error(" [OIDC-V3] OAuth error occurred:", { error, context });

			// Create error context for recovery system
			const errorContext = {
				operation: context || "unknown",
				step: stepManager.currentStepIndex.toString(),
				flow: "oidc-authorization-code-v3",
				timestamp: Date.now(),
				userAgent: navigator.userAgent,
				url: window.location.href,
				credentials: {
					hasClientId: !!credentials.clientId,
					hasClientSecret: !!credentials.clientSecret,
					hasEnvironmentId: !!credentials.environmentId,
				},
			};

			// Use enhanced error recovery system
			await errorRecovery.handleError(error, errorContext, retryFunction);

			// Get recovery actions
			const actions = errorRecovery.getRecoveryActions();
			setRecoveryActions(actions);

			// Interpret the error using PingOneErrorInterpreter
			let interpretedError: InterpretedError | null;
			try {
				interpretedError = PingOneErrorInterpreter.interpret(error);
				console.log(" [OIDC-V3] Error interpreted:", interpretedError);
			} catch (interpreterError) {
				console.error(
					" [OIDC-V3] Error interpreter failed:",
					interpreterError,
				);
				// Fallback error interpretation
				const fallbackMessage =
					(typeof error === "object" &&
					error !== null &&
					"error_description" in error
						? String((error as Record<string, unknown>).error_description)
						: undefined) ||
					(typeof error === "object" && error !== null && "message" in error
						? String((error as Record<string, unknown>).message)
						: undefined) ||
					String(error);
				interpretedError = {
					title: "OAuth Error",
					message: fallbackMessage,
					suggestion: "Please check your configuration and try again.",
					technicalDetails: JSON.stringify(error, null, 2),
					severity: "error",
					category: "authentication",
				};
			}

			// Only show detailed error recovery if enabled in settings
			if (flowConfig.enableErrorRecovery) {
				// Set error state for OAuthErrorHelper display
				setCurrentError({
					...interpretedError,
					originalError: error,
					context: context,
					recoveryActions: actions,
				});
				setShowErrorHelper(true);
			}

			// Always show basic error in centralized message system
			showGlobalError(
				`${interpretedError?.title}: ${interpretedError?.message}`,
			);
		},
		[stepManager, credentials, flowConfig.enableErrorRecovery, errorRecovery],
	);

	const dismissError = useCallback(() => {
		setCurrentError(null);
		setShowErrorHelper(false);
	}, []);

	const retryAfterError = useCallback(() => {
		dismissError();
		// Reset to appropriate step based on error context
		if (currentError?.context === "token-exchange") {
			stepManager.setStep(3, "retry after error");
		} else if (currentError?.context === "authorization") {
			stepManager.setStep(2, "retry after error");
		} else {
			stepManager.setStep(0, "retry after error");
		}
	}, [currentError, stepManager, dismissError]);

	const exchangeTokens = useCallback(async () => {
		if (!authCode) {
			showGlobalError(" No authorization code available");
			return;
		}

		setIsExchangingTokens(true);

		try {
			const response = await fetch("/api/authorization-code", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					environmentId: credentials.environmentId,
					clientId: credentials.clientId,
					clientSecret: credentials.clientSecret,
					redirectUri: credentials.redirectUri,
					code: authCode,
					codeVerifier: pkceCodes.codeVerifier,
					tokenEndpoint: flowConfig.tokenEndpoint || credentials.tokenEndpoint,
					authMethod: flowConfig.clientAuthMethod,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Token exchange failed: ${response.status} ${errorText}`,
				);
			}

			const tokenData = await response.json();
			console.log(" [OIDC-V3] Tokens received:", tokenData);

			setTokens(tokenData);
			saveStepResult("token-exchange", { tokenData, timestamp: Date.now() });
			trackFlowCompletion("oidc-authorization-code");

			// Validate ID token if present
			if (tokenData.id_token) {
				const validationResult = validateIdToken(tokenData.id_token, {
					clientId: credentials.clientId,
					issuer: `https://auth.pingone.com/${credentials.environmentId}/as`,
					audience: credentials.clientId,
					nonce: sessionStorage.getItem("oauth_nonce") || undefined,
				});

				console.log(
					" [OIDC-V3] ID Token validation result:",
					validationResult,
				);

				if (!validationResult.isValid) {
					showGlobalError(
						` ID Token validation failed: ${validationResult.errors?.join(", ") || "Unknown error"}`,
					);
				}
			}

			showGlobalSuccess(" Tokens exchanged successfully");
		} catch (error) {
			console.error(" [OIDC-V3] Token exchange failed:", error);
			await handleOAuthError(error, "token-exchange", async () => {
				await exchangeTokens();
			});
			throw error;
		} finally {
			setIsExchangingTokens(false);
		}
	}, [
		authCode,
		credentials.clientId,
		credentials.clientSecret,
		credentials.environmentId,
		credentials.redirectUri,
		credentials.tokenEndpoint,
		flowConfig.clientAuthMethod,
		flowConfig.tokenEndpoint,
		pkceCodes.codeVerifier,
		saveStepResult,
		handleOAuthError,
	]);

	// Get user info with proper access token
	const getUserInfo = useCallback(async () => {
		if (!tokens?.access_token) {
			showGlobalError(" No access token available for UserInfo request");
			return;
		}

		setIsGettingUserInfo(true);
		try {
			const userInfoEndpoint =
				credentials.userInfoEndpoint ||
				`https://auth.pingone.com/${credentials.environmentId}/as/userinfo`;

			console.log(" [OIDC-V3] Calling UserInfo endpoint:", userInfoEndpoint);

			const response = await fetch(userInfoEndpoint, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${tokens.access_token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`UserInfo request failed: ${response.status} ${errorText}`,
				);
			}

			const userData = await response.json();
			console.log(" [OIDC-V3] UserInfo retrieved:", userData);

			setUserInfo(userData);
			showGlobalSuccess(" User Information Retrieved Successfully");
		} catch (error) {
			console.error(" [OIDC-V3] UserInfo request failed:", error);

			// Use enhanced error handling with retry capability
			await handleOAuthError(error, "userinfo", async () => {
				// Retry the UserInfo request
				await getUserInfo();
			});
			throw error;
		} finally {
			setIsGettingUserInfo(false);
		}
	}, [tokens, credentials, handleOAuthError]);

	// Load persisted step results on mount
	React.useEffect(() => {
		const persistKey = `oidc-v3-step-results`;
		const persistedResults = localStorage.getItem(persistKey);
		if (persistedResults) {
			try {
				const results =
					safeJsonParse<Record<string, unknown>>(persistedResults);
				if (results) {
					stepResultsRef.current = results;
					console.log(" [OIDC-V3] Loaded persisted step results:", results);
				}
			} catch (error) {
				console.error(
					" [OIDC-V3] Failed to load persisted step results:",
					error,
				);
			}
		}
	}, []);

	// Reset functionality (V2 features)
	const handleReset = useCallback(async () => {
		console.log(" [OIDC-V3] Resetting entire flow");

		setIsResettingFlow(true);

		try {
			// Simulate a brief delay for better UX
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Reset all state
			setAuthCode("");
			setTokens(null);
			setUserInfo(null);
			setAuthUrl("");
			setPkceCodes({ codeVerifier: "", codeChallenge: "" });
			setIsExchangingTokens(false);
			setIsGettingUserInfo(false);
			setIsAuthorizing(false);

			// Clear step results
			clearStepResults();

			// Reset step manager
			stepManager.setStep(0, "flow reset");

			// Clear session storage
			sessionStorage.removeItem("oauth_state");
			sessionStorage.removeItem("oauth_nonce");
			sessionStorage.removeItem("oidc-v3-flow-state");

			// Close modal
			setShowResetModal(false);

			showGlobalSuccess(" Flow reset successfully");
		} catch (error) {
			console.error(" [OIDC-V3] Reset flow failed:", error);
			showGlobalError("Failed to reset flow");
		} finally {
			setIsResettingFlow(false);
		}
	}, [clearStepResults, stepManager]);

	const handleClearCredentials = useCallback(() => {
		console.log(" [OIDC-V3] Clearing credentials");

		// Clear credentials
		setCredentials({
			clientId: "",
			clientSecret: "",
			environmentId: "",
			redirectUri: "",
			scopes: "",
			clientAuthMethod: "client_secret_post",
		});

		// Clear from storage
		credentialManager.clearAllCredentials();

		// Close modal
		setShowClearCredentialsModal(false);

		showGlobalSuccess(" Credentials cleared successfully");
	}, []);

	// Popup authorization handler (V2 feature)
	const handlePopupAuthorization = useCallback(() => {
		if (!authUrl) {
			showGlobalError(" Please generate authorization URL first");
			return;
		}

		setIsAuthorizing(true);
		console.log(" [OIDC-V3] Opening popup with URL:", authUrl);

		// Set flow context for AuthzCallback to detect Enhanced V3 flow
		sessionStorage.setItem(
			"flowContext",
			JSON.stringify({
				flow: "enhanced-authorization-code-v3",
				redirectUri: credentials.redirectUri,
			}),
		);
		console.log(" [OIDC-V3] Set flowContext for popup callback handling");

		const popup = window.open(authUrl, "oauth-popup", "width=600,height=700");
		if (popup) {
			console.log(" [OIDC-V3] Popup opened successfully");

			// Track authorization success to avoid race conditions
			let authorizationSuccessful = false;

			// Listen for messages from the popup
			const messageHandler = (event: MessageEvent) => {
				console.log(" [OIDC-V3] Message received from popup:", {
					origin: event.origin,
					expectedOrigin: window.location.origin,
					data: event.data,
				});

				if (event.origin !== window.location.origin) {
					console.log(" [OIDC-V3] Message origin mismatch, ignoring");
					return;
				}

				if (event.data.type === "oauth-callback") {
					const {
						code: callbackCode,
						state: callbackState,
						error,
						error_description,
					} = event.data;

					if (error) {
						console.error(" [OIDC-V3] Authorization error received:", error);
						showGlobalError(
							` Authorization failed: ${error_description || error}`,
						);
						setIsAuthorizing(false);
					} else if (callbackCode && callbackState) {
						// Mark authorization as successful BEFORE closing popup
						authorizationSuccessful = true;

						setAuthCode(callbackCode);
						console.log(
							" [OIDC-V3] Authorization code received via popup:",
							`${callbackCode.substring(0, 10)}...`,
						);

						// Authorization completed - close popup and cleanup
						popup.close();
						window.removeEventListener("message", messageHandler);
						setIsAuthorizing(false);
						setShowAuthSuccessModal(true);

						// Show centralized success message
						showGlobalSuccess(
							" Authorization Successful! You have been authenticated with PingOne and can now exchange tokens.",
						);

						// Auto-advance to token exchange step
						stepManager.setStep(3, "authorization completed");
					}
				}
			};

			window.addEventListener("message", messageHandler);

			// Check if popup was closed without completing auth
			const checkClosed = setInterval(() => {
				if (popup.closed) {
					clearInterval(checkClosed);
					window.removeEventListener("message", messageHandler);
					setIsAuthorizing(false);

					// Only show error if authorization was not successful
					if (!authorizationSuccessful) {
						console.warn(" [OIDC-V3] Popup closed without authorization code");
						showGlobalError(
							" Authorization was cancelled or popup was closed before completion",
						);
					}
				}
			}, 1000);
		} else {
			console.error(" [OIDC-V3] Failed to open popup window");
			showGlobalError(
				" Failed to open popup window. Please check your browser settings.",
			);
			setIsAuthorizing(false);
		}
	}, [authUrl, stepManager, credentials.redirectUri]);

	// Full redirect authorization handler (V2 feature)
	const handleFullRedirectAuthorization = useCallback(() => {
		if (!authUrl) {
			showGlobalError(" Please generate authorization URL first");
			return;
		}

		console.log(" [OIDC-V3] Redirecting to authorization URL:", authUrl);

		// Store current flow state before redirect
		const v3FlowState = {
			credentials,
			pkceCodes,
			flowConfig,
			step: 5, // Return to token exchange step (adjusted for 7-step flow)
			timestamp: Date.now(),
		};
		sessionStorage.setItem("oidc-v3-flow-state", JSON.stringify(v3FlowState));
		console.log(" [OIDC-V3] Stored V3 flow state:", v3FlowState);

		// CRITICAL: Set flow context for callback handler (like V2)
		// Use the SAME flowContext that was set in generateAuthUrl to avoid conflicts
		const currentPath = window.location.pathname;
		const returnPath = `${currentPath}?step=5`; // Return to step 5 (token exchange in 7-step flow)

		// IMPORTANT: Don't overwrite the existing flowContext from generateAuthUrl
		// Just update the return path to the correct step
		const existingFlowContext = sessionStorage.getItem("flowContext");
		let flowContext: Record<string, unknown> | null;

		if (existingFlowContext) {
			try {
				flowContext = JSON.parse(existingFlowContext);
				flowContext.returnPath = returnPath; // Update return path for full redirect
				flowContext.step = 5; // Update step for 7-step flow
				console.log(
					" [OIDC-V3] Updating existing flowContext for full redirect:",
					flowContext,
				);
			} catch (_e) {
				console.warn("Failed to parse existing flowContext, creating new one");
				flowContext = {
					flow: "enhanced-authorization-code-v3",
					step: 5,
					returnPath: returnPath,
					redirectUri: getCallbackUrlForFlow("authorization-code"),
					timestamp: Date.now(),
				};
			}
		} else {
			flowContext = {
				flow: "enhanced-authorization-code-v3",
				step: 5,
				returnPath: returnPath,
				redirectUri: getCallbackUrlForFlow("authorization-code"),
				timestamp: Date.now(),
			};
		}

		console.log(
			" [OIDC-V3] CRITICAL - About to store flowContext for callback detection...",
		);
		sessionStorage.setItem("flowContext", JSON.stringify(flowContext));
		console.log(" [OIDC-V3] flowContext stored successfully:", flowContext);
		console.log(
			" [OIDC-V3] Verifying storage - reading back flowContext:",
			sessionStorage.getItem("flowContext"),
		);
		console.log(" [OIDC-V3] Return path set to:", returnPath);

		// Redirect to authorization server using proper OAuth flow
		console.log(
			" [OIDC-V3] Redirecting to PingOne authorization server with OIDC-compliant URL",
		);
		window.location.href = authUrl;
	}, [authUrl, credentials, pkceCodes, flowConfig]);

	// Create steps using reusable components with performance optimization
	const steps = useMemoizedComputation(
		() => [
			{
				...createCredentialsStep(
					credentials,
					setCredentials,
					async () => {
						await saveCredentials();
						saveStepResult("setup-credentials", {
							credentials,
							timestamp: Date.now(),
						});
					},
					"OIDC Authorization Code Flow",
				),
				canExecute: Boolean(
					credentials.environmentId &&
						credentials.clientId &&
						credentials.clientSecret &&
						credentials.redirectUri,
				),
				completed: hasStepResult("setup-credentials"),
			},
			{
				...createPKCEStep(pkceCodes, setPkceCodes, async () => {
					await generatePKCE();
					saveStepResult("generate-pkce", { pkceCodes, timestamp: Date.now() });
				}),
				canExecute: Boolean(credentials.environmentId && credentials.clientId),
				completed: hasStepResult("generate-pkce"),
			},
			{
				...createAuthUrlStep(
					authUrl,
					generateAuthUrl,
					credentials,
					pkceCodes,
					handlePopupAuthorization,
					handleFullRedirectAuthorization,
					isAuthorizing,
				),
				canExecute: Boolean(
					credentials.environmentId &&
						credentials.clientId &&
						credentials.redirectUri &&
						pkceCodes.codeVerifier &&
						pkceCodes.codeChallenge,
				),
				completed: hasStepResult("build-auth-url"),
			},
			{
				...createUserAuthorizationStep(
					authUrl,
					handlePopupAuthorization,
					handleFullRedirectAuthorization,
					isAuthorizing,
					authCode,
				),
				canExecute: Boolean(authUrl),
				completed: hasStepResult("user-authorization") || Boolean(authCode),
			},
			{
				...createCallbackHandlingStep(authCode, handleReset),
				canExecute: Boolean(authCode),
				completed: hasStepResult("handle-callback") || Boolean(authCode),
			},
			{
				...createTokenExchangeStep(
					authCode,
					tokens,
					async () => {
						await exchangeTokens();
						saveStepResult("exchange-tokens", {
							tokens,
							authCode,
							timestamp: Date.now(),
						});
					},
					credentials,
					isExchangingTokens,
				),
				canExecute: Boolean(
					authCode &&
						credentials.environmentId &&
						credentials.clientId &&
						!tokens?.access_token,
				),
				completed:
					hasStepResult("exchange-tokens") || Boolean(tokens?.access_token),
			},
			{
				id: "validate-tokens",
				title: "Validate Tokens & Token Management",
				description:
					"Validate the received tokens and use them with the Token Management page for detailed inspection.",
				icon: <FiShield />,
				category: "validation",
				content: (
					<div>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.75rem",
								padding: "1rem",
								background: "#fef2f2",
								border: "1px solid #bfdbfe",
								color: "#1e40af",
								borderRadius: "6px",
								marginBottom: "1rem",
							}}
						>
							<FiShield />
							<div>
								<strong>Token Validation & Management</strong>
								<br />
								Your tokens are ready! Use the Token Management page to decode
								and inspect them.
							</div>
						</div>

						{tokens && (
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.75rem",
									padding: "1rem",
									background: "#f0fdf4",
									border: "1px solid #bbf7d0",
									color: "#15803d",
									borderRadius: "6px",
									marginBottom: "1rem",
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
									display: "flex",
									alignItems: "center",
									gap: "0.75rem",
									padding: "1rem",
									background: "#f0fdf4",
									border: "1px solid #bbf7d0",
									color: "#15803d",
									borderRadius: "6px",
									marginBottom: "1rem",
								}}
							>
								<FiUser />
								<div>
									<strong> User Information Retrieved!</strong>
									<br />
									Successfully retrieved user profile from UserInfo endpoint.
								</div>
							</div>
						)}

						{tokens && (
							<div
								style={{
									marginTop: "2rem",
									padding: "1.5rem",
									background: "#f8fafc",
									border: "1px solid #e2e8f0",
									borderRadius: "0.75rem",
								}}
							>
								<h4
									style={{
										margin: "0 0 1rem 0",
										color: "#1f2937",
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<FiKey />
									Token Management
								</h4>
								<p
									style={{
										margin: "0 0 1.5rem 0",
										color: "#6b7280",
										fontSize: "0.9rem",
									}}
								>
									Use the Token Management page to decode and inspect your
									tokens in detail.
								</p>

								<div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
									<button
										type="button"
										onClick={() => {
											if (tokens.access_token) {
												// Store the access token for the Token Management page
												sessionStorage.setItem(
													"selected_token",
													tokens.access_token,
												);
												sessionStorage.setItem(
													"selected_token_type",
													"access_token",
												);

												// Navigate to token management page
												window.location.href = "/token-management";
											}
										}}
										disabled={!tokens.access_token}
										style={{
											display: "flex",
											alignItems: "center",
											gap: "0.5rem",
											padding: "0.75rem 1.5rem",
											background: tokens.access_token
												? "#f8fafc"
												: "#9ca3af",
											color: "white",
											border: "none",
											borderRadius: "0.5rem",
											fontSize: "0.875rem",
											fontWeight: "600",
											cursor: tokens.access_token ? "pointer" : "not-allowed",
											transition: "all 0.2s ease",
											boxShadow: tokens.access_token
												? "0 2px 4px rgba(59, 130, 246, 0.3)"
												: "none",
											opacity: tokens.access_token ? 1 : 0.5,
										}}
									>
										<FiKey />
										Decode Access Token
									</button>

									<button
										type="button"
										onClick={() => {
											if (tokens.id_token) {
												// Store the ID token for the Token Management page
												sessionStorage.setItem(
													"selected_token",
													tokens.id_token,
												);
												sessionStorage.setItem(
													"selected_token_type",
													"id_token",
												);

												// Navigate to token management page
												window.location.href = "/token-management";
											}
										}}
										disabled={!tokens.id_token}
										style={{
											display: "flex",
											alignItems: "center",
											gap: "0.5rem",
											padding: "0.75rem 1.5rem",
											background:
												"#f8fafc",
											color: "white",
											border: "none",
											borderRadius: "0.5rem",
											fontSize: "0.875rem",
											fontWeight: "600",
											cursor: tokens.id_token ? "pointer" : "not-allowed",
											transition: "all 0.2s ease",
											boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)",
											opacity: tokens.id_token ? 1 : 0.5,
										}}
									>
										<FiShield />
										Decode ID Token
									</button>
								</div>
							</div>
						)}

						{tokens && (
							<div>
								<h4>Token Summary:</h4>
								<div
									style={{
										display: "grid",
										gap: "0.5rem",
										marginBottom: "1rem",
									}}
								>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											padding: "0.5rem",
											backgroundColor: "#f3f4f6",
											borderRadius: "0.25rem",
										}}
									>
										<span>
											<strong>Access Token:</strong>
										</span>
										<span>
											{tokens.access_token ? " Present" : " Missing"}
										</span>
									</div>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											padding: "0.5rem",
											backgroundColor: "#f3f4f6",
											borderRadius: "0.25rem",
										}}
									>
										<span>
											<strong>ID Token:</strong>
										</span>
										<span>{tokens.id_token ? " Present" : " Missing"}</span>
									</div>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											padding: "0.5rem",
											backgroundColor: "#f3f4f6",
											borderRadius: "0.25rem",
										}}
									>
										<span>
											<strong>Refresh Token:</strong>
										</span>
										<span>
											{tokens.refresh_token ? " Present" : " Missing"}
										</span>
									</div>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											padding: "0.5rem",
											backgroundColor: "#f3f4f6",
											borderRadius: "0.25rem",
										}}
									>
										<span>
											<strong>Expires In:</strong>
										</span>
										<span>
											{tokens.expires_in ? `${tokens.expires_in}s` : "N/A"}
										</span>
									</div>
								</div>
							</div>
						)}

						{userInfo && (
							<div>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
										marginBottom: "0.5rem",
									}}
								>
									<h4 style={{ margin: 0 }}>User Information:</h4>
									<button
										type="button"
										onClick={() =>
											copyToClipboard(
												JSON.stringify(userInfo, null, 2),
												"User Info",
											)
										}
										style={{
											display: "inline-flex",
											alignItems: "center",
											gap: "0.25rem",
											padding: "0.25rem 0.5rem",
											background: copyHover ? "#2563eb" : "#3b82f6",
											color: "white",
											border: "none",
											borderRadius: "4px",
											fontSize: "0.75rem",
											cursor: "pointer",
											transition: "background 0.2s",
										}}
										onMouseEnter={() => setCopyHover(true)}
										onMouseLeave={() => setCopyHover(false)}
										onFocus={() => setCopyHover(true)}
										onBlur={() => setCopyHover(false)}
									>
										<FiCopy /> Copy
									</button>
								</div>
								<div
									style={{
										background:
											"#f8fafc",
										border: "1px solid #86efac",
										borderRadius: "0.5rem",
										padding: "1rem",
										fontFamily: 'Monaco, Consolas, "Courier New", monospace',
										fontSize: "0.875rem",
										lineHeight: "1.5",
										whiteSpace: "pre-wrap",
										wordBreak: "break-all",
										overflowX: "auto",
										boxShadow:
											"0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
									}}
								>
									{JSON.stringify(userInfo, null, 2)}
								</div>
							</div>
						)}

						{/* Restart Flow Button for Final Step */}
						{tokens && (
							<div
								style={{
									marginTop: "2rem",
									textAlign: "center",
									padding: "1.5rem",
									background: "#f9fafb",
									border: "1px solid #e5e7eb",
									borderRadius: "0.75rem",
								}}
							>
								<h4 style={{ margin: "0 0 0.5rem 0", color: "#1f2937" }}>
									 OAuth Flow Complete!
								</h4>
								<p
									style={{
										margin: "0 0 1.5rem 0",
										color: "#6b7280",
										fontSize: "0.9rem",
									}}
								>
									You have successfully completed the Enhanced Authorization
									Code Flow V3. Your tokens are ready to use!
								</p>

								<button
									type="button"
									onClick={() => {
										// Reset the entire flow
										console.log(" [OIDC-V3] Restarting flow from step 1");

										// Clear all flow state
										setAuthCode("");
										setTokens(null);
										setUserInfo(null);
										setAuthUrl("");
										setPkceCodes({ codeVerifier: "", codeChallenge: "" });

										// Clear session storage
										sessionStorage.removeItem("oauth_auth_code");
										sessionStorage.removeItem("oauth_state");
										sessionStorage.removeItem("oauth_nonce");
										sessionStorage.removeItem("oauth_redirect_uri");
										sessionStorage.removeItem("oauth_redirect_uri_v3");
										sessionStorage.removeItem("flowContext");
										sessionStorage.removeItem("oidc-v3-flow-state");

										// Reset step manager to first step
										stepManager.setStep(0, "flow restarted");

										// Clear step results
										clearStepResults();

										// Scroll to top
										window.scrollTo({ top: 0, behavior: "smooth" });

										showGlobalSuccess(
											" Flow restarted successfully! You can now begin a new OAuth flow.",
										);
									}}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
										padding: "0.75rem 2rem",
										background:
											"#f8fafc",
										color: "white",
										border: "none",
										borderRadius: "0.5rem",
										fontSize: "0.875rem",
										fontWeight: "600",
										cursor: "pointer",
										transition: "all 0.2s ease",
										boxShadow: "0 2px 4px rgba(99, 102, 241, 0.3)",
										margin: "0 auto",
									}}
								>
									<FiRotateCcw />
									Restart OAuth Flow
								</button>
							</div>
						)}
					</div>
				),
				execute: async () => {
					if (!userInfo && tokens?.access_token) {
						await getUserInfo();
						saveStepResult("validate-tokens", {
							tokens,
							userInfo,
							timestamp: Date.now(),
						});
					}
					return { success: true };
				},
				canExecute: Boolean(tokens?.access_token),
				completed:
					hasStepResult("validate-tokens") || Boolean(tokens && userInfo),
				isFinalStep: true, // Mark this as the final step
			},
		],
		[
			authCode,
			authUrl,
			credentials,
			exchangeTokens,
			flowConfig,
			generateAuthUrl,
			generatePKCE,
			getUserInfo,
			handleFullRedirectAuthorization,
			handlePopupAuthorization,
			hasStepResult,
			isAuthorizing,
			isExchangingTokens,
			isGettingUserInfo,
			pkceCodes,
			saveCredentials,
			saveStepResult,
			tokens,
			userInfo,
		],
		"V3 Steps Creation",
	);

	return (
		<>
			<div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
				{/* Flow Configuration Panel - V2 Feature Integration */}
				<div style={{ marginBottom: "2rem" }}>
					<FlowConfiguration
						config={flowConfig}
						onConfigChange={setFlowConfig}
						flowType="oidc-authorization-code"
						initialExpanded={false}
						title=" Advanced Flow Configuration"
						subtitle="Configure advanced OIDC parameters, client authentication, and custom options"
					/>
				</div>

				{/* Security Warning Panel - V2 Feature */}
				{flowConfig.clientAuthMethod &&
					(() => {
						const securityInfo = getAuthMethodSecurityLevel(
							flowConfig.clientAuthMethod,
						);
						const isLowSecurity =
							securityInfo.level === "Low" || securityInfo.level === "Medium";

						return (
							<div
								style={{
									marginBottom: "2rem",
									padding: "1rem",
									borderRadius: "8px",
									border: `2px solid ${isLowSecurity ? "#f59e0b" : "#10b981"}`,
									backgroundColor: isLowSecurity ? "#fef3c7" : "#d1fae5",
								}}
							>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
										marginBottom: "0.5rem",
										fontWeight: "bold",
										color: isLowSecurity ? "#92400e" : "#065f46",
									}}
								>
									<span style={{ fontSize: "1.2em" }}>{securityInfo.icon}</span>
									Security Level: {securityInfo.level}
								</div>
								<div
									style={{
										color: isLowSecurity ? "#92400e" : "#065f46",
										fontSize: "0.9em",
									}}
								>
									{securityInfo.description}
								</div>
								{isLowSecurity && (
									<div
										style={{
											marginTop: "0.5rem",
											padding: "0.5rem",
											backgroundColor: "#fed7aa",
											borderRadius: "4px",
											fontSize: "0.85em",
											color: "#9a3412",
										}}
									>
										 <strong>Security Recommendation:</strong> Consider using
										'client_secret_jwt' or 'private_key_jwt' for production
										environments.
									</div>
								)}
							</div>
						);
					})()}

				{/* OIDC Core 1.0 Compliance Panel */}
				{(() => {
					const complianceResult = validateOIDCCompliance({
						responseType: flowConfig.responseType || "code",
						scopes: flowConfig.scopes || ["openid"],
						clientAuthMethod:
							flowConfig.clientAuthMethod || "client_secret_post",
						enablePKCE: flowConfig.enablePKCE || true,
						nonce: flowConfig.nonce,
						maxAge: flowConfig.maxAge,
					});

					return (
						<div
							style={{
								marginBottom: "2rem",
								padding: "1rem",
								borderRadius: "8px",
								border: `2px solid ${complianceResult.isCompliant ? "#10b981" : "#f59e0b"}`,
								backgroundColor: complianceResult.isCompliant
									? "#d1fae5"
									: "#fef3c7",
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									marginBottom: "1rem",
									fontWeight: "bold",
									color: complianceResult.isCompliant ? "#065f46" : "#92400e",
								}}
							>
								<span style={{ fontSize: "1.2em" }}>
									{complianceResult.isCompliant ? "" : ""}
								</span>
								OIDC Core 1.0 Compliance Status
							</div>

							<details
								style={{
									backgroundColor: "white",
									padding: "1rem",
									borderRadius: "6px",
									border: "1px solid #e5e7eb",
								}}
							>
								<summary
									style={{
										cursor: "pointer",
										fontWeight: "bold",
										marginBottom: "0.5rem",
										color: "#374151",
									}}
								>
									 View Compliance Report
								</summary>
								<pre
									style={{
										fontSize: "0.875rem",
										lineHeight: "1.4",
										margin: "0.5rem 0 0 0",
										color: "#374151",
										whiteSpace: "pre-wrap",
									}}
								>
									{generateComplianceReport(complianceResult)}
								</pre>
							</details>
						</div>
					);
				})()}

				{/* Enhanced Documentation - Inline Help */}
				<div style={{ marginBottom: "2rem" }}>
					<InlineDocumentation
						title="OIDC Authorization Code Flow Guide"
						type="oidc"
						specLink="https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth"
					>
						<QuickReference
							title="Key Concepts"
							items={[
								{
									term: "Authorization Code",
									definition: "Temporary code exchanged for tokens",
									example: "code=abc123...",
								},
								{
									term: "PKCE",
									definition:
										"Proof Key for Code Exchange - security extension",
									example: "code_challenge=xyz789...",
								},
								{
									term: "ID Token",
									definition: "JWT containing user identity information",
									example: "eyJhbGciOiJSUzI1NiIs...",
								},
							]}
						/>

						<TroubleshootingGuide
							issue="Common Errors for Enhanced Authorization Code Flow"
							symptoms={[
								"415 Unsupported Media Type errors",
								"Invalid grant errors",
								"Client authentication failures",
							]}
							solutions={[
								{
									title: "Check Content Type",
									steps: [
										"Ensure using application/json for backend API",
										"Verify client authentication method",
										"Check authorization code hasn't expired",
									],
								},
								{
									title: "Verify Configuration",
									steps: [
										"Confirm Client ID and Secret are correct",
										"Check redirect URI matches PingOne configuration",
										"Verify environment ID is valid",
									],
								},
							]}
						/>
					</InlineDocumentation>
				</div>

				{/* PingOne Configuration Section - Only show on step 1 */}
				<PingOneConfigSection
					callbackUrl={getCallbackUrlForFlow("authorization-code")}
					flowType="Enhanced Authorization Code Flow V3"
					showOnlyOnStep={0}
					currentStep={stepManager.currentStepIndex}
				/>

				{/* Enhanced Error Recovery Panel */}
				{recoveryActions.length > 0 && (
					<div
						style={{
							marginBottom: "2rem",
							padding: "1rem",
							borderRadius: "8px",
							border: "2px solid #f59e0b",
							backgroundColor: "#fef3c7",
						}}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
								marginBottom: "1rem",
								fontWeight: "bold",
								color: "#92400e",
							}}
						>
							<span style={{ fontSize: "1.2em" }}></span>
							Error Recovery Actions Available
						</div>

						<div style={{ display: "grid", gap: "0.5rem" }}>
							{recoveryActions.slice(0, 3).map((action) => (
								<button
									type="button"
									key={action.id}
									onClick={() => action.action()}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
										padding: "0.75rem",
										backgroundColor:
											action.priority === "high"
												? "#ef4444"
												: action.priority === "medium"
													? "#f59e0b"
													: "#6b7280",
										color: "white",
										border: "none",
										borderRadius: "6px",
										cursor: "pointer",
										fontSize: "0.875rem",
										fontWeight: "500",
									}}
								>
									<span>{action.icon}</span>
									<div style={{ textAlign: "left" }}>
										<div style={{ fontWeight: "bold" }}>{action.label}</div>
										<div style={{ fontSize: "0.75rem", opacity: 0.9 }}>
											{action.description}
										</div>
									</div>
								</button>
							))}
						</div>

						{recoveryActions.length > 3 && (
							<div
								style={{
									marginTop: "0.5rem",
									fontSize: "0.75rem",
									color: "#92400e",
									textAlign: "center",
								}}
							>
								+{recoveryActions.length - 3} more recovery options available in
								error details
							</div>
						)}
					</div>
				)}

				<EnhancedStepFlowV2
					key={`oidc-authz-${stepManager.currentStepIndex}-${authCode ? "with-code" : "no-code"}`}
					steps={steps}
					title=" OIDC Authorization Code Flow (V3 - Clean)"
					persistKey="oidc-authz-v3"
					autoAdvance={true}
					showDebugInfo={false}
					allowStepJumping={true}
					initialStepIndex={stepManager.currentStepIndex}
					onStepChange={(stepIndex) => {
						console.log(" [OIDC-V3] Step changed to:", stepIndex);
						stepManager.setStep(stepIndex, "user navigation");
					}}
					onStepComplete={(stepId, result) => {
						console.log(" [OIDC-V3] Step completed:", stepId, result);
					}}
				/>

				{/* Flow Control Actions - Moved to Bottom */}
				<div
					style={{
						marginTop: "3rem",
						padding: "1.5rem",
						backgroundColor: "#fef2f2",
						border: "1px solid #fecaca",
						borderRadius: "0.5rem",
						textAlign: "center",
					}}
				>
					<h4
						style={{
							margin: "0 0 1rem 0",
							color: "#dc2626",
							fontSize: "1rem",
							fontWeight: "600",
						}}
					>
						<span style={{ marginRight: "0.5rem" }}></span>
						Flow Control Actions
					</h4>

					<div
						style={{
							display: "flex",
							gap: "1rem",
							justifyContent: "center",
							flexWrap: "wrap",
						}}
					>
						<button
							type="button"
							onClick={() => setShowClearCredentialsModal(true)}
							onFocus={() => setClearHover(true)}
							onBlur={() => setClearHover(false)}
							onMouseOver={() => setClearHover(true)}
							onMouseOut={() => setClearHover(false)}
							style={{
								padding: "0.75rem 1.25rem",
								backgroundColor: clearHover ? "#d97706" : "#f59e0b",
								color: "white",
								border: "none",
								borderRadius: "0.375rem",
								fontSize: "0.875rem",
								fontWeight: "500",
								cursor: "pointer",
								display: "inline-flex",
								alignItems: "center",
								gap: "0.5rem",
								transition: "background-color 0.2s",
								minWidth: "160px",
							}}
						>
							<span></span>
							Clear Credentials
						</button>

						<button
							type="button"
							onClick={() => setShowResetModal(true)}
							disabled={isResettingFlow}
							onFocus={() => setResetHover(true)}
							onBlur={() => setResetHover(false)}
							onMouseOver={() => setResetHover(true)}
							onMouseOut={() => setResetHover(false)}
							style={{
								padding: "0.75rem 1.25rem",
								backgroundColor: isResettingFlow
									? "#9ca3af"
									: resetHover
										? "#b91c1c"
										: "#ef4444",
								color: "white",
								border: "none",
								borderRadius: "0.375rem",
								fontSize: "0.875rem",
								fontWeight: "500",
								cursor: isResettingFlow ? "not-allowed" : "pointer",
								display: "inline-flex",
								alignItems: "center",
								gap: "0.5rem",
								transition: "background-color 0.2s",
								minWidth: "160px",
							}}
						>
							<FiRotateCcw
								style={{
									animation: isResettingFlow
										? "spin 1s linear infinite"
										: "none",
								}}
							/>
							{isResettingFlow ? "Resetting..." : "Reset Flow"}
						</button>
					</div>
				</div>
			</div>

			{/* Reset Confirmation Modal */}
			{showResetModal && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 1000,
					}}
				>
					<div
						style={{
							backgroundColor: "white",
							padding: "2rem",
							borderRadius: "8px",
							maxWidth: "400px",
							width: "90%",
						}}
					>
						<h3 style={{ marginTop: 0, color: "#ef4444" }}> Reset Flow</h3>
						<p>Are you sure you want to reset the entire flow? This will:</p>
						<ul>
							<li>Clear all step progress and results</li>
							<li>Remove authorization codes and tokens</li>
							<li>Reset to step 1</li>
							<li>Keep your saved credentials</li>
						</ul>
						<div
							style={{
								display: "flex",
								gap: "1rem",
								justifyContent: "flex-end",
								marginTop: "2rem",
							}}
						>
							<button
								type="button"
								onClick={() => setShowResetModal(false)}
								style={{
									padding: "0.5rem 1rem",
									backgroundColor: "#6b7280",
									color: "white",
									border: "none",
									borderRadius: "4px",
									cursor: "pointer",
								}}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleReset}
								disabled={isResettingFlow}
								style={{
									padding: "0.5rem 1rem",
									backgroundColor: isResettingFlow ? "#9ca3af" : "#ef4444",
									color: "white",
									border: "none",
									borderRadius: "4px",
									cursor: isResettingFlow ? "not-allowed" : "pointer",
								}}
							>
								{isResettingFlow ? "Resetting..." : "Reset Flow"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Clear Credentials Confirmation Modal */}
			{showClearCredentialsModal && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 1000,
					}}
				>
					<div
						style={{
							backgroundColor: "white",
							padding: "2rem",
							borderRadius: "8px",
							maxWidth: "400px",
							width: "90%",
						}}
					>
						<h3 style={{ marginTop: 0, color: "#f59e0b" }}>
							 Clear Credentials
						</h3>
						<p>
							Are you sure you want to clear all saved credentials? This will:
						</p>
						<ul>
							<li>Remove Environment ID, Client ID, and Client Secret</li>
							<li>Clear redirect URI and scopes</li>
							<li>Require re-entering credentials for future use</li>
						</ul>
						<div
							style={{
								display: "flex",
								gap: "1rem",
								justifyContent: "flex-end",
								marginTop: "2rem",
							}}
						>
							<button
								type="button"
								onClick={() => setShowClearCredentialsModal(false)}
								style={{
									padding: "0.5rem 1rem",
									backgroundColor: "#6b7280",
									color: "white",
									border: "none",
									borderRadius: "4px",
									cursor: "pointer",
								}}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleClearCredentials}
								style={{
									padding: "0.5rem 1rem",
									backgroundColor: "#f59e0b",
									color: "white",
									border: "none",
									borderRadius: "4px",
									cursor: "pointer",
								}}
							>
								Clear Credentials
							</button>
						</div>
					</div>
				</div>
			)}

			{/* OAuthErrorHelper - V2 Feature */}
			{showErrorHelper && currentError && flowConfig.enableErrorRecovery && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0, 0, 0, 0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 1000,
						padding: "1rem",
					}}
				>
					<div
						style={{
							backgroundColor: "white",
							borderRadius: "8px",
							maxWidth: "800px",
							width: "100%",
							maxHeight: "80vh",
							overflow: "auto",
						}}
					>
						<OAuthErrorHelper
							error={currentError.originalError?.error || "oauth_error"}
							errorDescription={currentError.message}
							correlationId={currentError.originalError?.correlation_id}
							onRetry={retryAfterError}
							onGoToConfig={() => {
								dismissError();
								window.location.href = "/configuration";
							}}
							onDismiss={dismissError}
						/>
					</div>
				</div>
			)}
		</>
	);
};

export default EnhancedAuthorizationCodeFlowV3;
