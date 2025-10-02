// src/pages/flows/OAuthImplicitFlowV5_1.tsx
// Brand new OAuth Implicit Flow V5.1 using service-based architecture

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { FiAlertCircle, FiCheckCircle, FiChevronDown, FiCopy, FiExternalLink, FiGlobe, FiInfo, FiKey, FiSettings, FiShield } from 'react-icons/fi';
import { FlowControllerService } from '../../services/flowControllerService';
import { FlowLayoutService } from '../../services/flowLayoutService';
import { FlowComponentService } from '../../services/flowComponentService';
import { FlowAnalyticsService } from '../../services/flowAnalyticsService';
import { FlowConfigService } from '../../services/flowConfigService';
import { FlowStateService } from '../../services/flowStateService';
import { FlowHeader } from '../../services/flowHeaderService';
import EnhancedFlowInfoCard from '../../components/EnhancedFlowInfoCard';
import { FlowSequenceDisplay } from '../../components/FlowSequenceDisplay';
import { StepNavigationButtons } from '../../components/StepNavigationButtons';
import ConfigurationSummaryCard from '../../components/ConfigurationSummaryCard';
import { CredentialsInput } from '../../components/CredentialsInput';
import PingOneApplicationConfig, {
  type PingOneApplicationState,
} from '../../components/PingOneApplicationConfig';
import FlowConfigurationRequirements from '../../components/FlowConfigurationRequirements';

// Service-generated styled components
const Container = FlowLayoutService.getContainerStyles();
const ContentWrapper = FlowLayoutService.getContentWrapperStyles();
const MainCard = FlowLayoutService.getMainCardStyles();
const StepHeader = FlowLayoutService.getStepHeaderStyles('orange'); // Orange theme for Implicit
const StepHeaderLeft = FlowLayoutService.getStepHeaderLeftStyles();
const StepHeaderRight = FlowLayoutService.getStepHeaderRightStyles();
const VersionBadge = FlowLayoutService.getVersionBadgeStyles('orange');
const StepHeaderTitle = FlowLayoutService.getStepHeaderTitleStyles();
const StepHeaderSubtitle = FlowLayoutService.getStepHeaderSubtitleStyles();
const StepNumber = FlowLayoutService.getStepNumberStyles();
const StepTotal = FlowLayoutService.getStepTotalStyles();
const StepContentWrapper = FlowLayoutService.getStepContentWrapperStyles();

// Service-generated collapsible components
const CollapsibleSection = FlowComponentService.createCollapsibleSection();
const CollapsibleHeaderButton = FlowComponentService.createCollapsibleHeaderButton('orange');
const CollapsibleTitle = FlowComponentService.createCollapsibleTitle();
const CollapsibleToggleIcon = FlowComponentService.createCollapsibleToggleIcon('blue');
const CollapsibleContent = FlowComponentService.createCollapsibleContent();

// Service-generated info components
const InfoBox = FlowComponentService.createInfoBox();
const InfoTitle = FlowComponentService.createInfoTitle();
const InfoText = FlowComponentService.createInfoText();
const RequirementsIndicator = FlowComponentService.createRequirementsIndicator();
const RequirementsIcon = FlowComponentService.createRequirementsIcon();
const RequirementsText = FlowComponentService.createRequirementsText();

// Service-generated action components
const Button = FlowComponentService.createButton();
const ActionRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
`;

// Service-generated form components (removed unused ones)

// Service-generated results components
const ResultsSection = styled.div`
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-top: 1.5rem;
`;

const ResultsHeading = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HelperText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`;

// Service-generated parameter display components
const ParameterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
`;

const ParameterLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #ea580c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ParameterValue = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #7c2d12;
  word-break: break-all;
  background-color: #fff7ed;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #fed7aa;
`;

const GeneratedContentBox = styled.div`
  background-color: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
  position: relative;
`;

const GeneratedLabel = styled.div`
  position: absolute;
  top: -10px;
  left: 16px;
  background-color: #ea580c;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const OAuthImplicitFlowV5_1: React.FC = () => {
  // Service-generated flow configuration
  const flowConfig = FlowConfigService.getFlowConfig('implicit');
  const stepMetadata = flowConfig ? FlowStateService.createStepMetadata(flowConfig.stepConfigs) : [];
  const introSectionKeys = FlowStateService.createIntroSectionKeys('implicit');
  // Add additional section keys for V5.1
  const additionalSectionKeys = ['pingOneConfig', 'credentials'];
  const allSectionKeys = [...introSectionKeys, ...additionalSectionKeys];
  const defaultCollapsedSections = FlowStateService.createDefaultCollapsedSections(allSectionKeys);

  // Service-generated flow controller
  const flowController = FlowControllerService.createFlowController(
    {
      flowType: 'implicit',
      flowKey: 'oauth-implicit-v5-1',
      defaultFlowVariant: 'oauth',
      enableDebugger: true,
    },
    null, // No existing controller
    6, // step count
    introSectionKeys
  );

  // Service-generated analytics tracking
  useEffect(() => {
    FlowAnalyticsService.trackFlowStart('implicit', 'oauth-implicit-v5-1');
    return () => FlowAnalyticsService.trackFlowComplete(true);
  }, []);

  // Service-generated state management
  const [collapsedSections, setCollapsedSections] = useState(defaultCollapsedSections);
  
  // Credentials state
  const [environmentId, setEnvironmentId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('https://localhost:3000/implicit-callback');
  const [scopes, setScopes] = useState('openid profile email');
  const [loginHint, setLoginHint] = useState('');
  
  // PingOne configuration state
  const [pingOneConfig, setPingOneConfig] = useState<PingOneApplicationState>({
    clientAuthMethod: 'none', // Implicit flow doesn't use client authentication
    allowRedirectUriPatterns: false,
    pkceEnforcement: 'OPTIONAL',
    responseTypeCode: false,
    responseTypeToken: true,
    responseTypeIdToken: true,
    grantTypeAuthorizationCode: false,
    initiateLoginUri: '',
    targetLinkUri: '',
    signoffUrls: [],
    requestParameterSignatureRequirement: 'DEFAULT',
    enableJWKS: false,
    jwksMethod: 'JWKS_URL',
    jwksUrl: '',
    jwks: '',
    requirePushedAuthorizationRequest: false,
    pushedAuthorizationRequestTimeout: 60,
    additionalRefreshTokenReplayProtection: false,
    includeX5tParameter: false,
    oidcSessionManagement: false,
    requestScopesForMultipleResources: false,
    terminateUserSessionByIdToken: false,
    corsOrigins: [],
    corsAllowAnyOrigin: false,
  });

  // PingOne configuration handlers
  const savePingOneConfig = useCallback((config: PingOneApplicationState) => {
    setPingOneConfig(config);
    console.log('PingOne configuration saved:', config);
  }, []);

  // Service-generated handlers
  const toggleSection = useCallback((key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    console.log(`Copied ${label}:`, text);
  }, []);

  // Service-generated step content
  const renderStepContent = useMemo(() => {
    const currentStep = flowController.state.currentStep;
    
    switch (currentStep) {
      case 0:
        return (
          <>
            <CollapsibleSection>
              <CollapsibleHeaderButton
                onClick={() => toggleSection('overview')}
                aria-expanded={!collapsedSections.overview}
              >
                <CollapsibleTitle>
                  <FiInfo /> OAuth Implicit Flow Overview
                </CollapsibleTitle>
                <CollapsibleToggleIcon $collapsed={collapsedSections.overview}>
                  <FiChevronDown />
                </CollapsibleToggleIcon>
              </CollapsibleHeaderButton>
              {!collapsedSections.overview && (
                <CollapsibleContent>
                  <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}></div>
                  
                  <InfoBox $variant="info">
                    <FiShield size={20} />
                    <div>
                      <InfoTitle>When to Use Implicit Flow</InfoTitle>
                      <InfoText>
                        OAuth Implicit Flow is designed for public clients (like SPAs) that cannot securely store a client secret. 
                        It's perfect for single-page applications and mobile apps.
                      </InfoText>
                    </div>
                  </InfoBox>
                </CollapsibleContent>
              )}
            </CollapsibleSection>

            <FlowConfigurationRequirements flowType="implicit" variant="oauth" />

            <CollapsibleSection>
              <CollapsibleHeaderButton
                onClick={() => toggleSection('pingOneConfig')}
                aria-expanded={!collapsedSections.pingOneConfig}
              >
                <CollapsibleTitle>
                  <FiSettings /> PingOne Application Configuration Requirements
                </CollapsibleTitle>
                <CollapsibleToggleIcon $collapsed={collapsedSections.pingOneConfig}>
                  <FiChevronDown />
                </CollapsibleToggleIcon>
              </CollapsibleHeaderButton>
              {!collapsedSections.pingOneConfig && (
                <CollapsibleContent>
                  <PingOneApplicationConfig value={pingOneConfig} onChange={savePingOneConfig} />
                </CollapsibleContent>
              )}
            </CollapsibleSection>

            <CollapsibleSection>
              <CollapsibleHeaderButton
                onClick={() => toggleSection('credentials')}
                aria-expanded={!collapsedSections.credentials}
              >
                <CollapsibleTitle>
                  <FiKey /> Application Configuration & Credentials
                </CollapsibleTitle>
                <CollapsibleToggleIcon $collapsed={collapsedSections.credentials}>
                  <FiChevronDown />
                </CollapsibleToggleIcon>
              </CollapsibleHeaderButton>
              {!collapsedSections.credentials && (
                <CollapsibleContent>
                  <CredentialsInput
                    environmentId={environmentId}
                    clientId={clientId}
                    clientSecret={clientSecret}
                    redirectUri={redirectUri}
                    scopes={scopes}
                    loginHint={loginHint}
                    onEnvironmentIdChange={setEnvironmentId}
                    onClientIdChange={setClientId}
                    onClientSecretChange={setClientSecret}
                    onRedirectUriChange={setRedirectUri}
                    onScopesChange={setScopes}
                    onLoginHintChange={setLoginHint}
                    onCopy={handleCopy}
                    emptyRequiredFields={new Set()}
                  />
                </CollapsibleContent>
              )}
            </CollapsibleSection>
          </>
        );

      case 1:
        return (
          <>
            <CollapsibleSection>
              <CollapsibleHeaderButton
                onClick={() => toggleSection('authRequestOverview')}
                aria-expanded={!collapsedSections.authRequestOverview}
              >
                <CollapsibleTitle>
                  <FiGlobe /> Authorization Request Overview
                </CollapsibleTitle>
                <CollapsibleToggleIcon $collapsed={collapsedSections.authRequestOverview}>
                  <FiChevronDown />
                </CollapsibleToggleIcon>
              </CollapsibleHeaderButton>
              {!collapsedSections.authRequestOverview && (
                <CollapsibleContent>
                  <InfoBox $variant="info">
                    <FiGlobe size={20} />
                    <div>
                      <InfoTitle>What is an Authorization Request?</InfoTitle>
                      <InfoText>
                        An authorization request redirects users to PingOne's authorization server
                        where they authenticate and consent to sharing their information with your
                        application. This is the first step in obtaining tokens.
                      </InfoText>
                    </div>
                  </InfoBox>

                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                      Step-by-Step Process:
                    </h4>
                    <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                      <li style={{ marginBottom: '1.5rem' }}>
                        <strong>1. Build authorization URL</strong> - Construct the authorization endpoint URL with required parameters
                        <br />
                        <small style={{ color: '#64748b' }}>
                          <strong>Technical Detail (URL/Endpoint):</strong> <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>GET /as/authorize</code>
                        </small>
                        <br />
                        <small style={{ color: '#64748b' }}>
                          <strong>Required Parameters:</strong> response_type=token, client_id, redirect_uri, scope, state
                        </small>
                      </li>
                      <li style={{ marginBottom: '1.5rem' }}>
                        <strong>2. Redirect user to authorization server</strong> - Send user to PingOne's authorization endpoint
                        <br />
                        <small style={{ color: '#64748b' }}>
                          <strong>Example URL:</strong> <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>https://auth.pingone.com/{environmentId}/as/authorize?response_type=token&client_id=...</code>
                        </small>
                      </li>
                      <li style={{ marginBottom: '1.5rem' }}>
                        <strong>3. User authenticates and authorizes</strong> - User logs in and grants permission
                        <br />
                        <small style={{ color: '#64748b' }}>
                          <strong>User Sees:</strong> "Authorize 'My App' to access your account?" with scope details
                        </small>
                      </li>
                      <li style={{ marginBottom: '1.5rem' }}>
                        <strong>4. Server redirects back with tokens</strong> - PingOne returns to redirect_uri with tokens in URL fragment
                        <br />
                        <small style={{ color: '#64748b' }}>
                          <strong>Response Format:</strong> <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>https://myapp.com/callback#access_token=...&token_type=Bearer&expires_in=3600</code>
                        </small>
                      </li>
                    </ol>
                  </div>
                </CollapsibleContent>
              )}
            </CollapsibleSection>

            <ResultsSection>
              <ResultsHeading>
                <FiCheckCircle size={18} /> Generate Authorization URL
              </ResultsHeading>
              <HelperText>
                Generate the authorization URL with all required parameters. Review it carefully
                before redirecting users to ensure all parameters are correct.
              </HelperText>
              <ActionRow>
                <Button $variant="primary">
                  <FiExternalLink /> Generate Authorization URL
                </Button>
              </ActionRow>
            </ResultsSection>
          </>
        );

      case 2:
        return (
          <>
            <CollapsibleSection>
              <CollapsibleHeaderButton
                onClick={() => toggleSection('authResponseOverview')}
                aria-expanded={!collapsedSections.authResponseOverview}
              >
                <CollapsibleTitle>
                  <FiCheckCircle /> Authorization Response Overview
                </CollapsibleTitle>
                <CollapsibleToggleIcon $collapsed={collapsedSections.authResponseOverview}>
                  <FiChevronDown />
                </CollapsibleToggleIcon>
              </CollapsibleHeaderButton>
              {!collapsedSections.authResponseOverview && (
                <CollapsibleContent>
                  <InfoBox $variant="success">
                    <FiCheckCircle size={20} />
                    <div>
                      <InfoTitle>Authorization Response</InfoTitle>
                      <InfoText>
                        After authentication, PingOne returns you to the redirect URI with access tokens
                        or error message in the URL fragment.
                      </InfoText>
                    </div>
                  </InfoBox>

                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                      Response Details:
                    </h4>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <strong>Success Response (URL Fragment):</strong>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>Format:</strong> <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>https://myapp.com/callback#access_token=...&token_type=Bearer&expires_in=3600&state=...</code>
                      </small>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>Parameters:</strong> access_token, token_type, expires_in, scope, state
                      </small>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <strong>Error Response (URL Fragment):</strong>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>Format:</strong> <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>https://myapp.com/callback#error=access_denied&error_description=...</code>
                      </small>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>Common Errors:</strong> access_denied, invalid_request, unsupported_response_type, invalid_scope
                      </small>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <strong>Token Extraction:</strong>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>JavaScript Example:</strong> <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>const params = new URLSearchParams(window.location.hash.substring(1));</code>
                      </small>
                    </div>
                  </div>
                </CollapsibleContent>
              )}
            </CollapsibleSection>

            <ResultsSection>
              <ResultsHeading>
                <FiCheckCircle size={18} /> Authorization Response
              </ResultsHeading>
              <HelperText>
                The authorization response contains the access token and other information in the URL fragment.
              </HelperText>
              <GeneratedContentBox>
                <GeneratedLabel>Response</GeneratedLabel>
                <ParameterGrid>
                  <div>
                    <ParameterLabel>Access Token</ParameterLabel>
                    <ParameterValue>eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...</ParameterValue>
                  </div>
                  <div>
                    <ParameterLabel>Token Type</ParameterLabel>
                    <ParameterValue>Bearer</ParameterValue>
                  </div>
                  <div>
                    <ParameterLabel>Expires In</ParameterLabel>
                    <ParameterValue>3600</ParameterValue>
                  </div>
                  <div>
                    <ParameterLabel>Scope</ParameterLabel>
                    <ParameterValue>openid profile email</ParameterValue>
                  </div>
                </ParameterGrid>
                <ActionRow>
                  <Button $variant="primary">
                    <FiCopy /> Copy Access Token
                  </Button>
                </ActionRow>
              </GeneratedContentBox>
            </ResultsSection>
          </>
        );

      case 3:
        return (
          <>
            <CollapsibleSection>
              <CollapsibleHeaderButton
                onClick={() => toggleSection('tokenValidationOverview')}
                aria-expanded={!collapsedSections.tokenValidationOverview}
              >
                <CollapsibleTitle>
                  <FiShield /> Token Validation Overview
                </CollapsibleTitle>
                <CollapsibleToggleIcon $collapsed={collapsedSections.tokenValidationOverview}>
                  <FiChevronDown />
                </CollapsibleToggleIcon>
              </CollapsibleHeaderButton>
              {!collapsedSections.tokenValidationOverview && (
                <CollapsibleContent>
                  <InfoBox $variant="warning">
                    <FiAlertCircle size={20} />
                    <div>
                      <InfoTitle>Token Validation</InfoTitle>
                      <InfoText>
                        Always validate tokens on your backend before using them. Never trust tokens
                        that haven't been validated by your server.
                      </InfoText>
                    </div>
                  </InfoBox>

                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                      Validation Methods:
                    </h4>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <strong>1. Token Introspection (Recommended)</strong>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>Endpoint:</strong> <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>POST /as/introspect</code>
                      </small>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>Request:</strong> <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{"{ \"token\": \"access_token\", \"token_type_hint\": \"access_token\" }"}</code>
                      </small>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>Response:</strong> <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{"{ \"active\": true, \"scope\": \"openid profile\", \"exp\": 1234567890 }"}</code>
                      </small>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <strong>2. JWT Signature Verification</strong>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>JWKS Endpoint:</strong> <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>GET /.well-known/jwks.json</code>
                      </small>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>Verify:</strong> Signature, expiration (exp), issuer (iss), audience (aud)
                      </small>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <strong>3. Local Validation (JWT only)</strong>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>Check:</strong> Token format, expiration time, required claims
                      </small>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>Note:</strong> Only validates structure, not revocation status
                      </small>
                    </div>
                  </div>
                </CollapsibleContent>
              )}
            </CollapsibleSection>

            <ResultsSection>
              <ResultsHeading>
                <FiShield size={18} /> Validate Access Token
              </ResultsHeading>
              <HelperText>
                Validate the access token to ensure it's legitimate and hasn't been tampered with.
              </HelperText>
              <ActionRow>
                <Button $variant="primary">
                  <FiShield /> Validate Token
                </Button>
              </ActionRow>
            </ResultsSection>
          </>
        );

      case 4:
        return (
          <>
            <CollapsibleSection>
              <CollapsibleHeaderButton
                onClick={() => toggleSection('userInfoOverview')}
                aria-expanded={!collapsedSections.userInfoOverview}
              >
                <CollapsibleTitle>
                  <FiInfo /> UserInfo Endpoint Overview
                </CollapsibleTitle>
                <CollapsibleToggleIcon $collapsed={collapsedSections.userInfoOverview}>
                  <FiChevronDown />
                </CollapsibleToggleIcon>
              </CollapsibleHeaderButton>
              {!collapsedSections.userInfoOverview && (
                <CollapsibleContent>
                  <InfoBox $variant="info">
                    <FiInfo size={20} />
                    <div>
                      <InfoTitle>UserInfo Endpoint</InfoTitle>
                      <InfoText>
                        The UserInfo endpoint provides information about the authenticated user.
                        This is part of the OpenID Connect specification.
                      </InfoText>
                    </div>
                  </InfoBox>

                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                      UserInfo Details:
                    </h4>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <strong>Endpoint:</strong>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>URL:</strong> <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>GET /as/userinfo</code>
                      </small>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>Full URL:</strong> <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>https://auth.pingone.com/{environmentId}/as/userinfo</code>
                      </small>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <strong>Authentication:</strong>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>Header:</strong> <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>Authorization: Bearer {'{access_token}'}</code>
                      </small>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <strong>Response Format:</strong>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>JSON:</strong> <code style={{ background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{"{ \"sub\": \"user123\", \"name\": \"John Doe\", \"email\": \"john@example.com\" }"}</code>
                      </small>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>Common Claims:</strong> sub, name, email, given_name, family_name, picture
                      </small>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <strong>Error Handling:</strong>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>401 Unauthorized:</strong> Invalid or expired access token
                      </small>
                      <br />
                      <small style={{ color: '#64748b' }}>
                        <strong>403 Forbidden:</strong> Insufficient scope (missing 'openid' or 'profile')
                      </small>
                    </div>
                  </div>
                </CollapsibleContent>
              )}
            </CollapsibleSection>

            <ResultsSection>
              <ResultsHeading>
                <FiInfo size={18} /> Fetch User Information
              </ResultsHeading>
              <HelperText>
                Use the access token to fetch user information from the UserInfo endpoint.
              </HelperText>
              <ActionRow>
                <Button $variant="primary">
                  <FiInfo /> Fetch User Info
                </Button>
              </ActionRow>
            </ResultsSection>
          </>
        );

      case 5:
        return (
          <>
            <CollapsibleSection>
              <CollapsibleHeaderButton
                onClick={() => toggleSection('completionOverview')}
                aria-expanded={!collapsedSections.completionOverview}
              >
                <CollapsibleTitle>
                  <FiCheckCircle /> Flow Complete
                </CollapsibleTitle>
                <CollapsibleToggleIcon $collapsed={collapsedSections.completionOverview}>
                  <FiChevronDown />
                </CollapsibleToggleIcon>
              </CollapsibleHeaderButton>
              {!collapsedSections.completionOverview && (
                <CollapsibleContent>
                  <InfoBox $variant="success">
                    <FiCheckCircle size={20} />
                    <div>
                      <InfoTitle>Congratulations!</InfoTitle>
                      <InfoText>
                        You have successfully completed the OAuth 2.0 Implicit Flow using the new V5.1 service architecture.
                        This demonstrates how the new services make flows more consistent and maintainable.
                      </InfoText>
                    </div>
                  </InfoBox>
                </CollapsibleContent>
              )}
            </CollapsibleSection>

            <ResultsSection>
              <ResultsHeading>
                <FiCheckCircle size={18} /> Next Steps
              </ResultsHeading>
              <HelperText>
                Here are some next steps you can take with your OAuth implementation:
              </HelperText>
              <ul style={{ margin: '1rem 0', paddingLeft: '1.5rem' }}>
                <li>Implement token refresh logic</li>
                <li>Add token introspection</li>
                <li>Implement logout functionality</li>
                <li>Add error handling and retry logic</li>
              </ul>
            </ResultsSection>
          </>
        );

      default:
        return null;
    }
  }, [flowController.state.currentStep, collapsedSections, toggleSection]);

  return (
    <Container>
      <ContentWrapper>
        <FlowHeader flowId="oauth-implicit-v5-1" />

        <EnhancedFlowInfoCard 
          flowType="oauth-implicit"
          showAdditionalInfo={true}
          showDocumentation={true}
          showCommonIssues={false}
          showImplementationNotes={false}
        />

        <FlowSequenceDisplay flowType="implicit" />

        <MainCard>
          <StepHeader>
            <StepHeaderLeft>
              <VersionBadge>OAuth Implicit Flow · V5.1</VersionBadge>
              <StepHeaderTitle>{stepMetadata[flowController.state.currentStep].title}</StepHeaderTitle>
              <StepHeaderSubtitle>{stepMetadata[flowController.state.currentStep].subtitle}</StepHeaderSubtitle>
            </StepHeaderLeft>
            <StepHeaderRight>
              <StepNumber>{String(flowController.state.currentStep + 1).padStart(2, '0')}</StepNumber>
              <StepTotal>of 06</StepTotal>
            </StepHeaderRight>
          </StepHeader>

          {/* Step Requirements Indicator */}
          {!flowController.validation.isStepValid(flowController.state.currentStep) && flowController.state.currentStep !== 0 && (
            <RequirementsIndicator>
              <RequirementsIcon>
                <FiAlertCircle />
              </RequirementsIcon>
              <RequirementsText>
                <strong>Complete this step to continue:</strong>
                <ul>
                  {flowController.validation.getStepRequirements(flowController.state.currentStep).map((requirement: string, index: number) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </RequirementsText>
            </RequirementsIndicator>
          )}

          <StepContentWrapper>
            {renderStepContent}
          </StepContentWrapper>
        </MainCard>

        <ConfigurationSummaryCard />
      </ContentWrapper>

      <StepNavigationButtons
        currentStep={flowController.state.currentStep}
        totalSteps={stepMetadata.length}
        onPrevious={flowController.navigation.handlePrev}
        onReset={flowController.navigation.handleReset}
        onNext={flowController.navigation.handleNext}
        canNavigateNext={flowController.navigation.canNavigateNext}
        isFirstStep={flowController.navigation.isFirstStep}
        nextButtonText={flowController.validation.isStepValid(flowController.state.currentStep) ? 'Next' : 'Complete above action'}
        disabledMessage="Complete the action above to continue"
      />
    </Container>
  );
};

export default OAuthImplicitFlowV5_1;
