// src/pages/flows/OIDCClientCredentialsFlowV3.tsx - OIDC Client Credentials Flow V3
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
	FiCheckCircle,
	FiChevronDown,
	FiChevronRight,
	FiCopy,
	FiEye,
	FiEyeOff,
	FiKey,
	FiRefreshCw,
	FiSettings,
	FiShield,
	FiUser,
} from "react-icons/fi";
import styled from "styled-components";
import ConfirmationModal from "../../components/ConfirmationModal";
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
} from "../../hooks/useNotifications";
import {
	applyClientAuthentication,
	type ClientAuthMethod,
	getAuthMethodSecurityLevel,
} from "../../utils/clientAuthentication";
import { copyToClipboard } from "../../utils/clipboard";
import { enhancedDebugger } from "../../utils/enhancedDebug";
import { useFlowStepManager } from "../../utils/flowStepSystem";
import { storeOAuthTokens } from "../../utils/tokenStorage";

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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
`;

const FlowCard = styled.div`
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
`;

const SecurityWarning = styled.div`
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  color: #92400e;
`;

const CredentialsSection = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const _AuthMethodSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
`;

const _AuthMethodOption = styled.div<{ $isSelected: boolean }>`
  padding: 1rem;
  border: 2px solid ${(props) => (props.$isSelected ? "#3b82f6" : "#e5e7eb")};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(props) => (props.$isSelected ? "#eff6ff" : "white")};
  
  &:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }
`;

const _AuthMethodTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 0.9rem;
  font-weight: 600;
`;

const _AuthMethodDescription = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 0.8rem;
  line-height: 1.4;
`;

const JsonDisplay = styled.div`
  background: white;
  color: #1f2937;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
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

interface OIDCClientCredentialsFlowV3Credentials {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	scope: string;
	audience: string;
	authMethod: ClientAuthMethod;
	privateKey?: string;
}

interface OIDCClientCredentialsTokens {
	access_token: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
	issued_at?: number;
	[key: string]: unknown;
}

type OIDCClientCredentialsFlowV3Props = {};

const OIDCClientCredentialsFlowV3: React.FC<
	OIDCClientCredentialsFlowV3Props
> = () => {
	const authContext = useAuth();
	const { config } = authContext;

	// Performance monitoring
	const _performanceTracking = usePerformanceTracking();

	// Start debug session
	React.useEffect(() => {
		const sessionId = enhancedDebugger.startSession(
			"oidc-client-credentials-v3",
		);
		console.log(" [OIDC-CC-V3] Debug session started:", sessionId);

		return () => {
			enhancedDebugger.endSession(sessionId);
		};
	}, []);

	// Use the new step management system
	const stepManager = useFlowStepManager({
		flowType: "oidc-client-credentials",
		persistKey: "oidc_client_credentials_v3_step_manager",
		defaultStep: 0,
		enableAutoAdvance: true,
	});

	// Flow state
	const [credentials, setCredentials] =
		useState<OIDCClientCredentialsFlowV3Credentials>({
			environmentId: "",
			clientId: "",
			clientSecret: "",
			scope: "api:read",
			audience: "https://api.pingone.com",
			authMethod: "client_secret_post",
			privateKey: "",
		});

	const [tokens, setTokens] = useState<OIDCClientCredentialsTokens | null>(
		null,
	);
	const [isRequestingToken, setIsRequestingToken] = useState(false);
	const [_isSavingCredentials, setIsSavingCredentials] = useState(false);
	const [showClearCredentialsModal, setShowClearCredentialsModal] =
		useState(false);
	const [isClearingCredentials, setIsClearingCredentials] = useState(false);
	const [showEducationalContent, setShowEducationalContent] = useState(true);
	const [isResettingFlow, setIsResettingFlow] = useState(false);
	const [showClientSecret, setShowClientSecret] = useState(false);
	const [showPrivateKey, setShowPrivateKey] = useState(false);

	// Populate credentials from config when available
	useEffect(() => {
		if (config?.environmentId && config?.clientId) {
			setCredentials((prev) => ({
				...prev,
				environmentId: config.environmentId || prev.environmentId,
				clientId: config.clientId || prev.clientId,
			}));
		}
	}, [config?.environmentId, config?.clientId]);

	// Load credentials from storage
	useEffect(() => {
		const savedCredentials = localStorage.getItem(
			"oidc_client_credentials_v3_credentials",
		);
		if (savedCredentials) {
			try {
				const parsed = JSON.parse(savedCredentials);
				setCredentials((prev) => ({ ...prev, ...parsed }));
				console.log(" [OIDC-CC-V3] Loaded saved credentials");
			} catch (error) {
				console.warn(
					" [OIDC-CC-V3] Failed to parse saved credentials:",
					error,
				);
			}
		}
	}, []);

	// Auto-generate token endpoint when environment ID changes
	useEffect(() => {
		if (credentials.environmentId && !credentials.environmentId.includes("{")) {
			const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
			console.log(
				" [OIDC-CC-V3] Auto-generated token endpoint:",
				tokenEndpoint,
			);
		}
	}, [credentials.environmentId]);

	// Save credentials to storage
	const saveCredentials = useCallback(async () => {
		console.log(" [OIDC-CC-V3] Save credentials clicked", { credentials });
		setIsSavingCredentials(true);

		try {
			// Validate required fields
			if (!credentials.environmentId || !credentials.clientId) {
				throw new Error("Environment ID and Client ID are required");
			}

			if (!credentials.clientSecret) {
				throw new Error("Client Secret is required");
			}

			// Simulate a brief delay to show loading state
			await new Promise((resolve) => setTimeout(resolve, 500));

			localStorage.setItem(
				"oidc_client_credentials_v3_credentials",
				JSON.stringify(credentials),
			);

			// Show success message
			showGlobalSuccess(
				" OIDC Client Credentials Saved",
				"Configuration saved successfully. Ready to request access token.",
			);
			setCredentialsSavedSuccessfully(true);
			console.log(" [OIDC-CC-V3] Credentials saved successfully");

			return { success: true };
		} catch (error) {
			showGlobalError(
				`Failed to save credentials: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			console.error(" [OIDC-CC-V3] Failed to save credentials:", error);
			throw error;
		} finally {
			setIsSavingCredentials(false);
		}
	}, [credentials]);

	// Clear credentials
	const clearCredentials = useCallback(async () => {
		setIsClearingCredentials(true);
		try {
			localStorage.removeItem("oidc_client_credentials_v3_credentials");
			setCredentials({
				environmentId: "",
				clientId: "",
				clientSecret: "",
				scope: "openid",
				audience: "https://api.pingone.com",
				authMethod: "client_secret_post",
				privateKey: "",
			});
			showGlobalSuccess(
				" Credentials Cleared",
				"All stored credentials have been removed successfully.",
			);
			console.log(" [OIDC-CC-V3] Credentials cleared");
		} catch (error) {
			showGlobalError(
				`Failed to clear credentials: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			console.error(" [OIDC-CC-V3] Failed to clear credentials:", error);
		} finally {
			setIsClearingCredentials(false);
			setShowClearCredentialsModal(false);
		}
	}, []);

	// Request access token
	const requestAccessToken = useCallback(async () => {
		try {
			// Validate required credentials
			if (!credentials.environmentId || !credentials.clientId) {
				throw new Error("Environment ID and Client ID are required");
			}

			// Validate authentication method specific requirements
			if (
				credentials.authMethod === "private_key_jwt" &&
				!credentials.privateKey
			) {
				throw new Error(
					"Private key is required for Private Key JWT authentication method",
				);
			}

			if (
				credentials.authMethod !== "none" &&
				credentials.authMethod !== "private_key_jwt" &&
				!credentials.clientSecret
			) {
				throw new Error(
					"Client secret is required for the selected authentication method",
				);
			}

			console.log(" [OIDC-CC-V3] Building token request", {
				clientId: credentials.clientId,
				scope: credentials.scope,
				audience: credentials.audience,
				environmentId: credentials.environmentId,
				authMethod: credentials.authMethod,
			});

			setIsRequestingToken(true);
			showGlobalSuccess(
				" Requesting Access Token",
				"Sending client credentials request to PingOne...",
			);

			// Prepare base request body
			const baseBody = new URLSearchParams({
				grant_type: "client_credentials",
			});

			// Always add scope - PingOne requires at least one scope
			const scopeToUse = credentials.scope?.trim()
				? credentials.scope
				: "openid";
			baseBody.append("scope", scopeToUse);

			console.log(
				" [OIDC-CC-V3] Using scope:",
				scopeToUse,
				"from credentials.scope:",
				credentials.scope,
			);

			if (credentials.audience) {
				baseBody.append("audience", credentials.audience);
			}

			// Apply client authentication method
			const tokenEndpoint = `https://auth.pingone.com/${credentials.environmentId}/as/token`;
			const authConfig = {
				method: credentials.authMethod,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				privateKey: credentials.privateKey || "",
				tokenEndpoint: tokenEndpoint,
			};

			const authenticatedRequest = await applyClientAuthentication(
				authConfig,
				baseBody,
			);

			// Use proxy for HTTPS support
			const backendUrl =
				process.env.NODE_ENV === "production"
					? "https://oauth-playground.vercel.app"
					: "";

			const response = await fetch(`${backendUrl}/api/client-credentials`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					environment_id: credentials.environmentId,
					auth_method: credentials.authMethod,
					headers: authenticatedRequest.headers,
					body: Object.fromEntries(authenticatedRequest.body.entries()),
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					`Token request failed: ${response.status} ${response.statusText}. ${errorData.error_description || errorData.error || "Please check your configuration and credentials."}`,
				);
			}

			const tokenData = await response.json();

			// Store tokens
			const tokensToStore = {
				access_token: tokenData.access_token,
				token_type: tokenData.token_type || "Bearer",
				expires_in: tokenData.expires_in,
				scope: tokenData.scope,
				issued_at: Math.floor(Date.now() / 1000),
			};

			setTokens(tokensToStore);
			await storeOAuthTokens(tokensToStore, "oidc_client_credentials");

			showGlobalSuccess(
				" Access Token Received",
				`Successfully obtained access token. Token type: ${tokenData.token_type || "Bearer"}, Expires in: ${tokenData.expires_in || "N/A"} seconds`,
			);

			console.log(" [OIDC-CC-V3] Token acquired", {
				exp: tokenData.expires_in,
				scope: tokenData.scope,
				token_type: tokenData.token_type,
			});

			return tokenData;
		} catch (error) {
			console.error(" [OIDC-CC-V3] Token request failed:", error);
			showGlobalError(
				`Failed to obtain access token: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			throw error;
		} finally {
			setIsRequestingToken(false);
		}
	}, [credentials]);

	// Reset flow
	const resetFlow = useCallback(async () => {
		console.log(" [OIDC-CC-V3] Reset flow initiated");

		setIsResettingFlow(true);

		try {
			// Simulate a brief delay for better UX
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Clear all state
			setTokens(null);

			// Reset step manager
			stepManager.resetFlow();

			// Show success message to user
			showGlobalSuccess(
				" OIDC Client Credentials Flow reset successfully! You can now begin a new flow.",
			);

			// Scroll to top
			window.scrollTo(0, 0);

			console.log(" [OIDC-CC-V3] Flow reset complete");
		} catch (error) {
			console.error(" [OIDC-CC-V3] Reset flow failed:", error);
			showGlobalError("Failed to reset flow");
		} finally {
			setIsResettingFlow(false);
		}
	}, [stepManager]);

	// Create steps
	const steps = useMemo(
		() => [
			{
				id: "setup-credentials",
				title: "Setup Credentials",
				description:
					"Configure your PingOne application credentials for OIDC Client Credentials flow",
				icon: <FiSettings />,
				category: "preparation" as const,
				content: (
					<form>
						<SecurityWarning>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									marginBottom: "0.5rem",
								}}
							>
								<FiShield />
								<strong>
									Security Best Practices: OIDC Client Credentials Flow
								</strong>
							</div>
							<div style={{ fontSize: "0.875rem", lineHeight: "1.5" }}>
								This flow is designed for{" "}
								<strong>machine-to-machine (M2M)</strong> authentication with
								OpenID Connect. Use strong authentication methods like{" "}
								<code>private_key_jwt</code> when possible. OIDC scopes provide
								additional context for token usage.
							</div>
						</SecurityWarning>

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
								<FormLabel>Token Endpoint Authentication Method</FormLabel>
								<select
									value={credentials.authMethod}
									onChange={(e) =>
										setCredentials((prev) => ({
											...prev,
											authMethod: e.target.value as ClientAuthMethod,
										}))
									}
									style={{
										width: "100%",
										padding: "0.75rem",
										border: "1px solid #d1d5db",
										borderRadius: "0.5rem",
										fontSize: "0.875rem",
										backgroundColor: "white",
									}}
								>
									<option value="client_secret_post">Client Secret Post</option>
									<option value="client_secret_basic">
										Client Secret Basic
									</option>
									<option value="client_secret_jwt">Client Secret JWT</option>
									<option value="private_key_jwt">Private Key JWT</option>
									<option value="none">None</option>
								</select>
								<div
									style={{
										fontSize: "0.875rem",
										color: "#6b7280",
										marginTop: "0.25rem",
									}}
								>
									{(() => {
										const securityInfo = getAuthMethodSecurityLevel(
											credentials.authMethod,
										);
										return `${securityInfo.icon} ${securityInfo.description}`;
									})()}
								</div>
							</FormField>

							{credentials.authMethod === "private_key_jwt" && (
								<FormField>
									<FormLabel>Private Key (PEM Format) *</FormLabel>
									<div style={{ position: "relative" }}>
										<textarea
											value={credentials.privateKey || ""}
											onChange={(e) =>
												setCredentials((prev) => ({
													...prev,
													privateKey: e.target.value,
												}))
											}
											placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC..."
											style={{
												width: "100%",
												height: "120px",
												padding: "0.75rem",
												border: "1px solid #d1d5db",
												borderRadius: "0.5rem",
												fontSize: "0.875rem",
												fontFamily: "Monaco, Menlo, Ubuntu Mono, monospace",
												resize: "vertical",
												paddingRight: showPrivateKey ? "2.5rem" : "0.75rem",
											}}
											required
										/>
										<button
											type="button"
											onClick={() => setShowPrivateKey(!showPrivateKey)}
											style={{
												position: "absolute",
												right: "0.75rem",
												top: "0.75rem",
												background: "none",
												border: "none",
												cursor: "pointer",
												color: "#6b7280",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											{showPrivateKey ? (
												<FiEyeOff size={16} />
											) : (
												<FiEye size={16} />
											)}
										</button>
									</div>
									<div
										style={{
											fontSize: "0.875rem",
											color: "#6b7280",
											marginTop: "0.25rem",
										}}
									>
										Private key in PEM format for RS256 JWT signing
									</div>
								</FormField>
							)}

							{credentials.authMethod !== "none" &&
								credentials.authMethod !== "private_key_jwt" && (
									<FormField>
										<FormLabel>Client Secret *</FormLabel>
										<div style={{ position: "relative" }}>
											<FormInput
												type={showClientSecret ? "text" : "password"}
												value={credentials.clientSecret}
												onChange={(e) =>
													setCredentials((prev) => ({
														...prev,
														clientSecret: e.target.value,
													}))
												}
												placeholder="Enter your client secret"
												required
											/>
											<button
												type="button"
												onClick={() => setShowClientSecret(!showClientSecret)}
												style={{
													position: "absolute",
													right: "0.75rem",
													top: "50%",
													transform: "translateY(-50%)",
													background: "none",
													border: "none",
													cursor: "pointer",
													color: "#6b7280",
												}}
											>
												{showClientSecret ? (
													<FiEyeOff size={16} />
												) : (
													<FiEye size={16} />
												)}
											</button>
										</div>
									</FormField>
								)}

							<FormField>
								<FormLabel>OIDC Scopes</FormLabel>
								<FormInput
									type="text"
									value={credentials.scope}
									onChange={(e) =>
										setCredentials((prev) => ({
											...prev,
											scope: e.target.value,
										}))
									}
									placeholder="openid"
								/>
								<div
									style={{
										fontSize: "0.875rem",
										color: "#6b7280",
										marginTop: "0.25rem",
									}}
								>
									OIDC scopes: openid, profile, email, address, phone. Custom
									scopes: p1:read:users, etc.
								</div>
							</FormField>

							<FormField>
								<FormLabel>Audience</FormLabel>
								<FormInput
									type="url"
									value={credentials.audience}
									onChange={(e) =>
										setCredentials((prev) => ({
											...prev,
											audience: e.target.value,
										}))
									}
									placeholder="https://api.pingone.com"
								/>
								<div
									style={{
										fontSize: "0.875rem",
										color: "#6b7280",
										marginTop: "0.25rem",
									}}
								>
									Target audience for the access token
								</div>
							</FormField>
						</CredentialsSection>
					</form>
				),
				execute: saveCredentials,
				canExecute: Boolean(
					credentials.environmentId &&
						credentials.clientId &&
						credentials.clientSecret,
				),
				completed: Boolean(
					credentials.environmentId &&
						credentials.clientId &&
						credentials.clientSecret,
				),
			},
			{
				id: "request-token",
				title: "Request Access Token",
				description:
					"Send client credentials to token endpoint to acquire OIDC access token",
				icon: <FiKey />,
				category: "token-exchange" as const,
				content: (
					<div>
						<InfoBox type="info">
							<FiKey />
							<div>
								<strong>OIDC Client Credentials Token Request</strong>
								<br />
								This step sends your client credentials to the token endpoint to
								acquire an OIDC access token. The authentication method
								determines how credentials are sent.
							</div>
						</InfoBox>

						{tokens && (
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
									OIDC Access Token Received:
								</h4>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<div style={{ flex: 1 }}>
										<TokenDisplay tokens={tokens} />
									</div>
									<button
										onClick={() =>
											copyToClipboard(tokens.access_token, "Access Token")
										}
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
				execute: requestAccessToken,
				canExecute: Boolean(
					credentials.environmentId &&
						credentials.clientId &&
						!isRequestingToken &&
						(credentials.authMethod === "none" ||
							(credentials.authMethod === "private_key_jwt" &&
								credentials.privateKey) ||
							(credentials.authMethod !== "private_key_jwt" &&
								credentials.clientSecret)),
				),
				completed: Boolean(tokens),
			},
			{
				id: "token-validation",
				title: "Token Validation & Display",
				description:
					"Validate and display the received OIDC access token details",
				icon: <FiShield />,
				category: "cleanup" as const,
				content: (
					<div>
						{tokens ? (
							<div>
								<InfoBox type="success">
									<FiCheckCircle />
									<div>
										<strong> OIDC Client Credentials Flow Successful!</strong>
										<br />
										OIDC access token received and validated successfully.
									</div>
								</InfoBox>

								<div style={{ marginTop: "1.5rem" }}>
									<h4>Token Details:</h4>
									<JsonDisplay>{JSON.stringify(tokens, null, 2)}</JsonDisplay>
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
									<strong> OIDC Token Ready for Use!</strong>
									<br />
									Your OIDC access token is ready to use for API calls. This
									token includes OpenID Connect context and can be used for
									machine-to-machine authentication with OIDC-aware services.
								</div>
							</div>
						) : (
							<InfoBox type="info">
								<FiShield />
								<div>
									<strong>Waiting for Token Response</strong>
									<br />
									Complete the token request step to receive your OIDC access
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
			tokens,
			isRequestingToken,
			saveCredentials,
			requestAccessToken,
			showClientSecret,
			showPrivateKey,
		],
	);

	return (
		<Container>
			<Header>
				<Title>
					<FiUser />
					OIDC Client Credentials Flow V3
				</Title>
				<Subtitle>
					OpenID Connect machine-to-machine authentication flow for
					server-to-server communication
				</Subtitle>
			</Header>

			<FlowCard>
				{/* Educational Overview - Only show on first step */}
				{stepManager.currentStepIndex === 0 && (
					<div
						style={{
							padding: "2rem",
							borderBottom: "1px solid #e5e7eb",
							background: "#f8fafc",
							border: "1px solid #e2e8f0",
							padding: "1.25rem",
							borderRadius: "0.75rem",
							boxShadow: "0 4px 12px rgba(148, 163, 184, 0.2)",
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
								 What is OIDC Client Credentials Flow?
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
											<li>Client authenticates directly with OIDC provider</li>
											<li>
												Uses client credentials (ID + secret or private key)
											</li>
											<li>
												Receives OIDC access token with OpenID Connect context
											</li>
											<li>No user interaction required</li>
											<li>Perfect for machine-to-machine authentication</li>
										</ul>
									</div>

									<div>
										<h3 style={{ color: "#374151", marginBottom: "1rem" }}>
											OIDC Benefits
										</h3>
										<ul
											style={{
												color: "#6b7280",
												lineHeight: "1.6",
												paddingLeft: "1.5rem",
											}}
										>
											<li>
												<strong>OpenID Connect Context</strong> - Rich identity
												information
											</li>
											<li>
												<strong>Standardized Scopes</strong> - openid, profile,
												email
											</li>
											<li>
												<strong>Audience Support</strong> - Token targeting
											</li>
											<li>
												<strong>JWT Tokens</strong> - Self-contained and
												verifiable
											</li>
											<li>
												<strong>Interoperability</strong> - Works across OIDC
												providers
											</li>
										</ul>
									</div>
								</div>

								<div
									style={{
										background: "#f0fdf4",
										border: "1px solid #bbf7d0",
										borderRadius: "8px",
										padding: "1rem",
									}}
								>
									<h4
										style={{
											color: "#15803d",
											margin: "0 0 0.5rem 0",
											display: "flex",
											alignItems: "center",
										}}
									>
										<FiShield style={{ marginRight: "0.5rem" }} />
										OIDC Security Best Practices
									</h4>
									<div
										style={{
											color: "#15803d",
											fontSize: "0.875rem",
											lineHeight: "1.5",
										}}
									>
										<p style={{ margin: "0 0 0.5rem 0" }}>
											<strong> Use Strong Authentication:</strong> Prefer
											private_key_jwt over shared secrets when possible.
										</p>
										<p style={{ margin: "0 0 0.5rem 0" }}>
											<strong> Secure Storage:</strong> Store credentials
											securely and never expose them in client-side code.
										</p>
										<p style={{ margin: "0" }}>
											<strong> Scope Management:</strong> Use appropriate OIDC
											scopes for your use case.
										</p>
									</div>
								</div>
							</>
						)}
					</div>
				)}

				{/* Main Step Flow */}
				<EnhancedStepFlowV2
					steps={steps}
					title=" OIDC Client Credentials Flow V3"
					persistKey="oidc_client_credentials_v3_flow_steps"
					initialStepIndex={stepManager.currentStepIndex}
					onStepChange={stepManager.setStep}
					autoAdvance={false}
					showDebugInfo={false}
					allowStepJumping={true}
					onStepComplete={(stepId, result) => {
						console.log(" [OIDC-CC-V3] Step completed:", stepId, result);
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
				title="Clear OIDC Client Credentials"
				message="Are you sure you want to clear all saved credentials? This will remove your Client ID, Client Secret, and other configuration data."
				confirmText="Clear Credentials"
				cancelText="Cancel"
				variant="danger"
				isLoading={isClearingCredentials}
			/>
		</Container>
	);
};

export default OIDCClientCredentialsFlowV3;
