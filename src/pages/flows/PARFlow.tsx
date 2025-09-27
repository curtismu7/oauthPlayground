import type React from "react";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import FlowCredentials from "../../components/FlowCredentials";
import { StepByStepFlow } from "../../components/StepByStepFlow";
import {
  type PARAuthMethod,
  type PARRequest,
  type PARResponse,
  PARService,
} from "../../services/parService";
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

const FormContainer = styled.div`
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

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  min-height: 100px;
  resize: vertical;
  
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

const Button = styled.button<{ $variant: "primary" | "secondary" | "success" | "danger" }>`
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
      case "danger":
        return `
          background-color: #ef4444;
          color: white;
          &:hover { background-color: #dc2626; }
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

const PARContainer = styled.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
`;

const PARTitle = styled.h4`
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
  font-weight: 600;
`;

const PARDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const PARDetail = styled.div`
  display: flex;
  flex-direction: column;
`;

const PARLabel = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const PARValue = styled.span`
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
  word-break: break-all;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${({ $active }) => ($active ? "#3b82f6" : "transparent")};
  color: ${({ $active }) => ($active ? "#3b82f6" : "#6b7280")};
  
  &:hover {
    color: #3b82f6;
  }
`;

interface PARFlowProps {
  credentials?: {
    clientId: string;
    clientSecret: string;
    environmentId: string;
  };
}

const PARFlow: React.FC<PARFlowProps> = ({ credentials }) => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [currentStep, setCurrentStep] = useState(0);
  const [demoStatus, setDemoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [activeAuthMethod, setActiveAuthMethod] = useState<PARAuthMethod["type"]>("NONE");
  const [formData, setFormData] = useState({
    clientId: credentials?.clientId || "",
    clientSecret: credentials?.clientSecret || "",
    environmentId: credentials?.environmentId || "",
    responseType: "code",
    redirectUri: "http://localhost:3000/callback",
    scope: "openid profile email",
    state: "",
    nonce: "",
    codeChallenge: "",
    codeChallengeMethod: "S256",
    acrValues: "",
    prompt: "consent",
    maxAge: "3600",
    uiLocales: "en",
    claims: '{"userinfo": {"email": null, "phone_number": null}}',
    privateKey: "",
    keyId: "",
    jwksUri: "",
  });
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parResponse, setParResponse] = useState<PARResponse | null>(null);
  const [parService] = useState(() => new PARService(formData.environmentId));

  const generateState = useCallback(() => {
    const state =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setFormData((prev) => ({ ...prev, state }));
    return state;
  }, []);

  const generateNonce = useCallback(() => {
    const nonce =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setFormData((prev) => ({ ...prev, nonce }));
    return nonce;
  }, []);

  const generateCodeChallenge = useCallback(() => {
    const codeVerifier =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
      title: "Configure PAR Settings",
      description: "Set up your OAuth client for Pushed Authorization Request.",
      code: `// PAR Configuration
const parConfig = {
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  environmentId: '${formData.environmentId}',
  responseType: '${formData.responseType}',
  redirectUri: '${formData.redirectUri}',
  scope: '${formData.scope}',
  state: '${formData.state}',
  nonce: '${formData.nonce}',
  codeChallenge: '${formData.codeChallenge}',
  codeChallengeMethod: '${formData.codeChallengeMethod}',
  acrValues: '${formData.acrValues}',
  prompt: '${formData.prompt}',
  maxAge: ${formData.maxAge},
  uiLocales: '${formData.uiLocales}',
  claims: ${formData.claims},
  authMethod: '${activeAuthMethod}'
};

console.log('PAR configured:', parConfig);`,
      execute: async () => {
        logger.info("PARFlow", "Configuring PAR settings");
        generateState();
        generateNonce();
        generateCodeChallenge();
      },
    },
    {
      id: "step-2",
      title: `Generate PAR Request (${activeAuthMethod})`,
      description: `Generate a Pushed Authorization Request using ${activeAuthMethod} authentication.`,
      code: `// Generate PAR Request
const parRequest: PARRequest = {
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  environmentId: '${formData.environmentId}',
  responseType: '${formData.responseType}',
  redirectUri: '${formData.redirectUri}',
  scope: '${formData.scope}',
  state: '${formData.state}',
  nonce: '${formData.nonce}',
  codeChallenge: '${formData.codeChallenge}',
  codeChallengeMethod: '${formData.codeChallengeMethod}',
  acrValues: '${formData.acrValues}',
  prompt: '${formData.prompt}',
  maxAge: '${formData.maxAge}',
  uiLocales: '${formData.uiLocales}',
  claims: '${formData.claims}'
};

const authMethod: PARAuthMethod = {
  type: '${activeAuthMethod}',
  clientId: '${formData.clientId}',
  clientSecret: '${formData.clientSecret}',
  privateKey: '${formData.privateKey}',
  keyId: '${formData.keyId}',
  jwksUri: '${formData.jwksUri}'
};

const parService = new PARService('${formData.environmentId}');
const parResponse = await parService.generatePARRequest(parRequest, authMethod);
console.log('PAR Response:', parResponse);`,
      execute: async () => {
        logger.info("PARFlow", "Generating PAR request", { authMethod: activeAuthMethod });
        setDemoStatus("loading");

        try {
          const _parRequest: PARRequest = {
            clientId: formData.clientId,
            clientSecret: formData.clientSecret,
            environmentId: formData.environmentId,
            responseType: formData.responseType,
            redirectUri: formData.redirectUri,
            scope: formData.scope,
            state: formData.state,
            nonce: formData.nonce,
            codeChallenge: formData.codeChallenge,
            codeChallengeMethod: formData.codeChallengeMethod,
            acrValues: formData.acrValues,
            prompt: formData.prompt,
            maxAge: formData.maxAge,
            uiLocales: formData.uiLocales,
            claims: formData.claims,
          };

          const _authMethod: PARAuthMethod = {
            type: activeAuthMethod,
            clientId: formData.clientId,
            clientSecret: formData.clientSecret,
            privateKey: formData.privateKey,
            keyId: formData.keyId,
            jwksUri: formData.jwksUri,
          };

          // Simulate PAR request
          const mockParResponse: PARResponse = {
            requestUri: `urn:ietf:params:oauth:request_uri:${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            expiresIn: 600,
            expiresAt: Date.now() + 600000,
          };

          setParResponse(mockParResponse);
          setResponse({
            success: true,
            message: "PAR request generated successfully",
            parResponse: mockParResponse,
            authMethod: activeAuthMethod,
          });
          setDemoStatus("success");
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          setError(errorMessage);
          setDemoStatus("error");
          throw error;
        }
      },
    },
    {
      id: "step-3",
      title: "Generate Authorization URL",
      description: "Generate the authorization URL using the request URI from PAR.",
      code: `// Generate Authorization URL with Request URI
const authorizationUrl = parService.generateAuthorizationURL(
  '${parResponse?.requestUri || "urn:ietf:params:oauth:request_uri:example"}',
  {
    // Additional parameters can be added here
    // client_id: '${formData.clientId}',
    // response_type: '${formData.responseType}'
  }
);

console.log('Authorization URL:', authorizationUrl);

// Redirect to authorization URL
window.location.href = authorizationUrl;`,
      execute: async () => {
        logger.info("PARFlow", "Generating authorization URL");

        if (parResponse) {
          const authUrl = parService.generateAuthorizationURL(parResponse.requestUri);
          setResponse((prev) => ({
            ...prev,
            authorizationUrl: authUrl,
            message: "Authorization URL generated successfully",
          }));
        }
      },
    },
    {
      id: "step-4",
      title: "Handle Authorization Response",
      description: "Process the response from the authorization endpoint.",
      code: `// Handle Authorization Response
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');
const error = urlParams.get('error');
const errorDescription = urlParams.get('error_description');

// Validate state parameter
const storedState = localStorage.getItem('oauth_state');
if (state !== storedState) {
  throw new Error('Invalid state parameter');
}

if (error) {
  console.error('Authorization error:', error, errorDescription);
  throw new Error(\`Authorization failed: \${error}\`);
}

console.log('Authorization successful, code:', code);
console.log('State validated:', state === storedState);`,
      execute: async () => {
        logger.info("PARFlow", "Handling authorization response");
      },
    },
    {
      id: "step-5",
      title: "Exchange Code for Tokens",
      description: "Exchange the authorization code for access and ID tokens.",
      code: `// Exchange authorization code for tokens
const tokenUrl = \`https://auth.pingone.com/\${environmentId}/as/token\`;

const tokenData = new FormData();
tokenData.append('grant_type', 'authorization_code');
tokenData.append('code', code);
tokenData.append('redirect_uri', '${formData.redirectUri}');
tokenData.append('client_id', '${formData.clientId}');
tokenData.append('client_secret', '${formData.clientSecret}');

const tokenResponse = await fetch(tokenUrl, {
  method: 'POST',
  body: tokenData
});

if (tokenResponse.ok) {
  const tokens = await tokenResponse.json();
  console.log('Tokens received:', tokens);
  
  // Store tokens
  localStorage.setItem('oauth_tokens', JSON.stringify(tokens));
}`,
      execute: async () => {
        logger.info("PARFlow", "Exchanging code for tokens");

        try {
          // Simulate token exchange
          const mockTokens = {
            access_token: `mock_access_token_${Date.now()}`,
            id_token: `mock_id_token_${Date.now()}`,
            token_type: "Bearer",
            expires_in: 3600,
            scope: formData.scope,
            refresh_token: `mock_refresh_token_${Date.now()}`,
            par_used: true,
            auth_method: activeAuthMethod,
          };

          // Store tokens using the standardized method
          const success = storeOAuthTokens(mockTokens, "par", `PAR Flow (${activeAuthMethod})`);

          if (success) {
            setResponse((prev) => ({ ...prev, tokens: mockTokens }));
          } else {
            throw new Error("Failed to store tokens");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
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
    logger.info("PARFlow", `Step ${step + 1} completed`, result);
  }, []);

  const handlePARStart = async () => {
    try {
      setDemoStatus("loading");
      setError(null);

      const mockParResponse: PARResponse = {
        requestUri: `urn:ietf:params:oauth:request_uri:${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        expiresIn: 600,
        expiresAt: Date.now() + 600000,
      };

      setParResponse(mockParResponse);
      setResponse({
        success: true,
        message: "PAR request generated successfully",
        parResponse: mockParResponse,
        authMethod: activeAuthMethod,
      });
      setDemoStatus("success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      setDemoStatus("error");
    }
  };

  return (
    <FlowContainer>
      <FlowTitle>Pushed Authorization Request (PAR) Flow</FlowTitle>
      <FlowDescription>
        The Pushed Authorization Request (PAR) flow allows clients to push authorization request
        parameters to the authorization server in advance, receiving a request URI that can be used
        in the authorization request. This enhances security and reduces the risk of parameter
        tampering.
      </FlowDescription>

      <InfoContainer>
        <h4>🔒 PAR Security Benefits</h4>
        <p>
          PAR enhances security by allowing clients to push sensitive parameters to the
          authorization server in advance, reducing the risk of parameter tampering and providing
          better control over the authorization process.
        </p>
        <p>
          <strong>📚 Official Documentation:</strong>
          <a
            href="https://apidocs.pingidentity.com/pingone/auth/v1/api/#pushed-authorization-request"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#1e40af", textDecoration: "underline" }}
          >
            PingOne PAR API Documentation
          </a>
        </p>
      </InfoContainer>

      <FlowCredentials
        flowType="par"
        onCredentialsChange={(newCredentials) => {
          setFormData((prev) => ({
            ...prev,
            clientId: newCredentials.clientId || prev.clientId,
            clientSecret: newCredentials.clientSecret || prev.clientSecret,
            environmentId: newCredentials.environmentId || prev.environmentId,
          }));
        }}
      />

      <TabContainer>
        <Tab $active={activeAuthMethod === "NONE"} onClick={() => setActiveAuthMethod("NONE")}>
          NONE
        </Tab>
        <Tab
          $active={activeAuthMethod === "CLIENT_SECRET_POST"}
          onClick={() => setActiveAuthMethod("CLIENT_SECRET_POST")}
        >
          CLIENT_SECRET_POST
        </Tab>
        <Tab
          $active={activeAuthMethod === "CLIENT_SECRET_BASIC"}
          onClick={() => setActiveAuthMethod("CLIENT_SECRET_BASIC")}
        >
          CLIENT_SECRET_BASIC
        </Tab>
        <Tab
          $active={activeAuthMethod === "CLIENT_SECRET_JWT"}
          onClick={() => setActiveAuthMethod("CLIENT_SECRET_JWT")}
        >
          CLIENT_SECRET_JWT
        </Tab>
        <Tab
          $active={activeAuthMethod === "PRIVATE_KEY_JWT"}
          onClick={() => setActiveAuthMethod("PRIVATE_KEY_JWT")}
        >
          PRIVATE_KEY_JWT
        </Tab>
      </TabContainer>

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
          setParResponse(null);
        }}
        status={demoStatus}
        disabled={demoStatus === "loading"}
        title={`PAR Flow Steps (${activeAuthMethod})`}
      />

      {parResponse && (
        <PARContainer>
          <PARTitle>PAR Response Details</PARTitle>

          <PARDetails>
            <PARDetail>
              <PARLabel>Request URI</PARLabel>
              <PARValue>{parResponse.requestUri}</PARValue>
            </PARDetail>
            <PARDetail>
              <PARLabel>Expires In</PARLabel>
              <PARValue>{parResponse.expiresIn} seconds</PARValue>
            </PARDetail>
            <PARDetail>
              <PARLabel>Expires At</PARLabel>
              <PARValue>{new Date(parResponse.expiresAt).toLocaleString()}</PARValue>
            </PARDetail>
            <PARDetail>
              <PARLabel>Auth Method</PARLabel>
              <PARValue>{activeAuthMethod}</PARValue>
            </PARDetail>
          </PARDetails>

          <Button $variant="primary" onClick={handlePARStart}>
            Generate New PAR Request
          </Button>
        </PARContainer>
      )}

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

      <FormContainer>
        <h3>Manual PAR Configuration</h3>
        <p>You can also manually configure the PAR flow:</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <FormGroup>
            <Label>Response Type</Label>
            <Select
              value={formData.responseType}
              onChange={(e) => setFormData((prev) => ({ ...prev, responseType: e.target.value }))}
            >
              <option value="code">code</option>
              <option value="token">token</option>
              <option value="id_token">id_token</option>
              <option value="code token">code token</option>
              <option value="code id_token">code id_token</option>
              <option value="token id_token">token id_token</option>
              <option value="code token id_token">code token id_token</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Scope</Label>
            <Input
              type="text"
              value={formData.scope}
              onChange={(e) => setFormData((prev) => ({ ...prev, scope: e.target.value }))}
            />
          </FormGroup>

          <FormGroup>
            <Label>ACR Values</Label>
            <Input
              type="text"
              value={formData.acrValues}
              onChange={(e) => setFormData((prev) => ({ ...prev, acrValues: e.target.value }))}
            />
          </FormGroup>

          <FormGroup>
            <Label>Prompt</Label>
            <Select
              value={formData.prompt}
              onChange={(e) => setFormData((prev) => ({ ...prev, prompt: e.target.value }))}
            >
              <option value="consent">consent</option>
              <option value="login">login</option>
              <option value="select_account">select_account</option>
            </Select>
          </FormGroup>
        </div>

        {activeAuthMethod === "PRIVATE_KEY_JWT" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <FormGroup>
              <Label>Private Key</Label>
              <TextArea
                value={formData.privateKey}
                onChange={(e) => setFormData((prev) => ({ ...prev, privateKey: e.target.value }))}
                placeholder="Enter private key in PEM format"
              />
            </FormGroup>

            <FormGroup>
              <Label>Key ID</Label>
              <Input
                type="text"
                value={formData.keyId}
                onChange={(e) => setFormData((prev) => ({ ...prev, keyId: e.target.value }))}
                placeholder="Enter key ID"
              />
            </FormGroup>
          </div>
        )}

        <FormGroup>
          <Label>Claims (JSON)</Label>
          <TextArea
            value={formData.claims}
            onChange={(e) => setFormData((prev) => ({ ...prev, claims: e.target.value }))}
            placeholder='{"userinfo": {"email": null, "phone_number": null}}'
          />
        </FormGroup>
      </FormContainer>
    </FlowContainer>
  );
};

export default PARFlow;
