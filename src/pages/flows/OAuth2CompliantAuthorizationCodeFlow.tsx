// src/pages/flows/OAuth2CompliantAuthorizationCodeFlow.tsx
/**
 * RFC 6749 Compliant OAuth 2.0 Authorization Code Flow
 *
 * This component implements a fully RFC 6749 compliant OAuth 2.0 Authorization Code Flow
 * with proper parameter validation, error handling, and security features.
 *
 * Key Features:
 * - RFC 6749 compliant parameter validation
 * - Cryptographically secure state generation
 * - Proper error response handling
 * - PKCE support (RFC 7636)
 * - Security headers implementation
 * - Step-by-step guidance with validation
 */

import { useCallback, useState } from 'react';
import {
	FiAlertCircle,
	FiAlertTriangle,
	FiArrowRight,
	FiCheckCircle,
	FiCopy,
	FiExternalLink,
	FiEye,
	FiEyeOff,
	FiInfo,
	FiKey,
	FiLock,
	FiRefreshCw,
	FiShield,
} from '@icons';
import styled from 'styled-components';
import { useOAuth2CompliantAuthorizationCodeFlow } from '../../hooks/useOAuth2CompliantAuthorizationCodeFlow';
import { v4ToastManager } from '../../utils/v4ToastMessages';

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 2rem 0;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%);
  color: white;
  padding: 2rem;
  border-radius: 1rem 1rem 0 0;
  margin-bottom: 0;
`;

const HeaderTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const HeaderSubtitle = styled.p`
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
`;

const ComplianceBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid #22c55e;
  color: #bbf7d0;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-top: 1rem;
`;

const MainCard = styled.div`
  background: white;
  border-radius: 0 0 1rem 1rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
  border: 1px solid #e2e8f0;
  border-top: none;
`;

const StepContainer = styled.div`
  padding: 2rem;
`;

const StepHeader = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border: 2px solid ${(props) =>
		props.$completed ? '#22c55e' : props.$active ? '#3b82f6' : '#e2e8f0'};
  border-radius: 0.75rem;
  background: ${(props) => (props.$completed ? '#f0fdf4' : props.$active ? '#eff6ff' : '#f8fafc')};
  margin-bottom: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${(props) =>
			props.$completed ? '#16a34a' : props.$active ? '#2563eb' : '#94a3b8'};
  }
`;

const StepNumber = styled.div<{ $active: boolean; $completed: boolean }>`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  background: ${(props) => (props.$completed ? '#22c55e' : props.$active ? '#3b82f6' : '#94a3b8')};
  color: white;
`;

const StepInfo = styled.div`
  flex: 1;
`;

const StepTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: #1f2937;
`;

const StepDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const StepContent = styled.div<{ $visible: boolean }>`
  display: ${(props) => (props.$visible ? 'block' : 'none')};
  padding: 0 1rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &.error {
    border-color: #ef4444;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${(props) => {
		switch (props.$variant) {
			case 'primary':
				return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
          &:disabled { background: #9ca3af; cursor: not-allowed; }
        `;
			case 'danger':
				return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; }
        `;
			default:
				return `
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover { background: #e5e7eb; }
        `;
		}
	}}
`;

const ErrorBox = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
`;

const ErrorTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 0.5rem;
`;

const ErrorList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  color: #991b1b;
  font-size: 0.875rem;
`;

const WarningBox = styled.div`
  background: #fffbeb;
  border: 1px solid #fed7aa;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
`;

const WarningTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #d97706;
  margin-bottom: 0.5rem;
`;

const InfoBox = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
`;

const InfoTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 0.5rem;
`;

const CodeBlock = styled.div`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 1rem 0;
  position: relative;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const TokenDisplay = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
`;

const TokenLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
`;

const TokenValue = styled.div`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  word-break: break-all;
  color: #1f2937;
`;

const steps = [
	{
		number: 1,
		title: 'Configuration & Validation',
		description: 'Configure OAuth 2.0 credentials with RFC 6749 validation',
	},
	{
		number: 2,
		title: 'PKCE Generation',
		description: 'Generate cryptographically secure PKCE codes (RFC 7636)',
	},
	{
		number: 3,
		title: 'Authorization URL',
		description: 'Generate compliant authorization URL with secure state',
	},
	{
		number: 4,
		title: 'User Authorization',
		description: 'Redirect user for authorization and handle callback',
	},
	{
		number: 5,
		title: 'Token Exchange',
		description: 'Exchange authorization code for access tokens',
	},
];

export default function OAuth2CompliantAuthorizationCodeFlow() {
	const [flowState, flowActions] = useOAuth2CompliantAuthorizationCodeFlow();
	const [showTokens, setShowTokens] = useState(false);

	const copyToClipboard = useCallback(async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			v4ToastManager.showSuccess(`${label} copied to clipboard`);
		} catch (_error) {
			v4ToastManager.showError('Failed to copy to clipboard');
		}
	}, []);

	const handleCredentialChange = useCallback(
		(field: string, value: string) => {
			flowActions.setCredentials({
				...flowState.credentials,
				[field]: value,
			});
		},
		[flowState.credentials, flowActions]
	);

	const handleAuthorize = useCallback(() => {
		if (flowState.authorizationUrl) {
			window.open(flowState.authorizationUrl, '_blank', 'width=600,height=700');
		}
	}, [flowState.authorizationUrl]);

	return (
		<Container>
			<ContentWrapper>
				<Header>
					<HeaderTitle>
						<FiShield />
						OAuth 2.0 Authorization Code Flow
					</HeaderTitle>
					<HeaderSubtitle>
						RFC 6749 compliant implementation with enhanced security and validation
					</HeaderSubtitle>
					<ComplianceBadge>
						<FiCheckCircle />
						RFC 6749 Compliant
					</ComplianceBadge>
				</Header>

				<MainCard>
					{steps.map((step) => (
						<div key={step.number}>
							<StepContainer>
								<StepHeader
									$active={flowState.currentStep === step.number}
									$completed={flowState.currentStep > step.number}
									onClick={() => flowActions.goToStep(step.number)}
								>
									<StepNumber
										$active={flowState.currentStep === step.number}
										$completed={flowState.currentStep > step.number}
									>
										{flowState.currentStep > step.number ? <FiCheckCircle /> : step.number}
									</StepNumber>
									<StepInfo>
										<StepTitle>{step.title}</StepTitle>
										<StepDescription>{step.description}</StepDescription>
									</StepInfo>
									{flowState.currentStep === step.number && <FiArrowRight />}
								</StepHeader>

								<StepContent $visible={flowState.currentStep === step.number}>
									{step.number === 1 && (
										<div>
											<InfoBox>
												<InfoTitle>
													<FiInfo />
													Configuration Requirements
												</InfoTitle>
												<p>
													Enter your OAuth 2.0 client credentials. All parameters will be validated
													according to RFC 6749 specifications.
												</p>
											</InfoBox>

											<FormGroup>
												<Label>Environment ID *</Label>
												<Input
													type="text"
													value={flowState.credentials.environmentId}
													onChange={(e) => handleCredentialChange('environmentId', e.target.value)}
													placeholder="e.g., 12345678-1234-1234-1234-123456789012"
													className={
														flowState.configErrors.some((e) => e.includes('Environment'))
															? 'error'
															: ''
													}
												/>
											</FormGroup>

											<FormGroup>
												<Label>Client ID *</Label>
												<Input
													type="text"
													value={flowState.credentials.clientId}
													onChange={(e) => handleCredentialChange('clientId', e.target.value)}
													placeholder="e.g., your-client-id"
													className={
														flowState.configErrors.some((e) => e.includes('Client ID'))
															? 'error'
															: ''
													}
												/>
											</FormGroup>

											<FormGroup>
												<Label>Client Secret</Label>
												<Input
													type="password"
													value={flowState.credentials.clientSecret || ''}
													onChange={(e) => handleCredentialChange('clientSecret', e.target.value)}
													placeholder="Optional for public clients"
												/>
											</FormGroup>

											<FormGroup>
												<Label>Redirect URI *</Label>
												<Input
													type="url"
													value={flowState.credentials.redirectUri}
													onChange={(e) => handleCredentialChange('redirectUri', e.target.value)}
													placeholder="https://your-app.com/callback"
													className={
														flowState.configErrors.some((e) => e.includes('Redirect'))
															? 'error'
															: ''
													}
												/>
											</FormGroup>

											<FormGroup>
												<Label>Scope</Label>
												<Input
													type="text"
													value={flowState.credentials.scope || ''}
													onChange={(e) => handleCredentialChange('scope', e.target.value)}
													placeholder="openid profile email"
												/>
											</FormGroup>

											{flowState.configErrors.length > 0 && (
												<ErrorBox>
													<ErrorTitle>
														<FiAlertCircle />
														Configuration Errors
													</ErrorTitle>
													<ErrorList>
														{flowState.configErrors.map((error, index) => (
															<li key={index}>{error}</li>
														))}
													</ErrorList>
												</ErrorBox>
											)}

											<Button
												$variant="primary"
												onClick={flowActions.validateConfiguration}
												disabled={
													!flowState.credentials.clientId || !flowState.credentials.environmentId
												}
											>
												<FiCheckCircle />
												Validate Configuration
											</Button>

											{flowState.isConfigValid && (
												<Button
													$variant="primary"
													onClick={() => flowActions.goToStep(2)}
													style={{ marginLeft: '1rem' }}
												>
													Next Step
													<FiArrowRight />
												</Button>
											)}
										</div>
									)}

									{step.number === 2 && (
										<div>
											<InfoBox>
												<InfoTitle>
													<FiLock />
													PKCE (Proof Key for Code Exchange)
												</InfoTitle>
												<p>
													PKCE provides additional security for OAuth 2.0 flows by using
													cryptographically random codes. This implementation uses SHA256 challenge
													method per RFC 7636.
												</p>
											</InfoBox>

											{flowState.pkceCodes && (
												<div>
													<TokenDisplay>
														<TokenLabel>Code Verifier</TokenLabel>
														<TokenValue>{flowState.pkceCodes.codeVerifier}</TokenValue>
													</TokenDisplay>

													<TokenDisplay>
														<TokenLabel>Code Challenge</TokenLabel>
														<TokenValue>{flowState.pkceCodes.codeChallenge}</TokenValue>
													</TokenDisplay>

													<TokenDisplay>
														<TokenLabel>Challenge Method</TokenLabel>
														<TokenValue>{flowState.pkceCodes.codeChallengeMethod}</TokenValue>
													</TokenDisplay>
												</div>
											)}

											<Button $variant="primary" onClick={flowActions.generatePKCECodes}>
												<FiRefreshCw />
												{flowState.pkceCodes ? 'Regenerate' : 'Generate'} PKCE Codes
											</Button>

											{flowState.isPkceGenerated && (
												<Button
													$variant="primary"
													onClick={() => flowActions.goToStep(3)}
													style={{ marginLeft: '1rem' }}
												>
													Next Step
													<FiArrowRight />
												</Button>
											)}
										</div>
									)}

									{step.number === 3 && (
										<div>
											<InfoBox>
												<InfoTitle>
													<FiKey />
													Authorization URL Generation
												</InfoTitle>
												<p>
													The authorization URL includes all required parameters with
													cryptographically secure state for CSRF protection.
												</p>
											</InfoBox>

											{flowState.authorizationUrl && (
												<div>
													<CodeBlock>
														{flowState.authorizationUrl}
														<CopyButton
															onClick={() =>
																copyToClipboard(flowState.authorizationUrl, 'Authorization URL')
															}
														>
															<FiCopy />
															Copy
														</CopyButton>
													</CodeBlock>

													<InfoBox>
														<InfoTitle>
															<FiInfo />
															Security Features
														</InfoTitle>
														<ul>
															<li>Cryptographically secure state parameter for CSRF protection</li>
															<li>PKCE code challenge for enhanced security</li>
															<li>RFC 6749 compliant parameter validation</li>
															<li>Proper URL encoding and formatting</li>
														</ul>
													</InfoBox>
												</div>
											)}

											<Button
												$variant="primary"
												onClick={flowActions.generateAuthorizationUrl}
												disabled={!flowState.isConfigValid || !flowState.isPkceGenerated}
											>
												<FiKey />
												Generate Authorization URL
											</Button>

											{flowState.isAuthUrlGenerated && (
												<Button
													$variant="primary"
													onClick={() => flowActions.goToStep(4)}
													style={{ marginLeft: '1rem' }}
												>
													Next Step
													<FiArrowRight />
												</Button>
											)}
										</div>
									)}

									{step.number === 4 && (
										<div>
											<InfoBox>
												<InfoTitle>
													<FiExternalLink />
													User Authorization
												</InfoTitle>
												<p>
													Click the button below to open the authorization URL in a new window.
													After authorization, you'll be redirected back with an authorization code.
												</p>
											</InfoBox>

											{flowState.authorizationCode && (
												<div>
													<TokenDisplay>
														<TokenLabel>Authorization Code</TokenLabel>
														<TokenValue>{flowState.authorizationCode}</TokenValue>
													</TokenDisplay>

													<InfoBox>
														<InfoTitle>
															<FiCheckCircle />
															Authorization Successful
														</InfoTitle>
														<p>
															Authorization code received and state parameter validated
															successfully. You can now proceed to exchange the code for tokens.
														</p>
													</InfoBox>
												</div>
											)}

											<Button
												$variant="primary"
												onClick={handleAuthorize}
												disabled={!flowState.isAuthUrlGenerated}
											>
												<FiExternalLink />
												Authorize Application
											</Button>

											{flowState.authorizationCode && (
												<Button
													$variant="primary"
													onClick={() => flowActions.goToStep(5)}
													style={{ marginLeft: '1rem' }}
												>
													Next Step
													<FiArrowRight />
												</Button>
											)}
										</div>
									)}

									{step.number === 5 && (
										<div>
											<InfoBox>
												<InfoTitle>
													<FiKey />
													Token Exchange
												</InfoTitle>
												<p>
													Exchange the authorization code for access tokens using the PKCE code
													verifier for additional security validation.
												</p>
											</InfoBox>

											{flowState.tokens && (
												<div>
													<div
														style={{
															display: 'flex',
															alignItems: 'center',
															gap: '1rem',
															marginBottom: '1rem',
														}}
													>
														<Button onClick={() => setShowTokens(!showTokens)}>
															{showTokens ? <FiEyeOff /> : <FiEye />}
															{showTokens ? 'Hide' : 'Show'} Tokens
														</Button>
													</div>

													{showTokens && (
														<div>
															<TokenDisplay>
																<TokenLabel>Access Token</TokenLabel>
																<TokenValue>{flowState.tokens.access_token}</TokenValue>
															</TokenDisplay>

															{flowState.tokens.refresh_token && (
																<TokenDisplay>
																	<TokenLabel>Refresh Token</TokenLabel>
																	<TokenValue>{flowState.tokens.refresh_token}</TokenValue>
																</TokenDisplay>
															)}

															<TokenDisplay>
																<TokenLabel>Token Type</TokenLabel>
																<TokenValue>{flowState.tokens.token_type}</TokenValue>
															</TokenDisplay>

															{flowState.tokens.expires_in && (
																<TokenDisplay>
																	<TokenLabel>Expires In</TokenLabel>
																	<TokenValue>{flowState.tokens.expires_in} seconds</TokenValue>
																</TokenDisplay>
															)}

															{flowState.tokens.scope && (
																<TokenDisplay>
																	<TokenLabel>Scope</TokenLabel>
																	<TokenValue>{flowState.tokens.scope}</TokenValue>
																</TokenDisplay>
															)}
														</div>
													)}

													<InfoBox>
														<InfoTitle>
															<FiCheckCircle />
															Flow Complete
														</InfoTitle>
														<p>
															OAuth 2.0 Authorization Code Flow completed successfully with full RFC
															6749 compliance. All security validations passed.
														</p>
													</InfoBox>
												</div>
											)}

											{flowState.tokenErrors.length > 0 && (
												<ErrorBox>
													<ErrorTitle>
														<FiAlertCircle />
														Token Exchange Errors
													</ErrorTitle>
													<ErrorList>
														{flowState.tokenErrors.map((error, index) => (
															<li key={index}>{error}</li>
														))}
													</ErrorList>
												</ErrorBox>
											)}

											<Button
												$variant="primary"
												onClick={flowActions.exchangeTokens}
												disabled={!flowState.authorizationCode || flowState.isExchangingTokens}
											>
												<FiKey />
												{flowState.isExchangingTokens ? 'Exchanging...' : 'Exchange Tokens'}
											</Button>

											<Button
												$variant="secondary"
												onClick={flowActions.resetFlow}
												style={{ marginLeft: '1rem' }}
											>
												<FiRefreshCw />
												Start Over
											</Button>
										</div>
									)}
								</StepContent>
							</StepContainer>
						</div>
					))}

					{/* Global Errors and Warnings */}
					{flowState.errors.length > 0 && (
						<StepContainer>
							<ErrorBox>
								<ErrorTitle>
									<FiAlertCircle />
									OAuth 2.0 Errors
								</ErrorTitle>
								{flowState.errors.map((error, index) => (
									<div key={index} style={{ marginBottom: '0.5rem' }}>
										<strong>Error:</strong> {error.error}
										<br />
										{error.error_description && (
											<>
												<strong>Description:</strong> {error.error_description}
												<br />
											</>
										)}
										{error.state && (
											<>
												<strong>State:</strong> {error.state}
											</>
										)}
									</div>
								))}
							</ErrorBox>
						</StepContainer>
					)}

					{flowState.warnings.length > 0 && (
						<StepContainer>
							<WarningBox>
								<WarningTitle>
									<FiAlertTriangle />
									Security Warnings
								</WarningTitle>
								<ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
									{flowState.warnings.map((warning, index) => (
										<li key={index}>{warning}</li>
									))}
								</ul>
							</WarningBox>
						</StepContainer>
					)}
				</MainCard>
			</ContentWrapper>
		</Container>
	);
}
