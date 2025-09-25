// src/pages/flows/OIDCImplicitFlowV3.tsx - OIDC 1.0 Implicit Flow V3
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiChevronDown,
	FiChevronRight,
	FiCopy,
	FiGlobe,
	FiRefreshCw,
	FiSearch,
	FiSettings,
	FiShield,
	FiUser,
} from "react-icons/fi";
import styled from "styled-components";
import AuthorizationRequestModal from "../../components/AuthorizationRequestModal";
import {
	showFlowError,
	showFlowSuccess,
} from "../../components/CentralizedSuccessMessage";
import { ColorCodedURL } from "../../components/ColorCodedURL";
import ConfirmationModal from "../../components/ConfirmationModal";
import DefaultRedirectUriModal from "../../components/DefaultRedirectUriModal";
import { EnhancedStepFlowV2 } from "../../components/EnhancedStepFlowV2";
import IDTokenEducationSection from "../../components/IDTokenEducationSection";
import {
	FormField,
	FormInput,
	FormLabel,
	InfoBox,
} from "../../components/steps/CommonSteps";
import TokenDisplay from "../../components/TokenDisplay";
import { useAuth } from "../../contexts/NewAuthContext";
import { usePerformanceTracking } from "../../hooks/useAnalytics";
import { useAuthorizationFlowScroll } from "../../hooks/usePageScroll";
import { getCallbackUrlForFlow } from "../../utils/callbackUrls";
import { copyToClipboard } from "../../utils/clipboard";
import { credentialManager } from "../../utils/credentialManager";
import { enhancedDebugger } from "../../utils/enhancedDebug";
import { useFlowStepManager } from "../../utils/flowStepSystem";
import {
	generateSecurityParameters,
	storeSecurityParameters,
} from "../../utils/implicitFlowSecurity";

// Styled components
const Container = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  color: #1f2937;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: #1f2937;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #6b7280;
  margin: 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const FlowCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  color: #1f2937;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
`;

const ParameterBreakdown = styled.div`
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
  border: 1px solid #d1e7ff;
  padding: 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const ParameterItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ParameterName = styled.span`
  font-weight: 600;
  color: #1f2937;
`;

const ParameterValue = styled.span`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #6b7280;
  max-width: 60%;
  word-break: break-all;
`;

const CopyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const JsonDisplay = styled.div`
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
  color: #1f2937;
  border: 1px solid #d1e7ff;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.3);
    }
    50% {
      transform: scale(1.02);
      box-shadow: 0 8px 12px -2px rgba(22, 163, 74, 0.4);
    }
  }
`;

const ActionButton = styled.button<{
	variant?: "primary" | "secondary" | "success" | "danger";
}>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ variant }) => {
		switch (variant) {
			case "primary":
				return `
          background-color: #3b82f6;
          color: white;
          &:hover { background-color: #2563eb; }
        `;
			case "success":
				return `
          background-color: #10b981;
          color: white;
          &:hover { background-color: #059669; }
        `;
			case "danger":
				return `
          background-color: #ef4444;
          color: white;
          &:hover { background-color: #dc2626; }
        `;
			default:
				return `
          background-color: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover { background-color: #e5e7eb; }
        `;
		}
	}}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

const FlowControlButton = styled.button<{ className?: string }>`
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  background: white;
  color: #374151;

  &:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  &.clear {
    background: #fef3c7;
    border-color: #f59e0b;
    color: #92400e;
    
    &:hover:not(:disabled) {
      background: #fde68a;
      border-color: #d97706;
    }
  }

  &.reset {
    background: #fef2f2;
    border-color: #fecaca;
    color: #dc2626;
    
    &:hover:not(:disabled) {
      background: #fee2e2;
      border-color: #fca5a5;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CredentialsSection = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const SecurityWarning = styled.div`
  background: #fef2f2;
  border: 1px solid #f87171;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  color: #dc2626;
`;

type OIDCImplicitFlowV3Props = Record<string, never>;

const OIDCImplicitFlowV3: React.FC<OIDCImplicitFlowV3Props> = () => {
	const authContext = useAuth();

	// Performance monitoring
	const _performanceTracking = usePerformanceTracking();

	// Start debug session
	React.useEffect(() => {
		const sessionId = enhancedDebugger.startSession("oidc-implicit-v3");
		console.log("🔍 [OIDC-IMPLICIT-V3] Debug session started:", sessionId);

		return () => {
			enhancedDebugger.endSession(sessionId);
		};
	}, []);

	// Use centralized scroll management
	const { scrollToTopAfterAction } = useAuthorizationFlowScroll(
		"OIDC Implicit Flow V3",
	);

	// Use the new step management system
	const stepManager = useFlowStepManager({
		flowType: "oidc-implicit",
		persistKey: "oidc_implicit_v3_step_manager",
		defaultStep: 0,
		enableAutoAdvance: true,
	});

	// Flow state
	const [credentials, setCredentials] = useState({
		environmentId: "",
		clientId: "",
		redirectUri: "",
		scopes: "openid",
	});

	// Validation state
	const [validationErrors, setValidationErrors] = useState({
		clientId: false,
		environmentId: false,
	});

	// Load credentials on mount
	useEffect(() => {
		const loadCredentials = () => {
			try {
				// Load implicit flow-specific credentials first
				const implicitCredentials =
					credentialManager.loadImplicitFlowCredentials();

				// If implicit flow credentials exist and have values, use them
				if (
					implicitCredentials.environmentId ||
					implicitCredentials.clientId ||
					implicitCredentials.redirectUri
				) {
					setCredentials({
						environmentId: implicitCredentials.environmentId || "",
						clientId: implicitCredentials.clientId || "",
						redirectUri: implicitCredentials.redirectUri || "",
						scopes: Array.isArray(implicitCredentials.scopes)
							? implicitCredentials.scopes.join(" ")
							: implicitCredentials.scopes || "openid",
					});
					console.log(
						"✅ [OIDC-IMPLICIT-V3] Loaded implicit flow credentials:",
						implicitCredentials,
					);
				} else {
					// Fall back to global configuration
					const configCredentials = credentialManager.loadConfigCredentials();
					if (
						configCredentials.environmentId ||
						configCredentials.clientId ||
						configCredentials.redirectUri
					) {
						setCredentials({
							environmentId: configCredentials.environmentId || "",
							clientId: configCredentials.clientId || "",
							redirectUri: configCredentials.redirectUri || "",
							scopes: Array.isArray(configCredentials.scopes)
								? configCredentials.scopes.join(" ")
								: configCredentials.scopes || "openid",
						});
						console.log(
							"✅ [OIDC-IMPLICIT-V3] Loaded global config credentials:",
							configCredentials,
						);
					} else {
						// Both are blank - show modal with default URI
						const defaultUri = getCallbackUrlForFlow("oidc-implicit-v3");
						setDefaultRedirectUri(defaultUri);
						setShowDefaultRedirectUriModal(true);
						setCredentials({
							environmentId: "",
							clientId: "",
							redirectUri: defaultUri,
							scopes: "openid",
						});
						console.log(
							"⚠️ [OIDC-IMPLICIT-V3] No credentials found, showing default redirect URI modal",
						);
					}
				}
			} catch (error) {
				console.error(
					"❌ [OIDC-IMPLICIT-V3] Failed to load credentials:",
					error,
				);
				// Fall back to defaults
				const defaultUri = getCallbackUrlForFlow("oidc-implicit-v3");
				setDefaultRedirectUri(defaultUri);
				setShowDefaultRedirectUriModal(true);
				setCredentials((prev) => ({
					...prev,
					redirectUri: defaultUri,
				}));
			}
		};

		loadCredentials();
	}, []);

	// Handle callback return with tokens
	useEffect(() => {
		const handleCallbackReturn = () => {
			try {
				// Check for tokens in sessionStorage (set by callback handler)
				const storedTokens = sessionStorage.getItem("implicit_tokens");
				if (storedTokens) {
					console.log(
						"🔑 [OIDC-IMPLICIT-V3] Found tokens from callback:",
						storedTokens,
					);

					const tokenData = JSON.parse(storedTokens);
					setTokens(tokenData);

					// Auto-advance to step 4 (token validation & display)
					stepManager.setStep(3, "callback return with tokens");
					console.log(
						"🔄 [OIDC-IMPLICIT-V3] Auto-advancing to step 4 (token validation) after callback return",
					);

					// Show success message
					showFlowSuccess(
						"🎉 Authorization Successful!",
						"Tokens received from PingOne. You can now view and validate the tokens.",
					);

					// Clean up sessionStorage
					sessionStorage.removeItem("implicit_tokens");

					// Clean up flow context
					sessionStorage.removeItem("oidc_implicit_v3_flow_context");

					// Clean up URL hash if present
					if (window.location.hash) {
						window.history.replaceState({}, "", window.location.pathname);
					}
				}
			} catch (error) {
				console.error(
					"❌ [OIDC-IMPLICIT-V3] Failed to handle callback return:",
					error,
				);
			}
		};

		handleCallbackReturn();
	}, [stepManager]);

	// Client ID validation function
	const validateClientId = useCallback((clientId: string): boolean => {
		if (!clientId || clientId.trim() === "") return false;
		// Basic validation - should be alphanumeric with hyphens/underscores
		const isValid = /^[a-zA-Z0-9_-]+$/.test(clientId) && clientId.length >= 8;
		return isValid;
	}, []);

	// Environment ID validation function
	const validateEnvironmentId = useCallback((envId: string): boolean => {
		if (!envId || envId.trim() === "") return false;
		// Should be UUID format
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		return uuidRegex.test(envId);
	}, []);

	// Update validation errors when credentials change
	useEffect(() => {
		setValidationErrors({
			clientId: credentials.clientId
				? !validateClientId(credentials.clientId)
				: false,
			environmentId: credentials.environmentId
				? !validateEnvironmentId(credentials.environmentId)
				: false,
		});
	}, [
		credentials.clientId,
		credentials.environmentId,
		validateClientId,
		validateEnvironmentId,
	]);

	const [responseType, setResponseType] = useState<
		"id_token" | "id_token token"
	>("id_token token");
	const [authUrl, setAuthUrl] = useState("");
	const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(
		null,
	);
	const [tokens, setTokens] = useState<Record<string, unknown> | null>(null);
	const [isRedirecting, setIsRedirecting] = useState(false);
	const [isGettingUserInfo, setIsGettingUserInfo] = useState(false);
	const [showClearCredentialsModal, setShowClearCredentialsModal] =
		useState(false);
	const [showAuthRequestModal, setShowAuthRequestModal] = useState(false);
	const [isClearingCredentials, setIsClearingCredentials] = useState(false);
	const [_copiedText, _setCopiedText] = useState<string | null>(null);
	const [showDefaultRedirectUriModal, setShowDefaultRedirectUriModal] =
		useState(false);
	const [defaultRedirectUri, setDefaultRedirectUri] = useState("");
	const [showEducationalContent, setShowEducationalContent] = useState(true);
	const [showClientIdTroubleshooting, setShowClientIdTroubleshooting] =
		useState(false);
	const [isResettingFlow, setIsResettingFlow] = useState(false);
	const [showGeneralTroubleshooting, setShowGeneralTroubleshooting] =
		useState(false);
	const [showParameterBreakdown, setShowParameterBreakdown] = useState(false);
	const [showTokenDetails, setShowTokenDetails] = useState(false);
	const [showUserInfoDetails, setShowUserInfoDetails] = useState(false);

	// Load credentials from storage
	useEffect(() => {
		const savedCredentials = localStorage.getItem(
			"oidc_implicit_v3_credentials",
		);
		if (savedCredentials) {
			try {
				const parsed = JSON.parse(savedCredentials);
				setCredentials((prev) => ({ ...prev, ...parsed }));
				console.log("✅ [OIDC-IMPLICIT-V3] Loaded saved credentials");
			} catch (error) {
				console.warn(
					"⚠️ [OIDC-IMPLICIT-V3] Failed to parse saved credentials:",
					error,
				);
			}
		}
	}, []);

	// Save credentials to storage
	const saveCredentials = useCallback(async () => {
		try {
			// Save to credential manager for implicit flow
			const success = credentialManager.saveImplicitFlowCredentials({
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri,
				scopes: credentials.scopes.split(" "),
			});

			if (!success) {
				throw new Error("Failed to save credentials to credential manager");
			}

			// Also store in localStorage for backward compatibility
			localStorage.setItem(
				"oidc_implicit_v3_credentials",
				JSON.stringify(credentials),
			);

			showFlowSuccess("Credentials saved successfully");
			console.log(
				"✅ [OIDC-IMPLICIT-V3] Credentials saved to credential manager and localStorage",
			);
		} catch (error) {
			showFlowError("Failed to save credentials");
			console.error("❌ [OIDC-IMPLICIT-V3] Failed to save credentials:", error);
		}
	}, [credentials]);

	// Clear credentials
	const clearCredentials = useCallback(async () => {
		setIsClearingCredentials(true);
		try {
			// Clear from credential manager
			credentialManager.saveImplicitFlowCredentials({
				environmentId: "",
				clientId: "",
				redirectUri: "",
				scopes: [],
			});

			// Clear from localStorage
			localStorage.removeItem("oidc_implicit_v3_credentials");

			setCredentials({
				environmentId: "",
				clientId: "",
				redirectUri: "",
				scopes: "openid",
			});

			showFlowSuccess("Credentials cleared successfully");
			console.log(
				"✅ [OIDC-IMPLICIT-V3] Credentials cleared from credential manager and localStorage",
			);
		} catch (error) {
			showFlowError("Failed to clear credentials");
			console.error(
				"❌ [OIDC-IMPLICIT-V3] Failed to clear credentials:",
				error,
			);
		} finally {
			setIsClearingCredentials(false);
			setShowClearCredentialsModal(false);
		}
	}, []);

	const handleContinueWithDefaultUri = () => {
		setShowDefaultRedirectUriModal(false);
		showFlowSuccess(
			"Using default redirect URI. Please configure it in your PingOne application.",
		);
	};

	// Build authorization URL
	const buildAuthorizationUrl = useCallback(async () => {
		try {
			// Validate credentials before building URL
			if (
				!credentials.environmentId ||
				!credentials.clientId ||
				!credentials.redirectUri ||
				!credentials.scopes
			) {
				throw new Error(
					"Missing required credentials. Please ensure all fields are filled.",
				);
			}

			const baseUrl = `https://auth.pingone.com/${credentials.environmentId}`;
			const authEndpoint = `${baseUrl}/as/authorize`;

			// Generate security parameters (state and nonce)
			const { state, nonce } = generateSecurityParameters(32);
			storeSecurityParameters("oidc", state, nonce);

			const params = new URLSearchParams({
				client_id: credentials.clientId,
				redirect_uri: credentials.redirectUri,
				response_type: responseType,
				scope: credentials.scopes,
				state: state,
				nonce: nonce,
			});

			const fullUrl = `${authEndpoint}?${params.toString()}`;
			setAuthUrl(fullUrl);

			console.log("✅ [OIDC-IMPLICIT-V3] Authorization URL built:", {
				endpoint: authEndpoint,
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri,
				responseType: responseType,
				scopes: credentials.scopes,
				stateLength: state.length,
				nonceLength: nonce.length,
				fullUrl: fullUrl,
			});

			console.log(
				"🚨 [OIDC-IMPLICIT-V3] IMPORTANT: Add this redirect URI to your PingOne application:",
			);
			console.log(`   Redirect URI: ${credentials.redirectUri}`);
			console.log(`   Environment: ${credentials.environmentId}`);
			console.log(
				"   Path: Applications → Your App → Configuration → Redirect URIs",
			);

			showFlowSuccess("Authorization URL built successfully!");
			return fullUrl;
		} catch (error) {
			console.error(
				"❌ [OIDC-IMPLICIT-V3] Failed to build authorization URL:",
				error,
			);
			showFlowError(`Failed to build authorization URL: ${error.message}`);
			throw error;
		}
	}, [credentials, responseType]);

	// Direct authorization redirect (without modal)
	const handleAuthorizationDirect = useCallback(() => {
		if (!authUrl) {
			showFlowError("Please build authorization URL first");
			return;
		}

		setIsRedirecting(true);
		console.log("🚀 [OIDC-IMPLICIT-V3] Redirecting to authorization server...");

		// Store flow context for callback
		sessionStorage.setItem(
			"oidc_implicit_v3_flow_context",
			JSON.stringify({
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri,
				scopes: credentials.scopes,
				responseType: responseType,
				timestamp: Date.now(),
			}),
		);

		// Redirect to authorization server
		window.location.href = authUrl;
	}, [authUrl, credentials, responseType]);

	// Handle authorization redirect with modal option
	const handleAuthorizationWithModal = useCallback(() => {
		if (!authUrl) {
			showFlowError("❌ Please generate authorization URL first");
			return;
		}

		// Check configuration setting for showing auth request modal
		const flowConfigKey = "enhanced-flow-authorization-code";
		const flowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || "{}");
		const shouldShowModal = flowConfig.showAuthRequestModal === true;

		if (shouldShowModal) {
			console.log(
				"🔧 [OIDC-IMPLICIT-V3] Showing authorization request modal (user preference)",
			);
			setShowAuthRequestModal(true);
		} else {
			console.log(
				"🔧 [OIDC-IMPLICIT-V3] Skipping authorization modal (user preference)",
			);
			handleAuthorizationDirect();
		}
	}, [authUrl, handleAuthorizationDirect]);

	// Handle authorization redirect (backwards compatibility)
	const handleAuthorization = useCallback(() => {
		handleAuthorizationWithModal();
	}, [handleAuthorizationWithModal]);

	// Get user info
	const getUserInfo = useCallback(async () => {
		if (!tokens?.access_token) {
			showFlowError("No access token available for UserInfo request");
			return;
		}

		setIsGettingUserInfo(true);
		try {
			const userInfoEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/userinfo`;

			const response = await fetch(userInfoEndpoint, {
				headers: {
					Authorization: `Bearer ${tokens.access_token}`,
					Accept: "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(
					`UserInfo request failed: ${response.status} ${response.statusText}`,
				);
			}

			const userInfoData = await response.json();
			setUserInfo(userInfoData);
			showFlowSuccess("User info retrieved successfully");

			console.log("✅ [OIDC-IMPLICIT-V3] User info retrieved:", userInfoData);
		} catch (error) {
			console.error("❌ [OIDC-IMPLICIT-V3] Failed to get user info:", error);
			showFlowError(`Failed to get user info: ${error.message}`);
		} finally {
			setIsGettingUserInfo(false);
		}
	}, [tokens, credentials.environmentId]);

	// Copy user info
	const copyUserInfo = useCallback(async () => {
		if (userInfo) {
			try {
				await copyToClipboard(JSON.stringify(userInfo, null, 2));
				showFlowSuccess("UserInfo copied to clipboard");
			} catch (_error) {
				showFlowError("Failed to copy UserInfo");
			}
		}
	}, [userInfo]);

	// Navigate to Token Management with token
	const navigateToTokenManagement = useCallback((tokenType: 'access' | 'id') => {
		console.log('🔍 [OIDCImplicitFlowV3] Navigate to token management:', {
			tokenType,
			hasTokens: !!tokens,
			hasAccessToken: !!tokens?.access_token,
			hasIdToken: !!tokens?.id_token,
			tokens
		});
		
		const token = tokenType === 'access' ? tokens?.access_token : tokens?.id_token;
		
		if (token) {
			console.log('✅ [OIDCImplicitFlowV3] Token found, storing for analysis:', {
				tokenType,
				tokenLength: token.length,
				tokenPreview: token.substring(0, 20) + '...'
			});
			
			// Store the token for the Token Management page
			sessionStorage.setItem('token_to_analyze', token);
			sessionStorage.setItem('token_type', tokenType);
			sessionStorage.setItem('flow_source', 'oidc-implicit-v3');
			
			console.log('🔍 [OIDCImplicitFlowV3] Navigating to token management page...');
			window.location.href = '/token-management';
		} else {
			console.error(`❌ [OIDCImplicitFlowV3] No ${tokenType} token available for analysis`);
			showFlowError(`No ${tokenType} token available for analysis`);
		}
	}, [tokens]);

	// Reset flow
	const resetFlow = useCallback(async () => {
		console.log("🔄 [OIDC-IMPLICIT-V3] Reset flow initiated");

		setIsResettingFlow(true);

		try {
			// Simulate a brief delay for better UX
			await new Promise((resolve) => setTimeout(resolve, 500));

			console.log(
				"🔍 [OIDC-IMPLICIT-V3] Current step before reset:",
				stepManager.currentStepIndex,
			);

			// Clear all state
			setAuthUrl("");
			setTokens(null);
			setUserInfo(null);
			sessionStorage.removeItem("oidc_implicit_v3_state");
			sessionStorage.removeItem("oidc_implicit_v3_nonce");
			sessionStorage.removeItem("oidc_implicit_v3_flow_context");

			// Reset step manager
			stepManager.resetFlow();

			// Show success message to user
			console.log(
				"🎉 [OIDC-IMPLICIT-V3] About to show success message for reset",
			);
			showFlowSuccess(
				"🔄 OIDC Implicit Flow reset successfully! You can now begin a new flow.",
			);
			console.log("✅ [OIDC-IMPLICIT-V3] Success message shown for reset");

			// AGGRESSIVE SCROLL TO TOP - try all methods
			console.log(
				"📜 [OIDC-IMPLICIT-V3] AGGRESSIVE SCROLL - position before:",
				window.pageYOffset,
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
				window.scrollTo({ top: 0, behavior: "instant" });

				// Scroll all possible containers
				const containers = [
					document.documentElement,
					document.body,
					document.querySelector("main"),
					document.querySelector("[data-scrollable]"),
					document.querySelector(".app-container"),
					document.querySelector(".page-container"),
				];

				containers.forEach((container) => {
					if (container) {
						container.scrollTop = 0;
						if (container.scrollTo) {
							container.scrollTo(0, 0);
						}
					}
				});

				console.log("📜 [OIDC-IMPLICIT-V3] Force scrolled all containers");
			};

			// Execute force scroll immediately and with delays
			scrollAllContainers();
			setTimeout(scrollAllContainers, 100);
			setTimeout(scrollAllContainers, 300);
			setTimeout(scrollAllContainers, 500);

			console.log("✅ [OIDC-IMPLICIT-V3] Flow reset complete");
		} catch (error) {
			console.error("❌ [OIDC-IMPLICIT-V3] Reset flow failed:", error);
			showFlowError("Failed to reset flow");
		} finally {
			setIsResettingFlow(false);
		}
	}, [stepManager, scrollToTopAfterAction]);

	// Create steps
	const steps = useMemo(
		() => [
			{
				id: "setup-credentials",
				title: "Setup Credentials",
				description:
					"Configure your PingOne application credentials for OIDC Implicit flow",
				icon: <FiSettings />,
				category: "preparation",
				content: (
					<div>
						<CredentialsSection>
							<FormField>
								<FormLabel>Environment ID *</FormLabel>
								<FormInput
									type="text"
									value={credentials.environmentId}
									onChange={(e) =>
										setCredentials((prev) => ({
											...prev,
											environmentId: e.target.value,
										}))
									}
									placeholder="Enter your PingOne Environment ID"
									required
								/>
							</FormField>

							<FormField>
								<FormLabel>Client ID *</FormLabel>
								<FormInput
									type="text"
									value={credentials.clientId}
									onChange={(e) =>
										setCredentials((prev) => ({
											...prev,
											clientId: e.target.value,
										}))
									}
									placeholder="Enter your application Client ID"
									required
								/>
							</FormField>

							<FormField>
								<FormLabel>Redirect URI *</FormLabel>
								<FormInput
									type="url"
									value={credentials.redirectUri}
									onChange={(e) =>
										setCredentials((prev) => ({
											...prev,
											redirectUri: e.target.value,
										}))
									}
									placeholder="https://localhost:3000/implicit-callback"
									required
								/>
								<div
									style={{
										fontSize: "0.875rem",
										color: "#6b7280",
										marginTop: "0.25rem",
									}}
								>
									Must match exactly with your PingOne application configuration
								</div>
							</FormField>

							<FormField>
								<FormLabel>Scopes *</FormLabel>
								<FormInput
									type="text"
									value={credentials.scopes}
									onChange={(e) =>
										setCredentials((prev) => ({
											...prev,
											scopes: e.target.value,
										}))
									}
									placeholder="openid profile email"
									required
								/>
								<div
									style={{
										fontSize: "0.875rem",
										color: "#6b7280",
										marginTop: "0.25rem",
									}}
								>
									Space-separated list of OIDC scopes (must include 'openid')
								</div>
							</FormField>

							<FormField>
								<FormLabel>Response Type *</FormLabel>
								<FormSelect
									value={responseType}
									onChange={(e) =>
										setResponseType(
											e.target.value as "id_token" | "id_token token",
										)
									}
									required
								>
									<option value="id_token">id_token (ID Token only)</option>
									<option value="id_token token">
										id_token token (ID Token + Access Token)
									</option>
								</FormSelect>
								<div
									style={{
										fontSize: "0.875rem",
										color: "#6b7280",
										marginTop: "0.25rem",
									}}
								>
									Choose whether to request only ID token or both ID token and
									access token
								</div>
							</FormField>
						</CredentialsSection>
					</div>
				),
				execute: saveCredentials,
				canExecute: Boolean(
					credentials.environmentId &&
						credentials.clientId &&
						credentials.redirectUri &&
						credentials.scopes,
				),
				completed: Boolean(
					credentials.environmentId &&
						credentials.clientId &&
						credentials.redirectUri &&
						credentials.scopes,
				),
			},
			{
				id: "build-auth-url",
				title: "Build Authorization URL",
				description:
					"Generate the authorization URL with proper parameters for OIDC Implicit flow",
				icon: <FiGlobe />,
				category: "authorization",
				content: (
					<div>
						<InfoBox type="info">
							<FiGlobe />
							<div>
								<strong>OIDC Implicit Flow Authorization URL</strong>
								<br />
								This step generates the authorization URL that will redirect the
								user to PingOne for authentication. The response_type determines
								whether you receive only an ID token or both ID token and access
								token.
							</div>
						</InfoBox>

						{/* Authorization URL Details - Collapsible */}
						<div
							style={{
								marginBottom: "1.5rem",
								background: "#f8fafc",
								border: "1px solid #e2e8f0",
								borderRadius: "8px",
								overflow: "hidden",
							}}
						>
							<div
								style={{
									padding: "1rem",
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									backgroundColor: "#f8fafc",
								}}
								onClick={() => {
									const newState = !showParameterBreakdown;
									setShowParameterBreakdown(newState);
									showFlowSuccess(
										newState
											? "📂 Parameter Breakdown Expanded"
											: "📁 Parameter Breakdown Collapsed",
										newState
											? "Authorization URL parameters are now visible"
											: "Parameter breakdown has been collapsed",
									);
								}}
							>
								<h4
									style={{
										margin: 0,
										color: "#374151",
										display: "flex",
										alignItems: "center",
									}}
								>
									<FiGlobe style={{ marginRight: "0.5rem" }} />
									Authorization URL Details
								</h4>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										width: "2rem",
										height: "2rem",
										borderRadius: "6px",
										background: "#fef2f2",
										border: "2px solid #ef4444",
										boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
										transition: "all 0.2s ease",
									}}
								>
									{showParameterBreakdown ? (
										<FiChevronDown size={14} style={{ color: "#3b82f6" }} />
									) : (
										<FiChevronRight size={14} style={{ color: "#3b82f6" }} />
									)}
								</div>
							</div>

							{showParameterBreakdown && (
								<div style={{ padding: "0 1rem 1rem 1rem" }}>
									<h5 style={{ margin: "0 0 0.75rem 0", color: "#374151" }}>
										Authorization Endpoint:
									</h5>
									<ParameterBreakdown>
										<ParameterItem>
											<ParameterName>Endpoint</ParameterName>
											<ParameterValue>
												https://auth.pingone.com/{credentials.environmentId}
												/as/authorize
											</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterName>Method</ParameterName>
											<ParameterValue>GET</ParameterValue>
										</ParameterItem>
									</ParameterBreakdown>

									<h5 style={{ margin: "1rem 0 0.75rem 0", color: "#374151" }}>
										Required Parameters:
									</h5>
									<ParameterBreakdown>
										<ParameterItem>
											<ParameterName>client_id</ParameterName>
											<ParameterValue>
												{credentials.clientId || "[Your Client ID]"}
											</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterName>redirect_uri</ParameterName>
											<ParameterValue>
												{credentials.redirectUri || "[Your Redirect URI]"}
											</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterName>response_type</ParameterName>
											<ParameterValue>{responseType}</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterName>scope</ParameterName>
											<ParameterValue>
												{credentials.scopes || "[Your Scopes]"}
											</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterName>state</ParameterName>
											<ParameterValue>
												Generated random string for CSRF protection
											</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterName>nonce</ParameterName>
											<ParameterValue>
												Generated random string for ID token validation
											</ParameterValue>
										</ParameterItem>
									</ParameterBreakdown>
								</div>
							)}
						</div>

						{/* Client ID Validation Warning - Collapsible */}
						{credentials.clientId && validationErrors.clientId && (
							<div
								style={{
									marginTop: "1.5rem",
									background: "#fef2f2",
									border: "1px solid #fecaca",
									borderRadius: "8px",
									overflow: "hidden",
								}}
							>
								<div
									style={{
										padding: "1rem",
										cursor: "pointer",
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										backgroundColor: "#fef2f2",
									}}
									onClick={() => {
										const newState = !showClientIdTroubleshooting;
										setShowClientIdTroubleshooting(newState);
										showFlowSuccess(
											newState
												? "🔧 Client ID Troubleshooting Expanded"
												: "📁 Client ID Troubleshooting Collapsed",
											newState
												? "Client ID troubleshooting steps are now visible"
												: "Troubleshooting section has been collapsed",
										);
									}}
								>
									<h4
										style={{
											margin: 0,
											color: "#dc2626",
											display: "flex",
											alignItems: "center",
										}}
									>
										<FiAlertTriangle style={{ marginRight: "0.5rem" }} />
										Client ID Validation for Implicit Flow
									</h4>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											width: "2rem",
											height: "2rem",
											borderRadius: "6px",
											background: "#fef2f2",
											border: "2px solid #ef4444",
											boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
											transition: "all 0.2s ease",
										}}
									>
										{showClientIdTroubleshooting ? (
											<FiChevronDown size={14} style={{ color: "#3b82f6" }} />
										) : (
											<FiChevronRight size={14} style={{ color: "#3b82f6" }} />
										)}
									</div>
								</div>

								{showClientIdTroubleshooting && (
									<div
										style={{
											padding: "0 1rem 1rem 1rem",
											fontSize: "0.875rem",
											color: "#dc2626",
											lineHeight: "1.5",
										}}
									>
										<p style={{ margin: "0 0 0.5rem 0" }}>
											<strong>⚠️ NOT_FOUND Error = Client ID Issue</strong>
										</p>
										<p style={{ margin: "0 0 0.5rem 0" }}>
											If you get a "NOT_FOUND" error, PingOne cannot find your
											Client ID. This usually means:
										</p>
										<ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
											<li>
												<strong>Wrong Client ID:</strong> The Client ID doesn't
												exist in your PingOne environment
											</li>
											<li>
												<strong>Wrong Environment:</strong> The Client ID exists
												but in a different environment
											</li>
											<li>
												<strong>Application Deleted:</strong> The application
												was deleted from PingOne
											</li>
											<li>
												<strong>Copy/Paste Error:</strong> Extra spaces or
												characters in the Client ID
											</li>
										</ul>
										<div
											style={{
												background: "#fef3c7",
												border: "1px solid #f59e0b",
												borderRadius: "4px",
												padding: "0.75rem",
												marginTop: "0.5rem",
											}}
										>
											<p style={{ margin: "0 0 0.5rem 0", fontWeight: "bold" }}>
												🔍 How to Find the Correct Client ID:
											</p>
											<ol style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
												<li>
													Go to <strong>PingOne Admin Console</strong>
												</li>
												<li>
													Navigate to <strong>Applications</strong> →{" "}
													<strong>Applications</strong>
												</li>
												<li>Find your application and click on it</li>
												<li>
													Go to <strong>Configuration</strong> tab
												</li>
												<li>
													Copy the <strong>Client ID</strong> exactly (no extra
													spaces)
												</li>
												<li>
													Make sure the application has{" "}
													<strong>Implicit Flow</strong> enabled
												</li>
											</ol>
										</div>
										<p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8rem" }}>
											<strong>Current Client ID:</strong>{" "}
											<code
												style={{
													background: "#f3f4f6",
													padding: "2px 4px",
													borderRadius: "3px",
												}}
											>
												{credentials.clientId || "[Not set]"}
											</code>
											<br />
											<strong>Environment ID:</strong>{" "}
											<code
												style={{
													background: "#f3f4f6",
													padding: "2px 4px",
													borderRadius: "3px",
												}}
											>
												{credentials.environmentId || "[Not set]"}
											</code>
										</p>
									</div>
								)}
							</div>
						)}

						{/* General Troubleshooting Section - Collapsible */}
						<div
							style={{
								marginTop: "1.5rem",
								background: "#fef3c7",
								border: "1px solid #f59e0b",
								borderRadius: "8px",
								overflow: "hidden",
							}}
						>
							<div
								style={{
									padding: "1rem",
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									backgroundColor: "#fef3c7",
								}}
								onClick={() => {
									const newState = !showGeneralTroubleshooting;
									setShowGeneralTroubleshooting(newState);
									showFlowSuccess(
										newState
											? "🔧 General Troubleshooting Expanded"
											: "📁 General Troubleshooting Collapsed",
										newState
											? "General troubleshooting steps are now visible"
											: "Troubleshooting section has been collapsed",
									);
								}}
							>
								<h4
									style={{
										margin: 0,
										color: "#92400e",
										display: "flex",
										alignItems: "center",
									}}
								>
									<FiAlertTriangle style={{ marginRight: "0.5rem" }} />
									Additional Troubleshooting
								</h4>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										width: "2rem",
										height: "2rem",
										borderRadius: "6px",
										background: "#fef2f2",
										border: "2px solid #ef4444",
										boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
										transition: "all 0.2s ease",
									}}
								>
									{showGeneralTroubleshooting ? (
										<FiChevronDown size={14} style={{ color: "#3b82f6" }} />
									) : (
										<FiChevronRight size={14} style={{ color: "#3b82f6" }} />
									)}
								</div>
							</div>

							{showGeneralTroubleshooting && (
								<div
									style={{
										padding: "0 1rem 1rem 1rem",
										fontSize: "0.875rem",
										color: "#92400e",
										lineHeight: "1.5",
									}}
								>
									<ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
										<li>
											Ensure the <strong>Redirect URI</strong>{" "}
											<code>https://localhost:3000/implicit-callback-v3</code>{" "}
											is configured in your PingOne application
										</li>
										<li>
											Check that your PingOne application is configured for{" "}
											<strong>Implicit Flow</strong>
										</li>
										<li>
											Verify the application has the required{" "}
											<strong>scopes</strong> (openid, profile, email)
										</li>
										<li>
											Make sure you're using the correct{" "}
											<strong>Environment ID</strong> from PingOne Admin Console
										</li>
									</ul>
								</div>
							)}
						</div>

						{/* Generated Authorization URL - At Bottom, Expanded by Default */}
						{authUrl && (
							<div
								style={{
									marginTop: "2rem",
									padding: "1.5rem",
									background: "#f0fdf4",
									border: "1px solid #22c55e",
									borderRadius: "0.5rem",
								}}
							>
								<h4 style={{ margin: "0 0 1rem 0", color: "#15803d" }}>
									Generated Authorization URL
								</h4>

								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
										padding: "0.75rem",
										backgroundColor: "#f0fdf4",
										border: "1px solid #22c55e",
										borderRadius: "0.5rem",
										marginBottom: "1rem",
									}}
								>
									<div style={{ flex: 1 }}>
										<ColorCodedURL url={authUrl} />
									</div>
									<button
										onClick={() => {
											copyToClipboard(authUrl, "Authorization URL");
											showFlowSuccess(
												"📋 Authorization URL Copied",
												"The authorization URL has been copied to your clipboard",
											);
										}}
										style={{
											background: "none",
											border: "1px solid #007bff",
											color: "#007bff",
											cursor: "pointer",
											padding: "0.25rem 0.5rem",
											borderRadius: "4px",
											display: "flex",
											alignItems: "center",
											gap: "0.25rem",
										}}
									>
										<FiCopy size={16} />
									</button>
								</div>
							</div>
						)}
					</div>
				),
				execute: buildAuthorizationUrl,
				canExecute: Boolean(
					credentials.environmentId &&
						credentials.clientId &&
						credentials.redirectUri &&
						credentials.scopes,
				),
				completed: Boolean(authUrl),
			},
			{
				id: "user-authorization",
				title: "User Authorization",
				description:
					"Redirect user to authorization server for authentication and consent",
				icon: <FiUser />,
				category: "authorization",
				content: (
					<div>
						<InfoBox type="info">
							<FiUser />
							<div>
								<strong>User Authorization Required</strong>
								<br />
								Click the button below to redirect the user to PingOne for
								authentication. The user will be prompted to log in and grant
								permissions to your application.
							</div>
						</InfoBox>

						{authUrl && (
							<div
								style={{
									marginTop: "1.5rem",
									padding: "1rem",
									background: "#f0fdf4",
									border: "1px solid #bbf7d0",
									borderRadius: "8px",
								}}
							>
								<h4 style={{ margin: "0 0 0.75rem 0", color: "#166534" }}>
									Authorization URL:
								</h4>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<div style={{ flex: 1 }}>
										<ColorCodedURL url={authUrl} />
									</div>
									<button
										onClick={() => {
											copyToClipboard(authUrl, "Authorization URL");
											showFlowSuccess(
												"📋 Authorization URL Copied",
												"The authorization URL has been copied to your clipboard",
											);
										}}
										style={{
											background: "none",
											border: "1px solid #007bff",
											color: "#007bff",
											cursor: "pointer",
											padding: "0.25rem 0.5rem",
											borderRadius: "4px",
											display: "flex",
											alignItems: "center",
											gap: "0.25rem",
										}}
									>
										<FiCopy size={16} />
									</button>
								</div>
							</div>
						)}

						<div
							style={{
								marginTop: "1.5rem",
								padding: "1rem",
								background: "#fef3c7",
								border: "1px solid #f59e0b",
								borderRadius: "6px",
								fontSize: "0.875rem",
								color: "#92400e",
							}}
						>
							<strong>⚠️ Important:</strong> After authorization, the user will
							be redirected back with tokens in the URL fragment. The callback
							handler will extract and validate these tokens automatically.
						</div>
					</div>
				),
				execute: handleAuthorization,
				canExecute: Boolean(authUrl && !isRedirecting),
				completed: Boolean(tokens),
			},
			{
				id: "token-validation",
				title: "Token Validation & Display",
				description:
					"Validate and display the received ID token and access token",
				icon: <FiShield />,
				category: "validation",
				content: (
					<div>
						{tokens ? (
							<div>
								<InfoBox type="success">
									<FiCheckCircle />
									<div>
										<strong>✅ OIDC Implicit Flow Successful!</strong>
										<br />
										Tokens received and validated successfully.
									</div>
								</InfoBox>

								{/* Token Display Section */}
								<div style={{ marginTop: "1.5rem" }}>
									<h4>Received Tokens:</h4>

									{/* ID Token Display */}
									{tokens.id_token && (
										<div>
											<div
												style={{
													background: "#f8fafc",
													border: "1px solid #e2e8f0",
													borderRadius: "8px",
													padding: "1rem",
													marginBottom: "1rem",
												}}
											>
												<div
													style={{
														display: "flex",
														alignItems: "center",
														gap: "0.5rem",
														marginBottom: "0.75rem",
													}}
												>
													<strong
														style={{ color: "#1f2937", fontSize: "0.9rem" }}
													>
														ID Token:
													</strong>
													<CopyButton
														onClick={() =>
															copyToClipboard(tokens.id_token, "ID Token")
														}
													>
														<FiCopy /> Copy
													</CopyButton>
													<CopyButton
														onClick={() => navigateToTokenManagement('id')}
														style={{ backgroundColor: '#3b82f6', color: 'white' }}
													>
														<FiSearch /> Analyze
													</CopyButton>
												</div>
												<TokenDisplay>{tokens.id_token}</TokenDisplay>
											</div>

											{/* ID Token Education Section */}
											<IDTokenEducationSection defaultCollapsed={true} />
										</div>
									)}

									{/* Access Token Display */}
									{tokens.access_token && (
										<div
											style={{
												background: "#f8fafc",
												border: "1px solid #e2e8f0",
												borderRadius: "8px",
												padding: "1rem",
												marginBottom: "1rem",
											}}
										>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: "0.5rem",
													marginBottom: "0.75rem",
												}}
											>
												<strong
													style={{ color: "#1f2937", fontSize: "0.9rem" }}
												>
													Access Token:
												</strong>
												<CopyButton
													onClick={() =>
														copyToClipboard(tokens.access_token, "Access Token")
													}
												>
													<FiCopy /> Copy
												</CopyButton>
												<CopyButton
													onClick={() => navigateToTokenManagement('access')}
													style={{ backgroundColor: '#3b82f6', color: 'white' }}
												>
													<FiSearch /> Analyze
												</CopyButton>
											</div>
											<TokenDisplay>{tokens.access_token}</TokenDisplay>
										</div>
									)}

									{/* Token Details - Collapsible */}
									<div
										style={{
											background: "#f8fafc",
											border: "1px solid #e2e8f0",
											borderRadius: "8px",
											marginBottom: "1rem",
											overflow: "hidden",
										}}
									>
										<div
											style={{
												padding: "1rem",
												cursor: "pointer",
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												backgroundColor: "#f8fafc",
											}}
											onClick={() => setShowTokenDetails(!showTokenDetails)}
										>
											<h5
												style={{
													margin: 0,
													color: "#1f2937",
													display: "flex",
													alignItems: "center",
												}}
											>
												<FiShield style={{ marginRight: "0.5rem" }} />
												Token Details
											</h5>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													width: "2rem",
													height: "2rem",
													borderRadius: "6px",
													background: "#fef2f2",
													border: "2px solid #ef4444",
													boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
													transition: "all 0.2s ease",
												}}
											>
												{showTokenDetails ? (
													<FiChevronDown
														size={14}
														style={{ color: "#3b82f6" }}
													/>
												) : (
													<FiChevronRight
														size={14}
														style={{ color: "#3b82f6" }}
													/>
												)}
											</div>
										</div>

										{showTokenDetails && (
											<div style={{ padding: "0 1rem 1rem 1rem" }}>
												<div
													style={{
														display: "grid",
														gap: "0.5rem",
														fontSize: "0.875rem",
													}}
												>
													{tokens.token_type && (
														<div>
															<strong>Token Type:</strong> {tokens.token_type}
														</div>
													)}
													{tokens.expires_in && (
														<div>
															<strong>Expires In:</strong> {tokens.expires_in}{" "}
															seconds
														</div>
													)}
													{tokens.scope && (
														<div>
															<strong>Scope:</strong> {tokens.scope}
														</div>
													)}
												</div>
											</div>
										)}
									</div>

									<div
										style={{
											marginTop: "1.5rem",
											padding: "1rem",
											background: "#f0fdf4",
											border: "1px solid #bbf7d0",
											borderRadius: "6px",
											fontSize: "0.875rem",
											color: "#15803d",
										}}
									>
										<strong>✅ Token Validation Complete!</strong>
										<br />
										Your tokens are ready to use. Remember that implicit flow
										tokens are typically short-lived and cannot be refreshed -
										you'll need to re-authenticate when they expire.
									</div>
								</div>
							</div>
						) : (
							<InfoBox type="info">
								<FiShield />
								<div>
									<strong>Waiting for Token Response</strong>
									<br />
									Complete the user authorization step to receive your tokens.
								</div>
							</InfoBox>
						)}
					</div>
				),
				canExecute: false,
				completed: Boolean(tokens),
			},
			{
				id: "user-info",
				title: "Get User Information",
				description:
					"Use the access token to retrieve user profile information",
				icon: <FiUser />,
				category: "validation",
				content: (
					<div>
						{tokens?.access_token ? (
							<div>
								<InfoBox type="info">
									<FiUser />
									<div>
										<strong>User Information Retrieval</strong>
										<br />
										Use the access token to call the UserInfo endpoint and
										retrieve the authenticated user's profile.
									</div>
								</InfoBox>

								<div style={{ marginTop: "1.5rem" }}>
									{/* UserInfo Endpoint Details - Collapsible */}
									<div
										style={{
											marginBottom: "1.5rem",
											background: "#f8fafc",
											border: "1px solid #e2e8f0",
											borderRadius: "8px",
											overflow: "hidden",
										}}
									>
										<div
											style={{
												padding: "1rem",
												cursor: "pointer",
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												backgroundColor: "#f8fafc",
											}}
											onClick={() =>
												setShowUserInfoDetails(!showUserInfoDetails)
											}
										>
											<h4
												style={{
													margin: 0,
													color: "#374151",
													display: "flex",
													alignItems: "center",
												}}
											>
												<FiUser style={{ marginRight: "0.5rem" }} />
												UserInfo Endpoint Details
											</h4>
											<div
												style={{
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													width: "2rem",
													height: "2rem",
													borderRadius: "6px",
													background: "#fef2f2",
													border: "2px solid #ef4444",
													boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
													transition: "all 0.2s ease",
												}}
											>
												{showUserInfoDetails ? (
													<FiChevronDown
														size={14}
														style={{ color: "#3b82f6" }}
													/>
												) : (
													<FiChevronRight
														size={14}
														style={{ color: "#3b82f6" }}
													/>
												)}
											</div>
										</div>

										{showUserInfoDetails && (
											<div style={{ padding: "0 1rem 1rem 1rem" }}>
												<ParameterBreakdown>
													<ParameterItem>
														<ParameterName>Endpoint</ParameterName>
														<ParameterValue>
															https://auth.pingone.com/
															{credentials.environmentId}/as/userinfo
														</ParameterValue>
													</ParameterItem>
													<ParameterItem>
														<ParameterName>Method</ParameterName>
														<ParameterValue>GET</ParameterValue>
													</ParameterItem>
													<ParameterItem>
														<ParameterName>Authorization</ParameterName>
														<ParameterValue>
															Bearer {tokens.access_token.substring(0, 20)}...
														</ParameterValue>
													</ParameterItem>
												</ParameterBreakdown>
											</div>
										)}
									</div>

									<div style={{ marginTop: "1.5rem" }}>
										<ActionButton
											onClick={getUserInfo}
											disabled={isGettingUserInfo}
										>
											{isGettingUserInfo ? (
												<>
													<div
														className="spinner"
														style={{ width: "16px", height: "16px" }}
													/>
													Getting User Info...
												</>
											) : (
												<>
													<FiUser />
													Get User Info
												</>
											)}
										</ActionButton>
									</div>

									{userInfo && (
										<div style={{ marginTop: "1.5rem" }}>
											<h4>User Information:</h4>
											<JsonDisplay>
												<pre>{JSON.stringify(userInfo, null, 2)}</pre>
											</JsonDisplay>
											<div style={{ marginTop: "0.5rem" }}>
												<CopyButton onClick={copyUserInfo}>
													<FiCopy /> Copy UserInfo
												</CopyButton>
											</div>
										</div>
									)}
								</div>
							</div>
						) : (
							<InfoBox type="warning">
								<FiAlertTriangle />
								<div>
									<strong>Access Token Required</strong>
									<br />
									You need an access token to retrieve user information. Make
									sure you selected "id_token token" as the response type in the
									credentials setup.
								</div>
							</InfoBox>
						)}
					</div>
				),
				canExecute: Boolean(tokens?.access_token),
				completed: Boolean(userInfo),
			},
		],
		[
			credentials,
			responseType,
			authUrl,
			tokens,
			userInfo,
			isRedirecting,
			isGettingUserInfo,
			saveCredentials,
			buildAuthorizationUrl,
			handleAuthorization,
			getUserInfo,
			copyUserInfo,
			showParameterBreakdown,
			showClientIdTroubleshooting,
			showGeneralTroubleshooting,
			showTokenDetails,
			showUserInfoDetails,
			validationErrors.clientId,
		],
	);

	return (
		<Container>
			<Header>
				<Title>OIDC Implicit Flow V3</Title>
				<Subtitle>
					OpenID Connect 1.0 Implicit Flow implementation with comprehensive
					educational content
				</Subtitle>
			</Header>

			<FlowCard>
				{/* Educational Overview - Only show on first step */}
				{stepManager.currentStepIndex === 0 && (
					<div
						style={{
							padding: "2rem",
							borderBottom: "1px solid #e5e7eb",
							background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
						}}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								cursor: "pointer",
								marginBottom: showEducationalContent ? "1.5rem" : "0",
							}}
							onClick={() => setShowEducationalContent(!showEducationalContent)}
						>
							<h2 style={{ margin: 0, color: "#1f2937", fontSize: "1.5rem" }}>
								🔍 What is OIDC Implicit Flow?
							</h2>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: "2.5rem",
									height: "2.5rem",
									borderRadius: "8px",
									background: "#fef2f2",
									border: "2px solid #ef4444",
									boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
									transition: "all 0.2s ease",
									transform: showEducationalContent
										? "rotate(0deg)"
										: "rotate(90deg)",
									cursor: "pointer",
								}}
							>
								{showEducationalContent ? (
									<FiChevronDown size={16} style={{ color: "#3b82f6" }} />
								) : (
									<FiChevronRight size={16} style={{ color: "#3b82f6" }} />
								)}
							</div>
						</div>

						{showEducationalContent && (
							<>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "1fr 1fr",
										gap: "2rem",
										marginBottom: "2rem",
									}}
								>
									<div>
										<h3 style={{ color: "#374151", marginBottom: "1rem" }}>
											How It Works
										</h3>
										<ul
											style={{
												color: "#6b7280",
												lineHeight: "1.6",
												paddingLeft: "1.5rem",
											}}
										>
											<li>Client redirects user to authorization server</li>
											<li>User authenticates and authorizes the application</li>
											<li>
												Authorization server redirects back with tokens in URL
												fragment
											</li>
											<li>Client extracts tokens directly from the URL</li>
											<li>No secure server-side token exchange required</li>
										</ul>
									</div>

									<div>
										<h3 style={{ color: "#374151", marginBottom: "1rem" }}>
											When to Use
										</h3>
										<ul
											style={{
												color: "#6b7280",
												lineHeight: "1.6",
												paddingLeft: "1.5rem",
											}}
										>
											<li>
												<strong>Single Page Applications (SPAs)</strong> -
												React, Vue, Angular
											</li>
											<li>
												<strong>Mobile Apps</strong> - Native iOS/Android
												applications
											</li>
											<li>
												<strong>Desktop Apps</strong> - Electron, native desktop
												apps
											</li>
											<li>
												<strong>Public Clients</strong> - Apps that can't
												securely store secrets
											</li>
											<li>
												<strong>Legacy Systems</strong> - Older applications
												that can't support PKCE
											</li>
										</ul>
									</div>
								</div>

								<div
									style={{
										background: "#fef3c7",
										border: "1px solid #f59e0b",
										borderRadius: "8px",
										padding: "1rem",
									}}
								>
									<h4
										style={{
											color: "#92400e",
											margin: "0 0 0.5rem 0",
											display: "flex",
											alignItems: "center",
										}}
									>
										<FiAlertTriangle style={{ marginRight: "0.5rem" }} />
										Security Considerations
									</h4>
									<div
										style={{
											color: "#92400e",
											fontSize: "0.875rem",
											lineHeight: "1.5",
										}}
									>
										<p style={{ margin: "0 0 0.5rem 0" }}>
											<strong>⚠️ Deprecated:</strong> OAuth 2.0 Security Best
											Practices recommends against Implicit Flow for new
											applications.
										</p>
										<p style={{ margin: "0 0 0.5rem 0" }}>
											<strong>🔓 Token Exposure:</strong> Tokens are exposed in
											the URL fragment, making them visible in browser history,
											server logs, and referrer headers.
										</p>
										<p style={{ margin: "0" }}>
											<strong>✅ Modern Alternative:</strong> Use Authorization
											Code Flow with PKCE for better security.
										</p>
									</div>
								</div>
							</>
						)}
					</div>
				)}

				{/* Security Warning */}
				<SecurityWarning>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "0.5rem",
							marginBottom: "0.5rem",
						}}
					>
						<FiAlertTriangle />
						<strong>OIDC Implicit Flow (Deprecated)</strong>
					</div>
					<div style={{ fontSize: "0.875rem", lineHeight: "1.5" }}>
						This flow is <strong>deprecated</strong> due to security concerns.
						ID tokens and access tokens are exposed in the URL fragment, making
						them vulnerable to theft. This implementation is provided for legacy
						compatibility and educational purposes only. For new applications,
						use the Authorization Code flow with PKCE instead.
					</div>
				</SecurityWarning>

				{/* Main Step Flow */}
				<EnhancedStepFlowV2
					steps={steps}
					title="🔑 OIDC Implicit Flow V3"
					persistKey="oidc_implicit_v3_flow_steps"
					initialStepIndex={stepManager.currentStepIndex}
					onStepChange={stepManager.setStep}
					autoAdvance={false}
					showDebugInfo={false}
					allowStepJumping={true}
					onStepComplete={(stepId, result) => {
						console.log(
							"✅ [OIDC-IMPLICIT-V3] Step completed:",
							stepId,
							result,
						);
					}}
				/>

				{/* Flow Control Actions */}
				<FlowControlSection>
					<FlowControlTitle>⚙️ Flow Control Actions</FlowControlTitle>
					<FlowControlButtons>
						<FlowControlButton
							className="clear"
							onClick={() => setShowClearCredentialsModal(true)}
						>
							🧹 Clear Credentials
						</FlowControlButton>
						<FlowControlButton
							className="reset"
							onClick={resetFlow}
							disabled={isResettingFlow}
							style={{
								background: isResettingFlow ? "#9ca3af" : undefined,
								cursor: isResettingFlow ? "not-allowed" : "pointer",
							}}
						>
							<FiRefreshCw
								style={{
									animation: isResettingFlow
										? "spin 1s linear infinite"
										: "none",
									marginRight: "0.5rem",
								}}
							/>
							{isResettingFlow ? "Resetting..." : "Reset Flow"}
						</FlowControlButton>
					</FlowControlButtons>
				</FlowControlSection>
			</FlowCard>

			{/* Clear Credentials Modal */}
			<ConfirmationModal
				isOpen={showClearCredentialsModal}
				onClose={() => setShowClearCredentialsModal(false)}
				onConfirm={clearCredentials}
				title="Clear OIDC Implicit Credentials"
				message="Are you sure you want to clear all saved credentials? This will remove your Environment ID, Client ID, and other configuration data."
				confirmText="Clear Credentials"
				cancelText="Cancel"
				variant="danger"
				isLoading={isClearingCredentials}
			/>

			{/* Authorization Request Modal */}
			<AuthorizationRequestModal
				isOpen={showAuthRequestModal}
				onClose={() => setShowAuthRequestModal(false)}
				onProceed={() => {
					setShowAuthRequestModal(false);
					handleAuthorizationDirect();
				}}
				authorizationUrl={authUrl || ""}
				requestParams={{
					environmentId: credentials.environmentId || "",
					clientId: credentials.clientId || "",
					redirectUri: credentials.redirectUri || "",
					scopes: credentials.scopes || "",
					responseType: responseType || "",
					flowType: "oidc-implicit-v3",
				}}
			/>

			{/* Default Redirect URI Modal */}
			<DefaultRedirectUriModal
				isOpen={showDefaultRedirectUriModal}
				onClose={() => setShowDefaultRedirectUriModal(false)}
				onContinue={handleContinueWithDefaultUri}
				flowType="oidc-implicit-v3"
				defaultRedirectUri={defaultRedirectUri}
			/>
		</Container>
	);
};

export default OIDCImplicitFlowV3;
