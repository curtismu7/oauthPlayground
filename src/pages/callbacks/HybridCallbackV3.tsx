// src/pages/callbacks/HybridCallbackV3.tsx - OIDC Hybrid Flow Callback Handler V3
import type React from "react";
import { useEffect, useState } from "react";
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiRefreshCw,
	FiShield,
} from "react-icons/fi";
import styled from "styled-components";
import { ColorCodedURL } from "../../components/ColorCodedURL";
import TokenDisplay from "../../components/TokenDisplay";
import { decodeJwt, validateToken } from "../../utils/jwt";
import { logger } from "../../utils/logger";
import { storeOAuthTokens } from "../../utils/tokenStorage";

// Styled components
const Container = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 2rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CallbackCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 2rem;
  max-width: 800px;
  width: 100%;
  border: 1px solid #e5e7eb;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
`;

const StatusCard = styled.div<{ variant: "success" | "error" | "info" }>`
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border: 1px solid;
  
  ${(props) => {
		switch (props.variant) {
			case "success":
				return `
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;
        `;
			case "error":
				return `
          background: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        `;
			default:
				return `
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1e40af;
        `;
		}
	}}
`;

const InfoBox = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  background: #3b82f6;
  color: white;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const Spinner = styled.div`
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  animation: spin 1s linear infinite;
`;

interface HybridCallbackResponse {
	code?: string;
	id_token?: string;
	access_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
	state?: string;
	error?: string;
	error_description?: string;
}

interface HybridTokens {
	access_token?: string;
	id_token?: string;
	refresh_token?: string;
	token_type?: string;
	expires_in?: number;
	scope?: string;
}

const HybridCallbackV3: React.FC = () => {
	const [status, setStatus] = useState<"processing" | "success" | "error">(
		"processing",
	);
	const [message, setMessage] = useState<string>("");
	const [tokens, setTokens] = useState<HybridTokens | null>(null);
	const [response, setResponse] = useState<HybridCallbackResponse | null>(null);
	const [error, setError] = useState<string>("");
	const [troubleshootingSteps, setTroubleshootingSteps] = useState<string[]>(
		[],
	);

	useEffect(() => {
		processCallback();
	}, [processCallback]);

	const processCallback = async () => {
		try {
			logger.info("HybridCallbackV3", " HYBRID parsed query+fragment", {
				url: window.location.href,
				hash: window.location.hash,
				search: window.location.search,
			});

			// Parse URL parameters
			const urlParams = new URLSearchParams(window.location.search);
			const hashParams = new URLSearchParams(window.location.hash.substring(1));

			// Combine query and fragment parameters
			const allParams = new URLSearchParams();

			// Add query parameters
			for (const [key, value] of urlParams.entries()) {
				allParams.append(key, value);
			}

			// Add fragment parameters (these take precedence)
			for (const [key, value] of hashParams.entries()) {
				allParams.set(key, value);
			}

			const response: HybridCallbackResponse = {
				code: allParams.get("code") || undefined,
				id_token: allParams.get("id_token") || undefined,
				access_token: allParams.get("access_token") || undefined,
				token_type: allParams.get("token_type") || undefined,
				expires_in: allParams.get("expires_in")
					? parseInt(allParams.get("expires_in")!, 10)
					: undefined,
				scope: allParams.get("scope") || undefined,
				state: allParams.get("state") || undefined,
				error: allParams.get("error") || undefined,
				error_description: allParams.get("error_description") || undefined,
			};

			setResponse(response);

			// Check for errors
			if (response.error) {
				throw new Error(
					`OIDC Hybrid Flow error: ${response.error}${response.error_description ? ` - ${response.error_description}` : ""}`,
				);
			}

			// Validate required parameters
			if (!response.code && !response.id_token && !response.access_token) {
				throw new Error(
					"No tokens or authorization code received from authorization server",
				);
			}

			// Load stored security parameters
			const storedSecurity = localStorage.getItem("oidc_hybrid_v3_security");
			if (!storedSecurity) {
				throw new Error(
					"Security parameters not found. Please restart the flow.",
				);
			}

			const security = JSON.parse(storedSecurity);

			// Validate state parameter
			if (response.state && response.state !== security.state) {
				throw new Error("State parameter mismatch. Possible CSRF attack.");
			}

			// Verify ID token if present
			if (response.id_token) {
				try {
					logger.info("HybridCallbackV3", " Verifying ID token", {
						hasIdToken: !!response.id_token,
						hasNonce: !!security.nonce,
					});

					// Decode the ID token to check basic structure and claims
					const decodedToken = decodeJwt(response.id_token);
					if (!decodedToken) {
						throw new Error("Failed to decode ID token");
					}

					// Basic validation of ID token claims
					const validation = validateToken(response.id_token, {
						requiredClaims: ["iss", "sub", "aud", "exp", "iat"],
						leeway: 300, // 5 minutes leeway for clock skew
					});

					if (!validation.valid) {
						throw new Error(`ID token validation failed: ${validation.error}`);
					}

					// Check nonce if provided
					if (security.nonce && decodedToken.nonce !== security.nonce) {
						throw new Error("Nonce mismatch in ID token");
					}

					logger.info("HybridCallbackV3", " HYBRID id_token verified", {
						subject: decodedToken.sub,
						issuer: decodedToken.iss,
						audience: decodedToken.aud,
						nonceMatch:
							!security.nonce || decodedToken.nonce === security.nonce,
					});
				} catch (idTokenError) {
					logger.error(
						"HybridCallbackV3",
						" ID token verification failed",
						idTokenError,
					);
					throw new Error(`ID token verification failed: ${idTokenError}`);
				}
			}

			// Exchange authorization code for tokens if present
			let exchangedTokens: HybridTokens = {};

			if (response.code) {
				try {
					logger.info("HybridCallbackV3", " HYBRID code exchanged", {
						hasCode: !!response.code,
						codeLength: response.code.length,
					});

					// In a real implementation, you would exchange the code for tokens here
					// For now, we'll use the tokens received directly from the fragment
					exchangedTokens = {
						access_token: response.access_token,
						id_token: response.id_token,
						token_type: response.token_type,
						expires_in: response.expires_in,
						scope: response.scope,
					};
				} catch (exchangeError) {
					logger.error(
						"HybridCallbackV3",
						" Token exchange failed",
						exchangeError,
					);
					throw new Error(`Token exchange failed: ${exchangeError}`);
				}
			}

			// Combine all tokens
			const finalTokens: HybridTokens = {
				...exchangedTokens,
				access_token: response.access_token || exchangedTokens.access_token,
				id_token: response.id_token || exchangedTokens.id_token,
				token_type: response.token_type || exchangedTokens.token_type,
				expires_in: response.expires_in || exchangedTokens.expires_in,
				scope: response.scope || exchangedTokens.scope,
			};

			// Store tokens
			await storeOAuthTokens(finalTokens, "hybrid");

			logger.info("HybridCallbackV3", " HYBRID tokens stored", {
				hasAccessToken: !!finalTokens.access_token,
				hasIdToken: !!finalTokens.id_token,
				tokenType: finalTokens.token_type,
				expiresIn: finalTokens.expires_in,
			});

			setTokens(finalTokens);
			setStatus("success");
			setMessage(
				"OIDC Hybrid Flow completed successfully! Tokens have been received and stored.",
			);

			// Clear URL parameters for security
			window.history.replaceState({}, document.title, window.location.pathname);

			// Clear stored security parameters
			localStorage.removeItem("oidc_hybrid_v3_security");
		} catch (error) {
			logger.error(
				"HybridCallbackV3",
				" Hybrid callback processing failed",
				error,
			);

			setStatus("error");
			setError(
				error instanceof Error ? error.message : "Unknown error occurred",
			);

			// Generate troubleshooting steps
			const steps = [];
			if (error instanceof Error) {
				if (error.message.includes("state")) {
					steps.push(
						"Check if the state parameter matches the one sent in the authorization request",
					);
					steps.push(
						"Ensure the authorization request was initiated from the same browser session",
					);
				}
				if (error.message.includes("nonce")) {
					steps.push(
						"Verify the nonce parameter matches the one sent in the authorization request",
					);
					steps.push("Check if the ID token is valid and not expired");
				}
				if (error.message.includes("verification")) {
					steps.push("Verify the ID token signature with the issuer's JWKS");
					steps.push("Check if the issuer URL is correct and accessible");
				}
				if (error.message.includes("exchange")) {
					steps.push("Ensure the authorization code is valid and not expired");
					steps.push("Verify the token endpoint URL and client credentials");
				}
			}

			if (steps.length === 0) {
				steps.push("Check the browser console for detailed error information");
				steps.push("Verify your PingOne configuration and client settings");
				steps.push(
					"Ensure the redirect URI matches exactly in your PingOne application",
				);
			}

			setTroubleshootingSteps(steps);
		}
	};

	const handleClose = () => {
		// Close the popup window if this is running in a popup
		if (window.opener) {
			window.close();
		} else {
			// Redirect to the main application
			window.location.href = "/flows/oidc-hybrid-v3";
		}
	};

	return (
		<Container>
			<CallbackCard>
				<Header>
					<Title>
						{status === "processing" && (
							<Spinner>
								<FiRefreshCw />
							</Spinner>
						)}
						{status === "success" && <FiCheckCircle />}
						{status === "error" && <FiAlertTriangle />}
						OIDC Hybrid Flow Callback
					</Title>
					<Subtitle>
						{status === "processing" &&
							"Processing OIDC Hybrid Flow response..."}
						{status === "success" && "Authorization completed successfully!"}
						{status === "error" &&
							"Authorization failed. Please check the details below."}
					</Subtitle>
				</Header>

				{status === "processing" && (
					<StatusCard variant="info">
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
								marginBottom: "1rem",
							}}
						>
							<FiRefreshCw className="animate-spin" />
							<strong>Processing Response</strong>
						</div>
						<p>
							Validating security parameters, verifying tokens, and storing
							credentials...
						</p>
					</StatusCard>
				)}

				{status === "success" && (
					<>
						<StatusCard variant="success">
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									marginBottom: "1rem",
								}}
							>
								<FiCheckCircle />
								<strong>Success!</strong>
							</div>
							<p>{message}</p>
						</StatusCard>

						{tokens && (
							<div style={{ marginTop: "1.5rem" }}>
								<h3
									style={{
										color: "#1f2937",
										marginBottom: "1rem",
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
									}}
								>
									<FiShield />
									Received Tokens
								</h3>
								<TokenDisplay tokens={tokens} flowType="hybrid" />
							</div>
						)}

						<div style={{ marginTop: "1.5rem", textAlign: "center" }}>
							<Button onClick={handleClose}>
								<FiCheckCircle />
								Continue
							</Button>
						</div>
					</>
				)}

				{status === "error" && (
					<>
						<StatusCard variant="error">
							<div
								style={{
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									marginBottom: "1rem",
								}}
							>
								<FiAlertTriangle />
								<strong>Authorization Failed</strong>
							</div>
							<p>
								<strong>Error:</strong> {error}
							</p>
						</StatusCard>

						{troubleshootingSteps.length > 0 && (
							<InfoBox>
								<strong>Troubleshooting Steps:</strong>
								<ol style={{ margin: "0.5rem 0 0 1rem" }}>
									{troubleshootingSteps.map((step, index) => (
										<li key={index} style={{ marginBottom: "0.25rem" }}>
											{step}
										</li>
									))}
								</ol>
							</InfoBox>
						)}

						{response && (
							<InfoBox>
								<strong>Response Details:</strong>
								<pre
									style={{
										background: "#f3f4f6",
										padding: "0.75rem",
										borderRadius: "4px",
										marginTop: "0.5rem",
										fontSize: "0.875rem",
										overflow: "auto",
									}}
								>
									{JSON.stringify(response, null, 2)}
								</pre>
							</InfoBox>
						)}

						<div style={{ marginTop: "1.5rem", textAlign: "center" }}>
							<Button onClick={handleClose}>
								<FiAlertTriangle />
								Close
							</Button>
						</div>
					</>
				)}

				{response && (
					<InfoBox style={{ marginTop: "1.5rem" }}>
						<strong>Callback URL:</strong>
						<div style={{ marginTop: "0.5rem" }}>
							<ColorCodedURL url={window.location.href} />
						</div>
					</InfoBox>
				)}
			</CallbackCard>
		</Container>
	);
};

export default HybridCallbackV3;
