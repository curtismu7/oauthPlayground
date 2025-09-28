// src/pages/flows/OAuth2ImplicitFlowV3.tsx - OAuth 2.0 Implicit Flow V3
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiChevronDown,
	FiChevronLeft,
	FiChevronRight,
	FiCopy,
	FiGlobe,
	FiKey,
	FiRefreshCw,
	FiSearch,
	FiSettings,
	FiShield,
	FiUser,
} from "react-icons/fi";
import styled from "styled-components";
import AuthorizationRequestModal from "../../components/AuthorizationRequestModal";
import { ColorCodedURL } from "../../components/ColorCodedURL";
import ConfirmationModal from "../../components/ConfirmationModal";
import DefaultRedirectUriModal from "../../components/DefaultRedirectUriModal";
import { EnhancedStepFlowV2 } from "../../components/EnhancedStepFlowV2";
import {
	FormField,
	FormInput,
	FormLabel,
	InfoBox,
} from "../../components/steps/CommonSteps";
import TokenDisplay from "../../components/TokenDisplay";
import { useAuth } from "../../contexts/NewAuthContext";
import { usePerformanceTracking } from "../../hooks/useAnalytics";
import {
	showGlobalError,
	showGlobalSuccess,
	showGlobalWarning,
} from "../../hooks/useNotifications";
import { useAuthorizationFlowScroll } from "../../hooks/usePageScroll";
import { getCallbackUrlForFlow } from "../../utils/callbackUrls";
import { copyToClipboard } from "../../utils/clipboard";
import { credentialManager } from "../../utils/credentialManager";
import { enhancedDebugger } from "../../utils/enhancedDebug";
import { trackFlowCompletion } from "../../utils/flowCredentialChecker";
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

interface FlowToggleProps {
	onToggle: () => void;
	children: React.ReactNode;
	expanded?: boolean;
}
const FlowToggleButton = styled.button`
  display: block;
  width: 100%;
  background: transparent;
  border: none;
  padding: 0;
  text-align: left;
  cursor: pointer;
`;

const FlowToggle: React.FC<FlowToggleProps> = ({ onToggle, children }) => {
	return (
		<FlowToggleButton type="button" onClick={onToggle}>
			{children}
		</FlowToggleButton>
	);
};

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

const _JsonDisplay = styled.div`
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

const _ActionButton = styled.button<{
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

type OAuth2ImplicitFlowV3Props = Record<string, never>;

const OAuth2ImplicitFlowV3: React.FC<OAuth2ImplicitFlowV3Props> = () => {
	const authContext = useAuth();
	const { config: _config } = authContext;

	// Performance monitoring
	const _performanceTracking = usePerformanceTracking();

	// Start debug session
	React.useEffect(() => {
		const sessionId = enhancedDebugger.startSession("oauth2-implicit-v3");
		console.log(" [OAUTH2-IMPLICIT-V3] Debug session started:", sessionId);

		return () => {
			enhancedDebugger.endSession(sessionId);
		};
	}, []);

	// Use centralized scroll management
	const { scrollToTopAfterAction } = useAuthorizationFlowScroll(
		"OAuth 2.0 Implicit Flow V3",
	);

	// Use the new step management system
	const stepManager = useFlowStepManager({
		flowType: "oauth2-implicit",
		persistKey: "oauth2_implicit_v3_step_manager",
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
					showGlobalSuccess(
						"Credentials loaded",
						"Using saved implicit flow configuration from storage.",
					);
					console.log(
						" [OAuth2-IMPLICIT-V3] Loaded implicit flow credentials:",
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
							" [OAuth2-IMPLICIT-V3] Loaded global config credentials:",
							configCredentials,
						);
					} else {
						// Both are blank - show modal with default URI
						const defaultUri = getCallbackUrlForFlow("oauth2-implicit-v3");
						setDefaultRedirectUri(defaultUri);
						setShowDefaultRedirectUriModal(true);
						setCredentials({
							environmentId: "",
							clientId: "",
							redirectUri: defaultUri,
							scopes: "openid",
						});
						console.log(
							" [OAuth2-IMPLICIT-V3] No credentials found, showing default redirect URI modal",
						);
					}
				}
			} catch (error) {
				console.error(
					" [OAuth2-IMPLICIT-V3] Failed to load credentials:",
					error,
				);
				// Fall back to defaults
				const defaultUri = getCallbackUrlForFlow("oauth2-implicit-v3");
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

	const [authUrl, setAuthUrl] = useState("");
	const [tokens, setTokens] = useState<Record<string, unknown> | null>(null);
	const [isRedirecting, _setIsRedirecting] = useState(false);
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
	const [showParameterBreakdown, setShowParameterBreakdown] = useState(false);
	const [showTokenDetails, setShowTokenDetails] = useState(false);
	const [_isSavingCredentials, setIsSavingCredentials] = useState(false);
	const [_credentialsSavedSuccessfully, setCredentialsSavedSuccessfully] =
		useState(false);
	const [isResettingFlow, setIsResettingFlow] = useState(false);

	// Load credentials from storage
	useEffect(() => {
		const savedCredentials = localStorage.getItem(
			"oauth2_implicit_v3_credentials",
		);
		if (savedCredentials) {
			try {
				const parsed = JSON.parse(savedCredentials);
				setCredentials((prev) => ({ ...prev, ...parsed }));
				console.log(" [OAUTH2-IMPLICIT-V3] Loaded saved credentials");
			} catch (error) {
				console.warn(
					" [OAUTH2-IMPLICIT-V3] Failed to parse saved credentials:",
					error,
				);
			}
		}
	}, []);

	// Load tokens from sessionStorage when component mounts (from callback)
	useEffect(() => {
		const loadTokensFromCallback = () => {
			try {
				// Check for tokens stored by the callback
				const storedTokens = sessionStorage.getItem("implicit_tokens");
				if (storedTokens) {
					const parsedTokens = JSON.parse(storedTokens);
					setTokens(parsedTokens);
					console.log(
						" [OAUTH2-IMPLICIT-V3] Loaded tokens from callback:",
						parsedTokens,
					);

					// Track flow completion for dashboard status
					trackFlowCompletion("oauth2-implicit-v3");

					// Auto-advance to the final step (token display)
					stepManager.setStep(3, "callback return with tokens");
					console.log(
						" [OAUTH2-IMPLICIT-V3] Auto-advancing to final step after callback return",
					);

					// Clear the stored tokens after loading
					sessionStorage.removeItem("implicit_tokens");

					// Show success message
					showGlobalSuccess(
						"Tokens received",
						"Tokens parsed from the implicit flow response.",
					);
				}
			} catch (error) {
				console.warn(
					" [OAUTH2-IMPLICIT-V3] Failed to load tokens from callback:",
					error,
				);
			}
		};

		loadTokensFromCallback();
	}, [
		// Auto-advance to the final step (token display)
		stepManager.setStep,
	]);

	// Save credentials to storage
	const saveCredentials = useCallback(async () => {
		console.log(" [OAuth2ImplicitV3] Save credentials clicked", {
			credentials,
		});
		setIsSavingCredentials(true);

		try {
			// Simulate a brief delay to show loading state
			await new Promise((resolve) => setTimeout(resolve, 500));

			localStorage.setItem(
				"oauth2_implicit_v3_credentials",
				JSON.stringify(credentials),
			);

			// Show multiple forms of feedback
			showGlobalSuccess(
				"Access granted",
				"Implicit flow credentials saved successfully.",
			);
			setCredentialsSavedSuccessfully(true);
			console.log(" [OAuth2ImplicitV3] Credentials saved successfully");
		} catch (error) {
			showGlobalError(
				"Save failed",
				"We couldn't save your credentials. Please try again.",
			);
			console.error(" [OAuth2ImplicitV3] Failed to save credentials:", error);
		} finally {
			setIsSavingCredentials(false);
		}
	}, [credentials]);

	// Clear credentials
	const clearCredentials = useCallback(async () => {
		setIsClearingCredentials(true);
		try {
			localStorage.removeItem("oauth2_implicit_v3_credentials");
			setCredentials({
				environmentId: "",
				clientId: "",
				redirectUri: getCallbackUrlForFlow("oauth2-implicit-v3"),
				scopes: "read write",
			});
			showGlobalSuccess(
				"Access refreshed",
				"Credentials cleared successfully.",
			);
			console.log(" [OAUTH2-IMPLICIT-V3] Credentials cleared");
		} catch (error) {
			showGlobalError(
				"Save failed",
				"We couldn't clear your credentials. Please try again.",
			);
			console.error(
				" [OAUTH2-IMPLICIT-V3] Failed to clear credentials:",
				error,
			);
		} finally {
			setIsClearingCredentials(false);
			setShowClearCredentialsModal(false);
		}
	}, []);

	const handleContinueWithDefaultUri = () => {
		setShowDefaultRedirectUriModal(false);
		showGlobalWarning(
			"Verification required",
			"Using the sample redirect URI. Update it in PingOne for production.",
		);
	};

	// Build authorization URL
	const buildAuthorizationUrl = useCallback(async () => {
		try {
			const baseUrl = `https://auth.pingone.com/${credentials.environmentId}`;
			const authEndpoint = `${baseUrl}/as/authorize`;

			// Generate security parameters for CSRF protection
			const { state } = generateSecurityParameters(32);
			storeSecurityParameters("oauth2", state);

			const params = new URLSearchParams({
				client_id: credentials.clientId,
				redirect_uri: credentials.redirectUri,
				response_type: "token", // OAuth 2.0 Implicit flow uses 'token'
				scope: credentials.scopes,
				state: state,
			});

			const fullUrl = `${authEndpoint}?${params.toString()}`;
			setAuthUrl(fullUrl);

			console.log(" [OAUTH2-IMPLICIT-V3] Authorization URL built:", {
				endpoint: authEndpoint,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri,
				responseType: "token",
				scopes: credentials.scopes,
				stateLength: state.length,
			});

			console.log(
				" [OAUTH2-IMPLICIT-V3] IMPORTANT: Add this redirect URI to your PingOne application:",
			);
			console.log(`   Redirect URI: ${credentials.redirectUri}`);
			console.log(`   Environment: ${credentials.environmentId}`);
			console.log(
				"   Path: Applications  Your App  Configuration  Redirect URIs",
			);

			showGlobalSuccess(
				"Authorization URL ready",
				"PingOne authorize endpoint prepared with the current parameters.",
			);
			return fullUrl;
		} catch (error) {
			console.error(
				" [OAUTH2-IMPLICIT-V3] Failed to build authorization URL:",
				error,
			);
			showGlobalError(
				"URL generation failed",
				`We couldn't build the authorization request: ${error instanceof Error ? error.message : "Unknown error"}.`,
			);
			throw error;
		}
	}, [credentials]);

	// Handle authorization redirect with modal option
	const handleAuthorizationWithModal = useCallback(() => {
		if (!authUrl) {
			showGlobalError(
				"Authorization failed",
				"Generate the authorization URL before starting the flow.",
			);
			return;
		}

		const flowConfigKey = "enhanced-flow-authorization-code";
		const flowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || "{}");
		const shouldShowModal = flowConfig.showAuthRequestModal === true;

		if (shouldShowModal) {
			console.log(
				" [OAUTH2-IMPLICIT-V3] Showing authorization request modal (user preference)",
			);
			setShowAuthRequestModal(true);
		} else {
			console.log(
				" [OAUTH2-IMPLICIT-V3] Skipping authorization modal (user preference)",
			);
			// This part of the logic was removed from the original file, so it's not included here.
			// The original code had a call to handleAuthorizationDirect() here, which was not defined.
			// Assuming the intent was to navigate to the authorization URL directly if no modal.
			window.location.href = authUrl;
		}
	}, [authUrl]);

	const handleAuthorization = useCallback(() => {
		handleAuthorizationWithModal();
	}, [handleAuthorizationWithModal]);

	// Navigate to Token Management with token
	const navigateToTokenManagement = useCallback(
		(tokenType: "access") => {
			console.log(" [OAUTH2-IMPLICIT-V3] Navigate to token management:", {
				tokenType,
				hasTokens: !!tokens,
				hasAccessToken: !!tokens?.access_token,
				tokens,
			});

			const token = tokens?.access_token;

			if (token) {
				// Store token and flow source for Token Management page
				sessionStorage.setItem("token_to_analyze", token);
				sessionStorage.setItem("token_type", tokenType);
				sessionStorage.setItem("flow_source", "oauth2-implicit-v3");

				// Navigate to Token Management page
				window.location.href = "/token-management";
			} else {
				showGlobalError(
					"Authorization failed",
					`No ${tokenType} token available for analysis.`,
				);
			}
		},
		[tokens],
	);

	// Reset flow
	const resetFlow = useCallback(async () => {
		console.log(" [OAUTH2-IMPLICIT-V3] Reset flow initiated");

		setIsResettingFlow(true);

		try {
			// Simulate a brief delay for better UX
			await new Promise((resolve) => setTimeout(resolve, 500));

			console.log(
				" [OAUTH2-IMPLICIT-V3] Current step before reset:",
				stepManager.currentStepIndex,
			);

			// Clear all state
			setAuthUrl("");
			setTokens(null);
			sessionStorage.removeItem("oauth2_implicit_v3_state");
			sessionStorage.removeItem("oauth2_implicit_v3_flow_context");

			// Reset step manager
			stepManager.resetFlow();

			// Show success message to user
			console.log(
				" [OAUTH2-IMPLICIT-V3] About to show success message for reset",
			);
			showGlobalSuccess(
				"Flow reset",
				"Implicit flow state cleared. Start again whenever you're ready.",
			);
			console.log(" [OAUTH2-IMPLICIT-V3] Success message shown for reset");

			// AGGRESSIVE SCROLL TO TOP - try all methods
			console.log(
				"[OAUTH2-IMPLICIT-V3] AGGRESSIVE SCROLL - position before:",
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

				console.log("[OAUTH2-IMPLICIT-V3] Force scrolled all containers");
			};

			// Execute force scroll immediately and with delays
			scrollAllContainers();
			setTimeout(scrollAllContainers, 100);
			setTimeout(scrollAllContainers, 300);
			setTimeout(scrollAllContainers, 500);

			console.log(" [OAUTH2-IMPLICIT-V3] Flow reset complete");
		} catch (error) {
			console.error(" [OAUTH2-IMPLICIT-V3] Reset flow failed:", error);
			showGlobalError(
				"Reset failed",
				"We couldn't clear the flow state. Please try again.",
			);
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
					"Configure your PingOne application credentials for OAuth 2.0 Implicit flow",
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
									placeholder="read write openid profile"
									required
								/>
								<div
									style={{
										fontSize: "0.875rem",
										color: "#6b7280",
										marginTop: "0.25rem",
									}}
								>
									Space-separated list of scopes (e.g., read write openid
									profile). Use standard OAuth scopes or PingOne-specific scopes
									like p1:read:users
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
					"Generate the authorization URL with proper parameters for OAuth 2.0 Implicit flow",
				icon: <FiGlobe />,
				category: "authorization",
				content: (
					<div>
						<InfoBox type="info">
							<FiGlobe />
							<div>
								<strong>OAuth 2.0 Implicit Flow Authorization URL</strong>
								<br />
								This step generates the authorization URL that will redirect the
								user to PingOne for authentication. The response_type is set to
								'token' which means tokens will be returned in the URL fragment.
							</div>
						</InfoBox>

						{/* Authorization URL Details - Collapsible */}
						<FlowToggle
							onToggle={() => {
								setShowParameterBreakdown((prev) => {
									const next = !prev;
									showGlobalSuccess(
										"Parameter breakdown ready",
										"Authorization URL is ready for review by parameter.",
									);
									return next;
								});
							}}
						>
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

										<h5
											style={{ margin: "1rem 0 0.75rem 0", color: "#374151" }}
										>
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
												<ParameterValue>token</ParameterValue>
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
										</ParameterBreakdown>
									</div>
								)}
							</div>
						</FlowToggle>

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
											showGlobalSuccess(
												"Authorization URL copied",
												"Authorization URL copied to the clipboard.",
											);
										}}
										type="button"
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
									background: "#f0fdf4",
									border: "1px solid #bbf7d0",
									borderRadius: "8px",
									padding: "1rem",
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
											showGlobalSuccess(
												"Authorization URL copied",
												"Authorization URL copied to the clipboard.",
											);
										}}
										type="button"
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
								<FlowToggle
									onToggle={() => {
										setShowClientIdTroubleshooting((prev) => {
											const next = !prev;
											showGlobalSuccess(
												"Access refreshed",
												next
													? "Client ID troubleshooting guidance is now visible."
													: "Client ID troubleshooting collapsed.",
											);
											return next;
										});
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
											Client ID Validation for OAuth2 Implicit Flow
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
												<FiChevronRight
													size={14}
													style={{ color: "#3b82f6" }}
												/>
											)}
										</div>
									</div>
								</FlowToggle>

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
											<strong> NOT_FOUND Error = Client ID Issue</strong>
										</p>
										<p style={{ margin: "0 0 0.5rem 0" }}>
											If you get a "NOT_FOUND" error, PingOne cannot find your
											Client ID. Check your Client ID in PingOne Admin Console.
										</p>
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
							<strong> Important:</strong> After authorization, the user will be
							redirected back with tokens in the URL fragment. The callback
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
				description: "Validate and display the received access token",
				icon: <FiShield />,
				category: "validation",
				content: (
					<div>
						{tokens ? (
							<div>
								<InfoBox type="success">
									<FiCheckCircle />
									<div>
										<strong> OAuth 2.0 Implicit Flow Successful!</strong>
										<br />
										Access token received and validated successfully.
									</div>
								</InfoBox>

								{/* Access Token Display */}
								<div style={{ marginTop: "1.5rem" }}>
									<h4>Received Tokens:</h4>
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
											<strong style={{ color: "#1f2937", fontSize: "0.9rem" }}>
												Access Token:
											</strong>
											<CopyButton
												onClick={() => {
													copyToClipboard(tokens.access_token, "Access Token");
													showGlobalSuccess(
														"Tokens copied",
														"Implicit flow tokens copied to the clipboard.",
													);
												}}
											>
												<FiCopy /> Copy
											</CopyButton>
										</div>
										<TokenDisplay tokens={tokens} />
									</div>

									{/* Token Details - Collapsible */}
									{(tokens.token_type || tokens.expires_in || tokens.scope) && (
										<div
											style={{
												background: "#f8fafc",
												border: "1px solid #e2e8f0",
												borderRadius: "8px",
												marginBottom: "1rem",
												overflow: "hidden",
											}}
										>
											<FlowToggle
												onToggle={() => {
													setShowTokenDetails((prev) => {
														const next = !prev;
														showGlobalSuccess(
															"Token analysis available",
															"Token analysis view is now visible.",
														);
														return next;
													});
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
											</FlowToggle>

											{showTokenDetails && (
												<div style={{ padding: "0 1rem 1rem 1rem" }}>
													{tokens.token_type && (
														<div style={{ marginBottom: "1rem" }}>
															<div
																style={{
																	display: "flex",
																	alignItems: "center",
																	gap: "0.5rem",
																	marginBottom: "0.5rem",
																}}
															>
																<strong
																	style={{
																		color: "#1f2937",
																		fontSize: "0.9rem",
																	}}
																>
																	Token Type:
																</strong>
															</div>
															<div
																style={{
																	background: "white",
																	border: "1px solid #d1d5db",
																	borderRadius: "4px",
																	padding: "0.75rem",
																	fontFamily: "Monaco, Menlo, monospace",
																	fontSize: "0.8rem",
																}}
															>
																{tokens.token_type}
															</div>
														</div>
													)}

													{tokens.expires_in && (
														<div style={{ marginBottom: "1rem" }}>
															<div
																style={{
																	display: "flex",
																	alignItems: "center",
																	gap: "0.5rem",
																	marginBottom: "0.5rem",
																}}
															>
																<strong
																	style={{
																		color: "#1f2937",
																		fontSize: "0.9rem",
																	}}
																>
																	Expires In:
																</strong>
															</div>
															<div
																style={{
																	background: "white",
																	border: "1px solid #d1d5db",
																	borderRadius: "4px",
																	padding: "0.75rem",
																	fontFamily: "Monaco, Menlo, monospace",
																	fontSize: "0.8rem",
																}}
															>
																{tokens.expires_in} seconds
															</div>
														</div>
													)}

													{tokens.scope && (
														<div style={{ marginBottom: "1rem" }}>
															<div
																style={{
																	display: "flex",
																	alignItems: "center",
																	gap: "0.5rem",
																	marginBottom: "0.5rem",
																}}
															>
																<strong
																	style={{
																		color: "#1f2937",
																		fontSize: "0.9rem",
																	}}
																>
																	Scope:
																</strong>
															</div>
															<div
																style={{
																	background: "white",
																	border: "1px solid #d1d5db",
																	borderRadius: "4px",
																	padding: "0.75rem",
																	fontFamily: "Monaco, Menlo, monospace",
																	fontSize: "0.8rem",
																}}
															>
																{tokens.scope}
															</div>
														</div>
													)}
												</div>
											)}
										</div>
									)}

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
										<strong> Token Validation Complete!</strong>
										<br />
										Your access token is ready to use for API calls. Remember
										that implicit flow tokens are typically short-lived and
										cannot be refreshed - you'll need to re-authenticate when
										they expire.
									</div>

									{/* Token Management Section */}
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
											Analyze and decode your access token to see its contents
											and claims.
										</p>

										<div
											style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
										>
											<CopyButton
												onClick={() => navigateToTokenManagement("access")}
												disabled={!tokens?.access_token}
												style={{
													backgroundColor: tokens?.access_token
														? "#3b82f6"
														: "#9ca3af",
													color: "white",
													padding: "0.75rem 1.5rem",
													fontSize: "0.9rem",
												}}
											>
												<FiSearch /> Analyze Access Token
											</CopyButton>

											<CopyButton
												onClick={() => {
													if (tokens?.access_token) {
														// Store token for analysis
														sessionStorage.setItem(
															"token_to_analyze",
															tokens.access_token,
														);
														sessionStorage.setItem("token_type", "access");
														sessionStorage.setItem(
															"flow_source",
															"oauth2-implicit-v3",
														);
														window.open("/token-management", "_blank");
													}
												}}
												disabled={!tokens?.access_token}
												style={{
													backgroundColor: tokens?.access_token
														? "#8b5cf6"
														: "#9ca3af",
													color: "white",
													padding: "0.75rem 1.5rem",
													fontSize: "0.9rem",
												}}
											>
												<FiShield /> Decode Token
											</CopyButton>

											<CopyButton
												onClick={() => {
													if (tokens?.access_token) {
														// Store token for introspection
														sessionStorage.setItem(
															"token_to_analyze",
															tokens.access_token,
														);
														sessionStorage.setItem("token_type", "access");
														sessionStorage.setItem(
															"flow_source",
															"oauth2-implicit-v3",
														);
														// Navigate to token management with introspection tab
														window.location.href =
															"/token-management?tab=introspect";
													}
												}}
												disabled={!tokens?.access_token}
												style={{
													backgroundColor: tokens?.access_token
														? "#059669"
														: "#9ca3af",
													color: "white",
													padding: "0.75rem 1.5rem",
													fontSize: "0.9rem",
												}}
											>
												<FiSearch /> Introspect Token
											</CopyButton>
										</div>
									</div>

									{/* Go Back to Start Button */}
									<div style={{ marginTop: "1.5rem", textAlign: "center" }}>
										<CopyButton
											onClick={resetFlow}
											style={{
												backgroundColor: "#6b7280",
												color: "white",
												padding: "0.75rem 2rem",
												fontSize: "1rem",
											}}
										>
											<FiChevronLeft /> Go Back to Start of Flow
										</CopyButton>
									</div>
								</div>
							</div>
						) : (
							<InfoBox type="info">
								<FiShield />
								<div>
									<strong>Waiting for Token Response</strong>
									<br />
									Complete the user authorization step to receive your access
									token.
								</div>
							</InfoBox>
						)}
					</div>
				),
				canExecute: false,
				completed: Boolean(tokens),
			},
		],
		[
			credentials,
			authUrl,
			tokens,
			isRedirecting,
			saveCredentials,
			buildAuthorizationUrl,
			handleAuthorization,
			showParameterBreakdown,
			showClientIdTroubleshooting,
			showTokenDetails,
			navigateToTokenManagement,
			resetFlow,
			validationErrors.clientId,
		],
	);

	console.log(" [OAUTH2-IMPLICIT-V3] Component rendering", {
		stepsLength: steps.length,
		currentStep: stepManager.currentStepIndex,
		hasTokens: !!tokens,
		hasAuthUrl: !!authUrl,
	});

	return (
		<Container>
			<Header>
				<Title>OAuth 2.0 Implicit Flow V3</Title>
				<Subtitle>
					OAuth 2.0 Implicit Flow implementation with comprehensive educational
					content
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
						<FlowToggle
							onToggle={() => {
								setShowEducationalContent((prev) => {
									const next = !prev;
									showGlobalSuccess(
										"Access refreshed",
										next
											? "Educational content is now visible."
											: "Educational content collapsed.",
									);
									return next;
								});
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
							>
								<h2 style={{ margin: 0, color: "#1f2937", fontSize: "1.5rem" }}>
									What is OAuth 2.0 Implicit Flow?
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
						</FlowToggle>

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
												Authorization server redirects back with access token in
												URL fragment
											</li>
											<li>
												Client extracts access token directly from the URL
											</li>
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
											<strong> Deprecated:</strong> OAuth 2.0 Security Best
											Practices recommends against Implicit Flow for new
											applications.
										</p>
										<p style={{ margin: "0 0 0.5rem 0" }}>
											<strong> Token Exposure:</strong> Access tokens are
											exposed in the URL fragment, making them visible in
											browser history, server logs, and referrer headers.
										</p>
										<p style={{ margin: "0" }}>
											<strong> Modern Alternative:</strong> Use Authorization
											Code flow with PKCE for better security.
										</p>
									</div>
								</div>
							</>
						)}
					</div>
				)}

				{/* Security Warning - Only show on first step */}
				{stepManager.currentStepIndex === 0 && (
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
							<strong>OAuth 2.0 Implicit Flow (Deprecated)</strong>
						</div>
						<div style={{ fontSize: "0.875rem", lineHeight: "1.5" }}>
							This flow is <strong>deprecated</strong> due to security concerns.
							Access tokens are exposed in the URL fragment, making them
							vulnerable to theft. This implementation is provided for legacy
							compatibility and educational purposes only. For new applications,
							use the Authorization Code flow with PKCE instead.
						</div>
					</SecurityWarning>
				)}

				{/* Main Step Flow */}
				<EnhancedStepFlowV2
					steps={steps}
					title=" OAuth 2.0 Implicit Flow V3"
					persistKey="oauth2_implicit_v3_flow_steps"
					initialStepIndex={stepManager.currentStepIndex}
					onStepChange={stepManager.setStep}
					autoAdvance={false}
					showDebugInfo={false}
					allowStepJumping={true}
					onStepComplete={(stepId, result) => {
						console.log(
							" [OAUTH2-IMPLICIT-V3] Step completed:",
							stepId,
							result,
						);
					}}
				/>

				{/* Flow Control Actions */}
				<FlowControlSection>
					<FlowControlTitle> Flow Control Actions</FlowControlTitle>
					<FlowControlButtons>
						<FlowControlButton
							className="clear"
							onClick={() => setShowClearCredentialsModal(true)}
						>
							Clear Credentials
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
				title="Clear OAuth 2.0 Implicit Credentials"
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
					// This part of the logic was removed from the original file, so it's not included here.
					// The original code had a call to handleAuthorizationDirect() here, which was not defined.
					// Assuming the intent was to navigate to the authorization URL directly if no modal.
					window.location.href = authUrl;
				}}
				authorizationUrl={authUrl || ""}
				requestParams={{
					environmentId: credentials.environmentId || "",
					clientId: credentials.clientId || "",
					redirectUri: credentials.redirectUri || "",
					scopes: credentials.scopes || "",
					responseType: "token",
					flowType: "oauth2-implicit-v3",
				}}
			/>

			{/* Default Redirect URI Modal */}
			<DefaultRedirectUriModal
				isOpen={showDefaultRedirectUriModal}
				onClose={() => setShowDefaultRedirectUriModal(false)}
				onContinue={handleContinueWithDefaultUri}
				flowType="oauth2-implicit-v3"
				defaultRedirectUri={defaultRedirectUri}
			/>
		</Container>
	);
};

export default OAuth2ImplicitFlowV3;
