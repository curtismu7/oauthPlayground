import type React from "react";
import { useState } from "react";
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiClock,
	FiCopy,
	FiInfo,
	FiKey,
	FiRefreshCw,
	FiShield,
	FiUser,
	FiXCircle,
} from "react-icons/fi";
import styled from "styled-components";
import { Card, CardBody, CardHeader } from "../../components/Card";
import PageTitle from "../../components/PageTitle";
import { SpecCard } from "../../components/SpecCard";
import { TokenSurface } from "../../components/TokenSurface";
import { useAuth } from "../../contexts/NewAuthContext";
import { logger } from "../../utils/logger";

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const FlowSection = styled(Card)`
  margin-bottom: 2rem;
`;

const StepContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0;
`;

const Step = styled.div<{ $active?: boolean; $completed?: boolean }>`
  padding: 1rem;
  border: 2px solid ${(props) =>
		props.$completed ? "#10b981" : props.$active ? "#3b82f6" : "#e5e7eb"};
  border-radius: 0.5rem;
  background: ${(props) => (props.$completed ? "#f0fdf4" : props.$active ? "#eff6ff" : "#f9fafb")};
  transition: all 0.2s ease;
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const StepContent = styled.div`
  margin-top: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin: 1rem 0;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{
	$variant?: "primary" | "secondary" | "success" | "danger";
}>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${(props) => {
		switch (props.$variant) {
			case "primary":
				return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
			case "secondary":
				return `
          background: #6b7280;
          color: white;
          &:hover { background: #4b5563; }
        `;
			case "success":
				return `
          background: #10b981;
          color: white;
          &:hover { background: #059669; }
        `;
			case "danger":
				return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; }
        `;
			default:
				return `
          background: #f3f4f6;
          color: #374151;
          &:hover { background: #e5e7eb; }
        `;
		}
	}}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusIndicator = styled.div<{
	$status: "pending" | "active" | "completed" | "error";
}>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  
  ${(props) => {
		switch (props.$status) {
			case "completed":
				return "background: #dcfce7; color: #166534;";
			case "active":
				return "background: #dbeafe; color: #1e40af;";
			case "error":
				return "background: #fef2f2; color: #dc2626;";
			default:
				return "background: #f3f4f6; color: #6b7280;";
		}
	}}
`;

const TokenDisplay = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 0.5rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
`;

const JWTBearerFlow: React.FC = () => {
	const { config } = useAuth();
	const [currentStep, setCurrentStep] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [jwtToken, setJwtToken] = useState("");
	const [accessToken, setAccessToken] = useState("");
	const [tokenResponse, setTokenResponse] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);

	// Step status tracking
	const [stepStatus, setStepStatus] = useState<
		Record<number, "pending" | "active" | "completed" | "error">
	>({
		1: "active",
		2: "pending",
		3: "pending",
		4: "pending",
	});

	const steps = [
		{
			id: 1,
			title: "Generate JWT Assertion",
			description:
				"Create a JWT token signed with your client secret to authenticate the request",
		},
		{
			id: 2,
			title: "Request Access Token",
			description:
				"Use the JWT assertion to request an access token from the token endpoint",
		},
		{
			id: 3,
			title: "Validate Token Response",
			description: "Verify the received access token and its properties",
		},
		{
			id: 4,
			title: "Use Access Token",
			description: "Use the access token to make authenticated API calls",
		},
	];

	// Generate JWT assertion
	const generateJWTAssertion = async (): Promise<string> => {
		if (!config?.clientId || !config?.clientSecret) {
			throw new Error("Client ID and Client Secret are required");
		}

		const now = Math.floor(Date.now() / 1000);
		const payload = {
			iss: config.clientId, // issuer
			sub: config.clientId, // subject
			aud: config.tokenEndpoint, // audience
			iat: now, // issued at
			exp: now + 300, // expires in 5 minutes
			jti: `jwt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // JWT ID
		};

		const header = {
			alg: "HS256",
			typ: "JWT",
		};

		// Encode header and payload
		const encodedHeader = btoa(JSON.stringify(header))
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=/g, "");
		const encodedPayload = btoa(JSON.stringify(payload))
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=/g, "");

		// Create signature
		const signatureInput = `${encodedHeader}.${encodedPayload}`;
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			"raw",
			encoder.encode(config.clientSecret),
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);

		const signature = await crypto.subtle.sign(
			"HMAC",
			key,
			encoder.encode(signatureInput),
		);
		const encodedSignature = btoa(
			String.fromCharCode(...new Uint8Array(signature)),
		)
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=/g, "");

		const jwt = `${signatureInput}.${encodedSignature}`;

		logger.info("JWTBearerFlow", "Generated JWT assertion", {
			header: JSON.stringify(header, null, 2),
			payload: JSON.stringify(payload, null, 2),
		});

		return jwt;
	};

	// Step 1: Generate JWT Assertion
	const handleGenerateJWT = async () => {
		try {
			setIsLoading(true);
			setError(null);

			logger.info("JWTBearerFlow", "Starting JWT assertion generation");

			const jwt = await generateJWTAssertion();
			setJwtToken(jwt);

			setStepStatus((prev) => ({ ...prev, 1: "completed", 2: "active" }));
			setCurrentStep(2);

			logger.info("JWTBearerFlow", "JWT assertion generated successfully");
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to generate JWT assertion";
			setError(errorMessage);
			setStepStatus((prev) => ({ ...prev, 1: "error" }));
			logger.error("JWTBearerFlow", "JWT generation failed", err);
		} finally {
			setIsLoading(false);
		}
	};

	// Step 2: Request Access Token
	const handleRequestToken = async () => {
		try {
			setIsLoading(true);
			setError(null);

			if (!jwtToken) {
				throw new Error("JWT assertion is required");
			}

			if (!config?.tokenEndpoint) {
				throw new Error("Token endpoint is not configured");
			}

			logger.info(
				"JWTBearerFlow",
				"Requesting access token with JWT assertion",
			);

			const body = new URLSearchParams({
				grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
				assertion: jwtToken,
				scope: config.scopes || "openid profile email",
			});

			const response = await fetch(config.tokenEndpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Accept: "application/json",
				},
				body: body.toString(),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(
					`Token request failed: ${response.status} ${errorText}`,
				);
			}

			const tokenData = await response.json();
			setTokenResponse(tokenData);
			setAccessToken(tokenData.access_token || "");

			setStepStatus((prev) => ({ ...prev, 2: "completed", 3: "active" }));
			setCurrentStep(3);

			logger.info("JWTBearerFlow", "Access token received successfully", {
				token_type: tokenData.token_type,
				expires_in: tokenData.expires_in,
				scope: tokenData.scope,
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to request access token";
			setError(errorMessage);
			setStepStatus((prev) => ({ ...prev, 2: "error" }));
			logger.error("JWTBearerFlow", "Token request failed", err);
		} finally {
			setIsLoading(false);
		}
	};

	// Step 3: Validate Token
	const handleValidateToken = async () => {
		try {
			setIsLoading(true);
			setError(null);

			if (!accessToken) {
				throw new Error("Access token is required");
			}

			logger.info("JWTBearerFlow", "Validating access token");

			// Basic token validation (check if it's a JWT)
			const parts = accessToken.split(".");
			if (parts.length !== 3) {
				throw new Error("Invalid JWT format");
			}

			// Decode header and payload for validation
			const header = JSON.parse(
				atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")),
			);
			const payload = JSON.parse(
				atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
			);

			// Check expiration
			const now = Math.floor(Date.now() / 1000);
			if (payload.exp && payload.exp < now) {
				throw new Error("Token has expired");
			}

			setStepStatus((prev) => ({ ...prev, 3: "completed", 4: "active" }));
			setCurrentStep(4);

			logger.info("JWTBearerFlow", "Token validation successful", {
				header,
				payload: {
					...payload,
					exp: new Date(payload.exp * 1000).toISOString(),
				},
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Token validation failed";
			setError(errorMessage);
			setStepStatus((prev) => ({ ...prev, 3: "error" }));
			logger.error("JWTBearerFlow", "Token validation failed", err);
		} finally {
			setIsLoading(false);
		}
	};

	// Step 4: Use Token
	const handleUseToken = async () => {
		try {
			setIsLoading(true);
			setError(null);

			if (!accessToken || !config?.userInfoEndpoint) {
				throw new Error("Access token and user info endpoint are required");
			}

			logger.info(
				"JWTBearerFlow",
				"Using access token to call user info endpoint",
			);

			const response = await fetch(config.userInfoEndpoint, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${accessToken}`,
					Accept: "application/json",
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`API call failed: ${response.status} ${errorText}`);
			}

			const userInfo = await response.json();

			setStepStatus((prev) => ({ ...prev, 4: "completed" }));

			logger.info("JWTBearerFlow", "Successfully used access token", {
				userInfo,
			});
			alert(
				"Success! Access token used successfully to retrieve user information.",
			);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to use access token";
			setError(errorMessage);
			setStepStatus((prev) => ({ ...prev, 4: "error" }));
			logger.error("JWTBearerFlow", "Token usage failed", err);
		} finally {
			setIsLoading(false);
		}
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		logger.info("JWTBearerFlow", `Copied ${label} to clipboard`);
	};

	const resetFlow = () => {
		setCurrentStep(1);
		setJwtToken("");
		setAccessToken("");
		setTokenResponse(null);
		setError(null);
		setStepStatus({
			1: "active",
			2: "pending",
			3: "pending",
			4: "pending",
		});
	};

	return (
		<Container>
			<PageTitle
				title="JWT Bearer Flow"
				subtitle="OAuth 2.0 JWT Bearer Token Grant Type"
				icon={<FiKey />}
			/>

			{/* Flow Overview */}
			<FlowSection>
				<CardHeader>
					<h2>Flow Overview</h2>
				</CardHeader>
				<CardBody>
					<SpecCard title="JWT Bearer Grant Type">
						<p>
							The JWT Bearer grant type allows a client to request an access
							token using a JWT assertion instead of traditional client
							credentials. This is useful for server-to-server authentication
							where the client can create and sign its own JWT tokens.
						</p>
						<h4>Key Benefits:</h4>
						<ul>
							<li>
								<strong>Stateless Authentication:</strong> No need to store
								client secrets on the server
							</li>
							<li>
								<strong>Self-Contained:</strong> JWT contains all necessary
								authentication information
							</li>
							<li>
								<strong>Time-Limited:</strong> Built-in expiration prevents
								replay attacks
							</li>
							<li>
								<strong>Standardized:</strong> RFC 7523 compliant implementation
							</li>
						</ul>
					</SpecCard>
				</CardBody>
			</FlowSection>

			{/* Error Display */}
			{error && (
				<FlowSection>
					<CardBody>
						<div
							style={{
								background: "#fef2f2",
								border: "1px solid #fecaca",
								borderRadius: "0.5rem",
								padding: "1rem",
								color: "#dc2626",
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
							}}
						>
							<FiAlertTriangle />
							<strong>Error:</strong> {error}
						</div>
					</CardBody>
				</FlowSection>
			)}

			{/* Step-by-Step Flow */}
			<FlowSection>
				<CardHeader>
					<h2>Step-by-Step Implementation</h2>
				</CardHeader>
				<CardBody>
					<StepContainer>
						{steps.map((step) => (
							<Step
								key={step.id}
								$active={currentStep === step.id}
								$completed={stepStatus[step.id] === "completed"}
							>
								<StepHeader>
									<StatusIndicator $status={stepStatus[step.id]}>
										{stepStatus[step.id] === "completed" && <FiCheckCircle />}
										{stepStatus[step.id] === "error" && <FiXCircle />}
										{stepStatus[step.id] === "active" && <FiClock />}
										{stepStatus[step.id] === "pending" && <FiInfo />}
										Step {step.id}: {step.title}
									</StatusIndicator>
								</StepHeader>
								<p>{step.description}</p>

								<StepContent>
									{step.id === 1 && (
										<div>
											<ButtonGroup>
												<ActionButton
													$variant="primary"
													onClick={handleGenerateJWT}
													disabled={isLoading}
												>
													<FiKey />
													Generate JWT Assertion
												</ActionButton>
											</ButtonGroup>
											{jwtToken && (
												<TokenSurface title="Generated JWT Assertion">
													<div
														style={{
															display: "flex",
															alignItems: "center",
															gap: "0.5rem",
															marginBottom: "0.5rem",
														}}
													>
														<strong>JWT Token:</strong>
														<ActionButton
															$variant="secondary"
															onClick={() =>
																copyToClipboard(jwtToken, "JWT assertion")
															}
														>
															<FiCopy />
															Copy
														</ActionButton>
													</div>
													<TokenDisplay>{jwtToken}</TokenDisplay>
												</TokenSurface>
											)}
										</div>
									)}

									{step.id === 2 && (
										<div>
											<ButtonGroup>
												<ActionButton
													$variant="primary"
													onClick={handleRequestToken}
													disabled={isLoading || !jwtToken}
												>
													<FiRefreshCw />
													Request Access Token
												</ActionButton>
											</ButtonGroup>
											{tokenResponse && (
												<TokenSurface title="Token Response">
													<pre>{JSON.stringify(tokenResponse, null, 2)}</pre>
												</TokenSurface>
											)}
										</div>
									)}

									{step.id === 3 && (
										<div>
											<ButtonGroup>
												<ActionButton
													$variant="primary"
													onClick={handleValidateToken}
													disabled={isLoading || !accessToken}
												>
													<FiShield />
													Validate Token
												</ActionButton>
											</ButtonGroup>
											{accessToken && (
												<TokenSurface title="Access Token">
													<div
														style={{
															display: "flex",
															alignItems: "center",
															gap: "0.5rem",
															marginBottom: "0.5rem",
														}}
													>
														<strong>Access Token:</strong>
														<ActionButton
															$variant="secondary"
															onClick={() =>
																copyToClipboard(accessToken, "access token")
															}
														>
															<FiCopy />
															Copy
														</ActionButton>
													</div>
													<TokenDisplay>{accessToken}</TokenDisplay>
												</TokenSurface>
											)}
										</div>
									)}

									{step.id === 4 && (
										<div>
											<ButtonGroup>
												<ActionButton
													$variant="primary"
													onClick={handleUseToken}
													disabled={isLoading || !accessToken}
												>
													<FiUser />
													Use Token (Call UserInfo)
												</ActionButton>
											</ButtonGroup>
										</div>
									)}
								</StepContent>
							</Step>
						))}
					</StepContainer>

					<ButtonGroup>
						<ActionButton $variant="secondary" onClick={resetFlow}>
							<FiRefreshCw />
							Reset Flow
						</ActionButton>
					</ButtonGroup>
				</CardBody>
			</FlowSection>

			{/* Technical Details */}
			<FlowSection>
				<CardHeader>
					<h2>Technical Implementation Details</h2>
				</CardHeader>
				<CardBody>
					<SpecCard title="JWT Assertion Structure">
						<p>The JWT assertion must contain the following claims:</p>
						<ul>
							<li>
								<strong>iss (issuer):</strong> Your client ID
							</li>
							<li>
								<strong>sub (subject):</strong> Your client ID
							</li>
							<li>
								<strong>aud (audience):</strong> The token endpoint URL
							</li>
							<li>
								<strong>iat (issued at):</strong> Current timestamp
							</li>
							<li>
								<strong>exp (expires):</strong> Expiration timestamp (typically
								5 minutes)
							</li>
							<li>
								<strong>jti (JWT ID):</strong> Unique identifier for this
								assertion
							</li>
						</ul>
					</SpecCard>

					<SpecCard title="Token Request Parameters">
						<p>When requesting the access token, use these parameters:</p>
						<ul>
							<li>
								<strong>grant_type:</strong>{" "}
								<code>urn:ietf:params:oauth:grant-type:jwt-bearer</code>
							</li>
							<li>
								<strong>assertion:</strong> The signed JWT token
							</li>
							<li>
								<strong>scope:</strong> Requested scopes (optional)
							</li>
						</ul>
					</SpecCard>

					<SpecCard title="Security Considerations">
						<ul>
							<li>
								<strong>Short Expiration:</strong> JWT assertions should expire
								quickly (5 minutes or less)
							</li>
							<li>
								<strong>Secure Storage:</strong> Keep client secrets secure and
								never expose them
							</li>
							<li>
								<strong>HTTPS Only:</strong> Always use HTTPS for token requests
							</li>
							<li>
								<strong>Clock Skew:</strong> Account for potential clock
								differences between client and server
							</li>
						</ul>
					</SpecCard>
				</CardBody>
			</FlowSection>
		</Container>
	);
};

export default JWTBearerFlow;
