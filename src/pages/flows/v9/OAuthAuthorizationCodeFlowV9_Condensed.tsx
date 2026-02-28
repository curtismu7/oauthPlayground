// src/pages/flows/v9/OAuthAuthorizationCodeFlowV9_Condensed.tsx
// V9 Condensed Authorization Code Flow - Enhanced Architecture with V9 Standards

import React, { useCallback, useState } from 'react';
import {
	FiBook,
	FiCheckCircle,
	FiChevronDown,
	FiKey,
	FiSettings,
	FiTarget,
	FiZap,
} from 'react-icons/fi';
import styled from 'styled-components';
import { StandardizedCredentialExportImport } from '../../../components/StandardizedCredentialExportImport';
import UltimateTokenDisplay from '../../../components/UltimateTokenDisplay';
import { usePageScroll } from '../../../hooks/usePageScroll';
// V9 specific imports
import { V9FlowCredentialService } from '../../../services/v9/core/V9FlowCredentialService';
import { EnvironmentIdServiceV8 } from '../../../services/v9/environmentIdServiceV9';
import WorkerTokenStatusDisplayV8 from '../../../v8/components/WorkerTokenStatusDisplayV8';
import { toastV8 } from '../../../v8/utils/toastNotificationsV8';

// V9 Color Standards - Approved Colors Only: Red, Blue, Black, White
const V9_COLORS = {
	PRIMARY_BLUE: '#2563eb',
	DARK_BLUE: '#1e40af',
	DARKEST_BLUE: '#1e3a8a',
	LIGHT_BLUE_BG: '#eff6ff',
	LIGHTER_BLUE_BG: '#dbeafe',
	RED: '#dc2626',
	BLACK: '#000000',
	WHITE: '#ffffff',
	BORDER: '#e5e7eb',
	TEXT_PRIMARY: '#111827',
	TEXT_SECONDARY: '#6b7280',
	SUCCESS: '#10b981',
	WARNING: '#f59e0b',
	SUCCESS_BG: '#ecfdf5',
	WARNING_BG: '#fffbeb',
	INFO_BG: '#eff6ff',
};

// Styled Components with V9 Colors
const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const ResponsiveContainer = styled(Container)`
	max-width: 1200px;
	margin: 0 auto;
	padding: 1rem;
	border: 1px solid ${V9_COLORS.BORDER};
	
	@media (max-width: 768px) {
		padding: 0.5rem;
		max-width: 100%;
	}
`;

const VariantSelector = styled.div`
	display: flex;
	gap: 1rem;
	margin-bottom: 2rem;
	padding: 1rem;
	background: ${V9_COLORS.LIGHT_BLUE_BG};
	border-radius: 0.75rem;
	border: 1px solid ${V9_COLORS.BORDER};
`;

const VariantButton = styled.button<{ $selected: boolean }>`
	padding: 1rem 2rem;
	border: 2px solid ${(props) => (props.$selected ? V9_COLORS.PRIMARY_BLUE : V9_COLORS.BORDER)};
	background: ${(props) => (props.$selected ? V9_COLORS.PRIMARY_BLUE : V9_COLORS.WHITE)};
	color: ${(props) => (props.$selected ? V9_COLORS.WHITE : V9_COLORS.TEXT_SECONDARY)};
	border-radius: 0.5rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: ${(props) => (props.$selected ? V9_COLORS.DARK_BLUE : V9_COLORS.LIGHT_BLUE_BG)};
	}
`;

const Section = styled.section<{ $expanded?: boolean }>`
	border: 1px solid ${V9_COLORS.BORDER};
	border-radius: 0.75rem;
	margin-bottom: 1.5rem;
	overflow: hidden;
	background: ${V9_COLORS.WHITE};
`;

const SectionHeader = styled.div<{ $color: string; $expanded?: boolean }>`
	background: ${(props) => props.$color};
	color: ${V9_COLORS.WHITE};
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
			? V9_COLORS.SUCCESS
			: props.$variant === 'warning'
				? V9_COLORS.WARNING
				: V9_COLORS.PRIMARY_BLUE};
	background: ${(props) =>
		props.$variant === 'success'
			? V9_COLORS.SUCCESS_BG
			: props.$variant === 'warning'
				? V9_COLORS.WARNING_BG
				: V9_COLORS.INFO_BG};
`;

const ComparisonTable = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
	margin: 1rem 0;
`;

const ComparisonCard = styled.div<{ $active: boolean }>`
	padding: 1rem;
	border: 2px solid ${(props) => (props.$active ? V9_COLORS.PRIMARY_BLUE : V9_COLORS.BORDER)};
	border-radius: 0.5rem;
	background: ${(props) => (props.$active ? V9_COLORS.INFO_BG : V9_COLORS.WHITE)};
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
	background: ${(props) => (props.$completed ? V9_COLORS.SUCCESS : props.$active ? V9_COLORS.PRIMARY_BLUE : V9_COLORS.BORDER)};
	color: ${(props) => (props.$active || props.$completed ? V9_COLORS.WHITE : V9_COLORS.TEXT_SECONDARY)};
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
	color: ${V9_COLORS.TEXT_PRIMARY};
`;

const Input = styled.input`
	padding: 0.75rem;
	border: 1px solid ${V9_COLORS.BORDER};
	border-radius: 0.375rem;
	font-size: 0.875rem;

	&:focus {
		outline: none;
		border-color: ${V9_COLORS.PRIMARY_BLUE};
		box-shadow: 0 0 0 3px ${V9_COLORS.LIGHT_BLUE_BG};
	}
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 0.375rem;
	font-weight: 500;
	cursor: pointer;
	background: ${(props) => (props.$variant === 'secondary' ? V9_COLORS.TEXT_SECONDARY : V9_COLORS.PRIMARY_BLUE)};
	color: ${V9_COLORS.WHITE};
	transition: all 0.2s;
	
	&:hover {
		background: ${(props) => (props.$variant === 'secondary' ? '#4b5563' : V9_COLORS.DARK_BLUE)};
	}
`;

const CodeBlock = styled.pre`
	background: #f8fafc;
	border: 1px solid ${V9_COLORS.BORDER};
	border-radius: 0.375rem;
	padding: 1rem;
	font-family: 'Courier New', monospace;
	font-size: 0.875rem;
	overflow-x: auto;
	color: ${V9_COLORS.TEXT_PRIMARY};
`;

// Main Component
const OAuthAuthorizationCodeFlowV9_Condensed: React.FC = () => {
	// Scroll management
	usePageScroll({ pageName: 'OAuth Authorization Code Flow V9 Condensed', force: true });

	// V9 Credential management
	const [credentials, _setCredentials] = useState(() => V9FlowCredentialService.load());
	const [environmentId, setEnvironmentId] = useState(() =>
		EnvironmentIdServiceV8.getEnvironmentId()
	);

	// Worker token state
	const [isWorkerTokenStatusCollapsed, setIsWorkerTokenStatusCollapsed] = useState(true);

	// Component state
	const [selectedVariant, setSelectedVariant] = useState<'oauth' | 'oidc'>('oauth');
	const [expandedSections, setExpandedSections] = useState({
		quickStart: true,
		configuration: true,
		execution: false,
		results: false,
	});
	const [currentStep, setCurrentStep] = useState(0);
	const [hasTokens, setHasTokens] = useState(false);

	// Mock credentials
	const [mockCredentials, setMockCredentials] = useState({
		clientId: credentials.clientId || 'your-client-id',
		clientSecret: credentials.clientSecret || 'your-client-secret',
		redirectUri: 'https://localhost:3000/callback',
		scope: selectedVariant === 'oidc' ? 'openid profile email' : 'read write',
	});

	const toggleSection = useCallback((section: keyof typeof expandedSections) => {
		setExpandedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	}, []);

	const simulateFlow = useCallback(() => {
		setCurrentStep(1);
		setExpandedSections((prev) => ({ ...prev, execution: true }));

		// Simulate token reception after 2 seconds
		setTimeout(() => {
			setHasTokens(true);
			setExpandedSections((prev) => ({ ...prev, results: true }));
			toastV8.success('Authorization flow completed successfully!');
		}, 2000);
	}, []);

	const handleCredentialChange = useCallback(
		(field: keyof typeof mockCredentials, value: string) => {
			setMockCredentials((prev) => ({
				...prev,
				[field]: value,
			}));
		},
		[]
	);

	const handleVariantChange = useCallback((variant: 'oauth' | 'oidc') => {
		setSelectedVariant(variant);
		setMockCredentials((prev) => ({
			...prev,
			scope: variant === 'oidc' ? 'openid profile email' : 'read write',
		}));
	}, []);

	const generateAuthUrl = useCallback(() => {
		const baseUrl = `https://auth.pingone.com/${environmentId}/as/authorization.oauth2`;
		const params = new URLSearchParams({
			response_type: 'code',
			client_id: mockCredentials.clientId,
			redirect_uri: mockCredentials.redirectUri,
			scope: mockCredentials.scope,
			state: `v9-condensed-${Date.now()}`,
		});

		if (selectedVariant === 'oidc') {
			params.set('nonce', `nonce-${Date.now()}`);
		}

		return `${baseUrl}?${params.toString()}`;
	}, [environmentId, mockCredentials, selectedVariant]);

	return (
		<ResponsiveContainer>
			{/* Header */}
			<div style={{ marginBottom: '2rem' }}>
				<h1
					style={{
						color: V9_COLORS.DARK_BLUE,
						marginBottom: '0.5rem',
						fontSize: '2rem',
						fontWeight: '700',
					}}
				>
					🎯 Condensed V9 Authorization Code Flow
				</h1>
				<p
					style={{
						color: V9_COLORS.TEXT_SECONDARY,
						marginBottom: '2rem',
						fontSize: '1rem',
					}}
				>
					Enhanced V9 architecture with condensed 4-section structure and modern UI standards.
				</p>
			</div>

			{/* Variant Selector - Always Visible */}
			<VariantSelector>
				<VariantButton
					$selected={selectedVariant === 'oauth'}
					onClick={() => handleVariantChange('oauth')}
				>
					OAuth 2.0 Authorization Code
				</VariantButton>
				<VariantButton
					$selected={selectedVariant === 'oidc'}
					onClick={() => handleVariantChange('oidc')}
				>
					OpenID Connect Authorization Code
				</VariantButton>
			</VariantSelector>

			{/* 1. QUICK START & OVERVIEW - Always Expanded */}
			<Section $expanded={true}>
				<SectionHeader $color={V9_COLORS.SUCCESS} $expanded={true}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiBook />📚 Quick Start & Overview
					</div>
				</SectionHeader>
				<SectionContent $show={true}>
					<QuickInfoGrid>
						<InfoCard $variant="info">
							<h4 style={{ color: V9_COLORS.DARK_BLUE }}>What You'll Get</h4>
							<p>
								{selectedVariant === 'oidc'
									? '🎯 User authentication + API authorization with ID token and access token'
									: '🔑 API authorization with access token (PingOne requires openid scope)'}
							</p>
						</InfoCard>
						<InfoCard $variant="success">
							<h4 style={{ color: V9_COLORS.DARK_BLUE }}>Perfect For</h4>
							<ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
								<li>Web apps with secure backends</li>
								<li>SPAs using PKCE</li>
								<li>Apps needing refresh tokens</li>
							</ul>
						</InfoCard>
					</QuickInfoGrid>

					<ComparisonTable>
						<ComparisonCard $active={selectedVariant === 'oauth'}>
							<h4 style={{ color: V9_COLORS.DARK_BLUE }}>OAuth 2.0 Mode</h4>
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
							<h4 style={{ color: V9_COLORS.DARK_BLUE }}>OpenID Connect Mode</h4>
							<p>
								<strong>Tokens:</strong> Access + ID + Refresh
							</p>
							<p>
								<strong>Purpose:</strong> Authentication + API access
							</p>
							<p>
								<strong>PingOne:</strong> Full OIDC support
							</p>
						</ComparisonCard>
					</ComparisonTable>
				</SectionContent>
			</Section>

			{/* 2. CONFIGURATION */}
			<Section>
				<SectionHeader
					$color={V9_COLORS.PRIMARY_BLUE}
					$expanded={true}
					onClick={() => toggleSection('configuration')}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiSettings />
						⚙️ Configuration
					</div>
					<FiChevronDown
						style={{
							transform: expandedSections.configuration ? 'rotate(0deg)' : 'rotate(-90deg)',
							transition: 'transform 0.2s',
						}}
					/>
				</SectionHeader>
				<SectionContent $show={expandedSections.configuration}>
					<MockCredentialsForm>
						<FormGroup>
							<Label>Environment ID</Label>
							<Input
								type="text"
								value={environmentId}
								onChange={(e) => setEnvironmentId(e.target.value)}
								placeholder="your-pingone-environment-id"
							/>
						</FormGroup>
						<FormGroup>
							<Label>Client ID</Label>
							<Input
								type="text"
								value={mockCredentials.clientId}
								onChange={(e) => handleCredentialChange('clientId', e.target.value)}
								placeholder="your-client-id"
							/>
						</FormGroup>
						<FormGroup>
							<Label>Client Secret</Label>
							<Input
								type="password"
								value={mockCredentials.clientSecret}
								onChange={(e) => handleCredentialChange('clientSecret', e.target.value)}
								placeholder="your-client-secret"
							/>
						</FormGroup>
						<FormGroup>
							<Label>Redirect URI</Label>
							<Input
								type="url"
								value={mockCredentials.redirectUri}
								onChange={(e) => handleCredentialChange('redirectUri', e.target.value)}
								placeholder="https://localhost:3000/callback"
							/>
						</FormGroup>
						<FormGroup>
							<Label>Scope</Label>
							<Input
								type="text"
								value={mockCredentials.scope}
								onChange={(e) => handleCredentialChange('scope', e.target.value)}
								placeholder={selectedVariant === 'oidc' ? 'openid profile email' : 'read write'}
							/>
						</FormGroup>
					</MockCredentialsForm>

					<Button $variant="primary" onClick={simulateFlow}>
						<FiZap /> Simulate Authorization Flow
					</Button>
				</SectionContent>
			</Section>

			{/* 3. EXECUTION */}
			<Section>
				<SectionHeader
					$color={V9_COLORS.WARNING}
					$expanded={true}
					onClick={() => toggleSection('execution')}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiTarget />🎯 Execution
					</div>
					<FiChevronDown
						style={{
							transform: expandedSections.execution ? 'rotate(0deg)' : 'rotate(-90deg)',
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
						<Step $active={currentStep === 3} $completed={currentStep > 3}>
							4
						</Step>
					</StepIndicator>

					<div style={{ marginBottom: '1rem' }}>
						<strong>Step {currentStep + 1} of 4:</strong>
						{currentStep === 0 && ' Redirect user to authorization server'}
						{currentStep === 1 && ' User authenticates and grants consent'}
						{currentStep === 2 && ' Exchange authorization code for tokens'}
						{currentStep === 3 && ' Tokens received and ready to use'}
					</div>

					{currentStep > 0 && (
						<div>
							<h4 style={{ color: V9_COLORS.DARK_BLUE }}>Authorization URL:</h4>
							<CodeBlock>{generateAuthUrl()}</CodeBlock>
						</div>
					)}
				</SectionContent>
			</Section>

			{/* 4. RESULTS */}
			<Section>
				<SectionHeader
					$color={V9_COLORS.PRIMARY_BLUE}
					$expanded={true}
					onClick={() => toggleSection('results')}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiCheckCircle />📊 Results
					</div>
					<FiChevronDown
						style={{
							transform: expandedSections.results ? 'rotate(0deg)' : 'rotate(-90deg)',
							transition: 'transform 0.2s',
						}}
					/>
				</SectionHeader>
				<SectionContent $show={expandedSections.results}>
					{hasTokens ? (
						<div>
							<h4 style={{ color: V9_COLORS.DARK_BLUE }}>✅ Flow Completed Successfully!</h4>
							<p>Tokens have been received and are ready for use.</p>

							<div style={{ marginTop: '2rem' }}>
								<UltimateTokenDisplay
									tokens={{
										access_token: `mock_access_token_${Date.now()}`,
										token_type: 'Bearer',
										expires_in: 3600,
										refresh_token: `mock_refresh_token_${Date.now()}`,
										scope: mockCredentials.scope,
										...(selectedVariant === 'oidc' && {
											id_token: `mock_id_token_${Date.now()}`,
										}),
									}}
								/>
							</div>
						</div>
					) : (
						<div>
							<h4 style={{ color: V9_COLORS.TEXT_SECONDARY }}>⏳ Waiting for Flow Completion</h4>
							<p>Complete the authorization flow to see results here.</p>
						</div>
					)}
				</SectionContent>
			</Section>

			{/* Worker Token Status Section */}
			<Section style={{ marginTop: '2rem' }}>
				<SectionHeader
					$color={V9_COLORS.BLACK}
					$expanded={true}
					onClick={() => setIsWorkerTokenStatusCollapsed(!isWorkerTokenStatusCollapsed)}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiKey />🔑 Worker Token Status
					</div>
					<FiChevronDown
						style={{
							transform: isWorkerTokenStatusCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
							transition: 'transform 0.2s',
						}}
					/>
				</SectionHeader>
				<SectionContent $show={!isWorkerTokenStatusCollapsed}>
					<WorkerTokenStatusDisplayV8
						appName="OAuth Authorization Code V9 Condensed"
						compact={false}
						showRefreshButton={true}
						onTokenUpdate={(tokenData) => {
							if (tokenData?.credentials?.environmentId) {
								setEnvironmentId(tokenData.credentials.environmentId);
							}
							if (tokenData?.credentials?.clientId) {
								handleCredentialChange('clientId', tokenData.credentials.clientId);
							}
						}}
					/>
				</SectionContent>
			</Section>

			{/* Credential Export/Import Section */}
			<Section style={{ marginTop: '2rem' }}>
				<SectionHeader $color={V9_COLORS.TEXT_SECONDARY} $expanded={false}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<FiSettings />🔧 Credential Management
					</div>
				</SectionHeader>
				<SectionContent $show={true}>
					<StandardizedCredentialExportImport
						appName="OAuth Authorization Code V9 Condensed"
						appType="oauth"
						credentials={{
							environmentId,
							clientId: mockCredentials.clientId,
							clientSecret: mockCredentials.clientSecret,
							redirectUri: mockCredentials.redirectUri,
							scope: mockCredentials.scope,
						}}
						onCredentialsImported={(importedCredentials) => {
							if (importedCredentials.environmentId) {
								setEnvironmentId(importedCredentials.environmentId);
							}
							if (importedCredentials.clientId) {
								handleCredentialChange('clientId', importedCredentials.clientId);
							}
							if (importedCredentials.clientSecret) {
								handleCredentialChange('clientSecret', importedCredentials.clientSecret);
							}
							if (importedCredentials.redirectUri) {
								handleCredentialChange('redirectUri', importedCredentials.redirectUri);
							}
							if (importedCredentials.scope) {
								handleCredentialChange('scope', importedCredentials.scope);
							}
							toastV8.success('Credentials imported successfully');
						}}
					/>
				</SectionContent>
			</Section>
		</ResponsiveContainer>
	);
};

export default OAuthAuthorizationCodeFlowV9_Condensed;
