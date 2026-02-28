// src/pages/PingOneUserProfile.tsx
// PingOne User Profile viewer with worker token management
// Cache bust: 2025-02-17-11:32
// PingOne User Profile Page - Display detailed user information using real PingOne APIs

import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertTriangle,
	FiCalendar,
	FiCheckCircle,
	FiCopy,
	FiLock,
	FiRefreshCw,
	FiShield,
	FiUser,
	FiUsers,
	FiX,
} from '@icons';
import { useSearchParams } from 'react-router-dom';
import { readBestEnvironmentId } from '../hooks/useAutoEnvironmentId';
import { useGlobalWorkerToken } from '../hooks/useGlobalWorkerToken';
import { usePageScroll } from '../hooks/usePageScroll';
import PageLayoutService from '../services/pageLayoutService';
import { lookupPingOneUser } from '../services/pingOneUserProfileService';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
import { credentialManager } from '../utils/credentialManager';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { ShowTokenConfigCheckboxV8 } from '../v8/components/ShowTokenConfigCheckboxV8';
import { SilentApiConfigCheckboxV8 } from '../v8/components/SilentApiConfigCheckboxV8';
import { UserSearchDropdownV8 } from '../v8/components/UserSearchDropdownV8';
import { WorkerTokenSectionV8 } from '../v8/components/WorkerTokenSectionV8';

interface PingOneConsentRecord {
	id?: string;
	type?: string;
	name?: string;
	status?: string;
	[key: string]: unknown;
}

interface UserDataBundle {
	profile: PingOneUserProfileData;
	groups: PingOneUserGroup[];
	roles: PingOneUserRole[];
	mfa: PingOneMfaStatus;
	resolvedId: string;
	consents: PingOneConsentRecord[];
}

const extractLabel = (
	input: unknown,
	fallback: string | null = 'Not available',
	preferredKeys: string[] = ['name', 'displayName', 'label', 'description', 'type', 'value']
): string | null => {
	if (!input) return fallback;
	if (typeof input === 'string' && input.trim()) {
		return input.trim();
	}
	if (typeof input === 'object') {
		for (const key of preferredKeys) {
			const value = (input as Record<string, unknown>)[key];
			if (typeof value === 'string' && value.trim()) {
				return value.trim();
			}
		}
	}
	return fallback;
};

const extractPopulation = (population: unknown): string => {
	if (!population) return 'N/A';
	if (typeof population === 'string') return population;
	if (typeof population === 'number') return String(population);

	// Try to extract a label from common fields
	const populationName = extractLabel(population, null, [
		'name',
		'displayName',
		'id',
		'title',
		'description',
		'value',
	]);
	if (populationName) return populationName;

	// If it's an object, check for id field (could be string or number)
	if (typeof population === 'object' && population !== null) {
		const popObj = population as Record<string, unknown>;
		if ('id' in popObj && popObj.id !== null && popObj.id !== undefined) {
			return String(popObj.id);
		}
		// Check for nested population object
		if ('population' in popObj) {
			return extractPopulation(popObj.population);
		}
		// Log what we found for debugging
		console.log('[extractPopulation] Unhandled population structure:', {
			population,
			keys: Object.keys(popObj),
			values: Object.values(popObj).slice(0, 3), // First 3 values for debugging
		});
	}
	return 'N/A';
};

const normalizeAuthMethodValue = (input: unknown): string | null => {
	if (!input) return null;
	if (typeof input === 'string' && input.trim()) {
		return input.trim();
	}
	if (typeof input === 'object') {
		const candidate = extractLabel(input, '', ['name', 'displayName', 'type', 'value', 'method']);
		return candidate || null;
	}
	return null;
};

const collectAuthMethods = (methods: unknown): string[] => {
	if (!methods) return [];
	if (Array.isArray(methods)) {
		const values = methods
			.map((method) => normalizeAuthMethodValue(method))
			.filter((value): value is string => Boolean(value));
		return Array.from(new Set(values.map((value) => value.trim())));
	}
	const single = normalizeAuthMethodValue(methods);
	return single ? [single] : [];
};

const buildConsentMap = (consents: PingOneConsentRecord[]): Map<string, string> => {
	const map = new Map<string, string>();
	consents.forEach((consent) => {
		const label =
			extractLabel(consent, 'Consent', ['name', 'type', 'description', 'label']) || 'Consent';
		const status = extractLabel(consent.status, 'unknown', ['status', 'state']) || 'unknown';
		map.set(label, status);
	});
	return map;
};

const isAffirmativeStatus = (status: string): boolean => {
	const normalized = status.trim().toLowerCase();
	return [
		'granted',
		'active',
		'enabled',
		'accepted',
		'allow',
		'allowed',
		'approved',
		'true',
		'consented',
	].includes(normalized);
};

interface PingOneUserProfileData {
	id?: string;
	name?:
		| string
		| { formatted?: string; givenName?: string; familyName?: string; [key: string]: unknown };
	given_name?: string;
	preferred_username?: string;
	username?: string;
	email?: string;
	email_verified?: boolean;
	enabled?: boolean;
	primaryAuthenticationMethod?: string | Record<string, unknown>;
	authenticationMethods?: Array<string | Record<string, unknown>>;
	authoritativeIdentityProfile?: { name?: string } | Record<string, unknown>;
	identityProvider?: { name?: string; type?: string } | Record<string, unknown>;
	createdAt?: string;
	created_at?: string;
	updatedAt?: string;
	updated_at?: string;
	population?: { name?: string } | Record<string, unknown>;
	account?: { status?: string; syncState?: string };
	syncState?: string;
	consents?: Array<{ status?: string; type?: string; name?: string }>;
	[key: string]: unknown;
}

interface PingOneUserGroup {
	id?: string;
	name?: string;
	[key: string]: unknown;
}

interface PingOneUserRole {
	id?: string;
	name?: string;
	[key: string]: unknown;
}

interface PingOneMfaDetails {
	enabled?: boolean;
	status?: string;
	devices?: Array<Record<string, unknown>>;
	[key: string]: unknown;
}

type PingOneMfaStatus = PingOneMfaDetails | null;

import type { CSSProperties } from 'react';

const styles: Record<string, CSSProperties> = {
	pageContainer: {
		maxWidth: '1200px',
		margin: '0 auto',
		padding: '2rem',
		background: '#f8fafc',
		minHeight: '100vh',
	},
	header: {
		background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
		borderRadius: '1rem',
		padding: '2rem',
		marginBottom: '2rem',
		textAlign: 'center',
	},
	headerInner: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: '1rem',
	},
	userAvatar: {
		width: '64px',
		height: '64px',
		borderRadius: '50%',
		background: 'white',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		color: '#dc2626',
		fontSize: '1.5rem',
		fontWeight: 600,
		flexShrink: 0,
	},
	userInfo: {
		flex: 1,
		textAlign: 'left',
	},
	userInfoName: {
		margin: 0,
		fontSize: '1.875rem',
		fontWeight: 700,
		color: 'white',
	},
	userInfoSubtitle: {
		color: 'rgba(255,255,255,0.9)',
		fontSize: '0.875rem',
		marginTop: '0.25rem',
	},
	tokenStatusValid: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '0.5rem',
		marginTop: '0.5rem',
		fontSize: '0.8125rem',
		fontWeight: 500,
		color: 'rgba(255,255,255,0.9)',
	},
	tokenStatusExpired: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '0.5rem',
		marginTop: '0.5rem',
		fontSize: '0.8125rem',
		fontWeight: 500,
		color: '#fef3c7',
	},
	tokenStatusMissing: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '0.5rem',
		marginTop: '0.5rem',
		fontSize: '0.8125rem',
		fontWeight: 500,
		color: '#fecaca',
	},
	compareTable: {
		width: '100%',
		borderCollapse: 'collapse',
		fontSize: '0.875rem',
		marginTop: '1rem',
	},
	compareHeaderCell: {
		textAlign: 'left',
		padding: '0.75rem',
		background: '#f8fafc',
		borderBottom: '1px solid #e2e8f0',
		fontSize: '0.875rem',
		fontWeight: 700,
		textTransform: 'uppercase',
		letterSpacing: '0.05em',
		color: '#475569',
	},
	compareCell: {
		padding: '0.75rem',
		borderBottom: '1px solid #e2e8f0',
		verticalAlign: 'top',
		color: '#475569',
		fontWeight: 500,
	},
	compareCellEmphasize: {
		padding: '0.75rem',
		borderBottom: '1px solid #e2e8f0',
		verticalAlign: 'top',
		color: '#1f2937',
		fontWeight: 600,
	},
	compareBadgeActive: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.25rem',
		padding: '0.25rem 0.5rem',
		borderRadius: '9999px',
		fontSize: '0.75rem',
		fontWeight: 600,
		background: '#dcfce7',
		color: '#166534',
	},
	compareBadgeInactive: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.25rem',
		padding: '0.25rem 0.5rem',
		borderRadius: '9999px',
		fontSize: '0.75rem',
		fontWeight: 600,
		background: '#fee2e2',
		color: '#991b1b',
	},
	tabsContainer: {
		display: 'flex',
		gap: '0.5rem',
		marginBottom: '1.5rem',
		borderBottom: '2px solid #e5e7eb',
	},
	tabActive: {
		padding: '0.75rem 1.5rem',
		border: 'none',
		background: 'none',
		cursor: 'pointer',
		fontSize: '0.875rem',
		fontWeight: 500,
		color: '#3b82f6',
		borderBottom: '2px solid #3b82f6',
		marginBottom: '-2px',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	},
	tabInactive: {
		padding: '0.75rem 1.5rem',
		border: 'none',
		background: 'none',
		cursor: 'pointer',
		fontSize: '0.875rem',
		fontWeight: 500,
		color: '#6b7280',
		borderBottom: '2px solid transparent',
		marginBottom: '-2px',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	},
	alertBanner: {
		padding: '1rem 1.5rem',
		background: '#fef3c7',
		border: '1px solid #fbbf24',
		borderRadius: '0.5rem',
		marginBottom: '1.5rem',
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		color: '#92400e',
	},
	section: {
		background: 'white',
		borderRadius: '0.75rem',
		padding: '1.5rem',
		marginBottom: '1.5rem',
		boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
	},
	sectionHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: '1.5rem',
		paddingBottom: '1rem',
		borderBottom: '1px solid #e5e7eb',
	},
	sectionHeaderH2: {
		margin: 0,
		fontSize: '1.125rem',
		fontWeight: 600,
		color: '#1f2937',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	},
	sectionTimestamp: {
		color: '#6b7280',
		fontSize: '0.875rem',
	},
	fieldGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(2, 1fr)',
		gap: '1.5rem',
	},
	fieldLabel: {
		fontSize: '0.75rem',
		fontWeight: 500,
		color: '#6b7280',
		textTransform: 'uppercase',
		letterSpacing: '0.05em',
		marginBottom: '0.5rem',
	},
	fieldValue: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		fontSize: '0.875rem',
		color: '#1f2937',
		fontWeight: 500,
	},
	verificationBadgeVerified: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.25rem',
		fontSize: '0.75rem',
		padding: '0.25rem 0.5rem',
		borderRadius: '0.25rem',
		marginLeft: '0.5rem',
		background: '#dcfce7',
		color: '#166534',
	},
	verificationBadgeUnverified: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.25rem',
		fontSize: '0.75rem',
		padding: '0.25rem 0.5rem',
		borderRadius: '0.25rem',
		marginLeft: '0.5rem',
		background: '#fee2e2',
		color: '#991b1b',
	},
	infoCards: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
		gap: '1rem',
	},
	infoCard: {
		padding: '1.5rem',
		background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
		borderRadius: '0.5rem',
		border: '1px solid #e5e7eb',
		textAlign: 'center',
	},
	infoCardIcon: {
		fontSize: '2rem',
		marginBottom: '0.75rem',
		color: '#3b82f6',
	},
	infoCardValue: {
		fontSize: '1.5rem',
		fontWeight: 700,
		color: '#1f2937',
		marginBottom: '0.25rem',
	},
	infoCardLabel: {
		fontSize: '0.875rem',
		color: '#6b7280',
		textTransform: 'uppercase',
		letterSpacing: '0.05em',
	},
	statusTagList: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: '0.5rem',
	},
	statusTag: {
		background: '#f1f5f9',
		color: '#0f172a',
		padding: '0.3rem 0.75rem',
		borderRadius: '9999px',
		fontSize: '0.75rem',
		fontWeight: 600,
	},
	statusSection: {
		marginTop: '1.5rem',
	},
	statusHeading: {
		margin: '0 0 0.5rem',
		fontSize: '0.9rem',
		fontWeight: 600,
		color: '#0f172a',
	},
	loadingState: {
		padding: '3rem',
		textAlign: 'center',
		color: '#6b7280',
	},
	errorState: {
		padding: '2rem',
		background: '#fee2e2',
		border: '1px solid #fca5a5',
		borderRadius: '0.5rem',
		color: '#991b1b',
		textAlign: 'center',
	},
	userSelectorCard: {
		background: 'white',
		borderRadius: '0.75rem',
		padding: '2rem',
		maxWidth: '860px',
		margin: '2rem auto',
		boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
	},
	selectorPageHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: '1rem',
		maxWidth: '860px',
		margin: '0 auto',
		padding: '1.5rem 2rem',
		background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
		borderRadius: '0.75rem',
		boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
	},
	selectorPageHeaderH1: {
		margin: 0,
		fontSize: '1.5rem',
		fontWeight: 700,
		color: 'white',
	},
	selectorPageHeaderP: {
		margin: '0.25rem 0 0',
		fontSize: '0.9rem',
		color: 'rgba(255,255,255,0.85)',
	},
	serverErrorModalOverlay: {
		position: 'fixed',
		inset: 0,
		background: 'rgba(0,0,0,0.6)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 10000,
	},
	serverErrorModalContent: {
		background: 'white',
		borderRadius: '0.75rem',
		padding: '2rem',
		maxWidth: '550px',
		margin: '1rem',
		boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
		border: '3px solid #dc2626',
	},
	serverErrorModalTitle: {
		fontSize: '1.5rem',
		fontWeight: 700,
		color: '#1f2937',
		margin: '0 0 1rem 0',
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
	},
	serverErrorModalMessage: {
		fontSize: '1rem',
		color: '#374151',
		lineHeight: 1.6,
		margin: '0 0 1.5rem 0',
	},
	serverErrorModalInstructions: {
		fontSize: '0.9rem',
		color: '#374151',
		lineHeight: 1.6,
		margin: '0 0 1.5rem 0',
		padding: '1rem',
		background: '#f3f4f6',
		borderRadius: '0.5rem',
		borderLeft: '4px solid #3b82f6',
	},
	serverErrorModalActions: {
		display: 'flex',
		justifyContent: 'flex-end',
		gap: '0.75rem',
	},
	serverErrorModalButton: {
		padding: '0.75rem 1.5rem',
		background: '#3b82f6',
		color: 'white',
		border: 'none',
		borderRadius: '0.5rem',
		fontSize: '1rem',
		fontWeight: 600,
		cursor: 'pointer',
	},
	inputField: {
		marginBottom: '1.5rem',
	},
	inputLabel: {
		display: 'block',
		fontSize: '0.875rem',
		fontWeight: 500,
		color: '#374151',
		marginBottom: '0.5rem',
	},
	inputEl: {
		width: '100%',
		padding: '0.75rem',
		border: '1px solid #d1d5db',
		borderRadius: '0.375rem',
		fontSize: '0.875rem',
	},
};

const PingOneUserProfile: React.FC = () => {
	usePageScroll({ pageName: 'PingOne User Profile', force: true });
	const [searchParams] = useSearchParams();

	// Use global worker token service (unified storage) - MUST be called before any useState hooks
	// IMPORTANT: This hook must be called first to maintain consistent hook order
	const globalTokenStatus = useGlobalWorkerToken();

	// Use global worker token instead of custom accessToken state
	const accessToken = globalTokenStatus.token || '';

	// PageLayoutService setup
	const pageConfig = {
		title: 'PingOne User Profile',
		subtitle: 'View detailed user information using real PingOne APIs',
		maxWidth: '1200px',
		showHeader: true,
		showFooter: false,
		responsive: true,
	};

	const { PageContainer } = PageLayoutService.createPageLayout(pageConfig);

	const [activeTab, setActiveTab] = useState<'profile' | 'user-status' | 'compare-access'>(
		'profile'
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// User data state
	const [userProfile, setUserProfile] = useState<PingOneUserProfileData | null>(null);
	const [userGroups, setUserGroups] = useState<PingOneUserGroup[]>([]);
	const [userRoles, setUserRoles] = useState<PingOneUserRole[]>([]);
	const [mfaStatus, setMfaStatus] = useState<PingOneMfaStatus>(null);
	const [userConsents, setUserConsents] = useState<PingOneConsentRecord[]>([]);
	const [populationDetails, setPopulationDetails] = useState<Record<string, unknown> | null>(null);
	const [comparisonPopulationDetails, setComparisonPopulationDetails] = useState<Record<
		string,
		unknown
	> | null>(null);

	const USER_IDENTIFIER_STORAGE_KEY = 'pingone_user_identifier';
	const initialIdentifier =
		searchParams.get('userId') ||
		searchParams.get('sub') ||
		localStorage.getItem(USER_IDENTIFIER_STORAGE_KEY) ||
		'';
	const [userIdentifier, setUserIdentifier] = useState(initialIdentifier);
	const [resolvedUserId, setResolvedUserId] = useState(initialIdentifier);
	const [environmentId, setEnvironmentId] = useState(() => {
		// URL param takes highest priority, then fall back to any stored source
		const searchParamEnvId = searchParams.get('environmentId');
		if (searchParamEnvId) return searchParamEnvId;
		return readBestEnvironmentId();
	});
	// Always show user selector initially - user must explicitly load the profile
	const [showUserSelector, setShowUserSelector] = useState(true);

	// Start over function - resets all user-specific state
	const handleStartOver = useCallback(() => {
		setUserProfile(null);
		setUserGroups([]);
		setUserRoles([]);
		setMfaStatus(null);
		setUserConsents([]);
		setPopulationDetails(null);
		setUserIdentifier('');
		setResolvedUserId('');
		localStorage.removeItem(USER_IDENTIFIER_STORAGE_KEY);
		setError(null);
		setLoading(false);
		setShowUserSelector(true);
		setActiveTab('profile');
		// Clear comparison data if any
		setComparisonProfile(null);
		setComparisonGroups([]);
		setComparisonRoles([]);
		setComparisonMfaStatus(null);
		setComparisonConsents([]);
		setCompareIdentifier('');
		setComparisonResolvedId('');
		setComparisonError(null);
		setIsComparisonLoading(false);
	}, []);

	const [showServerErrorModal, setShowServerErrorModal] = useState(false);
	const [_savedWorkerCredentials, setSavedWorkerCredentials] = useState(() =>
		credentialManager.getAllCredentials()
	);
	const [identifierError, setIdentifierError] = useState<string | null>(null);
	const [isResolvingUser, setIsResolvingUser] = useState(false);
	const [compareIdentifier, setCompareIdentifier] = useState('');
	const [comparisonResolvedId, setComparisonResolvedId] = useState('');
	const [comparisonProfile, setComparisonProfile] = useState<PingOneUserProfileData | null>(null);
	const [comparisonGroups, setComparisonGroups] = useState<PingOneUserGroup[]>([]);
	const [comparisonRoles, setComparisonRoles] = useState<PingOneUserRole[]>([]);
	const [comparisonMfaStatus, setComparisonMfaStatus] = useState<PingOneMfaStatus>(null);
	const [comparisonConsents, setComparisonConsents] = useState<PingOneConsentRecord[]>([]);
	const [isComparisonLoading, setIsComparisonLoading] = useState(false);
	const [comparisonError, setComparisonError] = useState<string | null>(null);

	const fetchUserBundle = useCallback(
		async (targetUserId: string): Promise<UserDataBundle> => {
			const profileResponse = await fetch(
				`/api/pingone/user/${encodeURIComponent(targetUserId)}?environmentId=${encodeURIComponent(environmentId)}&accessToken=${encodeURIComponent(accessToken)}`
			);

			if (!profileResponse.ok) {
				if (profileResponse.status === 401) {
					const unauthorizedError = new Error('Worker token unauthorized') as Error & {
						status?: number;
					};
					unauthorizedError.status = 401;
					throw unauthorizedError;
				}

				let errorMessage = `Failed to fetch user profile (${profileResponse.status})`;
				const rawBody = await profileResponse.text().catch(() => '');
				if (rawBody) {
					try {
						const parsed = JSON.parse(rawBody);
						const detail =
							parsed.error_description || parsed.message || parsed.error || parsed.detail;
						if (detail) {
							errorMessage = `${errorMessage}: ${detail}`;
						}
					} catch {
						const trimmed = rawBody.trim();
						if (trimmed) {
							errorMessage = `${errorMessage}: ${trimmed}`;
						}
					}
				}

				if (profileResponse.status === 400) {
					errorMessage +=
						' • Verify the user ID and ensure the worker token includes p1:read:user scope.';
				}

				const enrichedError = new Error(errorMessage) as Error & { status?: number };
				enrichedError.status = profileResponse.status;
				throw enrichedError;
			}

			const profile = (await profileResponse.json()) as PingOneUserProfileData;
			const resolvedId = profile.id || targetUserId;

			let groups: PingOneUserGroup[] = [];
			let roles: PingOneUserRole[] = [];
			let mfa: PingOneMfaStatus = null;
			let consents: PingOneConsentRecord[] = [];

			try {
				const [groupsPayload, rolesPayload, mfaPayload, consentsPayload] = await Promise.all([
					fetch(
						`/api/pingone/user/${encodeURIComponent(resolvedId)}/groups?environmentId=${encodeURIComponent(environmentId)}&accessToken=${encodeURIComponent(accessToken)}`
					)
						.then((r) => {
							console.log('[fetchUserBundle] Groups fetch response status:', r.status, r.ok);
							return r.ok ? r.json() : { _embedded: { groups: [] } };
						})
						.then((payload) => {
							console.log(
								'[fetchUserBundle] Groups payload received:',
								JSON.stringify(payload, null, 2).substring(0, 1500)
							);
							return payload;
						}) as Promise<{
						_embedded?: {
							groups?: PingOneUserGroup[];
							items?: PingOneUserGroup[];
							memberOfGroups?: PingOneUserGroup[];
						};
					}>,
					fetch(
						`/api/pingone/user/${encodeURIComponent(resolvedId)}/roles?environmentId=${encodeURIComponent(environmentId)}&accessToken=${encodeURIComponent(accessToken)}`
					).then((r) => (r.ok ? r.json() : { _embedded: { roles: [] } })) as Promise<{
						_embedded?: { roles?: PingOneUserRole[]; items?: PingOneUserRole[] };
					}>,
					fetch(
						`/api/pingone/user/${encodeURIComponent(resolvedId)}/mfa?environmentId=${encodeURIComponent(environmentId)}&accessToken=${encodeURIComponent(accessToken)}`
					).then((r) => (r.ok ? r.json() : null)) as Promise<PingOneMfaStatus>,
					fetch(
						`/api/pingone/user/${encodeURIComponent(resolvedId)}/consents?environmentId=${encodeURIComponent(environmentId)}&accessToken=${encodeURIComponent(accessToken)}`
					).then((r) => (r.ok ? r.json() : { _embedded: { consents: [] } })) as Promise<{
						_embedded?: { consents?: PingOneConsentRecord[]; items?: PingOneConsentRecord[] };
					}>,
				]);

				const embeddedGroups = groupsPayload._embedded as
					| {
							groups?: Array<
								PingOneUserGroup | { group?: PingOneUserGroup; [key: string]: unknown }
							>;
							items?: Array<
								PingOneUserGroup | { group?: PingOneUserGroup; [key: string]: unknown }
							>;
							memberOfGroups?: Array<
								PingOneUserGroup | { group?: PingOneUserGroup; [key: string]: unknown }
							>;
					  }
					| undefined;
				if (embeddedGroups) {
					// Backend expands memberOfGroups into groups, so check groups first
					if (Array.isArray(embeddedGroups.groups)) {
						groups = embeddedGroups.groups.map((item) => {
							if (item && typeof item === 'object') {
								// If item has nested group object, extract it
								if ('group' in item && item.group && typeof item.group === 'object') {
									return item.group as PingOneUserGroup;
								}
								// Otherwise use item as-is (backend already expanded)
								return item as PingOneUserGroup;
							}
							return item as PingOneUserGroup;
						});
					} else if (Array.isArray(embeddedGroups.items)) {
						groups = embeddedGroups.items.map((item) => {
							if (item && typeof item === 'object' && 'group' in item && item.group) {
								return item.group as PingOneUserGroup;
							}
							return item as PingOneUserGroup;
						});
					} else if (Array.isArray(embeddedGroups.memberOfGroups)) {
						// Fallback: extract groups from memberOfGroups if backend didn't expand
						groups = embeddedGroups.memberOfGroups.map((item) => {
							if (item && typeof item === 'object') {
								// Check if item has nested group object
								if ('group' in item && item.group && typeof item.group === 'object') {
									return item.group as PingOneUserGroup;
								}
								// Check if item itself is the group (has name/id)
								if (
									'name' in item ||
									'displayName' in item ||
									('id' in item && !('group' in item))
								) {
									return item as PingOneUserGroup;
								}
							}
							return item as PingOneUserGroup;
						});
					}
				}
				if (!groups.length && Array.isArray(groupsPayload)) {
					groups = groupsPayload.map((item) => {
						if (item && typeof item === 'object' && 'group' in item && item.group) {
							return item.group as PingOneUserGroup;
						}
						return item as PingOneUserGroup;
					});
				}
				if (
					!groups.length &&
					groupsPayload &&
					typeof groupsPayload === 'object' &&
					'groups' in groupsPayload &&
					Array.isArray(groupsPayload.groups)
				) {
					groups = (
						groupsPayload.groups as Array<
							PingOneUserGroup | { group?: PingOneUserGroup; [key: string]: unknown }
						>
					).map((item) => {
						if (item && typeof item === 'object' && 'group' in item && item.group) {
							return item.group as PingOneUserGroup;
						}
						return item as PingOneUserGroup;
					});
				}
				if (
					!groups.length &&
					groupsPayload &&
					typeof groupsPayload === 'object' &&
					'memberOfGroups' in groupsPayload &&
					Array.isArray(groupsPayload.memberOfGroups)
				) {
					groups = (
						groupsPayload.memberOfGroups as Array<
							PingOneUserGroup | { group?: PingOneUserGroup; [key: string]: unknown }
						>
					).map((item) => {
						if (item && typeof item === 'object' && 'group' in item && item.group) {
							return item.group as PingOneUserGroup;
						}
						return item as PingOneUserGroup;
					});
				}

				const embeddedRoles = rolesPayload._embedded as
					| {
							roles?: PingOneUserRole[];
							roleAssignments?: Array<{ role?: PingOneUserRole; [key: string]: unknown }>;
							items?: PingOneUserRole[];
					  }
					| undefined;
				if (embeddedRoles) {
					// Backend expands roleAssignments into roles, so check roles first
					if (Array.isArray(embeddedRoles.roles)) {
						roles = embeddedRoles.roles;
					} else if (Array.isArray(embeddedRoles.items)) {
						roles = embeddedRoles.items;
					} else if (Array.isArray(embeddedRoles.roleAssignments)) {
						// Fallback: extract roles from roleAssignments if backend didn't expand
						roles = embeddedRoles.roleAssignments
							.map((assignment) => {
								if (assignment && typeof assignment === 'object') {
									// Check if assignment has nested role object
									if (
										'role' in assignment &&
										assignment.role &&
										typeof assignment.role === 'object'
									) {
										return assignment.role as PingOneUserRole;
									}
									// Check if assignment itself is the role (has name/id)
									if ('name' in assignment || 'displayName' in assignment || 'id' in assignment) {
										return assignment as PingOneUserRole;
									}
								}
								return null;
							})
							.filter((role): role is PingOneUserRole => Boolean(role));
					}
				}
				if (!roles.length && Array.isArray(rolesPayload)) {
					roles = rolesPayload;
				}
				if (
					!roles.length &&
					Array.isArray(
						(
							rolesPayload as {
								roleAssignments?: Array<{ role?: PingOneUserRole; [key: string]: unknown }>;
							}
						).roleAssignments
					)
				) {
					roles = (
						rolesPayload as {
							roleAssignments: Array<{ role?: PingOneUserRole; [key: string]: unknown }>;
						}
					).roleAssignments
						.map((assignment) => assignment.role)
						.filter((role): role is PingOneUserRole => Boolean(role));
				}
				if (
					!roles.length &&
					rolesPayload &&
					typeof rolesPayload === 'object' &&
					'roles' in rolesPayload &&
					Array.isArray(rolesPayload.roles)
				) {
					roles = (
						rolesPayload.roles as Array<
							PingOneUserRole | { role?: PingOneUserRole; [key: string]: unknown }
						>
					).map((item) => {
						if (item && typeof item === 'object' && 'role' in item && item.role) {
							return item.role as PingOneUserRole;
						}
						return item as PingOneUserRole;
					});
				}
				if (
					!roles.length &&
					rolesPayload &&
					typeof rolesPayload === 'object' &&
					'roleAssignments' in rolesPayload &&
					Array.isArray(rolesPayload.roleAssignments)
				) {
					roles = (
						rolesPayload.roleAssignments as Array<{
							role?: PingOneUserRole;
							[key: string]: unknown;
						}>
					)
						.map((assignment) => assignment.role)
						.filter((role): role is PingOneUserRole => Boolean(role));
				}

				console.log('[fetchUserBundle] ===== GROUPS DEBUG =====');
				console.log('[fetchUserBundle] Final groups count:', groups.length);
				console.log('[fetchUserBundle] Groups payload keys:', Object.keys(groupsPayload || {}));
				console.log(
					'[fetchUserBundle] Groups _embedded keys:',
					groupsPayload._embedded ? Object.keys(groupsPayload._embedded) : 'NO _embedded'
				);
				console.log(
					'[fetchUserBundle] Groups _embedded.groups:',
					groupsPayload._embedded?.groups
						? `Array of ${groupsPayload._embedded.groups.length}`
						: 'NOT FOUND'
				);
				console.log(
					'[fetchUserBundle] Groups _embedded.memberOfGroups:',
					groupsPayload._embedded?.memberOfGroups
						? `Array of ${groupsPayload._embedded.memberOfGroups.length}`
						: 'NOT FOUND'
				);
				console.log(
					'[fetchUserBundle] Groups _embedded.items:',
					groupsPayload._embedded?.items
						? `Array of ${groupsPayload._embedded.items.length}`
						: 'NOT FOUND'
				);
				console.log(
					'[fetchUserBundle] First group (if any):',
					groups.length > 0 ? groups[0] : 'NONE'
				);
				console.log('[fetchUserBundle] ===== END GROUPS DEBUG =====');

				console.log('[fetchUserBundle] Groups, Roles, and Population:', {
					groupsCount: groups.length,
					rolesCount: roles.length,
					groupsPayloadKeys: Object.keys(groupsPayload || {}),
					rolesPayloadKeys: Object.keys(rolesPayload || {}),
					groupsEmbeddedKeys: groupsPayload._embedded ? Object.keys(groupsPayload._embedded) : [],
					rolesEmbeddedKeys: rolesPayload._embedded ? Object.keys(rolesPayload._embedded) : [],
					groupsSample: groups.length > 0 ? groups[0] : null,
					rolesSample: roles.length > 0 ? roles[0] : null,
					groupsSampleKeys: groups.length > 0 && groups[0] ? Object.keys(groups[0]) : [],
					rolesSampleKeys: roles.length > 0 && roles[0] ? Object.keys(roles[0]) : [],
					groupsSampleName:
						groups.length > 0 ? groups[0]?.name || groups[0]?.displayName || groups[0]?.id : null,
					rolesSampleName:
						roles.length > 0 ? roles[0]?.name || roles[0]?.displayName || roles[0]?.id : null,
					profilePopulation: profile.population,
					populationType: typeof profile.population,
					populationKeys:
						profile.population && typeof profile.population === 'object'
							? Object.keys(profile.population)
							: [],
					populationExtracted: extractPopulation(profile.population),
					rawGroupsPayload: JSON.stringify(groupsPayload, null, 2).substring(0, 1000),
					rawRolesPayload: JSON.stringify(rolesPayload, null, 2).substring(0, 1000),
				});

				mfa = mfaPayload;
				const embeddedConsents = consentsPayload._embedded as
					| {
							consents?: PingOneConsentRecord[];
							items?: PingOneConsentRecord[];
					  }
					| undefined;
				if (embeddedConsents) {
					if (Array.isArray(embeddedConsents.consents)) {
						consents = embeddedConsents.consents;
					} else if (Array.isArray(embeddedConsents.items)) {
						consents = embeddedConsents.items;
					}
				}
				if (
					!consents.length &&
					Array.isArray((profile as { consents?: PingOneConsentRecord[] }).consents)
				) {
					consents = ((profile as { consents?: PingOneConsentRecord[] }).consents ?? []).filter(
						Boolean
					);
				}
			} catch (additionalError) {
				console.error('Failed to fetch additional user data:', additionalError);
			}

			return {
				profile,
				groups,
				roles,
				mfa,
				resolvedId,
				consents,
			};
		},
		[environmentId, accessToken]
	);

	const fetchUserProfile = useCallback(
		async (targetUserId?: string) => {
			const effectiveUserId = targetUserId ?? resolvedUserId;

			if (!effectiveUserId || !environmentId || !accessToken) {
				setError('Please provide a User ID, Environment ID, and Worker Token to load a profile.');
				setLoading(false);
				setShowUserSelector(true);
				return;
			}

			setLoading(true);
			setError(null);

			try {
				const bundle = await fetchUserBundle(effectiveUserId);
				setUserProfile(bundle.profile);
				setResolvedUserId(bundle.resolvedId);
				setUserGroups(bundle.groups);
				setUserRoles(bundle.roles);
				setMfaStatus(bundle.mfa);
				setUserConsents(bundle.consents);
			} catch (err: unknown) {
				console.error('Failed to fetch user profile:', err);
				const status = (err as { status?: number })?.status;
				const message = err instanceof Error ? err.message : 'Failed to load user profile';
				if (status === 401 || message === 'Worker token unauthorized') {
					v4ToastManager.showError(
						'Worker token expired or missing permissions. Please generate a new worker token.'
					);
					// Clear worker token through unified service
					setShowUserSelector(true);
					return;
				}
				v4ToastManager.showError(message);
				setError(message);
			} finally {
				setLoading(false);
			}
		},
		[resolvedUserId, environmentId, accessToken, fetchUserBundle]
	);

	// Fetch population details if we have a population ID but no name
	useEffect(() => {
		if (!userProfile?.population || !environmentId || !accessToken) {
			setPopulationDetails(null);
			return;
		}

		const pop = userProfile.population;
		// If it's already a string with a name, no need to fetch
		if (
			typeof pop === 'string' &&
			!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pop)
		) {
			setPopulationDetails(null);
			return;
		}

		// Get population ID
		let populationId: string | null = null;
		if (typeof pop === 'string') {
			populationId = pop;
		} else if (typeof pop === 'object' && pop !== null) {
			const popObj = pop as Record<string, unknown>;
			// Check if we already have a name
			if (popObj.name || popObj.displayName) {
				setPopulationDetails(popObj);
				return;
			}
			populationId = popObj.id ? String(popObj.id) : null;
		}

		if (!populationId) {
			setPopulationDetails(null);
			return;
		}

		// Fetch population details
		fetch(
			`/api/pingone/population/${encodeURIComponent(populationId)}?environmentId=${encodeURIComponent(environmentId)}&accessToken=${encodeURIComponent(accessToken)}`
		)
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (data) {
					setPopulationDetails(data);
				}
			})
			.catch((err) => {
				console.error('[Population] Failed to fetch population details:', err);
			});
	}, [userProfile?.population, environmentId, accessToken]);

	// Update environment ID when worker token is updated
	useEffect(() => {
		const handleTokenUpdate = () => {
			try {
				const data = unifiedWorkerTokenService.getTokenDataSync();
				if (data?.credentials?.environmentId && !environmentId) {
					setEnvironmentId(data.credentials.environmentId);
				}
			} catch (error) {
				console.log('Failed to update environment ID from worker token:', error);
			}
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		return () => window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
	}, [environmentId]);

	// Fetch population details for comparison user
	useEffect(() => {
		if (!comparisonProfile?.population || !environmentId || !accessToken) {
			setComparisonPopulationDetails(null);
			return;
		}

		let populationId: string | null = null;
		if (typeof comparisonProfile.population === 'string') {
			populationId = comparisonProfile.population;
		} else if (typeof comparisonProfile.population === 'number') {
			populationId = String(comparisonProfile.population);
		} else if (comparisonProfile.population && typeof comparisonProfile.population === 'object') {
			const popObj = comparisonProfile.population as Record<string, unknown>;
			// Check if we already have a name
			if (popObj.name || popObj.displayName) {
				setComparisonPopulationDetails(popObj);
				return;
			}
			populationId = popObj.id ? String(popObj.id) : null;
		}

		if (!populationId) {
			setComparisonPopulationDetails(null);
			return;
		}

		// Fetch population details
		fetch(
			`/api/pingone/population/${encodeURIComponent(populationId)}?environmentId=${encodeURIComponent(environmentId)}&accessToken=${encodeURIComponent(accessToken)}`
		)
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (data) {
					setComparisonPopulationDetails(data);
				}
			})
			.catch((err) => {
				console.error('[Comparison Population] Failed to fetch population details:', err);
			});
	}, [comparisonProfile?.population, environmentId, accessToken]);

	const handleLoadUserProfile = useCallback(async () => {
		if (!accessToken) {
			v4ToastManager.showError('Generate a worker token before loading a profile.');
			return;
		}

		if (!globalTokenStatus.isValid) {
			v4ToastManager.showError('Worker token expired. Generate a new worker token to continue.');
			return;
		}

		if (!environmentId.trim()) {
			v4ToastManager.showError('Please provide an Environment ID');
			return;
		}

		if (!userIdentifier.trim()) {
			const message = 'User identifier is required (user ID, username, or email).';
			setIdentifierError(message);
			v4ToastManager.showError(message);
			return;
		}

		setIdentifierError(null);
		setIsResolvingUser(true);

		const trimmedIdentifier = userIdentifier.trim();
		const trimmedEnvironment = environmentId.trim();
		const trimmedAccessToken = accessToken.trim();

		// Double-check all values are non-empty before making the request
		if (!trimmedEnvironment || !trimmedAccessToken || !trimmedIdentifier) {
			const missing = [];
			if (!trimmedEnvironment) missing.push('Environment ID');
			if (!trimmedAccessToken) missing.push('Worker Token');
			if (!trimmedIdentifier) missing.push('User Identifier');
			const message = `Missing required fields: ${missing.join(', ')}`;
			setIdentifierError(message);
			v4ToastManager.showError(message);
			setIsResolvingUser(false);
			return;
		}

		try {
			const lookupResult = await lookupPingOneUser({
				environmentId: trimmedEnvironment,
				accessToken: trimmedAccessToken,
				identifier: trimmedIdentifier,
			});
			const matchedUser = lookupResult.user as Partial<PingOneUserProfileData> | undefined;
			const resolvedId = matchedUser?.id;
			if (!resolvedId) {
				throw new Error('Unable to find a user matching that identifier.');
			}
			setResolvedUserId(resolvedId);
			setUserProfile(null);
			setUserGroups([]);
			setUserRoles([]);
			setMfaStatus(null);
			setUserConsents([]);
			const finalIdentifier =
				matchedUser?.preferred_username ||
				matchedUser?.username ||
				matchedUser?.email ||
				trimmedIdentifier;
			if (finalIdentifier) {
				setUserIdentifier(finalIdentifier);
			}
			try {
				localStorage.setItem('worker_environment_id', trimmedEnvironment);
				// Clear worker token through unified service
				if (finalIdentifier) {
					localStorage.setItem(USER_IDENTIFIER_STORAGE_KEY, finalIdentifier);
				}
			} catch (storageError) {
				console.warn('Unable to persist credentials to localStorage:', storageError);
			}
			setShowUserSelector(false);
			await fetchUserProfile(resolvedId);
			if (lookupResult.matchType) {
				v4ToastManager.showSuccess(`User matched by ${lookupResult.matchType}.`);
			} else {
				v4ToastManager.showSuccess('User resolved successfully.');
			}
		} catch (err) {
			// Check if this is a server error (500)
			if (err instanceof Error && 'isServerError' in err && err.isServerError) {
				setShowServerErrorModal(true);
				setIdentifierError('Backend server is not responding');
			} else {
				const message = err instanceof Error ? err.message : 'Unable to resolve user identifier.';
				setIdentifierError(message);
				v4ToastManager.showError(message);
			}
		} finally {
			setIsResolvingUser(false);
		}
	}, [accessToken, environmentId, userIdentifier, fetchUserProfile, globalTokenStatus.isValid]);

	const handleLoadComparisonUser = useCallback(async () => {
		if (!accessToken) {
			v4ToastManager.showError('Generate a worker token before comparing access.');
			return;
		}

		if (!globalTokenStatus.isValid) {
			v4ToastManager.showError(
				'Worker token expired. Generate a new worker token to compare access.'
			);
			return;
		}

		if (!environmentId.trim()) {
			v4ToastManager.showError('Please provide an Environment ID');
			return;
		}

		if (!compareIdentifier.trim()) {
			const message = 'Comparison user identifier is required (user ID, username, or email).';
			setComparisonError(message);
			v4ToastManager.showError(message);
			return;
		}

		setComparisonError(null);
		setIsComparisonLoading(true);

		const trimmedIdentifier = compareIdentifier.trim();
		const trimmedEnvironment = environmentId.trim();

		try {
			const lookupResult = await lookupPingOneUser({
				environmentId: trimmedEnvironment,
				accessToken,
				identifier: trimmedIdentifier,
			});
			const matchedUser = lookupResult.user as Partial<PingOneUserProfileData> | undefined;
			const resolvedId = (matchedUser?.id as string) || trimmedIdentifier;
			if (!resolvedId) {
				throw new Error('Unable to find a user matching that identifier.');
			}

			const bundle = await fetchUserBundle(resolvedId);
			setComparisonProfile(bundle.profile);
			setComparisonResolvedId(bundle.resolvedId);
			setComparisonGroups(bundle.groups);
			setComparisonRoles(bundle.roles);
			setComparisonMfaStatus(bundle.mfa);
			setComparisonConsents(bundle.consents);
			if (matchedUser?.preferred_username || matchedUser?.username || matchedUser?.email) {
				setCompareIdentifier(
					(matchedUser.preferred_username as string) ||
						(matchedUser.username as string) ||
						(matchedUser.email as string) ||
						trimmedIdentifier
				);
			}
			if (lookupResult.matchType) {
				v4ToastManager.showSuccess(`Comparison user matched by ${lookupResult.matchType}.`);
			} else {
				v4ToastManager.showSuccess('Comparison user resolved successfully.');
			}
		} catch (err) {
			// Check if this is a server error (500)
			if (err instanceof Error && 'isServerError' in err && err.isServerError) {
				setShowServerErrorModal(true);
				setComparisonError('Backend server is not responding');
			} else {
				const message = err instanceof Error ? err.message : 'Unable to resolve comparison user.';
				setComparisonError(message);
				v4ToastManager.showError(message);
			}
		} finally {
			setIsComparisonLoading(false);
		}
	}, [accessToken, environmentId, compareIdentifier, fetchUserBundle, globalTokenStatus.isValid]);

	const handleClearComparison = useCallback(() => {
		setComparisonProfile(null);
		setComparisonResolvedId('');
		setComparisonGroups([]);
		setComparisonRoles([]);
		setComparisonMfaStatus(null);
		setComparisonConsents([]);
		setComparisonError(null);
	}, []);

	useEffect(() => {
		if (showUserSelector) {
			setLoading(false);
			setError(null);
		}
	}, [showUserSelector]);

	useEffect(() => {
		const handleStorageChange = (event: StorageEvent) => {
			if (!event.key || event.key === 'pingone_permanent_credentials') {
				setSavedWorkerCredentials(credentialManager.getAllCredentials());
			}
		};

		window.addEventListener('storage', handleStorageChange);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
		};
	}, []);

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess('Copied to clipboard!');
	};

	const getInitials = (nameInput: unknown): string => {
		if (typeof nameInput !== 'string') {
			if (nameInput && typeof nameInput === 'object') {
				const formatted = (nameInput as { formatted?: string }).formatted;
				if (formatted && typeof formatted === 'string') {
					return getInitials(formatted);
				}
			}
			return 'U';
		}

		const name = nameInput.trim();
		if (!name) return 'U';
		const parts = name.split(' ').filter(Boolean);
		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	};

	const formatDate = (dateString: string) => {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	if (loading) {
		return (
			<div style={styles.pageContainer}>
				<div style={styles.loadingState}>
					<FiRefreshCw className="animate-spin" size={24} style={{ marginBottom: '1rem' }} />
					<p>Loading user profile...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div style={styles.pageContainer}>
				<div style={styles.errorState}>
					<FiAlertTriangle size={24} style={{ marginBottom: '1rem' }} />
					<p>{error}</p>
					<button
						type="button"
						onClick={() => fetchUserProfile()}
						style={{
							marginTop: '1rem',
							padding: '0.5rem 1rem',
							background: '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '0.375rem',
							cursor: 'pointer',
						}}
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	// Worker token state derived from global hook
	const hasValidWorkerToken = globalTokenStatus.isValid && !!globalTokenStatus.token;
	const workerTokenStatusVariant: 'valid' | 'expired' | 'missing' = hasValidWorkerToken
		? 'valid'
		: globalTokenStatus.token
			? 'expired'
			: 'missing';
	const workerTokenStatusMessage = hasValidWorkerToken
		? `Worker token active. ${globalTokenStatus.message}.`
		: globalTokenStatus.token
			? `${globalTokenStatus.message}. Refresh before making new API calls.`
			: globalTokenStatus.message;
	const workerTokenStatusDetail = '';

	if (!userProfile && showUserSelector) {
		return (
			<div style={styles.pageContainer}>
				<div style={styles.selectorPageHeader}>
					<FiUser size={36} style={{ color: 'white', flexShrink: 0 }} />
					<div>
						<h1 style={styles.selectorPageHeaderH1}>Select User to View Profile</h1>
						<p style={styles.selectorPageHeaderP}>
							Look up a PingOne user by ID, username, or email address
						</p>
					</div>
				</div>
				<div style={styles.userSelectorCard}>
					{hasValidWorkerToken ? (
						<div
							style={{
								...styles.alertBanner,
								background: '#dcfce7',
								border: '1px solid #34d399',
								color: '#047857',
							}}
						>
							<FiCheckCircle />
							<span>Worker token detected. Token is active.</span>
						</div>
					) : (
						<div style={styles.alertBanner}>
							<FiAlertTriangle />
							<span>
								No worker token found or token expired. Generate one to load a user profile.
							</span>
						</div>
					)}
					<div style={styles.inputField}>
						<label htmlFor="environmentId" style={styles.inputLabel}>
							Environment ID *
						</label>
						<input
							id="environmentId"
							type="text"
							value={environmentId}
							onChange={(e) => setEnvironmentId(e.target.value)}
							placeholder="Enter PingOne Environment ID"
							style={styles.inputEl}
						/>
					</div>

					{/* Worker Token Section */}
					<WorkerTokenSectionV8 compact environmentId={environmentId} />

					{/* Configuration Checkboxes */}
					<div
						style={{
							marginBottom: '1rem',
							display: 'flex',
							flexDirection: 'row',
							flexWrap: 'wrap',
							gap: '1.5rem',
						}}
					>
						<SilentApiConfigCheckboxV8 />
						<ShowTokenConfigCheckboxV8 />
					</div>

					<div style={styles.inputField}>
						<label htmlFor="userIdentifier" style={styles.inputLabel}>
							User Identifier *
						</label>
						<UserSearchDropdownV8
							environmentId={environmentId}
							value={userIdentifier}
							onChange={(value) => {
								setUserIdentifier(value);
								setIdentifierError(null);
								// Persist to localStorage as user types
								try {
									if (value.trim()) {
										localStorage.setItem(USER_IDENTIFIER_STORAGE_KEY, value);
									} else {
										localStorage.removeItem(USER_IDENTIFIER_STORAGE_KEY);
									}
								} catch (storageError) {
									console.warn('Unable to persist user identifier to localStorage:', storageError);
								}
							}}
							placeholder="Search for a user by ID, username, or email..."
							disabled={!environmentId.trim() || !accessToken.trim()}
							id="userIdentifier"
							autoLoad={true}
						/>
						<div style={{ color: '#64748b', fontSize: '0.75rem' }}>
							Search and select a user from the dropdown list in the selected environment.
						</div>
						{identifierError && (
							<div style={{ color: '#b91c1c', fontSize: '0.75rem', marginTop: '0.5rem' }}>
								{identifierError}
							</div>
						)}
					</div>
					<button
						type="button"
						onClick={() => handleLoadUserProfile()}
						disabled={
							isResolvingUser ||
							!userIdentifier.trim() ||
							!environmentId.trim() ||
							!accessToken.trim()
						}
						style={{
							width: '100%',
							padding: '0.75rem',
							background:
								isResolvingUser ||
								!userIdentifier.trim() ||
								!environmentId.trim() ||
								!accessToken.trim()
									? '#9ca3af'
									: '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '0.375rem',
							fontSize: '0.875rem',
							fontWeight: '600',
							cursor:
								isResolvingUser ||
								!userIdentifier.trim() ||
								!environmentId.trim() ||
								!accessToken.trim()
									? 'not-allowed'
									: 'pointer',
						}}
					>
						{isResolvingUser ? 'Resolving user…' : 'Load User Profile'}
					</button>
				</div>
			</div>
		);
	}

	if (!userProfile && !showUserSelector) {
		return (
			<PageContainer>
				<ErrorState>
					<p>
						No user data available. Provide a User ID, Environment ID, and Worker Token using the
						selector above. Worker tokens cannot determine the user automatically, so enter the user
						ID manually when prompted.
					</p>
					<button
						type="button"
						onClick={() => setShowUserSelector(true)}
						style={{
							marginTop: '1rem',
							padding: '0.5rem 1rem',
							background: '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '0.375rem',
							cursor: 'pointer',
						}}
					>
						Select User
					</button>
				</ErrorState>
			</PageContainer>
		);
	}

	if (!userProfile) {
		return null;
	}

	const userName = (() => {
		if (!userProfile) return 'User';
		const { name } = userProfile;
		if (typeof name === 'string') {
			return name;
		}
		if (name && typeof name === 'object') {
			const formatted = (name as { formatted?: string }).formatted;
			if (formatted && typeof formatted === 'string') {
				return formatted;
			}
			const givenName = (name as { givenName?: string }).givenName || userProfile.given_name;
			const familyName = (name as { familyName?: string }).familyName;
			const pieces = [givenName, familyName].filter(Boolean);
			if (pieces.length) {
				return pieces.join(' ');
			}
		}
		return (
			userProfile.given_name || userProfile.preferred_username || userProfile.username || 'User'
		);
	})();

	// Get population name - use fetched details if available, otherwise extract from profile
	const getPopulationName = (): string => {
		if (populationDetails) {
			const name = extractLabel(populationDetails, null, [
				'name',
				'displayName',
				'title',
				'description',
			]);
			if (name) return name;
		}
		return extractPopulation(userProfile?.population);
	};

	// Get comparison population name - use fetched details if available, otherwise extract from profile
	const getComparisonPopulationName = (): string => {
		if (comparisonPopulationDetails) {
			const name = extractLabel(comparisonPopulationDetails, null, [
				'name',
				'displayName',
				'title',
				'description',
			]);
			if (name) return name;
		}
		return extractPopulation(comparisonProfile?.population);
	};

	const nameDetails =
		userProfile?.name && typeof userProfile.name === 'object'
			? (userProfile.name as { formatted?: string; givenName?: string; familyName?: string })
			: null;
	const givenNameValue =
		userProfile?.given_name ||
		nameDetails?.givenName ||
		(typeof userProfile?.name === 'string' ? userProfile?.name : '');
	const formattedNameValue = nameDetails?.formatted || userName;
	const email = (userProfile.email ?? '') as string;
	const emailVerified = Boolean(userProfile.email_verified);
	const enabledStatusText =
		userProfile.enabled === undefined ? 'Unknown' : userProfile.enabled ? 'Enabled' : 'Disabled';
	const accountStatusText = userProfile.account?.status || enabledStatusText;
	const syncStatusText =
		userProfile.account?.syncState ||
		(typeof userProfile.syncState === 'string' ? userProfile.syncState : '') ||
		'Not available';
	// Extract Authoritative Identity Provider/Profile - check multiple possible fields
	const identityProfileName = (() => {
		const authProfile = userProfile.authoritativeIdentityProfile || userProfile.identityProvider;
		if (!authProfile) return 'Not assigned';

		// Try to extract name from various field names
		const name = extractLabel(authProfile, null, [
			'name',
			'displayName',
			'description',
			'title',
			'type',
		]);
		if (name && name !== 'Not assigned') return name;

		// If it's an object, check for nested properties
		if (typeof authProfile === 'object' && authProfile !== null) {
			const obj = authProfile as Record<string, unknown>;
			// Check for identityProvider nested object
			if (obj.identityProvider && typeof obj.identityProvider === 'object') {
				const idpName = extractLabel(obj.identityProvider, null, ['name', 'displayName', 'type']);
				if (idpName) return idpName;
			}
			// Check for id and use it as fallback
			if (obj.id) return String(obj.id);
		}

		return 'Not assigned';
	})();
	const authenticationMethodsDisplay = collectAuthMethods(userProfile.authenticationMethods);
	// Extract Primary Authentication Method - check multiple possible locations
	const primaryAuthMethodText = (() => {
		// First try primaryAuthenticationMethod field
		const primaryMethod = normalizeAuthMethodValue(userProfile.primaryAuthenticationMethod);
		if (primaryMethod) return primaryMethod;

		// Then try authenticationMethods array
		if (authenticationMethodsDisplay.length > 0) {
			return authenticationMethodsDisplay[0];
		}

		// Check if there's a type or method field in the profile
		if (userProfile && typeof userProfile === 'object') {
			const profileObj = userProfile as Record<string, unknown>;
			const typeMethod = normalizeAuthMethodValue(
				profileObj.type || profileObj.method || profileObj.authenticationType
			);
			if (typeMethod) return typeMethod;
		}

		return 'Not set';
	})();
	// Determine MFA status - check mfaStatus first, then profile fields as fallback
	const determineMfaStatus = (
		mfa: PingOneMfaStatus | null,
		profile: PingOneUserProfileData | null
	): { enabled: boolean; text: string } => {
		if (mfa?.enabled !== undefined) {
			return {
				enabled: mfa.enabled,
				text: mfa.enabled
					? mfa.status
						? `Enabled (${mfa.status})`
						: 'Enabled'
					: mfa.status
						? `Disabled (${mfa.status})`
						: 'Disabled',
			};
		}
		// Fallback: check profile for MFA-related fields
		if (profile) {
			const mfaEnabled = (profile as { mfaEnabled?: boolean }).mfaEnabled;
			const mfaStatusField = (profile as { mfaStatus?: string }).mfaStatus;
			if (mfaEnabled !== undefined) {
				return {
					enabled: mfaEnabled,
					text: mfaEnabled ? 'Enabled' : 'Disabled',
				};
			}
			if (mfaStatusField) {
				const statusLower = String(mfaStatusField).toLowerCase();
				const enabled = statusLower === 'enabled' || statusLower === 'active';
				return {
					enabled,
					text: mfaStatusField,
				};
			}
		}
		return { enabled: false, text: 'Unknown' };
	};

	const mfaStatusResult = determineMfaStatus(mfaStatus, userProfile);
	const mfaStatusText = mfaStatusResult.text;
	const primaryConsentMap = buildConsentMap(userConsents);
	const consentDisplay = Array.from(primaryConsentMap.entries()).map(
		([label, status]) => `${label}: ${status}`
	);

	const comparisonUserName = (() => {
		if (!comparisonProfile) return 'Comparison User';
		const { name } = comparisonProfile;
		if (typeof name === 'string') {
			return name;
		}
		if (name && typeof name === 'object') {
			const formatted = (name as { formatted?: string }).formatted;
			if (formatted && typeof formatted === 'string') {
				return formatted;
			}
			const givenName = (name as { givenName?: string }).givenName || comparisonProfile.given_name;
			const familyName = (name as { familyName?: string }).familyName;
			const pieces = [givenName, familyName].filter(Boolean);
			if (pieces.length) {
				return pieces.join(' ');
			}
		}
		return (
			comparisonProfile.given_name ||
			comparisonProfile.preferred_username ||
			comparisonProfile.username ||
			'Comparison User'
		);
	})();

	const comparisonEnabledStatusText =
		comparisonProfile?.enabled === undefined
			? 'Unknown'
			: comparisonProfile.enabled
				? 'Enabled'
				: 'Disabled';

	const comparisonAccountStatusText =
		comparisonProfile?.account?.status || comparisonEnabledStatusText;

	const comparisonSyncStatusText =
		comparisonProfile?.account?.syncState ||
		(typeof comparisonProfile?.syncState === 'string' ? comparisonProfile.syncState : '') ||
		'Not available';

	// Extract Comparison Authoritative Identity Provider/Profile - same logic as primary
	const comparisonIdentityProfileName = (() => {
		if (!comparisonProfile) return 'Not assigned';
		const authProfile =
			comparisonProfile.authoritativeIdentityProfile || comparisonProfile.identityProvider;
		if (!authProfile) return 'Not assigned';

		// Try to extract name from various field names
		const name = extractLabel(authProfile, null, [
			'name',
			'displayName',
			'description',
			'title',
			'type',
		]);
		if (name && name !== 'Not assigned') return name;

		// If it's an object, check for nested properties
		if (typeof authProfile === 'object' && authProfile !== null) {
			const obj = authProfile as Record<string, unknown>;
			// Check for identityProvider nested object
			if (obj.identityProvider && typeof obj.identityProvider === 'object') {
				const idpName = extractLabel(obj.identityProvider, null, ['name', 'displayName', 'type']);
				if (idpName) return idpName;
			}
			// Check for id and use it as fallback
			if (obj.id) return String(obj.id);
		}

		return 'Not assigned';
	})();

	const comparisonAuthMethodsDisplay = collectAuthMethods(comparisonProfile?.authenticationMethods);
	// Extract Primary Authentication Method for comparison user
	const comparisonPrimaryAuthMethodText = (() => {
		if (!comparisonProfile) return 'N/A';

		// First try primaryAuthenticationMethod field
		const primaryMethod = normalizeAuthMethodValue(comparisonProfile.primaryAuthenticationMethod);
		if (primaryMethod) return primaryMethod;

		// Then try authenticationMethods array
		if (comparisonAuthMethodsDisplay.length > 0) {
			return comparisonAuthMethodsDisplay[0];
		}

		// Check if there's a type or method field in the profile
		if (typeof comparisonProfile === 'object') {
			const profileObj = comparisonProfile as Record<string, unknown>;
			const typeMethod = normalizeAuthMethodValue(
				profileObj.type || profileObj.method || profileObj.authenticationType
			);
			if (typeMethod) return typeMethod;
		}

		return 'Not set';
	})();

	const comparisonMfaResult = determineMfaStatus(comparisonMfaStatus, comparisonProfile);
	const comparisonMfaText = comparisonMfaResult.text;

	const comparisonConsentMap = buildConsentMap(comparisonConsents);
	const comparisonConsentDisplay = Array.from(comparisonConsentMap.entries()).map(
		([label, status]) => `${label}: ${status}`
	);

	const primaryGroupNames = userGroups
		.map((group) => extractLabel(group, null, ['name', 'displayName', 'title', 'description']))
		.filter((name): name is string => Boolean(name?.trim()))
		.map((name) => name.trim());

	const comparisonGroupNames = comparisonGroups
		.map((group) => extractLabel(group, null, ['name', 'displayName', 'title', 'description']))
		.filter((name): name is string => Boolean(name?.trim()))
		.map((name) => name.trim());

	const allGroupNames = Array.from(new Set([...primaryGroupNames, ...comparisonGroupNames])).sort(
		(a, b) => a.localeCompare(b)
	);
	const allAuthMethods = Array.from(
		new Set([...authenticationMethodsDisplay, ...comparisonAuthMethodsDisplay])
	).sort((a, b) => a.localeCompare(b));
	const allConsentLabels = Array.from(
		new Set([...primaryConsentMap.keys(), ...comparisonConsentMap.keys()])
	).sort((a, b) => a.localeCompare(b));

	const comparisonLoaded = Boolean(comparisonProfile);

	// Get username for primary and comparison users
	const primaryUsername = userProfile?.preferred_username || userProfile?.username || 'N/A';
	const comparisonUsername =
		comparisonProfile?.preferred_username ||
		comparisonProfile?.username ||
		(comparisonLoaded ? 'N/A' : 'N/A');

	const comparisonSummaryRows = [
		{
			label: 'User ID',
			primary: userProfile?.id || resolvedUserId || 'N/A',
			secondary: comparisonProfile?.id || comparisonResolvedId || 'N/A',
		},
		{
			label: 'Username',
			primary: primaryUsername,
			secondary: comparisonLoaded ? comparisonUsername : 'N/A',
		},
		{
			label: 'Enabled',
			primary: enabledStatusText,
			secondary: comparisonLoaded ? comparisonEnabledStatusText : 'N/A',
		},
		{
			label: 'Account Status',
			primary: accountStatusText,
			secondary: comparisonLoaded ? comparisonAccountStatusText : 'N/A',
		},
		{
			label: 'Primary Authentication Method',
			primary: primaryAuthMethodText,
			secondary: comparisonLoaded ? comparisonPrimaryAuthMethodText : 'N/A',
		},
		{
			label: 'Authoritative Identity Profile',
			primary: identityProfileName,
			secondary: comparisonLoaded ? comparisonIdentityProfileName : 'N/A',
		},
		{
			label: 'MFA Status',
			primary: mfaStatusText,
			secondary: comparisonLoaded ? comparisonMfaText : 'N/A',
		},
		{
			label: 'Sync Status',
			primary: syncStatusText,
			secondary: comparisonLoaded ? comparisonSyncStatusText : 'N/A',
		},
		{
			label: 'Population',
			primary: getPopulationName(),
			secondary: comparisonLoaded ? getComparisonPopulationName() : 'N/A',
		},
		{
			label: 'Group Count',
			primary: userGroups.length.toString(),
			secondary: comparisonLoaded ? comparisonGroups.length.toString() : 'N/A',
		},
		{
			label: 'Role Count',
			primary: userRoles.length.toString(),
			secondary: comparisonLoaded ? comparisonRoles.length.toString() : 'N/A',
		},
		{
			label: 'Authentication Methods',
			primary: authenticationMethodsDisplay.length
				? authenticationMethodsDisplay.join(', ')
				: 'None',
			secondary: comparisonLoaded
				? comparisonAuthMethodsDisplay.length
					? comparisonAuthMethodsDisplay.join(', ')
					: 'None'
				: 'N/A',
		},
		{
			label: 'Consent Records',
			primary: consentDisplay.length ? consentDisplay.join(', ') : 'None',
			secondary: comparisonLoaded
				? comparisonConsentDisplay.length
					? comparisonConsentDisplay.join(', ')
					: 'None'
				: 'N/A',
		},
	];

	return (
		<PageContainer>
			<Header>
				<UserAvatar>{getInitials(userName)}</UserAvatar>
				<UserInfo>
					<h1>{userName}</h1>
					<div className="subtitle">Identity Management</div>
					<TokenStatus $variant={workerTokenStatusVariant}>
						{workerTokenStatusVariant === 'valid' ? (
							<FiCheckCircle size={16} />
						) : (
							<FiAlertTriangle size={16} />
						)}
						<div>
							{workerTokenStatusMessage}
							{workerTokenStatusDetail && (
								<div
									style={{
										fontSize: '0.75rem',
										color: 'rgba(255, 255, 255, 0.9)',
										marginTop: '0.125rem',
									}}
								>
									{workerTokenStatusDetail}
								</div>
							)}
						</div>
					</TokenStatus>
				</UserInfo>
				<button
					type="button"
					onClick={handleStartOver}
					style={{
						padding: '0.5rem 1rem',
						background: 'white',
						color: '#dc2626',
						border: '1px solid white',
						borderRadius: '0.375rem',
						fontSize: '0.875rem',
						fontWeight: '600',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						marginLeft: 'auto',
					}}
					title="Start over and select a different user"
				>
					<FiRefreshCw size={16} />
					Start Over
				</button>
			</Header>

			<TabsContainer>
				<Tab $active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>
					<FiCalendar /> Profile
				</Tab>
				<Tab $active={activeTab === 'user-status'} onClick={() => setActiveTab('user-status')}>
					<FiCheckCircle /> User Status
				</Tab>
				<Tab
					$active={activeTab === 'compare-access'}
					onClick={() => setActiveTab('compare-access')}
				>
					<FiShield /> Compare Access
				</Tab>
			</TabsContainer>

			{/* Dormant Account Alert */}
			{userProfile.account?.status === 'DORMANT' && (
				<AlertBanner>
					<FiAlertTriangle size={20} />
					<span>Dormant Account Alert</span>
				</AlertBanner>
			)}

			{activeTab === 'profile' && (
				<>
					{/* Profile Details */}
					<Section>
						<SectionHeader>
							<h2>
								<FiUser /> Profile Details
							</h2>
						</SectionHeader>
						<FieldGrid>
							<Field>
								<div className="field-label">User ID</div>
								<div className="field-value">
									{userProfile.id || resolvedUserId || 'N/A'}
									<FiCopy
										size={14}
										className="copy-btn"
										onClick={() => copyToClipboard(userProfile.id || resolvedUserId || '')}
									/>
								</div>
							</Field>
							<Field>
								<div className="field-label">Given Name</div>
								<div className="field-value">
									{givenNameValue || 'N/A'}
									<FiCopy
										size={14}
										className="copy-btn"
										onClick={() => copyToClipboard(givenNameValue || formattedNameValue || '')}
									/>
								</div>
							</Field>
							<Field>
								<div className="field-label">Username</div>
								<div className="field-value">
									{userProfile.preferred_username || userProfile.username || 'N/A'}
									<FiCopy
										size={14}
										className="copy-btn"
										onClick={() =>
											copyToClipboard(userProfile.preferred_username || userProfile.username || '')
										}
									/>
								</div>
							</Field>
							<Field>
								<div className="field-label">Email</div>
								<div className="field-value">
									{email || 'N/A'}
									{email && (
										<>
											<FiCopy
												size={14}
												className="copy-btn"
												onClick={() => copyToClipboard(email)}
											/>
											<span
												className={`verification-badge ${emailVerified ? 'verified' : 'not-verified'}`}
											>
												{emailVerified ? (
													<>
														<FiCheckCircle size={12} /> Verified
													</>
												) : (
													<>
														<FiX size={12} /> Not Verified
													</>
												)}
											</span>
										</>
									)}
								</div>
							</Field>
							<Field>
								<div className="field-label">Created Date</div>
								<div className="field-value">
									{formatDate(userProfile.createdAt || userProfile.created_at || '')}
								</div>
							</Field>
							<Field>
								<div className="field-label">Last Updated</div>
								<div className="field-value">
									{formatDate(userProfile.updatedAt || userProfile.updated_at || '')}
								</div>
							</Field>
							<Field>
								<div className="field-label">Population</div>
								<div className="field-value">{getPopulationName()}</div>
							</Field>
						</FieldGrid>
					</Section>

					{/* Other Information */}
					<Section>
						<SectionHeader>
							<h2>
								<FiUser /> Other Information
							</h2>
							<span className="timestamp">
								{new Date().toLocaleString('en-US', {
									month: 'short',
									day: 'numeric',
									year: 'numeric',
									hour: '2-digit',
									minute: '2-digit',
								})}
							</span>
						</SectionHeader>
						<InfoCards>
							<InfoCard>
								<div className="icon">
									<FiUsers />
								</div>
								<div className="value">{getPopulationName()}</div>
								<div className="label">Department Population</div>
							</InfoCard>
							<InfoCard>
								<div className="icon" style={{ color: '#10b981' }}>
									<FiUsers />
								</div>
								<div className="value">{userGroups.length}</div>
								<div className="label">Group Count</div>
							</InfoCard>
							<InfoCard>
								<div
									className="icon"
									style={{ color: mfaStatusResult.enabled ? '#10b981' : '#ef4444' }}
								>
									<FiLock />
								</div>
								<div className="value">{mfaStatusResult.text}</div>
								<div className="label">MFA Status</div>
							</InfoCard>
							<InfoCard>
								<div className="icon" style={{ color: '#8b5cf6' }}>
									<FiShield />
								</div>
								<div className="value">{userRoles.length}</div>
								<div className="label">Roles</div>
							</InfoCard>
						</InfoCards>
					</Section>

					<Section>
						<SectionHeader>
							<h2>
								<FiUsers /> Group Memberships
							</h2>
						</SectionHeader>
						{userGroups.length ? (
							<StatusTagList>
								{userGroups.map((group, index) => {
									const groupName = extractLabel(group, null, [
										'name',
										'displayName',
										'title',
										'description',
									]);
									return (
										<StatusTag key={group.id || groupName || `group-${index}`}>
											{groupName || `Group ${index + 1}`}
										</StatusTag>
									);
								})}
							</StatusTagList>
						) : (
							<p style={{ color: '#64748b', margin: 0 }}>
								No group memberships found for this user.
							</p>
						)}
					</Section>
				</>
			)}

			{activeTab === 'user-status' && (
				<Section>
					<SectionHeader>
						<h2>
							<FiCheckCircle /> User Status Overview
						</h2>
					</SectionHeader>
					<FieldGrid>
						<Field>
							<div className="field-label">Enabled</div>
							<div className="field-value">{enabledStatusText}</div>
						</Field>
						<Field>
							<div className="field-label">Account Status</div>
							<div className="field-value">{accountStatusText}</div>
						</Field>
						<Field>
							<div className="field-label">Primary Authentication Method</div>
							<div className="field-value">{primaryAuthMethodText}</div>
						</Field>
						<Field>
							<div className="field-label">Authoritative Identity Profile</div>
							<div className="field-value">{identityProfileName}</div>
						</Field>
						<Field>
							<div className="field-label">MFA Status</div>
							<div className="field-value">{mfaStatusText}</div>
						</Field>
						<Field>
							<div className="field-label">Sync Status</div>
							<div className="field-value">{syncStatusText}</div>
						</Field>
					</FieldGrid>

					<StatusSection>
						<StatusHeading>Authentication Methods</StatusHeading>
						{authenticationMethodsDisplay.length ? (
							<StatusTagList>
								{authenticationMethodsDisplay.map((method) => (
									<StatusTag key={method}>{method}</StatusTag>
								))}
							</StatusTagList>
						) : (
							<p style={{ color: '#64748b', margin: 0 }}>No authentication methods recorded.</p>
						)}
					</StatusSection>

					<StatusSection>
						<StatusHeading>Consent Records</StatusHeading>
						{primaryConsentMap.size ? (
							<StatusTagList>
								{consentDisplay.map((entry, index) => (
									<StatusTag key={`${entry}-${index}`}>{entry}</StatusTag>
								))}
							</StatusTagList>
						) : (
							<p style={{ color: '#64748b', margin: 0 }}>No consent records.</p>
						)}
					</StatusSection>
				</Section>
			)}

			{activeTab === 'compare-access' && (
				<>
					<Section>
						<SectionHeader>
							<h2>
								<FiShield /> Compare Access
							</h2>
							{comparisonLoaded && (
								<span className="timestamp">
									Comparing {userName} vs {comparisonUserName}
								</span>
							)}
						</SectionHeader>
						{!comparisonLoaded && (
							<p style={{ color: '#64748b', marginBottom: '1rem' }}>
								Enter a second user identifier to compare entitlements, groups, roles, and
								authentication settings side-by-side.
							</p>
						)}
						{comparisonError && (
							<AlertBanner style={{ marginBottom: '1rem' }}>
								<FiAlertTriangle />
								<span>{comparisonError}</span>
							</AlertBanner>
						)}
						<InputField>
							<label htmlFor="compareIdentifier">Comparison User Identifier *</label>
							<UserSearchDropdownV8
								environmentId={environmentId}
								value={compareIdentifier}
								onChange={(value) => {
									setCompareIdentifier(value);
									setComparisonError(null);
								}}
								placeholder="Search for a user by ID, username, or email..."
								disabled={!environmentId.trim() || !accessToken.trim()}
								id="compareIdentifier"
								autoLoad={true}
							/>
							<div style={{ color: '#64748b', fontSize: '0.75rem' }}>
								Search and select a user from the dropdown list for comparison.
							</div>
						</InputField>
						<div
							style={{
								display: 'flex',
								gap: '0.75rem',
								flexWrap: 'wrap',
								marginBottom: comparisonLoaded ? '0' : '0.5rem',
							}}
						>
							<button
								type="button"
								onClick={() => handleLoadComparisonUser()}
								disabled={
									isComparisonLoading ||
									!compareIdentifier.trim() ||
									!environmentId.trim() ||
									!accessToken.trim()
								}
								style={{
									flex: '0 0 auto',
									padding: '0.75rem 1.5rem',
									background:
										isComparisonLoading ||
										!compareIdentifier.trim() ||
										!environmentId.trim() ||
										!accessToken.trim()
											? '#9ca3af'
											: '#2563eb',
									color: '#ffffff',
									border: 'none',
									borderRadius: '0.375rem',
									fontSize: '0.875rem',
									fontWeight: 600,
									cursor:
										isComparisonLoading ||
										!compareIdentifier.trim() ||
										!environmentId.trim() ||
										!accessToken.trim()
											? 'not-allowed'
											: 'pointer',
								}}
							>
								{isComparisonLoading ? 'Resolving comparison user…' : 'Load Comparison User'}
							</button>
							{comparisonLoaded && (
								<button
									type="button"
									onClick={() => handleClearComparison()}
									style={{
										flex: '0 0 auto',
										padding: '0.75rem 1.5rem',
										background: '#e2e8f0',
										color: '#1f2937',
										border: 'none',
										borderRadius: '0.375rem',
										fontSize: '0.875rem',
										fontWeight: 600,
										cursor: 'pointer',
									}}
								>
									Clear Comparison
								</button>
							)}
						</div>
						{isComparisonLoading && (
							<LoadingState>
								<FiRefreshCw
									className="animate-spin"
									size={20}
									style={{ marginBottom: '0.75rem' }}
								/>
								<p>Loading comparison data…</p>
							</LoadingState>
						)}
					</Section>

					{comparisonLoaded && (
						<>
							<Section>
								<SectionHeader>
									<h2>
										<FiShield /> Access Summary
									</h2>
									<span className="timestamp">
										{new Date().toLocaleString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric',
											hour: '2-digit',
											minute: '2-digit',
										})}
									</span>
								</SectionHeader>
								<CompareTable>
									<thead>
										<tr>
											<CompareHeaderCell>Setting</CompareHeaderCell>
											<CompareHeaderCell>{userName}</CompareHeaderCell>
											<CompareHeaderCell>{comparisonUserName}</CompareHeaderCell>
										</tr>
									</thead>
									<tbody>
										{comparisonSummaryRows.map((row) => (
											<tr key={row.label}>
												<CompareCell $emphasize>{row.label}</CompareCell>
												<CompareCell>{row.primary}</CompareCell>
												<CompareCell>{row.secondary}</CompareCell>
											</tr>
										))}
									</tbody>
								</CompareTable>
							</Section>

							<Section>
								<SectionHeader>
									<h2>
										<FiUsers /> Group Membership
									</h2>
								</SectionHeader>
								{allGroupNames.length ? (
									<CompareTable>
										<thead>
											<tr>
												<CompareHeaderCell>Group</CompareHeaderCell>
												<CompareHeaderCell>{userName}</CompareHeaderCell>
												<CompareHeaderCell>{comparisonUserName}</CompareHeaderCell>
											</tr>
										</thead>
										<tbody>
											{allGroupNames.map((groupName) => {
												const primaryHas = primaryGroupNames.includes(groupName);
												const comparisonHas = comparisonGroupNames.includes(groupName);
												return (
													<tr key={groupName}>
														<CompareCell $emphasize>{groupName}</CompareCell>
														<CompareCell>
															<CompareBadge $active={primaryHas}>
																{primaryHas ? <FiCheckCircle size={12} /> : <FiX size={12} />}
																{primaryHas ? 'Assigned' : 'Not assigned'}
															</CompareBadge>
														</CompareCell>
														<CompareCell>
															<CompareBadge $active={comparisonHas}>
																{comparisonHas ? <FiCheckCircle size={12} /> : <FiX size={12} />}
																{comparisonHas ? 'Assigned' : 'Not assigned'}
															</CompareBadge>
														</CompareCell>
													</tr>
												);
											})}
										</tbody>
									</CompareTable>
								) : (
									<p style={{ color: '#64748b', margin: 0 }}>
										No group memberships for either user.
									</p>
								)}
							</Section>

							<Section>
								<SectionHeader>
									<h2>
										<FiLock /> Authentication Methods
									</h2>
								</SectionHeader>
								{allAuthMethods.length ? (
									<CompareTable>
										<thead>
											<tr>
												<CompareHeaderCell>Method</CompareHeaderCell>
												<CompareHeaderCell>{userName}</CompareHeaderCell>
												<CompareHeaderCell>{comparisonUserName}</CompareHeaderCell>
											</tr>
										</thead>
										<tbody>
											{allAuthMethods.map((method) => {
												const primaryHas = authenticationMethodsDisplay.includes(method);
												const comparisonHas = comparisonAuthMethodsDisplay.includes(method);
												return (
													<tr key={method}>
														<CompareCell $emphasize>{method}</CompareCell>
														<CompareCell>
															<CompareBadge $active={primaryHas}>
																{primaryHas ? <FiCheckCircle size={12} /> : <FiX size={12} />}
																{primaryHas ? 'Available' : 'Unavailable'}
															</CompareBadge>
														</CompareCell>
														<CompareCell>
															<CompareBadge $active={comparisonHas}>
																{comparisonHas ? <FiCheckCircle size={12} /> : <FiX size={12} />}
																{comparisonHas ? 'Available' : 'Unavailable'}
															</CompareBadge>
														</CompareCell>
													</tr>
												);
											})}
										</tbody>
									</CompareTable>
								) : (
									<p style={{ color: '#64748b', margin: 0 }}>
										No authentication methods recorded for either user.
									</p>
								)}
							</Section>

							<Section>
								<SectionHeader>
									<h2>
										<FiCheckCircle /> Consent Records
									</h2>
								</SectionHeader>
								{allConsentLabels.length ? (
									<CompareTable>
										<thead>
											<tr>
												<CompareHeaderCell>Consent</CompareHeaderCell>
												<CompareHeaderCell>{userName}</CompareHeaderCell>
												<CompareHeaderCell>{comparisonUserName}</CompareHeaderCell>
											</tr>
										</thead>
										<tbody>
											{allConsentLabels.map((label) => {
												const primaryStatus = primaryConsentMap.get(label) ?? 'Not recorded';
												const comparisonStatus = comparisonConsentMap.get(label) ?? 'Not recorded';
												const primaryActive = isAffirmativeStatus(primaryStatus);
												const comparisonActive = isAffirmativeStatus(comparisonStatus);
												return (
													<tr key={label}>
														<CompareCell $emphasize>{label}</CompareCell>
														<CompareCell>
															<CompareBadge $active={primaryActive}>
																{primaryActive ? <FiCheckCircle size={12} /> : <FiX size={12} />}
																{primaryStatus}
															</CompareBadge>
														</CompareCell>
														<CompareCell>
															<CompareBadge $active={comparisonActive}>
																{comparisonActive ? <FiCheckCircle size={12} /> : <FiX size={12} />}
																{comparisonStatus}
															</CompareBadge>
														</CompareCell>
													</tr>
												);
											})}
										</tbody>
									</CompareTable>
								) : (
									<p style={{ color: '#64748b', margin: 0 }}>No consent records for either user.</p>
								)}
							</Section>
						</>
					)}
				</>
			)}

			{/* Server Error Modal */}
			{showServerErrorModal && (
				<ServerErrorModalOverlay onClick={() => setShowServerErrorModal(false)}>
					<ServerErrorModalContent onClick={(e) => e.stopPropagation()}>
						<ServerErrorModalTitle>
							<FiAlertTriangle size={28} style={{ color: '#dc2626' }} />
							Backend Server Not Running
						</ServerErrorModalTitle>
						<ServerErrorModalMessage>
							The backend server returned a 500 error, which usually means the server is not running
							or has crashed.
						</ServerErrorModalMessage>
						<ServerErrorModalInstructions>
							<strong>To fix this issue:</strong>
							<ol>
								<li>Open a new terminal window</li>
								<li>Navigate to the project directory</li>
								<li>
									Run: <code>./run.sh</code>
								</li>
								<li>Wait for the servers to start</li>
								<li>Try your request again</li>
							</ol>
						</ServerErrorModalInstructions>
						<ServerErrorModalActions>
							<ServerErrorModalButton onClick={() => setShowServerErrorModal(false)}>
								Close
							</ServerErrorModalButton>
						</ServerErrorModalActions>
					</ServerErrorModalContent>
				</ServerErrorModalOverlay>
			)}
		</PageContainer>
	);
};

export default PingOneUserProfile;
