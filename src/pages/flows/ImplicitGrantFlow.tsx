import { useEffect, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import styled from "styled-components";
import AuthorizationRequestModal from "../../components/AuthorizationRequestModal";
import CallbackUrlDisplay from "../../components/CallbackUrlDisplay";
import { Card, CardBody, CardHeader } from "../../components/Card";
import { ColorCodedURL } from "../../components/ColorCodedURL";
import ConfigurationButton from "../../components/ConfigurationButton";
import ConfigurationStatus from "../../components/ConfigurationStatus";
import ContextualHelp from "../../components/ContextualHelp";
import FlowCredentials from "../../components/FlowCredentials";
import PageTitle from "../../components/PageTitle";
import { SpecCard } from "../../components/SpecCard";
import { type FlowStep, StepByStepFlow } from "../../components/StepByStepFlow";
import TokenDisplayComponent from "../../components/TokenDisplay";
import { URLParamExplainer } from "../../components/URLParamExplainer";
import { usePageScroll } from "../../hooks/usePageScroll";
import { config } from "../../services/config";
import { getCallbackUrlForFlow } from "../../utils/callbackUrls";
import { getDefaultConfig } from "../../utils/flowConfigDefaults";
import { logger } from "../../utils/logger";
import { storeOAuthTokens } from "../../utils/tokenStorage";

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

const SecurityWarning = styled.div`
  background-color: #fdecea;
  border: 1px solid #f5c2c7;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;

  svg {
    color: #dc3545;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  h3 {
    color: #dc3545;
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: #dc3545;
    font-size: 0.9rem;
  }
`;

const DemoSection = styled(Card)`
  margin-bottom: 2rem;
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

const ImplicitGrantFlow = () => {
  // Centralized scroll management - ALL pages start at top
  usePageScroll({ pageName: "Implicit Grant Flow", force: true });

  const [demoStatus, setDemoStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [authUrl, setAuthUrl] = useState("");
  const [tokensReceived, setTokensReceived] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepsWithResults, setStepsWithResults] = useState<FlowStep[]>([]);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [redirectParams, setRedirectParams] = useState<Record<string, string>>({});

  // Debug modal state changes
  useEffect(() => {
    console.log("🔍 [ImplicitGrantFlow] Modal state changed:", {
      showRedirectModal,
      redirectUrl: redirectUrl ? "present" : "empty",
    });
  }, [showRedirectModal, redirectUrl]);

  // Log security warning display
  useEffect(() => {
    logger.info(
      "ImplicitGrantFlow",
      "Security warning displayed: Implicit Grant flow has security limitations and is generally not recommended for new applications",
    );
  }, []);

  // Generate authorization URL
  const generateAuthUrl = () => {
    if (!config) {
      logger.warn("ImplicitGrantFlow", "No config available for generating auth URL");
      return "";
    }

    logger.flow("ImplicitGrantFlow", "Generating authorization URL", { config: !!config });

    const params = new URLSearchParams({
      response_type: "token",
      client_id: config.pingone.clientId,
      redirect_uri: getCallbackUrlForFlow("implicit"),
      scope: "read write",
      state: Math.random().toString(36).substring(2, 15),
      nonce: Math.random().toString(36).substring(2, 15),
    });

    // Construct authorization endpoint if not available
    const authEndpoint = config.pingone.authEndpoint;

    logger.config("ImplicitGrantFlow", "Using authorization endpoint", { authEndpoint });

    const url = `${authEndpoint}?${params.toString()}`;
    logger.success("ImplicitGrantFlow", "Authorization URL generated", { url });

    return url;
  };

  const startImplicitFlow = async () => {
    logger.flow("ImplicitGrantFlow", "Starting implicit flow");
    setDemoStatus("loading");
    setCurrentStep(0);
    setError(null);
    setTokensReceived(null);
    setAuthUrl("");
    setStepsWithResults([...steps]); // Initialize with copy of steps
    logger.success("ImplicitGrantFlow", "Implicit flow started successfully");
  };

  const resetDemo = () => {
    logger.flow("ImplicitGrantFlow", "Resetting demo");
    setDemoStatus("idle");
    setCurrentStep(0);
    setTokensReceived(null);
    setError(null);
    setAuthUrl("");
    setStepsWithResults([]);
    logger.success("ImplicitGrantFlow", "Demo reset completed");
  };

  const handleRedirectModalClose = () => {
    console.log("🔒 [ImplicitGrantFlow] Closing redirect modal");
    setShowRedirectModal(false);
    setRedirectUrl("");
    setRedirectParams({});
  };

  const handleRedirectModalProceed = () => {
    logger.flow("ImplicitGrantFlow", "Proceeding with redirect to PingOne", { url: redirectUrl });

    // Store the return path for after callback
    const currentPath = window.location.pathname;
    // Ensure we use the correct route path regardless of current path
    const correctPath = currentPath.includes("/oidc/") ? "/flows-old/implicit" : currentPath;
    const returnPath = `${correctPath}?step=2`; // Return to step 2 (token handling)
    sessionStorage.setItem("redirect_after_login", returnPath);

    // Store flow context in state parameter
    const stateParam = new URLSearchParams(redirectUrl.split("?")[1]?.split("#")[0] || "").get(
      "state",
    );
    if (stateParam) {
      // Encode flow context in the state parameter
      const flowContext = {
        flow: "implicit-grant",
        step: 2,
        returnPath: returnPath,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(`flow_context_${stateParam}`, JSON.stringify(flowContext));
    }

    console.log("🔄 [ImplicitGrantFlow] Stored return path:", returnPath);
    window.location.href = redirectUrl;
  };

  const steps: FlowStep[] = [
    {
      title: "Generate Authorization URL",
      description: "Create the authorization URL with the implicit grant parameters",
      code: `// Authorization URL for Implicit Grant
const authUrl = '${generateAuthUrl()}';

// Parameters:
response_type: 'token'
client_id: '${config.pingone.clientId || "your_client_id"}'
redirect_uri: '${getCallbackUrlForFlow("implicit")}'
scope: 'read write'
state: 'random_state_value'
nonce: 'random_nonce_value'`,
      execute: () => {
        logger.flow("ImplicitGrantFlow", "Executing authorization URL generation step");
        const url = generateAuthUrl();
        setAuthUrl(url);
        logger.success("ImplicitGrantFlow", "Authorization URL step completed", { url });
      },
    },
    {
      title: "Redirect User to Authorization Server",
      description: "User is redirected to PingOne to authenticate and consent",
      code: `// User clicks login link or is redirected
window.location.href = authUrl;

// PingOne handles:
// - User authentication
// - Consent for requested scopes
// - Redirect back with tokens in URL fragment`,
      execute: async () => {
        try {
          // Generate the authorization URL directly instead of relying on step 1
          const flowConfig = getDefaultConfig("implicit");
          const authEndpoint = config.pingone.authEndpoint;

          if (!authEndpoint) {
            setError(
              "Authorization endpoint not configured. Please check your PingOne configuration.",
            );
          }

          // Use the correct callback URL for this flow
          const callbackUrl = getCallbackUrlForFlow("implicit");
          // Generate the URL with current flow configuration
          const url = `${authEndpoint}?client_id=${config.pingone.clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=${flowConfig.responseType}&scope=${encodeURIComponent(flowConfig.scopes.join(" "))}&state=${flowConfig.state || "xyz123"}&nonce=${flowConfig.nonce || "abc456"}${flowConfig.maxAge > 0 ? `&max_age=${flowConfig.maxAge}` : ""}${flowConfig.prompt ? `&prompt=${flowConfig.prompt}` : ""}${flowConfig.loginHint ? `&login_hint=${flowConfig.loginHint}` : ""}${flowConfig.acrValues.length > 0 ? `&acr_values=${encodeURIComponent(flowConfig.acrValues.join(" "))}` : ""}${
            Object.keys(flowConfig.customParams).length > 0
              ? Object.entries(flowConfig.customParams)
                  .map(([k, v]) => `&${k}=${encodeURIComponent(v)}`)
                  .join("")
              : ""
          }`;

          logger.flow("ImplicitGrantFlow", "Preparing redirect modal for PingOne authentication", {
            url,
          });
          console.log(
            "✅ [ImplicitGrantFlow] Preparing redirect modal for PingOne authentication:",
            url,
          );

          // Parse URL to extract parameters
          const urlObj = new URL(url);
          const params: Record<string, string> = {};
          urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
          });

          // Set modal data and show modal
          console.log("🔓 [ImplicitGrantFlow] Opening redirect modal with URL:", url);
          setRedirectUrl(url);
          setRedirectParams(params);
          setShowRedirectModal(true);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          setError(`Error in step 2: ${errorMessage}`);
          console.error("❌ [ImplicitGrantFlow] Error in step 2:", error);
        }
      },
    },
    {
      title: "Handle Redirect with Tokens",
      description: "PingOne redirects back with access token and ID token in URL fragment",
      code: `// Callback URL with tokens in fragment
https://yourapp.com/callback#access_token=eyJ...

// JavaScript extracts tokens from URL fragment
const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);

const accessToken = params.get('access_token');
const tokenType = params.get('token_type');
const expiresIn = params.get('expires_in');

// Store tokens securely
localStorage.setItem('access_token', accessToken);`,
      execute: () => {
        // Simulate receiving tokens from the redirect
        const mockTokens = {
          access_token:
            "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
          token_type: "Bearer",
          expires_in: 3600,
          scope: "read write",
        };
        setTokensReceived(mockTokens);

        // Store tokens using the shared utility
        const tokensForStorage = {
          access_token: mockTokens.access_token,
          token_type: mockTokens.token_type,
          expires_in: mockTokens.expires_in,
          scope: mockTokens.scope,
        };

        const success = storeOAuthTokens(tokensForStorage, "implicit", "Implicit Grant Flow");
        if (success) {
          console.log("✅ [ImplicitGrantFlow] Tokens received and stored successfully");
        } else {
          console.error("❌ [ImplicitGrantFlow] Failed to store tokens");
        }
      },
    },
    {
      title: "Use Tokens for API Calls",
      description: "Use the access token to authenticate API requests",
      code: `// Make authenticated API calls
const headers = {
  'Authorization': 'Bearer ' + accessToken,
  'Content-Type': 'application/json'
};

fetch('/api/user/profile', { headers })
  .then(response => response.json())
  .then(data => console.log('User profile:', data));

// Validate ID token if needed
const decodedIdToken = parseJwt(idToken);
console.log('User ID:', decodedIdToken.sub);`,
      execute: () => {
        setDemoStatus("success");
      },
    },
  ];

  return (
    <Container>
      <PageTitle
        title="Implicit Grant Flow"
        subtitle="Learn how the Implicit Grant flow works with real API calls to PingOne. This flow is suitable for client-side applications but has security limitations."
      />

      <ConfigurationStatus
        config={config}
        onConfigure={() => {
          console.log("🔧 [ImplicitGrantFlow] Configuration button clicked");
        }}
        flowType="implicit"
      />

      <ContextualHelp flowId="implicit" />

      <FlowCredentials
        flowType="implicit"
        onCredentialsChange={(credentials) => {
          logger.config("ImplicitGrantFlow", "Flow credentials updated", credentials);
        }}
      />

      <CallbackUrlDisplay flowType="implicit" />

      <FlowOverview>
        <CardHeader>
          <h2>Flow Overview</h2>
        </CardHeader>
        <CardBody>
          <FlowDescription>
            <h2>What is Implicit Grant?</h2>
            <p>
              The Implicit Grant flow is a simplified OAuth 2.0 flow designed for public clients
              (typically browser-based applications) that cannot securely store client secrets.
              Access tokens are returned immediately without an extra authorization code exchange
              step.
            </p>
            <p>
              <strong>How it works:</strong> The client redirects the user to the authorization
              server, which authenticates the user and immediately returns access tokens in the
              redirect URL fragment.
            </p>
          </FlowDescription>

          <SecurityWarning role="alert">
            <FiAlertCircle size={20} />
            <div>
              <h3>Security Warning</h3>
              <SpecCard>
                <p>
                  The Implicit Grant flow has security limitations and is generally not recommended
                  for new applications. Consider using the Authorization Code flow with PKCE
                  instead.
                </p>
              </SpecCard>
            </div>
          </SecurityWarning>
        </CardBody>
      </FlowOverview>

      <DemoSection>
        <CardHeader>
          <h2>Interactive Demo</h2>
        </CardHeader>
        <CardBody>
          <StepByStepFlow
            steps={stepsWithResults.length > 0 ? stepsWithResults : steps}
            onStart={startImplicitFlow}
            onReset={resetDemo}
            status={demoStatus}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            disabled={!config}
            title="Implicit Flow"
            configurationButton={<ConfigurationButton flowType="implicit" />}
          />

          {!config && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Configuration Required:</strong> Please configure your PingOne settings in the
              Configuration page before running this demo.
            </ErrorMessage>
          )}

          {error && (
            <ErrorMessage>
              <FiAlertCircle />
              <strong>Error:</strong> {error}
            </ErrorMessage>
          )}

          {authUrl && (
            <div>
              <h3>Authorization URL Generated:</h3>
              <ColorCodedURL url={authUrl} />
              <URLParamExplainer url={authUrl} />
            </div>
          )}

          {tokensReceived && (
            <div>
              <h3>Tokens Received:</h3>
              <TokenDisplayComponent tokens={tokensReceived} />
            </div>
          )}
        </CardBody>
      </DemoSection>
      {/* Redirect Modal */}
      <AuthorizationRequestModal
        isOpen={showRedirectModal}
        onClose={handleRedirectModalClose}
        onProceed={handleRedirectModalProceed}
        authorizationUrl={redirectUrl}
        requestParams={redirectParams}
      />
    </Container>
  );
};

export default ImplicitGrantFlow;
