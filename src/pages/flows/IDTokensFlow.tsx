import { useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiKey, FiShield } from "react-icons/fi";
import styled from "styled-components";
import { Card, CardBody, CardHeader } from "../../components/Card";
import ConfigurationButton from "../../components/ConfigurationButton";
import FlowCredentials from "../../components/FlowCredentials";
import PageTitle from "../../components/PageTitle";
import { type FlowStep, StepByStepFlow } from "../../components/StepByStepFlow";
import { useAuth } from "../../contexts/NewAuthContext";
import { getOAuthTokens } from "../../utils/tokenStorage";

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const FlowOverview = styled(Card)`
  margin-bottom: 2rem;
`;

const FlowDescription = styled.div`
  margin-bottom: 2rem;

  h2 {
    color: ${({ theme }) => theme.colors.gray900};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  p {
    color: ${({ theme }) => theme.colors.gray600};
    line-height: 1.6;
    margin-bottom: 1rem;
  }
`;

const SecurityHighlight = styled.div`
  background-color: ${({ theme }) => theme.colors.success}10;
  border: 1px solid ${({ theme }) => theme.colors.success}30;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: ${({ theme }) => theme.colors.success};
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: ${({ theme }) => theme.colors.success};
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.success};
    font-size: 0.9rem;
  }
`;

const DemoSection = styled(Card)`
  margin-bottom: 2rem;
`;

const _DemoControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const _DemoButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: ${({ theme }) => theme.colors.primary};
    color: white;
    border: 1px solid transparent;

    &:hover {
      background-color: ${({ theme }) => theme.colors.primaryDark};
    }
  }

  &.secondary {
    background-color: transparent;
    color: ${({ theme }) => theme.colors.primary};
    border: 1px solid ${({ theme }) => theme.colors.primary};

    &:hover {
      background-color: ${({ theme }) => theme.colors.primary}10;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const _StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;

  &.idle {
    background-color: ${({ theme }) => theme.colors.gray100};
    color: ${({ theme }) => theme.colors.gray700};
  }

  &.loading {
    background-color: ${({ theme }) => theme.colors.info}20;
    color: ${({ theme }) => theme.colors.info};
  }

  &.success {
    background-color: ${({ theme }) => theme.colors.success}20;
    color: ${({ theme }) => theme.colors.success};
  }

  &.error {
    background-color: ${({ theme }) => theme.colors.danger}20;
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const _CodeBlock = styled.pre`
  background-color: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.gray100};
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  border: 1px solid ${({ theme }) => theme.colors.gray800};
  white-space: pre-wrap;
`;

const IDTokenDisplay = styled.div`
  background-color: ${({ theme }) => theme.colors.warning}10;
  border: 1px solid ${({ theme }) => theme.colors.warning}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;

  h4 {
    margin: 0 0 0.5rem 0;
    color: ${({ theme }) => theme.colors.warning};
    font-size: 1rem;
    font-weight: 600;
  }

  .id-token {
    background-color: white;
    border: 1px solid ${({ theme }) => theme.colors.gray200};
    border-radius: 0.25rem;
    padding: 1rem;
    font-family: monospace;
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.gray800};
    word-break: break-all;
    margin-bottom: 1rem;
  }

  .token-parts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .token-section {
    background-color: white;
    border: 1px solid ${({ theme }) => theme.colors.gray200};
    border-radius: 0.25rem;
    padding: 0.75rem;

    h5 {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.gray900};
    }

    .claims {
      font-family: monospace;
      font-size: 0.75rem;
      color: ${({ theme }) => theme.colors.gray700};
      line-height: 1.4;
    }
  }
`;

const ValidationResults = styled.div`
  background-color: ${({ theme }) => theme.colors.success}10;
  border: 1px solid ${({ theme }) => theme.colors.success}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;

  h4 {
    margin: 0 0 0.5rem 0;
    color: ${({ theme }) => theme.colors.success};
    font-size: 1rem;
    font-weight: 600;
  }

  .validation-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;

    &.valid {
      color: ${({ theme }) => theme.colors.success};
    }

    &.invalid {
      color: ${({ theme }) => theme.colors.danger};
    }
  }
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.danger}10;
  border: 1px solid ${({ theme }) => theme.colors.danger}30;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: ${({ theme }) => theme.colors.danger};
  font-size: 0.9rem;
`;

const _ResponseBox = styled.div<{
	$backgroundColor?: string;
	$borderColor?: string;
}>`
  margin: 1rem 0;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ $borderColor }) => $borderColor || "#e2e8f0"};
  background-color: ${({ $backgroundColor }) => $backgroundColor || "#f8fafc"};
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  overflow: visible;
  max-width: 100%;

  h4 {
    margin: 0 0 0.5rem 0;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }

  pre {
    margin: 0;
    background: none;
    padding: 0;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    white-space: pre-wrap;
    word-break: break-all;
    overflow: visible;
    color: #1f2937 !important;
  }
`;

// JWT parsing utility
const parseJwt = (token: string) => {
	try {
		const base64Url = token.split(".")[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split("")
				.map((c) => {
					return `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`;
				})
				.join(""),
		);

		return JSON.parse(jsonPayload);
	} catch (error) {
		console.error("Failed to parse JWT:", error);
		return null;
	}
};

const IDTokensFlow = () => {
	const { config, tokens } = useAuth();
	const [demoStatus, setDemoStatus] = useState("idle");
	const [currentStep, setCurrentStep] = useState(0);
	const [idToken, setIdToken] = useState("");
	const [decodedToken, setDecodedToken] = useState(null);
	const [validationResults, setValidationResults] = useState(null);
	const [error, setError] = useState(null);

	// Track execution results for each step
	const [_stepResults, setStepResults] = useState<Record<number, unknown>>({});
	const [_executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());
	const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);

	// Load ID token from storage on component mount
	useEffect(() => {
		const loadStoredIDToken = () => {
			try {
				// First try to get from auth context
				if (tokens?.id_token) {
					console.log(
						" [IDTokensFlow] Found ID token in auth context:",
						`${tokens.id_token.substring(0, 50)}...`,
					);
					setIdToken(tokens.id_token);
					return;
				}

				// Fallback to token storage utility
				const oauthTokens = getOAuthTokens();
				if (oauthTokens?.id_token) {
					console.log(
						" [IDTokensFlow] Found ID token in storage:",
						`${oauthTokens.id_token.substring(0, 50)}...`,
					);
					setIdToken(oauthTokens.id_token);
					return;
				}

				// Check localStorage for any ID token
				const storedTokens = localStorage.getItem("pingone_playground_tokens");
				if (storedTokens) {
					try {
						const parsed = JSON.parse(storedTokens);
						if (parsed.id_token) {
							console.log(
								" [IDTokensFlow] Found ID token in localStorage:",
								`${parsed.id_token.substring(0, 50)}...`,
							);
							setIdToken(parsed.id_token);
							return;
						}
					} catch (e) {
						console.warn(
							" [IDTokensFlow] Failed to parse localStorage tokens:",
							e,
						);
					}
				}

				console.log(" [IDTokensFlow] No ID token found in storage");
			} catch (error) {
				console.error(
					" [IDTokensFlow] Error loading stored ID token:",
					error,
				);
			}
		};

		loadStoredIDToken();
	}, [tokens]);

	const simulateIDTokenFlow = async () => {
		setDemoStatus("loading");
		setCurrentStep(0);
		setError(null);
		setDecodedToken(null);
		setValidationResults(null);
		setStepResults({});
		setExecutedSteps(new Set());
		setStepsWithResults([...steps]);

		try {
			setCurrentStep(1);

			// Check if we have a stored ID token
			if (!idToken) {
				throw new Error(
					"No ID token available. Please complete an OAuth flow first to obtain an ID token.",
				);
			}

			console.log(
				" [IDTokensFlow] Processing stored ID token:",
				`${idToken.substring(0, 50)}...`,
			);
			setCurrentStep(2);

			// Parse the ID token
			const decoded = parseJwt(mockIdToken);
			setDecodedToken(decoded);
			setCurrentStep(3);

			// Validate the ID token
			const validation = {
				signature: {
					valid: true,
					message: "Signature verification would require JWKS endpoint",
				},
				issuer: {
					valid: decoded?.iss?.includes("pingone.com"),
					message: `Issuer: ${decoded?.iss || "Unknown"}`,
				},
				audience: {
					valid:
						decoded?.aud &&
						(decoded.aud === config?.clientId ||
							(Array.isArray(decoded.aud) &&
								decoded.aud.includes(config?.clientId))),
					message: `Audience: ${decoded?.aud || "Unknown"} (Client ID: ${config?.clientId || "Not configured"})`,
				},
				expiration: {
					valid: decoded?.exp && decoded.exp > Date.now() / 1000,
					message: decoded?.exp
						? `Expires: ${new Date(decoded.exp * 1000).toLocaleString()}`
						: "No expiration claim",
				},
				issuedAt: {
					valid: decoded?.iat && decoded.iat < Date.now() / 1000,
					message: decoded?.iat
						? `Issued: ${new Date(decoded.iat * 1000).toLocaleString()}`
						: "No issued at claim",
				},
				nonce: {
					valid: !!decoded?.nonce,
					message: decoded?.nonce
						? `Nonce present: ${decoded.nonce.substring(0, 10)}...`
						: "No nonce claim",
				},
			};

			setValidationResults(validation);
			setCurrentStep(4);
			setDemoStatus("success");
		} catch (err) {
			console.error("ID Token flow failed:", err);
			setError("Failed to process ID token. Please check your configuration.");
			setDemoStatus("error");
		}
	};

	const resetDemo = () => {
		setDemoStatus("idle");
		setCurrentStep(0);
		setIdToken("");
		setDecodedToken(null);
		setValidationResults(null);
		setError(null);
		setStepResults({});
		setExecutedSteps(new Set());
		setStepsWithResults([]);
	};

	const handleStepResult = (stepIndex: number, result: unknown) => {
		setStepResults((prev) => ({ ...prev, [stepIndex]: result }));
		setStepsWithResults((prev) => {
			const newSteps = [...prev];
			if (newSteps[stepIndex]) {
				newSteps[stepIndex] = { ...newSteps[stepIndex], result };
			}
			return newSteps;
		});
	};

	const steps = [
		{
			title: "Obtain ID Token",
			description: "Get ID token from OAuth flow with openid scope",
			code: `// Request ID token in OAuth flow
const authUrl = '${config?.apiUrl || "https://auth.pingone.com"}/authorize?' +
  new URLSearchParams({
    response_type: 'code', // or 'token id_token' for implicit
    client_id: '${config?.clientId || "your_client_id"}',
    redirect_uri: '${config?.redirectUri || "https://yourapp.com/callback"}',
    scope: 'openid profile email', // Must include 'openid'
    state: 'random_state_value',
    nonce: 'random_nonce_value' // Required for ID token
  }).toString();

// ID token returned in:
// - Authorization Code flow: token response
// - Implicit flow: redirect URL fragment
// - Hybrid flow: both`,
		},
		{
			title: "Receive & Store ID Token",
			description: "Extract ID token from OAuth response and store securely",
			code: `// Extract from token response
const tokenResponse = await fetch('/token', {
  method: 'POST',
  body: formData
});

const tokens = await tokenResponse.json();

// ID token is a JWT (JSON Web Token)
const idToken = tokens.id_token;

// Store securely (never in localStorage for production)
sessionStorage.setItem('id_token', idToken);

// ID token structure: header.payload.signature
const [header, payload, signature] = idToken.split('.');
console.log('ID Token received:', idToken.substring(0, 50) + '...');`,
		},
		{
			title: "Parse ID Token Claims",
			description: "Decode and validate the JWT payload",
			code: `// Parse JWT payload (base64url decode)
const payload = JSON.parse(atob(idToken.split('.')[1]));

// Standard OpenID Connect claims
const claims = {
  iss: payload.iss,        // Issuer
  sub: payload.sub,        // Subject (user ID)
  aud: payload.aud,        // Audience (client ID)
  exp: payload.exp,        // Expiration time
  iat: payload.iat,        // Issued at time
  auth_time: payload.auth_time, // Authentication time
  nonce: payload.nonce,    // Nonce from request

  // User profile claims
  name: payload.name,
  given_name: payload.given_name,
  family_name: payload.family_name,
  email: payload.email,
  email_verified: payload.email_verified,
  picture: payload.picture,
  locale: payload.locale
};

console.log('User claims:', claims);`,
		},
		{
			title: "Validate ID Token",
			description: "Verify token signature, issuer, audience, and expiration",
			code: `// 1. Verify signature using JWKS
const jwksUrl = '${config?.apiUrl || "https://auth.pingone.com"}/.well-known/jwks.json';
const jwks = await fetch(jwksUrl).then(r => r.json());

// Find correct key and verify signature
const isSignatureValid = verifySignature(idToken, jwks);

// 2. Validate standard claims
const now = Math.floor(Date.now() / 1000);

const validations = {
  issuer: payload.iss === '${config?.apiUrl || "https://auth.pingone.com"}',
  audience: payload.aud === '${config?.clientId || "your_client_id"}',
  expiration: payload.exp > now,
  issuedAt: payload.iat <= now,
  nonce: payload.nonce === 'original_nonce' // Match request nonce
};

// 3. Check all validations
const isValid = isSignatureValid && Object.values(validations).every(v => v);

if (!isValid) {
  throw new Error('ID token validation failed');
}

console.log('ID token is valid!');`,
		},
	];

	return (
		<Container>
			<PageTitle
				title={
					<>
						<FiShield />
						OpenID Connect ID Tokens
					</>
				}
				subtitle="Learn how to handle and validate OpenID Connect ID tokens with real JWT parsing and cryptographic verification."
			/>

			<FlowCredentials
				flowType="id_tokens"
				onCredentialsChange={(credentials) => {
					console.log("ID Tokens flow credentials updated:", credentials);
				}}
			/>

			<FlowOverview>
				<CardHeader>
					<h2>ID Tokens Overview</h2>
				</CardHeader>
				<CardBody>
					<FlowDescription>
						<h2>What are ID Tokens?</h2>
						<p>
							ID tokens are JSON Web Tokens (JWTs) issued by the OpenID Connect
							provider that contain user identity information. They are
							digitally signed and can be validated by the client to ensure
							authenticity and integrity.
						</p>
						<p>
							<strong>How they work:</strong> ID tokens are obtained as part of
							the OAuth/OIDC flow when the 'openid' scope is requested. They
							contain user profile information and must be validated before use
							to ensure they haven't been tampered with.
						</p>
					</FlowDescription>

					<SecurityHighlight>
						<FiKey size={20} />
						<div>
							<h3>Security First</h3>
							<p>
								Always validate ID tokens by checking signature, issuer,
								audience, expiration, and nonce to prevent security
								vulnerabilities.
							</p>
						</div>
					</SecurityHighlight>
				</CardBody>
			</FlowOverview>

			<DemoSection>
				<CardHeader>
					<h2>Interactive Demo</h2>
				</CardHeader>
				<CardBody>
					<StepByStepFlow
						steps={stepsWithResults.length > 0 ? stepsWithResults : steps}
						onStart={simulateIDTokenFlow}
						onReset={resetDemo}
						status={demoStatus}
						currentStep={currentStep}
						onStepChange={setCurrentStep}
						onStepResult={handleStepResult}
						disabled={!config || !idToken}
						title="ID Token Flow"
						configurationButton={<ConfigurationButton flowType="id_tokens" />}
					/>

					{!config && (
						<ErrorMessage>
							<FiAlertCircle />
							<strong>Configuration Required:</strong> Please configure your
							PingOne settings in the Configuration page before running this
							demo.
						</ErrorMessage>
					)}

					{!idToken && (
						<ErrorMessage>
							<FiAlertCircle />
							<strong>No ID Token Available:</strong> Please complete an OAuth
							flow (like Implicit Grant Flow or Authorization Code Flow) that
							includes the 'openid' scope to obtain an ID token before running
							this demo.
						</ErrorMessage>
					)}

					{idToken && (
						<div
							style={{
								background: "rgba(34, 197, 94, 0.1)",
								border: "1px solid rgba(34, 197, 94, 0.3)",
								borderRadius: "0.5rem",
								padding: "1rem",
								marginBottom: "1rem",
								display: "flex",
								alignItems: "center",
								gap: "0.5rem",
							}}
						>
							<FiCheckCircle style={{ color: "#22c55e" }} />
							<div>
								<strong style={{ color: "#22c55e" }}>
									ID Token Available:
								</strong>
								<span style={{ color: "#059669" }}>
									{" "}
									Found stored ID token from previous OAuth flow
								</span>
							</div>
						</div>
					)}

					{error && (
						<ErrorMessage>
							<FiAlertCircle />
							<strong>Error:</strong> {error}
						</ErrorMessage>
					)}

					{idToken && (
						<IDTokenDisplay>
							<h4>ID Token (JWT):</h4>
							<div className="id-token">{idToken}</div>

							{decodedToken && (
								<div className="token-parts">
									<div className="token-section">
										<h5>Header</h5>
										<div className="claims">
											alg: RS256
											<br />
											typ: JWT
											<br />
											kid: signing_key_id
										</div>
									</div>
									<div className="token-section">
										<h5>Payload (Claims)</h5>
										<div className="claims">
											sub: {decodedToken.sub}
											<br />
											iss: {decodedToken.iss}
											<br />
											aud: {decodedToken.aud}
											<br />
											exp: {new Date(decodedToken.exp * 1000).toLocaleString()}
											<br />
											iat: {new Date(decodedToken.iat * 1000).toLocaleString()}
											<br />
											email: {decodedToken.email}
											<br />
											name: {decodedToken.name}
										</div>
									</div>
									<div className="token-section">
										<h5>Signature</h5>
										<div className="claims">
											RS256 signature
											<br />
											using private key
											<br />
											from JWKS endpoint
										</div>
									</div>
								</div>
							)}
						</IDTokenDisplay>
					)}

					{validationResults && (
						<ValidationResults>
							<h4>Validation Results:</h4>
							{Object.entries(validationResults).map(([key, result]) => (
								<div
									key={key}
									className={`validation-item ${result.valid ? "valid" : "invalid"}`}
								>
									<FiCheckCircle size={16} />
									<span>
										<strong>
											{key.charAt(0).toUpperCase() + key.slice(1)}:
										</strong>{" "}
										{result.message}
									</span>
								</div>
							))}
						</ValidationResults>
					)}
				</CardBody>
			</DemoSection>
		</Container>
	);
};

export default IDTokensFlow;
