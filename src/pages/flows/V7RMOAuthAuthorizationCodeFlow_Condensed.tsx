// Mock: Condensed V7 Authorization Code Flow - 4 Section Structure
import React, { useState } from 'react';
import {
	FiBook,
	FiCheckCircle,
	FiChevronDown,
	FiInfo,
	FiSettings,
	FiShield,
	FiTarget,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import UltimateTokenDisplay from '../../components/UltimateTokenDisplay';

const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const VariantSelector = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	padding: 1rem;
	background: #f8fafc;
	border-radius: 0.75rem;
`;

const VariantButton = styled.button<{ $selected: boolean }>`
	padding: 1rem 2rem;
	border: 2px solid ${(props) => (props.$selected ? '#3b82f6' : '#e2e8f0')};
	background: ${(props) => (props.$selected ? '#3b82f6' : 'white')};
	color: ${(props) => (props.$selected ? 'white' : '#64748b')};
	border-radius: 0.5rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
`;

const Section = styled.section<{ $expanded?: boolean }>`
	border: 1px solid #e2e8f0;
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	overflow: hidden;
`;

const SectionHeader = styled.div<{ $color: string; $expanded?: boolean }>`
	background: ${(props) => props.$color};
	color: white;
	padding: 1rem 1.5rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	cursor: ${(props) => (props.$expanded !== undefined ? 'pointer' : 'default')};
	font-weight: 600;
`;

const SectionContent = styled.div<{ $show: boolean }>`
	display: ${(props) => (props.$show ? 'block' : 'none')};
	padding: 1.5rem;
`;

const QuickInfoGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1rem;
	margin-bottom: 1.5rem;
`;

const InfoCard = styled.div<{ $variant: 'success' | 'warning' | 'info' }>`
	padding: 1rem;
	border-radius: 0.5rem;
	border-left: 4px solid ${(props) =>
		props.$variant === 'success'
			? '#10b981'
			: props.$variant === 'warning'
				? '#f59e0b'
				: '#3b82f6'};
	background: ${(props) =>
		props.$variant === 'success'
			? '#ecfdf5'
			: props.$variant === 'warning'
				? '#fffbeb'
				: '#eff6ff'};
`;

const ComparisonTable = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin: 1rem 0;
`;

const ComparisonCard = styled.div<{ $active: boolean }>`
	padding: 1rem;
	border: 2px solid ${(props) => (props.$active ? '#3b82f6' : '#e2e8f0')};
	border-radius: 0.5rem;
	background: ${(props) => (props.$active ? '#eff6ff' : 'white')};
`;

const StepIndicator = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-bottom: 1rem;
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.875rem;
	font-weight: 600;
	background: ${(props) => (props.$completed ? '#10b981' : props.$active ? '#3b82f6' : '#e2e8f0')};
	color: ${(props) => (props.$active || props.$completed ? 'white' : '#64748b')};
`;

const MockCredentialsForm = styled.div`
	display: grid;
	gap: 1rem;
	margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Label = styled.label`
	font-weight: 500;
	color: #374151;
`;

const Input = styled.input`
	padding: 0.75rem;
	border: 1px solid #d1d5db;
	border-radius: 0.375rem;
	font-size: 0.875rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 0.375rem;
	font-weight: 500;
	cursor: pointer;
	background: ${(props) => (props.$variant === 'secondary' ? '#6b7280' : '#3b82f6')};
	color: white;
	transition: all 0.2s;
	
	&:hover {
		background: ${(props) => (props.$variant === 'secondary' ? '#4b5563' : '#2563eb')};
	}
`;

const OAuthAuthorizationCodeFlowV7_Condensed_Mock = () => {
	const [selectedVariant, setSelectedVariant] = useState<'oauth' | 'oidc'>('oauth');
	const [expandedSections, setExpandedSections] = useState({
		quickStart: true,
		configuration: true,
		execution: false,
		results: false,
	});
	const [currentStep, setCurrentStep] = useState(0);
	const [hasTokens, setHasTokens] = useState(false);

	const toggleSection = (section: keyof typeof expandedSections) => {
		setExpandedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	const simulateFlow = () => {
		setCurrentStep(1);
		setExpandedSections((prev) => ({ ...prev, execution: true }));

		// Simulate token reception after 2 seconds
		setTimeout(() => {
			setHasTokens(true);
			setExpandedSections((prev) => ({ ...prev, results: true }));
		}, 2000);
	};

	return (
		<Container>
			<h1>🎯 Condensed V7 Authorization Code Flow (Mock)</h1>
			<p style={{ color: '#6b7280', marginBottom: '2rem' }}>
				This mock shows the proposed 4-section condensed structure vs the current 12+ section
				approach.
			</p>

			{/* Variant Selector - Always Visible */}
			<VariantSelector>
				<VariantButton
					$selected={selectedVariant === 'oauth'}
					onClick={() => setSelectedVariant('oauth')}
				>
					OAuth 2.0 Authorization Code
				</VariantButton>
				<VariantButton
					$selected={selectedVariant === 'oidc'}
					onClick={() => setSelectedVariant('oidc')}
				>
					OpenID Connect Authorization Code
				</VariantButton>
			</VariantSelector>

			{/* 1. QUICK START & OVERVIEW - Always Expanded */}
			<Section $expanded={true}>
				<SectionHeader $color="#10b981" $expanded={true}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiBook />📚 Quick Start & Overview
					</div>
				</SectionHeader>
				<SectionContent $show={true}>
					<QuickInfoGrid>
						<InfoCard $variant="info">
							<h4>What You'll Get</h4>
							<p>
								{selectedVariant === 'oidc'
									? '🎯 User authentication + API authorization with ID token and access token'
									: '🔑 API authorization with access token (PingOne requires openid scope)'}
							</p>
						</InfoCard>
						<InfoCard $variant="success">
							<h4>Perfect For</h4>
							<ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
								<li>Web apps with secure backends</li>
								<li>SPAs using PKCE</li>
								<li>Apps needing refresh tokens</li>
							</ul>
						</InfoCard>
					</QuickInfoGrid>

					<ComparisonTable>
						<ComparisonCard $active={selectedVariant === 'oauth'}>
							<h4>OAuth 2.0 Mode</h4>
							<p>
								<strong>Tokens:</strong> Access + Refresh
							</p>
							<p>
								<strong>Purpose:</strong> API access only
							</p>
							<p>
								<strong>PingOne:</strong> Requires openid scope
							</p>
						</ComparisonCard>
						<ComparisonCard $active={selectedVariant === 'oidc'}>
							<h4>OpenID Connect Mode</h4>
							<p>
								<strong>Tokens:</strong> Access + ID + Refresh
							</p>
							<p>
								<strong>Purpose:</strong> Authentication + API access
							</p>
							<p>
								<strong>Standard:</strong> Requires openid scope
							</p>
						</ComparisonCard>
					</ComparisonTable>
				</SectionContent>
			</Section>

			{/* 2. CONFIGURATION & SETUP */}
			<Section>
				<SectionHeader
					$color="#3b82f6"
					$expanded={expandedSections.configuration}
					onClick={() => toggleSection('configuration')}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiSettings />🔧 Configuration & Setup
					</div>
					<FiChevronDown
						style={{
							transform: expandedSections.configuration ? 'rotate(180deg)' : 'rotate(0deg)',
							transition: 'transform 0.2s',
						}}
					/>
				</SectionHeader>
				<SectionContent $show={expandedSections.configuration}>
					<MockCredentialsForm>
						<FormGroup>
							<Label>Environment ID</Label>
							<Input placeholder="12345678-1234-1234-1234-123456789012" />
						</FormGroup>
						<FormGroup>
							<Label>Client ID</Label>
							<Input placeholder="abcd1234-5678-90ef-ghij-klmnopqrstuv" />
						</FormGroup>
						<FormGroup>
							<Label>Client Secret</Label>
							<Input type="password" placeholder="••••••••••••••••••••••••••••••••" />
						</FormGroup>
						<FormGroup>
							<Label>Scopes (PingOne requires openid for both variants)</Label>
							<Input
								value={selectedVariant === 'oidc' ? 'openid profile email' : 'openid read write'}
								readOnly
							/>
						</FormGroup>
					</MockCredentialsForm>

					<InfoCard $variant="warning">
						<h4>💡 Advanced Options</h4>
						<p>
							PKCE, custom parameters, and response modes are auto-configured based on your variant
							selection.
						</p>
					</InfoCard>
				</SectionContent>
			</Section>

			{/* 3. FLOW EXECUTION - Interactive Steps */}
			<Section>
				<SectionHeader
					$color="#f59e0b"
					$expanded={expandedSections.execution}
					onClick={() => toggleSection('execution')}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiZap />🚀 Flow Execution
					</div>
					<FiChevronDown
						style={{
							transform: expandedSections.execution ? 'rotate(180deg)' : 'rotate(0deg)',
							transition: 'transform 0.2s',
						}}
					/>
				</SectionHeader>
				<SectionContent $show={expandedSections.execution}>
					<StepIndicator>
						<Step $active={currentStep === 0} $completed={currentStep > 0}>
							1
						</Step>
						<Step $active={currentStep === 1} $completed={currentStep > 1}>
							2
						</Step>
						<Step $active={currentStep === 2} $completed={currentStep > 2}>
							3
						</Step>
					</StepIndicator>

					{currentStep === 0 && (
						<div>
							<h4>Step 1: Generate Authorization URL</h4>
							<p>We'll create the authorization URL with PKCE codes and redirect you to PingOne.</p>
							<Button onClick={simulateFlow}>🚀 Start Authorization Flow</Button>
						</div>
					)}

					{currentStep === 1 && (
						<div>
							<h4>Step 2: User Authorization (In Progress...)</h4>
							<p>User is being redirected to PingOne for authentication...</p>
							<div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '0.5rem' }}>
								🔄 Waiting for authorization callback...
							</div>
						</div>
					)}

					{hasTokens && (
						<div>
							<h4>Step 3: Token Exchange Complete!</h4>
							<p>Successfully exchanged authorization code for tokens.</p>
							<div
								style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#10b981' }}
							>
								<FiCheckCircle />
								Flow completed successfully
							</div>
						</div>
					)}
				</SectionContent>
			</Section>

			{/* 4. RESULTS & ANALYSIS */}
			<Section>
				<SectionHeader
					$color="#8b5cf6"
					$expanded={expandedSections.results}
					onClick={() => toggleSection('results')}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiTarget />🎯 Results & Analysis
					</div>
					<FiChevronDown
						style={{
							transform: expandedSections.results ? 'rotate(180deg)' : 'rotate(0deg)',
							transition: 'transform 0.2s',
						}}
					/>
				</SectionHeader>
				<SectionContent $show={expandedSections.results}>
					{hasTokens ? (
						<>
							<UltimateTokenDisplay
								tokens={{
									access_token:
										'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRlZmF1bHQifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjIsImF1ZCI6InRlc3QtYXVkaWVuY2UiLCJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20ifQ.mock_signature_for_demo_purposes_only',
									...(selectedVariant === 'oidc' && {
										id_token:
											'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImRlZmF1bHQifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQyNjIyLCJhdWQiOiJ0ZXN0LWF1ZGllbmNlIiwiaXNzIjoiaHR0cHM6Ly9hdXRoLnBpbmdvbmUuY29tIn0.mock_id_token_signature',
									}),
									refresh_token: 'rt_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
								}}
								flowType={selectedVariant === 'oidc' ? 'oidc' : 'oauth'}
								flowKey="condensed-mock-v7"
								displayMode="compact"
								title={
									selectedVariant === 'oidc' ? '🎉 OpenID Connect Tokens' : '🎉 OAuth 2.0 Tokens'
								}
								subtitle={
									selectedVariant === 'oidc'
										? 'ID token, access token, and refresh token from Authorization Code flow'
										: 'Access token and refresh token from Authorization Code flow'
								}
								showCopyButtons={true}
								showDecodeButtons={true}
								showMaskToggle={true}
								showTokenManagement={false}
								defaultMasked={false}
							/>

							<QuickInfoGrid>
								<InfoCard $variant="success">
									<h4>🔒 Security Notes</h4>
									<p>
										✅ PKCE protection enabled
										<br />✅ Secure token storage
										<br />✅ Proper scope validation
									</p>
								</InfoCard>
								<InfoCard $variant="info">
									<h4>🚀 Next Steps</h4>
									<p>
										• Use access token for API calls
										<br />• Store refresh token securely
										<br />• Implement token refresh logic
									</p>
								</InfoCard>
							</QuickInfoGrid>
						</>
					) : (
						<InfoCard $variant="warning">
							<h4>⏳ Complete the flow to see results</h4>
							<p>
								Token analysis and security insights will appear here once you complete the
								authorization flow.
							</p>
						</InfoCard>
					)}
				</SectionContent>
			</Section>

			{/* Compact Footer */}
			<div
				style={{
					marginTop: '2rem',
					padding: '1rem',
					background: '#f8fafc',
					borderRadius: '0.5rem',
					fontSize: '0.875rem',
					color: '#6b7280',
				}}
			>
				<strong>📊 Benefits of Condensed Structure:</strong>
				<ul style={{ margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
					<li>4 clear sections vs 12+ scattered sections</li>
					<li>Logical flow: Overview → Setup → Execute → Results</li>
					<li>Progressive disclosure based on user progress</li>
					<li>Mobile-friendly with fewer sections to navigate</li>
					<li>All educational content preserved, just better organized</li>
				</ul>
			</div>
		</Container>
	);
};

export default OAuthAuthorizationCodeFlowV7_Condensed_Mock;
