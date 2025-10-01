// src/pages/flows/AuthzV4NewWindsurfFlow.tsx - Educational OAuth 2.0 Authorization Code Flow V4

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiCheckCircle,
	FiChevronDown,
	FiChevronLeft,
	FiChevronRight,
	FiChevronUp,
	FiCopy,
	FiKey,
	FiPlay,
	FiShield,
} from 'react-icons/fi';
import styled from 'styled-components';
import PingOneAppConfig, { PingOneConfig } from '../../components/PingOneAppConfig';
import { copyToClipboard as utilCopyToClipboard } from '../../utils/clipboard';
import { generateCodeChallenge, generateCodeVerifier } from '../../utils/oauth';
import { v4ToastManager } from '../../utils/v4ToastMessages';

// Educational Notes:
// This flow demonstrates the OAuth 2.0 Authorization Code grant type
// Key learning points:
// 1. Authorization Code is the most secure OAuth flow for web apps
// 2. Uses PKCE (Proof Key for Code Exchange) for additional security
// 3. Tokens are exchanged server-side to prevent exposure
// 4. Integrates with PingOne using dynamic environment configuration

const _Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Inter', sans-serif;
`;

const _Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
`;

const _Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
`;

const _Subtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
`;

const _FlowSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
`;

const _SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: #1f2937;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${(props) => {
		switch (props.variant) {
			case 'primary':
				return `
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          }
        `;
			default:
				return `
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          &:hover {
            background: #e5e7eb;
            transform: translateY(-2px);
          }
        `;
		}
	}}
`;

const _StatusBox = styled.div<{ type: 'info' | 'success' | 'error' | 'loading' }>`
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${(props) => {
		switch (props.type) {
			case 'success':
				return 'background: #d1fae5; color: #065f46; border: 1px solid #34d399;';
			case 'error':
				return 'background: #fee2e2; color: #991b1b; border: 1px solid #f87171;';
			case 'loading':
				return 'background: #fef3c7; color: #92400e; border: 1px solid #fbbf24;';
			default:
				return 'background: #eff6ff; color: #1e40af; border: 1px solid #60a5fa;';
		}
	}}
`;

const _TokenDisplay = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
  word-break: break-all;
`;

const _EducationalNote = styled.div`
  background: #f0f9ff;
  border-left: 4px solid #3b82f6;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: #1e40af;
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Inter', sans-serif;
`;

const EducationalCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
`;

const StepHeader = styled.div`
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 2rem;
`;

const StepHeaderTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const StepHeaderSubtitle = styled.p`
  opacity: 0.9;
  margin: 0;
`;

const StepContent = styled.div`
  padding: 2rem;
`;

const ExplanationSection = styled.div`
  background: #f1f5f9;
  border-left: 4px solid #3b82f6;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border-radius: 0 8px 8px 0;
`;

const ExplanationTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoBox = styled.div`
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;

  h4 {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #1e40af;
  }
`;

const FlowDiagram = styled.div`
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
`;

const FlowStep = styled.div`
  display: flex;
  align-items: center;
  margin: 1rem 0;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
`;

const FlowStepNumber = styled.div`
  background: #3b82f6;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 1rem;
`;

const StepNavigation = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 50px;
  padding: 1rem 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  display: flex;
  gap: 1rem;
  align-items: center;
  z-index: 1000;
`;

const StepIndicator = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const StepDot = styled.div<{ $active?: boolean; $completed?: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${(props) => {
		if (props.$completed) return '#10b981';
		if (props.$active) return '#3b82f6';
		return '#e5e7eb';
	}};
  transition: all 0.3s ease;
  transform: ${(props) => (props.$active ? 'scale(1.2)' : 'scale(1)')};
`;

const CollapsibleSection = styled.div`
  margin: 1.5rem 0;
`;

const SectionToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 1rem;
  background: #f1f5f9;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: #e2e8f0;
  }
`;

const SectionContent = styled.div<{ $collapsed?: boolean }>`
  max-height: ${(props) => (props.$collapsed ? '0' : '2000px')};
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding: ${(props) => (props.$collapsed ? '0 1rem' : '1rem')};
  background: #f8fafc;
  border-radius: 0 0 8px 8px;
`;

const AuthzV4NewWindsurfFlow: React.FC = () => {
	// Educational state for multi-step flow
	const [currentEducationalStep, setCurrentEducationalStep] = useState(1);
	const [_copiedText, setCopiedText] = useState<string | null>(null);

	// PingOne configuration state
	const [pingOneConfig, setPingOneConfig] = useState<PingOneConfig | null>(null);

	// Interactive OAuth flow state
	const [pkceCodes, setPkceCodes] = useState<{
		codeVerifier: string;
		codeChallenge: string;
	} | null>(null);
	const [authUrl, setAuthUrl] = useState<string>('');
	const [authCode, setAuthCode] = useState<string>('');
	const [tokens, setTokens] = useState<{
		access_token?: string;
		id_token?: string;
		refresh_token?: string;
		token_type?: string;
		expires_in?: number;
	} | null>(null);
	const [_userInfo, setUserInfo] = useState<any>(null);
	const [isGeneratingPKCE, setIsGeneratingPKCE] = useState(false);
	const [_isExchangingTokens, setIsExchangingTokens] = useState(false);
	const [_isFetchingUserInfo, setIsFetchingUserInfo] = useState(false);

	// Collapsible sections state
	const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({});

	// Handle PingOne configuration changes
	const handlePingOneConfigChange = useCallback((config: PingOneConfig) => {
		setPingOneConfig(config);
	}, []);

	// Generate PKCE codes
	const generatePKCE = useCallback(async () => {
		if (!pingOneConfig) {
			v4ToastManager.showError('saveConfigurationValidationError', {
				fields: 'PingOne configuration',
			});
			return;
		}

		setIsGeneratingPKCE(true);
		try {
			const codeVerifier = generateCodeVerifier();
			const codeChallenge = await generateCodeChallenge(codeVerifier);

			const codes = { codeVerifier, codeChallenge };
			setPkceCodes(codes);

			v4ToastManager.showPKCEGenerated();

			// Auto-advance to next step
			if (currentEducationalStep === 2) {
				setCurrentEducationalStep(3);
			}
		} catch (error) {
			console.error('PKCE generation failed:', error);
			v4ToastManager.showPKCEError(error instanceof Error ? error.message : 'Unknown error');
		} finally {
			setIsGeneratingPKCE(false);
		}
	}, [pingOneConfig, currentEducationalStep]);

	// Generate authorization URL
	const generateAuthUrl = useCallback(() => {
		if (!pingOneConfig || !pkceCodes) {
			v4ToastManager.showError('stepError');
			return;
		}

		const state = Math.random().toString(36).substring(2, 15);
		sessionStorage.setItem('oauth_state', state);

		const params = new URLSearchParams({
			response_type: 'code',
			client_id: pingOneConfig.clientId,
			redirect_uri: pingOneConfig.redirectUri,
			scope: 'openid profile email',
			state: state,
			code_challenge: pkceCodes.codeChallenge,
			code_challenge_method: 'S256',
		});

		const url = `https://auth.pingone.com/${pingOneConfig.environmentId}/as/authorize?${params.toString()}`;
		setAuthUrl(url);

		v4ToastManager.showAuthUrlGenerated();

		// Auto-advance to next step
		if (currentEducationalStep === 3) {
			setCurrentEducationalStep(4);
		}
	}, [pingOneConfig, pkceCodes, currentEducationalStep]);

	// Handle authorization (redirect)
	const _handleAuthorization = useCallback(() => {
		if (!authUrl) {
			v4ToastManager.showError('stepError');
			return;
		}

		v4ToastManager.showAuthUrlOpened();
		window.location.href = authUrl;
	}, [authUrl]);

	// Exchange authorization code for tokens
	const _exchangeTokens = useCallback(async () => {
		if (!pingOneConfig || !authCode || !pkceCodes) {
			v4ToastManager.showError('stepError');
			return;
		}

		setIsExchangingTokens(true);
		v4ToastManager.showTokenExchangeStart();

		try {
			const tokenData = {
				grant_type: 'authorization_code',
				client_id: pingOneConfig.clientId,
				client_secret: pingOneConfig.clientSecret,
				code: authCode,
				redirect_uri: pingOneConfig.redirectUri,
				code_verifier: pkceCodes.codeVerifier,
			};

			const response = await fetch(
				`https://auth.pingone.com/${pingOneConfig.environmentId}/as/token`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: new URLSearchParams(tokenData).toString(),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error_description || errorData.error || 'Token exchange failed');
			}

			const tokens = await response.json();
			setTokens(tokens);

			v4ToastManager.showTokenExchangeSuccess();

			// Auto-advance to next step
			if (currentEducationalStep === 5) {
				setCurrentEducationalStep(6);
			}
		} catch (error) {
			console.error('Token exchange failed:', error);
			v4ToastManager.showTokenExchangeError(
				error instanceof Error ? error.message : 'Unknown error'
			);
		} finally {
			setIsExchangingTokens(false);
		}
	}, [pingOneConfig, authCode, pkceCodes, currentEducationalStep]);

	// Fetch user info
	const _fetchUserInfo = useCallback(async () => {
		if (!pingOneConfig || !tokens?.access_token) {
			v4ToastManager.showError('stepError');
			return;
		}

		setIsFetchingUserInfo(true);

		try {
			const response = await fetch(
				`https://auth.pingone.com/${pingOneConfig.environmentId}/as/userinfo`,
				{
					headers: {
						Authorization: `Bearer ${tokens.access_token}`,
					},
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error_description || errorData.error || 'User info fetch failed');
			}

			const userInfo = await response.json();
			setUserInfo(userInfo);

			v4ToastManager.showUserInfoFetched();

			// Auto-advance to next step
			if (currentEducationalStep === 6) {
				setCurrentEducationalStep(7);
			}
		} catch (error) {
			console.error('User info fetch failed:', error);
			v4ToastManager.showUserInfoError(error instanceof Error ? error.message : 'Unknown error');
		} finally {
			setIsFetchingUserInfo(false);
		}
	}, [pingOneConfig, tokens, currentEducationalStep]);

	// Copy to clipboard functionality
	const copyToClipboard = useCallback(async (text: string, itemName?: string) => {
		try {
			await utilCopyToClipboard(text);
			setCopiedText(text);
			setTimeout(() => setCopiedText(null), 2000);

			// Show success toast
			v4ToastManager.showCopySuccess(itemName || 'Content');
		} catch (error) {
			console.error('Failed to copy:', error);

			// Show error toast
			v4ToastManager.showCopyError(itemName || 'Content');
		}
	}, []);

	// Check for authorization code in URL on component mount
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const code = urlParams.get('code');
		const state = urlParams.get('state');
		const error = urlParams.get('error');
		const errorDescription = urlParams.get('error_description');

		if (error) {
			v4ToastManager.showError('authUrlGenerationError', { error: errorDescription || error });
			return;
		}

		if (code) {
			// Validate state parameter
			const storedState = sessionStorage.getItem('oauth_state');
			if (state && storedState && state !== storedState) {
				v4ToastManager.showError('authUrlGenerationError', {
					error: 'State parameter mismatch - possible CSRF attack',
				});
				return;
			}

			setAuthCode(code);
			// Auto-advance to token exchange step
			if (currentEducationalStep < 5) {
				setCurrentEducationalStep(5);
			}

			// Clean up URL
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	}, [currentEducationalStep]);

	// Toggle section collapse
	const toggleSection = useCallback((sectionId: string) => {
		setCollapsedSections((prev) => ({
			...prev,
			[sectionId]: !prev[sectionId],
		}));
	}, []);

	// Navigation functions for educational steps
	const nextEducationalStep = useCallback(() => {
		if (currentEducationalStep < 7) {
			setCurrentEducationalStep(currentEducationalStep + 1);
		}
	}, [currentEducationalStep]);

	const previousEducationalStep = useCallback(() => {
		if (currentEducationalStep > 1) {
			setCurrentEducationalStep(currentEducationalStep - 1);
		}
	}, [currentEducationalStep]);

	// Render educational content based on current step
	const renderEducationalContent = () => {
		switch (currentEducationalStep) {
			case 1:
				return (
					<>
						<StepHeader>
							<StepHeaderTitle>Step 1: Introduction & Setup</StepHeaderTitle>
							<StepHeaderSubtitle>
								Understanding OAuth 2.0 Authorization Code Flow
							</StepHeaderSubtitle>
						</StepHeader>

						<StepContent>
							<ExplanationSection>
								<ExplanationTitle>
									<FiShield />
									What is the Authorization Code Flow?
								</ExplanationTitle>
								<p style={{ marginBottom: '1rem' }}>
									The Authorization Code Flow is the most secure OAuth 2.0 flow for web
									applications. It's designed for applications that can securely store a client
									secret and can make server-to-server requests.
								</p>

								<InfoBox>
									<h4>Key Benefits:</h4>
									<ul style={{ listStyle: 'disc', listStylePosition: 'inside', margin: 0 }}>
										<li>Most secure OAuth flow</li>
										<li>Client secret never exposed to user agent</li>
										<li>Supports PKCE for additional security</li>
										<li>Can obtain refresh tokens for long-lived access</li>
									</ul>
								</InfoBox>
							</ExplanationSection>

							<FlowDiagram>
								<h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
									Authorization Code Flow Overview
								</h3>
								<FlowStep>
									<FlowStepNumber>1</FlowStepNumber>
									<div>
										<strong>User clicks "Login"</strong>
										<p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
											User initiates authentication process
										</p>
									</div>
								</FlowStep>
								<FlowStep>
									<FlowStepNumber>2</FlowStepNumber>
									<div>
										<strong>Redirect to Authorization Server</strong>
										<p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
											User is redirected to PingOne with authorization request
										</p>
									</div>
								</FlowStep>
								<FlowStep>
									<FlowStepNumber>3</FlowStepNumber>
									<div>
										<strong>User Authenticates</strong>
										<p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
											User logs in and grants permissions
										</p>
									</div>
								</FlowStep>
								<FlowStep>
									<FlowStepNumber>4</FlowStepNumber>
									<div>
										<strong>Authorization Code Returned</strong>
										<p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
											Server returns code to your application
										</p>
									</div>
								</FlowStep>
								<FlowStep>
									<FlowStepNumber>5</FlowStepNumber>
									<div>
										<strong>Exchange Code for Tokens</strong>
										<p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
											Your server exchanges code for access token
										</p>
									</div>
								</FlowStep>
							</FlowDiagram>

							<CollapsibleSection>
								<SectionToggle onClick={() => toggleSection('why-use-authz')}>
									<ExplanationTitle>
										<FiShield />
										Why Should You Use Authorization Code Flow?
									</ExplanationTitle>
									{collapsedSections['why-use-authz'] ? <FiChevronDown /> : <FiChevronUp />}
								</SectionToggle>
								<SectionContent $collapsed={collapsedSections['why-use-authz']}>
									<p style={{ marginBottom: '1rem' }}>
										The Authorization Code Flow is recommended by OAuth 2.1 and security best
										practices for several critical reasons:
									</p>

									<div
										style={{
											display: 'grid',
											gridTemplateColumns: '1fr 1fr',
											gap: '1rem',
											marginBottom: '1rem',
										}}
									>
										<InfoBox>
											<h4>🔒 Maximum Security</h4>
											<p style={{ margin: 0, fontSize: '0.875rem' }}>
												Tokens are never exposed to the browser or user agent. The authorization
												code is exchanged for tokens on the server-side, keeping sensitive data
												secure.
											</p>
										</InfoBox>

										<InfoBox>
											<h4>🛡️ PKCE Protection</h4>
											<p style={{ margin: 0, fontSize: '0.875rem' }}>
												Proof Key for Code Exchange prevents authorization code interception
												attacks, even if the redirect URI is compromised.
											</p>
										</InfoBox>

										<InfoBox>
											<h4>🔄 Refresh Tokens</h4>
											<p style={{ margin: 0, fontSize: '0.875rem' }}>
												Supports long-lived access through refresh tokens, enabling seamless user
												experiences without frequent re-authentication.
											</p>
										</InfoBox>

										<InfoBox>
											<h4>📱 Cross-Platform</h4>
											<p style={{ margin: 0, fontSize: '0.875rem' }}>
												Works securely across web apps, mobile apps, and SPAs when implemented with
												proper security measures.
											</p>
										</InfoBox>
									</div>
								</SectionContent>
							</CollapsibleSection>

							<CollapsibleSection>
								<SectionToggle onClick={() => toggleSection('how-to-protect')}>
									<ExplanationTitle>
										<FiShield />
										How to Protect Your Implementation
									</ExplanationTitle>
									{collapsedSections['how-to-protect'] ? <FiChevronDown /> : <FiChevronUp />}
								</SectionToggle>
								<SectionContent $collapsed={collapsedSections['how-to-protect']}>
									<p style={{ marginBottom: '1rem' }}>
										Security is paramount in OAuth implementations. Here are the essential
										protections you must implement:
									</p>

									<div style={{ marginBottom: '1.5rem' }}>
										<h4 style={{ color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>
											🔐 PKCE (Proof Key for Code Exchange)
										</h4>
										<p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
											PKCE is now <strong>required</strong> for all OAuth clients, including
											confidential clients:
										</p>
										<ul
											style={{
												fontSize: '0.875rem',
												listStyle: 'disc',
												listStylePosition: 'inside',
												margin: '0 0 1rem 1rem',
											}}
										>
											<li>
												Generate a cryptographically random <code>code_verifier</code>
											</li>
											<li>
												Create <code>code_challenge</code> using SHA256 hash of verifier
											</li>
											<li>Send challenge in authorization request</li>
											<li>Send verifier in token exchange request</li>
										</ul>
									</div>

									<div style={{ marginBottom: '1.5rem' }}>
										<h4 style={{ color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>
											🎯 State Parameter
										</h4>
										<p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
											Prevents CSRF attacks by maintaining state between requests:
										</p>
										<ul
											style={{
												fontSize: '0.875rem',
												listStyle: 'disc',
												listStylePosition: 'inside',
												margin: '0 0 1rem 1rem',
											}}
										>
											<li>Generate unique, unpredictable state value</li>
											<li>Store securely (session, secure cookie)</li>
											<li>Validate state matches on callback</li>
										</ul>
									</div>

									<div style={{ marginBottom: '1.5rem' }}>
										<h4 style={{ color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>
											🔒 Secure Storage & Transport
										</h4>
										<ul
											style={{
												fontSize: '0.875rem',
												listStyle: 'disc',
												listStylePosition: 'inside',
												margin: '0 0 1rem 1rem',
											}}
										>
											<li>Always use HTTPS for all OAuth endpoints</li>
											<li>Store client secrets securely (environment variables, key vaults)</li>
											<li>Use secure, httpOnly cookies for session management</li>
											<li>Implement proper CORS policies</li>
										</ul>
									</div>

									<div style={{ marginBottom: '1.5rem' }}>
										<h4 style={{ color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>
											⏱️ Token Lifecycle Management
										</h4>
										<ul
											style={{
												fontSize: '0.875rem',
												listStyle: 'disc',
												listStylePosition: 'inside',
												margin: '0 0 1rem 1rem',
											}}
										>
											<li>Use short-lived access tokens (15-60 minutes)</li>
											<li>Implement proper token refresh logic</li>
											<li>Securely store refresh tokens</li>
											<li>Implement token revocation on logout</li>
										</ul>
									</div>
								</SectionContent>
							</CollapsibleSection>

							<CollapsibleSection>
								<SectionToggle onClick={() => toggleSection('when-to-use')}>
									<ExplanationTitle>
										<FiShield />
										When to Use Authorization Code Flow
									</ExplanationTitle>
									{collapsedSections['when-to-use'] ? <FiChevronDown /> : <FiChevronUp />}
								</SectionToggle>
								<SectionContent $collapsed={collapsedSections['when-to-use']}>
									<p style={{ marginBottom: '1rem' }}>
										Choose Authorization Code Flow for these scenarios:
									</p>

									<div
										style={{
											display: 'grid',
											gridTemplateColumns: '1fr',
											gap: '1rem',
											marginBottom: '1rem',
										}}
									>
										<div
											style={{
												background: '#d1fae5',
												border: '1px solid #10b981',
												borderRadius: '8px',
												padding: '1rem',
											}}
										>
											<h4 style={{ color: '#065f46', fontWeight: '600', marginBottom: '0.5rem' }}>
												✅ Perfect For:
											</h4>
											<ul
												style={{
													fontSize: '0.875rem',
													listStyle: 'disc',
													listStylePosition: 'inside',
													margin: 0,
													color: '#065f46',
												}}
											>
												<li>
													<strong>Web Applications:</strong> Traditional server-side web apps with
													backend
												</li>
												<li>
													<strong>Single Page Applications (SPAs):</strong> With PKCE implementation
												</li>
												<li>
													<strong>Mobile Applications:</strong> Native iOS/Android apps
												</li>
												<li>
													<strong>Desktop Applications:</strong> Electron, native desktop apps
												</li>
												<li>
													<strong>Server-to-Server:</strong> When user interaction is required
													initially
												</li>
											</ul>
										</div>

										<div
											style={{
												background: '#fef3c7',
												border: '1px solid #f59e0b',
												borderRadius: '8px',
												padding: '1rem',
											}}
										>
											<h4 style={{ color: '#92400e', fontWeight: '600', marginBottom: '0.5rem' }}>
												⚠️ Consider Alternatives For:
											</h4>
											<ul
												style={{
													fontSize: '0.875rem',
													listStyle: 'disc',
													listStylePosition: 'inside',
													margin: 0,
													color: '#92400e',
												}}
											>
												<li>
													<strong>Pure Server-to-Server:</strong> Use Client Credentials flow
													instead
												</li>
												<li>
													<strong>IoT Devices:</strong> Consider Device Code flow for limited input
													devices
												</li>
												<li>
													<strong>Legacy Systems:</strong> May need Resource Owner Password flow
													(not recommended)
												</li>
											</ul>
										</div>

										<div
											style={{
												background: '#fee2e2',
												border: '1px solid #ef4444',
												borderRadius: '8px',
												padding: '1rem',
											}}
										>
											<h4 style={{ color: '#991b1b', fontWeight: '600', marginBottom: '0.5rem' }}>
												❌ Never Use For:
											</h4>
											<ul
												style={{
													fontSize: '0.875rem',
													listStyle: 'disc',
													listStylePosition: 'inside',
													margin: 0,
													color: '#991b1b',
												}}
											>
												<li>
													<strong>Public clients without PKCE:</strong> Always implement PKCE
												</li>
												<li>
													<strong>Insecure environments:</strong> Where secrets cannot be protected
												</li>
												<li>
													<strong>Simple API access:</strong> Where user context isn't needed
												</li>
											</ul>
										</div>
									</div>
								</SectionContent>
							</CollapsibleSection>

							{/* PingOne Configuration Section - using reusable component */}
							<PingOneAppConfig
								onConfigChange={handlePingOneConfigChange}
								storageKey="oauth-playground-authz-v4-config"
							/>
						</StepContent>
					</>
				);

			case 2:
				return (
					<>
						<StepHeader>
							<StepHeaderTitle>Step 2: Generate PKCE Parameters</StepHeaderTitle>
							<StepHeaderSubtitle>
								Creating secure code verifier and challenge for enhanced security
							</StepHeaderSubtitle>
						</StepHeader>

						<StepContent>
							<ExplanationSection>
								<ExplanationTitle>
									<FiKey />
									What is PKCE (Proof Key for Code Exchange)?
								</ExplanationTitle>
								<p style={{ marginBottom: '1rem' }}>
									PKCE is a security extension that prevents authorization code interception
									attacks. It's now required for all OAuth 2.1 implementations and recommended for
									all OAuth 2.0 flows.
								</p>

								<InfoBox>
									<h4>PKCE Process:</h4>
									<ol style={{ listStyle: 'decimal', listStylePosition: 'inside', margin: 0 }}>
										<li>
											<strong>Code Verifier:</strong> A cryptographically random string (43-128
											characters)
										</li>
										<li>
											<strong>Code Challenge:</strong> SHA256 hash of the code verifier, base64url
											encoded
										</li>
										<li>
											<strong>Challenge Method:</strong> Always use "S256" for maximum security
										</li>
										<li>
											<strong>Verification:</strong> Server validates verifier matches challenge
											during token exchange
										</li>
									</ol>
								</InfoBox>
							</ExplanationSection>

							{/* Interactive PKCE Generation */}
							<div
								style={{
									background: 'white',
									padding: '2rem',
									borderRadius: '12px',
									border: '1px solid #e5e7eb',
									boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
									margin: '2rem 0',
								}}
							>
								<h3
									style={{
										fontSize: '1.25rem',
										fontWeight: '600',
										marginBottom: '1rem',
										color: '#1f2937',
									}}
								>
									Generate PKCE Parameters
								</h3>

								{!pkceCodes ? (
									<div style={{ textAlign: 'center' }}>
										<p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
											Click the button below to generate secure PKCE parameters for your OAuth flow.
										</p>
										<Button
											variant="primary"
											onClick={generatePKCE}
											disabled={isGeneratingPKCE || !pingOneConfig}
											style={{
												padding: '0.75rem 2rem',
												fontSize: '1rem',
												fontWeight: '600',
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												margin: '0 auto',
											}}
										>
											<FiKey />
											{isGeneratingPKCE ? 'Generating...' : 'Generate PKCE Parameters'}
										</Button>
										{!pingOneConfig && (
											<p style={{ marginTop: '1rem', color: '#ef4444', fontSize: '0.875rem' }}>
												Please configure your PingOne settings in Step 1 first.
											</p>
										)}
									</div>
								) : (
									<div>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												marginBottom: '1.5rem',
												color: '#059669',
											}}
										>
											<FiCheckCircle />
											<span style={{ fontWeight: '600' }}>
												PKCE Parameters Generated Successfully!
											</span>
										</div>

										<div style={{ display: 'grid', gap: '1rem' }}>
											<div>
												<label
													style={{
														display: 'block',
														fontSize: '0.875rem',
														fontWeight: '500',
														color: '#374151',
														marginBottom: '0.5rem',
													}}
												>
													Code Verifier (keep this secret!)
												</label>
												<div style={{ display: 'flex', gap: '0.5rem' }}>
													<input
														type="text"
														value={pkceCodes.codeVerifier}
														readOnly
														style={{
															flex: 1,
															padding: '0.75rem',
															border: '1px solid #d1d5db',
															borderRadius: '6px',
															fontSize: '0.875rem',
															backgroundColor: '#f9fafb',
															fontFamily: 'monospace',
														}}
													/>
													<Button
														variant="secondary"
														onClick={() => copyToClipboard(pkceCodes.codeVerifier, 'Code Verifier')}
														style={{ padding: '0.75rem' }}
													>
														<FiCopy />
													</Button>
												</div>
											</div>

											<div>
												<label
													style={{
														display: 'block',
														fontSize: '0.875rem',
														fontWeight: '500',
														color: '#374151',
														marginBottom: '0.5rem',
													}}
												>
													Code Challenge (sent in authorization request)
												</label>
												<div style={{ display: 'flex', gap: '0.5rem' }}>
													<input
														type="text"
														value={pkceCodes.codeChallenge}
														readOnly
														style={{
															flex: 1,
															padding: '0.75rem',
															border: '1px solid #d1d5db',
															borderRadius: '6px',
															fontSize: '0.875rem',
															backgroundColor: '#f9fafb',
															fontFamily: 'monospace',
														}}
													/>
													<Button
														variant="secondary"
														onClick={() =>
															copyToClipboard(pkceCodes.codeChallenge, 'Code Challenge')
														}
														style={{ padding: '0.75rem' }}
													>
														<FiCopy />
													</Button>
												</div>
											</div>
										</div>

										<div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
											<Button
												variant="secondary"
												onClick={generatePKCE}
												disabled={isGeneratingPKCE}
												style={{
													padding: '0.5rem 1rem',
													fontSize: '0.875rem',
												}}
											>
												Regenerate PKCE Parameters
											</Button>
										</div>
									</div>
								)}
							</div>

							<CollapsibleSection>
								<SectionToggle onClick={() => toggleSection('pkce-security')}>
									<ExplanationTitle>
										<FiShield />
										Why PKCE is Critical for Security
									</ExplanationTitle>
									{collapsedSections['pkce-security'] ? <FiChevronDown /> : <FiChevronUp />}
								</SectionToggle>
								<SectionContent $collapsed={collapsedSections['pkce-security']}>
									<p style={{ marginBottom: '1rem' }}>
										PKCE protects against several attack vectors that can compromise OAuth flows:
									</p>

									<div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
										<div
											style={{
												background: '#fef2f2',
												border: '1px solid #fecaca',
												borderRadius: '8px',
												padding: '1rem',
											}}
										>
											<h4 style={{ color: '#991b1b', fontWeight: '600', marginBottom: '0.5rem' }}>
												🚨 Authorization Code Interception
											</h4>
											<p style={{ fontSize: '0.875rem', margin: 0, color: '#991b1b' }}>
												Without PKCE, if an attacker intercepts the authorization code (via network
												sniffing, malicious apps, or compromised redirect URIs), they could exchange
												it for tokens.
											</p>
										</div>

										<div
											style={{
												background: '#d1fae5',
												border: '1px solid #10b981',
												borderRadius: '8px',
												padding: '1rem',
											}}
										>
											<h4 style={{ color: '#065f46', fontWeight: '600', marginBottom: '0.5rem' }}>
												✅ PKCE Protection
											</h4>
											<p style={{ fontSize: '0.875rem', margin: 0, color: '#065f46' }}>
												With PKCE, even if the authorization code is intercepted, the attacker
												cannot exchange it for tokens without the original code verifier, which
												never leaves the client.
											</p>
										</div>
									</div>

									<div style={{ marginTop: '1.5rem' }}>
										<h4 style={{ color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>
											🔐 Technical Implementation
										</h4>
										<ul
											style={{
												fontSize: '0.875rem',
												listStyle: 'disc',
												listStylePosition: 'inside',
												margin: '0 0 1rem 1rem',
											}}
										>
											<li>
												<strong>Code Verifier:</strong> 43-128 character random string using [A-Z]
												[a-z] [0-9] - . _ ~
											</li>
											<li>
												<strong>Code Challenge:</strong> Base64url(SHA256(code_verifier))
											</li>
											<li>
												<strong>Challenge Method:</strong> "S256" (SHA256) - never use "plain"
											</li>
											<li>
												<strong>Verification:</strong> Server computes SHA256(received_verifier) and
												compares to stored challenge
											</li>
										</ul>
									</div>
								</SectionContent>
							</CollapsibleSection>
						</StepContent>
					</>
				);

			case 3:
				return (
					<>
						<StepHeader>
							<StepHeaderTitle>Step 3: Build Authorization URL</StepHeaderTitle>
							<StepHeaderSubtitle>
								Creating the authorization request with all required parameters
							</StepHeaderSubtitle>
						</StepHeader>

						<StepContent>
							<ExplanationSection>
								<ExplanationTitle>
									<FiShield />
									Building the Authorization URL
								</ExplanationTitle>
								<p style={{ marginBottom: '1rem' }}>
									The authorization URL is where your application redirects the user to authenticate
									with PingOne and grant permissions. This URL contains all the necessary parameters
									for a secure OAuth flow.
								</p>

								<InfoBox>
									<h4>Authorization URL Structure:</h4>
									<code style={{ fontSize: '0.875rem', display: 'block', marginTop: '0.5rem' }}>
										https://auth.pingone.com/{environmentId}/as/authorize?
										<br />
									</code>
								</InfoBox>
							</ExplanationSection>

							{/* Interactive Authorization URL Builder */}
							<div
								style={{
									background: 'white',
									padding: '2rem',
									borderRadius: '12px',
									border: '1px solid #e5e7eb',
									boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
									margin: '2rem 0',
								}}
							>
								<h3
									style={{
										fontSize: '1.25rem',
										fontWeight: '600',
										marginBottom: '1rem',
										color: '#1f2937',
									}}
								>
									Build Authorization URL
								</h3>

								{!authUrl ? (
									<div style={{ textAlign: 'center' }}>
										<p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
											Generate the authorization URL using your PingOne configuration and PKCE
											parameters.
										</p>
										<Button
											variant="primary"
											onClick={generateAuthUrl}
											disabled={!pingOneConfig || !pkceCodes}
											style={{
												padding: '0.75rem 2rem',
												fontSize: '1rem',
												fontWeight: '600',
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												margin: '0 auto',
											}}
										>
											<FiKey />
											Generate Authorization URL
										</Button>
										{(!pingOneConfig || !pkceCodes) && (
											<p style={{ marginTop: '1rem', color: '#ef4444', fontSize: '0.875rem' }}>
												Please complete Steps 1 and 2 first.
											</p>
										)}
									</div>
								) : (
									<div>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '0.5rem',
												marginBottom: '1.5rem',
												color: '#059669',
											}}
										>
											<FiCheckCircle />
											<span style={{ fontWeight: '600' }}>
												Authorization URL Generated Successfully!
											</span>
										</div>

										<div style={{ marginBottom: '1.5rem' }}>
											<label
												style={{
													display: 'block',
													fontSize: '0.875rem',
													fontWeight: '500',
													color: '#374151',
													marginBottom: '0.5rem',
												}}
											>
												Complete Authorization URL
											</label>
											<div style={{ display: 'flex', gap: '0.5rem' }}>
												<textarea
													value={authUrl}
													readOnly
													rows={4}
													style={{
														flex: 1,
														padding: '0.75rem',
														border: '1px solid #d1d5db',
														borderRadius: '6px',
														fontSize: '0.875rem',
														backgroundColor: '#f9fafb',
														fontFamily: 'monospace',
														resize: 'vertical',
													}}
												/>
												<Button
													variant="secondary"
													onClick={() => copyToClipboard(authUrl, 'Authorization URL')}
													style={{ padding: '0.75rem' }}
												>
													<FiCopy />
												</Button>
											</div>
										</div>

										<div style={{ marginBottom: '1.5rem' }}>
											<h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
												URL Parameters Breakdown
											</h4>
											<div style={{ display: 'grid', gap: '0.75rem' }}>
												{pingOneConfig &&
													pkceCodes &&
													[
														{
															param: 'client_id',
															value: pingOneConfig.clientId,
															desc: 'Your application identifier',
														},
														{
															param: 'redirect_uri',
															value: pingOneConfig.redirectUri,
															desc: 'Where to send the authorization code',
														},
														{
															param: 'scope',
															value: 'openid profile email',
															desc: 'Permissions being requested',
														},
														{
															param: 'code_challenge',
															value: pkceCodes.codeChallenge,
															desc: 'PKCE challenge for security',
														},
														{
															param: 'code_challenge_method',
															value: 'S256',
															desc: 'SHA256 hashing method',
														},
													].map((item, index) => (
														<div
															key={index}
															style={{
																display: 'flex',
																alignItems: 'center',
																gap: '1rem',
																padding: '0.75rem',
																backgroundColor: '#f8fafc',
																borderRadius: '6px',
																border: '1px solid #e2e8f0',
															}}
														>
															<code
																style={{
																	fontSize: '0.875rem',
																	fontWeight: '600',
																	color: '#1e40af',
																	minWidth: '120px',
																}}
															>
																{item.param}
															</code>
															<div style={{ flex: 1 }}>
																<div
																	style={{
																		fontSize: '0.875rem',
																		fontFamily: 'monospace',
																		wordBreak: 'break-all',
																		marginBottom: '0.25rem',
																	}}
																>
																	{item.value.length > 50
																		? `${item.value.substring(0, 50)}...`
																		: item.value}
																</div>
																<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
																	{item.desc}
																</div>
															</div>
															<Button
																variant="secondary"
																onClick={() => copyToClipboard(item.value, item.param)}
																style={{ padding: '0.5rem' }}
															>
																<FiCopy size={14} />
															</Button>
														</div>
													))}
											</div>
										</div>

										<div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
											<Button
												variant="secondary"
												onClick={generateAuthUrl}
												style={{
													padding: '0.5rem 1rem',
													fontSize: '0.875rem',
												}}
											>
												Regenerate URL
											</Button>
											<Button
												variant="primary"
												onClick={() => setCurrentEducationalStep(4)}
												style={{
													padding: '0.5rem 1rem',
													fontSize: '0.875rem',
												}}
											>
												Continue to Authorization
											</Button>
										</div>
									</div>
								)}
							</div>

							<CollapsibleSection>
								<SectionToggle onClick={() => toggleSection('url-parameters')}>
									<ExplanationTitle>
										<FiShield />
										Understanding URL Parameters
									</ExplanationTitle>
									{collapsedSections['url-parameters'] ? <FiChevronDown /> : <FiChevronUp />}
								</SectionToggle>
								<SectionContent $collapsed={collapsedSections['url-parameters']}>
									<p style={{ marginBottom: '1rem' }}>
										Each parameter in the authorization URL serves a specific security or functional
										purpose:
									</p>

									<div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
										<div
											style={{
												background: '#eff6ff',
												border: '1px solid #bfdbfe',
												borderRadius: '8px',
												padding: '1rem',
											}}
										>
											<h4 style={{ color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>
												🔐 Security Parameters
											</h4>
											<ul style={{ fontSize: '0.875rem', margin: 0, color: '#1e40af' }}>
												<li>
													<strong>state:</strong> CSRF protection - random unguessable value
												</li>
												<li>
													<strong>code_challenge:</strong> PKCE challenge prevents code interception
												</li>
												<li>
													<strong>code_challenge_method:</strong> Always "S256" for SHA256 hashing
												</li>
											</ul>
										</div>

										<div
											style={{
												background: '#f0fdf4',
												border: '1px solid #bbf7d0',
												borderRadius: '8px',
												padding: '1rem',
											}}
										>
											<h4 style={{ color: '#166534', fontWeight: '600', marginBottom: '0.5rem' }}>
												�� Functional Parameters
											</h4>
											<ul style={{ fontSize: '0.875rem', margin: 0, color: '#166534' }}>
												<li>
													<strong>response_type:</strong> "code" for Authorization Code flow
												</li>
												<li>
													<strong>client_id:</strong> Identifies your application to PingOne
												</li>
												<li>
													<strong>redirect_uri:</strong> Where to send the authorization code
												</li>
												<li>
													<strong>scope:</strong> Permissions your app is requesting
												</li>
											</ul>
										</div>
									</div>

									<div style={{ marginTop: '1.5rem' }}>
										<h4 style={{ color: '#16a34a', fontWeight: '600', marginBottom: '0.5rem' }}>
											🎯 Best Practices
										</h4>
										<ul
											style={{
												fontSize: '0.875rem',
												listStyle: 'disc',
												listStylePosition: 'inside',
												margin: '0 0 1rem 1rem',
											}}
										>
											<li>Always use HTTPS for authorization URLs</li>
											<li>Generate a new state parameter for each request</li>
											<li>Validate redirect_uri matches your registered URIs</li>
											<li>Use specific scopes - request only what you need</li>
											<li>Store state and code_verifier securely until callback</li>
										</ul>
									</div>
								</SectionContent>
							</CollapsibleSection>
						</StepContent>
					</>
				);

			default:
				return (
					<>
						{' '}
						<StepHeader>
							<StepHeaderTitle>Interactive OAuth Flow</StepHeaderTitle>
							<StepHeaderSubtitle>
								Experience the complete OAuth 2.0 Authorization Code Flow
							</StepHeaderSubtitle>
						</StepHeader>
						<StepContent>
							<div style={{ textAlign: 'center', padding: '3rem' }}>
								<FiPlay size={48} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
								<h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
									Ready to Experience OAuth?
								</h3>
								<p style={{ color: '#6b7280', marginBottom: '2rem' }}>
									Use the navigation below to explore the OAuth flow step by step, or click the
									button below to start the interactive flow.
								</p>
								<Button variant="primary">
									<FiPlay />
									Start OAuth Flow
								</Button>
							</div>
						</StepContent>
					</>
				);
		}
	};

	return (
		<PageContainer>
			<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
				<EducationalCard>{renderEducationalContent()}</EducationalCard>

				{/* Step Navigation */}
				<StepNavigation>
					<StepIndicator>
						{[1, 2, 3, 4, 5, 6, 7].map((step) => (
							<StepDot
								key={step}
								$active={step === currentEducationalStep}
								$completed={step < currentEducationalStep}
							/>
						))}
					</StepIndicator>
					<div style={{ display: 'flex', gap: '0.5rem' }}>
						<Button
							variant="secondary"
							onClick={previousEducationalStep}
							disabled={currentEducationalStep === 1}
						>
							<FiChevronLeft />
							Previous
						</Button>
						<Button
							variant="primary"
							onClick={nextEducationalStep}
							disabled={currentEducationalStep === 7}
						>
							Next
							<FiChevronRight />
						</Button>
					</div>
				</StepNavigation>
			</div>
		</PageContainer>
	);
};

export default AuthzV4NewWindsurfFlow;
