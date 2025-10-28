// src/pages/OrganizationLicensing_V2.tsx
// Multi-step Organization Licensing flow: Creds → Token → License Info

import React, { useState, useEffect } from 'react';
import {
	FiCheckCircle,
	FiAlertTriangle,
	FiRefreshCw,
	FiInfo,
	FiUsers,
	FiLayers,
	FiCalendar,
	FiShield,
	FiActivity,
	FiKey,
	FiArrowRight,
	FiArrowLeft,
	FiSettings,
} from 'react-icons/fi';
import styled from 'styled-components';
import {
	getOrganizationLicensingInfo,
	getEnvironmentLicensingInfo,
	getAllLicenses,
	type OrganizationInfo,
	type OrganizationLicense,
} from '../services/organizationLicensingService';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { useAuth } from '../contexts/NewAuthContext';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import PageLayoutService from '../services/pageLayoutService';
import ComprehensiveCredentialsService from '../services/comprehensiveCredentialsService';
import type { StepCredentials } from '../types/common';
import { getOAuthTokens } from '../utils/tokenStorage';
import { FlowHeader } from '../services/flowHeaderService';
import { usePageScroll } from '../hooks/usePageScroll';
import { useNavigate } from 'react-router-dom';
import { credentialManager } from '../utils/credentialManager';
import { FlowCredentialService } from '../services/flowCredentialService';
import { StepNavigationButtons } from '../components/StepNavigationButtons';
import V5StepperService from '../services/v5StepperService';

const pageConfig = {
	flowType: 'documentation' as const,
	theme: 'purple' as const,
	maxWidth: '64rem',
	showHeader: true,
	showFooter: false,
	responsive: true,
	flowId: 'organization-licensing',
};

const { PageContainer, ContentWrapper } = 
	PageLayoutService.createPageLayout(pageConfig);

const StepContainer = styled.div`
	background: white;
	border-radius: 8px;
	padding: 24px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	margin-bottom: 20px;
`;

const StepTitle = styled.h2`
	font-size: 24px;
	font-weight: 600;
	margin-bottom: 16px;
	color: #1a202c;
	display: flex;
	align-items: center;
	gap: 12px;
`;

const HelperText = styled.p`
	color: #64748b;
	font-size: 14px;
	line-height: 1.6;
	margin-bottom: 20px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 0.5rem;
	border: none;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	transition: all 0.2s;
	
	background: ${({ $variant }) =>
		$variant === 'primary' ? '#3b82f6' : '#6b7280'};
	color: white;
	
	&:hover:not(:disabled) {
		opacity: 0.9;
	}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const ErrorMessage = styled.div`
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 8px;
	padding: 1rem;
	color: #991b1b;
	margin: 1rem 0;
`;

const LoadingMessage = styled.div`
	text-align: center;
	padding: 2rem;
	color: #6b7280;
`;

const LicenseGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-top: 1rem;
`;

const LicenseCard = styled.div`
	background: white;
	border: 2px solid ${({ $borderColor }) => $borderColor || '#e5e7eb'};
	border-radius: 8px;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const InfoRow = styled.div`
	display: flex;
	justify-content: space-between;
	padding: 0.5rem 0;
	border-bottom: 1px solid #e5e7eb;
	
	&:last-child {
		border-bottom: none;
	}
`;

const InfoLabel = styled.span`
	font-weight: 600;
	color: #6b7280;
`;

const InfoValue = styled.span`
	color: #111827;
`;

// Create V5 stepper layout components
const stepperComponents = V5StepperService.createStepLayout({ theme: 'purple', showProgress: true });

const STEP_METADATA: Array<{ title: string; subtitle: string }> = [
	{
		title: 'Step 1: Configure Credentials',
		subtitle: 'Enter your PingOne environment details',
	},
	{
		title: 'Step 2: Get Worker Token',
		subtitle: 'Obtain a worker token for API access',
	},
	{
		title: 'Step 3: Get License Information',
		subtitle: 'Fetch organization and license details',
	},
];

const OrganizationLicensingV2: React.FC = () => {
	usePageScroll({ pageName: 'Organization Licensing', force: true });
	const { tokens } = useAuth();
	const navigate = useNavigate();
	
	// Step management
	const [currentStep, setCurrentStep] = useState(0);
	
	// Create stepper components dynamically
	const currentStepData = STEP_METADATA[currentStep];
	const StepperHeader = stepperComponents.StepHeader;
	const StepperHeaderLeft = stepperComponents.StepHeaderLeft;
	const StepperHeaderRight = stepperComponents.StepHeaderRight;
	const StepperTitle = stepperComponents.StepHeaderTitle;
	const StepperSubtitle = stepperComponents.StepHeaderSubtitle;
	const StepperNumber = stepperComponents.StepNumber;
	const StepperTotal = stepperComponents.StepTotal;
	const [orgInfo, setOrgInfo] = useState<OrganizationInfo | null>(null);
	const [allLicenses, setAllLicenses] = useState<OrganizationLicense[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [storedTokens, setStoredTokens] = useState<{ access_token?: string } | null>(null);
	const [credentials, setCredentials] = useState<StepCredentials>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: '',
		scope: 'openid profile email',
		scopes: 'openid profile email',
	});
	const [credentialsSaved, setCredentialsSaved] = useState(false);

	// Get access token from all possible sources
	const getAccessToken = (): string | null => {
		// 1. Check auth context tokens
		if (tokens?.access_token) {
			console.log('[OrganizationLicensing] Access token found in auth context');
			return tokens.access_token;
		}
		
		// 2. Check stored OAuth tokens
		if (storedTokens?.access_token) {
			console.log('[OrganizationLicensing] Access token found in stored tokens');
			return storedTokens.access_token;
		}
		
		// 3. Check localStorage worker_token
		try {
			const localWorkerToken = localStorage.getItem('worker_token');
			if (localWorkerToken) {
				console.log('[OrganizationLicensing] Worker token found in localStorage');
				return localWorkerToken;
			}
		} catch (e) {
			console.warn('[OrganizationLicensing] Error checking localStorage:', e);
		}
		
		return null;
	};

	// Track if we've initialized to prevent auto-advance after user clicks reset
	const [hasInitialized, setHasInitialized] = useState(false);
	
	// Load credentials and tokens, then determine starting step - only on mount
	useEffect(() => {
		if (hasInitialized) return;
		
		const loadAllTokens = () => {
			// Check secure storage
			const secureTokens = getOAuthTokens();
			if (secureTokens?.access_token) {
				setStoredTokens(secureTokens);
				return secureTokens;
			}
			
			// Check localStorage
			try {
				const localToken = localStorage.getItem('worker_token');
				if (localToken) {
					// Convert to OAuthTokens format
					setStoredTokens({ access_token: localToken });
					return { access_token: localToken };
				}
			} catch (e) {
				console.warn('[OrganizationLicensing] Error loading from localStorage:', e);
			}
			
			return null;
		};
		
		const initializeFlow = () => {
			const authToken = tokens?.access_token;
			const hasToken = !!getAccessToken();
			
			// If we already have a token, skip directly to step 2 (getting license info)
			if (hasToken || authToken) {
				console.log('[OrganizationLicensing] Worker token found, skipping to step 2 (License Information)');
				const tokens = loadAllTokens();
				if (tokens) {
					setStoredTokens(tokens);
				}
				setCurrentStep(2);
				setHasInitialized(true);
				return;
			}
			
			// Check for saved credentials
			const savedCreds = credentialManager.getAllCredentials();
			if (savedCreds && savedCreds.environmentId && savedCreds.clientId) {
				console.log('[OrganizationLicensing] Credentials found, advancing to step 1 (Get Token)');
				setCredentials({
					environmentId: savedCreds.environmentId || '',
					clientId: savedCreds.clientId || '',
					clientSecret: savedCreds.clientSecret || '',
					redirectUri: savedCreds.redirectUri || '',
					scope: 'openid profile email',
					scopes: 'openid profile email',
				});
				setCredentialsSaved(true);
				setCurrentStep(1);
				setHasInitialized(true);
				return;
			}
			
			// No token or credentials, start at step 0
			console.log('[OrganizationLicensing] No token or credentials, starting at step 0 (Credentials)');
			setCurrentStep(0);
			setHasInitialized(true);
		};
		
		initializeFlow();
	}, [tokens?.access_token, hasInitialized]);
	
	// Handle reset - go back to step 0 and reset initialized flag
	const handleReset = () => {
		setCurrentStep(0);
		setOrgInfo(null);
		setAllLicenses([]);
		setError(null);
		setHasInitialized(false); // Allow re-initialization
	};

	const handleCredentialsChange = (creds: StepCredentials) => {
		setCredentials(creds);
		setCredentialsSaved(false);
	};

	const saveCredentials = async () => {
		try {
			const configSuccess = credentialManager.saveConfigCredentials({
				environmentId: credentials.environmentId,
				clientId: credentials.clientId,
				clientSecret: credentials.clientSecret,
				redirectUri: credentials.redirectUri,
				scopes: ['p1:read:organization', 'p1:read:licensing'],
			});
			
			await FlowCredentialService.saveFlowCredentials('worker-token-v7', {
				...credentials,
				scope: 'p1:read:organization p1:read:licensing',
				scopes: 'p1:read:organization p1:read:licensing',
			});

			if (configSuccess) {
				setCredentialsSaved(true);
				v4ToastManager.showSuccess('Credentials saved!');
				setCurrentStep(1); // Move to next step
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Failed to save credentials';
			v4ToastManager.showError(errorMsg);
		}
	};

	const handleGetWorkerToken = () => {
		navigate('/flows/worker-token-v7');
	};

	const fetchOrganizationInfo = async () => {
		const accessToken = getAccessToken();
		if (!accessToken) {
			setError('No access token available.');
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const info = await getOrganizationLicensingInfo(accessToken);
			if (info) {
				setOrgInfo(info);
				v4ToastManager.showSuccess('Organization licensing information loaded!');
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			setError(errorMessage);
			v4ToastManager.showError(`Failed to load licensing information: ${errorMessage}`);
		} finally {
			setLoading(false);
		}
	};

	const fetchAllLicenses = async () => {
		const accessToken = getAccessToken();
		if (!accessToken) return;

		setLoading(true);
		try {
			const licenses = await getAllLicenses(accessToken);
			setAllLicenses(licenses);
			v4ToastManager.showSuccess(`Successfully fetched ${licenses.length} licenses`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			setError(errorMessage);
			v4ToastManager.showError(`Failed to fetch licenses: ${errorMessage}`);
		} finally {
			setLoading(false);
		}
	};

	const renderStep = () => {
		switch (currentStep) {
			case 0: // Credentials
				return (
					<StepContainer>
						<StepTitle>
							<FiSettings /> Step 1: Configure Credentials
						</StepTitle>
						<HelperText>
							Enter your PingOne environment ID, client ID, and client secret.
							These will be saved for the worker token flow.
						</HelperText>
						<ComprehensiveCredentialsService
							flowType="organization-licensing"
							credentials={credentials}
							onCredentialsChange={handleCredentialsChange}
							onSaveCredentials={saveCredentials}
							hasUnsavedChanges={!credentialsSaved}
							title=""
							subtitle=""
							showAdvancedConfig={false}
							showConfigChecker={false}
							requireClientSecret={true}
							showRedirectUri={false}
							showPostLogoutRedirectUri={false}
							showLoginHint={false}
							showClientAuthMethod={false}
							showEnvironmentIdInput={true}
						/>
						{error && (
							<ErrorMessage>
								<FiAlertTriangle /> {error}
							</ErrorMessage>
						)}
					</StepContainer>
				);

			case 1: // Get Worker Token
				return (
					<StepContainer>
						<StepTitle>
							<FiKey /> Step 2: Get Worker Token
						</StepTitle>
						<HelperText>
							Navigate to the worker token flow to obtain an access token.
						</HelperText>
						<Button 
							$variant="primary" 
							onClick={handleGetWorkerToken}
							style={{ backgroundColor: '#059669' }}
						>
							<FiKey /> Get Worker Token
						</Button>
					</StepContainer>
				);

			case 2: // Get License Info
				return (
					<StepContainer>
						<StepTitle>
							<FiShield /> Step 3: Get License Information
						</StepTitle>
						<HelperText>
							Fetch your organization's licensing information using the worker token.
						</HelperText>
						<div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
							<Button 
								$variant="primary" 
								onClick={fetchOrganizationInfo}
								disabled={loading || !getAccessToken()}
							>
								<FiRefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
								{loading ? 'Loading...' : 'Get Organization Info'}
							</Button>
							<Button 
								$variant="secondary" 
								onClick={fetchAllLicenses}
								disabled={loading || !getAccessToken()}
							>
								<FiRefreshCw style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
								Get All Licenses
							</Button>
						</div>
						{error && (
							<ErrorMessage>
								<FiAlertTriangle /> {error}
							</ErrorMessage>
						)}
						{orgInfo && (
							<CollapsibleHeader title="Organization Information" icon={<FiInfo />} theme="blue">
								<LicenseGrid>
									<LicenseCard $borderColor="#3b82f6">
										<InfoRow>
											<InfoLabel>Name:</InfoLabel>
											<InfoValue>{orgInfo.name}</InfoValue>
										</InfoRow>
										<InfoRow>
											<InfoLabel>Region:</InfoLabel>
											<InfoValue>{orgInfo.region}</InfoValue>
										</InfoRow>
										<InfoRow>
											<InfoLabel>Created:</InfoLabel>
											<InfoValue>{new Date(orgInfo.createdAt).toLocaleDateString()}</InfoValue>
										</InfoRow>
										<InfoRow>
											<InfoLabel>Environments:</InfoLabel>
											<InfoValue>{orgInfo.environments.length}</InfoValue>
										</InfoRow>
									</LicenseCard>
								</LicenseGrid>
							</CollapsibleHeader>
						)}
						{allLicenses.length > 0 && (
							<CollapsibleHeader title={`All Licenses (${allLicenses.length})`} icon={<FiShield />} theme="green">
								<LicenseGrid>
									{allLicenses.map((license) => (
										<LicenseCard 
											key={license.id} 
											$borderColor={
												license.status === 'active' ? '#10b981' :
												license.status === 'expired' ? '#ef4444' :
												license.status === 'trial' ? '#f59e0b' : '#e5e7eb'
											}
										>
											<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
												<h3 style={{ margin: 0 }}>{license.name}</h3>
												<span style={{ 
													padding: '0.25rem 0.75rem',
													borderRadius: '9999px',
													fontSize: '0.75rem',
													fontWeight: 600,
													background: license.status === 'active' ? '#d1fae5' : '#fee2e2',
													color: license.status === 'active' ? '#065f46' : '#991b1b',
												}}>
													{license.status.toUpperCase()}
												</span>
											</div>
											<InfoRow>
												<InfoLabel>Type:</InfoLabel>
												<InfoValue>{license.type}</InfoValue>
											</InfoRow>
											<InfoRow>
												<InfoLabel>Start Date:</InfoLabel>
												<InfoValue>{new Date(license.startDate).toLocaleDateString()}</InfoValue>
											</InfoRow>
										</LicenseCard>
									))}
								</LicenseGrid>
							</CollapsibleHeader>
						)}
					</StepContainer>
				);

			default:
				return null;
		}
	};

	const canGoNext = () => {
		if (currentStep === 0) return credentialsSaved;
		if (currentStep === 1) return !!getAccessToken();
		if (currentStep === 2) return true;
		return false;
	};

	const canGoPrevious = () => currentStep > 0;

	const handleNext = () => {
		if (canGoNext()) {
			setCurrentStep(currentStep + 1);
		}
	};

	const handlePrevious = () => {
		if (canGoPrevious()) {
			setCurrentStep(currentStep - 1);
		}
	};

	return (
		<PageContainer>
			<ContentWrapper>
				<div style={{ 
					background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
					color: 'white',
					padding: '1rem 1.5rem',
					borderRadius: '12px',
					marginBottom: '1.5rem',
					boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}>
					<div>
						<h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
							📊 Organization Licensing
						</h2>
						<p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
							View your PingOne organization licensing information, usage statistics, and available features
						</p>
					</div>
					<div style={{ 
						background: 'rgba(255, 255, 255, 0.2)',
						padding: '0.5rem 1rem',
						borderRadius: '8px',
						fontSize: '0.875rem',
						fontWeight: 600,
					}}>
						Step {currentStep + 1} of {STEP_METADATA.length}
					</div>
				</div>
				<StepperHeader>
					<StepperHeaderLeft>
						<StepperTitle>{currentStepData.title}</StepperTitle>
						<StepperSubtitle>{currentStepData.subtitle}</StepperSubtitle>
					</StepperHeaderLeft>
					<StepperHeaderRight>
						<StepperNumber>{currentStep + 1}</StepperNumber>
						<StepperTotal>of {STEP_METADATA.length}</StepperTotal>
					</StepperHeaderRight>
				</StepperHeader>
				{renderStep()}
				<StepNavigationButtons
					currentStep={currentStep}
					totalSteps={3}
					onNext={handleNext}
					onPrevious={handlePrevious}
					onReset={handleReset}
					canNavigateNext={canGoNext()}
					isFirstStep={currentStep === 0}
					canGoPrevious={canGoPrevious()}
				/>
			</ContentWrapper>
		</PageContainer>
	);
};

export default OrganizationLicensingV2;

