// src/pages/OrganizationLicensing.tsx
// Organization Licensing: Get Worker Token & License Information
// lint-file-disable: token-value-in-jsx

import { FiRefreshCw } from '@icons';
import React, { useEffect, useState } from 'react';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import { StepNavigationButtons } from '../components/StepNavigationButtons';
import { WorkerTokenModal } from '../components/WorkerTokenModal';
import { usePageStepper } from '../contexts/FloatingStepperContext';
import { useGlobalWorkerToken } from '../hooks/useGlobalWorkerToken';
import { usePageScroll } from '../hooks/usePageScroll';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { FlowHeader } from '../services/flowHeaderService';
import {
	getAllLicenses,
	getOrganizationLicensingInfo,
	type OrganizationInfo,
	type OrganizationLicense,
} from '../services/organizationLicensingService';
import PageLayoutService from '../services/pageLayoutService';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
import V7StepperService from '../services/v7StepperService';
import { credentialManager } from '../utils/credentialManager';
import { logger } from '../utils/logger';
import { getOAuthTokens } from '../utils/tokenStorage';
import WorkerTokenStatusDisplayV8 from '../v8/components/WorkerTokenStatusDisplayV8';

type CredentialsState = {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scope: string;
	scopes: string;
};

const pageConfig = {
	flowType: 'documentation' as const,
	theme: 'blue' as const,
	maxWidth: '64rem',
	showHeader: true,
	showFooter: false,
	responsive: true,
	flowId: 'organization-licensing',
};

const { PageContainer, ContentWrapper } = PageLayoutService.createPageLayout(pageConfig);

const styles = {
	stepContainer: {
		background: 'white',
		borderRadius: '8px',
		padding: '24px',
		boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
		marginBottom: '20px',
	} as React.CSSProperties,
	stepContent: {
		padding: '1.5rem',
		background: 'white',
		borderRadius: '0.75rem',
		border: '1px solid #e5e7eb',
	} as React.CSSProperties,
	stepDescription: {
		marginBottom: '1.5rem',
	} as React.CSSProperties,
	scopeList: {
		margin: '1rem 0',
		paddingLeft: '1.5rem',
	} as React.CSSProperties,
	scopeItem: {
		marginBottom: '0.5rem',
		lineHeight: 1.6,
		color: '#1f2937',
	} as React.CSSProperties,
	scopeCode: {
		background: '#f3f4f6',
		padding: '0.125rem 0.25rem',
		borderRadius: '0.25rem',
		fontFamily: "'Monaco', 'Menlo', 'Courier New', monospace",
		fontSize: '0.875rem',
		color: '#1f2937',
	} as React.CSSProperties,
	button: (isPrimary: boolean, isDisabled?: boolean): React.CSSProperties => ({
		padding: '0.75rem 1.5rem',
		borderRadius: '0.5rem',
		border: 'none',
		fontWeight: 600,
		cursor: isDisabled ? 'not-allowed' : 'pointer',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		background: isDisabled ? '#9ca3af' : isPrimary ? '#3b82f6' : '#6b7280',
		color: isDisabled ? '#f8fafc' : 'white',
	}),
	errorMessage: {
		background: '#fef2f2',
		border: '1px solid #ef4444',
		borderRadius: '8px',
		padding: '1rem',
		color: '#dc2626',
		margin: '1rem 0',
	} as React.CSSProperties,
	licenseGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
		gap: '1.5rem',
		marginTop: '1rem',
	} as React.CSSProperties,
	licenseCard: (borderColor?: string): React.CSSProperties => ({
		background: 'white',
		border: `2px solid ${borderColor || '#e5e7eb'}`,
		borderRadius: '8px',
		padding: '1.5rem',
		boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
	}),
	featureBadge: {
		display: 'inline-flex',
		alignItems: 'center',
		padding: '0.35rem 0.75rem',
		margin: '0.25rem',
		borderRadius: '9999px',
		background: '#f8fafc',
		color: '#3b82f6',
		fontSize: '0.75rem',
		fontWeight: 600,
	} as React.CSSProperties,
	environmentTable: {
		border: '1px solid #e5e7eb',
		borderRadius: '0.75rem',
		overflow: 'hidden',
		marginTop: '1rem',
	} as React.CSSProperties,
	environmentHeader: {
		display: 'grid',
		gridTemplateColumns: '2fr 1fr 2fr 1.5fr',
		gap: '0.75rem',
		padding: '0.75rem 1rem',
		background: '#f1f5f9',
		fontWeight: 600,
		fontSize: '0.85rem',
		color: '#6b7280',
	} as React.CSSProperties,
	environmentRow: {
		display: 'grid',
		gridTemplateColumns: '2fr 1fr 2fr 1.5fr',
		gap: '0.75rem',
		padding: '0.75rem 1rem',
		borderTop: '1px solid #e5e7eb',
		fontSize: '0.85rem',
	} as React.CSSProperties,
	environmentName: {
		fontWeight: 600,
		color: '#1e293b',
	} as React.CSSProperties,
	environmentRegion: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'flex-start',
		gap: '0.35rem',
		fontWeight: 600,
		color: '#1f2937',
	} as React.CSSProperties,
	environmentId: {
		fontFamily:
			"'SFMono-Regular', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
		fontSize: '0.75rem',
		color: '#6b7280',
		wordBreak: 'break-all',
	} as React.CSSProperties,
	environmentLicense: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.35rem',
		fontSize: '0.8rem',
		color: '#1f2937',
	} as React.CSSProperties,
	environmentLicenseMeta: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.25rem',
		fontSize: '0.75rem',
		color: '#6b7280',
	} as React.CSSProperties,
	infoRow: {
		display: 'flex',
		justifyContent: 'space-between',
		padding: '0.5rem 0',
		borderBottom: '1px solid #e5e7eb',
	} as React.CSSProperties,
	infoLabel: {
		fontWeight: 600,
		color: '#6b7280',
	} as React.CSSProperties,
	infoValue: {
		color: '#1f2937',
	} as React.CSSProperties,
	input: {
		width: '100%',
		padding: '0.75rem',
		border: '1px solid #e5e7eb',
		borderRadius: '0.5rem',
		fontSize: '1rem',
		marginBottom: '1rem',
	} as React.CSSProperties,
	inputLabel: {
		display: 'block',
		fontWeight: 600,
		color: '#1f2937',
		marginBottom: '0.5rem',
		fontSize: '0.875rem',
	} as React.CSSProperties,
};

// Create V5 stepper layout components
const stepperComponents = V7StepperService.createStepLayout({
	theme: 'blue',
	showProgress: true,
});

const STEP_METADATA: Array<{ title: string; subtitle: string }> = [
	{
		title: 'Get Worker Token & License Information',
		subtitle: 'Obtain a worker token and fetch organization licensing details',
	},
];

const ORGANIZATION_ID_STORAGE_KEY = 'organizationLicensing.organizationId';

const OrganizationLicensingV2: React.FC = () => {
	usePageScroll({ pageName: 'Organization Licensing', force: true });

	// Step management - only one step now (combined worker token + license info)
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
	const [isFetchingOrgInfo, setIsFetchingOrgInfo] = useState(false);
	const [isFetchingAllLicenses, setIsFetchingAllLicenses] = useState(false);
	const isBusy = isFetchingOrgInfo || isFetchingAllLicenses;
	const [error, setError] = useState<string | null>(null);
	const [_storedTokens, setStoredTokens] = useState<{ access_token?: string } | null>(null);
	const [organizationId, setOrganizationId] = useState<string>(() => {
		if (typeof window === 'undefined') {
			return '';
		}

		try {
			return localStorage.getItem(ORGANIZATION_ID_STORAGE_KEY) || '';
		} catch (error) {
			logger.warn(
				'OrganizationLicensing',
				'[OrganizationLicensing] Unable to load stored organization ID:',
				{ error }
			);
			return '';
		}
	});
	const [credentials, setCredentials] = useState<CredentialsState>({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		redirectUri: '',
		scope: 'openid profile email',
		scopes: 'openid profile email',
	});

	// Use global worker token hook for unified token management
	const globalTokenStatus = useGlobalWorkerToken({ autoFetch: false }); // Don't auto-fetch, user controls this
	const hasWorkerToken = globalTokenStatus.isValid;

	// Track if we've initialized to prevent auto-advance after user clicks reset
	const [hasInitialized, setHasInitialized] = useState(false);
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);

	// Global floating stepper
	const { registerSteps, setCurrentStep: setStepperStep } = usePageStepper();

	useEffect(() => {
		registerSteps([
			{ id: 'worker-token', title: 'Worker Token', description: 'Verify worker token credentials' },
			{ id: 'org-info', title: 'Org Info', description: 'Fetch organization details' },
			{ id: 'licensing', title: 'Licensing', description: 'View license information' },
		]);
	}, [registerSteps]);

	// Sync floating stepper step to reflect data loading progress
	useEffect(() => {
		if (allLicenses.length > 0 || orgInfo) {
			setStepperStep(2);
		} else if (credentials.environmentId) {
			setStepperStep(1);
		} else {
			setStepperStep(0);
		}
	}, [credentials.environmentId, orgInfo, allLicenses, setStepperStep]);

	// Load credentials and tokens, then determine starting step - only on mount
	useEffect(() => {
		if (hasInitialized) return;

		const loadAllTokens = () => {
			// Use global worker token hook data
			try {
				if (globalTokenStatus.isValid && globalTokenStatus.token) {
					setStoredTokens({ access_token: globalTokenStatus.token });
					return { access_token: globalTokenStatus.token };
				}
			} catch (e) {
				logger.warn(
					'OrganizationLicensing',
					'[OrganizationLicensing] Error loading worker token:',
					{
						error: e,
					}
				);
			}

			// Check secure storage (fallback)
			const secureTokens = getOAuthTokens();
			if (secureTokens?.access_token) {
				setStoredTokens(secureTokens);
				return secureTokens;
			}

			return null;
		};

		const initializeFlow = () => {
			// Start at step 0 (combined worker token + license info)
			logger.info(
				'[OrganizationLicensing] Starting at step 0 (Get Worker Token & License Information)'
			);

			// Load any existing tokens
			const loadedTokens = loadAllTokens();
			if (loadedTokens) {
				setStoredTokens(loadedTokens);
			}

			// Load saved credentials from credential manager
			const savedCreds = credentialManager.getAllCredentials();
			let envId = savedCreds?.environmentId || '';

			// Try worker token credentials as fallback (via unified service)
			if (!envId) {
				try {
					const data = unifiedWorkerTokenService.getTokenDataSync();
					envId = data?.credentials?.environmentId || '';
				} catch (error) {
					logger.info('Failed to load environment ID from worker token:', error);
				}
			}

			if (envId && savedCreds?.clientId) {
				setCredentials({
					environmentId: envId,
					clientId: savedCreds.clientId || '',
					clientSecret: savedCreds.clientSecret || '',
					redirectUri: savedCreds.redirectUri || '',
					scope: 'p1:read:organization p1:read:licensing',
					scopes: 'p1:read:organization p1:read:licensing',
				});
			}

			setCurrentStep(0);
			setHasInitialized(true);
		};

		initializeFlow();
	}, [hasInitialized, globalTokenStatus.isValid, globalTokenStatus.token]);

	// Update environment ID when worker token is updated
	useEffect(() => {
		const handleTokenUpdate = () => {
			try {
				const data = unifiedWorkerTokenService.getTokenDataSync();
				if (data?.credentials?.environmentId && !credentials.environmentId) {
					setCredentials((prev) => ({
						...prev,
						environmentId: data.credentials.environmentId,
					}));
				}
			} catch (error) {
				logger.info('Failed to update environment ID from worker token:', error);
			}
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		return () => window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
	}, [credentials.environmentId]);

	// Handle reset - go back to step 0 and reset initialized flag
	const handleReset = () => {
		setOrgInfo(null);
		setAllLicenses([]);
		setError(null);
		// Reload credentials and tokens
		const savedCreds = credentialManager.getAllCredentials();
		if (savedCreds) {
			setCredentials({
				environmentId: savedCreds.environmentId || '',
				clientId: savedCreds.clientId || '',
				clientSecret: savedCreds.clientSecret || '',
				redirectUri: savedCreds.redirectUri || '',
				scope: 'p1:read:organization p1:read:licensing',
				scopes: 'p1:read:organization p1:read:licensing',
			});
		}
	};

	const persistOrganizationId = (value: string) => {
		setOrganizationId(value);

		if (typeof window === 'undefined') {
			return;
		}

		try {
			if (value.trim()) {
				localStorage.setItem(ORGANIZATION_ID_STORAGE_KEY, value);
			} else {
				localStorage.removeItem(ORGANIZATION_ID_STORAGE_KEY);
			}
		} catch (error) {
			logger.warn(
				'OrganizationLicensing',
				'[OrganizationLicensing] Unable to persist organization ID:',
				{ error }
			);
		}
	};

	const fetchOrganizationInfo = async () => {
		// Use global worker token from hook
		if (!globalTokenStatus.isValid || !globalTokenStatus.token) {
			const errorMsg =
				'No valid worker token available. Please click "Get Worker Token" to generate one with the required scopes (p1:read:organization p1:read:licensing).';
			setError(errorMsg);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: errorMsg,
				dismissible: true,
			});
			return;
		}

		const accessToken = globalTokenStatus.token;

		if (!organizationId.trim()) {
			setError('Please enter an Organization ID.');
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Please enter an Organization ID.',
				dismissible: true,
			});
			return;
		}

		setIsFetchingOrgInfo(true);
		setError(null);
		setOrgInfo(null); // Clear previous results

		try {
			logger.info(
				'[OrganizationLicensing] Fetching organization info with access token and org ID:',
				organizationId.trim()
			);
			const info = await getOrganizationLicensingInfo(accessToken, organizationId.trim());

			if (info) {
				logger.info('[OrganizationLicensing] Organization info received:', info);
				setOrgInfo(info);
				modernMessaging.showFooterMessage({
					type: 'status',
					message: 'Organization licensing information loaded!',
					duration: 4000,
				});
			} else {
				const errorMsg =
					'Failed to fetch organization information. The API returned no data. This usually means:\n1. The worker token is expired or invalid\n2. The Organization ID is incorrect\n3. The worker app lacks required permissions (p1:read:organization p1:read:licensing)\n\nPlease click "Get Worker Token" to generate a new token and try again.';
				setError(errorMsg);
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'Failed to fetch organization information. Check the error message for details.',
					dismissible: true,
				});
				logger.error(
					'OrganizationLicensing',
					'[OrganizationLicensing] getOrganizationLicensingInfo returned null'
				);
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			logger.error(
				'OrganizationLicensing',
				'[OrganizationLicensing] Error fetching organization info:',
				undefined,
				err as Error
			);

			// Check if it's a 401 error
			if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
				const errorMsg =
					'Worker token is expired or invalid. Please click "Get Worker Token" to generate a new token with the required scopes (p1:read:organization p1:read:licensing).';
				setError(errorMsg);
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: 'Token expired or invalid. Please generate a new worker token.',
					dismissible: true,
				});
			} else {
				setError(errorMessage);
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: `Failed to load licensing information: ${errorMessage}`,
					dismissible: true,
				});
			}
		} finally {
			setIsFetchingOrgInfo(false);
		}
	};

	const _fetchAllLicenses = async () => {
		if (!globalTokenStatus.isValid || !globalTokenStatus.token) return;

		setIsFetchingAllLicenses(true);
		try {
			const licenses = await getAllLicenses(
				globalTokenStatus.token,
				organizationId.trim() || undefined
			);
			setAllLicenses(licenses);
			modernMessaging.showFooterMessage({
				type: 'status',
				message: `Successfully fetched ${licenses.length} licenses`,
				duration: 4000,
			});
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			setError(errorMessage);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: `Failed to fetch licenses: ${errorMessage}`,
				dismissible: true,
			});
		} finally {
			setIsFetchingAllLicenses(false);
		}
	};

	const renderStep = () => {
		// Combined step: Get Worker Token + Get License Information
		return (
			<div style={styles.stepContainer}>
				<CollapsibleHeader
					title="Worker Token Status"
					subtitle="Unified worker token service with real-time status and management"
					icon={<span>🔑</span>}
					defaultCollapsed={false}
				>
					<div style={styles.stepContent}>
						<div style={styles.stepDescription}>
							<p>
								The unified worker token service provides comprehensive token management with
								real-time status updates. The token needs the following scopes for organization
								licensing:
							</p>
							<ul style={styles.scopeList}>
								<li style={styles.scopeItem}>
									<code style={styles.scopeCode}>p1:read:organization</code> - Read organization
									information
								</li>
								<li style={styles.scopeItem}>
									<code style={styles.scopeCode}>p1:read:licensing</code> - Read licensing
									information
								</li>
							</ul>
							<p>
								The status display below shows token availability, expiration, and provides refresh
								capabilities.
							</p>
						</div>
						<WorkerTokenStatusDisplayV8 mode="detailed" showRefresh={true} />{' '}
						<div style={{ marginTop: '1rem' }}>
							<button
								type="button"
								onClick={() => setShowWorkerTokenModal(true)}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									padding: '0.625rem 1.25rem',
									background: '#ef4444',
									color: 'white',
									border: 'none',
									borderRadius: '0.5rem',
									fontSize: '0.875rem',
									fontWeight: 600,
									cursor: 'pointer',
								}}
							>
								<span>🔑</span>
								Get Worker Token
							</button>
						</div>{' '}
					</div>
				</CollapsibleHeader>

				<div style={{ marginBottom: '1rem' }}>
					<h3
						style={{
							margin: '0 0 0.75rem 0',
							fontSize: '1.125rem',
							fontWeight: 600,
							color: '#1e293b',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
						}}
					>
						<span>🛡️</span> Get License Information
					</h3>
					<p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
						Enter your Organization ID to fetch organization information including region and number
						of environments.
					</p>
					<label htmlFor="organization-id" style={styles.inputLabel}>
						Organization ID
					</label>
					<input
						style={styles.input}
						id="organization-id"
						type="text"
						value={organizationId}
						onChange={(e) => persistOrganizationId(e.target.value)}
						placeholder="e.g., 97ba44f2-f7ee-4144-aa95-9e636b57c096"
						disabled={isBusy || !hasWorkerToken}
					/>
					<div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
						<button
							type="button"
							onClick={fetchOrganizationInfo}
							style={styles.button(true, isBusy || !hasWorkerToken || !organizationId.trim())}
							disabled={isBusy || !hasWorkerToken || !organizationId.trim()}
							id="fetch-organization-info-button"
						>
							<FiRefreshCw
								style={{ animation: isFetchingOrgInfo ? 'spin 1s linear infinite' : 'none' }}
							/>
							{isFetchingOrgInfo ? 'Loading...' : 'Get Organization Info'}
						</button>
					</div>
					{error && (
						<div style={styles.errorMessage}>
							<span>⚠️</span> {error}
						</div>
					)}
				</div>

				{/* Results */}
				{orgInfo && (
					<CollapsibleHeader title="Organization Information" icon={<span>ℹ️</span>} theme="blue">
						<div style={styles.licenseGrid}>
							<div style={styles.licenseCard('#3b82f6')}>
								<div style={styles.infoRow}>
									<span style={styles.infoLabel}>Name:</span>
									<span style={styles.infoValue}>{orgInfo.name}</span>
								</div>
								<div style={styles.infoRow}>
									<span style={styles.infoLabel}>Region:</span>
									<span style={styles.infoValue}>{orgInfo.region}</span>
								</div>
								<div style={styles.infoRow}>
									<span style={styles.infoLabel}>Created:</span>
									<span style={styles.infoValue}>
										{new Date(orgInfo.createdAt).toLocaleDateString()}
									</span>
								</div>
								<div style={styles.infoRow}>
									<span style={styles.infoLabel}>Updated:</span>
									<span style={styles.infoValue}>
										{new Date(orgInfo.updatedAt).toLocaleDateString()}
									</span>
								</div>
								<div style={styles.infoRow}>
									<span style={styles.infoLabel}>Total Environments:</span>
									<span style={styles.infoValue}>{orgInfo.environments.length}</span>
								</div>
							</div>
						</div>
					</CollapsibleHeader>
				)}
				{orgInfo && (
					<CollapsibleHeader title="Applied License" icon={<span>🛡️</span>} theme="green">
						<div style={styles.licenseCard('#10b981')}>
							<div style={styles.infoRow}>
								<span style={styles.infoLabel}>License Name:</span>
								<span style={styles.infoValue}>{orgInfo.license.name}</span>
							</div>
							<div style={styles.infoRow}>
								<span style={styles.infoLabel}>Status:</span>
								<span
									style={{
										...styles.infoValue,
										fontWeight: 700,
										color: orgInfo.license.status === 'active' ? '#047857' : '#b45309',
									}}
								>
									{orgInfo.license.status.toUpperCase()}
								</span>
							</div>
							<div style={styles.infoRow}>
								<span style={styles.infoLabel}>Type:</span>
								<span style={styles.infoValue}>{orgInfo.license.type}</span>
							</div>
							<div style={styles.infoRow}>
								<span style={styles.infoLabel}>Start Date:</span>
								<span style={styles.infoValue}>
									{new Date(orgInfo.license.startDate).toLocaleDateString()}
								</span>
							</div>
							{orgInfo.license.endDate && (
								<div style={styles.infoRow}>
									<span style={styles.infoLabel}>End Date:</span>
									<span style={styles.infoValue}>
										{new Date(orgInfo.license.endDate).toLocaleDateString()}
									</span>
								</div>
							)}
							{orgInfo.license.users && (
								<div style={styles.infoRow}>
									<span style={styles.infoLabel}>User Capacity:</span>
									<span
										style={styles.infoValue}
									>{`${orgInfo.license.users.used}/${orgInfo.license.users.total} used`}</span>
								</div>
							)}
							{orgInfo.license.applications && (
								<div style={styles.infoRow}>
									<span style={styles.infoLabel}>Applications:</span>
									<span
										style={styles.infoValue}
									>{`${orgInfo.license.applications.used}/${orgInfo.license.applications.total} used`}</span>
								</div>
							)}
							{orgInfo.license.features && orgInfo.license.features.length > 0 && (
								<div style={{ marginTop: '1rem' }}>
									<p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#1f2937' }}>
										Included Features
									</p>
									<div style={{ display: 'flex', flexWrap: 'wrap' }}>
										{orgInfo.license.features.map((feature) => (
											<span key={feature} style={styles.featureBadge}>
												{feature}
											</span>
										))}
									</div>
								</div>
							)}
						</div>
					</CollapsibleHeader>
				)}
				{orgInfo && (
					<CollapsibleHeader
						title={`Environments (${Math.min(5, orgInfo.environments.length)} of ${orgInfo.environments.length})`}
						icon={<span>ℹ️</span>}
						theme="highlight"
					>
						{orgInfo.environments.length === 0 ? (
							<p style={{ margin: 0, color: '#6b7280' }}>
								No environments were returned for this organization.
							</p>
						) : (
							<div style={styles.environmentTable}>
								<div style={styles.environmentHeader}>
									<span>Environment Name</span>
									<span>Region</span>
									<span>Environment ID</span>
									<span>Applied License</span>
								</div>
								<div style={{ maxHeight: '360px', overflowY: 'auto' }}>
									{orgInfo.environments.slice(0, 5).map((environment) => {
										const appliedLicenseName = environment.licenseName || 'Not Assigned';
										const appliedLicenseStatus = environment.licenseStatus;
										const appliedLicenseId = environment.licenseId;
										const appliedLicenseType = environment.licenseType;
										const isInheritedLicense = false;

										return (
											<div key={environment.id} style={styles.environmentRow}>
												<span style={styles.environmentName}>{environment.name}</span>
												<span style={styles.environmentRegion}>
													{environment.region || 'unknown'}
												</span>
												<code style={styles.environmentId}>{environment.id}</code>
												<div style={styles.environmentLicense}>
													<strong>{appliedLicenseName}</strong>
													{appliedLicenseStatus && (
														<span
															style={{
																...styles.featureBadge,
																background:
																	appliedLicenseStatus === 'active' ? '#ecfdf5' : '#fef2f2',
																color: appliedLicenseStatus === 'active' ? '#10b981' : '#dc2626',
															}}
														>
															{appliedLicenseStatus.toUpperCase()}
														</span>
													)}
													{(appliedLicenseId || appliedLicenseType || isInheritedLicense) && (
														<div style={styles.environmentLicenseMeta}>
															{appliedLicenseId && <span>License ID: {appliedLicenseId}</span>}
															{appliedLicenseType && (
																<span>License Type: {appliedLicenseType}</span>
															)}
															{isInheritedLicense && (
																<span>Inherited from organization license</span>
															)}
														</div>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</CollapsibleHeader>
				)}
				{allLicenses.length > 0 && (
					<CollapsibleHeader
						title={`All Licenses (${allLicenses.length})`}
						icon={<span>🛡️</span>}
						theme="green"
					>
						<div style={styles.licenseGrid}>
							{allLicenses.map((license) => (
								<div
									key={license.id}
									style={styles.licenseCard(
										license.status === 'active'
											? '#10b981'
											: license.status === 'expired'
												? '#ef4444'
												: license.status === 'trial'
													? '#f59e0b'
													: '#e5e7eb'
									)}
								>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											marginBottom: '1rem',
										}}
									>
										<h3 style={{ margin: 0 }}>{license.name}</h3>
										<span
											style={{
												padding: '0.25rem 0.75rem',
												borderRadius: '9999px',
												fontSize: '0.75rem',
												fontWeight: 600,
												background: license.status === 'active' ? '#ecfdf5' : '#fef2f2',
												color: license.status === 'active' ? '#059669' : '#dc2626',
											}}
										>
											{license.status.toUpperCase()}
										</span>
									</div>
									<div style={styles.infoRow}>
										<span style={styles.infoLabel}>Type:</span>
										<span style={styles.infoValue}>{license.type}</span>
									</div>
									<div style={styles.infoRow}>
										<span style={styles.infoLabel}>Start Date:</span>
										<span style={styles.infoValue}>
											{new Date(license.startDate).toLocaleDateString()}
										</span>
									</div>
								</div>
							))}
						</div>
					</CollapsibleHeader>
				)}
			</div>
		);
	};

	const canGoNext = () => {
		// Only one step now, so navigation buttons are not needed
		return false;
	};

	const canGoPrevious = () => false;

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
		<>
			<FlowHeader flowId="organization-licensing" />
			<PageContainer>
				<ContentWrapper>
					<div
						style={{
							background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
							color: 'white',
							padding: '1rem 1.5rem',
							borderRadius: '12px',
							marginBottom: '1.5rem',
							boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						<div>
							<h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
								📊 Organization Licensing
							</h2>
							<p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
								View your PingOne organization licensing information, usage statistics, and
								available features
							</p>
						</div>
						<div
							style={{
								background: 'rgba(255, 255, 255, 0.2)',
								padding: '0.5rem 1rem',
								borderRadius: '8px',
								fontSize: '0.875rem',
								fontWeight: 600,
							}}
						>
							Step 1 of 1
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
					{showWorkerTokenModal && (
						<WorkerTokenModal
							isOpen={showWorkerTokenModal}
							onClose={() => setShowWorkerTokenModal(false)}
							onContinue={() => {
								setShowWorkerTokenModal(false);
								window.dispatchEvent(new Event('workerTokenUpdated'));
							}}
						/>
					)}
					<StepNavigationButtons
						currentStep={currentStep}
						totalSteps={STEP_METADATA.length}
						onNext={handleNext}
						onPrevious={handlePrevious}
						onReset={handleReset}
						canNavigateNext={canGoNext()}
						isFirstStep
					/>
				</ContentWrapper>
			</PageContainer>
		</>
	);
};

export default OrganizationLicensingV2;
