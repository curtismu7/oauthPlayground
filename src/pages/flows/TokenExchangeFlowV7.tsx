// src/pages/flows/TokenExchangeFlowV7.tsx
// V7 OAuth 2.0 Token Exchange Flow - RFC 8693 Implementation for A2A Security

import React, { useState, useCallback, useEffect } from 'react';
import {
	FiArrowRight,
	FiShield,
	FiKey,
	FiUsers,
	FiServer,
	FiCheckCircle,
	FiAlertCircle,
	FiInfo,
	FiRefreshCw,
	FiCopy,
	FiExternalLink,
	FiChevronDown,
	FiLock,
	FiGlobe,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import { usePageScroll } from '../../hooks/usePageScroll';
import { v4ToastManager } from '../../utils/v4ToastMessages';

type TokenExchangeScenario = 'delegation' | 'impersonation' | 'scope-reduction' | 'audience-restriction';

const Container = styled.div`
	min-height: 100vh;
	background-color: #f9fafb;
	padding: 2rem 0 6rem;
`;

const ContentWrapper = styled.div`
	max-width: 64rem;
	margin: 0 auto;
	padding: 0 1rem;
`;

const MainCard = styled.div`
	background-color: #ffffff;
	border-radius: 1rem;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
	border: 1px solid #e2e8f0;
	overflow: hidden;
`;

const Header = styled.div`
	background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
	color: #ffffff;
	padding: 2rem;
	text-align: center;
`;

const VersionBadge = styled.span`
	background: rgba(124, 58, 237, 0.2);
	border: 1px solid #a855f7;
	color: #e9d5ff;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	margin-bottom: 1rem;
	display: inline-block;
`;

const Title = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
	font-size: 1.125rem;
	color: rgba(255, 255, 255, 0.9);
	margin: 0;
`;

const ContentSection = styled.div`
	padding: 2rem;
`;

const ScenarioSelector = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
	margin: 2rem 0;
`;

const ScenarioCard = styled.button<{ $selected: boolean }>`
	padding: 1.5rem;
	border: 2px solid ${({ $selected }) => ($selected ? '#7c3aed' : '#e2e8f0')};
	border-radius: 0.75rem;
	background: ${({ $selected }) => ($selected ? '#f3f4f6' : '#ffffff')};
	cursor: pointer;
	transition: all 0.2s ease;
	text-align: left;

	&:hover {
		border-color: #7c3aed;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
	}
`;

const ScenarioIcon = styled.div`
	font-size: 1.5rem;
	color: #7c3aed;
	margin-bottom: 0.75rem;
`;

const ScenarioTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 0.5rem 0;
`;

const ScenarioDescription = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0;
	line-height: 1.5;
`;



// Additional styled components for the flow
const InfoBox = styled.div<{ $variant?: 'info' | 'warning' | 'success' | 'error' }>`
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin: 1.5rem 0;
	display: flex;
	gap: 1rem;
	align-items: flex-start;
	border: 1px solid
		${({ $variant }) => {
			if ($variant === 'warning') return '#f59e0b';
			if ($variant === 'success') return '#22c55e';
			if ($variant === 'error') return '#ef4444';
			return '#3b82f6';
		}};
	background-color:
		${({ $variant }) => {
			if ($variant === 'warning') return '#fef3c7';
			if ($variant === 'success') return '#dcfce7';
			if ($variant === 'error') return '#fee2e2';
			return '#dbeafe';
		}};
`;

const InfoTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #0f172a;
	margin: 0 0 0.5rem 0;
`;

const InfoText = styled.p`
	font-size: 0.95rem;
	color: #3f3f46;
	line-height: 1.7;
	margin: 0;
`;

const CollapsibleSection = styled.section`
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	background-color: #ffffff;
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
`;

const CollapsibleHeaderButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	padding: 1.5rem 1.75rem;
	background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
	border: none;
	border-radius: 0.75rem;
	cursor: pointer;
	font-size: 1.1rem;
	font-weight: 600;
	color: #374151;
	transition: background 0.2s ease;
	line-height: 1.4;
	min-height: 72px;
	gap: 0.75rem;

	&:hover {
		background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
	}
`;

const CollapsibleTitle = styled.span`
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
	padding-top: 0;
`;

const CodeBlock = styled.pre`
	background: #1f2937;
	color: #f9fafb;
	padding: 1.5rem;
	border-radius: 0.5rem;
	overflow-x: auto;
	font-size: 0.875rem;
	line-height: 1.5;
	margin: 1rem 0;
`;

const StepIndicator = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
	margin: 2rem 0;
	padding: 1rem;
	background: #f8fafc;
	border-radius: 0.5rem;
	border: 1px solid #e2e8f0;
`;

const StepNumber = styled.div`
	width: 2rem;
	height: 2rem;
	background: #7c3aed;
	color: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 0.875rem;
`;

const StepContent = styled.div`
	flex: 1;
`;

const StepTitle = styled.h4`
	font-size: 1rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 0.25rem 0;
`;

const StepDescription = styled.p`
	font-size: 0.875rem;
	color: #6b7280;
	margin: 0;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	border: none;
	
	${({ $variant }) =>
		$variant === 'primary'
			? `
				background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
				color: white;
				&:hover {
					transform: translateY(-1px);
					box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
				}
			`
			: `
				background: #f3f4f6;
				color: #374151;
				border: 1px solid #d1d5db;
				&:hover {
					background: #e5e7eb;
				}
			`}
`;

// Enhanced component with detailed flow implementation
const TokenExchangeFlowV7Enhanced: React.FC = () => {
	usePageScroll({ pageName: 'Token Exchange Flow V7', force: true });
	
	const [selectedScenario, setSelectedScenario] = useState<TokenExchangeScenario>('audience-restriction');
	const [currentStep, setCurrentStep] = useState(0);
	const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
	const [subjectToken, setSubjectToken] = useState('');
	const [exchangedToken, setExchangedToken] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const scenarios = {
		delegation: {
			icon: <FiUsers />,
			title: 'User Delegation',
			description: 'Exchange user token for service-specific token with reduced scope',
			useCase: 'User authorizes app to call downstream service on their behalf',
			grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
			subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
			requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
			audience: 'https://api.downstream-service.com',
			scope: 'read:profile read:data'
		},
		impersonation: {
			icon: <FiShield />,
			title: 'Service Impersonation', 
			description: 'Service acts on behalf of user with limited permissions',
			useCase: 'Backend service needs to call API as if it were the user',
			grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
			subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
			requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
			audience: 'https://api.internal-service.com',
			scope: 'impersonate:user read:limited'
		},
		'scope-reduction': {
			icon: <FiLock />,
			title: 'Scope Reduction',
			description: 'Reduce token scope for principle of least privilege',
			useCase: 'Limit permissions when calling specific microservices',
			grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
			subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
			requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
			audience: 'https://api.microservice.com',
			scope: 'read:public'
		},
		'audience-restriction': {
			icon: <FiServer />,
			title: 'CBA MCP/A2A Scenario',
			description: 'Create audience-specific tokens for CBA MCP/A2A communication',
			useCase: 'Generate tokens specifically for CBA MCP/A2A scenarios with scope reduction',
			grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
			subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
			requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
			audience: 'https://mcp.cba.com.au',
			scope: 'mcp:read mcp:write a2a:communicate banking:limited'
		}
	};

	const toggleSection = useCallback((section: string) => {
		setCollapsedSections(prev => ({
			...prev,
			[section]: !prev[section]
		}));
	}, []);

	const handleScenarioChange = useCallback((scenario: TokenExchangeScenario) => {
		setSelectedScenario(scenario);
		setCurrentStep(0);
		setSubjectToken('');
		setExchangedToken('');
		v4ToastManager.showSuccess(`Selected ${scenarios[scenario].title} scenario`);
	}, []);

	const simulateTokenExchange = useCallback(async () => {
		setIsLoading(true);
		
		// Simulate API call delay
		await new Promise(resolve => setTimeout(resolve, 2000));
		
		const scenario = scenarios[selectedScenario];
		
		// Mock exchanged token
		const mockExchangedToken = {
			access_token: `exchanged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			token_type: 'Bearer',
			expires_in: 3600,
			scope: scenario.scope,
			audience: scenario.audience,
			issued_token_type: scenario.requestedTokenType
		};
		
		setExchangedToken(JSON.stringify(mockExchangedToken, null, 2));
		setIsLoading(false);
		v4ToastManager.showSuccess('Token exchange completed successfully!');
	}, [selectedScenario]);

	const currentScenario = scenarios[selectedScenario];

	const renderScenarioDetails = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton onClick={() => toggleSection('details')}>
				<CollapsibleTitle>
					<FiInfo /> {currentScenario.title} - Implementation Details
				</CollapsibleTitle>
				<FiChevronDown />
			</CollapsibleHeaderButton>
			{!collapsedSections.details && (
				<CollapsibleContent>
					<InfoBox $variant="info">
						<FiInfo size={20} />
						<div>
							<InfoTitle>Use Case: {currentScenario.useCase}</InfoTitle>
							<InfoText>{currentScenario.description}</InfoText>
						</div>
					</InfoBox>
					
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
						<div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
							<strong style={{ color: '#7c3aed' }}>Grant Type:</strong><br/>
							<code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{currentScenario.grantType}</code>
						</div>
						<div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
							<strong style={{ color: '#7c3aed' }}>Audience:</strong><br/>
							<code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{currentScenario.audience}</code>
						</div>
						<div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
							<strong style={{ color: '#7c3aed' }}>Requested Scope:</strong><br/>
							<code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{currentScenario.scope}</code>
						</div>
					</div>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderTokenExchangeRequest = () => (
		<CollapsibleSection>
			<CollapsibleHeaderButton onClick={() => toggleSection('request')}>
				<CollapsibleTitle>
					<FiZap /> Token Exchange Request (RFC 8693)
				</CollapsibleTitle>
				<FiChevronDown />
			</CollapsibleHeaderButton>
			{!collapsedSections.request && (
				<CollapsibleContent>
					<InfoBox $variant="warning">
						<FiAlertCircle size={20} />
						<div>
							<InfoTitle>CBA Security Profile Implementation</InfoTitle>
							<InfoText>
								This demonstrates how CBA can implement token exchange for A2A scenarios with scope reduction 
								and audience restriction, following OAuth 2.0 security best practices. This approach enables:
								<br/><br/>
								• <strong>Zero Trust Architecture:</strong> Each service gets minimal required permissions<br/>
								• <strong>Audit Trail:</strong> Complete visibility into token exchanges and usage<br/>
								• <strong>Compliance:</strong> Meets banking regulatory requirements for access control<br/>
								• <strong>Scalability:</strong> Supports complex microservices architectures
							</InfoText>
						</div>
					</InfoBox>

					<div style={{ 
						display: 'grid', 
						gridTemplateColumns: '1fr auto 1fr', 
						gap: '1rem', 
						alignItems: 'center',
						margin: '1.5rem 0',
						padding: '1rem',
						background: '#f8fafc',
						borderRadius: '0.5rem',
						border: '1px solid #e2e8f0'
					}}>
						<div style={{ textAlign: 'center' }}>
							<div style={{ 
								padding: '1rem', 
								background: '#dbeafe', 
								borderRadius: '0.5rem',
								border: '1px solid #3b82f6'
							}}>
								<FiKey size={24} style={{ color: '#3b82f6', marginBottom: '0.5rem' }} />
								<div style={{ fontWeight: '600', color: '#1e40af' }}>Original Token</div>
								<div style={{ fontSize: '0.75rem', color: '#3730a3' }}>
									Broad scope<br/>
									Multiple audiences
								</div>
							</div>
						</div>
						<div style={{ textAlign: 'center' }}>
							<FiArrowRight size={32} style={{ color: '#7c3aed' }} />
							<div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: '600', marginTop: '0.25rem' }}>
								Token Exchange
							</div>
						</div>
						<div style={{ textAlign: 'center' }}>
							<div style={{ 
								padding: '1rem', 
								background: '#dcfce7', 
								borderRadius: '0.5rem',
								border: '1px solid #22c55e'
							}}>
								<FiShield size={24} style={{ color: '#22c55e', marginBottom: '0.5rem' }} />
								<div style={{ fontWeight: '600', color: '#15803d' }}>Exchanged Token</div>
								<div style={{ fontSize: '0.75rem', color: '#166534' }}>
									Reduced scope<br/>
									Specific audience
								</div>
							</div>
						</div>
					</div>

					<CodeBlock>
{`POST /oauth/token HTTP/1.1
Host: auth.cba.com.au
Content-Type: application/x-www-form-urlencoded
Authorization: Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=

grant_type=${encodeURIComponent(currentScenario.grantType)}&
subject_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...&
subject_token_type=${encodeURIComponent(currentScenario.subjectTokenType)}&
requested_token_type=${encodeURIComponent(currentScenario.requestedTokenType)}&
audience=${encodeURIComponent(currentScenario.audience)}&
scope=${encodeURIComponent(currentScenario.scope)}`}
					</CodeBlock>

					<div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
						<Button $variant="primary" onClick={simulateTokenExchange} disabled={isLoading}>
							{isLoading ? <FiRefreshCw className="animate-spin" /> : <FiZap />}
							{isLoading ? 'Exchanging Token...' : 'Simulate Token Exchange'}
						</Button>
					</div>
				</CollapsibleContent>
			)}
		</CollapsibleSection>
	);

	const renderTokenExchangeResponse = () => {
		if (!exchangedToken) return null;

		return (
			<CollapsibleSection>
				<CollapsibleHeaderButton onClick={() => toggleSection('response')}>
					<CollapsibleTitle>
						<FiCheckCircle /> Token Exchange Response
					</CollapsibleTitle>
					<FiChevronDown />
				</CollapsibleHeaderButton>
				{!collapsedSections.response && (
					<CollapsibleContent>
						<InfoBox $variant="success">
							<FiCheckCircle size={20} />
							<div>
								<InfoTitle>Token Exchange Successful</InfoTitle>
								<InfoText>
									New token issued with reduced scope and audience restriction for secure A2A communication.
								</InfoText>
							</div>
						</InfoBox>

						<CodeBlock>{exchangedToken}</CodeBlock>

						<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
							<InfoBox $variant="success">
								<FiShield size={20} />
								<div>
									<InfoTitle>Security Benefits</InfoTitle>
									<InfoText>
										• <strong>Scope Reduction:</strong> Token has minimal required permissions<br/>
										• <strong>Audience Restriction:</strong> Token only valid for specific service<br/>
										• <strong>Time-bound:</strong> Short expiration reduces exposure window<br/>
										• <strong>Traceable:</strong> Clear audit trail of token exchanges
									</InfoText>
								</div>
							</InfoBox>
							<InfoBox $variant="info">
								<FiLock size={20} />
								<div>
									<InfoTitle>Banking Compliance</InfoTitle>
									<InfoText>
										• <strong>PCI DSS:</strong> Supports tokenization requirements<br/>
										• <strong>APRA CPS 234:</strong> Meets information security standards<br/>
										• <strong>Privacy Act:</strong> Enables data minimization principles<br/>
										• <strong>ACCC CDR:</strong> Supports Consumer Data Right architecture
									</InfoText>
								</div>
							</InfoBox>
						</div>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		);
	};

	return (
		<Container>
			<ContentWrapper>
				<MainCard>
					<Header>
						<VersionBadge>V7.0 - RFC 8693</VersionBadge>
						<Title>OAuth 2.0 Token Exchange</Title>
						<Subtitle>Secure A2A Communication with Scope Reduction & Audience Restriction</Subtitle>
					</Header>

					<ContentSection>
						<div style={{ textAlign: 'center', marginBottom: '2rem' }}>
							<h2 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Choose Your Token Exchange Scenario</h2>
							<p style={{ color: '#6b7280', margin: 0 }}>
								Select the use case that best matches your A2A security requirements
							</p>
						</div>

						<ScenarioSelector>
							{Object.entries(scenarios).map(([key, scenario]) => (
								<ScenarioCard
									key={key}
									$selected={selectedScenario === key}
									onClick={() => handleScenarioChange(key as TokenExchangeScenario)}
								>
									<ScenarioIcon>{scenario.icon}</ScenarioIcon>
									<ScenarioTitle>{scenario.title}</ScenarioTitle>
									<ScenarioDescription>{scenario.description}</ScenarioDescription>
									<div style={{ 
										marginTop: '0.75rem', 
										fontSize: '0.75rem', 
										color: '#7c3aed',
										fontWeight: '600'
									}}>
										{scenario.useCase}
									</div>
								</ScenarioCard>
							))}
						</ScenarioSelector>

						{renderScenarioDetails()}
						{renderTokenExchangeRequest()}
						{renderTokenExchangeResponse()}

						<CollapsibleSection>
							<CollapsibleHeaderButton onClick={() => toggleSection('resources')}>
								<CollapsibleTitle>
									<FiExternalLink /> Additional Resources
								</CollapsibleTitle>
								<FiChevronDown />
							</CollapsibleHeaderButton>
							{!collapsedSections.resources && (
								<CollapsibleContent>
									<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
										<InfoBox $variant="info">
											<FiGlobe size={20} />
											<div>
												<InfoTitle>RFC 8693 Specification</InfoTitle>
												<InfoText>
													<a href="https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/" 
													   target="_blank" rel="noopener noreferrer"
													   style={{ color: '#7c3aed', textDecoration: 'none' }}>
														OAuth 2.0 Token Exchange Specification
													</a>
												</InfoText>
											</div>
										</InfoBox>
										<InfoBox $variant="success">
											<FiServer size={20} />
											<div>
												<InfoTitle>A2A Implementation Guide</InfoTitle>
												<InfoText>
													<a href="https://blog.christianposta.com/setting-up-a2a-oauth-user-delegation/" 
													   target="_blank" rel="noopener noreferrer"
													   style={{ color: '#7c3aed', textDecoration: 'none' }}>
														Setting up A2A OAuth User Delegation
													</a>
												</InfoText>
											</div>
										</InfoBox>
									</div>
								</CollapsibleContent>
							)}
						</CollapsibleSection>
					</ContentSection>
				</MainCard>
			</ContentWrapper>
		</Container>
	);
};

export default TokenExchangeFlowV7Enhanced;