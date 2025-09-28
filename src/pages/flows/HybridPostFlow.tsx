import type React from "react";
import { useCallback, useState } from "react";
import styled from "styled-components";
import FlowCredentials from "../../components/FlowCredentials";
import { StepByStepFlow } from "../../components/StepByStepFlow";
import { logger } from "../../utils/logger";
import { storeOAuthTokens } from "../../utils/tokenStorage";

const FlowContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const FlowTitle = styled.h1`
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const FlowDescription = styled.p`
  color: #6b7280;
  font-size: 1.125rem;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const PostForm = styled.form`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button<{ $variant: "primary" | "secondary" | "success" }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  
  ${({ $variant }) => {
		switch ($variant) {
			case "primary":
				return `
          background-color: #3b82f6;
          color: white;
          &:hover { background-color: #2563eb; }
        `;
			case "secondary":
				return `
          background-color: #6b7280;
          color: white;
          &:hover { background-color: #4b5563; }
        `;
			case "success":
				return `
          background-color: #10b981;
          color: white;
          &:hover { background-color: #059669; }
        `;
		}
	}}
`;

const CodeBlock = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 1rem 0;
`;

const ResponseContainer = styled.div`
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
`;

const ErrorContainer = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #991b1b;
`;

const InfoContainer = styled.div`
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 0.375rem;
  padding: 1rem;
  margin: 1rem 0;
  color: #1e40af;
`;

interface HybridPostFlowProps {
	credentials?: {
		clientId: string;
		clientSecret: string;
		redirectUri: string;
		environmentId: string;
	};
}

const HybridPostFlow: React.FC<HybridPostFlowProps> = ({ credentials }) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [demoStatus, setDemoStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");
	const [formData, setFormData] = useState({
		clientId: credentials?.clientId || "",
		clientSecret: credentials?.clientSecret || "",
		redirectUri: credentials?.redirectUri || "http://localhost:3000/callback",
		environmentId: credentials?.environmentId || "",
		responseType: "code id_token",
		scope: "openid profile email",
		state: "",
		nonce: "",
		codeChallenge: "",
		codeChallengeMethod: "S256",
		acrValues: "",
		prompt: "",
		maxAge: "",
		uiLocales: "",
		claims: "",
	});
	const [response, setResponse] = useState<Record<string, unknown> | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);

	const generateState = useCallback(() => {
		const state =
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15);
		setFormData((prev) => ({ ...prev, state }));
		return state;
	}, []);

	const generateNonce = useCallback(() => {
		const nonce =
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15);
		setFormData((prev) => ({ ...prev, nonce }));
		return nonce;
	}, []);

	const generateCodeChallenge = useCallback(() => {
		const codeVerifier =
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15);
		const codeChallenge = btoa(codeVerifier)
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=/g, "");
		setFormData((prev) => ({ ...prev, codeChallenge }));
		return { codeVerifier, codeChallenge };
	}, []);

	const steps = [
		{
			id: "step-1",
			title: "Configure Client Settings",
			description:
				"Set up your OAuth client for hybrid flow with POST requests.",
			code: `// Client Configuration for Hybrid Flow
const clientConfig = {
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  redirectUri: '${formData.redirectUri}',
  environmentId: '${formData.environmentId}',
  responseType: '${formData.responseType}',
  scope: '${formData.scope}'
};

console.log('Client configured for hybrid flow');`,
			execute: async () => {
				logger.info("HybridPostFlow", "Configuring client settings");
			},
		},
		{
			id: "step-2",
			title: "Generate PKCE Parameters",
			description:
				"Generate code verifier and code challenge for PKCE (Proof Key for Code Exchange).",
			code: `// Generate PKCE parameters
const codeVerifier = generateCodeVerifier();
const codeChallenge = generateCodeChallenge(codeVerifier);

// Store code verifier for later use
localStorage.setItem('pkce_code_verifier', codeVerifier);

console.log('Code Verifier:', codeVerifier);
console.log('Code Challenge:', codeChallenge);`,
			execute: async () => {
				logger.info("HybridPostFlow", "Generating PKCE parameters");
				generateCodeChallenge();
			},
		},
		{
			id: "step-3",
			title: "Generate State and Nonce",
			description:
				"Generate state parameter for CSRF protection and nonce for ID token validation.",
			code: `// Generate state and nonce
const state = generateState();
const nonce = generateNonce();

// Store state for validation
localStorage.setItem('oauth_state', state);
localStorage.setItem('oauth_nonce', nonce);

console.log('State:', state);
console.log('Nonce:', nonce);`,
			execute: async () => {
				logger.info("HybridPostFlow", "Generating state and nonce");
				generateState();
				generateNonce();
			},
		},
		{
			id: "step-4",
			title: "Create Authorization Request Form",
			description:
				"Build the POST form data for the hybrid authorization request.",
			code: `// Create form data for POST request
const formData = new FormData();
formData.append('client_id', '${formData.clientId}');
formData.append('response_type', '${formData.responseType}');
formData.append('redirect_uri', '${formData.redirectUri}');
formData.append('scope', '${formData.scope}');
formData.append('state', '${formData.state}');
formData.append('nonce', '${formData.nonce}');
formData.append('code_challenge', '${formData.codeChallenge}');
formData.append('code_challenge_method', '${formData.codeChallengeMethod}');
${formData.acrValues ? `formData.append('acr_values', '${formData.acrValues}');` : ""}
${formData.prompt ? `formData.append('prompt', '${formData.prompt}');` : ""}
${formData.maxAge ? `formData.append('max_age', '${formData.maxAge}');` : ""}
${formData.uiLocales ? `formData.append('ui_locales', '${formData.uiLocales}');` : ""}
${formData.claims ? `formData.append('claims', '${formData.claims}');` : ""}`,
			execute: async () => {
				logger.info("HybridPostFlow", "Creating authorization request form");
			},
		},
		{
			id: "step-5",
			title: "Submit Authorization Request",
			description: "Submit the POST request to the authorization endpoint.",
			code: `// Submit authorization request
const authUrl = \`https://auth.pingone.com/\${environmentId}/as/authorize\`;

try {
  const response = await fetch(authUrl, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });
  
  if (response.ok) {
    const result = await response.text();
    console.log('Authorization response:', result);
  } else {
    throw new Error(\`Authorization failed: \${response.status}\`);
  }
} catch (error) {
  console.error('Authorization error:', error);
}`,
			execute: async () => {
				logger.info("HybridPostFlow", "Submitting authorization request");
				setDemoStatus("loading");

				try {
					// Simulate POST request to authorization endpoint
					const authUrl = `https://auth.pingone.com/${formData.environmentId}/as/authorize`;

					const formDataObj = new FormData();
					formDataObj.append("client_id", formData.clientId);
					formDataObj.append("response_type", formData.responseType);
					formDataObj.append("redirect_uri", formData.redirectUri);
					formDataObj.append("scope", formData.scope);
					formDataObj.append("state", formData.state);
					formDataObj.append("nonce", formData.nonce);
					formDataObj.append("code_challenge", formData.codeChallenge);
					formDataObj.append(
						"code_challenge_method",
						formData.codeChallengeMethod,
					);

					if (formData.acrValues)
						formDataObj.append("acr_values", formData.acrValues);
					if (formData.prompt) formDataObj.append("prompt", formData.prompt);
					if (formData.maxAge) formDataObj.append("max_age", formData.maxAge);
					if (formData.uiLocales)
						formDataObj.append("ui_locales", formData.uiLocales);
					if (formData.claims) formDataObj.append("claims", formData.claims);

					// For demo purposes, simulate a successful response
					const mockResponse = {
						success: true,
						message: "Authorization request submitted successfully",
						authUrl: authUrl,
						formData: Object.fromEntries(formDataObj.entries()),
					};

					setResponse(mockResponse);
					setDemoStatus("success");
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					setError(errorMessage);
					setDemoStatus("error");
					throw error;
				}
			},
		},
		{
			id: "step-6",
			title: "Handle Hybrid Response",
			description:
				"Process both the authorization code and ID token from the callback.",
			code: `// Handle hybrid response
const urlParams = new URLSearchParams(window.location.search);
const hashParams = new URLSearchParams(window.location.hash.substring(1));

// Get parameters from both query and fragment
const code = urlParams.get('code');
const state = urlParams.get('state') || hashParams.get('state');
const idToken = hashParams.get('id_token');
const accessToken = hashParams.get('access_token');
const tokenType = hashParams.get('token_type');
const expiresIn = hashParams.get('expires_in');
const scope = hashParams.get('scope');

// Validate state parameter
const storedState = localStorage.getItem('oauth_state');
if (state !== storedState) {
  throw new Error('Invalid state parameter');
}

console.log('Authorization Code:', code);
console.log('ID Token:', idToken);
console.log('Access Token:', accessToken);
console.log('State validated:', state === storedState);`,
			execute: async () => {
				logger.info("HybridPostFlow", "Handling hybrid response");
			},
		},
		{
			id: "step-7",
			title: "Exchange Code for Tokens",
			description:
				"Exchange the authorization code for additional tokens if needed.",
			code: `// Exchange code for additional tokens (if needed)
const tokenUrl = \`https://auth.pingone.com/\${environmentId}/as/token\`;
const codeVerifier = localStorage.getItem('pkce_code_verifier');

const tokenData = new FormData();
tokenData.append('grant_type', 'authorization_code');
tokenData.append('code', code);
tokenData.append('redirect_uri', '${formData.redirectUri}');
tokenData.append('client_id', '${formData.clientId}');
tokenData.append('client_secret', '${formData.clientSecret}');
tokenData.append('code_verifier', codeVerifier);

try {
  const response = await fetch(tokenUrl, {
    method: 'POST',
    body: tokenData
  });
  
  if (response.ok) {
    const tokens = await response.json();
    console.log('Additional tokens received:', tokens);
  } else {
    throw new Error(\`Token exchange failed: \${response.status}\`);
  }
} catch (error) {
  console.error('Token exchange error:', error);
}`,
			execute: async () => {
				logger.info("HybridPostFlow", "Exchanging code for tokens");
			},
		},
		{
			id: "step-8",
			title: "Store All Tokens",
			description:
				"Store all received tokens (ID token, access token, and any additional tokens).",
			code: `// Store all tokens
const tokens = {
  access_token: accessToken || 'received_from_token_exchange',
  id_token: idToken,
  token_type: tokenType || 'Bearer',
  expires_in: parseInt(expiresIn) || 3600,
  scope: scope || '${formData.scope}',
  refresh_token: 'received_from_token_exchange' // If available
};

// Store using standardized method
localStorage.setItem('oauth_tokens', JSON.stringify(tokens));

console.log('All tokens stored successfully:', tokens);`,
			execute: async () => {
				logger.info("HybridPostFlow", "Storing all tokens");

				try {
					// Simulate token storage
					const mockTokens = {
						access_token: `mock_access_token_${Date.now()}`,
						id_token: `mock_id_token_${Date.now()}`,
						token_type: "Bearer",
						expires_in: 3600,
						scope: formData.scope,
						refresh_token: `mock_refresh_token_${Date.now()}`,
					};

					// Store tokens using the standardized method
					const success = storeOAuthTokens(
						mockTokens,
						"hybrid",
						"Hybrid POST Flow",
					);

					if (success) {
						setResponse({
							tokens: mockTokens,
							message: "All tokens stored successfully",
						});
					} else {
						throw new Error("Failed to store tokens");
					}
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					setError(errorMessage);
					throw error;
				}
			},
		},
	];

	const handleStepChange = useCallback((step: number) => {
		setCurrentStep(step);
		setDemoStatus("idle");
		setResponse(null);
		setError(null);
	}, []);

	const handleStepResult = useCallback((step: number, result: unknown) => {
		logger.info("HybridPostFlow", `Step ${step + 1} completed`, result as any);
	}, []);

	return (
		<FlowContainer>
			<FlowTitle>Hybrid Flow (POST)</FlowTitle>
			<FlowDescription>
				This flow demonstrates the Hybrid flow using POST requests. The Hybrid
				flow combines elements of both Authorization Code and Implicit flows,
				allowing you to receive both an authorization code and an ID token in
				the initial response.
			</FlowDescription>

			<InfoContainer>
				<h4> Hybrid Flow Benefits</h4>
				<p>
					The Hybrid flow provides the best of both worlds: you get an ID token
					immediately (like Implicit flow) and an authorization code for
					additional token requests (like Authorization Code flow). This is
					particularly useful for applications that need immediate user
					information while maintaining the ability to request additional
					tokens.
				</p>
			</InfoContainer>

			<FlowCredentials
				flowType="hybrid-post"
				onCredentialsChange={(newCredentials) => {
					setFormData((prev) => ({
						...prev,
						clientId: newCredentials.clientId || prev.clientId,
						clientSecret: newCredentials.clientSecret || prev.clientSecret,
						redirectUri: newCredentials.redirectUri || prev.redirectUri,
						environmentId: newCredentials.environmentId || prev.environmentId,
					}));
				}}
			/>

			<StepByStepFlow
				steps={steps}
				currentStep={currentStep}
				onStepChange={handleStepChange}
				onStepResult={handleStepResult}
				onStart={() => setDemoStatus("loading")}
				onReset={() => {
					setCurrentStep(0);
					setDemoStatus("idle");
					setResponse(null);
					setError(null);
				}}
				status={demoStatus}
				disabled={demoStatus === "loading"}
				title="Hybrid POST Flow Steps"
			/>

			{response && (
				<ResponseContainer>
					<h4>Response:</h4>
					<CodeBlock>{JSON.stringify(response, null, 2)}</CodeBlock>
				</ResponseContainer>
			)}

			{error && (
				<ErrorContainer>
					<h4>Error:</h4>
					<p>{error}</p>
				</ErrorContainer>
			)}

			<PostForm>
				<h3>Manual Form Submission</h3>
				<p>
					You can also manually submit the authorization request using the form
					below:
				</p>

				<FormGroup>
					<Label>Client ID</Label>
					<Input
						type="text"
						value={formData.clientId}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, clientId: e.target.value }))
						}
					/>
				</FormGroup>

				<FormGroup>
					<Label>Response Type</Label>
					<Select
						value={formData.responseType}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, responseType: e.target.value }))
						}
					>
						<option value="code id_token">code id_token</option>
						<option value="code token">code token</option>
						<option value="code token id_token">code token id_token</option>
					</Select>
				</FormGroup>

				<FormGroup>
					<Label>Redirect URI</Label>
					<Input
						type="url"
						value={formData.redirectUri}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, redirectUri: e.target.value }))
						}
					/>
				</FormGroup>

				<FormGroup>
					<Label>Scope</Label>
					<Input
						type="text"
						value={formData.scope}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, scope: e.target.value }))
						}
					/>
				</FormGroup>

				<FormGroup>
					<Label>State</Label>
					<Input
						type="text"
						value={formData.state}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, state: e.target.value }))
						}
					/>
				</FormGroup>

				<FormGroup>
					<Label>Code Challenge</Label>
					<Input
						type="text"
						value={formData.codeChallenge}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								codeChallenge: e.target.value,
							}))
						}
					/>
				</FormGroup>

				<Button $variant="primary" type="submit">
					Submit Authorization Request
				</Button>
			</PostForm>
		</FlowContainer>
	);
};

export default HybridPostFlow;
