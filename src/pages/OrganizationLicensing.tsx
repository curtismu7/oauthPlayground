// src/pages/OrganizationLicensing.tsx
// Organization Licensing: Get Worker Token & License Information

import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiInfo, FiKey, FiRefreshCw, FiShield } from 'react-icons/fi';
import { StepNavigationButtons } from '../components/StepNavigationButtons';
import { usePageStepper } from '../contexts/FloatingStepperContext';
import { usePageScroll } from '../hooks/usePageScroll';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
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
import { getOAuthTokens } from '../utils/tokenStorage';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { getAnyWorkerToken } from '../utils/workerTokenDetection';
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
		color: '#374151',
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
		border: '1px solid #fecaca',
		borderRadius: '8px',
		padding: '1rem',
		color: '#991b1b',
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
		background: '#e0f2fe',
		color: '#0369a1',
		fontSize: '0.75rem',
		fontWeight: 600,
	} as React.CSSProperties,
	environmentTable: {
		border: '1px solid #e2e8f0',
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
		color: '#475569',
	} as React.CSSProperties,
	environmentRow: {
		display: 'grid',
		gridTemplateColumns: '2fr 1fr 2fr 1.5fr',
		gap: '0.75rem',
		padding: '0.75rem 1rem',
		borderTop: '1px solid #e2e8f0',
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
		color: '#0f172a',
	} as React.CSSProperties,
	environmentId: {
		fontFamily:
			"'SFMono-Regular', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
		fontSize: '0.75rem',
		color: '#475569',
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
		color: '#64748b',
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
		color: '#111827',
	} as React.CSSProperties,
	input: {
		width: '100%',
		padding: '0.75rem',
		border: '1px solid #d1d5db',
		borderRadius: '0.5rem',
		fontSize: '1rem',
		marginBottom: '1rem',
	} as React.CSSProperties,
	inputLabel: {
		display: 'block',
		fontWeight: 600,
		color: '#374151',
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
			console.warn('[OrganizationLicensing] Unable to load stored organization ID:', error);
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

	// Get access token from all possible sources
	const getAccessToken = (): string | null => {
		// Use global worker token detection
		const globalToken = getAnyWorkerToken();
		if (globalToken) {
			console.log('[OrganizationLicensing] ✅ Valid worker token found');
			return globalToken;
		}

		// Don't use fallback tokens for organization licensing - they might not have the right scopes
		// and could cause 401 errors
		console.warn(
			'[OrganizationLicensing] ⚠️ No valid worker token found. Please generate a new token with required scopes (p1:read:organization p1:read:licensing).'
		);
		return null;
	};

	// Track if we've initialized to prevent auto-advance after user clicks reset
	const [hasInitialized, setHasInitialized] = useState(false);

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
			// Use global worker token detection (checks all possible sources)
			try {
				const workerToken = getAnyWorkerToken();
				if (workerToken) {
					setStoredTokens({ access_token: workerToken });
					return { access_token: workerToken };
				}
			} catch (e) {
				console.warn('[OrganizationLicensing] Error loading worker token:', e);
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
			console.log(
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
					console.log('Failed to load environment ID from worker token:', error);
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
	}, [hasInitialized]);

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
				console.log('Failed to update environment ID from worker token:', error);
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
			console.warn('[OrganizationLicensing] Unable to persist organization ID:', error);
		}
	};

	const fetchOrganizationInfo = async () => {
		// Use global worker token
		const globalToken = getAnyWorkerToken();
		const tokenCheck = globalToken ? { token: globalToken, isValid: true } : null;

		if (!tokenCheck || !tokenCheck.isValid || !tokenCheck.token) {
			const errorMsg =
				'No valid worker token available. Please click "Get Worker Token" to generate one with the required scopes (p1:read:organization p1:read:licensing).';
			setError(errorMsg);
			v4ToastManager.showError(errorMsg);
			return;
		}

		const accessToken = tokenCheck.token;

		if (!organizationId.trim()) {
			setError('Please enter an Organization ID.');
			v4ToastManager.showError('Please enter an Organization ID.');
			return;
		}

		setIsFetchingOrgInfo(true);
		setError(null);
		setOrgInfo(null); // Clear previous results

		try {
			console.log(
				'[OrganizationLicensing] Fetching organization info with access token and org ID:',
				organizationId.trim()
			);
			const info = await getOrganizationLicensingInfo(accessToken, organizationId.trim());

			if (info) {
				console.log('[OrganizationLicensing] Organization info received:', info);
				setOrgInfo(info);
				v4ToastManager.showSuccess('Organization licensing information loaded!');
			} else {
				const errorMsg =
					'Failed to fetch organization information. The API returned no data. This usually means:\n1. The worker token is expired or invalid\n2. The Organization ID is incorrect\n3. The worker app lacks required permissions (p1:read:organization p1:read:licensing)\n\nPlease click "Get Worker Token" to generate a new token and try again.';
				setError(errorMsg);
				v4ToastManager.showError(
					'Failed to fetch organization information. Check the error message for details.'
				);
				console.error('[OrganizationLicensing] getOrganizationLicensingInfo returned null');
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			console.error('[OrganizationLicensing] Error fetching organization info:', err);

			// Check if it's a 401 error
			if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
				const errorMsg =
					'Worker token is expired or invalid. Please click "Get Worker Token" to generate a new token with the required scopes (p1:read:organization p1:read:licensing).';
				setError(errorMsg);
				v4ToastManager.showError('Token expired or invalid. Please generate a new worker token.');
			} else {
				setError(errorMessage);
				v4ToastManager.showError(`Failed to load licensing information: ${errorMessage}`);
			}
		} finally {
			setIsFetchingOrgInfo(false);
		}
	};

	const _fetchAllLicenses = async () => {
		const accessToken = getAccessToken();
		if (!accessToken) return;

		setIsFetchingAllLicenses(true);
		try {
			const licenses = await getAllLicenses(accessToken, organizationId.trim() || undefined);
			setAllLicenses(licenses);
			v4ToastManager.showSuccess(`Successfully fetched ${licenses.length} licenses`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			setError(errorMessage);
			v4ToastManager.showError(`Failed to fetch licenses: ${errorMessage}`);
		} finally {
			setIsFetchingAllLicenses(false);
		}
	};

	const renderStep = () => {
		const workerToken = getAccessToken();
		const hasWorkerToken = Boolean(workerToken);
		// Combined step: Get Worker Token + Get License Information
		return (
			<div style={styles.stepContainer}>
				<CollapsibleHeader
					title="Worker Token Status"
					subtitle="Unified worker token service with real-time status and management"
					icon={<FiKey />}
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

						<WorkerTokenStatusDisplayV8 mode="detailed" showRefresh={true} />
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
						<FiShield /> Get License Information
					</h3>
					<p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.875rem' }}>
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
						<Button
							$variant="primary"
							onClick={fetchOrganizationInfo}
							disabled={isBusy || !hasWorkerToken || !organizationId.trim()}
							id="fetch-organization-info-button"
						>
							<FiRefreshCw
								style={{ animation: isFetchingOrgInfo ? 'spin 1s linear infinite' : 'none' }}
							/>
							{isFetchingOrgInfo ? 'Loading...' : 'Get Organization Info'}
						</Button>
					</div>
					{error && (
						<div style={styles.errorMessage}>
							<FiAlertTriangle /> {error}
						</div>
					)}
				</div>

				{/* Results */}
				{orgInfo && (
					<CollapsibleHeader title="Organization Information" icon={<FiInfo />} theme="blue">
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
					<CollapsibleHeader title="Applied License" icon={<FiShield />} theme="green">
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
						icon={<FiInfo />}
						theme="highlight"
					>
						{orgInfo.environments.length === 0 ? (
							<p style={{ margin: 0, color: '#64748b' }}>
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
																	appliedLicenseStatus === 'active' ? '#dcfce7' : '#fee2e2',
																color: appliedLicenseStatus === 'active' ? '#166534' : '#b91c1c',
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
						icon={<FiShield />}
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
												background: license.status === 'active' ? '#d1fae5' : '#fee2e2',
												color: license.status === 'active' ? '#065f46' : '#991b1b',
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
		<PageContainer>
			<ContentWrapper>
				<div
					style={{
						background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
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
							View your PingOne organization licensing information, usage statistics, and available
							features
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
	);
};

export default OrganizationLicensingV2;
