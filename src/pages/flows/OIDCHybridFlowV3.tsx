// src/pages/flows/OIDCHybridFlowV3.tsx - OIDC 1.0 Hybrid Flow V3
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiCode,
	FiCopy,
	FiExternalLink,
	FiGlobe,
	FiInfo,
	FiKey,
	FiRefreshCw,
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
import {
	FormField,
	FormInput,
	FormLabel,
	FormSelect,
	InfoBox,
} from "../../components/steps/CommonSteps";
import TokenDisplay from "../../components/TokenDisplay";
import { useAuth } from "../../contexts/NewAuthContext";
import { useAuthorizationFlowScroll } from "../../hooks/usePageScroll";
import { getCallbackUrlForFlow } from "../../utils/callbackUrls";
import {
	applyClientAuthentication,
	getAuthMethodSecurityLevel,
} from "../../utils/clientAuthentication";
import { copyToClipboard } from "../../utils/clipboard";
import { credentialManager } from "../../utils/credentialManager";
import { useFlowStepManager } from "../../utils/flowStepSystem";
import { logger } from "../../utils/logger";
import {
	generateCodeChallenge,
	generateCodeVerifier,
	generateRandomString,
} from "../../utils/oauth";

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

const Button = styled.button<{ variant?: "primary" | "secondary" | "danger" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${(props) => {
		switch (props.variant) {
			case "primary":
				return `
          background: #3b82f6;
          color: white;
          
          &:hover:not(:disabled) {
            background: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          }
        `;
			case "secondary":
				return `
          background: #f3f4f6;
          color: #374151;
          
          &:hover:not(:disabled) {
            background: #e5e7eb;
          }
        `;
			case "danger":
				return `
          background: #ef4444;
          color: white;
          
          &:hover:not(:disabled) {
            background: #dc2626;
          }
        `;
			default:
				return `
          background: #3b82f6;
          color: white;
          
          &:hover:not(:disabled) {
            background: #2563eb;
          }
        `;
		}
	}}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
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

const ParameterLabel = styled.span`
  font-weight: 500;
  color: #374151;
`;

const ParameterValue = styled.span`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: #1f2937;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Types
interface OIDCHybridCredentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scopes: string;
	responseType: string;
	state: string;
	nonce: string;
	codeVerifier: string;
	codeChallenge: string;
	codeChallengeMethod: string;
	clientAuthMethod: string;
}

interface OIDCHybridTokens {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
}

const OIDCHybridFlowV3: React.FC = () => {
	const { config } = useAuth();
	const stepManager = useFlowStepManager({
		flowType: "oidc-hybrid-v3",
		persistKey: "oidc_hybrid_v3_step_manager",
		defaultStep: 0,
	});
	const { scrollToTopAfterAction } = useAuthorizationFlowScroll();

	// State
	const [credentials, setCredentials] = useState<OIDCHybridCredentials>({
		environmentId: config?.environmentId || "",
		clientId: config?.clientId || "",
		clientSecret: config?.clientSecret || "",
		redirectUri: "",
		scopes: "openid",
		responseType: "code id_token",
		state: "",
		nonce: "",
		codeVerifier: "",
		codeChallenge: "",
		codeChallengeMethod: "S256",
		clientAuthMethod: "client_secret_post",
	});

	const [tokens, setTokens] = useState<OIDCHybridTokens | null>(null);
	const [authorizationCode, setAuthorizationCode] = useState<string>("");
	const [userInfo, setUserInfo] = useState<Record<string, unknown> | null>(
		null,
	);
	const [authorizationUrl, setAuthorizationUrl] = useState<string>("");
	const [showAuthorizationModal, setShowAuthorizationModal] = useState(false);
	const [showResetModal, setShowResetModal] = useState(false);
	const [isRequestingAuthorization, setIsRequestingAuthorization] =
		useState(false);
	const [showParameterBreakdown, setShowParameterBreakdown] = useState(false);
	const [_copiedText, _setCopiedText] = useState<string | null>(null);
	const [_stepResults, setStepResults] = useState<Record<string, unknown>>({});
	const [authorizationMethod, setAuthorizationMethod] = useState<
		"popup" | "redirect"
	>("popup");
	const [showDefaultRedirectUriModal, setShowDefaultRedirectUriModal] =
		useState(false);
	const [defaultRedirectUri, setDefaultRedirectUri] = useState("");

	// Handle callback return with authorization code and ID token
	useEffect(() => {
		const handleCallbackReturn = () => {
			try {
				// Check for authorization code in URL parameters
				const urlParams = new URLSearchParams(window.location.search);
				const code = urlParams.get("code");
				const idToken = urlParams.get("id_token");
				const _state = urlParams.get("state");
				const error = urlParams.get("error");
				const errorDescription = urlParams.get("error_description");

				if (error) {
					console.error(
						"❌ [OIDC-HYBRID-V3] Authorization error:",
						error,
						errorDescription,
					);
					showFlowError("❌ Authorization Failed", errorDescription || error);
					return;
				}

				if (code && idToken) {
					console.log(
						"🔑 [OIDC-HYBRID-V3] Found authorization code and ID token from hybrid flow:",
						{ code: `${code.substring(0, 20)}...`, hasIdToken: !!idToken },
					);

					// Set both the authorization code and ID token immediately
					setAuthorizationCode(code);
					setTokens((prev) => ({
						...prev,
						id_token: idToken,
					}));

					// Auto-advance to step 3 (display hybrid flow results)
					stepManager.setStep(2, "callback return with hybrid flow results");
					console.log(
						"🔄 [OIDC-HYBRID-V3] Auto-advancing to step 3 (display hybrid flow results) after callback return",
					);

					// Show success message
					showFlowSuccess(
						"🎉 Hybrid Flow Successful!",
						"Received both authorization code and ID token simultaneously. You can now exchange the code for access token.",
					);

					// Clean up URL parameters
					if (window.location.search) {
						window.history.replaceState({}, "", window.location.pathname);
					}
				} else if (code) {
					// Fallback: only authorization code (shouldn't happen in proper hybrid flow)
					console.log(
						"🔑 [OIDC-HYBRID-V3] Found authorization code only (not full hybrid flow):",
						`${code.substring(0, 20)}...`,
					);
					setAuthorizationCode(code);
					stepManager.setStep(
						2,
						"callback return with authorization code only",
					);
					showFlowSuccess(
						"🎉 Authorization Code Received",
						"Authorization code received. ID token missing from hybrid flow response.",
					);
				}
			} catch (error) {
				console.error(
					"❌ [OIDC-HYBRID-V3] Failed to handle callback return:",
					error,
				);
			}
		};

		handleCallbackReturn();
	}, [stepManager]);

	// Load credentials from storage on mount
	useEffect(() => {
		const loadStoredCredentials = async () => {
			try {
				// Load hybrid flow-specific credentials first
				const hybridCredentials =
					credentialManager.loadFlowCredentials("oidc-hybrid-v3");

				// If hybrid flow credentials exist and have values, use them
				if (
					hybridCredentials.environmentId ||
					hybridCredentials.clientId ||
					hybridCredentials.redirectUri
				) {
					setCredentials((prev) => ({
						...prev,
						environmentId:
							hybridCredentials.environmentId || prev.environmentId,
						clientId: hybridCredentials.clientId || prev.clientId,
						clientSecret: hybridCredentials.clientSecret || prev.clientSecret,
						redirectUri: hybridCredentials.redirectUri || "",
						scopes: Array.isArray(hybridCredentials.scopes)
							? hybridCredentials.scopes.join(" ")
							: hybridCredentials.scopes || prev.scopes,
						clientAuthMethod:
							hybridCredentials.tokenAuthMethod || prev.clientAuthMethod,
					}));
					console.log(
						"✅ [OIDC-HYBRID-V3] Loaded hybrid flow credentials:",
						hybridCredentials,
					);
				} else {
					// Fall back to global configuration
					const configCredentials = credentialManager.loadConfigCredentials();
					if (
						configCredentials.environmentId ||
						configCredentials.clientId ||
						configCredentials.redirectUri
					) {
						setCredentials((prev) => ({
							...prev,
							environmentId:
								configCredentials.environmentId || prev.environmentId,
							clientId: configCredentials.clientId || prev.clientId,
							clientSecret: configCredentials.clientSecret || prev.clientSecret,
							redirectUri: configCredentials.redirectUri || "",
							scopes: Array.isArray(configCredentials.scopes)
								? configCredentials.scopes.join(" ")
								: configCredentials.scopes || prev.scopes,
							clientAuthMethod:
								configCredentials.tokenAuthMethod || prev.clientAuthMethod,
						}));
						console.log(
							"✅ [OIDC-HYBRID-V3] Loaded global config credentials:",
							configCredentials,
						);
					} else {
						// Both are blank - show modal with default URI
						const defaultUri = getCallbackUrlForFlow("oidc-hybrid-v3");
						setDefaultRedirectUri(defaultUri);
						setShowDefaultRedirectUriModal(true);
						setCredentials((prev) => ({
							...prev,
							redirectUri: defaultUri,
						}));
						console.log(
							"⚠️ [OIDC-HYBRID-V3] No credentials found, showing default redirect URI modal",
						);
					}
				}

				// Also try to load from localStorage for backward compatibility
				const stored = localStorage.getItem("oidc_hybrid_v3_credentials");
				if (stored) {
					const parsed = JSON.parse(stored);
					setCredentials((prev) => ({ ...prev, ...parsed }));
					console.log("✅ [OIDC-HYBRID-V3] Loaded localStorage credentials");
				}
			} catch (error) {
				console.error("❌ [OIDC-HYBRID-V3] Failed to load credentials:", error);
				logger.error(
					"OIDCHybridV3",
					"Failed to load stored credentials",
					error,
				);
			}
		};

		loadStoredCredentials();
	}, []);

	const handleContinueWithDefaultUri = () => {
		setShowDefaultRedirectUriModal(false);
		showFlowSuccess(
			"Using default redirect URI. Please configure it in your PingOne application.",
		);
	};

	// Generate security parameters
	const generateSecurityParameters = useCallback(async () => {
		const state = generateRandomString(32);
		const nonce = generateRandomString(32);
		const codeVerifier = generateCodeVerifier();
		const codeChallenge = await generateCodeChallenge(codeVerifier);

		setCredentials((prev) => ({
			...prev,
			state,
			nonce,
			codeVerifier,
			codeChallenge,
		}));

		logger.info("OIDCHybridV3", "🔐 Generated security parameters", {
			stateLength: state.length,
			nonceLength: nonce.length,
			codeVerifierLength: codeVerifier.length,
			codeChallengeLength: codeChallenge.length,
		});

		return { state, nonce, codeVerifier, codeChallenge };
	}, []);

	// Save credentials
	const saveCredentials = useCallback(async () => {
		try {
			// Save to credential manager
			await credentialManager.saveFlowCredentials("oidc-hybrid-v3", {
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: credentials.redirectUri,
				scopes: credentials.scopes.split(" ").filter((s) => s.trim()),
				tokenAuthMethod: credentials.clientAuthMethod,
			});

			// Also save to localStorage for backward compatibility
			localStorage.setItem(
				"oidc_hybrid_v3_credentials",
				JSON.stringify(credentials),
			);

			logger.info("OIDCHybridV3", "✅ Credentials saved successfully");
			showFlowSuccess(
				"✅ OIDC Hybrid Flow Credentials Saved",
				"Configuration saved successfully.",
			);

			// Auto-generate security parameters
			await generateSecurityParameters();

			return { success: true };
		} catch (error) {
			logger.error("OIDCHybridV3", "Failed to save credentials", error);
			showFlowError("Failed to save credentials. Please try again.");
			throw error;
		}
	}, [credentials, generateSecurityParameters]);

	// Build authorization URL
	const buildAuthorizationUrl = useCallback(() => {
		console.log(
			"🔧 [OIDC-HYBRID-V3] Building authorization URL with credentials:",
			{
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				redirectUri: credentials.redirectUri,
				responseType: credentials.responseType,
				scopes: credentials.scopes,
				state: credentials.state,
				nonce: credentials.nonce,
				codeChallenge: credentials.codeChallenge,
			},
		);

		if (!credentials.environmentId || !credentials.clientId) {
			throw new Error(
				"Missing required credentials. Please configure Environment ID and Client ID.",
			);
		}

		if (!credentials.redirectUri) {
			throw new Error(
				"Missing redirect URI. Please configure the redirect URI in step 1.",
			);
		}

		const baseUrl = `https://auth.pingone.com/${credentials.environmentId}/as/authorize`;
		const params = new URLSearchParams({
			client_id: credentials.clientId,
			redirect_uri: credentials.redirectUri,
			response_type: credentials.responseType,
			scope: credentials.scopes,
			state: credentials.state,
			nonce: credentials.nonce,
		});

		if (credentials.codeChallenge) {
			params.append("code_challenge", credentials.codeChallenge);
			params.append("code_challenge_method", credentials.codeChallengeMethod);
		}

		const url = `${baseUrl}?${params.toString()}`;
		setAuthorizationUrl(url);

		logger.info("OIDCHybridV3", "🔗 Built authorization URL", {
			baseUrl,
			responseType: credentials.responseType,
			scopes: credentials.scopes,
			hasPKCE: !!credentials.codeChallenge,
		});

		showFlowSuccess(
			"🔗 Authorization URL Built",
			"Security parameters generated and authorization URL created successfully.",
		);
		return url;
	}, [credentials]);

	// Request authorization
	const requestAuthorization = useCallback(async () => {
		if (!authorizationUrl) {
			throw new Error(
				"Authorization URL not built. Please complete previous steps.",
			);
		}

		// Check configuration setting for showing auth request modal
		const flowConfigKey = "enhanced-flow-authorization-code";
		const flowConfig = JSON.parse(localStorage.getItem(flowConfigKey) || "{}");
		const shouldShowModal = flowConfig.showAuthRequestModal === true;

		if (shouldShowModal) {
			console.log(
				"🔧 [OIDC-HYBRID-V3] Showing authorization request modal (user preference)",
			);
			setShowAuthorizationModal(true);
			return;
		}

		// Proceed directly if modal is disabled
		console.log(
			"🔧 [OIDC-HYBRID-V3] Skipping authorization modal (user preference)",
		);
		// Call the direct authorization function inline
		setIsRequestingAuthorization(true);
		try {
			// Store security parameters for callback validation
			localStorage.setItem(
				"oidc_hybrid_v3_security",
				JSON.stringify({
					state: credentials.state,
					nonce: credentials.nonce,
					codeVerifier: credentials.codeVerifier,
				}),
			);

			logger.info("OIDCHybridV3", "🚀 Starting authorization", {
				url: authorizationUrl,
				method: authorizationMethod,
				responseType: credentials.responseType,
			});

			if (authorizationMethod === "popup") {
				// Open authorization window
				window.open(
					authorizationUrl,
					"oidc_hybrid_authorization",
					"width=800,height=600,scrollbars=yes,resizable=yes",
				);

				// Show user feedback
				showFlowSuccess(
					"🚀 Authorization Window Opened",
					"Please complete authentication in the popup window.",
				);
			} else {
				// Redirect to authorization URL
				window.location.href = authorizationUrl;
			}
		} catch (error) {
			console.error("❌ [OIDC-HYBRID-V3] Authorization failed:", error);
			showFlowError(
				"❌ Authorization Failed",
				error instanceof Error
					? error.message
					: "Failed to start authorization",
			);
		} finally {
			setIsRequestingAuthorization(false);
		}
	}, [authorizationUrl, authorizationMethod, credentials]);

	// Direct authorization (without modal)
	const requestAuthorizationDirect = useCallback(async () => {
		setIsRequestingAuthorization(true);
		try {
			// Store security parameters for callback validation
			localStorage.setItem(
				"oidc_hybrid_v3_security",
				JSON.stringify({
					state: credentials.state,
					nonce: credentials.nonce,
					codeVerifier: credentials.codeVerifier,
				}),
			);

			logger.info("OIDCHybridV3", "🚀 Starting authorization", {
				url: authorizationUrl,
				method: authorizationMethod,
				responseType: credentials.responseType,
			});

			if (authorizationMethod === "popup") {
				// Open authorization window
				window.open(
					authorizationUrl,
					"oidc_hybrid_authorization",
					"width=800,height=600,scrollbars=yes,resizable=yes",
				);

				// Show user feedback
				showFlowSuccess(
					"🚀 Authorization Window Opened",
					"A new window has opened for user authentication. Complete the login process in the popup window.",
				);
			} else {
				// Full redirect
				window.location.href = authorizationUrl;
			}

			return { success: true };
		} catch (error) {
			logger.error("OIDCHybridV3", "Failed to request authorization", error);
			showFlowError("Failed to request authorization. Please try again.");
			throw error;
		} finally {
			setIsRequestingAuthorization(false);
		}
	}, [authorizationUrl, credentials, authorizationMethod]);

	// Exchange authorization code for tokens
	const exchangeCodeForTokens = useCallback(async () => {
		if (!authorizationCode) {
			throw new Error("No authorization code available for exchange");
		}

		try {
			console.log(
				"🔄 [OIDC-HYBRID-V3] Exchanging authorization code for tokens...",
			);

			const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;

			// Prepare the request body
			const requestBody = {
				grant_type: "authorization_code",
				code: authorizationCode,
				redirect_uri: credentials.redirectUri,
				client_id: credentials.clientId,
				code_verifier: credentials.codeVerifier,
			};

			// Apply client authentication
			const authConfig = {
				method: credentials.clientAuthMethod,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				tokenEndpoint: tokenEndpoint,
			};

			const { headers, body } = applyClientAuthentication(
				authConfig,
				requestBody,
			);

			const response = await fetch("/api/token-exchange", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					...headers,
				},
				body: new URLSearchParams(body).toString(),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Token exchange failed: ${response.status} ${errorText}`,
				);
			}

			const tokenData = await response.json();
			console.log("✅ [OIDC-HYBRID-V3] Token exchange successful:", tokenData);

			// Preserve the ID token from the hybrid flow and merge with new tokens
			const hybridTokens = {
				...tokenData,
				id_token: tokens?.id_token || tokenData.id_token, // Keep original ID token from hybrid flow
			};

			setTokens(hybridTokens);
			showFlowSuccess(
				"🎉 Hybrid Flow Token Exchange Successful!",
				"Authorization code exchanged for access and refresh tokens. Now we have both ID token (from hybrid flow) and access token (from exchange) for complete functionality.",
			);

			return tokenData;
		} catch (error) {
			console.error("❌ [OIDC-HYBRID-V3] Token exchange failed:", error);
			showFlowError(
				"❌ Token Exchange Failed",
				error instanceof Error
					? error.message
					: "Failed to exchange authorization code for tokens",
			);
			throw error;
		}
	}, [authorizationCode, credentials, tokens?.id_token]);

	// Get user info
	const getUserInfo = useCallback(async () => {
		if (!tokens?.access_token) {
			throw new Error("No access token available for user info request");
		}

		try {
			console.log("👤 [OIDC-HYBRID-V3] Fetching user info...");

			const userInfoEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/userinfo`;

			const response = await fetch("/api/userinfo", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					access_token: tokens.access_token,
					userinfo_endpoint: userInfoEndpoint,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`User info request failed: ${response.status} ${errorText}`,
				);
			}

			const userInfoData = await response.json();
			console.log("✅ [OIDC-HYBRID-V3] User info retrieved:", userInfoData);

			setUserInfo(userInfoData);
			showFlowSuccess(
				"✅ User Info Retrieved",
				"User information retrieved successfully.",
			);

			return userInfoData;
		} catch (error) {
			console.error("❌ [OIDC-HYBRID-V3] User info request failed:", error);
			showFlowError(
				"❌ User Info Failed",
				error instanceof Error
					? error.message
					: "Failed to retrieve user information",
			);
			throw error;
		}
	}, [tokens, credentials]);

	// Reset flow
	const resetFlow = useCallback(async () => {
		try {
			// Clear tokens and authorization URL
			setTokens(null);
			setAuthorizationCode("");
			setUserInfo(null);
			setAuthorizationUrl("");
			setStepResults({});

			// Generate new security parameters
			await generateSecurityParameters();

			// Reset to step 0
			stepManager.setStep(0, "flow reset");
			scrollToTopAfterAction();

			// Show user feedback
			showFlowSuccess(
				"🔄 OIDC Hybrid Flow Reset",
				"Flow has been reset successfully. Ready to start over.",
			);

			return { success: true };
		} catch (error) {
			logger.error("OIDCHybridV3", "Failed to reset flow", error);
			showFlowError("Failed to reset flow. Please try again.");
			throw error;
		}
	}, [stepManager, scrollToTopAfterAction, generateSecurityParameters]);

	// Define flow steps
	const steps = useMemo(
		() => [
			{
				id: "setup-credentials",
				title: "Setup Credentials",
				description:
					"Configure your PingOne application credentials for OIDC Hybrid flow",
				icon: <FiSettings />,
				category: "preparation",
				content: (
					<div>
						<InfoBox type="info" style={{ marginBottom: "1.5rem" }}>
							<div>
								<h4
									style={{
										margin: "0 0 1rem 0",
										color: "#1e40af",
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<FiInfo />
									OIDC Hybrid Flow Configuration
								</h4>
								<p style={{ margin: "0 0 1rem 0", color: "#1e40af" }}>
									The OIDC Hybrid Flow combines authorization code and implicit
									flows for enhanced security and flexibility. It returns both
									an authorization code and an ID token in the authorization
									response.
								</p>
								<p style={{ margin: "0", color: "#1e40af" }}>
									<strong>Response Type:</strong> {credentials.responseType}{" "}
									(code + id_token)
								</p>
							</div>
						</InfoBox>

						<FormField>
							<FormLabel>Environment ID</FormLabel>
							<FormInput
								type="text"
								value={credentials.environmentId}
								onChange={(e) =>
									setCredentials((prev) => ({
										...prev,
										environmentId: e.target.value,
									}))
								}
								placeholder="e.g., 12345678-1234-1234-1234-123456789012"
							/>
						</FormField>

						<FormField>
							<FormLabel>Client ID</FormLabel>
							<FormInput
								type="text"
								value={credentials.clientId}
								onChange={(e) =>
									setCredentials((prev) => ({
										...prev,
										clientId: e.target.value,
									}))
								}
								placeholder="e.g., 87654321-4321-4321-4321-210987654321"
							/>
						</FormField>

						<FormField>
							<FormLabel>Client Secret</FormLabel>
							<FormInput
								type="password"
								value={credentials.clientSecret}
								onChange={(e) =>
									setCredentials((prev) => ({
										...prev,
										clientSecret: e.target.value,
									}))
								}
								placeholder="Enter your client secret"
							/>
						</FormField>

						<FormField>
							<FormLabel>Redirect URI</FormLabel>
							<FormInput
								type="text"
								value={credentials.redirectUri}
								onChange={(e) =>
									setCredentials((prev) => ({
										...prev,
										redirectUri: e.target.value,
									}))
								}
								placeholder="https://localhost:3000/hybrid-callback"
							/>
						</FormField>

						<FormField>
							<FormLabel>Scopes</FormLabel>
							<FormInput
								type="text"
								value={credentials.scopes}
								onChange={(e) =>
									setCredentials((prev) => ({
										...prev,
										scopes: e.target.value,
									}))
								}
								placeholder="openid"
							/>
						</FormField>

						<FormField>
							<FormLabel>Token Endpoint Authentication Method</FormLabel>
							<FormSelect
								value={credentials.clientAuthMethod}
								onChange={(e) =>
									setCredentials((prev) => ({
										...prev,
										clientAuthMethod: e.target.value,
									}))
								}
							>
								<option value="client_secret_post">Client Secret Post</option>
								<option value="client_secret_basic">Client Secret Basic</option>
								<option value="client_secret_jwt">Client Secret JWT</option>
								<option value="private_key_jwt">Private Key JWT</option>
								<option value="none">None</option>
							</FormSelect>
							<div
								style={{
									fontSize: "0.875rem",
									color: "#6b7280",
									marginTop: "0.25rem",
								}}
							>
								Security Level:{" "}
								{getAuthMethodSecurityLevel(credentials.clientAuthMethod)}
							</div>
						</FormField>

						<FormField>
							<FormLabel>Response Type</FormLabel>
							<FormInput
								type="text"
								value={credentials.responseType}
								onChange={(e) =>
									setCredentials((prev) => ({
										...prev,
										responseType: e.target.value,
									}))
								}
								placeholder="code id_token"
							/>
						</FormField>

						<div style={{ marginTop: "1.5rem" }}>
							<Button
								variant="primary"
								onClick={saveCredentials}
								disabled={
									!credentials.environmentId ||
									!credentials.clientId ||
									!credentials.redirectUri
								}
							>
								<FiSettings />
								Save Credentials
							</Button>
						</div>
					</div>
				),
				execute: saveCredentials,
				canExecute: Boolean(
					credentials.environmentId &&
						credentials.clientId &&
						credentials.redirectUri,
				),
				completed: Boolean(
					credentials.state && credentials.nonce && credentials.codeChallenge,
				),
			},
			{
				id: "build-authorization-url",
				title: "Build Authorization URL",
				description:
					"Generate security parameters and build the authorization URL",
				icon: <FiGlobe />,
				category: "authorization",
				content: (
					<div>
						<InfoBox type="info" style={{ marginBottom: "1.5rem" }}>
							<div>
								<h4
									style={{
										margin: "0 0 1rem 0",
										color: "#1e40af",
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<FiGlobe />
									Authorization URL Construction
								</h4>
								<p style={{ margin: "0 0 1rem 0", color: "#1e40af" }}>
									This step generates security parameters (PKCE, state, nonce)
									and constructs the complete authorization URL.
								</p>
							</div>
						</InfoBox>

						<div style={{ marginBottom: "1.5rem" }}>
							<Button
								variant="primary"
								onClick={buildAuthorizationUrl}
								disabled={
									!credentials.state ||
									!credentials.nonce ||
									!credentials.codeChallenge
								}
							>
								<FiKey />
								Build Authorization URL
							</Button>
						</div>

						{authorizationUrl && (
							<div
								style={{
									marginTop: "1.5rem",
									padding: "1rem",
									backgroundColor: "#f0f9ff",
									border: "1px solid #bae6fd",
									borderRadius: "0.5rem",
								}}
							>
								<h4
									style={{
										color: "#0369a1",
										marginBottom: "0.75rem",
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<FiGlobe />
									Authorization URL
								</h4>
								<ColorCodedURL url={authorizationUrl} />
								<div style={{ marginTop: "0.75rem" }}>
									<Button
										variant="secondary"
										onClick={() => {
											copyToClipboard(authorizationUrl, "Authorization URL");
											showFlowSuccess(
												"📋 Authorization URL Copied",
												"The authorization URL has been copied to your clipboard.",
											);
										}}
										style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
									>
										<FiCopy />
										Copy URL
									</Button>
									<Button
										variant="secondary"
										onClick={() =>
											setShowParameterBreakdown(!showParameterBreakdown)
										}
										style={{
											fontSize: "0.875rem",
											padding: "0.5rem 1rem",
											marginLeft: "0.5rem",
										}}
									>
										<FiInfo />
										{showParameterBreakdown ? "Hide" : "Show"} Parameters
									</Button>
								</div>

								{showParameterBreakdown && (
									<ParameterBreakdown>
										<h5 style={{ margin: "0 0 1rem 0", color: "#1e40af" }}>
											URL Parameters
										</h5>
										<ParameterItem>
											<ParameterLabel>Response Type</ParameterLabel>
											<ParameterValue>
												{credentials.responseType}
											</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterLabel>Client ID</ParameterLabel>
											<ParameterValue>{credentials.clientId}</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterLabel>Redirect URI</ParameterLabel>
											<ParameterValue>{credentials.redirectUri}</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterLabel>Scopes</ParameterLabel>
											<ParameterValue>{credentials.scopes}</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterLabel>State</ParameterLabel>
											<ParameterValue>{credentials.state}</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterLabel>Nonce</ParameterLabel>
											<ParameterValue>{credentials.nonce}</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterLabel>Code Challenge</ParameterLabel>
											<ParameterValue>
												{credentials.codeChallenge}
											</ParameterValue>
										</ParameterItem>
										<ParameterItem>
											<ParameterLabel>Code Challenge Method</ParameterLabel>
											<ParameterValue>
												{credentials.codeChallengeMethod}
											</ParameterValue>
										</ParameterItem>
									</ParameterBreakdown>
								)}
							</div>
						)}
					</div>
				),
				canExecute: Boolean(
					credentials.state && credentials.nonce && credentials.codeChallenge,
				),
				completed: Boolean(authorizationUrl),
			},
			{
				id: "request-authorization",
				title: "User Authorization & Hybrid Flow",
				description:
					"Redirect the user to PingOne to authenticate and obtain authorization code and ID token",
				icon: <FiGlobe />,
				category: "authorization",
				content: (
					<div>
						{/* Main Content Block */}
						<div
							style={{
								backgroundColor: "#f0f9ff",
								border: "1px solid #bae6fd",
								borderRadius: "0.75rem",
								padding: "1.5rem",
								marginBottom: "1.5rem",
							}}
						>
							<h3
								style={{
									margin: "0 0 1rem 0",
									color: "#1e40af",
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									fontSize: "1.125rem",
									fontWeight: "600",
								}}
							>
								<FiGlobe />
								OIDC Hybrid Flow - Step 3
							</h3>
							<p
								style={{
									margin: "0 0 1rem 0",
									color: "#1e40af",
									lineHeight: "1.6",
								}}
							>
								The user will be redirected to PingOne to authenticate. Upon
								successful authentication and consent, PingOne will redirect
								back with an <strong>authorization code</strong> and{" "}
								<strong>ID token</strong> - providing both secure token exchange
								and immediate user identity information.
							</p>

							{/* Why Hybrid Flow Section */}
							<div style={{ marginTop: "1.5rem" }}>
								<h4
									style={{
										margin: "0 0 0.75rem 0",
										color: "#1e40af",
										fontSize: "1rem",
										fontWeight: "600",
									}}
								>
									Why Hybrid Flow?
								</h4>
								<ul
									style={{
										margin: "0",
										paddingLeft: "1.5rem",
										color: "#1e40af",
										lineHeight: "1.6",
									}}
								>
									<li>
										Combines security of authorization code with immediate ID
										token access
									</li>
									<li>
										Returns both authorization code and ID token in single
										response
									</li>
									<li>
										Enables server-side token exchange with client
										authentication
									</li>
									<li>
										Provides immediate user identity without additional API
										calls
									</li>
								</ul>
							</div>
						</div>

						{/* Test Button */}
						<div style={{ marginBottom: "1.5rem" }}>
							<Button
								variant="danger"
								onClick={() => alert("TEST BUTTON WORKS!")}
								style={{ marginBottom: "1rem" }}
							>
								🧪 TEST BUTTON
							</Button>
						</div>

						{/* Authorization Methods Section */}
						<div style={{ marginBottom: "1.5rem" }}>
							<h4
								style={{
									margin: "0 0 1rem 0",
									color: "#1f2937",
									fontSize: "1rem",
									fontWeight: "600",
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
								}}
							>
								<FiShield />
								Authorization Methods:
							</h4>

							<div
								style={{
									display: "flex",
									gap: "1rem",
									marginBottom: "0.75rem",
									flexWrap: "wrap",
								}}
							>
								<Button
									variant={
										authorizationMethod === "popup" ? "primary" : "secondary"
									}
									onClick={() => {
										console.log(
											"🔧 [OIDC-HYBRID-V3] Setting authorization method to popup",
										);
										alert("Popup Authorization button clicked!");
										setAuthorizationMethod("popup");
									}}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
										padding: "0.75rem 1.5rem",
									}}
								>
									<FiGlobe />
									Popup Authorization
								</Button>

								<Button
									variant={
										authorizationMethod === "redirect" ? "primary" : "secondary"
									}
									onClick={() => {
										console.log(
											"🔧 [OIDC-HYBRID-V3] Setting authorization method to redirect",
										);
										alert("Full Redirect button clicked!");
										setAuthorizationMethod("redirect");
									}}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
										padding: "0.75rem 1.5rem",
									}}
								>
									<FiExternalLink />
									Full Redirect
								</Button>
							</div>

							<div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
								<p style={{ margin: "0 0 0.25rem 0" }}>
									<strong>Popup:</strong> Opens in new window, returns to this
									page automatically.
								</p>
								<p style={{ margin: "0" }}>
									<strong>Redirect:</strong> Navigates away from this page,
									returns after authorization.
								</p>
							</div>
						</div>

						{/* Action Button */}
						<div style={{ marginBottom: "1.5rem" }}>
							<Button
								variant="primary"
								onClick={() => {
									console.log(
										"🔧 [OIDC-HYBRID-V3] Request Authorization clicked",
										{
											authorizationUrl,
											authorizationMethod,
											hasUrl: !!authorizationUrl,
										},
									);
									alert("Request Authorization button clicked!");
									requestAuthorization();
								}}
								disabled={isRequestingAuthorization || !authorizationUrl}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									padding: "0.75rem 2rem",
									fontSize: "1rem",
									fontWeight: "600",
								}}
							>
								{isRequestingAuthorization ? (
									<>
										<FiRefreshCw className="animate-spin" />
										Opening Authorization...
									</>
								) : (
									<>
										<FiGlobe />
										Request Authorization
									</>
								)}
							</Button>
						</div>

						{/* Debug Information Section */}
						<details
							style={{
								backgroundColor: "#f8fafc",
								border: "1px solid #e2e8f0",
								borderRadius: "0.5rem",
								padding: "0.75rem",
							}}
						>
							<summary
								style={{
									cursor: "pointer",
									fontWeight: "600",
									color: "#374151",
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
								}}
							>
								<FiSettings />
								Debug Information
							</summary>
							<div style={{ marginTop: "0.75rem", fontSize: "0.875rem" }}>
								<p style={{ margin: "0 0 0.5rem 0", color: "#6b7280" }}>
									<strong>Authorization URL:</strong>
								</p>
								{authorizationUrl ? (
									<div
										style={{
											backgroundColor: "#f3f4f6",
											padding: "0.5rem",
											borderRadius: "0.25rem",
											fontFamily: "monospace",
											fontSize: "0.75rem",
											wordBreak: "break-all",
											color: "#374151",
										}}
									>
										{authorizationUrl}
									</div>
								) : (
									<p style={{ margin: "0", color: "#9ca3af" }}>
										Authorization URL not yet generated
									</p>
								)}
							</div>
						</details>
					</div>
				),
				canExecute: Boolean(authorizationUrl),
				completed: Boolean(tokens),
			},
			{
				id: "display-tokens",
				title: "Display Tokens",
				description: "View the received authorization code and ID token",
				icon: <FiCheckCircle />,
				category: "results",
				content: (
					<div>
						{tokens ? (
							<div>
								<InfoBox type="success" style={{ marginBottom: "1.5rem" }}>
									<div>
										<h4
											style={{
												margin: "0 0 1rem 0",
												color: "#166534",
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<FiCheckCircle />
											OIDC Hybrid Flow Completed Successfully
										</h4>
										<p style={{ margin: "0", color: "#166534" }}>
											The authorization code and ID token have been received
											successfully.
										</p>
									</div>
								</InfoBox>

								<TokenDisplay tokens={tokens} />

								<div style={{ marginTop: "1.5rem" }}>
									<Button variant="secondary" onClick={resetFlow}>
										<FiRefreshCw />
										Reset Flow
									</Button>
								</div>
							</div>
						) : (
							<div>
								<InfoBox type="warning" style={{ marginBottom: "1.5rem" }}>
									<div>
										<h4
											style={{
												margin: "0 0 1rem 0",
												color: "#92400e",
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<FiAlertTriangle />
											Waiting for Authorization
										</h4>
										<p style={{ margin: "0", color: "#92400e" }}>
											Complete the authorization process in the popup window to
											receive tokens.
										</p>
									</div>
								</InfoBox>
							</div>
						)}
					</div>
				),
				canExecute: false,
				completed: Boolean(tokens),
			},
			{
				id: "display-hybrid-flow-results",
				title: "Display Hybrid Flow Results",
				description:
					"View the ID token and authorization code received simultaneously from the hybrid flow",
				icon: <FiCode />,
				category: "results",
				content: (
					<div>
						<InfoBox type="info" style={{ marginBottom: "1.5rem" }}>
							<div>
								<h4
									style={{
										margin: "0 0 1rem 0",
										color: "#1e40af",
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<FiInfo />
									OIDC Hybrid Flow Results
								</h4>
								<p style={{ margin: "0 0 1rem 0", color: "#1e40af" }}>
									The hybrid flow returns both an <strong>ID token</strong> and{" "}
									<strong>authorization code</strong> simultaneously in the
									authorization response. This provides immediate user identity
									information while maintaining secure server-side token
									exchange.
								</p>
								<p style={{ margin: "0", color: "#1e40af" }}>
									<strong>Next Step:</strong> Use the authorization code to
									exchange for access and refresh tokens.
								</p>
							</div>
						</InfoBox>

						{authorizationCode && tokens?.id_token ? (
							<div>
								<InfoBox type="success" style={{ marginBottom: "1.5rem" }}>
									<div>
										<h4
											style={{
												margin: "0 0 1rem 0",
												color: "#166534",
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<FiCheckCircle />
											Hybrid Flow Successful
										</h4>
										<p style={{ margin: "0", color: "#166534" }}>
											Received both ID token and authorization code
											simultaneously from the hybrid flow response.
										</p>
									</div>
								</InfoBox>

								{/* ID Token Display */}
								<div
									style={{
										background: "#f0f9ff",
										border: "1px solid #0ea5e9",
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
										<strong style={{ color: "#0369a1", fontSize: "0.9rem" }}>
											ID Token (Immediate Access):
										</strong>
										<Button
											variant="secondary"
											onClick={() => {
												copyToClipboard(tokens.id_token, "ID Token");
											}}
											style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
										>
											<FiCopy /> Copy
										</Button>
									</div>
									<div
										style={{
											fontFamily: "monospace",
											fontSize: "0.875rem",
											color: "#0369a1",
											wordBreak: "break-all",
											background: "#f0f9ff",
											padding: "0.5rem",
											borderRadius: "4px",
										}}
									>
										{tokens.id_token}
									</div>
								</div>

								{/* Authorization Code Display */}
								<div
									style={{
										background: "#f0fdf4",
										border: "1px solid #22c55e",
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
										<strong style={{ color: "#15803d", fontSize: "0.9rem" }}>
											Authorization Code (For Token Exchange):
										</strong>
										<Button
											variant="secondary"
											onClick={() => {
												copyToClipboard(
													authorizationCode,
													"Authorization Code",
												);
											}}
											style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
										>
											<FiCopy /> Copy
										</Button>
									</div>
									<div
										style={{
											fontFamily: "monospace",
											fontSize: "0.875rem",
											color: "#15803d",
											wordBreak: "break-all",
											background: "#f0fdf4",
											padding: "0.5rem",
											borderRadius: "4px",
										}}
									>
										{authorizationCode}
									</div>
								</div>
							</div>
						) : authorizationCode ? (
							<div>
								<InfoBox type="warning" style={{ marginBottom: "1.5rem" }}>
									<div>
										<h4
											style={{
												margin: "0 0 1rem 0",
												color: "#92400e",
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<FiAlertTriangle />
											Partial Hybrid Flow Response
										</h4>
										<p style={{ margin: "0", color: "#92400e" }}>
											Received authorization code but missing ID token. This may
											indicate a configuration issue with the hybrid flow.
										</p>
									</div>
								</InfoBox>

								<div
									style={{
										background: "#fef3c7",
										border: "1px solid #f59e0b",
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
										<strong style={{ color: "#92400e", fontSize: "0.9rem" }}>
											Authorization Code:
										</strong>
										<Button
											variant="secondary"
											onClick={() => {
												copyToClipboard(
													authorizationCode,
													"Authorization Code",
												);
											}}
											style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
										>
											<FiCopy /> Copy
										</Button>
									</div>
									<div
										style={{
											fontFamily: "monospace",
											fontSize: "0.875rem",
											color: "#92400e",
											wordBreak: "break-all",
											background: "#fef3c7",
											padding: "0.5rem",
											borderRadius: "4px",
										}}
									>
										{authorizationCode}
									</div>
								</div>
							</div>
						) : (
							<div>
								<InfoBox type="warning" style={{ marginBottom: "1.5rem" }}>
									<div>
										<h4
											style={{
												margin: "0 0 1rem 0",
												color: "#92400e",
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<FiAlertTriangle />
											Waiting for Hybrid Flow Response
										</h4>
										<p style={{ margin: "0", color: "#92400e" }}>
											Complete the authorization process to receive both the ID
											token and authorization code from the hybrid flow.
										</p>
									</div>
								</InfoBox>
							</div>
						)}
					</div>
				),
				canExecute: false,
				completed: Boolean(authorizationCode),
			},
			{
				id: "exchange-code-for-tokens",
				title: "Exchange Code for Tokens",
				description:
					"Exchange the authorization code for access and refresh tokens",
				icon: <FiKey />,
				category: "token-exchange",
				content: (
					<div>
						<InfoBox type="info" style={{ marginBottom: "1.5rem" }}>
							<div>
								<h4
									style={{
										margin: "0 0 1rem 0",
										color: "#1e40af",
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<FiKey />
									Token Exchange (Hybrid Flow)
								</h4>
								<p style={{ margin: "0 0 1rem 0", color: "#1e40af" }}>
									Exchange the authorization code for{" "}
									<strong>access and refresh tokens</strong> using the token
									endpoint. We already have the ID token from the hybrid flow
									response, so this step focuses on getting the access token for
									API calls.
								</p>
								<p style={{ margin: "0 0 1rem 0", color: "#1e40af" }}>
									<strong>What we have:</strong> ID Token (user identity) ✅
									<br />
									<strong>What we need:</strong> Access Token (API access) +
									Refresh Token (token renewal)
								</p>
								<p style={{ margin: "0", color: "#1e40af" }}>
									<strong>Authentication Method:</strong>{" "}
									{credentials.clientAuthMethod}
								</p>
							</div>
						</InfoBox>

						{tokens ? (
							<div>
								<InfoBox type="success" style={{ marginBottom: "1.5rem" }}>
									<div>
										<h4
											style={{
												margin: "0 0 1rem 0",
												color: "#166534",
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<FiCheckCircle />
											Hybrid Flow Token Exchange Successful
										</h4>
										<p style={{ margin: "0", color: "#166534" }}>
											Authorization code has been successfully exchanged for
											access and refresh tokens. Now we have both ID token (from
											hybrid flow) and access token (from exchange) for complete
											functionality.
										</p>
									</div>
								</InfoBox>

								<TokenDisplay tokens={tokens} />
							</div>
						) : (
							<div>
								<InfoBox type="warning" style={{ marginBottom: "1.5rem" }}>
									<div>
										<h4
											style={{
												margin: "0 0 1rem 0",
												color: "#92400e",
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<FiAlertTriangle />
											Ready for Token Exchange
										</h4>
										<p style={{ margin: "0", color: "#92400e" }}>
											Click the button below to exchange the authorization code
											for tokens.
										</p>
									</div>
								</InfoBox>
							</div>
						)}
					</div>
				),
				execute: exchangeCodeForTokens,
				canExecute: Boolean(authorizationCode && !tokens?.access_token),
				completed: Boolean(tokens?.access_token),
			},
			{
				id: "get-user-info",
				title: "Get User Information",
				description: "Retrieve user information using the access token",
				icon: <FiUser />,
				category: "validation",
				content: (
					<div>
						<InfoBox type="info" style={{ marginBottom: "1.5rem" }}>
							<div>
								<h4
									style={{
										margin: "0 0 1rem 0",
										color: "#1e40af",
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<FiUser />
									User Information
								</h4>
								<p style={{ margin: "0 0 1rem 0", color: "#1e40af" }}>
									Retrieve user information from the UserInfo endpoint using the
									access token. This demonstrates how to access protected user
									data.
								</p>
							</div>
						</InfoBox>

						{userInfo ? (
							<div>
								<InfoBox type="success" style={{ marginBottom: "1.5rem" }}>
									<div>
										<h4
											style={{
												margin: "0 0 1rem 0",
												color: "#166534",
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<FiCheckCircle />
											User Information Retrieved
										</h4>
										<p style={{ margin: "0", color: "#166534" }}>
											User information has been successfully retrieved from the
											UserInfo endpoint.
										</p>
									</div>
								</InfoBox>

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
											User Information:
										</strong>
										<Button
											variant="secondary"
											onClick={() => {
												copyToClipboard(
													JSON.stringify(userInfo, null, 2),
													"User Information",
												);
											}}
											style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
										>
											<FiCopy /> Copy
										</Button>
									</div>
									<pre
										style={{
											fontFamily: "monospace",
											fontSize: "0.875rem",
											color: "#374151",
											background: "#f1f5f9",
											padding: "0.5rem",
											borderRadius: "4px",
											overflow: "auto",
											maxHeight: "300px",
										}}
									>
										{JSON.stringify(userInfo, null, 2)}
									</pre>
								</div>
							</div>
						) : (
							<div>
								<InfoBox type="warning" style={{ marginBottom: "1.5rem" }}>
									<div>
										<h4
											style={{
												margin: "0 0 1rem 0",
												color: "#92400e",
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
										>
											<FiAlertTriangle />
											Ready to Get User Info
										</h4>
										<p style={{ margin: "0", color: "#92400e" }}>
											Click the button below to retrieve user information using
											the access token.
										</p>
									</div>
								</InfoBox>
							</div>
						)}
					</div>
				),
				execute: getUserInfo,
				canExecute: Boolean(tokens?.access_token && !userInfo),
				completed: Boolean(userInfo),
			},
		],
		[
			credentials,
			authorizationUrl,
			tokens,
			authorizationCode,
			userInfo,
			isRequestingAuthorization,
			showParameterBreakdown,
			authorizationMethod,
			saveCredentials,
			buildAuthorizationUrl,
			requestAuthorization,
			exchangeCodeForTokens,
			getUserInfo,
			resetFlow,
		],
	);

	return (
		<Container>
			<Header>
				<Title>OIDC Hybrid Flow V3</Title>
				<Subtitle>
					OIDC 1.0 Hybrid Flow implementation with PKCE, state, and nonce
					validation. Returns both ID token and authorization code
					simultaneously, then exchanges code for access token. Combines the
					security of authorization code flow with the immediate identity
					information of implicit flow.
				</Subtitle>
			</Header>

			<FlowCard>
				<EnhancedStepFlowV2
					steps={steps}
					stepManager={stepManager}
					flowId="oidc_hybrid_v3"
					flowTitle="OIDC Hybrid Flow V3"
					showDebugInfo={false}
					onStepComplete={(stepId, result) => {
						logger.info("OIDCHybridV3", `✅ Step completed: ${stepId}`, result);
						setStepResults((prev) => ({ ...prev, [stepId]: result }));
					}}
					onStepError={(stepId, error) => {
						logger.error("OIDCHybridV3", `❌ Step failed: ${stepId}`, error);
					}}
				/>
			</FlowCard>

			{/* Modals */}
			<AuthorizationRequestModal
				isOpen={showAuthorizationModal}
				onClose={() => setShowAuthorizationModal(false)}
				onProceed={() => {
					setShowAuthorizationModal(false);
					requestAuthorizationDirect();
				}}
				authorizationUrl={authorizationUrl}
				requestParams={{
					environmentId: credentials.environmentId || "",
					clientId: credentials.clientId || "",
					redirectUri: credentials.redirectUri || "",
					scopes: credentials.scopes || "",
					responseType: credentials.responseType || "",
					flowType: "oidc-hybrid-v3",
				}}
			/>

			<ConfirmationModal
				isOpen={showResetModal}
				onClose={() => setShowResetModal(false)}
				onConfirm={resetFlow}
				title="Reset OIDC Hybrid Flow"
				message="Are you sure you want to reset the flow? This will clear all tokens and return to the configuration step."
				confirmText="Reset Flow"
				cancelText="Cancel"
				variant="danger"
			/>

			{/* Default Redirect URI Modal */}
			<DefaultRedirectUriModal
				isOpen={showDefaultRedirectUriModal}
				onClose={() => setShowDefaultRedirectUriModal(false)}
				onContinue={handleContinueWithDefaultUri}
				flowType="oidc-hybrid-v3"
				defaultRedirectUri={defaultRedirectUri}
			/>
		</Container>
	);
};

export default OIDCHybridFlowV3;
